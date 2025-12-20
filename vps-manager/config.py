"""
Configuration du VPS Manager
"""

import os
import configparser
from pathlib import Path


class Config:
    def __init__(self, config_file: str = 'config.ini'):
        # Valeurs par défaut
        self.API_URL = os.getenv('API_URL', 'https://api.rendr.app')
        self.VPS_API_KEY = os.getenv('VPS_API_KEY', '')
        self.POLLING_INTERVAL = int(os.getenv('POLLING_INTERVAL', '30'))

        # Chemins MT4/MT5
        self.MT4_PATH = os.getenv('MT4_PATH', 'C:\\Program Files\\MetaTrader 4')
        self.MT5_PATH = os.getenv('MT5_PATH', 'C:\\Program Files\\MetaTrader 5')

        # Chemin vers l'EA
        self.MT4_EA_PATH = os.getenv('MT4_EA_PATH', 'C:\\RendR\\EA\\RendR.mq4')
        self.MT5_EA_PATH = os.getenv('MT5_EA_PATH', 'C:\\RendR\\EA\\RendR.mq5')

        # Dossier de base pour les terminaux
        self.TERMINALS_BASE_PATH = os.getenv('TERMINALS_BASE_PATH', 'C:\\MT_Terminals')

        # Charger depuis config.ini si présent
        if os.path.exists(config_file):
            self._load_from_file(config_file)

        # Vérifications
        if not self.VPS_API_KEY:
            raise ValueError("VPS_API_KEY doit être défini (env ou config.ini)")

    def _load_from_file(self, config_file: str):
        """Charge la configuration depuis un fichier INI"""
        config = configparser.ConfigParser()
        config.read(config_file)

        if 'api' in config:
            self.API_URL = config['api'].get('url', self.API_URL)
            self.VPS_API_KEY = config['api'].get('api_key', self.VPS_API_KEY)
            self.POLLING_INTERVAL = config['api'].getint('polling_interval', self.POLLING_INTERVAL)

        if 'mt4' in config:
            self.MT4_PATH = config['mt4'].get('path', self.MT4_PATH)
            self.MT4_EA_PATH = config['mt4'].get('ea_path', self.MT4_EA_PATH)

        if 'mt5' in config:
            self.MT5_PATH = config['mt5'].get('path', self.MT5_PATH)
            self.MT5_EA_PATH = config['mt5'].get('ea_path', self.MT5_EA_PATH)

        if 'paths' in config:
            self.TERMINALS_BASE_PATH = config['paths'].get('terminals_base', self.TERMINALS_BASE_PATH)
