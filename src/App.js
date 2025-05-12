import React, { useState, useEffect } from 'react';
import './App.css';
import EdinburghPlanner from './components/EdinburghPlanner';
import logo from './assets/edinburgh-logo.svg';
import { Settings, Info, Github } from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Vérifier si Ollama est en cours d'exécution
  useEffect(() => {
    const checkOllamaStatus = async () => {
      try {
        // Tenter de contacter l'API Ollama
        const response = await fetch('http://localhost:11434/api/tags', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          setIsOllamaRunning(true);
        }
      } catch (error) {
        console.log('Ollama API not reachable:', error);
        setIsOllamaRunning(false);
      } finally {
        // Simuler un chargement minimum pour éviter un flash d'interface
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    checkOllamaStatus();
  }, []);
  
  // Composant d'écran de chargement
  const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="w-24 h-24 mb-4 relative">
        {logo ? (
          <img src={logo} alt="Edinburgh Logo" className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            ED
          </div>
        )}
        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Planificateur d'Édimbourg</h1>
      <p className="text-gray-600 mb-4">Chargement de l'application...</p>
      <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-pulse"></div>
      </div>
    </div>
  );
  
  // Composant d'erreur pour Ollama non disponible
  const OllamaNotRunning = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Service Ollama non détecté</h1>
      <p className="text-gray-600 mb-4 text-center max-w-md">
        Le service Ollama qui fournit l'IA locale n'est pas accessible. Veuillez vérifier qu'il est bien démarré.
      </p>
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-md">
        <h2 className="font-bold mb-2">Comment résoudre ce problème :</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Vérifiez que le service Ollama est démarré avec la commande : <br/>
            <code className="bg-gray-100 px-1 py-0.5 rounded">sudo systemctl status ollama</code>
          </li>
          <li>Si le service est arrêté, démarrez-le avec : <br/>
            <code className="bg-gray-100 px-1 py-0.5 rounded">sudo systemctl start ollama</code>
          </li>
          <li>Attendez quelques secondes puis rafraîchissez cette page</li>
        </ol>
      </div>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
      >
        Rafraîchir la page
      </button>
    </div>
  );
  
  // Fenêtre modale À propos
  const AboutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">À propos</h2>
          <button onClick={() => setShowAbout(false)} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-bold">Planificateur de Voyage à Édimbourg</h3>
          <p className="text-sm text-gray-600 mt-2">
            Version 1.0.0
          </p>
          <p className="mt-4">
            Une application pour planifier votre séjour à Édimbourg avec une assistance IA locale sur votre Raspberry Pi.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Technologies utilisées :</p>
            <ul className="mt-2 space-y-1">
              <li>• React & Tailwind CSS (frontend)</li>
              <li>• Ollama (IA locale)</li>
              <li>• OpenStreetMap & OpenWeatherMap (APIs gratuites)</li>
            </ul>
          </div>
          <div className="mt-4 flex justify-between">
            <a 
              href="https://github.com/furigly/travelplaner" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <GitHub size={18} className="mr-1" />
              <span>GitHub</span>
            </a>
            <span className="text-gray-500">Licence MIT</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isOllamaRunning) {
    return <OllamaNotRunning />;
  }
  
  return (
    <div className="App min-h-screen">
      {/* En-tête */}
      <header className="edinburgh-header bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Planificateur d'Édimbourg</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowAbout(true)}
              className="p-2 rounded-full hover:bg-blue-500 transition"
              aria-label="À propos"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-blue-500 transition"
              aria-label="Paramètres"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Contenu principal */}
      <main className="container mx-auto p-4">
        <EdinburghPlanner />
      </main>
      
      {/* Pied de page */}
      <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} Planificateur d'Édimbourg pour Raspberry Pi</p>
          <p className="text-xs mt-1">
            Propulsé par Ollama (IA locale) • Respecte votre vie privée • Open-source
          </p>
        </div>
      </footer>
      
      {/* Modales */}
      {showAbout && <AboutModal />}
      {showSettings && (
        // Fenêtre de paramètres simplifiée, à compléter selon les besoins
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Paramètres</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p>Paramètres à venir dans une prochaine version.</p>
              <button 
                onClick={() => setShowSettings(false)} 
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
