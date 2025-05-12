import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer } from 'react';
import { Calendar, Clock, DollarSign, Bus, MapPin, Coffee, Beer, Utensils, Scissors, Search, Info, X, MessageSquare, Cloud, Sun, ChevronUp, ChevronDown, Settings, Download, FileText, Share2, Star, Heart, Map, Phone, Mail, Link, ExternalLink, AlertTriangle, CheckCircle, XCircle, Edit, Trash, Plus, Minus, Filter, SortAsc, SortDesc, RefreshCw, Camera, Upload, Save, Menu } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { format, addDays, differenceInDays, parseISO, isValid, isBefore, isAfter, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import debounce from 'lodash/debounce';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Transition } from '@headlessui/react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode.react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Line, Bar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
const WEATHER_TYPES = ['sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'rain', 'storm', 'snow', 'fog', 'wind'];
const WEATHER_WEIGHTS = [0.2, 0.3, 0.15, 0.1, 0.08, 0.05, 0.02, 0.05, 0.05];
const ACTIVITY_CATEGORIES = ['culture', 'nature', 'food', 'shopping', 'entertainment', 'sports', 'relaxation'];
const TRANSPORT_MODES = ['walk', 'bus', 'tram', 'taxi', 'bike', 'tour'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'drinks'];
const CURRENCIES = { EUR: 1.16, USD: 1.25, GBP: 1, JPY: 150.45, CAD: 1.70, AUD: 1.90 };
const BUDGET_CATEGORIES = ['accommodation', 'transport', 'food', 'activities', 'shopping', 'misc'];
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const MAP_STYLES = [{ featureType: 'all', stylers: [{ saturation: -80 }] }];
const CHART_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  UPDATE_PLAN: 'update_plan',
  RECEIVE_UPDATE: 'receive_update',
  ERROR: 'error'
};
const LOCAL_STORAGE_KEYS = {
  EVENTS: 'edinburgh_planner_events',
  SETTINGS: 'edinburgh_planner_settings',
  USER_PREFERENCES: 'edinburgh_planner_preferences',
  LAST_SYNC: 'edinburgh_planner_last_sync'
};
const API_ENDPOINTS = {
  WEATHER: '/api/weather',
  ATTRACTIONS: '/api/attractions',
  RESTAURANTS: '/api/restaurants',
  TRANSPORT: '/api/transport',
  BOOKINGS: '/api/bookings'
};
const ERROR_MESSAGES = {
  NETWORK: 'Erreur réseau. Veuillez vérifier votre connexion.',
  API: 'Erreur lors de la communication avec le serveur.',
  VALIDATION: 'Veuillez vérifier les informations saisies.',
  PERMISSION: 'Vous n\'avez pas les permissions nécessaires.',
  UNKNOWN: 'Une erreur inattendue est survenue.'
};
const initialState = {
  events: [],
  travelDates: { start: null, end: null },
  currency: 'EUR',
  budget: { total: 0, spent: 0, remaining: 0 },
  expenses: [],
  weatherData: {},
  searchResults: [],
  selectedAttraction: null,
  assistantMessages: [],
  userPreferences: {},
  notifications: [],
  mapMarkers: [],
  activeFilters: [],
  sortOptions: { field: 'date', order: 'asc' },
  loading: { weather: false, search: false, save: false },
  error: null,
  socket: null,
  lastSync: null,
  isDragging: false,
  showModal: false,
  modalContent: null,
  chartData: null,
  selectedDateRange: null,
  photoGallery: [],
  bookmarks: [],
  notes: [],
  transportSchedule: [],
  restaurantReservations: [],
  activityBookings: [],
  budget: {
    planned: {},
    actual: {},
    categories: {},
    daily: []
  }
};
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        )
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload)
      };
    case 'SET_WEATHER':
      return { ...state, weatherData: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budget: {
          ...state.budget,
          ...action.payload
        }
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
        budget: {
          ...state.budget,
          spent: state.budget.spent + action.payload.amount,
          remaining: state.budget.total - (state.budget.spent + action.payload.amount)
        }
      };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_SELECTED_ATTRACTION':
      return { ...state, selectedAttraction: action.payload };
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        assistantMessages: [...state.assistantMessages, action.payload]
      };
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'SET_MAP_MARKERS':
      return { ...state, mapMarkers: action.payload };
    case 'UPDATE_FILTERS':
      return { ...state, activeFilters: action.payload };
    case 'SET_SORT_OPTIONS':
      return { ...state, sortOptions: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'UPDATE_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'TOGGLE_MODAL':
      return {
        ...state,
        showModal: action.payload.show,
        modalContent: action.payload.content
      };
    case 'UPDATE_CHART_DATA':
      return { ...state, chartData: action.payload };
    case 'SET_DATE_RANGE':
      return { ...state, selectedDateRange: action.payload };
    case 'ADD_PHOTO':
      return {
        ...state,
        photoGallery: [...state.photoGallery, action.payload]
      };
    case 'TOGGLE_BOOKMARK':
      return {
        ...state,
        bookmarks: state.bookmarks.includes(action.payload)
          ? state.bookmarks.filter(id => id !== action.payload)
          : [...state.bookmarks, action.payload]
      };
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };
    case 'UPDATE_TRANSPORT_SCHEDULE':
      return { ...state, transportSchedule: action.payload };
    case 'ADD_RESERVATION':
      return {
        ...state,
        restaurantReservations: [...state.restaurantReservations, action.payload]
      };
    case 'ADD_BOOKING':
      return {
        ...state,
        activityBookings: [...state.activityBookings, action.payload]
      };
    default:
      return state;
  }
};
const EdinburghPlanner = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('planning');
  const [editingEvent, setEditingEvent] = useState(null);
  const [showWeatherDetails, setShowWeatherDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 55.9533, lng: -3.1883 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const debouncedSearch = useMemo(
    () => debounce((term) => handleSearch(term), 300),
    []
  );
  useEffect(() => {
    initializeApp();
    return () => {
      if (state.socket) {
        state.socket.disconnect();
      }
    };
  }, []);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.assistantMessages]);
  useEffect(() => {
    if (state.events.length > 0) {
      saveToLocalStorage();
      updateChartData();
    }
  }, [state.events]);
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm]);
  const initializeApp = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'init', value: true } });
      await Promise.all([
        loadSavedData(),
        fetchWeatherData(),
        initializeSocket(),
        loadUserPreferences()
      ]);
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'init', value: false } });
    }
  };
  const loadSavedData = () => {
    try {
      const savedEvents = localStorage.getItem(LOCAL_STORAGE_KEYS.EVENTS);
      if (savedEvents) {
        dispatch({ type: 'SET_EVENTS', payload: JSON.parse(savedEvents) });
      }
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: settings });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      handleError(error);
    }
  };
  const saveToLocalStorage = debounce(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(state.events));
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );
      dispatch({
        type: 'UPDATE_LAST_SYNC',
        payload: new Date().toISOString()
      });
    } catch (error) {
      handleError(error);
    }
  }, 1000);
  const handleSearch = async (term) => {
    if (!term.trim()) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'search', value: true } });
      const results = await searchAttractions(term);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'search', value: false } });
    }
  };
  const searchAttractions = async (term) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ATTRACTIONS}?q=${term}`);
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de la recherche des attractions');
    }
  };
  const fetchWeatherData = async () => {
    if (!state.travelDates.start || !state.travelDates.end) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'weather', value: true } });
      const response = await axios.get(
        `${API_ENDPOINTS.WEATHER}?start=${state.travelDates.start}&end=${state.travelDates.end}`
      );
      dispatch({ type: 'SET_WEATHER', payload: response.data });
    } catch (error) {
      handleError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'weather', value: false } });
    }
  };
  const handleAddEvent = (eventData) => {
    const newEvent = {
      id: uuidv4(),
      ...eventData,
      created: new Date().toISOString()
    };
    dispatch({ type: 'ADD_EVENT', payload: newEvent });
    updateBudget(newEvent.cost);
    if (state.socket) {
      state.socket.emit(SOCKET_EVENTS.UPDATE_PLAN, newEvent);
    }
  };
  const handleUpdateEvent = (eventId, updates) => {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    const updatedEvent = { ...event, ...updates };
    dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent });
    if (state.socket) {
      state.socket.emit(SOCKET_EVENTS.UPDATE_PLAN, updatedEvent);
    }
  };
  const handleDeleteEvent = (eventId) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
    if (state.socket) {
      state.socket.emit(SOCKET_EVENTS.UPDATE_PLAN, { id: eventId, deleted: true });
    }
  };
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(state.events);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    dispatch({ type: 'SET_EVENTS', payload: items });
  };
  const updateBudget = (amount) => {
    const newSpent = state.budget.spent + amount;
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: {
        spent: newSpent,
        remaining: state.budget.total - newSpent
      }
    });
  };
  const handleAssistantMessage = async (message) => {
    if (!message.trim()) return;
    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: userMessage });
    setIsAssistantTyping(true);
    try {
      const response = await generateAssistantResponse(message);
      const assistantMessage = {
        id: uuidv4(),
        type: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: assistantMessage });
    } catch (error) {
      handleError(error);
    } finally {
      setIsAssistantTyping(false);
    }
  };
  const generateAssistantResponse = async (message) => {
    try {
      const response = await axios.post('/api/assistant', { message });
      return response.data.response;
    } catch (error) {
      throw new Error('Erreur lors de la génération de la réponse');
    }
  };
  const handleError = (error) => {
    console.error(error);
    const errorMessage = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN;
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    toast.error(errorMessage);
  };
  const initializeSocket = () => {
    const socket = io(process.env.REACT_APP_SOCKET_URL);
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
    });
    socket.on(SOCKET_EVENTS.RECEIVE_UPDATE, (update) => {
      if (update.deleted) {
        dispatch({ type: 'DELETE_EVENT', payload: update.id });
      } else {
        dispatch({ type: 'UPDATE_EVENT', payload: update });
      }
    });
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      handleError(error);
    });
    dispatch({ type: 'SET_SOCKET', payload: socket });
  };
  const exportData = async (format) => {
    try {
      const data = {
        events: state.events,
        weather: state.weatherData,
        budget: state.budget
      };
      switch (format) {
        case 'pdf':
          const doc = new jsPDF();
          doc.text('Edinburgh Travel Plan', 10, 10);
          doc.save('edinburgh-plan.pdf');
          break;
        case 'excel':
          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(state.events);
          XLSX.utils.book_append_sheet(wb, ws, 'Events');
          XLSX.writeFile(wb, 'edinburgh-plan.xlsx');
          break;
        case 'json':
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          saveAs(blob, 'edinburgh-plan.json');
          break;
        default:
          throw new Error('Format non supporté');
      }
    } catch (error) {
      handleError(error);
    }
  };
  const updateChartData = () => {
  const dailyExpenses = state.events.reduce((acc, event) => {
    const date = event.date.split('T')[0];
    acc[date] = (acc[date] || 0) + event.cost;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(dailyExpenses),
    datasets: [{
      label: 'Dépenses journalières',
      data: Object.values(dailyExpenses), // Correction ici : ajout de 'data:'
      backgroundColor: CHART_COLORS[0],
      borderColor: CHART_COLORS[0],
      borderWidth: 1
    }]
  };

  dispatch({ type: 'UPDATE_CHART_DATA', payload: chartData });
};
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await axios.post('/api/photos/upload', formData);
      dispatch({
        type: 'ADD_PHOTO',
        payload: {
          id: uuidv4(),
          url: response.data.url,
          caption: '',
          date: new Date().toISOString()
        }
      });
    } catch (error) {
      handleError(error);
    }
  };
  const handleReservation = async (reservationData) => {
    try {
      const response = await axios.post('/api/reservations', reservationData);
      dispatch({
        type: 'ADD_RESERVATION',
        payload: response.data
      });
      toast.success('Réservation effectuée avec succès');
    } catch (error) {
      handleError(error);
    }
  };
  const filterEvents = (events) => {
    return events.filter(event => {
      return state.activeFilters.every(filter => {
        switch (filter.type) {
          case 'date':
            return isWithinDateRange(event.date, filter.value);
          case 'category':
            return event.category === filter.value;
          case 'price':
            return event.cost <= filter.value;
          default:
            return true;
        }
      });
    });
  };
  const sortEvents = (events) => {
    return [...events].sort((a, b) => {
      const { field, order } = state.sortOptions;
      const aValue = a[field];
      const bValue = b[field];
      return order === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  };
  const calculateStats = () => {
    const stats = {
      totalEvents: state.events.length,
      totalCost: state.events.reduce((sum, event) => sum + event.cost, 0),
      categoryCounts: state.events.reduce((acc, event) => {
        acc[event.category] = (acc[event.category] || 0) + 1;
        return acc;
      }, {}),
      averageCostPerDay: state.budget.spent / differenceInDays(
        new Date(state.travelDates.end),
        new Date(state.travelDates.start)
      )
    };
    return stats;
  };
const renderTimeline = () => {
  const filteredAndSortedEvents = sortEvents(filterEvents(state.events));
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="timeline">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}  // Ajout des props spread
            className="timeline"
            {filteredAndSortedEvents.map((event, index) => (
              <Draggable
                key={event.id}
                draggableId={event.id}
                index={index}
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}    // Ajout des props spread
                    {...provided.dragHandleProps}   // Ajout des props spread
                    className={`timeline-event ${snapshot.isDragging ? 'dragging' : ''}`}
                    <EventCard
                      event={event}
                      onEdit={() => setEditingEvent(event)}
                      onDelete={() => handleDeleteEvent(event.id)}
                      weather={state.weatherData[event.date]}
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
  const renderMap = () => {
    return (
      <GoogleMap
        ref={mapRef}
        center={mapCenter}
        zoom={13}
        options={{ styles: MAP_STYLES }}
        {state.mapMarkers.map(marker => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
            <div>
              <h3>{selectedMarker.title}</h3>
              <p>{selectedMarker.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    );
  };
  const renderCharts = () => {
    if (!state.chartData) return null;
    return (
      <div className="charts-container">
        <div className="chart">
          <h3>Dépenses journalières</h3>
          <Line data={state.chartData} />
        </div>
        <div className="chart">
          <h3>Répartition par catégorie</h3>
          <Bar
  data={{
    labels: Object.keys(calculateStats().categoryCounts),
    datasets: [{
      label: 'Répartition par catégorie',
      Object.values(calculateStats().categoryCounts), // Correction ici : ajout de 'data:'
      backgroundColor: CHART_COLORS
    }]
  }}
/>
        </div>
      </div>
    );
  };
  const renderWeather = () => {
    if (state.loading.weather) {
      return <div>Chargement de la météo...</div>;
    }
    return (
      <div className="weather-container">
        {Object.entries(state.weatherData).map(([date, data]) => (
          <WeatherDisplay
            key={date}
            date={date}
            weather={data}
            onClick={() => setShowWeatherDetails(date)}
          />
        ))}
      </div>
    );
  };
  const renderAssistant = () => {
    return (
      <div className="assistant-container">
        <div className="messages-container">
          {state.assistantMessages.map(message => (
            <div
              key={message.id}
              className={`message ${message.type}`}
              {message.content}
              <span className="timestamp">
                {format(new Date(message.timestamp), 'HH:mm')}
              </span>
            </div>
          ))}
          {isAssistantTyping && (
            <div className="typing-indicator">
              L'assistant écrit...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>
    );
  };
  return (
    <div className="edinburgh-planner">
      <header className="header">
        <div className="logo">
          <h1>Edinburgh Planner</h1>
        </div>
        <nav className="navigation">
          <button
            onClick={() => setActiveTab('planning')}
            className={activeTab === 'planning' ? 'active' : ''}
            Planning
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={activeTab === 'map' ? 'active' : ''}
            Carte
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={activeTab === 'budget' ? 'active' : ''}
            Budget
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={activeTab === 'weather' ? 'active' : ''}
            Météo
          </button>
        </nav>
        <div className="actions">
          <button onClick={() => setShowFilters(!showFilters)}>
            <Filter className="icon" />
          </button>
          <button onClick={() => exportData('pdf')}>
            <Download className="icon" />
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="icon" />
          </button>
        </div>
      </header>
      <main className="main-content">
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filters-panel"
              variants={ANIMATION_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="hidden"
              {/* Filtres */}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="content-area">
          {activeTab === 'planning' && renderTimeline()}
          {activeTab === 'map' && renderMap()}
          {activeTab === 'budget' && renderCharts()}
          {activeTab === 'weather' && renderWeather()}
        </div>
        {isSidebarOpen && (
          <aside className="sidebar">
            <div className="assistant-toggle" onClick={() => setShowAssistant(!showAssistant)}>
              <MessageSquare className="icon" />
              Assistant
            </div>
            {showAssistant && renderAssistant()}
          </aside>
        )}
      </main>
      <footer className="footer">
        <div className="stats">
          <div>Total événements: {calculateStats().totalEvents}</div>
          <div>Budget total: {state.budget.total} GBP</div>
          <div>Dépensé: {state.budget.spent} GBP</div>
          <div>Restant: {state.budget.remaining} GBP</div>
        </div>
        <div className="sync-status">
          Dernière synchronisation: {
            state.lastSync
              ? format(new Date(state.lastSync), 'dd/MM/yyyy HH:mm')
              : 'Jamais'
          }
        </div>
      </footer>
      <Transition show={state.showModal}>
        <div className="modal-overlay">
          <div className="modal-content">
            {state.modalContent}
            <button
              className="modal-close"
              onClick={() => dispatch({
                type: 'TOGGLE_MODAL',
                payload: { show: false, content: null }
              })}
              <X className="icon" />
            </button>
          </div>
        </div>
      </Transition>
      <div className="notifications-container">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification ${notification.type}`}
            {notification.message}
            <button
              onClick={() => setNotifications(prev =>
                prev.filter(n => n.id !== notification.id)
              )}
              <X className="icon" />
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
        accept="image/*"
      />
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  navigation: {
    display: 'flex',
    gap: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#0056b3',
    },
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
  },
  event: {
    padding: '1rem',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    '&.dragging': {
      opacity: 0.5,
    },
  },
  map: {
    height: '500px',
    width: '100%',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  charts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '1rem',
  },
  weather: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
    padding: '1rem',
  },
  assistant: {
    position: 'fixed',
    bottom: '1rem',
    right: '1rem',
    width: '300px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  notifications: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
};

// Types
interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  cost: number;
  description?: string;
  weather?: Weather;
  photos?: string[];
  notes?: string[];
}

interface Weather {
  type: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface Budget {
  total: number;
  spent: number;
  remaining: number;
  categories: {
    [key: string]: number;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
}

interface AssistantMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default EdinburghPlanner;
