//+------------------------------------------------------------------+
//|                                      RendrAccountMonitor.mq4     |
//|                                  Expert Advisor pour MT4         |
//|                          Vérification connexions et historique   |
//+------------------------------------------------------------------+
#property copyright "Rendr"
#property link      ""
#property version   "1.00"
#property strict

//--- Paramètres d'entrée
input string API_URL = "https://app.rendr.com/api/mt4/account-data"; // URL d'ingestion interne Rendr
input string API_KEY = ""; // Token MT4_WORKER_TOKEN (usage interne uniquement)
input int    CheckInterval = 60; // Intervalle de vérification en secondes
input bool   EnableHTTP = true; // Activer l'envoi HTTP
input bool   VerboseLog = true; // Logs détaillés
input int    HistoryDepth = 1000; // Nombre de trades à récupérer de l'historique

//--- Variables globales
datetime lastCheckTime = 0;
datetime lastHistorySync = 0;
bool isConnected = false;
int totalTradesChecked = 0;

//+------------------------------------------------------------------+
//| Helper pour échapper les chaînes JSON                            |
//+------------------------------------------------------------------+
string JsonEscape(string value)
{
   string escaped = value;
   StringReplace(escaped, "\\", "\\\\");
   StringReplace(escaped, "\"", "\\\"");
   StringReplace(escaped, "\r", "\\r");
   StringReplace(escaped, "\n", "\\n");
   StringReplace(escaped, "\t", "\\t");
   return escaped;
}

//+------------------------------------------------------------------+
//| Fonction d'initialisation                                        |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("========================================");
   Print("Rendr Account Monitor EA - Initialisé");
   Print("Compte: ", AccountNumber());
   Print("Serveur: ", AccountServer());
   Print("Broker: ", AccountCompany());
   Print("========================================");
   
   // Vérification initiale
   CheckConnection();
   SyncAccountHistory();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Fonction de désinitialisation                                    |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Rendr Account Monitor EA - Arrêté");
   if(reason == REASON_PROGRAM)
      Print("Arrêté manuellement par l'utilisateur");
   else if(reason == REASON_REMOVE)
      Print("EA retiré du graphique");
   else if(reason == REASON_RECOMPILE)
      Print("EA recompilé");
   else if(reason == REASON_CHARTCHANGE)
      Print("Graphique changé");
   else if(reason == REASON_CHARTCLOSE)
      Print("Graphique fermé");
   else if(reason == REASON_PARAMETERS)
      Print("Paramètres modifiés");
   else if(reason == REASON_ACCOUNT)
      Print("Compte changé");
   else if(reason == REASON_TEMPLATE)
      Print("Template appliqué");
   else if(reason == REASON_INITFAILED)
      Print("Échec d'initialisation");
   else if(reason == REASON_CLOSE)
      Print("Terminal fermé");
}

//+------------------------------------------------------------------+
//| Fonction principale (appelée à chaque tick)                     |
//+------------------------------------------------------------------+
void OnTick()
{
   datetime currentTime = TimeCurrent();
   
   // Vérification périodique de la connexion
   if(currentTime - lastCheckTime >= CheckInterval)
   {
      lastCheckTime = currentTime;
      CheckConnection();
      
      // Synchronisation de l'historique toutes les 5 minutes
      if(currentTime - lastHistorySync >= 300)
      {
         lastHistorySync = currentTime;
         SyncAccountHistory();
      }
   }
}

//+------------------------------------------------------------------+
//| Vérification de la connexion au serveur                         |
//+------------------------------------------------------------------+
void CheckConnection()
{
   bool wasConnected = isConnected;
   isConnected = IsConnected();
   
   if(VerboseLog)
   {
      bool tradeAllowed = (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) != 0);
      Print("=== Vérification de la connexion ===");
      Print("Statut connexion: ", (isConnected ? "CONNECTÉ" : "DÉCONNECTÉ"));
      Print("État: ", tradeAllowed ? "Trading autorisé" : "Trading bloqué");
   }
   
   // Détection de changement d'état
   if(wasConnected != isConnected)
   {
      string message = isConnected ? "Connexion établie" : "Connexion perdue";
      Print("⚠ ALERTE: ", message);
      Alert("Rendr EA: ", message);
      
      // Envoyer notification si HTTP activé
      if(EnableHTTP && isConnected)
      {
         SendConnectionStatus(isConnected);
      }
   }
   
   // Informations détaillées du compte
   if(VerboseLog)
   {
      PrintAccountInfo();
   }
}

