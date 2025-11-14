// Plik: server/index.js
// Główny plik serwera Express, skonfigurowany do pracy z mockowaną bazą danych i CORS.

require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors'); // Importujemy CORS
const { connectDB } = require('./config/mock_db');

const authRoutes = require('./routes/auth');
const slideRoutes = require('./routes/slides');

const app = express();
const PORT = process.env.PORT || 3001;

// Konfiguracja CORS - zezwalamy na zapytania z adresu klienta Vite
const corsOptions = {
  origin: 'http://localhost:5173',
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Trasy
app.use('/api/auth', authRoutes);
app.use('/api/slides', slideRoutes);

// Start serwera
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Serwer uruchomiony i nasłuchuje na porcie ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Błąd podczas uruchamiania serwera:', err);
    process.exit(1);
  }
};

startServer();
