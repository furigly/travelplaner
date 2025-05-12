import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { 
  Calendar, Clock, DollarSign, Bus, MapPin, Coffee, Beer, 
  Utensils, Scissors, Search, Info, X, MessageSquare, Cloud, 
  Sun, ChevronUp, ChevronDown, Settings, Download, FileText, 
  Share2, Star, Heart, Map, Phone, Mail, Link, ExternalLink, 
  AlertTriangle, CheckCircle, XCircle, Edit, Trash, Plus, 
  Minus, Filter, SortAsc, SortDesc, RefreshCw, Camera, 
  Upload, Save, Menu, User, Lock, Eye, EyeOff 
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, addDays, differenceInDays, parseISO, isValid, isBefore, isAfter, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode.react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// Constants
const WEATHER_TYPES = {
  SUNNY: 'sunny',
  PARTLY_CLOUDY: 'partly_cloudy',
  CLOUDY: 'cloudy',
  LIGHT_RAIN: 'light_rain',
  RAIN: 'rain',
  STORM: 'storm',
  SNOW: 'snow',
  FOG: 'fog'
};

const ACTIVITY_TYPES = {
  ATTRACTION: 'attraction',
  RESTAURANT: 'restaurant',
  SHOPPING: 'shopping',
  TRANSPORT: 'transport',
  ENTERTAINMENT: 'entertainment',
  OUTDOOR: 'outdoor',
  CULTURAL: 'cultural'
};

const CURRENCIES = {
  EUR: { symbol: '€', rate: 1.16 },
  USD: { symbol: '$', rate: 1.25 },
  GBP: { symbol: '£', rate: 1.00 }
};

const CHART_COLORS = {
  primary: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
  secondary: ['#FF9F40', '#FF6384', '#4BC0C0', '#FFCE56', '#36A2EB'],
  background: ['#FFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA']
};

const MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'all',
    stylers: [{ saturation: -80 }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#e9e9e9' }]
  }
];

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const API_ENDPOINTS = {
  WEATHER: '/api/weather',
  ATTRACTIONS: '/api/attractions',
  EVENTS: '/api/events',
  BOOKINGS: '/api/bookings',
  AUTH: '/api/auth',
  USERS: '/api/users'
};

const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'edinburgh_planner_preferences',
  EVENTS: 'edinburgh_planner_events',
  AUTH_TOKEN: 'edinburgh_planner_token',
  THEME: 'edinburgh_planner_theme'
};

const ERROR_MESSAGES = {
  NETWORK: 'Erreur réseau. Veuillez vérifier votre connexion.',
  AUTH: 'Erreur d\'authentification. Veuillez vous reconnecter.',
  VALIDATION: 'Veuillez vérifier les informations saisies.',
  SERVER: 'Erreur serveur. Veuillez réessayer plus tard.',
  UNKNOWN: 'Une erreur inattendue est survenue.'
};

const DEFAULT_SETTINGS = {
  theme: 'light',
  currency: 'GBP',
  language: 'fr',
  notifications: true,
  autoSync: true,
  mapZoom: 13,
  mapCenter: {
    lat: 55.9533,
    lng: -3.1883
  }
};

// Interfaces
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  type: keyof typeof ACTIVITY_TYPES;
  cost: number;
  currency: keyof typeof CURRENCIES;
  weather?: Weather;
  notes?: string[];
  attachments?: Attachment[];
  rating?: number;
  status: 'planned' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface Weather {
  type: keyof typeof WEATHER_TYPES;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  description: string;
  icon: string;
}

