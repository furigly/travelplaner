import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Clock, DollarSign, Bus, MapPin, Coffee, Beer, Utensils, Scissors, Search, Info, X, MessageSquare, Cloud, Sun, ChevronUp, ChevronDown, Settings, Download, FileText, Share2 } from 'lucide-react';

// Gérer la recherche d'attractions
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Recherche d'attractions via l'API
      const attractions = await fetchAttractions(term);
      setSearchResults(attractions);
      setShowSearchResults(attractions.length > 0);
      
      // Si peu de résultats, chercher plus largement avec l'API de recherche en ligne
      if (term.length >= 3 && attractions.length < 3) {
        const onlineResults = await searchOnline(term);
        
        // Combiner les résultats et éliminer les doublons par nom
        const allResults = [...attractions];
        
        onlineResults.forEach(onlineItem => {
          if (!allResults.some(localItem => localItem.name.toLowerCase() === onlineItem.name.toLowerCase())) {
            allResults.push(onlineItem);
          }
        });
        
        setSearchResults(allResults);
        setShowSearchResults(allResults.length > 0);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      
      // En cas d'erreur, afficher un message à l'utilisateur
      setAssistantMessages(prev => [...prev, { 
        text: "Désolé, j'ai rencontré un problème lors de la recherche d'attractions. Veuillez réessayer.", 
        sender: "assistant" 
      }]);
      
      setShowAssistant(true);
    } finally {
      setIsSearching(false);
    }
  }, [fetchAttractions, searchOnline, setAssistantMessages]);

  // Fonction pour rechercher en ligne via TripAdvisor Public API (avec proxy)
  const searchOnline = useCallback(async (searchTerm) => {
    try {
      // Utilisation de l'API TripAdvisor
      const apiKey = 'YOUR_TRIPADVISOR_API_KEY'; // Remplacez par votre clé API
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Proxy CORS si nécessaire
      const apiUrl = `https://api.tripadvisor.com/api/partner/2.0/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(searchTerm)}&category=attractions&location=edinburgh&language=fr`;
      
      const response = await fetch(proxyUrl + apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur API TripAdvisor: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convertir au format de notre application
      const results = data.data.map(item => {
        // Déterminer le type d'attraction
        let type = 'attraction';
        if (item.category.name.includes('Restaurant')) type = 'restaurant';
        if (item.category.name.includes('Café')) type = 'cafe';
        if (item.category.name.includes('Bar')) type = 'bar';
        if (item.category.name.includes('Shopping')) type = 'shopping';
        
        // Estimer la durée et le coût en fonction du type
        let duration = 90;
        let cost = 0;
        
        switch (type) {
          case 'restaurant': 
            duration = 90; 
            cost = 30; 
            break;
          case 'cafe': 
            duration = 45; 
            cost = 15; 
            break;
          case 'bar': 
            duration = 120; 
            cost = 25; 
            break;
          case 'shopping': 
            duration = 60; 
            cost = 0; 
            break;
          case 'attraction':
            duration = 90;
            // Estimer le coût en fonction de la catégorie
            if (item.category.name.includes('Musée')) {
              cost = 12;
            } else if (item.category.name.includes('Château') || 
                      item.category.name.includes('Palais')) {
              cost = 18;
            }
            break;
        }
        
        return {
          name: item.name,
          duration,
          cost,
          address: item.address_obj ? 
            `${item.address_obj.street1 || ''}, ${item.address_obj.city || 'Edinburgh'}` : 
            'Edinburgh',
          type,
          transport: "À définir",
          rating: item.rating || 0,
          tripadvisorId: item.location_id,
          photoUrl: item.photo?.images?.medium?.url
        };
      });
      
      return results;
    } catch (error) {
      console.error("Erreur lors de la recherche en ligne:", error);
      
      // En cas d'erreur, générer quelques résultats dynamiques basés sur le terme de recherche
      const lowerCaseSearch = searchTerm.toLowerCase();
      
      const dynamicResults = [
      ];
      
      return dynamicResults;
    }
  }, []);
  
  // Fonction pour communiquer avec l'API d'Ollama (IA locale)
  const fetchAssistantResponse = useCallback(async (message, events, travelDates) => {
    try {
      // Utilisation d'Ollama local pour les réponses intelligentes
      const apiUrl = 'http://localhost:11434/api/generate';
      
      // Créer un message contextualisé pour l'API
      const contextPrompt = `Tu es un assistant de voyage pour Édimbourg. L'utilisateur planifie un voyage du ${travelDates.start} au ${travelDates.end}. 
Ils ont déjà prévu ces activités: ${JSON.stringify(events.slice(0, 5).map(e => ({ 
  titre: e.title, 
  date: e.date, 
  duree: e.duration 
})))}. 
Réponds uniquement en français, de façon concise mais utile à ce message: "${message}"`;
      
      const requestBody = {
        model: "tinyllama", // ou "phi" pour les Raspberry Pi avec moins de RAM
        prompt: contextPrompt,
        stream: false
      };
      
      // Utiliser un proxy CORS local si nécessaire pour le développement
      const proxyUrl = ''; // 'http://localhost:8080/' si vous utilisez cors-anywhere
      
      const response = await fetch(proxyUrl + apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API Ollama: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || data.output || data.message || data.generated_text;
      
    } catch (error) {
      console.error("Erreur lors de la communication avec l'assistant:", error);
      
      // Réponses prédéfinies en cas d'erreur
      const lowerCaseMessage = message.toLowerCase();
      
      if (lowerCaseMessage.includes("bonjour") || lowerCaseMessage.includes("salut") || lowerCaseMessage.includes("hello")) {
        return "Bonjour ! Comment puis-je vous aider à planifier votre séjour à Édimbourg ?";
      } else if (lowerCaseMessage.includes("météo") || lowerCaseMessage.includes("temps") || lowerCaseMessage.includes("climat")) {
        return "En mai, la température moyenne à Édimbourg est d'environ 12°C avec des maximales autour de 15°C. C'est généralement un mois agréable, mais prévoyez toujours un imperméable car les averses sont fréquentes en Écosse !";
      } else if (lowerCaseMessage.includes("transport") || lowerCaseMessage.includes("déplacer") || lowerCaseMessage.includes("bus")) {
        return "Édimbourg est une ville très praticable à pied, surtout dans le centre. Pour des distances plus longues, le réseau de bus Lothian est excellent et propose des billets journaliers à environ 5£. Les taxis sont également disponibles mais plus coûteux.";
      } else if (lowerCaseMessage.includes("budget") || lowerCaseMessage.includes("coût") || lowerCaseMessage.includes("cher")) {
        return "Un budget moyen pour Édimbourg serait d'environ 100-150€ par jour et par personne, incluant l'hébergement, les repas et quelques attractions. Si vous visitez plusieurs sites payants, pensez au Royal Edinburgh Ticket qui offre un accès à 3 attractions majeures.";
      } else if (events.length > 0 && (lowerCaseMessage.includes("programme") || lowerCaseMessage.includes("suggestion"))) {
        return `Vous avez déjà prévu ${events.length} activités. Je suggère d'ajouter la visite du Château d'Édimbourg si ce n'est pas déjà fait, c'est un incontournable !`;
      } else {
        return "Je suis désolé, je rencontre des difficultés à me connecter au service d'IA local. Pourriez-vous reformuler votre question ou vérifier que le service Ollama est bien en cours d'exécution ?";
      }
    }
  }, []);
        

// Composants réutilisables
const Modal = ({ title, isOpen, onClose, bgColor, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed z-10 bottom-20 right-4 md:right-6 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className={`flex justify-between items-center p-3 border-b border-gray-200 ${bgColor} text-white rounded-t-lg`}>
        <h3 className="font-medium text-sm sm:text-base">{title}</h3>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

const FloatingButton = ({ onClick, bgColor, title, icon }) => (
  <button 
    className={`p-2 md:p-3 rounded-full shadow-lg ${bgColor} text-white`}
    onClick={onClick}
    title={title}
  >
    {icon}
  </button>
);

const EventCard = ({ event, onDelete, weatherIcon, convertCost, formatTime, getCurrencySymbol, travelMethods }) => (
  <div className={`flex flex-col p-3 border rounded-md ${event.weather && event.weather.type.includes('rain') ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'}`}>
    <div className="flex justify-between">
      <div className="flex items-center">
        <div className="mr-2 p-1 bg-blue-100 rounded">
          {event.isTravel 
            ? <span className="text-xl">{travelMethods.find(m => m.id === event.travelMethod)?.icon || "🚶"}</span>
            : event.typeIcon
          }
        </div>
        <div>
          <h4 className="font-medium">{event.title}</h4>
          <p className="text-sm text-gray-600">{event.address}</p>
        </div>
      </div>
      <div className="flex items-start">
        {event.weather && (
          <div className="mr-2" title={event.weather.description}>
            {weatherIcon(event.weather.type)}
          </div>
        )}
        <button 
          onClick={() => onDelete(event.id)}
          className="text-red-500 hover:text-red-700"
        >
          ×
        </button>
      </div>
    </div>
    
    <div className="flex mt-2 text-sm text-gray-600 space-x-4">
      <span className="flex items-center">
        <Clock size={14} className="mr-1" />
        {formatTime(event.startTime)} - {formatTime(event.endTime)} ({event.duration} min)
      </span>
      
      {!event.isTravel && (
        <span className="flex items-center">
          <DollarSign size={14} className="mr-1" />
          {convertCost(event.cost)} {getCurrencySymbol()}
        </span>
      )}
      
      {event.isTravel ? (
        <span className="flex items-center">
          {travelMethods.find(m => m.id === event.travelMethod)?.icon || "🚶"} {event.travelDistance} km
        </span>
      ) : event.transport ? (
        <span className="flex items-center">
          <Bus size={14} className="mr-1" />
          {event.transport}
        </span>
      ) : null}
    </div>
    
    {event.notes && (
      <p className="mt-1 text-sm italic">{event.notes}</p>
    )}
    
    {event.weather && event.weather.type.includes('rain') && (
      <p className="mt-1 text-xs text-blue-700 italic">{event.weather.recommendation}</p>
    )}
  </div>
);

// Hook personnalisé pour la persistance locale
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// Hook pour sauvegarder l'historique des actions pour undo/redo
const useActionHistory = (initialState) => {
  const [current, setCurrent] = useState(0);
  const [history, setHistory] = useState([initialState]);
  
  const setState = (action) => {
    const newState = typeof action === 'function' ? action(history[current]) : action;
    
    // Supprimer toutes les actions futures si nous avons fait des undo puis de nouvelles actions
    const newHistory = history.slice(0, current + 1);
    
    // Limiter l'historique à 50 états pour éviter la consommation excessive de mémoire
    if (newHistory.length >= 50) {
      newHistory.shift();
    } else {
      // Incrémenter la position actuelle seulement si nous n'avons pas atteint la limite
      setCurrent(current + 1);
    }
    
    setHistory([...newHistory, newState]);
    return newState;
  };
  
  const undo = () => {
    if (current > 0) {
      setCurrent(current - 1);
      return history[current - 1];
    }
    return history[current];
  };
  
  const redo = () => {
    if (current < history.length - 1) {
      setCurrent(current + 1);
      return history[current + 1];
    }
    return history[current];
  };
  
  const canUndo = current > 0;
  const canRedo = current < history.length - 1;
  
  return [history[current], setState, undo, redo, canUndo, canRedo];
};

const EdinburghPlanner = () => {
  // États persistants avec historique pour undo/redo
  const [eventsData, setEventsData, undoEvents, redoEvents, canUndoEvents, canRedoEvents] = 
    useActionHistory(JSON.parse(localStorage.getItem('edinburghPlanner_events') || '[]'));
  
  const [events, setEvents] = useState(eventsData);
  
  // Mettre à jour localStorage quand events change
  useEffect(() => {
    localStorage.setItem('edinburghPlanner_events', JSON.stringify(events));
  }, [events]);
  
  // Synchroniser events avec eventsData
  useEffect(() => {
    setEvents(eventsData);
  }, [eventsData]);
  
  // Autres états persistants réguliers
  const [travelDates, setTravelDates] = useLocalStorage('edinburghPlanner_travelDates', {
    start: '2025-05-15',
    end: '2025-05-19',
  });
  
  const [currency, setCurrency] = useLocalStorage('edinburghPlanner_currency', 'EUR');
  
  // États non persistants
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: travelDates.start,
    startTime: '09:00',
    duration: 60,
    cost: 0,
    type: 'attraction',
    address: '',
    transport: '',
    notes: '',
    isTravel: false,
    travelMethod: 'walk',
    travelDistance: 0,
    weather: null,
  });
  
  // États pour la recherche d'attractions
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // État pour les modaux
  const [showAssistant, setShowAssistant] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  
  // État pour l'assistant IA
  const [assistantMessages, setAssistantMessages] = useState([
    { 
      text: "Bonjour ! Je suis votre assistant personnel pour votre voyage à Édimbourg. Comment puis-je vous aider à planifier votre séjour du 15 au 19 mai ?", 
      sender: "assistant" 
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [assistantThinking, setAssistantThinking] = useState(false);
  const messagesEndRef = useRef(null);
  
  // États pour la météo
  const [weatherData, setWeatherData] = useLocalStorage('edinburghPlanner_weatherData', {});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState({});
  
  // État pour la gestion de l'export/import
  const fileInputRef = useRef(null);
  
  // État pour la validation des formulaires
  const [formErrors, setFormErrors] = useState({});

  // Types d'événements avec leurs icônes
  const eventTypes = [
    { id: 'attraction', name: 'Attraction', icon: <MapPin size={18} /> },
    { id: 'restaurant', name: 'Restaurant', icon: <Utensils size={18} /> },
    { id: 'cafe', name: 'Café', icon: <Coffee size={18} /> },
    { id: 'bar', name: 'Bar', icon: <Beer size={18} /> },
    { id: 'shopping', name: 'Shopping', icon: <Scissors size={18} /> },
  ];
  
  // Types de transport avec estimations de vitesse (km/h)
  const travelMethods = [
    { id: 'walk', name: 'À pied', speed: 4, icon: "🚶" },
    { id: 'bus', name: 'Bus', speed: 15, icon: "🚌" },
    { id: 'taxi', name: 'Taxi', speed: 30, icon: "🚕" },
    { id: 'tram', name: 'Tram', speed: 20, icon: "🚊" },
  ];

  // Memoized handlers pour éviter recréation
  const handleAssistantResponse = useCallback(async () => {
    if (!userMessage.trim()) return;
    
    setAssistantMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setUserMessage("");
    setAssistantThinking(true);
    
    try {
      // API fictive pour l'assistant IA - à remplacer par une vraie API
      const response = await fetchAssistantResponse(userMessage, events, travelDates);
      
      setAssistantThinking(false);
      setAssistantMessages(prev => [...prev, { text: userMessage, sender: "user" }, { text: response, sender: "assistant" }]);
    } catch (error) {
      console.error("Erreur lors de la communication avec l'assistant:", error);
      setAssistantThinking(false);
      setAssistantMessages(prev => [...prev, 
        { text: userMessage, sender: "user" }, 
        { text: "Désolé, je rencontre un problème technique. Pourriez-vous reformuler votre question ?", sender: "assistant" }
      ]);
    }
  }, [userMessage, events, travelDates]);

  // Fonction pour faire défiler automatiquement vers le dernier message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  
  // Effet pour le défilement des messages
  useEffect(() => {
    scrollToBottom();
  }, [assistantMessages, scrollToBottom]);
  
  // Effet pour mettre à jour la durée du trajet
  useEffect(() => {
    if (newEvent.isTravel) {
      setNewEvent(prev => ({
        ...prev,
        duration: calculateTravelDuration(prev.travelDistance, prev.travelMethod)
      }));
    }
  }, [newEvent.travelDistance, newEvent.travelMethod, newEvent.isTravel]);

  // Formater l'heure (HH:MM)
  const formatTime = useCallback((timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }, []);
  
  // Formater la date (jour de la semaine + jour du mois)
  const formatDate = useCallback((date) => {
    if (!date) return "";
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(date).toLocaleDateString('fr-FR', options);
  }, []);
  
  // Calculer l'heure de fin en fonction de l'heure de début et de la durée
  const calculateEndTime = useCallback((startTime, durationMinutes) => {
    if (!startTime) return "00:00";
    
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        return "00:00";
      }
      
      let totalMinutes = hours * 60 + minutes + (durationMinutes || 0);
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      
      return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    } catch (error) {
      console.error("Erreur lors du calcul de l'heure de fin:", error);
      return "00:00";
    }
  }, []);
  
  // Calculer la durée du trajet
  const calculateTravelDuration = useCallback((distance, method) => {
    const travelMethod = travelMethods.find(m => m.id === method);
    if (!travelMethod) return 15;
    
    const durationHours = distance / travelMethod.speed;
    const durationMinutes = Math.ceil(durationHours * 60);
    
    return Math.max(5, durationMinutes + (method !== 'walk' ? 5 : 0));
  }, [travelMethods]);
  
  // Générer les jours du voyage
  const getDaysArray = useCallback(() => {
    const days = [];
    const start = new Date(travelDates.start);
    const end = new Date(travelDates.end);
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [travelDates]);
  
  // Filtrer les événements par date
  const getEventsForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events]);
  
  // Supprimer un événement
  const handleDeleteEvent = useCallback((eventId) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  }, [setEvents]);
  
  // Obtenir l'icône en fonction du type d'événement
  const getEventIcon = useCallback((type) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType ? eventType.icon : <MapPin size={18} />;
  }, [eventTypes]);
  
  // Fonction pour convertir le coût en fonction de la devise
  const convertCost = useCallback((cost) => {
    const rates = {
      EUR: 1,
      GBP: 0.85,
      USD: 1.08
    };
    
    return (cost / rates[currency]).toFixed(2);
  }, [currency]);
  
  // Fonction pour obtenir le symbole de la devise
  const getCurrencySymbol = useCallback(() => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD': return '$';
      default: return '€';
    }
  }, [currency]);
  
  // Calculer le coût total
  const calculateTotalCost = useCallback(() => {
    const totalInEuros = events.reduce((total, event) => total + Number(event.cost), 0);
    return convertCost(totalInEuros);
  }, [events, convertCost]);

  // Vérifier s'il y a chevauchement entre événements
  const checkForOverlap = useCallback((newEvent) => {
    const eventsOnSameDay = events.filter(e => e.date === newEvent.date);
    
    const toMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const newEventStart = toMinutes(newEvent.startTime);
    const newEventEnd = toMinutes(calculateEndTime(newEvent.startTime, newEvent.duration));
    
    for (const event of eventsOnSameDay) {
      const eventStart = toMinutes(event.startTime);
      const eventEnd = toMinutes(event.endTime);
      
      if (
        (newEventStart < eventEnd && newEventEnd > eventStart) || 
        (eventStart < newEventEnd && eventEnd > newEventStart)
      ) {
        return event;
      }
    }
    
    return null;
  }, [events, calculateEndTime]);

  // Obtenir l'icône pour un type de météo
  const getWeatherIcon = useCallback((type) => {
    switch (type) {
      case 'sunny': return <Sun size={18} className="text-yellow-500" />;
      case 'partly_cloudy': return (
        <div className="relative">
          <Sun size={18} className="text-yellow-500" />
          <Cloud size={14} className="text-gray-400 absolute -top-1 -right-1" />
        </div>
      );
      case 'cloudy': return <Cloud size={18} className="text-gray-400" />;
      case 'light_rain': return (
        <div className="relative">
          <Cloud size={18} className="text-gray-500" />
          <div className="absolute bottom-0 left-1 w-0.5 h-2 bg-blue-400 rounded"></div>
        </div>
      );
      case 'rain': return (
        <div className="relative">
          <Cloud size={18} className="text-gray-600" />
          <div className="absolute bottom-0 left-1 w-0.5 h-2 bg-blue-500 rounded"></div>
          <div className="absolute bottom-0 left-3 w-0.5 h-2 bg-blue-500 rounded"></div>
        </div>
      );
      default: return <Cloud size={18} className="text-gray-400" />;
    }
  }, []);

  // Obtenir une description en français pour un type de météo
  const getWeatherDescription = useCallback((type, temp) => {
    switch (type) {
      case 'sunny': return `Ensoleillé, ${temp}°C`;
      case 'partly_cloudy': return `Partiellement nuageux, ${temp}°C`;
      case 'cloudy': return `Nuageux, ${temp}°C`;
      case 'light_rain': return `Légère pluie, ${temp}°C`;
      case 'rain': return `Pluvieux, ${temp}°C`;
      default: return `${temp}°C`;
    }
  }, []);
  
  // Obtenir une recommandation en fonction de la météo
  const getWeatherRecommendation = useCallback((type, temp, precipProb) => {
    if (type.includes('rain') || precipProb > 50) {
      return "N'oubliez pas votre parapluie et un imperméable!";
    } else if (type === 'cloudy' && temp < 12) {
      return "Prévoyez une veste légère, il pourrait faire frais.";
    } else if (type.includes('sunny') && temp > 15) {
      return "Bonne journée pour les activités extérieures!";
    } else if (type === 'partly_cloudy') {
      return "Temps variable, emportez une couche supplémentaire.";
    } else {
      return "Journée typique d'Édimbourg, soyez prêt à tout!";
    }
  }, []);

  // Fonction pour récupérer la météo pour tous les jours du voyage
  const fetchWeatherForAllDays = useCallback(async () => {
    try {
      setLoadingWeather(true);
      
      // Récupérer la météo pour tous les jours du voyage
      const dates = getDaysArray().map(date => date.toISOString().split('T')[0]);
      
      // Utiliser Promise.all pour toutes les requêtes en parallèle
      await Promise.all(dates.map(date => fetchWeatherForDate(date)));
      
      // Ajouter un message de l'assistant
      setAssistantMessages(prev => [...prev, { 
        text: "J'ai récupéré les prévisions météo pour votre séjour ! Cliquez sur les icônes météo pour voir les détails.", 
        sender: "assistant" 
      }]);
      
      setShowAssistant(true);
    } catch (error) {
      console.error("Erreur lors de la récupération de la météo pour tous les jours:", error);
      
      // Message d'erreur
      setAssistantMessages(prev => [...prev, { 
        text: "Désolé, je n'ai pas pu récupérer toutes les prévisions météo. Veuillez réessayer plus tard.", 
        sender: "assistant" 
      }]);
      
      setShowAssistant(true);
    } finally {
      setLoadingWeather(false);
    }
  }, [getDaysArray, fetchWeatherForDate, setAssistantMessages]);
         for (let i = 0; i < weatherTypes.length; i++) {
    cumulativeWeight += weatherWeights[i];
    if (random <= cumulativeWeight) {
      selectedWeather = weatherTypes[i];
      break;
    }
  }
      
      // Générer une température réaliste pour Édimbourg en mai (8-17°C)
      const temperature = Math.round((Math.random() * 9 + 8) * 10) / 10;
      
      // Probabilité de précipitation
      const precipitationProbability = selectedWeather.includes('rain') 
        ? Math.round(Math.random() * 50 + 50) // 50-100% pour la pluie
        : Math.round(Math.random() * 30); // 0-30% sinon
      
      // Vitesse du vent (Édimbourg est assez venteux)
      const windSpeed = Math.round((Math.random() * 15 + 5) * 10) / 10;
      
      const weatherInfo = {
        type: selectedWeather,
        temperature,
        precipitationProbability,
        windSpeed,
        description: getWeatherDescription(selectedWeather, temperature),
        recommendation: getWeatherRecommendation(selectedWeather, temperature, precipitationProbability)
      };
      
      // Mettre à jour le state avec la météo
      setWeatherData(prev => ({
        ...prev,
        [date]: weatherInfo
      }));
      
      setLoadingWeather(false);
      return weatherInfo;
    } catch (error) {
      console.error("Erreur lors de la récupération de la météo:", error);
      setLoadingWeather(false);
      
      // Afficher un message d'erreur via l'assistant
      setAssistantMessages(prev => [...prev, { 
        text: "Désolé, je n'ai pas pu récupérer les prévisions météo. Veuillez réessayer plus tard.", 
        sender: "assistant" 
      }]);
      
      return null;
    }
  }, [getWeatherDescription, getWeatherRecommendation, setWeatherData]);

  // Fonction pour vérifier la météo lors de l'ajout d'un événement
  const checkWeatherForEvent = useCallback(async (event) => {
    if (!weatherData[event.date]) {
      const weather = await fetchWeatherForDate(event.date);
      return {...event, weather};
    }
    return {...event, weather: weatherData[event.date]};
  }, [weatherData, fetchWeatherForDate]);

  // Fonction pour rechercher des attractions via Google Places API
  const fetchAttractions = useCallback(async (searchTerm) => {
    try {
      if (!searchTerm || searchTerm.length < 2) return [];
      
      // Utilisation de l'API Google Places
      const apiKey = 'YOUR_GOOGLE_PLACES_API_KEY'; // Remplacez par votre clé API
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Proxy CORS si nécessaire pour le dev
      const apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchTerm)}+edinburgh&key=${apiKey}&type=tourist_attraction|restaurant|cafe`;
      
      const response = await fetch(proxyUrl + apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur API Google Places: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Traitement des résultats
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error('Aucun résultat trouvé');
      }
      
      // Convertir les résultats au format attendu par l'application
      const attractions = await Promise.all(data.results.map(async place => {
        // Déterminer le type d'attraction
        let type = 'attraction';
        if (place.types.includes('restaurant')) type = 'restaurant';
        if (place.types.includes('cafe')) type = 'cafe';
        if (place.types.includes('bar')) type = 'bar';
        if (place.types.includes('store') || place.types.includes('shopping_mall')) type = 'shopping';
        
        // Récupérer plus de détails
        let duration = 60; // Durée par défaut
        let cost = 0; // Coût par défaut
        
        // Tenter de récupérer plus de détails avec un appel API Place Details si nécessaire
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=price_level,website,formatted_phone_number&key=${apiKey}`;
          const detailsResponse = await fetch(proxyUrl + detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            // Estimer le coût en fonction du niveau de prix
            if (detailsData.result.price_level) {
              // price_level est un entier de 0 (gratuit) à 4 (très cher)
              switch (detailsData.result.price_level) {
                case 1: cost = type === 'restaurant' ? 15 : 10; break;
                case 2: cost = type === 'restaurant' ? 25 : 15; break;
                case 3: cost = type === 'restaurant' ? 40 : 20; break;
                case 4: cost = type === 'restaurant' ? 60 : 30; break;
                default: cost = 0;
              }
            }
          }
        } catch (detailsError) {
          console.warn("Impossible de récupérer les détails:", detailsError);
          // Continuer avec les valeurs par défaut
        }
        
        // Estimer la durée en fonction du type
        switch (type) {
          case 'restaurant': duration = 90; break;
          case 'cafe': duration = 45; break;
          case 'bar': duration = 120; break;
          case 'shopping': duration = 60; break;
          case 'attraction': 
            if (place.name.toLowerCase().includes('museum') || 
                place.name.toLowerCase().includes('gallery')) {
              duration = 120;
            } else if (place.name.toLowerCase().includes('castle') || 
                       place.name.toLowerCase().includes('palace')) {
              duration = 150;
              cost = 18;
            } else {
              duration = 90;
            }
            break;
          default: duration = 60;
        }
        
        // Construire l'objet attraction
        return {
          name: place.name,
          duration,
          cost,
          address: place.formatted_address || place.vicinity || "Édimbourg",
          type,
          transport: "À définir",
          rating: place.rating || 0,
          placeId: place.place_id,
          location: place.geometry?.location,
          photoReference: place.photos?.[0]?.photo_reference
        };
      }));
      
      return attractions;
    } catch (error) {
      console.error("Erreur lors de la recherche d'attractions via Google Places:", error);
      
      // En cas d'erreur, utiliser les données locales comme fallback
      return getLocalAttractions(searchTerm);
    }
  }, []);
  
  // Base de données locale pour les attractions (fallback)
  const getLocalAttractions = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    // Base de données d'attractions d'Édimbourg
    const attractionsDatabase = [
      {
        name: "Edinburgh Castle",
        duration: 120,
        cost: 18,
        address: "Castlehill, Edinburgh EH1 2NG",
        type: "attraction",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.7
      },
      {
        name: "Royal Mile",
        duration: 90,
        cost: 0,
        address: "Royal Mile, Edinburgh",
        type: "attraction",
        transport: "Accessible à pied depuis le centre-ville",
        rating: 4.6
      },
      {
        name: "National Museum of Scotland",
        duration: 150,
        cost: 0,
        address: "Chambers St, Edinburgh EH1 1JF",
        type: "attraction",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.8
      },
      {
        name: "Arthur's Seat",
        duration: 120,
        cost: 0,
        address: "Queen's Dr, Edinburgh EH8 8HG",
        type: "attraction",
        transport: "Bus 6, 35 ou 49",
        rating: 4.9
      },
      {
        name: "Palace of Holyroodhouse",
        duration: 90,
        cost: 17.50,
        address: "Canongate, Edinburgh EH8 8DX",
        type: "attraction",
        transport: "Bus 6, 35 ou 36",
        rating: 4.5
      },
      {
        name: "Royal Yacht Britannia",
        duration: 120,
        cost: 19,
        address: "Ocean Terminal, Leith, Edinburgh EH6 6JJ",
        type: "attraction",
        transport: "Bus 11, 22 ou 35",
        rating: 4.8
      },
      {
        name: "Royal Botanic Garden",
        duration: 120,
        cost: 0,
        address: "Arboretum Pl, Edinburgh EH3 5NZ",
        type: "attraction",
        transport: "Bus 8, 23 ou 27",
        rating: 4.7
      },
      {
        name: "Camera Obscura",
        duration: 90,
        cost: 19.95,
        address: "Castlehill, Royal Mile, Edinburgh EH1 2ND",
        type: "attraction",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.6
      },
      {
        name: "The Scotch Whisky Experience",
        duration: 80,
        cost: 19,
        address: "354 Castlehill, Edinburgh EH1 2NE",
        type: "attraction",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.5
      },
      // Restaurants et cafés
      {
        name: "The Elephant House",
        duration: 60,
        cost: 15,
        address: "21 George IV Bridge, Edinburgh EH1 1EN",
        type: "cafe",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.3
      },
      {
        name: "The Witchery",
        duration: 120,
        cost: 45,
        address: "352 Castlehill, Edinburgh EH1 2NF",
        type: "restaurant",
        transport: "Bus 23, 27, 41, 42 ou 67",
        rating: 4.6
      },
      {
        name: "The Dome",
        duration: 90,
        cost: 35,
        address: "14 George St, Edinburgh EH2 2PF",
        type: "restaurant",
        transport: "Bus 8, 23, 27 ou 41",
        rating: 4.5
      }
    ];
    
    return attractionsDatabase.filter(
      attraction => attraction.name.toLowerCase().includes(lowerCaseSearch)
    );
  }, []);

  // Fonction pour rechercher en ligne via API (fictive)
  const searchOnline = useCallback(async (searchTerm) => {
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Exemple de résultats dynamiques
      const lowerCaseSearch = searchTerm.toLowerCase();
      
      const edPubs = [
        { name: `${searchTerm}'s Pub`, type: "bar", duration: 90, cost: 22, address: "32 Rose St, Edinburgh EH2 2NQ", transport: "Bus 10, 11, 16" },
        { name: `Highland ${searchTerm}`, type: "restaurant", duration: 100, cost: 35, address: "167 Canongate, Edinburgh EH8 8BN", transport: "Bus 6, 35" },
        { name: `${searchTerm} Tea Room`, type: "cafe", duration: 60, cost: 15, address: "28 Victoria St, Edinburgh EH1 2JW", transport: "Bus 23, 27, 41, 42" }
      ];
      
      return edPubs;
    } catch (error) {
      console.error("Erreur lors de la recherche en ligne:", error);
      return [];
    }
  }, []);

  // Gérer la recherche d'attractions
  const handleSearch = useCallback(async (term) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Recherche locale d'abord
      const localResults = await fetchAttractions(term);
      setSearchResults(localResults);
      setShowSearchResults(true);
      
      // Si le terme contient au moins 3 caractères et moins de 3 résultats locaux,
      // effectuer une recherche en ligne
      if (term.length >= 3 && localResults.length < 3) {
        const onlineResults = await searchOnline(term);
        
        // Combiner les résultats et éliminer les doublons par nom
        const allResults = [...localResults];
        
        onlineResults.forEach(onlineItem => {
          if (!allResults.some(localItem => localItem.name.toLowerCase() === onlineItem.name.toLowerCase())) {
            allResults.push(onlineItem);
          }
        });
        
        setSearchResults(allResults);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setIsSearching(false);
    }
  }, [fetchAttractions, searchOnline]);

  // Fonction pour simuler un appel à un assistant IA
  const fetchAssistantResponse = useCallback(async (message, events, travelDates) => {
    // Simuler un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerCaseMessage = message.toLowerCase();
    
    // Logique simple pour l'assistant
    if (lowerCaseMessage.includes("bonjour") || lowerCaseMessage.includes("salut") || lowerCaseMessage.includes("hello")) {
      return "Bonjour ! Comment puis-je vous aider à planifier votre séjour à Édimbourg ?";
    } else if (lowerCaseMessage.includes("météo") || lowerCaseMessage.includes("temps") || lowerCaseMessage.includes("climat")) {
      return "En mai, la température moyenne à Édimbourg est d'environ 12°C avec des maximales autour de 15°C. C'est généralement un mois agréable, mais prévoyez toujours un imperméable car les averses sont fréquentes en Écosse !";
    } else if (lowerCaseMessage.includes("transport") || lowerCaseMessage.includes("déplacer") || lowerCaseMessage.includes("bus")) {
      return "Édimbourg est une ville très praticable à pied, surtout dans le centre. Pour des distances plus longues, le réseau de bus Lothian est excellent et propose des billets journaliers à environ 5£. Les taxis sont également disponibles mais plus coûteux.";
    } else if (lowerCaseMessage.includes("budget") || lowerCaseMessage.includes("coût") || lowerCaseMessage.includes("cher")) {
      return "Un budget moyen pour Édimbourg serait d'environ 100-150€ par jour et par personne, incluant l'hébergement, les repas et quelques attractions. Si vous visitez plusieurs sites payants, pensez au Royal Edinburgh Ticket qui offre un accès à 3 attractions majeures.";
    } else if (lowerCaseMessage.includes("restaurant") || lowerCaseMessage.includes("manger") || lowerCaseMessage.includes("cuisine")) {
      return "Pour goûter à la cuisine écossaise traditionnelle, je vous recommande 'The Albanach' sur Royal Mile ou 'Whiski Bar & Restaurant'. Pour un repas plus gastronomique, 'The Witchery' près du château offre une expérience unique. N'oubliez pas d'essayer le haggis, plat national écossais !";
    } else if (lowerCaseMessage.includes("château") || lowerCaseMessage.includes("castle")) {
      return "Edinburgh Castle est l'attraction la plus populaire de la ville. Prévoyez environ 2 heures pour la visite. Je vous conseille d'arriver tôt (ouverture à 9h30) pour éviter les foules. N'oubliez pas d'assister au tir du canon de 13h, une tradition depuis 1861 !";
    } else if (
      events.length > 0 && 
      (lowerCaseMessage.includes("journée") || lowerCaseMessage.includes("programme") || lowerCaseMessage.includes("suggestion") || lowerCaseMessage.includes("recommande"))
    ) {
      // Générer une suggestion de programme
      return suggestActivities(travelDates.start);
    } else {
      // Réponse générique
      if (events.length === 0) {
        return "Je vois que vous n'avez pas encore ajouté d'activités à votre planning. Souhaitez-vous des suggestions pour commencer ? Edinburgh Castle et la Royal Mile sont incontournables pour une première visite.";
      } else {
        return `Vous avez déjà prévu ${events.length} activités pour votre séjour. N'hésitez pas à me demander des recommandations spécifiques pour vos centres d'intérêt !`;
      }
    }
  }, [events, travelDates]);

  // Créer une suggestion basée sur les événements existants
  const suggestActivities = useCallback((day) => {
    const dayEvents = events.filter(event => event.date === day);
    
    // Vérifier si la journée est vide ou chargée
    if (dayEvents.length === 0) {
      return `Je vois que vous n'avez encore rien prévu pour le ${formatDate(new Date(day))}. Que diriez-vous de commencer par Edinburgh Castle le matin et de visiter la Royal Mile ensuite ?`;
    } else if (dayEvents.length < 2) {
      return `Vous avez déjà prévu ${dayEvents[0].title}. Pour compléter votre journée du ${formatDate(new Date(day))}, que pensez-vous d'ajouter une visite au National Museum of Scotland ?`;
    } else {
      // Vérifier si la journée est trop chargée
      const totalDuration = dayEvents.reduce((total, event) => total + event.duration, 0);
      if (totalDuration > 480) { // Plus de 8 heures d'activités
        return `Attention, votre journée du ${formatDate(new Date(day))} semble très chargée avec ${dayEvents.length} activités totalisant ${Math.round(totalDuration/60)} heures. Envisagez peut-être de déplacer certaines activités à un autre jour.`;
      } else {
        return `Votre programme pour le ${formatDate(new Date(day))} semble bien équilibré ! N'oubliez pas de prévoir du temps pour les déplacements entre chaque lieu.`;
      }
    }
  }, [events, formatDate]);
