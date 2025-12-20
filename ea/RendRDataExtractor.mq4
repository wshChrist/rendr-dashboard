//+------------------------------------------------------------------+
//|                                        RendRDataExtractor.mq4    |
//|                        Expert Advisor pour RendR Platform        |
//|                  Extraction des données MT4 vers Supabase        |
//|                     via https://rendr-dashboard.vercel.app/      |
//+------------------------------------------------------------------+
#property copyright "RendR"
#property link      "https://rendr-dashboard.vercel.app"
#property version   "2.00"
#property strict

//--- Paramètres d'entrée
input string API_BASE_URL = "https://rendr-dashboard.vercel.app";  // URL de base du dashboard
input bool   EnableDebugLog = true;  // Activer les logs détaillés
input int    SendInterval = 60;  // Intervalle d'envoi des trades en secondes
input int    HistoryDepth = 1000;  // Nombre de trades historiques à synchroniser
input bool   SyncOnStartup = true;  // Synchroniser l'historique au démarrage

//--- Variables globales
datetime lastSendTime = 0;
bool isRegistered = false;
string externalAccountId = "";
string apiSecret = "";
int lastProcessedTicket = 0;  // Pour suivre les trades déjà envoyés
datetime lastHistorySync = 0;

//+------------------------------------------------------------------+
//| Fonction de logging pour debug                                   |
//+------------------------------------------------------------------+
void DebugLog(string location, string message, string data = "")
{
   if(!EnableDebugLog) return;
   
   // Construire le message de log
   string timestamp = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   string logEntry = StringFormat("[%s] [%s] %s", timestamp, location, message);
   if(StringLen(data) > 0)
      logEntry += " | Data: " + data;
   
   // Écrire dans le fichier
   string logPath = "RendR_DataExtractor.log";
   int fileHandle = FileOpen(logPath, FILE_WRITE|FILE_READ|FILE_TXT);
   if(fileHandle != INVALID_HANDLE)
   {
      FileSeek(fileHandle, 0, SEEK_END);
      FileWriteString(fileHandle, logEntry + "\n");
      FileClose(fileHandle);
   }
   
   // Afficher dans le journal
   Print(logEntry);
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
//| Convertir datetime en format ISO 8601                            |
//+------------------------------------------------------------------+
string DateTimeToISO(datetime dt)
{
   return TimeToString(dt, TIME_DATE|TIME_SECONDS);
}

//+------------------------------------------------------------------+
//| Calculer la signature HMAC SHA256                                |
//| Note: MQL4 ne supporte pas nativement HMAC. Cette implémentation |
//| est une approximation. Pour une sécurité complète, il faudrait   |
//| utiliser une DLL externe ou déléguer le calcul à l'API.          |
//| Pour l'instant, la route API n'exige pas de vérification stricte |
//| de la signature, donc cette fonction génère un hash basique.      |
//+------------------------------------------------------------------+
string CalculateHMAC(string data, string secret)
{
   // Mélanger les données avec le secret de manière simple
   // En production, utilisez une vraie implémentation HMAC-SHA256 via DLL
   string combined = data + secret + IntegerToString(TimeCurrent());
   string hash = "";
   
   // Générer un hash simple (non cryptographiquement sûr, mais suffisant pour l'instant)
   int len = StringLen(combined);
   for(int i = 0; i < len; i++)
   {
      int charCode = StringGetCharacter(combined, i);
      // Convertir en hexadécimal
      if(charCode < 16) hash += "0";
      hash += IntegerToString(charCode, 16);
   }
   
   // Limiter la longueur (HMAC-SHA256 produit 64 caractères hex)
   if(StringLen(hash) > 64)
      hash = StringSubstr(hash, 0, 64);
   
   return hash;
}

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   DebugLog("OnInit", "Initialisation de l'EA RendR Data Extractor", 
            StringFormat("Account=%d, Server=%s", AccountNumber(), AccountServer()));
   
   Print("========================================");
   Print("RendR Data Extractor EA - Initialisation");
   Print("Compte: ", AccountNumber());
   Print("Serveur: ", AccountServer());
   Print("URL API: ", API_BASE_URL);
   Print("========================================");
   
   // Enregistrer le compte auprès de l'API
   bool registerResult = RegisterAccount();
   
   if(registerResult)
   {
      Print("✅ Compte enregistré avec succès");
      isRegistered = true;
      
      // Synchroniser l'historique au démarrage si activé
      if(SyncOnStartup)
      {
         Print("Synchronisation de l'historique...");
         SyncTradeHistory();
      }
      
      return(INIT_SUCCEEDED);
   }
   else
   {
      Print("❌ Échec de l'enregistrement du compte");
      Print("⚠️  Vérifiez que le compte a été créé via le dashboard d'abord");
      return(INIT_FAILED);
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   DebugLog("OnDeinit", StringFormat("EA arrêté - Raison: %d", reason), "");
   Print("RendR Data Extractor EA - Arrêté");
}

//+------------------------------------------------------------------+
//| Expert tick function                                            |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!isRegistered) return;
   
   datetime currentTime = TimeCurrent();
   
   // Vérifier si on doit envoyer les nouveaux trades
   if(currentTime - lastSendTime >= SendInterval)
   {
      lastSendTime = currentTime;
      SendNewTrades();
   }
}

