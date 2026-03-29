import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import ContestSelection from './pages/ContestSelection';
import AdminPanel from './pages/AdminPanel';
import CookieConsent from './components/CookieConsent';

import SecretAdminLogin from './pages/SecretAdminLogin';

// Enable credentials for sessions
axios.defaults.withCredentials = true;

function App() {
  return (
    <Router>
      <CookieConsent />
      <div className="app-container">
        <Routes>
          <Route path="/adminatecespectrumofficial" element={<SecretAdminLogin />} />
          <Route path="/adminatecespectrumofficial/admin" element={<AdminPanel />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/select-contest" element={<ContestSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