interface Attachment {
  id: string;
  type: 'image' | 'document' | 'link';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface Budget {
  total: number;
  spent: number;
  remaining: number;
  categories: {
    [key: string]: {
      limit: number;
      spent: number;
      remaining: number;
    };
  };
  currency: keyof typeof CURRENCIES;
}

interface AppState {
  events: Event[];
  travelDates: {
    start: string;
    end: string;
  };
  budget: Budget;
  weatherData: {
    [date: string]: Weather;
  };
  searchResults: any[];
  selectedEvent: Event | null;
  loading: {
    [key: string]: boolean;
  };
  error: string | null;
  notifications: Notification[];
  settings: typeof DEFAULT_SETTINGS;
  user: User | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
  createdAt: string;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  currency: keyof typeof CURRENCIES;
  language: string;
  notifications: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  createdAt: string;
}

// Initial State
const initialState: AppState = {
  events: [],
  travelDates: {
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  },
  budget: {
    total: 1000,
    spent: 0,
    remaining: 1000,
    categories: {},
    currency: 'GBP'
  },
  weatherData: {},
  searchResults: [],
  selectedEvent: null,
  loading: {
    events: false,
    weather: false,
    search: false,
    auth: false
  },
  error: null,
  notifications: [],
  settings: DEFAULT_SETTINGS,
  user: null
};

// Action Types
const ActionTypes = {
  SET_EVENTS: 'SET_EVENTS',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  SET_WEATHER: 'SET_WEATHER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  UPDATE_BUDGET: 'UPDATE_BUDGET',
  SET_USER: 'SET_USER',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_SELECTED_EVENT: 'SET_SELECTED_EVENT',
  CLEAR_ERROR: 'CLEAR_ERROR'
} as const;

// Reducer
const reducer = (state: AppState, action: any): AppState => {
  switch (action.type) {
    case ActionTypes.SET_EVENTS:
      return {
        ...state,
        events: action.payload,
        loading: { ...state.loading, events: false }
      };

    case ActionTypes.ADD_EVENT:
      return {
        ...state,
        events: [...state.events, action.payload],
        budget: {
          ...state.budget,
          spent: state.budget.spent + action.payload.cost,
          remaining: state.budget.total - (state.budget.spent + action.payload.cost)
        }
      };

    case ActionTypes.UPDATE_EVENT:
      const updatedEvents = state.events.map(event =>
        event.id === action.payload.id ? action.payload : event
      );
      const newSpent = updatedEvents.reduce((sum, event) => sum + event.cost, 0);
      return {
        ...state,
        events: updatedEvents,
        budget: {
          ...state.budget,
          spent: newSpent,
          remaining: state.budget.total - newSpent
        }
      };

    case ActionTypes.DELETE_EVENT:
      const filteredEvents = state.events.filter(event => event.id !== action.payload);
      const remainingCost = filteredEvents.reduce((sum, event) => sum + event.cost, 0);
      return {
        ...state,
        events: filteredEvents,
        budget: {
          ...state.budget,
          spent: remainingCost,
          remaining: state.budget.total - remainingCost
        }
      };

    case ActionTypes.SET_WEATHER:
      return {
        ...state,
        weatherData: action.payload,
        loading: { ...state.loading, weather: false }
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: { ...state.loading, [action.payload.context]: false }
      };

    case ActionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    case ActionTypes.UPDATE_BUDGET:
      return {
        ...state,
        budget: { ...state.budget, ...action.payload }
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: { ...state.loading, auth: false }
      };

    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };

    case ActionTypes.SET_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: action.payload,
        loading: { ...state.loading, search: false }
      };

