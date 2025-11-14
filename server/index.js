console.log('This is the first line of index.js');
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const port = 3001;
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const slideRoutes = require('./routes/slides');
const profileRoutes = require('./routes/profile');

const startServer = async () => {
  try {
    console.log('Starting server...');
    await connectDB();

    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/slides', slideRoutes);
    app.use('/api/profile', profileRoutes);

    app.get('/', (req, res) => {
      res.send('Hello, world!');
    });

    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
