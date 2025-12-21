"""
Client pour communiquer avec l'API backend RendR
"""

import requests
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SupabaseClient:
    def __init__(self, config):
        self.api_url = config.API_URL
        self.api_key = config.VPS_API_KEY
        self.headers = {
            'X-VPS-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }

    def get_pending_accounts(self) -> List[Dict]:
        """
        Récupère la liste des comptes en attente de configuration
        Returns: Liste des comptes avec status = 'pending_vps_setup'
        """
        try:
            url = f"{self.api_url}/api/vps/pending-accounts"
            response = requests.get(url, headers=self.headers, timeout=30)

            if response.status_code == 200:
                accounts = response.json()
                logger.info(f"Récupération de {len(accounts)} compte(s) en attente")
                return accounts
            else:
                logger.error(f"Erreur API: {response.status_code} - {response.text}")
                return []

        except requests.exceptions.RequestException as e:
            import traceback
            logger.error("=" * 60)
            logger.error(f"❌ Erreur de connexion à l'API lors de la récupération des comptes")
            logger.error(f"   URL: {url}")
            logger.error(f"   Message: {str(e)}")
            logger.error(f"   Type: {type(e).__name__}")
            logger.error(f"   Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 60)
            return []

    def update_account_status(
        self,
        external_account_id: str,
        status: str,
        error_message: Optional[str] = None
    ) -> bool:
        """
        Met à jour le statut d'un compte de trading
        Args:
            external_account_id: UUID du compte
            status: 'connected' ou 'error'
            error_message: Message d'erreur optionnel
        Returns: True si succès
        """
        try:
            url = f"{self.api_url}/api/vps/account-status"
            payload = {
                'external_account_id': external_account_id,
                'status': status
            }

            if error_message:
                payload['error_message'] = error_message

            response = requests.post(url, json=payload, headers=self.headers, timeout=30)

            if response.status_code == 200:
                logger.info(f"Statut mis à jour pour {external_account_id}: {status}")
                return True
            else:
                logger.error(f"Erreur lors de la mise à jour: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            import traceback
            logger.error("=" * 60)
            logger.error(f"❌ Erreur de connexion à l'API lors de la mise à jour du statut")
            logger.error(f"   URL: {url}")
            logger.error(f"   Compte: {external_account_id}")
            logger.error(f"   Statut: {status}")
            logger.error(f"   Message: {str(e)}")
            logger.error(f"   Type: {type(e).__name__}")
            logger.error(f"   Traceback:\n{traceback.format_exc()}")
            logger.error("=" * 60)
            return False

