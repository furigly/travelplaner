#!/bin/bash
#
# Script pour créer le dossier des assets et y placer le logo
# Partie du projet: https://github.com/furigly/travelplaner

set -e

# Couleurs pour les messages
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour les messages de log
log() {
    echo -e "${BLUE}[ASSETS]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[ASSETS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ASSETS]${NC} $1"
}

# En-tête
log "Configuration des assets pour le Planificateur d'Édimbourg"
log "-------------------------------------"

# Obtention du chemin absolu du script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

APP_DIR=~/edinburgh-planner
log "Répertoire de l'application: $APP_DIR"

# Création du dossier des assets
mkdir -p "$APP_DIR/src/assets"
log "Dossier des assets créé: $APP_DIR/src/assets"

# Vérifier si le logo existe dans le projet
if [ -f "$PROJECT_ROOT/src/assets/edinburgh-logo.svg" ]; then
    log "Copie du logo depuis le projet..."
    cp "$PROJECT_ROOT/src/assets/edinburgh-logo.svg" "$APP_DIR/src/assets/"
    log_success "Logo copié avec succès"
else
    # Créer le logo directement
    log "Création du logo SVG..."
    cat > "$APP_DIR/src/assets/edinburgh-logo.svg" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond de ciel -->
  <rect width="100" height="100" fill="#0065bd"/>
  
  <!-- Silhouette du château d'Édimbourg -->
  <path d="M10,80 L90,80 L90,75 L10,75 Z" fill="#333333"/>
  <path d="M15,75 L20,75 L20,65 L15,65 Z" fill="#333333"/>
  <path d="M25,75 L35,75 L35,60 L25,60 Z" fill="#333333"/>
  <path d="M40,75 L50,75 L50,55 L40,55 Z" fill="#333333"/>
  <path d="M55,75 L65,75 L65,60 L55,60 Z" fill="#333333"/>
  <path d="M70,75 L85,75 L85,65 L70,65 Z" fill="#333333"/>
  
  <!-- Tours du château -->
  <path d="M27,60 L33,60 L33,55 L31,50 L29,50 L27,55 Z" fill="#333333"/>
  <path d="M42,55 L48,55 L48,48 L45,43 L42,48 Z" fill="#333333"/>
  <path d="M57,60 L63,60 L63,55 L60,50 L57,55 Z" fill="#333333"/>
  <path d="M72,65 L83,65 L83,60 L80,55 L75,55 L72,60 Z" fill="#333333"/>
  
  <!-- Fenêtres -->
  <rect x="28" y="57" width="2" height="2" fill="#f0ece6"/>
  <rect x="44" y="52" width="2" height="2" fill="#f0ece6"/>
  <rect x="59" y="57" width="2" height="2" fill="#f0ece6"/>
  <rect x="75" y="62" width="2" height="2" fill="#f0ece6"/>
  <rect x="80" y="62" width="2" height="2" fill="#f0ece6"/>
  
  <!-- Colline du château -->
  <path d="M5,75 Q50,65 95,75 L95,80 L5,80 Z" fill="#005d2f"/>
  
  <!-- Lune dans le ciel -->
  <circle cx="75" cy="25" r="10" fill="#f0ece6"/>
  <circle cx="72" cy="22" r="10" fill="#0065bd"/>
  
  <!-- Étoiles -->
  <circle cx="20" cy="15" r="1" fill="#f0ece6"/>
  <circle cx="35" cy="25" r="1" fill="#f0ece6"/>
  <circle cx="50" cy="10" r="1" fill="#f0ece6"/>
  <circle cx="65" cy="30" r="1" fill="#f0ece6"/>
  <circle cx="80" cy="15" r="1" fill="#f0ece6"/>
  <circle cx="25" cy="35" r="1" fill="#f0ece6"/>
  
  <!-- Contour circulaire -->
  <circle cx="50" cy="50" r="48" fill="none" stroke="#daa520" stroke-width="4"/>
  
  <!-- Texte "Edinburgh" en arc -->
  <path id="textPath" d="M50,90 A40,40 0 0,1 10,50 A40,40 0 0,1 50,10 A40,40 0 0,1 90,50 A40,40 0 0,1 50,90" fill="none"/>
  <text font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#f0ece6">
    <textPath href="#textPath" startOffset="15%">EDINBURGH PLANNER</textPath>
  </text>
</svg>
EOF
    log_success "Logo SVG créé avec succès"
fi

# Création d'un favicon
log "Création du favicon..."
mkdir -p "$APP_DIR/public"

# Simple script pour créer un favicon basique (dans un vrai projet, utilisez un convertisseur SVG)
cat > "$APP_DIR/public/favicon.ico" << 'EOF'
data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAt1dwIAAAAA7+LNM+3fyHP06dKW9OnSlvLmzHP16dIzAAAAAA11dgIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANdXcC9OnSM/bq1JP68N7G/fXo4P/9+P7//fj+//716OD68N7G9urUk/Xp0jMNdXcCAAAAAAAAAAAAAAAAC3V3Au/izTP26tST+vDex/768/L///////////////////////////768/L68N7H9urUk+/izTMLdXcCAAAAAAx1djLt38h/+vDex//78/L///////////////////////////////////////rw3sf16dR/DHV2MgAAAAAMdXZy9OnSl/316OD///////////////////////////////////////////316OD06dKXDHV2cgAAAAALdXfB9OnSmP/9+P7///////////////////////////////////////////316OD06dKYC3V3wQAAAAAt1djB9OnSmP/9+P7///////////////////////////////////////////316OD06dKYLdXYwQAAAAAMdXZy9OnSl/316OD///////////////////////////////////////////316OD06dKXDHV2cgAAAAAMdXYy7d/If/rw3sf/+/Py///////////////////////////////////////68N7H9enUfwx1djIAAAAAAAt1dwLv4s0z9urUk/rw3sf++vPy///////////////////////////68/L68N7H9urUk+/izTMLdXcCAAAAAAAAAAAAAAAADXV3AvTp0jP26tST+vDexv316OD//fj+//34/v/316OD68N7G9urUk/Xp0jMNdXcCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADXV3Au/izTPt38hz9OnSlvTp0pbv4s0z9OnSMwAAAAALdXcCAAAAAAAAAAAAAAAAn3wAAI98AACPfAAAj3wAAI98AACPfAAAj3wAAI98AACPfAAAj3wAAI98AACPfAAAj3wAAI98AACffAAAAAAAAA==
EOF
log_success "Favicon créé avec succès"

# Mettre à jour les imports dans App.js si nécessaire
if grep -q "import logo from './assets/edinburgh-logo.svg';" "$APP_DIR/src/App.js"; then
    log "Import du logo déjà présent dans App.js"
else
    log "Mise à jour de App.js pour importer le logo..."
    # Utiliser sed pour ajouter l'import juste après les autres imports
    sed -i '/import.*from.*/a import logo from "./assets/edinburgh-logo.svg";' "$APP_DIR/src/App.js"
    log_success "Import du logo ajouté à App.js"
fi

log_success "Configuration des assets terminée"
exit 0
