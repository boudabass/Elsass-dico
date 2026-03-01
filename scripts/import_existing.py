import os
import json
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Utilisation du Service Role pour contourner RLS si nécessaire

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erreur : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante.")
    exit(1)

BASE_DIR = "Dictionnaire"

def transform_entry(entry):
    """Transforme une entrée JSON au format du schéma SQL cible."""
    is_expression = entry.get("type") in ["expression_figee", "expression"]
    source_field = "expression" if is_expression else "mot"
    
    transformed = {
        "id": entry.get("id"),
        source_field: entry.get("francais"),
        "article": entry.get("article", ""),
        "traductions": entry.get("traductions", []),
        "contexte": entry.get("contexte", ""),
        "tags": entry.get("tags", []),
        "source_ligne": entry.get("source", {}).get("ligne", ""),
        "source_index": entry.get("source", {}).get("index", 0)
    }
    return transformed, is_expression

def import_file(file_path):
    """Lit et importe un fichier JSON."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        mots_to_insert = []
        expressions_to_insert = []
        
        for entry in data:
            transformed, is_expression = transform_entry(entry)
            if is_expression:
                expressions_to_insert.append(transformed)
            else:
                mots_to_insert.append(transformed)
                
        # Import par lots (batch) pour performance
        if mots_to_insert:
            upsert_supabase("mots_fr_als", mots_to_insert)
        if expressions_to_insert:
            upsert_supabase("expressions_fr_als", expressions_to_insert)
            
    except Exception as e:
        print(f"Erreur lors de l'import de {file_path}: {e}")

def upsert_supabase(table, data):
    """Envoie les données à Supabase via PostgREST."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Upsert basé sur l'ID
    }
    
    # Découpage en lots de 100 pour éviter les timeouts
    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        response = requests.post(url, headers=headers, json=batch)
        if response.status_code not in [200, 201]:
            print(f"Erreur d'insertion dans {table}: {response.status_code} - {response.text}")
        else:
            print(f"Importé {len(batch)} entrées dans {table} ({i+len(batch)}/{len(data)})")

def run_import():
    """Parcourt le dossier Dictionnaire et lance l'import."""
    for root, dirs, files in os.walk(BASE_DIR):
        for file in files:
            if file in ["mots.json", "expressions.json"]:
                file_path = os.path.join(root, file)
                print(f"Traitement de {file_path}...")
                import_file(file_path)

if __name__ == "__main__":
    run_import()
