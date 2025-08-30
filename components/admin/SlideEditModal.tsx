'use client';

import React, { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Slide, VideoSlide } from '@/lib/types'; // Updated import
import { User } from '@/lib/db.interfaces';

interface SlideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide | null;
  users: User[];
  createSlideAction: (formData: FormData) => Promise<void>;
  updateSlideAction: (formData: FormData) => Promise<void>;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white disabled:bg-pink-800 disabled:opacity-70"
    >
      {pending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Slide'}
    </button>
  );
}

export default function SlideEditModal({
  isOpen,
  onClose,
  slide,
  users,
  createSlideAction,
  updateSlideAction,
}: SlideEditModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = slide !== null;
  const videoData = isEditing && slide?.type === 'video' ? (slide as VideoSlide).data : null;

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen, slide]);

  const handleFormAction = async (formData: FormData) => {
    if (isEditing) {
      await updateSlideAction(formData);
    } else {
      await createSlideAction(formData);
    }
    formRef.current?.reset();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Slide' : 'Create New Slide'}</h2>
        <form ref={formRef} action={handleFormAction}>
          {isEditing && <input type="hidden" name="slideId" value={slide.id} />}

          {/* We can only create video slides for now */}
          <input type="hidden" name="type" value="video" />

          {!isEditing && (
            <div className="mb-4">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-1">Uploader</label>
              <select id="userId" name="userId" required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.displayName} ({user.username})</option>
                ))}
              </select>
            </div>
          )}

          {isEditing && (
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Uploader</label>
                <p className="p-2 text-gray-400">{slide.username}</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="x" className="block text-sm font-medium text-gray-300 mb-1">Coordinate X</label>
                <input type="number" id="x" name="x" defaultValue={slide?.x ?? ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
            </div>
            <div>
                <label htmlFor="y" className="block text-sm font-medium text-gray-300 mb-1">Coordinate Y</label>
                <input type="number" id="y" name="y" defaultValue={slide?.y ?? ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea id="description" name="description" defaultValue={videoData?.description || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" rows={3} />
          </div>

          <div className="mb-4">
            <label htmlFor="mp4Url" className="block text-sm font-medium text-gray-300 mb-1">MP4 URL</label>
            <input type="url" id="mp4Url" name="mp4Url" defaultValue={videoData?.mp4Url || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
          </div>

          <div className="mb-4">
            <label htmlFor="poster" className="block text-sm font-medium text-gray-300 mb-1">Poster Image URL</label>
            <input type="url" id="poster" name="poster" defaultValue={videoData?.poster || ''} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
          </div>

          <div className="mb-4">
            <label htmlFor="access" className="block text-sm font-medium text-gray-300 mb-1">Access</label>
            <select id="access" name="access" defaultValue={slide?.access || 'public'} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
              <option value="public">Public</option>
              <option value="secret">Secret</option>
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white">
              Cancel
            </button>
            <SubmitButton isEditing={isEditing} />
          </div>
        </form>
      </div>
    </div>
  );
}
