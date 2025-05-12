<input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAssistantResponse(e);
                  }
                }}
                placeholder="Posez une question..."
                className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                aria-label="Message à l'assistant"
              />import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar, Clock, DollarSign, Bus, MapPin, Coffee, Beer, Utensils, Scissors, Search, Info, X, MessageSquare, Cloud, Sun, ChevronUp, ChevronDown, Settings, Download, FileText, Share2 } from 'lucide-react';

const EdinburghPlanner = () => {
  // États pour les dates de voyage
  const [travelDates, setTravelDates] = useState({
    start: '2025-05-15',
    end: '2025-05-19',
  });

  // États pour la liste des événements
  const [events, setEvents] = useState([]);
  
  // État pour le nouvel événement en cours d'ajout
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2025-05-15',
    startTime: '09:00',
    duration: 60,
    cost: 0,
    type: 'attraction',
    address: '',
    transport: '',
    notes: '',
    isTravel: false,  // Attribut pour indiquer si c'est un trajet
    travelMethod: 'walk', // Méthode de déplacement par défaut
    travelDistance: 0, // Distance en km
    weather: null, // Météo prévue
  });
  
  // États pour la recherche d'attractions
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // État pour l'assistant IA
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    { 
      text: "Bonjour ! Je suis votre assistant personnel pour votre voyage à Édimbourg. Comment puis-je vous aider à planifier votre séjour du 15 au 19 mai ?", 
      sender: "assistant" 
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [assistantThinking, setAssistantThinking] = useState(false);
  const messagesEndRef = useRef(null);
  
  // États pour la nouvelle météo simulée
  const [weatherData, setWeatherData] = useState({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [showWeatherDetails, setShowWeatherDetails] = useState({});
  
  // État pour la gestion de l'export/import
  const [showExportPanel, setShowExportPanel] = useState(false);
  const fileInputRef = useRef(null);

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
  
  // Base de données d'attractions d'Édimbourg avec leurs informations
  const attractionsDatabase = [
    {
      name: "Edinburgh Castle",
      duration: 120, // Durée moyenne en minutes
      cost: 18, // Coût moyen en euros
      address: "Castlehill, Edinburgh EH1 2NG",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "Royal Mile",
      duration: 90,
      cost: 0,
      address: "Royal Mile, Edinburgh",
      type: "attraction",
      transport: "Accessible à pied depuis le centre-ville"
    },
    {
      name: "National Museum of Scotland",
      duration: 150,
      cost: 0,
      address: "Chambers St, Edinburgh EH1 1JF",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "Arthur's Seat",
      duration: 120,
      cost: 0,
      address: "Queen's Dr, Edinburgh EH8 8HG",
      type: "attraction",
      transport: "Bus 6, 35 ou 49"
    },
    {
      name: "Palace of Holyroodhouse",
      duration: 90,
      cost: 17.50,
      address: "Canongate, Edinburgh EH8 8DX",
      type: "attraction",
      transport: "Bus 6, 35 ou 36"
    },
    {
      name: "Royal Yacht Britannia",
      duration: 120,
      cost: 19,
      address: "Ocean Terminal, Leith, Edinburgh EH6 6JJ",
      type: "attraction",
      transport: "Bus 11, 22 ou 35"
    },
    {
      name: "Royal Botanic Garden",
      duration: 120,
      cost: 0,
      address: "Arboretum Pl, Edinburgh EH3 5NZ",
      type: "attraction",
      transport: "Bus 8, 23 ou 27"
    },
    {
      name: "Camera Obscura",
      duration: 90,
      cost: 19.95,
      address: "Castlehill, Royal Mile, Edinburgh EH1 2ND",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "The Scotch Whisky Experience",
      duration: 80,
      cost: 19,
      address: "354 Castlehill, Edinburgh EH1 2NE",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "St Giles' Cathedral",
      duration: 60,
      cost: 0,
      address: "High St, Edinburgh EH1 1RE",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "Scottish National Gallery",
      duration: 90,
      cost: 0,
      address: "The Mound, Edinburgh EH2 2EL",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "Calton Hill",
      duration: 60,
      cost: 0,
      address: "Edinburgh EH7 5AA",
      type: "attraction",
      transport: "Bus 8, 23 ou 27"
    },
    {
      name: "The Elephant House",
      duration: 60,
      cost: 15,
      address: "21 George IV Bridge, Edinburgh EH1 1EN",
      type: "cafe",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "The Witchery",
      duration: 120,
      cost: 45,
      address: "352 Castlehill, Edinburgh EH1 2NF",
      type: "restaurant",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "The Dome",
      duration: 90,
      cost: 35,
      address: "14 George St, Edinburgh EH2 2PF",
      type: "restaurant",
      transport: "Bus 8, 23, 27 ou 41"
    },
    {
      name: "Cold Town House",
      duration: 90,
      cost: 25,
      address: "4 Grassmarket, Edinburgh EH1 2JU",
      type: "bar",
      transport: "Bus 2, 35 ou 67"
    },
    {
      name: "The Devil's Advocate",
      duration: 90,
      cost: 30,
      address: "9 Advocate's Cl, Edinburgh EH1 1ND",
      type: "bar",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "Princes Street Gardens",
      duration: 60,
      cost: 0,
      address: "Princes St, Edinburgh EH2 2HG",
      type: "attraction",
      transport: "Bus 1, 10, 11, 16, 22 ou 30"
    },
    {
      name: "Dean Village",
      duration: 70,
      cost: 0,
      address: "Dean Path, Edinburgh EH4 3AY",
      type: "attraction",
      transport: "Bus 19, 36, 37 ou 47"
    },
    {
      name: "Edinburgh Dungeon",
      duration: 70,
      cost: 18.50,
      address: "31 Market St, Edinburgh EH1 1DF",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    },
    {
      name: "White Hart Inn",
      duration: 120,
      cost: 25,
      address: "34 Grassmarket, Edinburgh EH1 2JU",
      type: "bar",
      transport: "Bus 2, 23, 35 ou 67"
    },
    {
      name: "Greyfriars Bobby's Bar",
      duration: 90,
      cost: 20,
      address: "30-34 Candlemaker Row, Edinburgh EH1 2QE",
      type: "bar",
      transport: "Bus 2, 23, 27, 35, 41, 42"
    },
    {
      name: "The Sheep Heid Inn",
      duration: 120,
      cost: 30,
      address: "43-45 The Causeway, Edinburgh EH15 3QA",
      type: "restaurant",
      transport: "Bus 42 ou 44"
    },
    {
      name: "Dynamic Earth",
      duration: 120,
      cost: 16.50,
      address: "Holyrood Rd, Edinburgh EH8 8AS",
      type: "attraction",
      transport: "Bus 6, 35 ou 36"
    },
    {
      name: "Mary King's Close",
      duration: 60,
      cost: 18.95,
      address: "2 Warriston's Close, High St, Edinburgh EH1 1PG",
      type: "attraction",
      transport: "Bus 23, 27, 41, 42 ou 67"
    }
  ];
  
  // Fonction pour faire défiler automatiquement vers le dernier message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Faire défiler vers le bas lors de l'ajout d'un message
  useEffect(() => {
    scrollToBottom();
  }, [assistantMessages]);
  
  // Mettre à jour la durée du trajet lors du changement de distance ou de méthode
  useEffect(() => {
    if (newEvent.isTravel) {
      setNewEvent(prev => ({
        ...prev,
        duration: calculateTravelDuration(prev.travelDistance, prev.travelMethod)
      }));
    }
  }, [newEvent.travelDistance, newEvent.travelMethod, newEvent.isTravel]);
  
  // Fonction pour filtrer les attractions par nom de recherche
  const filterAttractions = (searchTerm) => {
    if (!searchTerm) return [];
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    return attractionsDatabase.filter(
      attraction => attraction.name.toLowerCase().includes(lowerCaseSearch)
    );
  };
  
  // Fonction pour simuler une recherche en ligne (API fictive)
  const searchOnline = async (searchTerm) => {
    // Simuler un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Générer des résultats fictifs basés sur le terme de recherche
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    // Liste de lieux fictifs à Édimbourg avec des types différents
    const edPubs = [
      { name: `${searchTerm}'s Pub`, type: "bar", duration: 90, cost: 22, address: "32 Rose St, Edinburgh EH2 2NQ", transport: "Bus 10, 11, 16" },
      { name: `Highland ${searchTerm}`, type: "restaurant", duration: 100, cost: 35, address: "167 Canongate, Edinburgh EH8 8BN", transport: "Bus 6, 35" },
      { name: `${searchTerm} Tea Room`, type: "cafe", duration: 60, cost: 15, address: "28 Victoria St, Edinburgh EH1 2JW", transport: "Bus 23, 27, 41, 42" }
    ];
    
    // Filtre des attractions qui pourraient ressembler au terme de recherche
    return edPubs.filter(place => 
      place.name.toLowerCase().includes(lowerCaseSearch)
    );
  };
  
  // Recherche combinée (base de données locale + recherche en ligne)
  const handleSearch = async (term) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setShowSearchResults(false);
      return;
    }
    
    // Recherche locale d'abord
    const localResults = filterAttractions(term);
    
    // Si le terme contient au moins 3 caractères et moins de 3 résultats locaux,
    // effectuer une recherche en ligne
    if (term.length >= 3 && localResults.length < 3) {
      setIsSearching(true);
      setSearchResults(localResults);
      setShowSearchResults(true);
      
      try {
        const onlineResults = await searchOnline(term);
        // Combiner les résultats et éliminer les doublons par nom
        const allResults = [...localResults];
        
        onlineResults.forEach(onlineItem => {
          // Ajouter seulement si le nom n'existe pas déjà dans les résultats
          if (!allResults.some(localItem => localItem.name.toLowerCase() === onlineItem.name.toLowerCase())) {
            allResults.push(onlineItem);
          }
        });
        
        setSearchResults(allResults);
      } catch (error) {
        console.error("Erreur lors de la recherche en ligne:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Utiliser uniquement les résultats locaux
      setSearchResults(localResults);
      setShowSearchResults(term.length >= 2 && localResults.length > 0);
    }
  };
  
  // Vérifier les chevauchements horaires entre événements
  const checkForOverlap = useCallback((newEvent) => {
    const eventsOnSameDay = events.filter(e => e.date === newEvent.date);
    
    // Convertir les heures en minutes pour une comparaison facile
    const toMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
    };
    
    const newEventStart = toMinutes(newEvent.startTime);
    const newEventEnd = toMinutes(calculateEndTime(newEvent.startTime, newEvent.duration));
    
    for (const event of eventsOnSameDay) {
      const eventStart = toMinutes(event.startTime);
      const eventEnd = toMinutes(event.endTime);
      
      // Vérifier s'il y a chevauchement
      if (
        (newEventStart < eventEnd && newEventEnd > eventStart) || 
        (eventStart < newEventEnd && eventEnd > newEventStart)
      ) {
        return event; // Retourner l'événement avec lequel il y a chevauchement
      }
    }
    
    return null; // Pas de chevauchement
  }, [events, calculateEndTime]);
  
  // Générer les jours du voyage
  const getDaysArray = useMemo(() => {
    const days = [];
    const start = new Date(travelDates.start);
    const end = new Date(travelDates.end);
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [travelDates.start, travelDates.end]);
  
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
      const newHours = Math.floor(totalMinutes / 60) % 24; // Assure que l'heure reste dans une journée
      const newMinutes = totalMinutes % 60;
      
      return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    } catch (error) {
      console.error("Erreur lors du calcul de l'heure de fin:", error);
      return "00:00";
    }
  }, []);
  
  // Calculer la durée du trajet en fonction de la distance et du mode de transport
  const calculateTravelDuration = (distance, method) => {
    const travelMethod = travelMethods.find(m => m.id === method);
    if (!travelMethod) return 15; // Durée par défaut si la méthode n'est pas trouvée
    
    // Calculer la durée en minutes
    const durationHours = distance / travelMethod.speed;
    const durationMinutes = Math.ceil(durationHours * 60);
    
    // Ajouter un peu de marge pour les temps d'attente, etc.
    return Math.max(5, durationMinutes + (method !== 'walk' ? 5 : 0));
  };
  
  // Filtrer les événements par date - utilisation de useMemo pour optimiser la performance
  const getEventsForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events]);
  
  // Supprimer un événement
  const handleDeleteEvent = (eventId) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };
  
  // Obtenir l'icône en fonction du type d'événement
  const getEventIcon = (type) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType ? eventType.icon : <MapPin size={18} />;
  };
  
  // Obtenir une description en français pour un type de météo
  const getWeatherDescription = (type, temp) => {
    switch (type) {
      case 'sunny': return `Ensoleillé, ${temp}°C`;
      case 'partly_cloudy': return `Partiellement nuageux, ${temp}°C`;
      case 'cloudy': return `Nuageux, ${temp}°C`;
      case 'light_rain': return `Légère pluie, ${temp}°C`;
      case 'rain': return `Pluvieux, ${temp}°C`;
      default: return `${temp}°C`;
    }
  };
  
  // Obtenir une recommandation en fonction de la météo
  const getWeatherRecommendation = (type, temp, precipProb) => {
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
  };
  
  // Obtenir l'icône pour un type de météo
  const getWeatherIcon = (type) => {
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
  };
  
  // Fonction pour simuler la météo pour un jour donné
  const fetchWeatherForDate = async (date) => {
    setLoadingWeather(true);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Générer des données météo aléatoires mais réalistes pour Édimbourg en mai
    const weatherTypes = ['sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'rain'];
    const weatherWeights = [0.2, 0.3, 0.2, 0.2, 0.1]; // Pondération pour Édimbourg en mai
    
    // Sélection pondérée du type de météo
    let random = Math.random();
    let cumulativeWeight = 0;
    let selectedWeather = weatherTypes[weatherTypes.length - 1];
    
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
    
    setWeatherData(prev => ({
      ...prev,
      [date]: weatherInfo
    }));
    
    setLoadingWeather(false);
    return weatherInfo;
  };
  
  // Fonction pour vérifier la météo lors de l'ajout d'un événement
  const checkWeatherForEvent = async (event) => {
    if (!weatherData[event.date]) {
      const weather = await fetchWeatherForDate(event.date);
      return {...event, weather};
    }
    return {...event, weather: weatherData[event.date]};
  };
  
  // Gérer l'ajout d'un nouvel événement
  const handleAddEvent = useCallback(async () => {
    if (!newEvent.title) return;
    
    // Vérifier s'il y a des chevauchements horaires
    const overlappingEvent = checkForOverlap(newEvent);
    if (overlappingEvent) {
      // Ajouter un message d'alerte via l'assistant
      setAssistantMessages(prevMessages => [
        ...prevMessages, 
        { 
          text: `Attention : Il y a un chevauchement avec "${overlappingEvent.title}" qui se déroule de ${formatTime(overlappingEvent.startTime)} à ${formatTime(overlappingEvent.endTime)}. Vous pourriez vouloir ajuster l'heure ou la durée.`, 
          sender: "assistant" 
        }
      ]);
      setShowAssistant(true);
      
      // Continuer quand même, car l'utilisateur peut vouloir des événements qui se chevauchent
    }
    
    const startTime = newEvent.startTime;
    const endTime = calculateEndTime(newEvent.startTime, newEvent.duration);
    
    // Vérifier la météo pour cette date
    const eventWithWeather = await checkWeatherForEvent({
      ...newEvent,
      id: Date.now(),
      endTime,
    });
    
    setEvents(prevEvents => [...prevEvents, eventWithWeather]);
    
    // Réinitialiser le formulaire
    setNewEvent({
      title: '',
      date: newEvent.date,
      startTime: endTime, // Définir l'heure de début suivante à l'heure de fin précédente
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
  }, [newEvent, checkForOverlap, formatTime, calculateEndTime, checkWeatherForEvent, setAssistantMessages, setShowAssistant]); ajuster l'heure ou la durée.`, 
          sender: "assistant" 
        }
      ]);
      setShowAssistant(true);
      
      // Continuer quand même, car l'utilisateur peut vouloir des événements qui se chevauchent
    }
    
    const startTime = newEvent.startTime;
    const endTime = calculateEndTime(newEvent.startTime, newEvent.duration);
    
    // Vérifier la météo pour cette date
    const eventWithWeather = await checkWeatherForEvent({
      ...newEvent,
      id: Date.now(),
      endTime,
    });
    
    setEvents([...events, eventWithWeather]);
    
    // Réinitialiser le formulaire
    setNewEvent({
      title: '',
      date: newEvent.date,
      startTime: endTime, // Définir l'heure de début suivante à l'heure de fin précédente
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
  };
  
  // Fonction pour traiter la requête de l'utilisateur et fournir une réponse IA
  const handleAssistantResponse = useCallback(async (e) => {
    if (e && e.type === 'keypress' && e.key !== 'Enter') return;
    if (!userMessage.trim()) return;
    
    // Ajouter le message de l'utilisateur à la conversation
    setAssistantMessages(prevMessages => [...prevMessages, { text: userMessage, sender: "user" }]);
    setUserMessage("");
    setAssistantThinking(true);
    
    // Simuler un délai pour "réfléchir"
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let response = "";
    const lowerCaseMessage = userMessage.toLowerCase();
    
    // Analyser le message et générer une réponse appropriée
    if (lowerCaseMessage.includes("bonjour") || lowerCaseMessage.includes("salut") || lowerCaseMessage.includes("hello")) {
      response = "Bonjour ! Comment puis-je vous aider à planifier votre séjour à Édimbourg ?";
    } else if (lowerCaseMessage.includes("météo") || lowerCaseMessage.includes("temps") || lowerCaseMessage.includes("climat")) {
      response = "En mai, la température moyenne à Édimbourg est d'environ 12°C avec des maximales autour de 15°C. C'est généralement un mois agréable, mais prévoyez toujours un imperméable car les averses sont fréquentes en Écosse !";
    } else if (lowerCaseMessage.includes("transport") || lowerCaseMessage.includes("déplacer") || lowerCaseMessage.includes("bus")) {
      response = "Édimbourg est une ville très praticable à pied, surtout dans le centre. Pour des distances plus longues, le réseau de bus Lothian est excellent et propose des billets journaliers à environ 5£. Les taxis sont également disponibles mais plus coûteux.";
    } else if (lowerCaseMessage.includes("budget") || lowerCaseMessage.includes("coût") || lowerCaseMessage.includes("cher")) {
      response = "Un budget moyen pour Édimbourg serait d'environ 100-150€ par jour et par personne, incluant l'hébergement, les repas et quelques attractions. Si vous visitez plusieurs sites payants, pensez au Royal Edinburgh Ticket qui offre un accès à 3 attractions majeures.";
    } else if (lowerCaseMessage.includes("restaurant") || lowerCaseMessage.includes("manger") || lowerCaseMessage.includes("cuisine")) {
      response = "Pour goûter à la cuisine écossaise traditionnelle, je vous recommande 'The Albanach' sur Royal Mile ou 'Whiski Bar & Restaurant'. Pour un repas plus gastronomique, 'The Witchery' près du château offre une expérience unique. N'oubliez pas d'essayer le haggis, plat national écossais !";
    } else if (lowerCaseMessage.includes("château") || lowerCaseMessage.includes("castle")) {
      response = "Edinburgh Castle est l'attraction la plus populaire de la ville. Prévoyez environ 2 heures pour la visite. Je vous conseille d'arriver tôt (ouverture à 9h30) pour éviter les foules. N'oubliez pas d'assister au tir du canon de 13h, une tradition depuis 1861 !";
    } else if (lowerCaseMessage.includes("royal mile")) {
      response = "La Royal Mile est l'artère principale de la vieille ville. Elle relie le château à Holyrood Palace. En vous promenant, vous découvrirez de nombreuses boutiques, pubs et attractions comme St Giles Cathedral. Prenez le temps d'explorer les 'closes' (ruelles) qui partent de chaque côté.";
    } else if (lowerCaseMessage.includes("whisky") || lowerCaseMessage.includes("whiskey")) {
      response = "Pour découvrir le whisky écossais, je vous recommande 'The Scotch Whisky Experience' près du château ou 'Cadenhead's Whisky Shop' pour des bouteilles uniques. Les pubs comme 'The Bow Bar' proposent également de belles sélections de single malts à déguster.";
    } else if (lowerCaseMessage.includes("arthur") || lowerCaseMessage.includes("arthur's seat")) {
      response = "Arthur's Seat est un ancien volcan qui offre une vue panoramique sur la ville. Comptez environ 1h-1h30 pour l'ascension et prévoyez de bonnes chaussures. Le lever ou le coucher du soleil sont des moments magiques pour cette randonnée, si la météo le permet !";
    } else if (
      events.length > 0 && 
      (lowerCaseMessage.includes("journée") || lowerCaseMessage.includes("programme") || lowerCaseMessage.includes("suggestion") || lowerCaseMessage.includes("recommande"))
    ) {
      // Analyse du programme actuel
      const today = new Date().toISOString().split('T')[0];
      const nextDay = events.find(e => e.date >= today)?.date || travelDates.start;
      response = suggestActivities(nextDay);
    } else {
      // Réponse générique basée sur les événements déjà planifiés
      if (events.length === 0) {
        response = "Je vois que vous n'avez pas encore ajouté d'activités à votre planning. Souhaitez-vous des suggestions pour commencer ? Edinburgh Castle et la Royal Mile sont incontournables pour une première visite.";
      } else {
        const nextDay = travelDates.start;
        response = `Vous avez déjà prévu ${events.length} activités pour votre séjour. ${suggestActivities(nextDay)} N'hésitez pas à me demander des recommandations spécifiques pour vos centres d'intérêt !`;
      }
    }
    
    setAssistantThinking(false);
    setAssistantMessages(prevMessages => [...prevMessages, { text: userMessage, sender: "user" }, { text: response, sender: "assistant" }]);
  }, [userMessage, events, travelDates.start, suggestActivities]);
  
  // Créer une suggestion basée sur le jour et les événements existants
  const suggestActivities = useCallback((day) => {
    const dayEvents = events.filter(event => event.date === day);
    let suggestion = "";
    
    // Vérifier si la journée est vide ou chargée
    if (dayEvents.length === 0) {
      suggestion = `Je vois que vous n'avez encore rien prévu pour le ${formatDate(new Date(day))}. Que diriez-vous de commencer par Edinburgh Castle le matin et de visiter la Royal Mile ensuite ?`;
    } else if (dayEvents.length < 2) {
      suggestion = `Vous avez déjà prévu ${dayEvents[0].title}. Pour compléter votre journée du ${formatDate(new Date(day))}, que pensez-vous d'ajouter une visite au National Museum of Scotland ?`;
    } else {
      // Vérifier si la journée est trop chargée
      const totalDuration = dayEvents.reduce((total, event) => total + event.duration, 0);
      if (totalDuration > 480) { // Plus de 8 heures d'activités
        suggestion = `Attention, votre journée du ${formatDate(new Date(day))} semble très chargée avec ${dayEvents.length} activités totalisant ${Math.round(totalDuration/60)} heures. Envisagez peut-être de déplacer certaines activités à un autre jour.`;
      } else {
        suggestion = `Votre programme pour le ${formatDate(new Date(day))} semble bien équilibré ! N'oubliez pas de prévoir du temps pour les déplacements entre chaque lieu.`;
      }
    }
    
    return suggestion;
  }, [events, formatDate]);
  
  // Fonction pour exporter les données
  const exportData = () => {
    const dataToExport = {
      travelDates,
      events,
      weatherData,
      currency,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `edinburgh-voyage-${travelDates.start}-${travelDates.end}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    setShowExportPanel(false);
  };
  
  // Fonction pour importer des données
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Vérifier la structure des données
        if (importedData.travelDates && importedData.events) {
          setTravelDates(importedData.travelDates);
          setEvents(importedData.events);
          
          if (importedData.weatherData) {
            setWeatherData(importedData.weatherData);
          }
          
          if (importedData.currency) {
            setCurrency(importedData.currency);
          }
          
          // Message de succès via l'assistant
          setAssistantMessages([
            ...assistantMessages, 
            { 
              text: `J'ai importé votre planning avec succès ! Vous avez ${importedData.events.length} activités planifiées pour votre voyage du ${formatDate(new Date(importedData.travelDates.start))} au ${formatDate(new Date(importedData.travelDates.end))}.`, 
              sender: "assistant" 
            }
          ]);
          setShowAssistant(true);
        } else {
          alert("Format de fichier non valide. Veuillez importer un planning créé avec cette application.");
        }
      } catch (error) {
        alert("Erreur lors de l'importation du fichier. Veuillez vérifier que le fichier est au bon format.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    
    // Réinitialiser l'input file
    event.target.value = null;
    
    setShowExportPanel(false);
  };
  
  // Fonction pour convertir le coût en fonction de la devise
  const convertCost = (cost) => {
    const rates = {
      EUR: 1,
      GBP: 0.85,
      USD: 1.08
    };
    
    return (cost / rates[currency]).toFixed(2);
  };
  
  // Fonction pour obtenir le symbole de la devise
  const getCurrencySymbol = () => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'USD': return ';
      default: return '€';
    }
  };
  
  // Calculer le coût total du voyage dans la devise sélectionnée
  const calculateTotalCost = useMemo(() => {
    const totalInEuros = events.reduce((total, event) => total + Number(event.cost), 0);
    return convertCost(totalInEuros);
  }, [events, currency, convertCost]);
  
  return (
    <div className="flex flex-col p-2 sm:p-4 max-w-full relative">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Planificateur de Voyage à Édimbourg</h1>
      
      {/* Boutons d'outils flottants */}
      <div className="fixed z-20 bottom-4 md:bottom-6 right-4 md:right-6 flex flex-col space-y-2">
        <button 
          className="p-2 md:p-3 rounded-full shadow-lg bg-green-600 text-white"
          onClick={() => setShowExportPanel(!showExportPanel)}
          title="Exporter/Importer"
        >
          <FileText size={20} />
        </button>
        
        <button 
          className="p-2 md:p-3 rounded-full shadow-lg bg-purple-600 text-white"
          onClick={() => setShowSettings(!showSettings)}
          title="Paramètres"
        >
          <Settings size={20} />
        </button>
        
        <button 
          className={`p-2 md:p-3 rounded-full shadow-lg ${showAssistant ? 'bg-red-500' : 'bg-blue-600'} text-white`}
          onClick={() => setShowAssistant(!showAssistant)}
          title="Assistant IA"
        >
          {showAssistant ? <X size={20} /> : <MessageSquare size={20} />}
        </button>
      </div>
