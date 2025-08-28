"use client";

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ToggleSwitch from './ui/ToggleSwitch';
import CropModal from './CropModal';
import { Crown } from 'lucide-react';
import { useUser } from '@/context/UserContext'; // Import useUser

const ProfileTab: React.FC = () => {
  const { user: profile, checkUserStatus } = useUser(); // Use user from context
  const [emailConsent, setEmailConsent] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for cropping modal
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
        throw new Error(result.message || 'Failed to update profile.');
      }

      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      // Refresh the user context with the new data
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
    event.target.value = ''; // Reset input value
  };

  const handleCropComplete = async (newAvatarUrl: string) => {
      // This will be fully implemented in the next step
      // For now, just close the modal and refresh context
      await checkUserStatus();
      setIsCropModalOpen(false);
      setImageToCrop(null);
      setStatus({ type: 'success', message: 'Avatar updated successfully!' });
  }

  if (!profile) {
    return <div className="p-5 text-center">Loading profile...</div>;
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
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/80 shadow-lg">
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" id="userAvatar" />
                </div>
                <button onClick={handleAvatarEditClick} className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-pink-600 border-2 border-[#2d2d2d] rounded-full text-white text-lg font-bold flex items-center justify-center" id="avatarEditBtn" title="Change avatar">
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
                    <span>Patron</span>
                </div>
            </div>
        </div>

        <div className="form-section bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
          <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>Personal Data</h3>
          <form id="profileForm" onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label text-sm font-medium mb-2 block">First Name</label>
                <Input type="text" name="firstName" defaultValue={profile.firstName} placeholder="Your first name" disabled={isSubmitting} />
              </div>
              <div className="form-group">
                <label className="form-label text-sm font-medium mb-2 block">Last Name</label>
                <Input type="text" name="lastName" defaultValue={profile.lastName} placeholder="Your last name" disabled={isSubmitting} />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label text-sm font-medium mb-2 block">Email</label>
              <Input type="email" name="email" defaultValue={profile.email} placeholder="email@example.com" disabled={isSubmitting} />
            </div>
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>

        <div className="settings-section bg-white/5 border border-white/10 rounded-xl p-5">
          <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>Settings</h3>
          <div className="flex items-center justify-between mb-4">
            <label className="form-label text-sm">Email Consent</label>
            <ToggleSwitch isActive={emailConsent} onToggle={() => setEmailConsent(p => !p)} />
          </div>
          <Button className="w-full bg-pink-600 hover:bg-pink-700">Save Settings</Button>
        </div>
      </div>

      <CropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};

export default ProfileTab;
