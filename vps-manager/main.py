"""
VPS Manager - Script principal pour gérer les terminaux MT4/MT5
Polling périodique des comptes en attente et configuration automatique
"""

import time
import logging
import sys
from typing import List, Dict
from config import Config
from supabase_client import SupabaseClient
from mt_manager import MTManager

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
            logger.info("Vérification des comptes en attente...")
            pending_accounts = self.api_client.get_pending_accounts()

            if not pending_accounts:
                logger.debug("Aucun compte en attente")
                return

            logger.info(f"{len(pending_accounts)} compte(s) en attente de configuration")

            for account in pending_accounts:
                external_account_id = account.get('external_account_id')
                logger.info(f"Traitement du compte: {external_account_id}")

                try:
                    # Configurer le terminal MT4/MT5
                    success = self.mt_manager.setup_account(account)

                    if success:
                        # Mettre à jour le statut à 'connected'
                        self.api_client.update_account_status(
                            external_account_id,
                            'connected',
                            None
                        )
                        logger.info(f"Compte {external_account_id} configuré avec succès")
                    else:
                        # Mettre à jour le statut à 'error'
                        error_msg = "Échec de la configuration du terminal"
                        self.api_client.update_account_status(
                            external_account_id,
                            'error',
                            error_msg
                        )
                        logger.error(f"Échec de la configuration pour {external_account_id}")

                except Exception as e:
                    logger.error(f"Erreur lors du traitement de {external_account_id}: {str(e)}")
                    self.api_client.update_account_status(
                        external_account_id,
                        'error',
                        str(e)
                    )

        except Exception as e:
            logger.error(f"Erreur lors de la récupération des comptes: {str(e)}")

    def run(self):
        """Boucle principale du VPS Manager"""
        logger.info("Démarrage du VPS Manager")
        logger.info(f"Intervalle de polling: {self.config.POLLING_INTERVAL} secondes")

        while True:
            try:
                self.process_pending_accounts()
                time.sleep(self.config.POLLING_INTERVAL)
            except KeyboardInterrupt:
                logger.info("Arrêt du VPS Manager demandé")
                break
            except Exception as e:
                logger.error(f"Erreur dans la boucle principale: {str(e)}")
                time.sleep(self.config.POLLING_INTERVAL)


if __name__ == '__main__':
    # Créer le dossier logs s'il n'existe pas
    import os
    os.makedirs('logs', exist_ok=True)

    manager = VPSManager()
    manager.run()
