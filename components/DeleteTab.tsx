"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const DELETE_CONFIRM_TEXT = 'USUWAM KONTO';

const DeleteTab: React.FC = () => {
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { logout } = useUser();

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation !== DELETE_CONFIRM_TEXT) {
      setStatus({ type: 'error', message: 'Confirmation text is incorrect.' });
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_text: confirmation }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatus({ type: 'success', message: result.message });
        // The API has cleared the session cookie.
        // Now, update the frontend state by calling logout from the context.
        setTimeout(() => {
          logout();
          // The user is now logged out, and the UI will update.
          // The AccountPanel will close automatically as it's conditional on being logged in.
        }, 2000); // Wait 2 seconds to allow user to read the success message.
      } else {
        throw new Error(result.message || 'Failed to delete account.');
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
      setIsSaving(false);
    }
  };

  return (
    <div className="tab-pane active p-4" id="delete-tab">
      <div className="profile-section bg-white/5 border border-white/10 rounded-xl p-5">
        <h3 className="section-title text-lg font-bold mb-5 flex items-center gap-3"><span className="w-1 h-5 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></span>Delete Account</h3>
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
          <h4 className="text-red-400 font-bold mb-3 text-base">⚠️ Warning!</h4>
          <p className="text-white/80 text-sm leading-relaxed">
            This operation is irreversible. All your data, videos, and settings will be permanently deleted.
          </p>
        </div>
        <form id="deleteForm" onSubmit={handleDeleteSubmit}>
          <div className="form-group mb-4">
            <label className="form-label text-sm font-medium mb-2 block">To confirm, type: <strong>{DELETE_CONFIRM_TEXT}</strong></label>
            <Input
              type="text"
              placeholder={DELETE_CONFIRM_TEXT}
              id="deleteConfirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <p className="text-xs text-white/60 mt-2">
              After deleting your account, you will be automatically logged out.
            </p>
          </div>
          <Button
            type="submit"
            variant="destructive"
            className="w-full mt-4"
            disabled={confirmation !== DELETE_CONFIRM_TEXT || isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Deleting...' : 'Permanently Delete Account'}
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

export default DeleteTab;