//+------------------------------------------------------------------+
//| Affichage des informations du compte                              |
//+------------------------------------------------------------------+
void PrintAccountInfo()
{
   Print("--- Informations du compte ---");
   Print("Numéro de compte: ", AccountNumber());
   Print("Nom du compte: ", AccountName());
   Print("Serveur: ", AccountServer());
   Print("Broker: ", AccountCompany());
   Print("Balance: ", AccountBalance());
   Print("Équité: ", AccountEquity());
   Print("Marge utilisée: ", AccountMargin());
   Print("Marge libre: ", AccountFreeMargin());
   Print("Profit: ", AccountProfit());
   Print("Leverage: 1:", AccountLeverage());
   Print("Devise: ", AccountCurrency());
   Print("Trading autorisé: ", IsTradeAllowed() ? "Oui" : "Non");
   Print("Experts activés: ", IsExpertEnabled() ? "Oui" : "Non");
}

//+------------------------------------------------------------------+
//| Synchronisation de l'historique complet                          |
//+------------------------------------------------------------------+
void SyncAccountHistory()
{
   Print("=== Synchronisation de l'historique ===");
   
   // Récupérer les informations des positions ouvertes
   int openPositions = CountOpenPositions();
   Print("Positions ouvertes: ", openPositions);
   
   // Récupérer l'historique des trades
   int totalHistoryTrades = GetHistoryTradesCount();
   Print("Total trades dans l'historique: ", totalHistoryTrades);
   
   // Collecter toutes les données
   string jsonData = BuildAccountDataJSON(openPositions, totalHistoryTrades);
   
   if(VerboseLog)
   {
      Print("Données collectées: ", jsonData);
   }
   
   // Envoyer via HTTP si activé
   if(EnableHTTP)
   {
      SendAccountData(jsonData);
   }
   else
   {
      Print("HTTP désactivé - Données non envoyées");
   }
}

//+------------------------------------------------------------------+
//| Compter les positions ouvertes                                  |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol()) // Filtrer par symbole actuel, ou retirer cette ligne pour tous
            count++;
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Récupérer le nombre total de trades dans l'historique           |
//+------------------------------------------------------------------+
int GetHistoryTradesCount()
{
   int count = 0;
   datetime startDate = 0; // Depuis le début
   datetime endDate = TimeCurrent();
   
   // Compter les ordres dans l'historique
   for(int i = OrdersHistoryTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         datetime orderTime = OrderOpenTime();
         if(orderTime >= startDate && orderTime <= endDate)
         {
            count++;
         }
      }
   }
   
   return count;
}

