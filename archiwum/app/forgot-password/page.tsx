'use client';

import React, { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.message || 'An error occurred.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        <p className="text-center text-gray-400">
          Enter your email address and we will send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send Password Reset Email'}
            </button>
          </div>
        </form>
        {message && <p className="text-green-400 text-center">{message}</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
}
