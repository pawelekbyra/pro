"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 py-5">
      <Input
        type="text"
        placeholder="Login"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
      />
      <Button type="submit" variant="secondary" disabled={isLoading} className="font-bold uppercase tracking-wider">
        {isLoading ? 'Logging in...' : 'Enter'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </form>
  );
};

export default LoginForm;
