import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { SettingsProvider } from './contexts/SettingsContext';

function App() {
  useEffect(() => {
    // Initialize app when it loads
    const initApp = async () => {
      // Any initialization code here
      console.log('App initialized on platform:', Capacitor.getPlatform());
    };
    
    initApp();
  }, []);

  return (
    <AuthProvider>
      <DatabaseProvider>
        <SettingsProvider>
          <Router>
            <div className="app-container bg-background text-gray-800 min-h-screen">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </Router>
        </SettingsProvider>
      </DatabaseProvider>
    </AuthProvider>
  );
}

export default App;