//+------------------------------------------------------------------+
//| Enregistrer le compte auprès de l'API                           |
//+------------------------------------------------------------------+
bool RegisterAccount()
{
   DebugLog("RegisterAccount", "Début enregistrement", 
            StringFormat("AccountNumber=%d, Server=%s", AccountNumber(), AccountServer()));
   
   // Construire le JSON d'enregistrement
   string json = "{";
   json += "\"account_number\": " + IntegerToString(AccountNumber()) + ",";
   json += "\"server\": \"" + JsonEscape(AccountServer()) + "\",";
   json += "\"platform\": \"MT4\"";
   json += "}";
   
   DebugLog("RegisterAccount", "JSON construit", json);
   
   // Construire l'URL d'enregistrement
   string url = API_BASE_URL;
   if(StringSubstr(url, StringLen(url) - 1) != "/")
      url += "/";
   url += "api/trades/register";
   
   DebugLog("RegisterAccount", "URL finale", url);
   
   // Envoyer la requête
   string response = SendHttpRequest("POST", url, json);
   
   if(StringLen(response) > 0)
   {
      DebugLog("RegisterAccount", "Réponse reçue", StringSubstr(response, 0, 500));
      
      // Extraire external_account_id et api_secret de la réponse
      // Format attendu: {"external_account_id":"...","api_secret":"..."}
      int idPos = StringFind(response, "\"external_account_id\"");
      int secretPos = StringFind(response, "\"api_secret\"");
      
      if(idPos >= 0)
      {
         // Extraire external_account_id
         int startPos = StringFind(response, ":", idPos) + 1;
         int endPos = StringFind(response, ",", startPos);
         if(endPos < 0) endPos = StringFind(response, "}", startPos);
         
         if(endPos > startPos)
         {
            externalAccountId = StringSubstr(response, startPos, endPos - startPos);
            StringReplace(externalAccountId, "\"", "");
            StringReplace(externalAccountId, " ", "");
            
            DebugLog("RegisterAccount", "external_account_id extrait", externalAccountId);
         }
      }
      
      if(secretPos >= 0)
      {
         // Extraire api_secret
         int startPos = StringFind(response, ":", secretPos) + 1;
         int endPos = StringFind(response, "}", startPos);
         
         if(endPos > startPos)
         {
            apiSecret = StringSubstr(response, startPos, endPos - startPos);
            StringReplace(apiSecret, "\"", "");
            StringReplace(apiSecret, " ", "");
            
            DebugLog("RegisterAccount", "api_secret extrait", StringSubstr(apiSecret, 0, 20) + "...");
         }
      }
      
      if(StringLen(externalAccountId) > 0)
      {
         Print("External Account ID: ", externalAccountId);
         return true;
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Envoyer les nouveaux trades fermés                              |
//+------------------------------------------------------------------+
void SendNewTrades()
{
   DebugLog("SendNewTrades", "Recherche de nouveaux trades", "");
   
   int sentCount = 0;
   
   // Parcourir l'historique pour trouver les nouveaux trades fermés
   for(int i = OrdersHistoryTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         // Ne traiter que les trades fermés (pas les ordres en attente)
         if(OrderType() == OP_BUY || OrderType() == OP_SELL)
         {
            int ticket = OrderTicket();
            
            // Vérifier si ce trade a déjà été envoyé
            if(ticket > lastProcessedTicket)
            {
               // Envoyer ce trade
               if(SendTrade(ticket))
               {
                  lastProcessedTicket = ticket;
                  sentCount++;
                  
                  // Limiter le nombre de trades envoyés par cycle
                  if(sentCount >= 10) break;
               }
            }
         }
      }
   }
   
   if(sentCount > 0)
   {
      DebugLog("SendNewTrades", StringFormat("%d nouveau(x) trade(s) envoyé(s)", sentCount), "");
      Print("✅ ", sentCount, " nouveau(x) trade(s) envoyé(s)");
   }
}

//+------------------------------------------------------------------+
//| Envoyer un trade spécifique                                      |
//+------------------------------------------------------------------+
bool SendTrade(int ticket)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET, MODE_HISTORY))
   {
      DebugLog("SendTrade", StringFormat("Impossible de sélectionner le ticket %d", ticket), "");
      return false;
   }
   
   // Construire le JSON du trade
   string json = "{";
   json += "\"external_account_id\": \"" + externalAccountId + "\",";
   json += "\"ticket\": " + IntegerToString(ticket) + ",";
   json += "\"symbol\": \"" + JsonEscape(OrderSymbol()) + "\",";
   json += "\"lots\": " + DoubleToString(OrderLots(), 2) + ",";
   json += "\"commission\": " + DoubleToString(OrderCommission(), 2) + ",";
   json += "\"swap\": " + DoubleToString(OrderSwap(), 2) + ",";
   json += "\"profit\": " + DoubleToString(OrderProfit(), 2) + ",";
   json += "\"open_time\": \"" + DateTimeToISO(OrderOpenTime()) + "\",";
   json += "\"close_time\": \"" + DateTimeToISO(OrderCloseTime()) + "\"";
   json += "}";
   
   // Construire le JSON sans signature pour calculer la signature
   string jsonWithoutSig = json;
   
   // Calculer la signature HMAC sur les données sans signature
   string signature = CalculateHMAC(jsonWithoutSig, apiSecret);
   
   // Ajouter la signature au JSON
   json = StringSubstr(json, 0, StringLen(json) - 1); // Enlever le }
   json += ",\"signature\": \"" + signature + "\"}";
   
   DebugLog("SendTrade", StringFormat("Envoi du trade %d", ticket), json);
   
   // Construire l'URL pour envoyer le trade
   string url = API_BASE_URL;
   if(StringSubstr(url, StringLen(url) - 1) != "/")
      url += "/";
   url += "api/trades";
   
   // Envoyer la requête
   string response = SendHttpRequest("POST", url, json);
   
   if(StringLen(response) > 0)
   {
      DebugLog("SendTrade", StringFormat("Réponse pour le ticket %d", ticket), 
               StringSubstr(response, 0, 200));
      
      // Vérifier si la réponse indique un succès
      if(StringFind(response, "success") >= 0 || StringFind(response, "enregistré") >= 0)
      {
         return true;
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Synchroniser l'historique complet                                |
//+------------------------------------------------------------------+
void SyncTradeHistory()
{
   DebugLog("SyncTradeHistory", "Synchronisation de l'historique complet", "");
   
   Print("=== Synchronisation de l'historique ===");
   int syncedCount = 0;
   int totalTrades = 0;
   
   // Parcourir l'historique
   for(int i = OrdersHistoryTotal() - 1; i >= 0 && totalTrades < HistoryDepth; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         // Ne traiter que les trades fermés
         if(OrderType() == OP_BUY || OrderType() == OP_SELL)
         {
            totalTrades++;
            int ticket = OrderTicket();
            
            // Envoyer ce trade (même s'il a déjà été envoyé, l'API gère les doublons)
            if(SendTrade(ticket))
            {
               syncedCount++;
               if(ticket > lastProcessedTicket)
                  lastProcessedTicket = ticket;
            }
            
            // Pause entre les envois pour ne pas surcharger le serveur
            Sleep(100);
         }
      }
   }
   
   Print(StringFormat("Synchronisation terminée: %d/%d trades envoyés", syncedCount, totalTrades));
   DebugLog("SyncTradeHistory", "Synchronisation terminée", 
            StringFormat("%d/%d trades envoyés", syncedCount, totalTrades));
}

//+------------------------------------------------------------------+
//| Envoyer une requête HTTP                                         |
//+------------------------------------------------------------------+
string SendHttpRequest(string method, string url, string data)
{
   DebugLog("SendHttpRequest", StringFormat("Requête %s vers %s", method, url), 
            StringFormat("Data length: %d", StringLen(data)));
   
   // Préparer les headers
   string headers = "Content-Type: application/json\r\n";
   headers += "X-Account-Number: " + IntegerToString(AccountNumber()) + "\r\n";
   
   // Convertir les données en tableau de char
   char post[], result[];
   int length = StringToCharArray(data, post, 0, WHOLE_ARRAY);
   if(length > 0 && post[length - 1] == 0)
   {
      ArrayResize(post, length - 1);
   }
   
   int timeout = 10000; // 10 secondes
   
   Print("🔍 Envoi de la requête vers: ", url);
   
   // Envoyer la requête
   int res = WebRequest(method, url, headers, timeout, post, result, headers);
   
   if(res == -1)
   {
      int error = GetLastError();
      DebugLog("SendHttpRequest", "Erreur WebRequest", StringFormat("Error code: %d", error));
      
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
         Print("   ", API_BASE_URL);
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
         Print("1. L'URL est correcte ? ", url);
         Print("2. Le dashboard est accessible ? Testez dans le navigateur: ", API_BASE_URL);
         Print("3. MetaTrader est lancé EN ADMINISTRATEUR ?");
         Print("4. L'URL EXACTE est dans la liste blanche ?");
         Print("5. Votre connexion internet fonctionne ?");
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
      DebugLog("SendHttpRequest", "Requête réussie", 
               StringFormat("HTTP code: %d, Response length: %d", res, StringLen(response)));
      
      if(EnableDebugLog)
      {
         Print("✅ Requête réussie (code HTTP: ", res, ")");
         if(StringLen(response) < 500)
            Print("Réponse: ", response);
      }
      return response;
   }
}

//+------------------------------------------------------------------+