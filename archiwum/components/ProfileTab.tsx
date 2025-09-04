"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ToggleSwitch from './ui/ToggleSwitch';
import CropModal from './CropModal';
import { Crown } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface ProfileTabProps {
    onClose: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ onClose }) => {
  const { user: profile, checkUserStatus, logout } = useUser();
  const { t, setLanguage, lang } = useTranslation();
  const { addToast } = useToast();
  const [emailConsent, setEmailConsent] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || t('profileUpdateError'));
      }

      setStatus({ type: 'success', message: t('profileUpdateSuccess') });
      await checkUserStatus();

    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleCropComplete = async (avatarBlob: Blob | null) => {
    if (!avatarBlob) {
      setIsCropModalOpen(false);
      setImageToCrop(null);
      return;
    }

    const formData = new FormData();
    formData.append('avatar', avatarBlob, 'avatar.png');

    setStatus(null);
    try {
      const res = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || t('avatarUploadError'));
      }

      setStatus({ type: 'success', message: t('avatarUploadSuccess') });
      await checkUserStatus();
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsCropModalOpen(false);
      setImageToCrop(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast(t('logoutSuccess'), 'success');
    onClose();
  };

  if (!profile) {
    return <div className="p-5 text-center">{t('loadingProfile')}</div>;
  }

  return (
    <>
      <div className="tab-pane active p-4" id="profile-tab">
        {status && (
          <div className={`p-3 rounded-md mb-4 text-sm ${status.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {status.message}
          </div>
        )}

        <div className="avatar-section bg-white/5 border border-white/10 rounded-xl p-5 mb-4 flex flex-col items-center text-center">
            <div className="relative w-20 h-20 mb-3">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-lg bg-gray-800 flex items-center justify-center">
                    {profile.avatar ? (
                        <Image src={profile.avatar} alt={t('avatarAlt')} width={80} height={80} className="w-full h-full object-cover" id="userAvatar" />
                    ) : (
                        <span className="text-4xl text-gray-500">{profile.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <button onClick={handleAvatarEditClick} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-pink-600 border-2 border-[#2d2d2d] rounded-full text-white text-lg font-bold flex items-center justify-center" id="avatarEditBtn" title={t('changeAvatarTitle')}>
                    +
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
            </div>
            <div className="flex flex-col items-center gap-1">
                <h3 className="text-lg font-bold" id="displayName">{profile.displayName}</h3>
                <p className="text-sm text-white/60" id="userEmail">{profile.email}</p>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold shadow-md mt-1">
                    <Crown size={14} />
                    <span>{t('patronTier')}</span>
                </div>
            </div>
        </div>

        <div className="form-section bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
          <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>{t('personalData')}</h3>
          <form id="profileForm" onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label text-sm font-medium mb-2 block">{t('firstName')}</label>
                <Input type="text" name="firstName" defaultValue={profile.displayName?.split(' ')[0] || ''} placeholder={t('firstNamePlaceholder')} disabled={isSubmitting} />
              </div>
              <div className="form-group">
                <label className="form-label text-sm font-medium mb-2 block">{t('lastName')}</label>
                <Input type="text" name="lastName" defaultValue={profile.displayName?.split(' ').slice(1).join(' ') || ''} placeholder={t('lastNamePlaceholder')} disabled={isSubmitting} />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label text-sm font-medium mb-2 block">{t('email')}</label>
              <Input type="email" name="email" defaultValue={profile.email} placeholder={t('emailPlaceholder')} disabled={isSubmitting} />
            </div>
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : t('saveChanges')}
            </Button>
          </form>
        </div>

        <div className="settings-section bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>{t('settings')}</h3>
          <form onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setStatus(null);
              setTimeout(() => {
                try {
                  console.log('Saving settings:', { emailConsent, lang });
                  setStatus({ type: 'success', message: t('settingsSaveSuccess') });
                } catch (error: any) {
                  setStatus({ type: 'error', message: error.message });
                } finally {
                  setIsSubmitting(false);
                }
              }, 1000);
          }}>
            <div className="flex items-center justify-between mb-4">
              <label className="form-label text-sm">{t('emailConsent')}</label>
              <ToggleSwitch isActive={emailConsent} onToggle={() => setEmailConsent(p => !p)} />
            </div>
            <div className="form-group">
                <label className="form-label text-sm font-medium mb-2 block">{t('emailLanguage')}</label>
                <div className="flex gap-2">
                    <Button type="button" variant={lang === 'pl' ? 'secondary' : 'outline'} onClick={() => setLanguage('pl')} className="flex-1">{t('polish')}</Button>
                    <Button type="button" variant={lang === 'en' ? 'secondary' : 'outline'} onClick={() => setLanguage('en')} className="flex-1">{t('english')}</Button>
                </div>
            </div>
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 mt-4" disabled={isSubmitting}>
              {isSubmitting ? t('saving') : t('saveSettings')}
            </Button>
          </form>
        </div>
        <div className="flex justify-center mt-4">
            <Button
              onClick={handleLogout}
              className="w-full bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {t('logoutLink')}
            </Button>
        </div>
      </div>

      {isCropModalOpen && (
        <CropModal
            isOpen={isCropModalOpen}
            onClose={() => setIsCropModalOpen(false)}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default ProfileTab;
