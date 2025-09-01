"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

const PasswordTab: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus({ type: 'success', message: result.message || t('passwordChangeSuccess') });
        (event.target as HTMLFormElement).reset();
      } else {
        throw new Error(result.message || t('passwordChangeError'));
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="tab-pane active p-4" id="password-tab">
      <div className="profile-section bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>{t('changePasswordTitle')}</h3>
        <form id="passwordForm" onSubmit={handlePasswordSubmit}>
          <div className="form-group mb-4">
            <label className="form-label text-sm font-medium mb-2 block">{t('currentPasswordLabel')}</label>
            <Input type="password" name="currentPassword" placeholder={t('currentPasswordPlaceholder')} required autoComplete="current-password" />
          </div>
          <div className="form-group mb-4">
            <label className="form-label text-sm font-medium mb-2 block">{t('newPasswordLabel')}</label>
            <Input type="password" name="newPassword" placeholder={t('newPasswordPlaceholder')} required autoComplete="new-password" />
          </div>
          <div className="form-group mb-4">
            <label className="form-label text-sm font-medium mb-2 block">{t('confirmPasswordLabel')}</label>
            <Input type="password" name="confirmPassword" placeholder={t('confirmPasswordPlaceholder')} required autoComplete="new-password" />
            <p className="text-xs text-white/60 mt-2">
              {t('passwordMinLength')}
            </p>
          </div>
          <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? t('changingPassword') : t('changePasswordButton')}
          </Button>
          {status && (
            <div className={`mt-4 text-sm p-3 rounded-md ${status.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PasswordTab;
