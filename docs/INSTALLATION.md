# Guide d'installation détaillé

Ce guide explique en détail comment installer le Planificateur d'Édimbourg sur votre Raspberry Pi.

## Prérequis

- Raspberry Pi 3 ou plus récent (Pi 4 avec 4GB+ RAM recommandé)
- Raspberry Pi OS 64-bit (Bullseye ou plus récent)
- Au moins 8 Go d'espace disque disponible
- Connexion Internet

## Méthode 1: Installation automatique (recommandée)

L'installation automatique est la méthode la plus simple et la plus rapide.

1. Clonez le dépôt :
```bash
git clone https://github.com/furigly/travelplaner.git
cd travelplaner
```

2. Rendez le script d'installation exécutable :
```bash
chmod +x install.sh
```

3. Lancez l'installation :
```bash
./install.sh
```

4. Suivez les instructions à l'écran.

L'installation complète prend environ 10-20 minutes en fonction de votre connexion Internet et de votre modèle de Raspberry Pi.

## Méthode 2: Installation manuelle

Si vous préférez installer les composants individuellement ou si vous rencontrez des problèmes avec l'installation automatique, suivez ces étapes.

### Étape 1: Préparer le système

```bash
# Mettre à jour le système
sudo apt-get update
sudo apt-get upgrade -y

# Installer les dépendances requises
sudo apt-get install -y ca-certificates curl gnupg git build-essential
```

### Étape 2: Installer Node.js

```bash
# Télécharger et installer Node.js v16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier l'installation
node -v
npm -v
```

### Étape 3: Installer Ollama (IA locale)

```bash
# Installer Go (requis pour Ollama)
wget https://go.dev/dl/go1.21.0.linux-arm64.tar.gz
sudo tar -C /usr/local -xzf go1.21.0.linux-arm64.tar.gz
export PATH=$PATH:/usr/local/go/bin
echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc

# Cloner et construire Ollama
git clone https://github.com/ollama/ollama
cd ollama
go build
sudo mv ollama /usr/local/bin/
cd ..
rm -rf ollama go1.21.0.linux-arm64.tar.gz

# Créer et démarrer le service
sudo bash -c 'cat > /etc/systemd/system/ollama.service << EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
ExecStart=/usr/local/bin/ollama serve
Restart=always
User='$USER'
Environment=HOME='$HOME'

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable ollama.service
sudo systemctl start ollama.service

# Télécharger un modèle léger
# Pour les Raspberry Pi avec moins de 4GB de RAM, utilisez phi
RAM=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$RAM" -lt 4096 ]; then
  ollama pull phi
else
  ollama pull tinyllama
fi
```

### Étape 4: Installer l'application React

```bash
# Installer les outils globaux
sudo npm install -g create-react-app serve cors-anywhere

# Créer le projet React
mkdir -p ~/edinburgh-planner
cd ~/edinburgh-planner
npx create-react-app .

# Installer les dépendances
npm install --save lucide-react react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configurer Tailwind CSS
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

# Mettre à jour le fichier CSS principal
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
```

### Étape 5: Copier les fichiers source

```bash
# Copier les fichiers depuis le dépôt cloné
# Remplacez PATH_TO_REPO par le chemin où vous avez cloné le dépôt
cd ~/edinburgh-planner
mkdir -p src/components src/config

# Copier les fichiers principaux
cp PATH_TO_REPO/src/App.js src/
cp PATH_TO_REPO/src/components/EdinburghPlanner.jsx src/components/
cp PATH_TO_REPO/src/config/apiKeys.js src/config/

# Configurer le modèle d'IA approprié
RAM=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$RAM" -lt 4096 ]; then
  sed -i 's/model: "tinyllama"/model: "phi"/g' src/components/EdinburghPlanner.jsx
fi

# Construire l'application
npm run build
```

### Étape 6: Configurer les services systemd

```bash
# Configurer le proxy CORS
sudo bash -c 'cat > /etc/systemd/system/cors-proxy.service << EOF
[Unit]
Description=CORS Anywhere Proxy
After=network.target

[Service]
ExecStart='$(which cors-anywhere)'
Restart=always
User='$USER'
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF'

# Configurer le service de l'application
sudo bash -c 'cat > /etc/systemd/system/edinburgh-planner.service << EOF
[Unit]
Description=Edinburgh Planner App
After=network.target ollama.service

[Service]
ExecStart='$(which serve)' -s '$(realpath ~/edinburgh-planner/build)'
WorkingDirectory='$(realpath ~/edinburgh-planner)'
StandardOutput=inherit
StandardError=inherit
Restart=always
User='$USER'

[Install]
WantedBy=multi-user.target
EOF'

# Activer et démarrer les services
sudo systemctl daemon-reload
sudo systemctl enable cors-proxy.service
sudo systemctl enable edinburgh-planner.service
sudo systemctl start cors-proxy.service
sudo systemctl start edinburgh-planner.service
```

## Après l'installation

Une fois l'installation terminée, l'application sera accessible via votre navigateur :

- En local sur le Raspberry Pi : http://localhost:5000
- Depuis d'autres appareils sur le même réseau : http://IP_DU_RASPBERRY:5000

Pour trouver l'adresse IP de votre Raspberry Pi, exécutez :
```bash
hostname -I
```

## Vérification et dépannage

Pour vérifier le statut des services :
```bash
sudo systemctl status ollama
sudo systemctl status cors-proxy
sudo systemctl status edinburgh-planner
```

Pour consulter les journaux des services :
```bash
sudo journalctl -u ollama
sudo journalctl -u cors-proxy
sudo journalctl -u edinburgh-planner
```

Pour plus d'informations sur la résolution des problèmes, consultez [Troubleshooting](TROUBLESHOOTING.md).

## Mise à jour

Pour mettre à jour l'application après des modifications de code :
```bash
cd ~/edinburgh-planner
git pull  # Si vous avez cloné le dépôt directement
npm run build
sudo systemctl restart edinburgh-planner
```
