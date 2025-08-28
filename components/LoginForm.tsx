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

    try {
      await login({ username, password });
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || t('loginUnknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 pb-5 bg-white">
      <Input
        type="text"
        placeholder={t('loginPlaceholder')}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
        className="bg-gray-100 border-gray-300 text-black placeholder:text-gray-500"
      />
      <Input
        type="password"
        placeholder={t('passwordPlaceholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className="bg-gray-100 border-gray-300 text-black placeholder:text-gray-500"
      />
      <Button type="submit" variant="default" disabled={isLoading} className="font-bold uppercase tracking-wider bg-pink-600 hover:bg-pink-700">
        {isLoading ? t('loggingIn') : t('loginButton')}
      </Button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </form>
  );
};

export default LoginForm;
