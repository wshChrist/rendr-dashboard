//+------------------------------------------------------------------+
//|                                                      RendR.mq4    |
//|                        Expert Advisor pour RendR Platform        |
//+------------------------------------------------------------------+
#property copyright "RendR"
#property link      "https://rendr.app"
#property version   "1.00"
#property strict

//--- Paramètres d'entrée
input string API_URL = "http://192.168.1.142:8002/api/trades/register";  // URL complète (comme RendrAccountMonitor)
input string API_KEY = "";  // Clé API (optionnel)
input bool   EnableDebugLog = true;  // Activer les logs détaillés
input int    SendInterval = 60;  // Intervalle d'envoi des trades en secondes

//--- Variables globales
datetime lastSendTime = 0;
bool isRegistered = false;
string externalAccountId = "";

//+------------------------------------------------------------------+
//| Fonction de logging pour debug                                   |
//+------------------------------------------------------------------+
void DebugLog(string location, string message, string data)
{
   // Utiliser le dossier Files de MetaTrader (plus fiable)
   string logPath = "RendR_debug.log";
   int fileHandle = FileOpen(logPath, FILE_WRITE|FILE_READ|FILE_TXT);
   if(fileHandle != INVALID_HANDLE)
   {
      FileSeek(fileHandle, 0, SEEK_END);
      // Échapper les guillemets dans les données pour JSON valide
      string escapedData = data;
      StringReplace(escapedData, "\"", "\\\"");
      StringReplace(escapedData, "\n", "\\n");
      StringReplace(escapedData, "\r", "\\r");
      StringReplace(escapedData, "\\", "\\\\");
      string json = "{\"location\":\"" + location + "\",\"message\":\"" + message + "\",\"data\":\"" + escapedData + "\",\"timestamp\":" + IntegerToString(TimeCurrent()) + "}";
      FileWriteString(fileHandle, json + "\n");
      FileClose(fileHandle);
   }
   
   // Aussi essayer le chemin absolu pour le workspace
   string absPath = "D:\\Travail\\Travaux\\RendR Dashboard\\next-shadcn-dashboard-starter\\.cursor\\debug.log";
   fileHandle = FileOpen(absPath, FILE_WRITE|FILE_READ|FILE_TXT);
   if(fileHandle != INVALID_HANDLE)
   {
      FileSeek(fileHandle, 0, SEEK_END);
      string escapedData = data;
      StringReplace(escapedData, "\"", "\\\"");
      StringReplace(escapedData, "\n", "\\n");
      StringReplace(escapedData, "\r", "\\r");
      StringReplace(escapedData, "\\", "\\\\");
      string json = "{\"location\":\"" + location + "\",\"message\":\"" + message + "\",\"data\":\"" + escapedData + "\",\"timestamp\":" + IntegerToString(TimeCurrent()) + "}";
      FileWriteString(fileHandle, json + "\n");
      FileClose(fileHandle);
   }
}

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
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // #region agent log
   DebugLog("OnInit:entry", "EA Initialisation", "AccountNumber=" + IntegerToString(AccountNumber()) + ",Server=" + AccountServer() + ",API_URL=" + API_URL);
   // #endregion
   
   Print("========================================");
   Print("RendR EA - Initialisation");
   Print("Compte: ", AccountNumber());
   Print("Serveur: ", AccountServer());
   Print("URL API: ", API_URL);
   Print("========================================");
   
   // Enregistrer le compte auprès de l'API
   bool registerResult = RegisterAccount();
   
   // #region agent log
   DebugLog("OnInit:after_register", "Résultat enregistrement", "success=" + (registerResult ? "true" : "false") + ",isRegistered=" + (isRegistered ? "true" : "false"));
   // #endregion
   
   if(registerResult)
   {
      Print("✅ Compte enregistré avec succès");
      isRegistered = true;
      return(INIT_SUCCEEDED);
   }
   else
   {
      Print("❌ Échec de l'enregistrement du compte");
      return(INIT_FAILED);
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("RendR EA - Arrêté");
}

//+------------------------------------------------------------------+
//| Expert tick function                                            |
//+------------------------------------------------------------------+
void OnTick()
{
   // Vérifier si on doit envoyer les trades
   datetime currentTime = TimeCurrent();
   if(currentTime - lastSendTime >= SendInterval)
   {
      lastSendTime = currentTime;
      
      if(isRegistered)
      {
         SendTrades();
      }
   }
}

