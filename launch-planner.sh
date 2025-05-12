#!/bin/bash
#
# Script de lancement du Planificateur d'Édimbourg
# Ce script vérifie si les services nécessaires sont actifs et démarre l'application

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

# Vérification des services
log "Vérification des services nécessaires..."

# Vérifier si Ollama est installé
if ! command -v ollama &> /dev/null; then
    log_error "Ollama n'est pas installé"
    log_error "Veuillez d'abord exécuter le script d'installation (install.sh)"
    exit 1
fi

# Vérifier si le service Ollama est actif
if ! systemctl is-active --quiet ollama; then
    log_warning "Le service Ollama n'est pas actif"
    read -p "Voulez-vous démarrer le service Ollama? (O/n) " response
    if [[ "$response" != "n" && "$response" != "N" ]]; then
        sudo systemctl start ollama
        log "Démarrage du service Ollama..."
        sleep 3
    else
        log_error "Le service Ollama est nécessaire pour l'assistant IA"
        log_error "L'application peut ne pas fonctionner correctement"
    fi
else
    log_success "Service Ollama actif"
fi

# Vérifier si le proxy CORS est actif
if ! systemctl is-active --quiet cors-proxy; then
    log_warning "Le service CORS proxy n'est pas actif"
    read -p "Voulez-vous démarrer le service CORS proxy? (O/n) " response
    if [[ "$response" != "n" && "$response" != "N" ]]; then
        sudo systemctl start cors-proxy
        log "Démarrage du service CORS proxy..."
        sleep 2
    else
        log_warning "Sans le proxy CORS, certaines fonctionnalités peuvent ne pas fonctionner"
    fi
else
    log_success "Service CORS proxy actif"
fi

# Vérifier si le service de l'application est actif
if ! systemctl is-active --quiet edinburgh-planner; then
    log_warning "Le service Edinburgh Planner n'est pas actif"
    read -p "Voulez-vous démarrer le service? (O/n) " response
    if [[ "$response" != "n" && "$response" != "N" ]]; then
        sudo systemctl start edinburgh-planner
        log "Démarrage du service Edinburgh Planner..."
        sleep 2
    else
        log_error "Sans le service, l'application ne sera pas accessible"
        exit 1
    fi
else
    log_success "Service Edinburgh Planner actif"
fi

# Obtenir l'adresse IP
IP_ADDRESS=$(hostname -I | awk '{print $1}')

# Message de fin
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Planificateur d'Édimbourg prêt à l'emploi !${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Accès à l'application:"
echo -e "- Local: ${BLUE}http://localhost:5000${NC}"
echo -e "- Réseau: ${BLUE}http://$IP_ADDRESS:5000${NC}"
echo ""
echo "Statut des services:"
echo "- Ollama: $(systemctl is-active ollama)"
echo "- CORS proxy: $(systemctl is-active cors-proxy)"
echo "- Edinburgh Planner: $(systemctl is-active edinburgh-planner)"
echo ""
echo "Pour arrêter l'application:"
echo "sudo systemctl stop edinburgh-planner"
echo ""
echo -e "${YELLOW}Note:${NC} Le premier chargement peut prendre un peu de temps car"
echo "      le modèle d'IA doit être chargé en mémoire."
echo ""

# Demander s'il faut ouvrir l'application dans le navigateur
read -p "Voulez-vous ouvrir l'application dans le navigateur? (O/n) " response
if [[ "$response" != "n" && "$response" != "N" ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:5000"
    elif command -v chromium-browser &> /dev/null; then
        chromium-browser "http://localhost:5000"
    else
        log_warning "Impossible d'ouvrir automatiquement le navigateur"
        log_warning "Veuillez ouvrir manuellement http://localhost:5000"
    fi
fi

exit 0
