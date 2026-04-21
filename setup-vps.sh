#!/bin/bash
# Script d'installation initiale — VPS Hostinger
# Usage: bash setup-vps.sh
set -e

DOMAIN="app.aissociate.re"
EMAIL="contact@aissociate.re"

echo "=== 1. Clonage du repo ==="
if [ ! -d "agefice-app" ]; then
  git clone https://github.com/Aissociate/agefice-app.git
fi
cd agefice-app

echo "=== 2. Fichier d'environnement ==="
if [ ! -f ".env.production" ]; then
  cp .env.production.example .env.production
  echo "⚠️  Remplis .env.production avec tes clés API avant de continuer"
  echo "    nano .env.production"
  read -p "Appuie sur Entrée une fois le fichier rempli..."
fi

echo "=== 3. Démarrage initial (HTTP uniquement) ==="
cp nginx/nginx-init.conf nginx/nginx.conf
docker compose up -d --build
sleep 5

echo "=== 4. Obtention du certificat SSL ==="
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

echo "=== 5. Activation HTTPS ==="
cp nginx/nginx.conf nginx/nginx-init.conf  # sauvegarde
cat > nginx/nginx.conf << 'NGINX'
server {
    listen 80;
    server_name app.aissociate.re;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 443 ssl;
    server_name app.aissociate.re;
    ssl_certificate     /etc/letsencrypt/live/app.aissociate.re/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.aissociate.re/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    client_max_body_size 20M;
    location / {
        proxy_pass         http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
NGINX

docker compose restart nginx

echo "=== 6. Migration base de données ==="
docker compose exec app node_modules/.bin/prisma db push

echo ""
echo "✅ Installation terminée !"
echo "   → https://$DOMAIN"