//+------------------------------------------------------------------+
//| Enregistrer le compte auprès de l'API                           |
//+------------------------------------------------------------------+
bool RegisterAccount()
{
   // #region agent log
   DebugLog("RegisterAccount:entry", "Début enregistrement", "AccountNumber=" + IntegerToString(AccountNumber()));
   // #endregion
   
   // Construire le JSON d'enregistrement
   string json = "{";
   json += "\"account_number\": " + IntegerToString(AccountNumber()) + ",";
   json += "\"server\": \"" + JsonEscape(AccountServer()) + "\",";
   json += "\"platform\": \"MT4\"";
   json += "}";
   
   // #region agent log
   DebugLog("RegisterAccount:json_built", "JSON construit", "json=" + json);
   // #endregion
   
   if(EnableDebugLog)
   {
      Print("JSON d'enregistrement: ", json);
   }
   
   // Utiliser l'URL complète directement (EXACTEMENT comme RendrAccountMonitor ligne 366)
   string url = API_URL;
   
   // #region agent log
   DebugLog("RegisterAccount:url_final", "URL finale", "url=" + url);
   // #endregion
   
   // #region agent log
   DebugLog("RegisterAccount:url_built", "URL construite", "url=" + url);
   // #endregion
   
   // Envoyer la requête
   string response = SendHttpRequest("POST", url, json);
   
   // #region agent log
   DebugLog("RegisterAccount:after_request", "Réponse reçue", "response_length=" + IntegerToString(StringLen(response)) + ",response=" + StringSubstr(response, 0, 200));
   // #endregion
   
   if(StringLen(response) > 0)
   {
      // #region agent log
      DebugLog("RegisterAccount:response_not_empty", "Réponse non vide", "response=" + StringSubstr(response, 0, 500));
      // #endregion
      
      if(EnableDebugLog)
      {
         Print("Réponse serveur: ", response);
      }
      
      // Extraire external_account_id de la réponse (simplifié)
      // En production, utiliser un parser JSON
      int foundPos = StringFind(response, "external_account_id");
      
      // #region agent log
      DebugLog("RegisterAccount:check_id", "Recherche external_account_id", "foundPos=" + IntegerToString(foundPos));
      // #endregion
      
      if(foundPos >= 0)
      {
         // Extraire l'ID (simplifié - à améliorer avec un vrai parser JSON)
         int startPos = StringFind(response, "\"external_account_id\"");
         if(startPos >= 0)
         {
            startPos = StringFind(response, ":", startPos) + 1;
            int endPos = StringFind(response, ",", startPos);
            if(endPos < 0) endPos = StringFind(response, "}", startPos);
            
            // #region agent log
            DebugLog("RegisterAccount:extract_id", "Extraction ID", "startPos=" + IntegerToString(startPos) + ",endPos=" + IntegerToString(endPos));
            // #endregion
            
            if(endPos > startPos)
            {
               externalAccountId = StringSubstr(response, startPos, endPos - startPos);
               StringReplace(externalAccountId, "\"", "");
               StringReplace(externalAccountId, " ", "");
               
               // #region agent log
               DebugLog("RegisterAccount:id_extracted", "ID extrait", "externalAccountId=" + externalAccountId);
               // #endregion
               
               Print("External Account ID: ", externalAccountId);
               return true;
            }
         }
      }
      else
      {
         // #region agent log
         DebugLog("RegisterAccount:id_not_found", "ID non trouvé dans réponse", "response=" + StringSubstr(response, 0, 300));
         // #endregion
      }
   }
   else
   {
      // #region agent log
      DebugLog("RegisterAccount:empty_response", "Réponse vide", "");
      // #endregion
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Envoyer les trades à l'API                                      |
//+------------------------------------------------------------------+
void SendTrades()
{
   // Récupérer les positions ouvertes
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         // Construire le JSON du trade
         string json = "{";
         json += "\"external_account_id\": \"" + externalAccountId + "\",";
         json += "\"ticket\": " + IntegerToString(OrderTicket()) + ",";
         json += "\"symbol\": \"" + JsonEscape(OrderSymbol()) + "\",";
         json += "\"type\": \"" + GetOrderTypeString(OrderType()) + "\",";
         json += "\"lots\": " + DoubleToString(OrderLots(), 2) + ",";
         json += "\"open_price\": " + DoubleToString(OrderOpenPrice(), Digits) + ",";
         json += "\"close_price\": null,";
         json += "\"commission\": " + DoubleToString(OrderCommission(), 2) + ",";
         json += "\"swap\": " + DoubleToString(OrderSwap(), 2) + ",";
         json += "\"profit\": " + DoubleToString(OrderProfit(), 2) + ",";
         json += "\"open_time\": \"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\",";
         json += "\"close_time\": null";
         json += "}";
         
         // Construire l'URL pour les trades (utiliser l'URL de base)
         // Extraire l'URL de base depuis API_URL (enlever /api/trades/register)
         string baseUrl = API_URL;
         int pos = StringFind(baseUrl, "/api/trades/register");
         if(pos >= 0)
         {
            baseUrl = StringSubstr(baseUrl, 0, pos);
         }
         string url = baseUrl;
         if(StringSubstr(url, StringLen(url) - 1) != "/")
            url += "/";
         url += "api/trades";
         
         // Envoyer la requête
         string response = SendHttpRequest("POST", url, json);
         
         if(EnableDebugLog && StringLen(response) > 0)
         {
            Print("Trade envoyé - Ticket: ", OrderTicket(), " - Réponse: ", response);
         }
      }
   }
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
      case OP_BUYLIMIT: return "BUY_LIMIT";
      case OP_SELLLIMIT: return "SELL_LIMIT";
      case OP_BUYSTOP: return "BUY_STOP";
      case OP_SELLSTOP: return "SELL_STOP";
      default: return "UNKNOWN";
   }
}

