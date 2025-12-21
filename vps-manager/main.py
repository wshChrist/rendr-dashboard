"""
VPS Manager - Script principal pour gérer les terminaux MT4/MT5
Polling périodique des comptes en attente et configuration automatique
"""

import time
import logging
import sys
import os
from typing import List, Dict
from config import Config
from supabase_client import SupabaseClient
from mt_manager import MTManager

# Créer le dossier logs s'il n'existe pas (AVANT la configuration du logging)
os.makedirs('logs', exist_ok=True)

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/vps-manager.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


class VPSManager:
    def __init__(self):
        self.config = Config()
        self.api_client = SupabaseClient(self.config)
        self.mt_manager = MTManager(self.config)
        logger.info("VPS Manager initialisé")

    def process_pending_accounts(self):
        """Récupère et traite les comptes en attente de configuration"""
        try:
            logger.info("=" * 60)
            logger.info("Vérification des comptes en attente...")
            pending_accounts = self.api_client.get_pending_accounts()

            if not pending_accounts:
                logger.debug("Aucun compte en attente")
                return

            logger.info(f"📋 {len(pending_accounts)} compte(s) en attente de configuration")
            logger.info("=" * 60)

            for account in pending_accounts:
                external_account_id = account.get('external_account_id')
                broker = account.get('broker', 'Unknown')
                login = account.get('login', 'Unknown')
                logger.info(f"Traitement du compte: {external_account_id} (Broker: {broker}, Login: {login})")

                try:
                    # Configurer le terminal MT4/MT5
                    success = self.mt_manager.setup_account(account)

                    if success:
                        # Attendre un peu pour que le terminal se connecte
                        import time
                        logger.info(f"Attente de la connexion du terminal pour {external_account_id}...")
                        time.sleep(5)  # Donner le temps au terminal de se connecter
                        
                        # Mettre à jour le statut à 'connected'
                        # Note: Le statut sera mis à jour à 'error' par l'EA si la connexion échoue
                        self.api_client.update_account_status(
                            external_account_id,
                            'connected',
                            None
                        )
                        logger.info(f"✅ Compte {external_account_id} configuré et terminal lancé avec succès")
                        logger.info(f"   L'EA va maintenant tenter de se connecter et enregistrer le compte")
                    else:
                        # Mettre à jour le statut à 'error'
                        error_msg = "Échec de la configuration du terminal MT4/MT5"
                        self.api_client.update_account_status(
                            external_account_id,
                            'error',
                            error_msg
                        )
                        logger.error(f"❌ Échec de la configuration pour {external_account_id}: {error_msg}")

                except Exception as e:
                    import traceback
                    error_msg = f"Erreur lors du traitement: {str(e)}"
                    logger.error("=" * 60)
                    logger.error(f"❌ Erreur lors du traitement de {external_account_id}")
                    logger.error(f"   Message: {error_msg}")
                    logger.error(f"   Type: {type(e).__name__}")
                    logger.error(f"   Traceback:\n{traceback.format_exc()}")
                    logger.error("=" * 60)
                    
                    # Limiter la longueur du message d'erreur pour Supabase
                    max_error_length = 500
                    if len(error_msg) > max_error_length:
                        error_msg = error_msg[:max_error_length] + "..."
                    
                    self.api_client.update_account_status(
                        external_account_id,
                        'error',
                        error_msg
                    )

        except Exception as e:
            logger.error("=" * 60)
            logger.error(f"❌ Erreur lors de la récupération des comptes: {str(e)}")
            logger.error(f"   Type d'erreur: {type(e).__name__}")
            import traceback
            logger.error(f"   Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 60)

    def run(self):
        """Boucle principale du VPS Manager"""
        logger.info("Démarrage du VPS Manager")
        logger.info(f"Intervalle de polling: {self.config.POLLING_INTERVAL} secondes")

        while True:
            try:
                self.process_pending_accounts()
                time.sleep(self.config.POLLING_INTERVAL)
            except KeyboardInterrupt:
                logger.info("=" * 60)
                logger.info("🛑 Arrêt du VPS Manager demandé par l'utilisateur")
                logger.info("=" * 60)
                break
            except Exception as e:
                import traceback
                logger.error("=" * 60)
                logger.error(f"❌ Erreur dans la boucle principale: {str(e)}")
                logger.error(f"   Type: {type(e).__name__}")
                logger.error(f"   Traceback:\n{traceback.format_exc()}")
                logger.error("=" * 60)
                logger.info(f"⏳ Attente de {self.config.POLLING_INTERVAL} secondes avant la prochaine tentative...")
                time.sleep(self.config.POLLING_INTERVAL)


if __name__ == '__main__':
    manager = VPSManager()
    manager.run()

