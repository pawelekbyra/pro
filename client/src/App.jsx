// Plik: client/src/App.jsx
// Główny komponent aplikacji z routingiem

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import stron
import VideoPlayerPage from './pages/VideoPlayerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Import stylów globalnych
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<VideoPlayerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
