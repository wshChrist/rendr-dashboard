"""
Gestionnaire pour les terminaux MT4/MT5
Gère la création des dossiers, copie de l'EA, lancement des terminaux
"""

import os
import shutil
import subprocess
import logging
import configparser
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class MTManager:
    def __init__(self, config):
        self.config = config
        self.terminals_base = Path(config.TERMINALS_BASE_PATH)
        self.terminals_base.mkdir(parents=True, exist_ok=True)

    def setup_account(self, account_data: Dict) -> bool:
        """
        Configure un terminal MT4/MT5 pour un compte donné
        Args:
            account_data: Dictionnaire avec les infos du compte
        Returns: True si succès
        """
        external_account_id = account_data.get('external_account_id')
        platform = account_data.get('platform')  # 'MT4' ou 'MT5'
        broker = account_data.get('broker')
        server = account_data.get('server')
        login = account_data.get('login')
        investor_password = account_data.get('investor_password')
        
        # Log de débogage pour voir toutes les données reçues
        logger.info(f"[DEBUG] Donnees du compte recues:")
        logger.info(f"   - external_account_id: {external_account_id}")
        logger.info(f"   - platform: {platform}")
        logger.info(f"   - broker: {broker}")
        logger.info(f"   - server: {server}")
        logger.info(f"   - login: {login}")
        logger.info(f"   - investor_password (longueur): {len(investor_password) if investor_password else 0} caracteres")
        logger.info(f"   - Toutes les cles dans account_data: {list(account_data.keys())}")

        if not all([external_account_id, platform, server, login, investor_password]):
            logger.error("Donnees de compte incompletes")
            return False

        try:
            # Déterminer les chemins selon la plateforme
            if platform == 'MT4':
                mt_path = Path(self.config.MT4_PATH)
                ea_source = Path(self.config.MT4_EA_PATH)
                terminal_dir = self.terminals_base / f"MT4-{external_account_id}"
                experts_dir = terminal_dir / "MQL4" / "Experts"
            elif platform == 'MT5':
                mt_path = Path(self.config.MT5_PATH)
                ea_source = Path(self.config.MT5_EA_PATH)
                terminal_dir = self.terminals_base / f"MT5-{external_account_id}"
                experts_dir = terminal_dir / "MQL5" / "Experts"
            else:
                logger.error(f"Plateforme non supportee: {platform}")
                return False

            # Vérifier que MT est installé
            if not mt_path.exists():
                logger.error(f"Terminal {platform} non trouve: {mt_path}")
                return False

            # Vérifier que l'EA existe
            if not ea_source.exists():
                logger.error(f"EA non trouve: {ea_source}")
                return False

            logger.info(f"Configuration du terminal {platform} pour {external_account_id}")

            # 1. Créer/copier le dossier terminal
            if terminal_dir.exists():
                logger.warning(f"Dossier terminal existe deja: {terminal_dir}")
            else:
                # Copier le dossier de base du terminal
                logger.info(f"Copie du terminal depuis {mt_path}")
                shutil.copytree(mt_path, terminal_dir, ignore=shutil.ignore_patterns('*.log', '*.tmp'))

            # 2. Créer le dossier Experts s'il n'existe pas
            experts_dir.mkdir(parents=True, exist_ok=True)

            # 3. Copier l'EA
            ea_dest = experts_dir / ea_source.name
            logger.info(f"Copie de l'EA vers {ea_dest}")
            shutil.copy2(ea_source, ea_dest)

            # 4. Créer le fichier de configuration pour l'EA
            self._create_ea_config(terminal_dir, external_account_id, account_data)

            # 5. Créer le fichier de configuration MT4/MT5 pour la connexion automatique
            # Log des valeurs pour débogage
            logger.info(f"[DEBUG] Valeurs avant creation du fichier de config:")
            logger.info(f"   - Login: {login}")
            logger.info(f"   - Password (longueur): {len(investor_password) if investor_password else 0} caracteres")
            logger.info(f"   - Server: {server}")
            self._create_terminal_config(terminal_dir, platform, login, investor_password, server)

            # 6. Lancer le terminal avec les paramètres de connexion
            success = self._launch_terminal(
                terminal_dir,
                platform,
                login,
                investor_password,
                server
            )

            if success:
                logger.info(f"Terminal {platform} lance avec succes pour {external_account_id}")
                return True
            else:
                return False

        except Exception as e:
            logger.error(f"Erreur lors de la configuration: {str(e)}")
            return False

    def _create_ea_config(self, terminal_dir: Path, external_account_id: str, account_data: Dict):
        """Crée un fichier de configuration pour l'EA avec les paramètres nécessaires"""
        config_file = terminal_dir / "rendr_ea_config.ini"
        config = configparser.ConfigParser()

        # URL pour l'enregistrement du compte (l'EA doit d'abord s'enregistrer)
        register_url = f"{self.config.API_URL}/api/trades/register"
        # URL pour l'envoi des trades (après enregistrement)
        trades_url = f"{self.config.API_URL}/api/trades"

        config['EA'] = {
            'external_account_id': external_account_id,
            'register_url': register_url,
            'trades_url': trades_url,
            'api_secret': external_account_id  # Utiliser external_account_id comme secret pour l'instant
        }

        with open(config_file, 'w') as f:
            config.write(f)

        logger.info(f"Fichier de config EA cree: {config_file}")
        logger.info(f"  - Register URL: {register_url}")
        logger.info(f"  - Trades URL: {trades_url}")

    def _create_terminal_config(
        self,
        terminal_dir: Path,
        platform: str,
        login: str,
        password: str,
        server: str
    ):
        """Crée un fichier start.ini pour la connexion automatique MT4/MT5"""
        if platform not in ['MT4', 'MT5']:
            logger.warning(f"Plateforme {platform} non supportee pour la config")
            return

        # Vérifier que les paramètres ne sont pas None ou vides
        if not login:
            logger.error("Login est vide ou None")
            return
        if not password:
            logger.error("Password est vide ou None")
            return
        if not server:
            logger.error("Server est vide ou None")
            return

        # Log des valeurs reçues dans la fonction
        logger.info(f"[DEBUG] Dans _create_terminal_config:")
        logger.info(f"   - Login reçu: '{login}'")
        logger.info(f"   - Password reçu (longueur): {len(password) if password else 0} caracteres")
        logger.info(f"   - Server reçu: '{server}'")

        # Créer le dossier config s'il n'existe pas
        config_dir = terminal_dir / "config"
        config_dir.mkdir(exist_ok=True)
        
        # Créer le fichier start.ini dans le dossier config selon la documentation officielle MT4
        # Format: Login=xxx\nPassword=xxx\nServer=xxx
        # Documentation: https://www.metatrader4.com/fr/trading-platform/help/service/start_conf_file
        config_file = config_dir / "start.ini"
        
        # S'assurer que les valeurs ne contiennent pas de caractères problématiques
        login_clean = str(login).strip()
        password_clean = str(password).strip()
        server_clean = str(server).strip()
        
        config_content = f"""Login={login_clean}
Password={password_clean}
Server={server_clean}
"""
        
        with open(config_file, 'w', encoding='utf-8') as f:
            f.write(config_content)

        logger.info(f"[OK] Fichier start.ini cree: {config_file}")
        logger.info(f"   - Login: {login_clean}")
        logger.info(f"   - Server: {server_clean}")
        
        # Lire le fichier créé pour vérification
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                content_read = f.read()
                logger.info(f"[DEBUG] Contenu du fichier cree:")
                logger.info(f"{content_read}")
        except Exception as e:
            logger.warning(f"Impossible de lire le fichier pour verification: {e}")

    def _launch_terminal(
        self,
        terminal_dir: Path,
        platform: str,
        login: str,
        password: str,
        server: str
    ) -> bool:
        """
        Lance le terminal MT4/MT5 avec les paramètres de connexion
        Utilise start.ini selon la documentation officielle MT4
        Documentation: https://www.metatrader4.com/fr/trading-platform/help/service/start_conf_file
        """
        try:
            if platform == 'MT4':
                exe_name = "terminal.exe"
            elif platform == 'MT5':
                exe_name = "terminal64.exe"
            else:
                return False

            exe_path = terminal_dir / exe_name

            if not exe_path.exists():
                logger.error(f"Executable non trouve: {exe_path}")
                return False

            # Utiliser start.ini selon la documentation officielle MT4
            # Le fichier doit être dans config/start.ini
            # Syntaxe: terminal.exe config\start.ini
            config_file = terminal_dir / "config" / "start.ini"
            
            # Vérifier que le fichier de config existe
            if not config_file.exists():
                logger.error(f"Fichier start.ini manquant: {config_file}")
                return False
            
            # Utiliser la syntaxe officielle: terminal.exe config\start.ini
            # Le chemin relatif depuis le répertoire du terminal
            config_relative_path = "config\\start.ini"
            
            if platform == 'MT4':
                # MT4: utiliser la syntaxe officielle terminal.exe config\start.ini
                args = [
                    str(exe_path),
                    config_relative_path
                ]
            elif platform == 'MT5':
                # MT5: utiliser la syntaxe officielle terminal64.exe config\start.ini
                args = [
                    str(exe_path),
                    config_relative_path
                ]
            else:
                return False

            logger.info(f"[LANCEMENT] Terminal {platform}")
            logger.info(f"   - Executable: {exe_path}")
            logger.info(f"   - Config: {config_file}")
            logger.info(f"   - Chemin relatif: {config_relative_path}")
            logger.info(f"   - Commande complete: {' '.join(args)}")

            # Lancer en arrière-plan
            # Note: Ne pas utiliser CREATE_NO_WINDOW pour voir si MT4 se connecte
            process = subprocess.Popen(
                args,
                cwd=str(terminal_dir)
            )

            # Attendre un peu pour vérifier que le processus a démarré
            import time
            time.sleep(3)  # Augmenter le délai pour laisser MT4 se connecter
            
            # Vérifier que le processus est toujours en cours d'exécution
            if process.poll() is not None:
                logger.error(f"Le terminal s'est arrete immediatement apres le lancement (code: {process.returncode})")
                return False

            logger.info(f"Terminal lance avec succes (PID: {process.pid})")
            return True

        except Exception as e:
            import traceback
            logger.error("=" * 60)
            logger.error(f"[ERREUR] Erreur lors du lancement du terminal {platform}")
            logger.error(f"   Message: {str(e)}")
            logger.error(f"   Type: {type(e).__name__}")
            logger.error(f"   Chemin: {exe_path}")
            logger.error(f"   Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 60)
            return False
