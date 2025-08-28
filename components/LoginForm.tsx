"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LoginForm: React.FC = () => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle login logic here
    console.log('Login form submitted');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-6 py-5">
      <Input type="text" placeholder="Login" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
      <Input type="password" placeholder="Password" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
      <Button type="submit" variant="secondary" className="font-bold uppercase tracking-wider">
        Enter
      </Button>
    </form>
  );
};

export default LoginForm;
