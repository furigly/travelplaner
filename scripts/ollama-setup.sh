#!/bin/bash
#
# Script d'installation d'Ollama pour le Planificateur d'Édimbourg
# Partie du projet: https://github.com/furigly/travelplaner

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour les messages de log
log() {
    echo -e "${BLUE}[OLLAMA]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OLLAMA]${NC} $1"
}

log_error() {
    echo -e "${RED}[OLLAMA]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[OLLAMA]${NC} $1"
}

# En-tête
log "Installation d'Ollama - Moteur d'IA local"
log "-------------------------------------"

# Installation de Go (nécessaire pour compiler Ollama)
if ! command -v go &> /dev/null; then
    log "Installation de Go..."
    GO_VERSION="1.21.0"
    wget https://go.dev/dl/go$GO_VERSION.linux-arm64.tar.gz
    sudo tar -C /usr/local -xzf go$GO_VERSION.linux-arm64.tar.gz
    echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go$GO_VERSION.linux-arm64.tar.gz
fi

# Vérification de l'installation de Go
if ! command -v go &> /dev/null; then
    log_error "Go n'a pas été installé correctement"
    exit 1
fi

log "Go version $(go version) installé"

# Installation d'Ollama
if ! command -v ollama &> /dev/null; then
    log "Téléchargement et compilation d'Ollama..."
    git clone https://github.com/ollama/ollama
    cd ollama
    go build

    log "Installation d'Ollama..."
    sudo mv ollama /usr/local/bin/
    cd ..
    rm -rf ollama
fi

# Vérification de l'installation d'Ollama
if ! command -v ollama &> /dev/null; then
    log_error "Ollama n'a pas été installé correctement"
    exit 1
fi

# Création du service systemd
log "Configuration du service Ollama..."
cat << EOF | sudo tee /etc/systemd/system/ollama.service
[Unit]
Description=Ollama Service
After=network.target

[Service]
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
User=$(whoami)
Environment=HOME=$(echo $HOME)

[Install]
WantedBy=multi-user.target
EOF

# Activation et démarrage du service
log "Activation du service Ollama..."
sudo systemctl daemon-reload
sudo systemctl enable ollama.service
sudo systemctl start ollama.service

# Vérification du statut
log "Vérification du statut d'Ollama..."
sleep 5
if sudo systemctl is-active --quiet ollama; then
    log_success "Ollama est en cours d'exécution!"
else
    log_error "Erreur: Ollama n'a pas démarré correctement"
    sudo systemctl status ollama
    exit 1
fi

# Téléchargement d'un modèle adapté au Raspberry Pi
log "Configuration du modèle IA..."

# Vérifier la RAM disponible pour choisir le modèle approprié
TOTAL_RAM=$(free -m | awk '/^Mem:/ {print $2}')
log "Mémoire RAM totale détectée: $TOTAL_RAM MB"

if [ "$TOTAL_RAM" -lt 4096 ]; then
    log "RAM limitée détectée, téléchargement du modèle phi (plus léger)..."
    ollama pull phi
    MODEL="phi"
else
    log "RAM suffisante détectée, téléchargement du modèle tinyllama..."
    ollama pull tinyllama
    MODEL="tinyllama"
fi

# Enregistrer le modèle choisi dans un fichier de configuration
mkdir -p ~/edinburgh-planner-config
echo "AI_MODEL=$MODEL" > ~/edinburgh-planner-config/ollama.conf

log_success "Installation d'Ollama terminée avec succès (modèle: $MODEL)"
exit 0
