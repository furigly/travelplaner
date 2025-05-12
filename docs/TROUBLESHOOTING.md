# Guide de résolution des problèmes

Ce document vous aidera à résoudre les problèmes courants rencontrés lors de l'installation ou de l'utilisation du Planificateur d'Édimbourg sur Raspberry Pi.

## Problèmes d'installation

### L'installation échoue avec une erreur liée à Go

**Symptômes** : Erreur lors de la compilation d'Ollama liée à Go.

**Solutions** :
1. Vérifiez que Go est correctement installé :
   ```bash
   go version
   ```
2. Si Go n'est pas reconnu, ajoutez-le manuellement au PATH :
   ```bash
   export PATH=$PATH:/usr/local/go/bin
   echo "export PATH=\$PATH:/usr/local/go/bin" >> ~/.bashrc
   source ~/.bashrc
   ```
3. Réessayez l'installation.

### Erreur "Not enough memory" lors de la compilation

**Symptômes** : La compilation échoue avec une erreur de mémoire insuffisante.

**Solutions** :
1. Augmenter l'espace de swap :
   ```bash
   sudo dphys-swapfile swapoff
   sudo nano /etc/dphys-swapfile
   # Modifiez CONF_SWAPSIZE=100 à CONF_SWAPSIZE=1024
   sudo dphys-swapfile setup
   sudo dphys-swapfile swapon
   ```
2. Réessayez l'installation.

### Problèmes avec Node.js

**Symptômes** : Erreurs liées à Node.js ou npm.

**Solutions** :
1. Réinstallez Node.js :
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. Vérifiez l'installation :
   ```bash
   node -v
   npm -v
   ```

## Problèmes avec les services

### Le service Ollama ne démarre pas

**Symptômes** : `systemctl status ollama` montre "failed" ou "activating".

**Solutions** :
1. Vérifiez les journaux :
   ```bash
   sudo journalctl -u ollama
   ```
2. Vérifiez que l'utilisateur a les permissions :
   ```bash
   ls -la /usr/local/bin/ollama
   ```
3. Redémarrez le service :
   ```bash
   sudo systemctl restart ollama
   ```

### Message "Ollama API not reachable" dans l'application

**Symptômes** : L'application affiche un écran indiquant que le service Ollama n'est pas accessible.

**Solutions** :
1. Vérifiez que le service Ollama est en cours d'exécution :
   ```bash
   sudo systemctl status ollama
   ```
2. Si le service est arrêté, démarrez-le :
   ```bash
   sudo systemctl start ollama
   ```
3. Vérifiez que le port 11434 est bien ouvert et écouté :
   ```bash
   sudo netstat -tuln | grep 11434
   ```
4. Redémarrez le service et l'application :
   ```bash
   sudo systemctl restart ollama
   sudo systemctl restart edinburgh-planner
   ```

### L'application React ne démarre pas

**Symptômes** : `systemctl status edinburgh-planner` montre "failed".

**Solutions** :
1. Vérifiez les journaux :
   ```bash
   sudo journalctl -u edinburgh-planner
   ```
2. Reconstruisez l'application :
   ```bash
   cd ~/edinburgh-planner
   npm run build
   sudo systemctl restart edinburgh-planner
   ```

### Le proxy CORS ne fonctionne pas

**Symptômes** : Erreurs CORS dans la console du navigateur.

**Solutions** :
1. Vérifiez l'état du service :
   ```bash
   sudo systemctl status cors-proxy
   ```
2. Redémarrez le service :
   ```bash
   sudo systemctl restart cors-proxy
   ```
3. Vérifiez que le port 8080 est bien ouvert :
   ```bash
   sudo netstat -tuln | grep 8080
   ```

## Problèmes d'utilisation

### L'application est lente à charger

**Symptômes** : Le chargement initial prend beaucoup de temps.

**Solutions** :
1. Le premier chargement est normalement plus lent car le modèle d'IA doit être chargé en mémoire.
2. Pour les Raspberry Pi avec moins de RAM, utilisez le modèle "phi" au lieu de "tinyllama" :
   ```bash
   ollama pull phi
   ```
   Et mettez à jour le fichier EdinburghPlanner.jsx :
   ```bash
   sed -i 's/model: "tinyllama"/model: "phi"/g' ~/edinburgh-planner/src/components/EdinburghPlanner.jsx
   npm run build
   sudo systemctl restart edinburgh-planner
   ```
3. Nettoyez le cache du navigateur ou essayez en mode navigation privée.

### L'assistant IA ne répond pas

**Symptômes** : L'assistant IA montre "chargement" continuellement ou ne répond pas.

**Solutions** :
1. Vérifiez que le service Ollama fonctionne :
   ```bash
   curl http://localhost:11434/api/tags
   ```
2. Redémarrez Ollama :
   ```bash
   sudo systemctl restart ollama
   ```
