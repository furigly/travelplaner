# Planificateur de Voyage à Édimbourg pour Raspberry Pi

Un planificateur de voyage complet pour Édimbourg, optimisé pour fonctionner sur Raspberry Pi avec IA locale via Ollama.

![Capture d'écran du Planificateur d'Édimbourg](docs/screenshots/main-screen.png)

## Caractéristiques

- 📅 **Planification d'itinéraire** : Organisez votre séjour à Édimbourg jour par jour
- 🔍 **Recherche d'attractions** : Trouvez des lieux à visiter, restaurants, et activités
- 🌦️ **Prévisions météo** : Consultez la météo pour chaque jour de votre séjour
- 🚶 **Trajets et transports** : Ajoutez des trajets avec estimations de durée
- 💬 **Assistant IA local** : Conseils personnalisés via Ollama (sans coût supplémentaire)
- 💾 **Persistance locale** : Sauvegarde automatique de votre planning
- 📱 **Responsive design** : Fonctionne sur tous les appareils

## Avantages

- **100% local** : Aucune dépendance à des services cloud payants
- **Open source** : Entièrement modifiable et extensible
- **Respectueux de la vie privée** : Toutes les données restent sur votre Raspberry Pi
- **Faible consommation** : Optimisé pour les ressources limitées du Raspberry Pi
- **Installation facile** : Script d'installation automatique

## Prérequis

- Raspberry Pi 3 ou plus récent (Pi 4 avec 4GB+ RAM recommandé)
- Raspberry Pi OS 64-bit (Bullseye ou plus récent)
- Connexion Internet (pour l'installation et les données météo)

## Installation rapide

```bash
# Clonez le dépôt
git clone https://github.com/furigly/travelplaner.git
cd travelplaner

# Rendez le script d'installation exécutable
chmod +x install.sh

# Lancez l'installation
./install.sh
```

L'installation prend environ 10-20 minutes selon votre connexion internet et votre modèle de Raspberry Pi.

## Utilisation

Après l'installation, accédez à l'application via votre navigateur :

- En local sur le Raspberry Pi : http://localhost:5000
- Depuis d'autres appareils sur le même réseau : http://IP_DU_RASPBERRY:5000

## Documentation

- [Guide d'installation détaillé](docs/INSTALLATION.md)
- [Options de configuration](docs/CONFIGURATION.md)
- [Résolution des problèmes](docs/TROUBLESHOOTING.md)

## Technologies utilisées

- **Frontend** : React, Tailwind CSS
- **IA locale** : Ollama avec modèles tinyllama/phi
- **APIs gratuites** : OpenWeatherMap, OpenStreetMap, OSRM
- **Persistance** : localStorage avec historique d'actions (undo/redo)

## Contributions

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
