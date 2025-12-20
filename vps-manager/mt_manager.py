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

        if not all([external_account_id, platform, server, login, investor_password]):
            logger.error("Données de compte incomplètes")
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
                logger.error(f"Plateforme non supportée: {platform}")
                return False

            # Vérifier que MT est installé
            if not mt_path.exists():
                logger.error(f"Terminal {platform} non trouvé: {mt_path}")
                return False

            # Vérifier que l'EA existe
            if not ea_source.exists():
                logger.error(f"EA non trouvé: {ea_source}")
                return False

            logger.info(f"Configuration du terminal {platform} pour {external_account_id}")

            # 1. Créer/copier le dossier terminal
            if terminal_dir.exists():
                logger.warning(f"Dossier terminal existe déjà: {terminal_dir}")
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

            # 5. Lancer le terminal avec les paramètres de connexion
            success = self._launch_terminal(
                terminal_dir,
                platform,
                login,
                investor_password,
                server
            )

            if success:
                logger.info(f"Terminal {platform} lancé avec succès pour {external_account_id}")
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

        config['EA'] = {
            'external_account_id': external_account_id,
            'api_url': f"{self.config.API_URL}/api/trades",
            'api_secret': external_account_id  # Utiliser external_account_id comme secret pour l'instant
        }

        with open(config_file, 'w') as f:
            config.write(f)

        logger.info(f"Fichier de config EA créé: {config_file}")

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
                logger.error(f"Exécutable non trouvé: {exe_path}")
                return False

            # Arguments de ligne de commande pour auto-connexion
            args = [
                str(exe_path),
                f"/login:{login}",
                f"/password:{password}",
                f"/server:{server}",
                "/portable"
            ]

            logger.info(f"Lancement du terminal: {' '.join(args)}")

            # Lancer en arrière-plan
            subprocess.Popen(
                args,
                cwd=str(terminal_dir),
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )

            return True

        except Exception as e:
            logger.error(f"Erreur lors du lancement du terminal: {str(e)}")
            return False