//+------------------------------------------------------------------+
//| Construire le JSON avec toutes les données du compte            |
//+------------------------------------------------------------------+
string BuildAccountDataJSON(int openPositions, int historyTrades)
{
   string json = "{";
   
   // Informations du compte
   json += "\"accountInfo\": {";
   json += "\"accountNumber\": " + IntegerToString(AccountNumber()) + ",";
   json += "\"accountName\": \"" + JsonEscape(AccountName()) + "\",";
   json += "\"server\": \"" + JsonEscape(AccountServer()) + "\",";
   json += "\"broker\": \"" + JsonEscape(AccountCompany()) + "\",";
   json += "\"currency\": \"" + JsonEscape(AccountCurrency()) + "\",";
   json += "\"leverage\": " + IntegerToString(AccountLeverage()) + ",";
   json += "\"balance\": " + DoubleToString(AccountBalance(), 2) + ",";
   json += "\"equity\": " + DoubleToString(AccountEquity(), 2) + ",";
   json += "\"margin\": " + DoubleToString(AccountMargin(), 2) + ",";
   json += "\"freeMargin\": " + DoubleToString(AccountFreeMargin(), 2) + ",";
   json += "\"profit\": " + DoubleToString(AccountProfit(), 2) + ",";
   json += "\"isConnected\": " + (IsConnected() ? "true" : "false") + ",";
   json += "\"tradingAllowed\": " + (IsTradeAllowed() ? "true" : "false");
   json += "},";
   
   // Positions ouvertes
   json += "\"openPositions\": [";
   bool firstPosition = true;
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(!firstPosition) json += ",";
         json += "{";
         json += "\"ticket\": " + IntegerToString(OrderTicket()) + ",";
         json += "\"symbol\": \"" + JsonEscape(OrderSymbol()) + "\",";
         json += "\"type\": \"" + JsonEscape(GetOrderTypeString(OrderType())) + "\",";
         json += "\"lots\": " + DoubleToString(OrderLots(), 2) + ",";
         json += "\"openPrice\": " + DoubleToString(OrderOpenPrice(), Digits) + ",";
         json += "\"currentPrice\": " + DoubleToString((OrderType() == OP_BUY) ? Bid : Ask, Digits) + ",";
         json += "\"stopLoss\": " + DoubleToString(OrderStopLoss(), Digits) + ",";
         json += "\"takeProfit\": " + DoubleToString(OrderTakeProfit(), Digits) + ",";
         json += "\"profit\": " + DoubleToString(OrderProfit(), 2) + ",";
         json += "\"swap\": " + DoubleToString(OrderSwap(), 2) + ",";
         json += "\"openTime\": \"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
         json += "\"comment\": \"" + JsonEscape(OrderComment()) + "\"";
         json += "}";
         firstPosition = false;
      }
   }
   json += "],";
   
   // Historique des trades
   json += "\"tradeHistory\": [";
   firstPosition = true;
   int historyCount = 0;
   for(int i = OrdersHistoryTotal() - 1; i >= 0 && historyCount < HistoryDepth; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(!firstPosition) json += ",";
         json += "{";
         json += "\"ticket\": " + IntegerToString(OrderTicket()) + ",";
         json += "\"symbol\": \"" + JsonEscape(OrderSymbol()) + "\",";
         json += "\"type\": \"" + JsonEscape(GetOrderTypeString(OrderType())) + "\",";
         json += "\"lots\": " + DoubleToString(OrderLots(), 2) + ",";
         json += "\"openPrice\": " + DoubleToString(OrderOpenPrice(), Digits) + ",";
         json += "\"closePrice\": " + DoubleToString(OrderClosePrice(), Digits) + ",";
         json += "\"stopLoss\": " + DoubleToString(OrderStopLoss(), Digits) + ",";
         json += "\"takeProfit\": " + DoubleToString(OrderTakeProfit(), Digits) + ",";
         json += "\"profit\": " + DoubleToString(OrderProfit(), 2) + ",";
         json += "\"swap\": " + DoubleToString(OrderSwap(), 2) + ",";
         json += "\"commission\": " + DoubleToString(OrderCommission(), 2) + ",";
         json += "\"openTime\": \"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
         json += "\"closeTime\": \"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\",";
         json += "\"comment\": \"" + JsonEscape(OrderComment()) + "\"";
         json += "}";
         firstPosition = false;
         historyCount++;
      }
   }
   json += "],";
   
   // Statistiques du compte
   json += "\"statistics\": {";
   json += "\"openPositionsCount\": " + IntegerToString(openPositions) + ",";
   json += "\"historyTradesCount\": " + IntegerToString(historyTrades) + ",";
   json += "\"timestamp\": \"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Obtenir le type d'ordre en string                                |
//+------------------------------------------------------------------+
string GetOrderTypeString(int orderType)
{
   switch(orderType)
   {
      case OP_BUY: return "BUY";
      case OP_SELL: return "SELL";
      case OP_BUYLIMIT: return "BUY LIMIT";
      case OP_SELLLIMIT: return "SELL LIMIT";
      case OP_BUYSTOP: return "BUY STOP";
      case OP_SELLSTOP: return "SELL STOP";
      default: return "UNKNOWN";
   }
}

//+------------------------------------------------------------------+
//| Envoyer les données du compte via HTTP                           |
//+------------------------------------------------------------------+
void SendAccountData(string jsonData)
{
   string headers = "Content-Type: application/json\r\n";
   if(StringLen(API_KEY) > 0)
   {
      headers += "Authorization: Bearer " + API_KEY + "\r\n";
   }
   headers += "X-Account-Number: " + IntegerToString(AccountNumber()) + "\r\n";
   
   char post[], result[];
   string url = API_URL;
   
   // Convertir le JSON en tableau de char sans le terminateur nul final
   int length = StringToCharArray(jsonData, post, 0, WHOLE_ARRAY);
   if(length > 0 && post[length - 1] == 0)
   {
      ArrayResize(post, length - 1);
   }
   
   int timeout = 5000; // 5 secondes
   int res = WebRequest("POST", url, headers, timeout, post, result, headers);
   
   if(res == -1)
   {
      int error = GetLastError();
      Print("❌ Erreur HTTP: ", error);
      if(error == 4060)
         Print("⚠️  URL non autorisée. Ajoutez l'URL dans les paramètres du terminal: Outils -> Options -> Onglet 'Expert Advisors' -> Autoriser les URL WebRequest");
      else
         Print("Détails: ", ErrorDescription(error));
   }
   else
   {
      Print("✅ Données envoyées avec succès (code: ", res, ")");
      if(VerboseLog)
      {
         string response = CharArrayToString(result);
         Print("Réponse serveur: ", response);
      }
   }
}

