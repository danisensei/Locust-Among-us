#!/bin/bash
# ============================================
# Roach Pest Analyzer — ZeroSSL Bootstrap Script
# Run this ONCE on your server to obtain the
# initial certificate via acme.sh
# ============================================

set -e

DOMAIN="roachpestanalyzer.duckdns.org"
EMAIL="roachpestanalyzer@gmail.com"  # Using a placeholder email so ZeroSSL doesn't reject registration
STAGING=0 # Set to 1 to use Let's Encrypt staging (for testing)

if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif docker-compose version > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Error: docker-compose or docker compose not found"
  exit 1
fi

echo "=== Fast SSL Bootstrap (ZeroSSL via acme.sh) ==="
echo "Domain: $DOMAIN"
echo ""

# Make sure we start from inside the swarm_engine folder if that's where docker-compose is
if [ -f "swarm_engine/docker-compose.yml" ]; then
  cd swarm_engine
fi

# --- Step 1: Create self-signed certificate so Nginx can start ---
echo ">>> Creating self-signed certificate..."
$COMPOSE run --rm acme sh -c "\
  mkdir -p /etc/letsencrypt/live/$DOMAIN && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=$DOMAIN'
"
echo ">>> Done."

# --- Step 2: Start frontend (nginx) so it can serve .well-known challenges ---
echo ">>> Starting frontend (Nginx)..."
$COMPOSE up -d frontend
echo ">>> Waiting 5 seconds for Nginx to be ready..."
sleep 5

# --- Step 3: Remove self-signed cert and request real one ---
echo ">>> Removing self-signed certificate..."
$COMPOSE run --rm acme sh -c "\
  rm -rf /etc/letsencrypt/live/$DOMAIN \
" 2>/dev/null || true

echo ">>> Requesting ZeroSSL certificate via acme.sh..."

# Build acme.sh issue command - Using ZeroSSL
ACME_CMD="--issue -d $DOMAIN --webroot /var/www/certbot --keylength 2048 --server zerossl"

if [ -n "$EMAIL" ]; then
  ACME_CMD="$ACME_CMD --accountemail $EMAIL"
fi

if [ "$STAGING" -eq 1 ]; then
  ACME_CMD="$ACME_CMD --staging"
fi

# Try to register standard ZeroSSL account FIRST before issuing
$COMPOSE run --rm acme sh -c "acme.sh --register-account -m $EMAIL" || true

# Try to issue the certificate
# We must use 'sh -c "acme.sh ..."' because acme.sh is an alias in the container
if $COMPOSE run --rm acme sh -c "acme.sh --force $ACME_CMD"; then
  echo ">>> Certificate obtained!"
  echo ">>> Installing certificate..."

  $COMPOSE run --rm acme sh -c "acme.sh --install-cert -d $DOMAIN \
    --fullchain-file /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    --key-file /etc/letsencrypt/live/$DOMAIN/privkey.pem"

  echo ">>> Reloading Nginx with real certificate..."
  $COMPOSE exec frontend nginx -s reload
  echo ""
  echo "=== SSL setup complete! ==="
  echo "Your site is now available at: https://$DOMAIN"
else
  echo ""
  echo "============================================"
  echo "WARNING: Could not obtain ZeroSSL certificate."
  echo "HTTPS is still active using a self-signed cert."
  echo "============================================"
  echo ""

  # Recreate self-signed cert since we deleted it
  echo ">>> Restoring self-signed certificate..."
  $COMPOSE run --rm acme sh -c "\
    mkdir -p /etc/letsencrypt/live/$DOMAIN && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
      -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
      -subj '/CN=$DOMAIN'
  "
  echo ">>> Reloading Nginx with self-signed certificate..."
  $COMPOSE exec frontend nginx -s reload
fi

echo ""
echo "To start everything:  $COMPOSE up -d"
echo "acme.sh daemon will auto-renew the certificate running in the background."