3. Vérifiez si le modèle est disponible :
   ```bash
   ollama list
   ```
4. Si le modèle n'est pas listé, réinstallez-le :
   ```bash
   ollama pull tinyllama
   # ou pour les Pi avec moins de RAM
   ollama pull phi
   ```
5. Pour les réponses très longues, le modèle peut prendre plus de temps ou échouer. Essayez de poser des questions plus courtes.

### Problèmes avec les API météo ou lieux

**Symptômes** : Erreurs lors de la recherche d'attractions ou de la météo.

**Solutions** :
1. Vérifiez la connectivité Internet :
   ```bash
   ping openweathermap.org
   ping nominatim.openstreetmap.org
   ```
2. Si vous utilisez des clés API, vérifiez qu'elles sont correctement configurées dans `src/config/apiKeys.js`.
3. Redémarrez le proxy CORS :
   ```bash
   sudo systemctl restart cors-proxy
   ```
4. Vérifiez les limites d'utilisation des API gratuites (OpenStreetMap limite à 1 requête/seconde).

### Les données de planification sont perdues

**Symptômes** : Les événements ou paramètres sont réinitialisés lors du rechargement.

**Solutions** :
1. Vérifiez que localStorage fonctionne dans votre navigateur :
   ```javascript
   // Dans la console du navigateur
   localStorage.setItem('test', 'test');
   console.log(localStorage.getItem('test'));
   ```
2. Exportez régulièrement votre planification à l'aide de la fonction d'exportation.
3. Vérifiez l'espace disponible dans localStorage :
   ```javascript
   // Dans la console du navigateur
   console.log(JSON.stringify(localStorage).length);
   ```
   Si la valeur est proche de 5 Mo, nettoyez d'autres données localStorage.

## Optimisations de performance

Si votre Raspberry Pi est lent, essayez ces optimisations :

1. **Désactivez les effets visuels** dans le système d'exploitation Raspberry Pi :
   ```bash
   sudo raspi-config
   # Puis allez dans "Performance Options" > "GPU Memory" et réduisez à 64 MB
   ```

2. **Augmentez la priorité des services** :
   ```bash
   sudo nano /etc/systemd/system/ollama.service
   # Ajoutez sous [Service]
   Nice=-10
   ```

3. **Nettoyez le cache périodiquement** :
   ```bash
   sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
   ```

4. **Utilisez un modèle plus léger** (phi au lieu de tinyllama).

5. **Ajoutez des paramètres de performance pour le service Ollama** :
   ```bash
   sudo nano /etc/systemd/system/ollama.service
   # Ajoutez sous [Service]
   Environment="OLLAMA_MODEL_PATH=/home/pi/ollama_models"
   Environment="OLLAMA_NUM_THREADS=2"
   
   # Puis créez le dossier
   mkdir -p ~/ollama_models
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

## Problèmes de stockage

Si vous rencontrez des problèmes liés à l'espace disque :

1. **Vérifiez l'espace disque disponible** :
   ```bash
   df -h
   ```

2. **Vérifiez la taille des modèles Ollama** :
   ```bash
   du -sh ~/.ollama
   ```

3. **Déplacez les modèles vers une carte SD externe** :
   ```bash
   # Montez votre périphérique externe
   sudo mkdir -p /mnt/external
   sudo mount /dev/sda1 /mnt/external
   
   # Arrêtez Ollama
   sudo systemctl stop ollama
   
   # Déplacez les données
   sudo rsync -av ~/.ollama/ /mnt/external/ollama/
   
   # Modifiez le service pour utiliser le nouvel emplacement
   sudo nano /etc/systemd/system/ollama.service
   # Ajoutez sous [Service]
   Environment="OLLAMA_MODELS=/mnt/external/ollama/models"
   
   # Redémarrez Ollama
   sudo systemctl daemon-reload
   sudo systemctl start ollama
   ```

## Encore des problèmes ?

Si vous rencontrez toujours des problèmes :

1. Consultez les [issues GitHub](https://github.com/furigly/travelplaner/issues) pour voir si d'autres utilisateurs ont rencontré le même problème.

2. Créez une nouvelle issue en fournissant :
   - Le modèle de votre Raspberry Pi
   - La version de Raspberry Pi OS
   - Les journaux pertinents (`journalctl -u ollama -n 100`)
   - Les étapes pour reproduire le problème

3. Essayez une réinstallation propre :
   ```bash
   sudo systemctl stop edinburgh-planner ollama cors-proxy
   sudo systemctl disable edinburgh-planner ollama cors-proxy
   sudo rm /etc/systemd/system/edinburgh-planner.service
   sudo rm /etc/systemd/system/ollama.service
   sudo rm /etc/systemd/system/cors-proxy.service
   sudo systemctl daemon-reload
   rm -rf ~/edinburgh-planner
   # Puis réinstallez en suivant le guide d'installation
   ```
