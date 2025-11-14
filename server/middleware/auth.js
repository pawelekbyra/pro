// Plik: server/middleware/auth.js
// Middleware do weryfikacji tokena JWT

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Pobierz token z nagłówka
  const token = req.header('x-auth-token');

  // Sprawdź, czy token istnieje
  if (!token) {
    return res.status(401).json({ msg: 'Brak tokena, autoryzacja odrzucona' });
  }

  // Zweryfikuj token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Dodaj zdekodowane dane użytkownika do obiektu req
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token jest nieprawidłowy' });
  }
};
