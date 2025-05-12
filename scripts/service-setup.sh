#!/bin/bash
#
# Script de configuration des services pour le Planificateur d'Édimbourg
# Partie du projet: https://github.com/votre-username/edinburgh-planner-raspberry

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour les messages de log
log() {
    echo -e "${BLUE}[SERVICES]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SERVICES]${NC} $1"
}

log_error() {
    echo -e "${RED}[SERVICES]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[SERVICES]${NC} $1"
}

# En-tête
log "Configuration des services systemd"
log "-------------------------------------"

# Installation du serveur proxy CORS si nécessaire
if ! command -v cors-anywhere &> /dev/null; then
    log "Installation du serveur proxy CORS..."
    sudo npm install -g cors-anywhere
fi

# Configuration du service proxy CORS
log "Configuration du service proxy CORS..."
cat << EOF | sudo tee /etc/systemd/system/cors-proxy.service
[Unit]
Description=CORS Anywhere Proxy
After=network.target

[Service]
ExecStart=$(which cors-anywhere)
Restart=always
RestartSec=10
User=$(whoami)
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Activation et démarrage du service proxy CORS
log "Activation du service proxy CORS..."
sudo systemctl daemon-reload
sudo systemctl enable cors-proxy.service
sudo systemctl start cors-proxy.service

# Vérification du statut du proxy CORS
if sudo systemctl is-active --quiet cors-proxy; then
    log_success "Service proxy CORS actif"
else
    log_warning "Le service proxy CORS n'a pas démarré correctement"
    sudo systemctl status cors-proxy
fi

# Configuration du service pour l'application
log "Configuration du service pour le Planificateur d'Édimbourg..."
cat << EOF | sudo tee /etc/systemd/system/edinburgh-planner.service
[Unit]
Description=Edinburgh Planner App
After=network.target ollama.service

[Service]
ExecStart=$(which serve) -s $(realpath ~/edinburgh-planner/build)
WorkingDirectory=$(realpath ~/edinburgh-planner)
StandardOutput=inherit
StandardError=inherit
Restart=always
User=$(whoami)

[Install]
WantedBy=multi-user.target
EOF

# Activation et démarrage du service de l'application
log "Activation du service du Planificateur d'Édimbourg..."
sudo systemctl daemon-reload
sudo systemctl enable edinburgh-planner.service
sudo systemctl start edinburgh-planner.service

# Vérification du statut du service de l'application
if sudo systemctl is-active --quiet edinburgh-planner; then
    log_success "Service du Planificateur d'Édimbourg actif"
else
    log_warning "Le service du Planificateur d'Édimbourg n'a pas démarré correctement"
    sudo systemctl status edinburgh-planner
fi

# Configuration d'un redémarrage quotidien (optionnel, pour maintenir les performances)
log "Configuration d'un redémarrage quotidien des services (à 4h du matin)..."
(crontab -l 2>/dev/null || echo "") | grep -v "systemctl restart edinburgh-planner" | \
    { cat; echo "0 4 * * * sudo systemctl restart edinburgh-planner"; } | crontab -
(crontab -l 2>/dev/null || echo "") | grep -v "systemctl restart ollama" | \
    { cat; echo "0 4 * * * sudo systemctl restart ollama"; } | crontab -

log_success "Configuration des services terminée avec succès"

exit 0
