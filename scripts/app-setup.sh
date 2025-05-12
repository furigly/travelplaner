#!/bin/bash
#
# Script d'installation de l'application React pour le Planificateur d'Édimbourg
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
    echo -e "${BLUE}[APP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[APP]${NC} $1"
}

log_error() {
    echo -e "${RED}[APP]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[APP]${NC} $1"
}

# En-tête
log "Installation de l'application React"
log "-------------------------------------"

# Obtention du chemin absolu du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"
log "Répertoire du projet: $PROJECT_ROOT"

# Installation de Node.js
if ! command -v node &> /dev/null; then
    log "Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Vérification de l'installation de Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js n'a pas été installé correctement"
    exit 1
fi

NODE_VERSION=$(node -v)
log "Node.js version $NODE_VERSION installé"

# Vérification de npm
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé correctement"
    exit 1
fi

NPM_VERSION=$(npm -v)
log "npm version $NPM_VERSION installé"

# Installation des dépendances globales
log "Installation des dépendances globales..."
sudo npm install -g create-react-app serve

# Création du répertoire pour l'application
APP_DIR=~/edinburgh-planner
log "Création du répertoire de l'application: $APP_DIR"
mkdir -p $APP_DIR

# Initialisation du projet React
log "Initialisation du projet React..."
cd $APP_DIR

if [ ! -f "package.json" ]; then
    npx create-react-app@latest . --template cra-template --use-npm
else
    log_warning "Le projet React existe déjà, ignoré l'initialisation"
fi

# Installation des dépendances du projet
log "Installation des dépendances du projet..."
npm install --save lucide-react react-router-dom

# Installation de Tailwind CSS
log "Installation de Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configuration de Tailwind CSS
log "Configuration de Tailwind CSS..."
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Mise à jour du fichier CSS principal
log "Mise à jour des fichiers CSS..."
cat > src/index.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

# Copie des fichiers source du projet
log "Copie des fichiers source..."
mkdir -p src/components src/config

# Copie de App.js depuis le répertoire du projet
if [ -f "$PROJECT_ROOT/src/App.js" ]; then
    log "Copie de App.js..."
    cp "$PROJECT_ROOT/src/App.js" src/App.js
else
    log "Création de App.js..."
    cat > src/App.js << EOF
import React from 'react';
import './App.css';
import EdinburghPlanner from './components/EdinburghPlanner';

function App() {
  return (
    <div className="App">
      <EdinburghPlanner />
    </div>
  );
}

export default App;
EOF
fi

# Création du fichier apiKeys.js
log "Création du fichier de configuration des API..."
cat > src/config/apiKeys.js << EOF
const API_KEYS = {
  openWeather: '', // Optionnel: ajoutez votre clé API OpenWeatherMap si vous en avez une
  googlePlaces: '' // Optionnel: ajoutez votre clé API Google Places si vous en avez une
};

export default API_KEYS;
EOF

# Copie du composant principal
if [ -f "$PROJECT_ROOT/src/components/EdinburghPlanner.jsx" ]; then
    log "Copie du composant EdinburghPlanner..."
    cp "$PROJECT_ROOT/src/components/EdinburghPlanner.jsx" src/components/
else
    log_error "Le fichier EdinburghPlanner.jsx est manquant"
    log_error "L'installation ne peut pas continuer"
    exit 1
fi

# Configuration du modèle IA
if [ -f ~/edinburgh-planner-config/ollama.conf ]; then
    source ~/edinburgh-planner-config/ollama.conf
    log "Configuration du modèle IA: $AI_MODEL"
    sed -i "s/model: \"tinyllama\"/model: \"$AI_MODEL\"/g" src/components/EdinburghPlanner.jsx
fi

# Construction de l'application
log "Construction de l'application..."
npm run build

log_success "Installation de l'application terminée avec succès"

exit 0
