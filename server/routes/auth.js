// Plik: server/routes/auth.js
// Trasy do obsługi rejestracji i logowania, używające mockowanej bazy danych.

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, UserModel } = require('../config/mock_db'); // Importujemy mocka!
const auth = require('../middleware/auth');

// POST /api/auth/register - Rejestracja nowego użytkownika
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Proszę podać email i hasło' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Użytkownik o tym emailu już istnieje' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    const payload = { user: { id: savedUser.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error('Błąd serwera przy rejestracji:', err.message);
    res.status(500).send('Błąd serwera');
  }
});

// POST /api/auth/login - Logowanie użytkownika
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Proszę podać email i hasło' });
    }

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Nieprawidłowe dane logowania' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Nieprawidłowe dane logowania' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error('Błąd serwera przy logowaniu:', err.message);
        res.status(500).send('Błąd serwera');
    }
});


// GET /api/auth/status - Sprawdzenie statusu zalogowania
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'Nie znaleziono użytkownika' });
    }
    // Zwracamy użytkownika bez hasła
    const { password, ...userToReturn } = user;
    res.json(userToReturn);
  } catch (err) {
    console.error('Błąd serwera przy sprawdzaniu statusu:', err.message);
    res.status(500).send('Błąd serwera');
  }
});


module.exports = router;