    case ActionTypes.SET_SELECTED_EVENT:
      return {
        ...state,
        selectedEvent: action.payload
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};
const EdinburghPlanner: React.FC = () => {
  // State et Refs
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState({
    type: [] as string[],
    priceRange: [0, 1000],
    dateRange: null as [Date, Date] | null
  });

  // Refs
  const mapRef = useRef(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debouncedSearchRef = useRef(null);

  // Memoized Values
  const sortedEvents = useMemo(() => {
    return [...state.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [state.events]);

  const totalExpenses = useMemo(() => {
    return state.events.reduce((sum, event) => sum + event.cost, 0);
  }, [state.events]);

  const eventsByDate = useMemo(() => {
    return state.events.reduce((acc, event) => {
      const date = event.date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as { [key: string]: Event[] });
  }, [state.events]);

  // Effects
  useEffect(() => {
    initializeApp();
    return () => {
      // Cleanup subscriptions and listeners
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
      const timer = setTimeout(() => {
        dispatch({ type: ActionTypes.CLEAR_ERROR });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.notifications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(state.events));
  }, [state.events]);

  useEffect(() => {
    if (state.user) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_PREFERENCES, 
        JSON.stringify(state.user.preferences)
      );
    }
  }, [state.user?.preferences]);

  // Initialize App
  const initializeApp = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'init', value: true } });
    try {
      await Promise.all([
        loadSavedData(),
        fetchWeatherData(),
        checkAuthStatus(),
        loadUserPreferences()
      ]);
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'init', value: false } });
    }
  };

  // Data Loading Functions
  const loadSavedData = async () => {
    try {
      const savedEvents = localStorage.getItem(LOCAL_STORAGE_KEYS.EVENTS);
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        dispatch({ type: ActionTypes.SET_EVENTS, payload: parsedEvents });
      }

      const savedPreferences = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_PREFERENCES);
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        dispatch({ 
          type: ActionTypes.UPDATE_SETTINGS, 
          payload: parsedPreferences 
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      throw new Error('Impossible de charger les données sauvegardées');
    }
  };

  const fetchWeatherData = async () => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'weather', value: true } });
    try {
      const { start, end } = state.travelDates;
      const response = await axios.get(
        `${API_ENDPOINTS.WEATHER}?start=${start}&end=${end}`
      );
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const processedWeatherData = processWeatherData(response.data);
      dispatch({ type: ActionTypes.SET_WEATHER, payload: processedWeatherData });
    } catch (error) {
      handleError(error);
    }
  };

  const checkAuthStatus = async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      try {
        const response = await axios.get(API_ENDPOINTS.AUTH + '/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        dispatch({ type: ActionTypes.SET_USER, payload: response.data.user });
      } catch (error) {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        dispatch({ type: ActionTypes.SET_USER, payload: null });
      }
    }
  };

  const loadUserPreferences = async () => {
    if (!state.user) return;
    try {
      const response = await axios.get(
        `${API_ENDPOINTS.USERS}/${state.user.id}/preferences`
      );
      dispatch({ 
        type: ActionTypes.UPDATE_SETTINGS, 
        payload: response.data 
      });
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    }
  };

  // Event Handlers
  const handleAddEvent = async (eventData: Partial<Event>) => {
    try {
      const newEvent: Event = {
        id: uuidv4(),
        ...eventData,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Event;

      dispatch({ type: ActionTypes.ADD_EVENT, payload: newEvent });

      if (state.user) {
        await axios.post(API_ENDPOINTS.EVENTS, newEvent, {
          headers: { Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)}` }
        });
      }

      toast.success('Événement ajouté avec succès');
    } catch (error) {
      handleError(error);
      dispatch({ type: ActionTypes.DELETE_EVENT, payload: eventData.id });
    }
  };

  const handleUpdateEvent = async (eventId: string, updates: Partial<Event>) => {
    const originalEvent = state.events.find(e => e.id === eventId);
    if (!originalEvent) return;

    try {
      const updatedEvent = {
        ...originalEvent,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      dispatch({ type: ActionTypes.UPDATE_EVENT, payload: updatedEvent });

      if (state.user) {
        await axios.put(`${API_ENDPOINTS.EVENTS}/${eventId}`, updatedEvent, {
          headers: { Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)}` }
        });
      }

      toast.success('Événement mis à jour avec succès');
    } catch (error) {
      handleError(error);
      dispatch({ type: ActionTypes.UPDATE_EVENT, payload: originalEvent });
    }
  };
  // Suite des gestionnaires d'événements
  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = state.events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    try {
      dispatch({ type: ActionTypes.DELETE_EVENT, payload: eventId });

      if (state.user) {
        await axios.delete(`${API_ENDPOINTS.EVENTS}/${eventId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN)}` }
        });
      }

      toast.success('Événement supprimé avec succès');
    } catch (error) {
      handleError(error);
      dispatch({ type: ActionTypes.ADD_EVENT, payload: eventToDelete });
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(state.events);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    dispatch({ type: ActionTypes.SET_EVENTS, payload: items });
  };

  const handleSearch = useCallback(debounce(async (term: string) => {
    if (!term.trim()) return;

    dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'search', value: true } });
    try {
      const response = await axios.get(`${API_ENDPOINTS.ATTRACTIONS}?q=${term}`);
      dispatch({ type: ActionTypes.SET_SEARCH_RESULTS, payload: response.data });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: { key: 'search', value: false } });
    }
  }, 300), []);

  const handleFilterChange = (criteria: typeof filterCriteria) => {
    setFilterCriteria(criteria);
    const filteredEvents = filterEvents(state.events, criteria);
    dispatch({ type: ActionTypes.SET_EVENTS, payload: filteredEvents });
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    try {
      const data = {
        events: state.events,
        weather: state.weatherData,
        budget: state.budget
      };

      switch (format) {
        case 'pdf':
          await exportToPDF(data);
          break;
        case 'excel':
          await exportToExcel(data);
          break;
        case 'json':
          await exportToJSON(data);
          break;
      }

      toast.success(`Export en ${format.toUpperCase()} réussi`);
    } catch (error) {
      handleError(error);
    }
  };

  // Fonctions utilitaires
  const filterEvents = (events: Event[], criteria: typeof filterCriteria) => {
    return events.filter(event => {
      const typeMatch = criteria.type.length === 0 || criteria.type.includes(event.type);
      const priceMatch = event.cost >= criteria.priceRange[0] && event.cost <= criteria.priceRange[1];
      const dateMatch = !criteria.dateRange || (
        isAfter(new Date(event.date), criteria.dateRange[0]) &&
        isBefore(new Date(event.date), criteria.dateRange[1])
      );
      return typeMatch && priceMatch && dateMatch;
    });
  };

  const handleError = (error: any) => {
    console.error('Error:', error);
    const errorMessage = error.response?.data?.message || error.message || ERROR_MESSAGES.UNKNOWN;
    
    dispatch({ 
      type: ActionTypes.SET_ERROR, 
      payload: errorMessage
    });

    dispatch({
      type: ActionTypes.ADD_NOTIFICATION,
      payload: {
        id: uuidv4(),
        type: 'error',
        message: errorMessage,
        createdAt: new Date().toISOString()
      }
    });
  };

  // Fonctions de rendu
  const renderTimeline = () => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="timeline-container"
              {sortedEvents.map((event, index) => (
                <Draggable
                  key={event.id}
                  draggableId={event.id}
                  index={index}
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`event-card ${snapshot.isDragging ? 'dragging' : ''}`}
                      <EventCard
                        event={event}
                        weather={state.weatherData[event.date]}
                        onEdit={(updates) => handleUpdateEvent(event.id, updates)}
                        onDelete={() => handleDeleteEvent(event.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  const renderWeatherForecast = () => {
    if (state.loading.weather) {
      return <LoadingSpinner />;
    }

    return (
      <div className="weather-forecast">
        {Object.entries(state.weatherData).map(([date, weather]) => (
          <WeatherCard
            key={date}
            date={date}
            weather={weather}
            onClick={() => setSelectedDate(date)}
            isSelected={selectedDate === date}
          />
        ))}
      </div>
    );
  };

  const renderBudgetOverview = () => {
    const { total, spent, remaining, categories } = state.budget;
    
    return (
      <div className="budget-overview">
        <div className="budget-summary">
          <div className="budget-total">
            <h3>Budget Total</h3>
            <p>{formatCurrency(total, state.settings.currency)}</p>
          </div>
          <div className="budget-spent">
            <h3>Dépensé</h3>
            <p>{formatCurrency(spent, state.settings.currency)}</p>
          </div>
          <div className="budget-remaining">
            <h3>Restant</h3>
            <p>{formatCurrency(remaining, state.settings.currency)}</p>
          </div>
        </div>
        <div className="budget-categories">
          {Object.entries(categories).map(([category, data]) => (
            <BudgetCategoryCard
              key={category}
              category={category}
              data={data}
              currency={state.settings.currency}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderMap = () => {
    return (
      <GoogleMap
        ref={mapRef}
        center={state.settings.mapCenter}
        zoom={state.settings.mapZoom}
        options={{
          styles: MAP_STYLES,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        }}
        onBoundsChanged={() => {
          if (mapRef.current) {
            setMapBounds(mapRef.current.getBounds());
          }
        }}
        {sortedEvents.map(event => (
          <Marker
            key={event.id}
            position={event.location.coordinates}
            onClick={() => dispatch({ 
              type: ActionTypes.SET_SELECTED_EVENT, 
              payload: event 
            })}
          />
        ))}
        {state.selectedEvent && (
          <InfoWindow
            position={state.selectedEvent.location.coordinates}
            onCloseClick={() => dispatch({ 
              type: ActionTypes.SET_SELECTED_EVENT, 
              payload: null 
            })}
            <EventInfoCard event={state.selectedEvent} />
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };
  // Rendu principal du composant
  return (
    <div className="edinburgh-planner">
      <header className="header">
        <div className="header-left">
          <h1>Edinburgh Planner</h1>
          <div className="date-range">
            <Calendar className="icon" />
            <span>{format(new Date(state.travelDates.start), 'dd MMM yyyy')} - </span>
            <span>{format(new Date(state.travelDates.end), 'dd MMM yyyy')}</span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Rechercher des lieux, activités..."
              className="search-input"
            />
            <Search className="search-icon" />
          </div>
        </div>

        <div className="header-right">
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
            <Filter className="icon" />
            Filtres
          </button>
          
          <div className="user-menu">
            {state.user ? (
              <div className="user-info">
                <img 
                  src={state.user.avatar || '/default-avatar.png'} 
                  alt="Profile" 
                  className="user-avatar"
                />
                <span>{state.user.name}</span>
              </div>
            ) : (
              <button className="login-button">
                <User className="icon" />
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            <FilterPanel
              criteria={filterCriteria}
              onChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-content">
        <div className="sidebar">
          <nav className="navigation">
            <button 
              className={`nav-button ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
              <Clock className="icon" />
              Timeline
            </button>
            <button 
              className={`nav-button ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
              <Map className="icon" />
              Carte
            </button>
            <button 
              className={`nav-button ${activeTab === 'budget' ? 'active' : ''}`}
              onClick={() => setActiveTab('budget')}
              <DollarSign className="icon" />
              Budget
            </button>
            <button 
              className={`nav-button ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
              <Cloud className="icon" />
              Météo
            </button>
          </nav>

          <div className="quick-actions">
            <button onClick={() => handleExport('pdf')}>
              <FileText className="icon" />
              Export PDF
            </button>
            <button onClick={() => handleExport('excel')}>
              <FileText className="icon" />
              Export Excel
            </button>
            <button onClick={() => setIsAssistantOpen(true)}>
              <MessageSquare className="icon" />
              Assistant
            </button>
          </div>
        </div>

        <div className="content">
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'map' && renderMap()}
          {activeTab === 'budget' && renderBudgetOverview()}
          {activeTab === 'weather' && renderWeatherForecast()}
        </div>
      </main>

      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div
            className="assistant-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            <AssistantPanel
              onClose={() => setIsAssistantOpen(false)}
              onSendMessage={handleAssistantMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="notifications-container">
        <AnimatePresence>
          {state.notifications.map(notification => (
            <motion.div
              key={notification.id}
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              <p>{notification.message}</p>
              <button 
                onClick={() => dispatch({
                  type: ActionTypes.REMOVE_NOTIFICATION,
                  payload: notification.id
                })}
                <X className="icon" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Styles
const styles = {
  'edinburgh-planner': {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--background)',
    color: 'var(--text)',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--surface)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  'main-content': {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },

  sidebar: {
    width: '250px',
    backgroundColor: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    padding: '1rem',
  },

  content: {
    flex: 1,
    padding: '1rem',
    overflow: 'auto',
  },

  'timeline-container': {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  'event-card': {
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&.dragging': {
      opacity: 0.5,
      transform: 'scale(1.02)',
    },
  },

  'weather-forecast': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    padding: '1rem',
  },

  'budget-overview': {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },

  'assistant-panel': {
    position: 'fixed',
    right: 0,
    top: 0,
    bottom: 0,
    width: '400px',
    backgroundColor: 'var(--surface)',
    boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
    zIndex: 1000,
  },

  'notifications-container': {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    zIndex: 2000,
  },
};

export default EdinburghPlanner;
