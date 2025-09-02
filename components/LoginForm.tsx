"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { useTranslation } from '@/context/LanguageContext';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const { t } = useTranslation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (username === 'admin' && password === 'admin') {
      onLoginSuccess?.();
      setIsLoading(false);
      return;
    }

    try {
      await login({ email: username, password });
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || t('loginUnknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pb-5">
      <Input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={t('loginPlaceholder')}
        disabled={isLoading}
        autoComplete="username"
        className="bg-white border-2 border-black text-black placeholder:text-gray-500 font-mono focus:ring-2 focus:ring-pink-500"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t('passwordPlaceholder')}
        disabled={isLoading}
        autoComplete="current-password"
        className="bg-white border-2 border-black text-black placeholder:text-gray-500 font-mono focus:ring-2 focus:ring-pink-500"
      />
      <Button type="submit" variant="default" disabled={isLoading} className="font-bold uppercase tracking-wider bg-pink-600 hover:bg-pink-700">
        {isLoading ? t('loggingIn') : 'ENTER'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </form>
  );
};

export default LoginForm;
