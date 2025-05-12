# Guide d'utilisation

Ce document explique comment utiliser le Planificateur d'Édimbourg pour organiser votre voyage de manière efficace.

## Accès à l'application

Après l'installation, l'application est accessible via votre navigateur web :

- **En local sur le Raspberry Pi** : http://localhost:5000
- **Depuis d'autres appareils** : http://IP_DU_RASPBERRY:5000 (remplacez IP_DU_RASPBERRY par l'adresse IP de votre Raspberry Pi)

## Interface principale

L'interface du Planificateur d'Édimbourg se compose de plusieurs sections :

1. **En-tête** : Titre de l'application et boutons d'accès aux paramètres et à l'aide
2. **Calendrier** : Affichage des jours de votre séjour avec les événements planifiés
3. **Formulaire d'ajout** : Pour ajouter de nouvelles activités ou trajets
4. **Assistant IA** : Un assistant virtuel alimenté par Ollama pour vous aider à planifier

## Planification de votre séjour

### Étape 1 : Définir les dates du voyage

1. Cliquez sur l'icône ⚙️ (Paramètres) dans l'en-tête
2. Dans la section "Dates du voyage", définissez les dates de début et de fin
3. Cliquez sur "Fermer" pour appliquer les changements

### Étape 2 : Consulter la météo

1. Cliquez sur le bouton "Voir météo" pour chaque jour
2. Les prévisions météo apparaîtront en haut de chaque journée
3. Cliquez sur l'icône météo pour voir plus de détails

### Étape 3 : Ajouter des activités

Pour ajouter une attraction ou activité :

1. Assurez-vous que l'onglet "Activité" est sélectionné dans le formulaire à droite
2. Recherchez un lieu à visiter (la recherche s'effectue dans la base de données d'Édimbourg)
3. Sélectionnez un résultat ou complétez manuellement les informations :
   - Titre
   - Type (attraction, restaurant, café, bar, shopping)
   - Coût
   - Adresse
   - Transport
4. Choisissez la date et l'heure
5. Définissez la durée prévue en minutes
6. Ajoutez des notes si nécessaire
7. Cliquez sur "Ajouter au planning"

### Étape 4 : Ajouter des trajets

Pour planifier vos déplacements :

1. Cliquez sur l'onglet "Trajet" dans le formulaire à droite
2. Sélectionnez le mode de transport (à pied, bus, taxi, tram)
3. Indiquez la distance en kilomètres
4. Donnez un titre au trajet (ex: "Trajet vers Edinburgh Castle")
5. Choisissez la date et l'heure de départ
6. Notez que la durée est calculée automatiquement en fonction du mode de transport
7. Cliquez sur "Ajouter au planning"

### Étape 5 : Organiser votre journée

Sur le calendrier, vous pouvez :

1. Voir tous les événements planifiés par jour
2. Supprimer un événement en cliquant sur le "×" à droite
3. Consulter la météo prévue pour chaque jour
4. Voir les coûts, durées et distances totales en bas du calendrier

## Utilisation de l'Assistant IA

L'assistant alimenté par Ollama peut vous aider à planifier votre séjour :

1. Cliquez sur l'icône 💬 (Assistant IA) en bas ou à droite de l'écran
2. Posez vos questions, par exemple :
   - "Quelles sont les meilleures attractions à Édimbourg ?"
   - "Suggère-moi un itinéraire pour demain"
   - "Quel quartier est le mieux pour manger ?"
   - "Comment aller de l'hôtel au château d'Édimbourg ?"
3. L'assistant utilise l'IA locale pour vous répondre sans envoyer de données à l'extérieur

## Fonctionnalités avancées

### Exportation et importation

Pour sauvegarder ou partager votre planning :

1. Cliquez sur l'icône 📄 (Exporter/Importer)
2. Choisissez "Exporter mon planning" pour télécharger un fichier JSON
3. Utilisez "Importer un planning" pour charger un fichier précédemment exporté

### Gestion des devises

Pour changer la devise affichée :

1. Cliquez sur l'icône ⚙️ (Paramètres)
2. Dans la section "Devise", sélectionnez EUR (Euro), GBP (Livre Sterling) ou USD (Dollar américain)
3. Les coûts seront automatiquement convertis

### Vérification des chevauchements

Lorsque vous ajoutez un événement qui chevauche un événement existant :

1. L'assistant vous avertira du chevauchement
2. Vous pouvez choisir de modifier l'heure ou d'ajouter l'événement quand même

## Astuces et conseils

### Optimisation pour Raspberry Pi

- Le premier chargement peut être lent car le modèle d'IA doit être chargé en mémoire
- Pour de meilleures performances, fermez les autres applications en arrière-plan
- Si vous avez un Raspberry Pi avec 2 Go de RAM ou moins, l'application utilisera automatiquement un modèle d'IA plus léger

### Organisation efficace

1. **Commencez par les attractions majeures** : Planifiez d'abord les sites incontournables
2. **Regroupez géographiquement** : Organisez les activités par quartier pour minimiser les déplacements
3. **Prévoyez des pauses** : Ajoutez du temps libre entre les activités
4. **Consultez la météo** : Planifiez les activités d'extérieur les jours de beau temps

### Bonnes pratiques

1. **Exportez régulièrement** : Sauvegardez votre planning pour éviter de perdre des données
2. **Synchronisez les jours** : Vérifiez les temps de trajet entre les attractions
3. **Activez les notifications** : Pour être averti si la météo change pour un jour planifié

## Que faire si...

### L'assistant ne répond pas

1. Vérifiez que le service Ollama fonctionne (`sudo systemctl status ollama`)
2. Redémarrez l'application si nécessaire (`sudo systemctl restart edinburgh-planner`)
3. Essayez de poser des questions plus courtes et précises

### Vous souhaitez modifier un événement

Actuellement, la modification directe n'est pas prise en charge. À la place :

1. Supprimez l'événement existant
2. Ajoutez-le à nouveau avec les informations mises à jour

### Vous voulez voir les coûts totaux par type

Les coûts totaux sont affichés en bas du calendrier. Pour un détail par type :

1. Ouvrez la console du navigateur (F12)
2. Exécutez le code JavaScript suivant :
   ```javascript
   const events = JSON.parse(localStorage.getItem('edinburghPlanner_events') || '[]');
   const costsByType = events.reduce((acc, event) => {
     acc[event.type] = (acc[event.type] || 0) + event.cost;
     return acc;
   }, {});
   console.table(costsByType);
   ```

## Raccourcis clavier

- **Alt+A** : Ouvrir le formulaire d'ajout d'activité
- **Alt+T** : Ouvrir le formulaire d'ajout de trajet
- **Alt+S** : Ouvrir les paramètres
- **Alt+H** : Ouvrir l'assistant IA
- **Alt+E** : Ouvrir le panneau d'exportation/importation
- **Échap** : Fermer les panneaux ouverts
