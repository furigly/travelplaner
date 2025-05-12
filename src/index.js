import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Fonction pour vérifier les performances du périphérique
const isLowEndDevice = () => {
  // Détection basique pour Raspberry Pi et appareils à faible performance
  const memoryLimit = navigator.deviceMemory ? navigator.deviceMemory <= 2 : false;
  const cpuCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 2 : false;
  const isRaspberryPi = /Raspberry Pi/.test(navigator.userAgent) || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
  
  return memoryLimit || cpuCores || isRaspberryPi;
};

// Désactiver les animations si le périphérique est de faible puissance
if (isLowEndDevice()) {
  document.documentElement.classList.add('low-end-device');
  
  // Ajouter une classe au corps pour optimiser les styles
  document.body.classList.add('optimize-performance');
  
  // Stocker cette information pour l'utiliser dans l'application
  window.isLowEndDevice = true;
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Nettoyer le cache localStorage périodiquement pour éviter les problèmes de stockage
const cleanLocalStorage = () => {
  // Vérifier s'il existe un timestamp de dernier nettoyage
  const lastClean = localStorage.getItem('edinburghPlanner_lastStorageClean');
  const now = Date.now();
  
  // Si le dernier nettoyage date de plus de 7 jours, nettoyer les données anciennes
  if (!lastClean || (now - parseInt(lastClean, 10)) > 7 * 24 * 60 * 60 * 1000) {
    // Trouver toutes les entrées dans localStorage correspondant au planificateur
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('edinburghPlanner_') && key !== 'edinburghPlanner_lastStorageClean') {
        try {
          // Vérifier si c'est une donnée météo et qu'elle a plus de 3 jours
          if (key === 'edinburghPlanner_weatherData') {
            const weatherData = JSON.parse(localStorage.getItem(key));
            const cleanedWeatherData = {};
            
            // Ne conserver que les données météo récentes (moins de 3 jours)
            Object.keys(weatherData).forEach(date => {
              const dateTs = new Date(date).getTime();
              if (now - dateTs < 3 * 24 * 60 * 60 * 1000) {
                cleanedWeatherData[date] = weatherData[date];
              }
            });
            
            localStorage.setItem(key, JSON.stringify(cleanedWeatherData));
          }
        } catch (e) {
          console.warn('Erreur lors du nettoyage du localStorage:', e);
        }
      }
    });
    
    // Mettre à jour le timestamp de dernier nettoyage
    localStorage.setItem('edinburghPlanner_lastStorageClean', now.toString());
  }
};

// Exécuter le nettoyage au chargement
cleanLocalStorage();
