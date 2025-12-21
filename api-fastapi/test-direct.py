"""
Test direct pour vérifier que FastAPI fonctionne
"""
import requests

# Test FastAPI
try:
    response = requests.get("http://127.0.0.1:8000/api/test", timeout=5)
    print(f"✅ FastAPI répond : {response.status_code}")
    print(f"Réponse : {response.json()}")
except Exception as e:
    print(f"❌ FastAPI ne répond pas : {e}")

# Test Next.js
try:
    response = requests.get("http://127.0.0.1:3000/api/test", timeout=5)
    print(f"✅ Next.js répond : {response.status_code}")
    print(f"Réponse : {response.json()}")
except Exception as e:
    print(f"❌ Next.js ne répond pas : {e}")


