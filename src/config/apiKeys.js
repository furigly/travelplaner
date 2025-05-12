/**
 * Configuration des clés API pour le Planificateur d'Édimbourg
 * 
 * Ce fichier contient les clés API pour les services externes utilisés
 * par l'application. L'application peut fonctionner sans clés API en
 * utilisant les limites gratuites des services ou des APIs alternatives.
 * 
 * IMPORTANT: Ne jamais exposer vos clés API en les poussant vers un dépôt public!
 * Pour la production, créez un fichier apiKeys.production.js qui est listé dans .gitignore
 */

// Importer des clés de production si elles existent (non versionnées dans Git)
let productionKeys = {};
try {
  productionKeys = require('./apiKeys.production.js').default;
} catch (e) {
  // Fichier de production non trouvé, continuer avec les clés par défaut
  console.log('Aucun fichier de clés API de production trouvé, utilisation des valeurs par défaut');
}

// Configuration par défaut
const defaultKeys = {
  // OpenWeatherMap API - https://openweathermap.org/
  // Plan gratuit: 1000 appels par jour (60 appels/minute)
  // Alternative gratuite: si vide, utilise les données avec limite de requêtes stricte
  openWeather: '',
  
  // Google Places API - https://developers.google.com/maps/documentation/places/web-service/overview
  // Plan gratuit: 200$ de crédit mensuel (environ 28,500 requêtes)
  // Alternative gratuite: si vide, utilise OpenStreetMap (Nominatim)
  googlePlaces: '',
  
  // Options de configuration pour OpenStreetMap/Nominatim
  // Ne nécessite pas de clé API, mais respecte une utilisation équitable
  osm: {
    // Délai entre les requêtes pour respecter la politique d'utilisation
    requestDelay: 1000, // en millisecondes
    // Email de contact (recommandé pour une utilisation régulière)
    contactEmail: '', // Optionnel
    // Limite de requêtes par jour (auto-imposée)
    dailyLimit: 1000
  },
  
  // Configuration pour Ollama (IA locale)
  ollama: {
    // L'URL de l'API Ollama
    endpoint: 'http://localhost:11434/api/generate',
    // Le modèle à utiliser (défini automatiquement lors de l'installation)
    // "tinyllama" pour les Raspberry Pi avec >= 4GB RAM
    // "phi" pour les Raspberry Pi avec < 4GB RAM
    model: 'tinyllama',
    // Options du modèle
    options: {
      temperature: 0.7,   // Créativité (0.0 - 1.0)
      top_p: 0.9,         // Diversité des réponses
      top_k: 40,          // Nombre de tokens à considérer
      // Contexte système pour le modèle
      system: "Tu es un assistant de voyage spécialisé sur Édimbourg, en Écosse. Réponds de façon concise et utile en français."
    }
  }
};

// Fusionner les configurations par défaut et de production
const API_KEYS = { ...defaultKeys, ...productionKeys };

// Fonctions utilitaires pour la gestion des API
export const ApiUtils = {
  // Vérifier si une clé API est disponible
  hasKey: (keyName) => !!API_KEYS[keyName],
  
  // Obtenir l'URL de l'API météo avec ou sans clé
  getWeatherApiUrl: (city, params = {}) => {
    // Format de base de l'URL
    const baseUrl = 'https://api.openweathermap.org/data/2.5/forecast';
    
    // Paramètres par défaut
    const defaultParams = {
      q: city || 'Edinburgh,uk',
      units: 'metric',
      lang: 'fr'
    };
    
    // Fusionner les paramètres
    const queryParams = { ...defaultParams, ...params };
    
    // Ajouter la clé API si disponible
    if (API_KEYS.openWeather) {
      queryParams.appid = API_KEYS.openWeather;
    }
    
    // Construire l'URL
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    return `${baseUrl}?${queryString}`;
  },
  
  // Déterminer quelle API de recherche de lieux utiliser
  getPlacesApiType: () => {
    return API_KEYS.googlePlaces ? 'google' : 'osm';
  },
  
  // Construire l'URL pour la recherche de lieux
  getPlacesSearchUrl: (query, location = 'Edinburgh') => {
    if (API_KEYS.googlePlaces) {
      // Utiliser Google Places API
      return `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}+${location}&key=${API_KEYS.googlePlaces}&type=tourist_attraction|restaurant|cafe`;
    } else {
      // Utiliser OpenStreetMap/Nominatim
      return `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+${location}&format=json&addressdetails=1&limit=10&amenity=tourism`;
    }
  },
  
  // Obtenir les options pour l'IA locale
  getOllamaOptions: (customPrompt) => {
    return {
      model: API_KEYS.ollama.model,
      prompt: customPrompt,
      stream: false,
      options: API_KEYS.ollama.options
    };
  }
};

export default API_KEYS;
