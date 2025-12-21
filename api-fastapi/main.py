"""
API FastAPI intermédiaire entre MetaTrader et Next.js
Cette API sert de proxy pour éviter les problèmes de connexion WebRequest dans MetaTrader
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import httpx
import logging
import json as json_lib

# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="RendR API Proxy", version="1.0.0")

# Middleware pour logger toutes les requêtes
@app.middleware("http")
async def log_requests(request: Request, call_next):
    log_path = ".cursor/debug.log"
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            log_entry = {
                "location": "FastAPI:middleware:request",
                "message": "Requête HTTP reçue",
                "data": f"method={request.method},url={str(request.url)},client={request.client.host if request.client else 'unknown'}",
                "timestamp": datetime.now().isoformat(),
                "hypothesisId": "E"
            }
            f.write(json_lib.dumps(log_entry) + "\n")
    except Exception as e:
        logger.error(f"Erreur écriture log: {e}")
    
    response = await call_next(request)
    
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            log_entry = {
                "location": "FastAPI:middleware:response",
                "message": "Réponse HTTP envoyée",
                "data": f"status_code={response.status_code}",
                "timestamp": datetime.now().isoformat(),
                "hypothesisId": "E"
            }
            f.write(json_lib.dumps(log_entry) + "\n")
    except Exception as e:
        logger.error(f"Erreur écriture log réponse: {e}")
    
    return response

# Configuration CORS pour permettre les requêtes depuis MetaTrader
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL du serveur Next.js
NEXTJS_URL = "http://127.0.0.1:3000"

# Client HTTP pour communiquer avec Next.js
client = httpx.AsyncClient(timeout=30.0)


class RegisterRequest(BaseModel):
    account_number: int
    server: str
    platform: str


class TradeRequest(BaseModel):
    external_account_id: str
    ticket: int
    symbol: str
    type: str
    lots: float
    open_price: float
    close_price: Optional[float] = None
    commission: float
    swap: float
    profit: float
    open_time: str
    close_time: Optional[str] = None
    signature: Optional[str] = None


@app.get("/")
async def root():
    """Endpoint de test pour vérifier que l'API fonctionne"""
    return {
        "status": "ok",
        "message": "RendR FastAPI Proxy est opérationnel",
        "nextjs_url": NEXTJS_URL
    }


@app.get("/health")
async def health():
    """Vérification de santé de l'API"""
    try:
        # Tester la connexion avec Next.js
        response = await client.get(f"{NEXTJS_URL}/api/test")
        nextjs_status = "connected" if response.status_code == 200 else "disconnected"
    except Exception as e:
        nextjs_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "fastapi": "running",
        "nextjs": nextjs_status
    }