//+------------------------------------------------------------------+
//| Envoyer le statut de connexion                                   |
//+------------------------------------------------------------------+
void SendConnectionStatus(bool connected)
{
   string json = "{";
   json += "\"accountNumber\": " + IntegerToString(AccountNumber()) + ",";
   json += "\"isConnected\": " + (connected ? "true" : "false") + ",";
   json += "\"timestamp\": \"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\"";
   json += "}";
   
   SendAccountData(json);
}

//+------------------------------------------------------------------+
//| Obtenir la description d'une erreur                              |
//+------------------------------------------------------------------+
string ErrorDescription(int errorCode)
{
   string error_string;
   switch(errorCode)
   {
      case 0: error_string = "Aucune erreur"; break;
      case 1: error_string = "Aucune erreur, mais le résultat est inconnu"; break;
      case 2: error_string = "Erreur commune"; break;
      case 3: error_string = "Paramètres invalides"; break;
      case 4: error_string = "Trade server occupé"; break;
      case 5: error_string = "Ancienne version du terminal client"; break;
      case 6: error_string = "Pas de connexion avec le trade server"; break;
      case 7: error_string = "Pas de permissions"; break;
      case 8: error_string = "Requête trop fréquente"; break;
      case 9: error_string = "Opération de moulage non autorisée"; break;
      case 64: error_string = "Compte bloqué"; break;
      case 65: error_string = "Invalid account"; break;
      case 128: error_string = "Trade timeout"; break;
      case 129: error_string = "Prix invalide"; break;
      case 130: error_string = "Stops invalides"; break;
      case 131: error_string = "Volume invalide"; break;
      case 132: error_string = "Market fermé"; break;
      case 133: error_string = "Trade désactivé"; break;
      case 134: error_string = "Pas assez d'argent"; break;
      case 135: error_string = "Prix changé"; break;
      case 136: error_string = "Pas de connexion"; break;
      case 137: error_string = "Broker occupé"; break;
      case 138: error_string = "Requête rejetée"; break;
      case 139: error_string = "Requête rejetée par le validateur de requête"; break;
      case 140: error_string = "Trade autorisé seulement"; break;
      case 141: error_string = "Trop de requêtes"; break;
      case 145: error_string = "Modification rejetée car l'ordre est trop proche du marché et un slippage maximum est défini"; break;
      case 146: error_string = "Contexte de trading ne permettant pas"; break;
      case 147: error_string = "Expirations rejetées par le broker"; break;
      case 148: error_string = "Nombre de pending orders atteint la limite autorisée par le broker"; break;
      case 4000: error_string = "Aucune erreur"; break;
      case 4001: error_string = "Fonction incorrecte"; break;
      case 4002: error_string = "Variable d'indicateur incorrecte"; break;
      case 4003: error_string = "Aucun graphique"; break;
      case 4004: error_string = "Fonction non supportée"; break;
      case 4005: error_string = "Index invalide"; break;
      case 4006: error_string = "Aucun historique"; break;
      case 4007: error_string = "Pas assez de mémoire"; break;
      case 4008: error_string = "Variable invalide dans la fonction OnCalculate"; break;
      case 4009: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4010: error_string = "Chaîne vide"; break;
      case 4011: error_string = "Variable invalide"; break;
      case 4012: error_string = "Fonction de données du marché non disponible"; break;
      case 4013: error_string = "Indicateur personnalisé non trouvé"; break;
      case 4014: error_string = "Aucun paramètre d'entrée"; break;
      case 4015: error_string = "Variable invalide de type"; break;
      case 4016: error_string = "Aucun tableau"; break;
      case 4017: error_string = "Paramètres de chaîne incorrects"; break;
      case 4018: error_string = "Fonction de chaîne incorrecte"; break;
      case 4019: error_string = "Fonction de tableau incorrecte"; break;
      case 4020: error_string = "Transmission de paramètres incorrects"; break;
      case 4021: error_string = "Fonction mathématique incorrecte"; break;
      case 4022: error_string = "Fonction globale non autorisée"; break;
      case 4023: error_string = "Fonction globale non autorisée dans le testeur"; break;
      case 4024: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4025: error_string = "Fonction interdite"; break;
      case 4026: error_string = "Fonction interdite dans le testeur"; break;
      case 4027: error_string = "Fonction non autorisée dans les indicateurs"; break;
      case 4028: error_string = "Impossible de créer le fichier"; break;
      case 4029: error_string = "Erreur d'accès au fichier"; break;
      case 4030: error_string = "Fichier introuvable"; break;
      case 4031: error_string = "Mauvaise taille de fichier"; break;
      case 4032: error_string = "Erreur de lecture du fichier"; break;
      case 4033: error_string = "Erreur d'écriture du fichier"; break;
      case 4034: error_string = "Fichier binaire, lecture impossible"; break;
      case 4035: error_string = "File est binaire, écriture impossible"; break;
      case 4036: error_string = "Fichier texte, lecture impossible"; break;
      case 4037: error_string = "Fichier texte, écriture impossible"; break;
      case 4038: error_string = "Fin du fichier atteinte"; break;
      case 4039: error_string = "Erreur de position de fichier"; break;
      case 4040: error_string = "Array déjà trié"; break;
      case 4041: error_string = "Fichier introuvable"; break;
      case 4042: error_string = "Mauvaise taille de fichier"; break;
      case 4050: error_string = "Objet invalide"; break;
      case 4051: error_string = "Objet non trouvé"; break;
      case 4052: error_string = "Objet existe déjà"; break;
      case 4053: error_string = "Propriété d'objet invalide"; break;
      case 4054: error_string = "Objet non sélectionné"; break;
      case 4055: error_string = "Objet non créé"; break;
      case 4056: error_string = "Propriété d'objet non trouvée"; break;
      case 4057: error_string = "Propriété d'objet non supportée"; break;
      case 4058: error_string = "Objet parent non trouvé"; break;
      case 4059: error_string = "Type de fenêtre invalide"; break;
      case 4060: error_string = "URL invalide"; break;
      case 4061: error_string = "Fichier invalide"; break;
      case 4062: error_string = "Requête invalide"; break;
      case 4063: error_string = "Requête HTTP invalide"; break;
      case 4064: error_string = "Timout HTTP dépassé"; break;
      case 4065: error_string = "Fichier invalide"; break;
      case 4066: error_string = "Erreur lors de l'écriture du fichier"; break;
      case 4067: error_string = "Fichier invalide"; break;
      case 4068: error_string = "Fichier invalide"; break;
      case 4069: error_string = "Erreur lors de la lecture du fichier"; break;
      case 4070: error_string = "Fichier invalide"; break;
      case 4071: error_string = "Fichier invalide"; break;
      case 4072: error_string = "Erreur lors de la lecture du fichier"; break;
      case 4073: error_string = "Fichier invalide"; break;
      case 4099: error_string = "Fin du fichier atteinte"; break;
      case 4100: error_string = "Chaîne trop longue"; break;
      case 4101: error_string = "Array invalide"; break;
      case 4102: error_string = "Tableau invalide"; break;
      case 4103: error_string = "Valeur incorrecte de fonction de chaîne"; break;
      case 4104: error_string = "Valeur incorrecte de fonction mathématique"; break;
      case 4105: error_string = "Valeur incorrecte de fonction d'array"; break;
      case 4106: error_string = "Valeur incorrecte de fonction de date/heure"; break;
      case 4107: error_string = "Valeur incorrecte de fonction de fichier"; break;
      case 4108: error_string = "Valeur incorrecte de fonction de variable globale"; break;
      case 4109: error_string = "Fonction de fonction client invalide"; break;
      case 4110: error_string = "Fonction de fonction client invalide"; break;
      case 4111: error_string = "Mail non envoyé"; break;
      case 4112: error_string = "String dans la fonction SendMail invalide"; break;
      case 4113: error_string = "String dans la fonction SendNotification invalide"; break;
      case 4114: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4115: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4116: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4117: error_string = "Erreur de synchronisation"; break;
      case 4118: error_string = "Variable globale non trouvée"; break;
      case 4119: error_string = "Fonction non autorisée dans le testeur"; break;
      case 4120: error_string = "Fonction non autorisée dans le testeur"; break;
      case 5001: error_string = "Variable trop longue"; break;
      case 5002: error_string = "Variable trop longue"; break;
      case 5003: error_string = "Variable trop longue"; break;
      case 5004: error_string = "Variable trop longue"; break;
      case 5005: error_string = "Variable trop longue"; break;
      default: error_string = "Erreur inconnue: " + IntegerToString(errorCode);
   }
   return error_string;
}
//+------------------------------------------------------------------+