//+------------------------------------------------------------------+
//| Envoyer une requête HTTP                                         |
//+------------------------------------------------------------------+
string SendHttpRequest(string method, string url, string data)
{
   // #region agent log
   DebugLog("SendHttpRequest:entry", "Début requête HTTP", "method=" + method + ",url=" + url + ",data_length=" + IntegerToString(StringLen(data)));
   // #endregion
   
   // Préparer les headers
   string headers = "Content-Type: application/json\r\n";
   if(StringLen(API_KEY) > 0)
   {
      headers += "Authorization: Bearer " + API_KEY + "\r\n";
   }
   headers += "X-Account-Number: " + IntegerToString(AccountNumber()) + "\r\n";
   
   // #region agent log
   DebugLog("SendHttpRequest:headers_built", "Headers construits", "headers=" + StringSubstr(headers, 0, 200));
   // #endregion
   
   // Convertir les données en tableau de char
   char post[], result[];
   int length = StringToCharArray(data, post, 0, WHOLE_ARRAY);
   if(length > 0 && post[length - 1] == 0)
   {
      ArrayResize(post, length - 1);
   }
   
   // #region agent log
   DebugLog("SendHttpRequest:before_webrequest", "Avant WebRequest", "post_length=" + IntegerToString(length) + ",timeout=5000");
   // #endregion
   
   int timeout = 5000; // 5 secondes
   
   // Vérifier que l'URL est bien formée AVANT WebRequest
   // #region agent log
   DebugLog("SendHttpRequest:url_final_check", "Vérification URL finale", "url=" + url + ",url_length=" + IntegerToString(StringLen(url)));
   // #endregion
   
   Print("🔍 Tentative de connexion à: ", url);
   Print("🔍 Vérifiez que cette URL EXACTE est dans la liste blanche MetaTrader !");
   
   // Envoyer la requête
   int res = WebRequest(method, url, headers, timeout, post, result, headers);
   
   // #region agent log
   DebugLog("SendHttpRequest:after_webrequest", "Après WebRequest", "res=" + IntegerToString(res) + ",GetLastError=" + IntegerToString(GetLastError()));
   // #endregion
   
   if(res == -1)
   {
      int error = GetLastError();
      
      // #region agent log
      DebugLog("SendHttpRequest:error", "Erreur WebRequest", "error_code=" + IntegerToString(error) + ",url=" + url + ",method=" + method);
      // #endregion
      
      Print("═══════════════════════════════════════════════════════════");
      Print("❌ Erreur HTTP: ", error);
      Print("URL tentée: ", url);
      Print("═══════════════════════════════════════════════════════════");
      
      if(error == 4060)
      {
         Print("⚠️  ERREUR 4060: URL non autorisée");
         Print("═══════════════════════════════════════════════════════════");
         Print("SOLUTION:");
         Print("1. Ouvrez MetaTrader");
         Print("2. Outils > Options > Expert Advisors");
         Print("3. Cocher: 'Autoriser l'accès WebRequest pour les URLs listées'");
         Print("4. Ajouter cette URL EXACTE:");
         Print("   ", url);
         Print("5. Cliquer OK");
         Print("6. FERMER COMPLÈTEMENT MetaTrader");
         Print("7. RELANCER MetaTrader EN ADMINISTRATEUR");
         Print("═══════════════════════════════════════════════════════════");
      }
      else if(error == 5200)
      {
         Print("⚠️  ERREUR 5200: Impossible de se connecter");
         Print("═══════════════════════════════════════════════════════════");
         Print("VÉRIFICATIONS:");
         // Extraire l'URL de base pour le test
         string baseUrl = url;
         int pos = StringFind(baseUrl, "/api/");
         if(pos >= 0)
         {
            baseUrl = StringSubstr(baseUrl, 0, pos);
         }
         Print("1. FastAPI est démarré ? Testez dans le navigateur: ", baseUrl, "/api/test");
         Print("2. L'URL est correcte ? ", url);
         Print("3. MetaTrader est lancé EN ADMINISTRATEUR ?");
         Print("4. L'URL EXACTE est dans la liste blanche ?");
         Print("5. Le firewall Windows autorise le port 8002 ?");
         Print("═══════════════════════════════════════════════════════════");
      }
      else
      {
         Print("Code d'erreur: ", error);
         Print("Consultez la documentation MetaTrader pour ce code d'erreur");
      }
      
      return "";
   }
   else
   {
      string response = CharArrayToString(result);
      
      // #region agent log
      DebugLog("SendHttpRequest:success", "Requête réussie", "http_code=" + IntegerToString(res) + ",response_length=" + IntegerToString(StringLen(response)) + ",response=" + StringSubstr(response, 0, 300));
      // #endregion
      
      if(EnableDebugLog)
      {
         Print("✅ Requête réussie (code: ", res, ")");
      }
      return response;
   }
}



