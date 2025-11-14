// Plik: client/src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AuthPages.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      navigate('/'); // Przekieruj na stronę główną po sukcesie
    } catch (err) {
      setError(err.response?.data?.msg || 'Rejestracja nie powiodła się');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Rejestracja</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Hasło</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />
        </div>
        <button type="submit">Zarejestruj</button>
         <p className="switch-auth">
            Masz już konto? <a href="/login">Zaloguj się</a>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
