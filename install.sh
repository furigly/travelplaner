#!/bin/bash
#
# Script d'installation principal pour le Planificateur d'Édimbourg sur Raspberry Pi
# Auteur: Nom du développeur
# Version: 1.0.0
# Licence: MIT

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour les messages de log
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# En-tête
clear
echo -e "${BLUE}"
echo "============================================================"
echo "   Planificateur de Voyage à Édimbourg pour Raspberry Pi"
echo "============================================================"
echo -e "${NC}"
echo "Ce script va installer le Planificateur d'Édimbourg avec IA locale"
echo "L'installation prend environ 10-20 minutes selon votre connexion"
echo ""
echo "Le script va installer:"
echo "1. Ollama - Moteur d'IA local"
echo "2. Node.js et dépendances"
echo "3. L'application React du Planificateur"
echo "4. Configuration des services systemd"
echo ""
read -p "Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler..."

# Vérification du système
log "Vérification du système..."
if ! command -v uname &> /dev/null; then
    log_error "La commande uname n'est pas disponible"
    exit 1
fi

ARCH=$(uname -m)
log "Architecture détectée: $ARCH"

if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    log_error "Cette installation n'est supportée que pour les Raspberry Pi 64 bits (aarch64/arm64)"
    log_error "Veuillez utiliser le système d'exploitation Raspberry Pi OS 64 bits"
    exit 1
fi

# Obtention du chemin absolu du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
log "Répertoire d'installation: $SCRIPT_DIR"

# Vérification des permissions sudo
if [ "$EUID" -ne 0 ]; then
    log "Vérification des permissions sudo..."
    sudo -v
    if [ $? -ne 0 ]; then
        log_error "Permissions sudo requises pour l'installation"
        exit 1
    fi
fi

# Installation des dépendances système
log "Installation des dépendances système..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git build-essential

# Exécution des scripts d'installation
log "Installation d'Ollama..."
bash "$SCRIPT_DIR/scripts/ollama-setup.sh"
if [ $? -ne 0 ]; then
    log_error "L'installation d'Ollama a échoué"
    exit 1
fi
log_success "Ollama installé avec succès"

log "Installation de l'application React..."
bash "$SCRIPT_DIR/scripts/app-setup.sh"
if [ $? -ne 0 ]; then
    log_error "L'installation de l'application a échoué"
    exit 1
fi
log_success "Application installée avec succès"

log "Configuration des services..."
bash "$SCRIPT_DIR/scripts/service-setup.sh"
if [ $? -ne 0 ]; then
    log_error "La configuration des services a échoué"
    exit 1
fi
log_success "Services configurés avec succès"

# Vérification des services
log "Vérification des services..."
if ! systemctl is-active --quiet ollama; then
    log_warning "Le service Ollama n'est pas actif"
    log_warning "Consultez les logs avec: sudo journalctl -u ollama"
fi

if ! systemctl is-active --quiet cors-proxy; then
    log_warning "Le service CORS proxy n'est pas actif"
    log_warning "Consultez les logs avec: sudo journalctl -u cors-proxy"
fi

if ! systemctl is-active --quiet edinburgh-planner; then
    log_warning "Le service Edinburgh Planner n'est pas actif"
    log_warning "Consultez les logs avec: sudo journalctl -u edinburgh-planner"
fi

# Obtention de l'adresse IP
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Message de fin
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Installation du Planificateur d'Édimbourg terminée !${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Services installés:"
echo "- Ollama (IA locale)"
echo "- Proxy CORS"
echo "- Planificateur d'Édimbourg"
echo ""
echo "Accès à l'application:"
echo -e "- Local: ${BLUE}http://localhost:5000${NC}"
echo -e "- Réseau: ${BLUE}http://$IP_ADDRESS:5000${NC}"
echo ""
echo "Documentation:"
echo "- Guide d'utilisation: docs/USAGE.md"
echo "- Résolution des problèmes: docs/TROUBLESHOOTING.md"
echo ""
echo "Pour vérifier les statuts des services:"
echo "sudo systemctl status ollama"
echo "sudo systemctl status cors-proxy"
echo "sudo systemctl status edinburgh-planner"
echo ""
echo -e "${YELLOW}Note:${NC} Le premier chargement peut prendre un peu de temps car"
echo "      le modèle d'IA doit être chargé en mémoire."
echo ""
