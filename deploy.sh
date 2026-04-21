#!/bin/bash
# Script de déploiement — VPS Hostinger
set -e

echo "🚀 Déploiement AIssociate AGEFICE..."

# 1. Récupérer les dernières modifications
git pull origin main

# 2. Build et redémarrage Docker
docker compose down
docker compose build --no-cache
docker compose up -d

# 3. Appliquer les migrations Prisma
docker compose exec app node_modules/.bin/prisma db push

echo "✅ Déploiement terminé — app disponible sur le port 3000"
