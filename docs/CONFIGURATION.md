# Options de configuration

Ce document explique comment configurer et personnaliser le Planificateur d'Édimbourg selon vos besoins.

## Configuration des clés API

Bien que l'application fonctionne sans clés API (en utilisant des API gratuites avec des limites), vous pouvez améliorer les fonctionnalités en configurant vos propres clés API.

### OpenWeatherMap (météo)

1. Créez un compte gratuit sur [OpenWeatherMap](https://home.openweathermap.org/users/sign_up)
2. Générez une clé API depuis votre tableau de bord
3. Modifiez le fichier `src/config/apiKeys.js` :
   ```javascript
   nano ~/edinburgh-planner/src/config/apiKeys.js
   
   // Modifiez la ligne
   openWeather: 'VOTRE_CLÉ_API_ICI',
   ```
4. Reconstruisez l'application :
   ```bash
   cd ~/edinburgh-planner
   npm run build
   sudo systemctl restart edinburgh-planner
   ```

Le plan gratuit d'OpenWeatherMap permet 1000 appels par jour, ce qui est largement suffisant pour une utilisation personnelle.

### API de lieux (optionnel)

Par défaut, l'application utilise OpenStreetMap (Nominatim), qui est gratuit et ne nécessite pas de clé API. Si vous souhaitez utiliser Google Places comme source alternative :

1. Créez un projet dans [Google Cloud Console](https://console.cloud.google.com/)
2. Activez l'API Places et obtenez une clé API
3. Modifiez le fichier `src/config/apiKeys.js` :
   ```javascript
   googlePlaces: 'VOTRE_CLÉ_GOOGLE_PLACES',
   ```
4. Reconstruisez l'application.

## Configuration du modèle d'IA

Le script d'installation choisit automatiquement le modèle d'IA en fonction de la RAM disponible sur votre Raspberry Pi :
- Pi avec moins de 4 Go RAM : modèle "phi" (plus léger)
- Pi avec 4 Go RAM ou plus : modèle "tinyllama" (meilleures performances)

Si vous souhaitez changer de modèle manuellement :

1. Téléchargez le modèle souhaité :
   ```bash
   ollama pull phi    # modèle plus léger
   # ou
   ollama pull tinyllama  # modèle plus complet
   ```

2. Modifiez le fichier `src/components/EdinburghPlanner.jsx` :
   ```bash
   nano ~/edinburgh-planner/src/components/EdinburghPlanner.jsx
   
   # Cherchez la ligne contenant "model: "
   # Et remplacez le nom du modèle
   ```

3. Reconstruisez l'application :
   ```bash
   cd ~/edinburgh-planner
   npm run build
   sudo systemctl restart edinburgh-planner
   ```

**Note** : Vous pouvez aussi installer d'autres modèles Ollama compatibles avec votre matériel, comme "llama2", "neural-chat" ou "mistral". Consultez [la liste des modèles Ollama](https://ollama.ai/library) pour plus d'options.

## Configuration du proxy CORS

Par défaut, le proxy CORS écoute sur le port 8080. Si vous devez le modifier :

1. Éditez le fichier de service :
   ```bash
   sudo nano /etc/systemd/system/cors-proxy.service
   
   # Modifiez la ligne
   Environment=PORT=8080
   ```

2. Mettez à jour la référence dans le code :
   ```bash
   nano ~/edinburgh-planner/src/components/EdinburghPlanner.jsx
   
   # Modifiez la ligne contenant "http://localhost:8080" pour correspondre au nouveau port
   ```

3. Redémarrez les services :
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart cors-proxy
   ```

## Options d'internationalisation

Par défaut, l'application est en français pour correspondre au thème d'Édimbourg. Si vous souhaitez la modifier pour une autre langue :

1. Modifiez les chaînes de caractères dans les composants React.
2. Mettez à jour les dates et formats de nombres pour correspondre à votre langue.

Pour changer la langue de l'assistant IA, modifiez le prompt dans `fetchAssistantResponse` :

```javascript
const contextPrompt = `You are a travel assistant for Edinburgh. The user is planning a trip from ${travelDates.start} to ${travelDates.end}. 
They have already planned these activities: ${JSON.stringify(events.slice(0, 5).map(e => ({ 
  title: e.title, 
  date: e.date, 
  duration: e.duration 
})))}. 
Answer ONLY in English, in a concise but helpful way to this message: "${message}"`;
```

## Configuration pour différentes villes

Bien que cette application soit spécialisée pour Édimbourg, vous pouvez l'adapter pour d'autres villes :

1. Modifiez les références à "Edinburgh" et "Édimbourg" dans les fichiers source.
2. Mettez à jour le prompt de l'assistant IA pour la nouvelle ville.
3. Ajustez les paramètres des API pour rechercher des attractions dans la nouvelle ville.

## Options avancées

### Réglage des performances

Pour les Raspberry Pi avec des ressources limitées, vous pouvez ajuster ces paramètres :

1. **Limite de mémoire pour Ollama** :
   ```bash
   sudo nano /etc/systemd/system/ollama.service
   
   # Ajoutez sous [Service]
   MemoryMax=2G
   ```

2. **Désactivation des effets visuels de l'interface** :
   Modifiez les transitions CSS dans les fichiers source pour de meilleures performances.

### Redémarrage automatique

L'installation configure un redémarrage quotidien des services à 4h du matin pour maintenir les performances optimales. Vous pouvez modifier cette fréquence :

```bash
crontab -e

# Modifiez la ligne pour changer l'heure ou la fréquence
0 4 * * * sudo systemctl restart edinburgh-planner
0 4 * * * sudo systemctl restart ollama
```

### Accès externe

Si vous souhaitez accéder à l'application depuis l'extérieur de votre réseau local, vous pouvez configurer une redirection de port sur votre routeur, mais soyez conscient des implications en matière de sécurité.

Pour une solution plus sécurisée, envisagez d'utiliser [Tailscale](https://tailscale.com/) ou [ZeroTier](https://www.zerotier.com/) pour créer un réseau privé virtuel.

## Sauvegarde et restauration

Pour sauvegarder votre configuration et vos données :

```bash
# Sauvegarde
mkdir -p ~/edinburgh-planner-backup
cp -r ~/edinburgh-planner/build ~/edinburgh-planner-backup/
cp ~/edinburgh-planner/src/config/apiKeys.js ~/edinburgh-planner-backup/
# Les données de planification sont stockées dans localStorage du navigateur

# Restauration
cp -r ~/edinburgh-planner-backup/build ~/edinburgh-planner/
cp ~/edinburgh-planner-backup/apiKeys.js ~/edinburgh-planner/src/config/
```

Pour les données de planification, utilisez la fonction d'exportation intégrée à l'application pour sauvegarder et restaurer vos itinéraires.
