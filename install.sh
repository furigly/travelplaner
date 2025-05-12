#!/bin/bash
#
# Script d'installation principal pour le Planificateur d'Édimbourg sur Raspberry Pi
# https://github.com/furigly/travelplaner
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
    log_warning "Cette installation est optimisée pour les Raspberry Pi 64 bits (aarch64/arm64)"
    log_warning "Une installation 32 bits est possible mais certaines fonctionnalités pourraient ne pas fonctionner correctement"
    read -p "Voulez-vous continuer quand même? (o/N) " response
    if [[ ! "$response" =~ ^[oO]$ ]]; then
        log_error "Installation annulée"
        exit 1
    fi
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
if [ -f "$SCRIPT_DIR/scripts/ollama-setup.sh" ]; then
    log "Installation d'Ollama..."
    bash "$SCRIPT_DIR/scripts/ollama-setup.sh"
    if [ $? -ne 0 ]; then
        log_error "L'installation d'Ollama a échoué"
        exit 1
    fi
    log_success "Ollama installé avec succès"
else
    log_error "Script d'installation d'Ollama introuvable: $SCRIPT_DIR/scripts/ollama-setup.sh"
    exit 1
fi

if [ -f "$SCRIPT_DIR/scripts/app-setup.sh" ]; then
    log "Installation de l'application React..."
    bash "$SCRIPT_DIR/scripts/app-setup.sh"
    if [ $? -ne 0 ]; then
        log_error "L'installation de l'application a échoué"
        exit 1
    fi
    log_success "Application installée avec succès"
else
    log_error "Script d'installation de l'application introuvable: $SCRIPT_DIR/scripts/app-setup.sh"
    exit 1
fi

if [ -f "$SCRIPT_DIR/scripts/service-setup.sh" ]; then
    log "Configuration des services..."
    bash "$SCRIPT_DIR/scripts/service-setup.sh"
    if [ $? -ne 0 ]; then
        log_error "La configuration des services a échoué"
        exit 1
    fi
    log_success "Services configurés avec succès"
else
    log_error "Script de configuration des services introuvable: $SCRIPT_DIR/scripts/service-setup.sh"
    exit 1
fi

# Configuration des assets si le script existe
if [ -f "$SCRIPT_DIR/scripts/create-assets.sh" ]; then
    log "Configuration des assets..."
    bash "$SCRIPT_DIR/scripts/create-assets.sh"
    if [ $? -ne 0 ]; then
        log_warning "La configuration des assets a échoué, mais l'installation peut continuer"
    else
        log_success "Assets configurés avec succès"
    fi
fi

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
if [ -d "$SCRIPT_DIR/docs" ]; then
    echo "- Guide d'installation détaillé: $SCRIPT_DIR/docs/INSTALLATION.md"
    echo "- Options de configuration: $SCRIPT_DIR/docs/CONFIGURATION.md"
    echo "- Résolution des problèmes: $SCRIPT_DIR/docs/TROUBLESHOOTING.md"
else
    echo "- Documentation en ligne: https://github.com/furigly/travelplaner"
fi
echo ""
echo "Pour vérifier les statuts des services:"
echo "sudo systemctl status ollama"
echo "sudo systemctl status cors-proxy"
echo "sudo systemctl status edinburgh-planner"
echo ""
echo -e "${YELLOW}Note:${NC} Le premier chargement peut prendre un peu de temps car"
echo "      le modèle d'IA doit être chargé en mémoire."
echo ""

# Offrir de lancer l'application dans le navigateur
if command -v xdg-open &> /dev/null || command -v chromium-browser &> /dev/null; then
    read -p "Voulez-vous ouvrir l'application dans le navigateur? (O/n) " open_browser
    if [[ ! "$open_browser" =~ ^[nN]$ ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:5000"
        elif command -v chromium-browser &> /dev/null; then
            chromium-browser "http://localhost:5000"
        fi
    fi
fi

exit 0
