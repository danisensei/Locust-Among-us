#!/bin/bash
# ============================================
# Pest Analyzer — ZeroSSL Bootstrap Script
# Run this ONCE on your server to obtain the
# initial certificate via acme.sh
# ============================================

set -e

DOMAIN="pestanalyzer.duckdns.org"
EMAIL=""  # Required by ZeroSSL (set this before running)
STAGING=0 # Set to 1 to use ZeroSSL staging (for testing)
CERT_BASE="/etc/ssl/acme"

if [ -z "$EMAIL" ]; then
  echo "Error: EMAIL is required for ZeroSSL. Set EMAIL in this script before running."
  exit 1
fi

if docker compose version > /dev/null 2>&1; then
  COMPOSE="docker compose"
elif docker-compose version > /dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Error: docker compose not found"
  exit 1
fi

echo "=== SSL Bootstrap (ZeroSSL via acme.sh) ==="
echo "Domain: $DOMAIN"
echo ""

# Make sure we start from inside the swarm_engine folder if that's where docker-compose is
if [ -f "swarm_engine/docker-compose.yml" ]; then
  cd swarm_engine
fi

# --- Step 1: Create self-signed certificate so Nginx can start ---
echo ">>> Creating self-signed certificate..."
$COMPOSE run --rm acme sh -c "\
  mkdir -p $CERT_BASE/live/$DOMAIN && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout $CERT_BASE/live/$DOMAIN/privkey.pem \
    -out $CERT_BASE/live/$DOMAIN/fullchain.pem \
    -subj '/CN=$DOMAIN'
"
echo ">>> Done."

# --- Step 2: Start frontend (nginx) so it can serve .well-known challenges ---
echo ">>> Starting frontend (Nginx)..."
$COMPOSE up -d --build frontend
echo ">>> Waiting 5 seconds for Nginx to be ready..."
sleep 5

# --- Step 3: Remove self-signed cert and request real one ---
echo ">>> Removing self-signed certificate..."
$COMPOSE run --rm acme sh -c "\
  rm -rf $CERT_BASE/live/$DOMAIN \
" 2>/dev/null || true

echo ">>> Requesting ZeroSSL certificate via acme.sh..."

# Register ZeroSSL account first
$COMPOSE run --rm acme sh -c "acme.sh --register-account -m $EMAIL" || true

# Build acme.sh issue command (ZeroSSL)
ACME_CMD="--issue -d $DOMAIN --webroot /var/www/certbot --keylength 2048 --server zerossl"

if [ "$STAGING" -eq 1 ]; then
  ACME_CMD="$ACME_CMD --staging"
fi

# Try to issue the certificate
if $COMPOSE run --rm acme sh -c "acme.sh --force $ACME_CMD"; then
  echo ">>> Certificate obtained!"
  echo ">>> Installing certificate..."

  $COMPOSE run --rm acme sh -c "acme.sh --install-cert -d $DOMAIN \
    --fullchain-file $CERT_BASE/live/$DOMAIN/fullchain.pem \
    --key-file $CERT_BASE/live/$DOMAIN/privkey.pem"

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
    mkdir -p $CERT_BASE/live/$DOMAIN && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -keyout $CERT_BASE/live/$DOMAIN/privkey.pem \
      -out $CERT_BASE/live/$DOMAIN/fullchain.pem \
      -subj '/CN=$DOMAIN'
  "
  echo ">>> Reloading Nginx with self-signed certificate..."
  $COMPOSE exec frontend nginx -s reload
fi

echo ""
echo "To start everything:  $COMPOSE up -d"