@app.post("/api/trades/register")
async def register_account(request: RegisterRequest):
    """
    Enregistrement d'un compte de trading
    Reçoit les données de MetaTrader et les transmet à Next.js
    """
    log_path = ".cursor/debug.log"
    
    # #region agent log
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            log_entry = {
                "location": "FastAPI:register_account:entry",
                "message": "Requête POST /api/trades/register reçue",
                "data": f"account_number={request.account_number},server={request.server},platform={request.platform}",
                "timestamp": datetime.now().isoformat(),
                "hypothesisId": "E"
            }
            f.write(json_lib.dumps(log_entry) + "\n")
    except Exception as e:
        logger.error(f"Erreur écriture log entry: {e}")
    # #endregion
    
    logger.info("=" * 60)
    logger.info("=== REQUÊTE D'ENREGISTREMENT REÇUE DEPUIS METATRADER ===")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info(f"Account Number: {request.account_number}")
    logger.info(f"Server: {request.server}")
    logger.info(f"Platform: {request.platform}")
    logger.info("=" * 60)
    
    try:
        # Transmettre la requête à Next.js
        response = await client.post(
            f"{NEXTJS_URL}/api/trades/register",
            json={
                "account_number": request.account_number,
                "server": request.server,
                "platform": request.platform
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # #region agent log
            try:
                with open(log_path, "a", encoding="utf-8") as f:
                    log_entry = {
                        "location": "FastAPI:register_account:success",
                        "message": "Enregistrement réussi",
                        "data": json_lib.dumps(data),
                        "timestamp": datetime.now().isoformat(),
                        "hypothesisId": "E"
                    }
                    f.write(json_lib.dumps(log_entry) + "\n")
            except:
                pass
            # #endregion
            
            logger.info(f"Enregistrement réussi: {data}")
            return data
        else:
            # #region agent log
            try:
                with open(log_path, "a", encoding="utf-8") as f:
                    log_entry = {
                        "location": "FastAPI:register_account:nextjs_error",
                        "message": "Erreur Next.js",
                        "data": f"status_code={response.status_code},text={response.text}",
                        "timestamp": datetime.now().isoformat(),
                        "hypothesisId": "E"
                    }
                    f.write(json_lib.dumps(log_entry) + "\n")
            except:
                pass
            # #endregion
            
            logger.error(f"Erreur Next.js: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Erreur Next.js: {response.text}"
            )
    
    except httpx.RequestError as e:
        # #region agent log
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                log_entry = {
                    "location": "FastAPI:register_account:connection_error",
                    "message": "Erreur connexion Next.js",
                    "data": f"error={str(e)}",
                    "timestamp": datetime.now().isoformat(),
                    "hypothesisId": "E"
                }
                f.write(json_lib.dumps(log_entry) + "\n")
        except:
            pass
        # #endregion
        
        logger.error(f"Erreur de connexion à Next.js: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Impossible de se connecter à Next.js: {str(e)}"
        )
    except Exception as e:
        # #region agent log
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                log_entry = {
                    "location": "FastAPI:register_account:unexpected_error",
                    "message": "Erreur inattendue",
                    "data": f"error={str(e)}",
                    "timestamp": datetime.now().isoformat(),
                    "hypothesisId": "E"
                }
                f.write(json_lib.dumps(log_entry) + "\n")
        except:
            pass
        # #endregion
        
        logger.error(f"Erreur inattendue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/trades")
async def submit_trade(request: TradeRequest):
    """
    Soumission d'un trade
    Reçoit les données de MetaTrader et les transmet à Next.js
    """
    logger.info(f"Requête de trade reçue: ticket={request.ticket}, symbol={request.symbol}")
    
    try:
        # Préparer les données pour Next.js
        trade_data = {
            "external_account_id": request.external_account_id,
            "ticket": request.ticket,
            "symbol": request.symbol,
            "type": request.type,
            "lots": request.lots,
            "open_price": request.open_price,
            "close_price": request.close_price,
            "commission": request.commission,
            "swap": request.swap,
            "profit": request.profit,
            "open_time": request.open_time,
            "close_time": request.close_time,
        }
        
        if request.signature:
            trade_data["signature"] = request.signature
        
        # Transmettre la requête à Next.js
        response = await client.post(
            f"{NEXTJS_URL}/api/trades",
            json=trade_data
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Trade soumis avec succès: {data}")
            return data
        else:
            logger.error(f"Erreur Next.js: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Erreur Next.js: {response.text}"
            )
    
    except httpx.RequestError as e:
        logger.error(f"Erreur de connexion à Next.js: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Impossible de se connecter à Next.js: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/test")
async def test(request: Request):
    """Endpoint de test simple"""
    log_path = ".cursor/debug.log"
    
    # #region agent log
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            log_entry = {
                "location": "FastAPI:test:entry",
                "message": "Requête GET /api/test reçue",
                "data": f"method={request.method},url={str(request.url)},client={request.client.host if request.client else 'unknown'}",
                "timestamp": datetime.now().isoformat(),
                "hypothesisId": "E"
            }
            f.write(json_lib.dumps(log_entry) + "\n")
    except Exception as e:
        logger.error(f"Erreur écriture log test: {e}")
    # #endregion
    
    logger.info(f"=== REQUÊTE TEST REÇUE ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"URL: {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    logger.info(f"Client: {request.client}")
    
    return {
        "status": "ok",
        "message": "FastAPI proxy fonctionne",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    import sys
    # Utiliser le port 8001 si 8000 est occupé, ou le port spécifié en argument
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8001
    # Écouter sur toutes les interfaces pour permettre les connexions depuis l'IP locale
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


