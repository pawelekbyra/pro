'use client';

import React, { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Slide } from '@/lib/db';

interface VideoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Slide | null;
  createVideoAction: (formData: FormData) => Promise<void>;
  updateVideoAction: (formData: FormData) => Promise<void>;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-md bg-pink-600 hover:bg-pink-700 text-white disabled:bg-pink-800 disabled:opacity-70"
    >
      {pending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Video'}
    </button>
  );
}

export default function VideoEditModal({
  isOpen,
  onClose,
  video,
  createVideoAction,
  updateVideoAction,
}: VideoEditModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = video !== null;

  useEffect(() => {
    // Reset form when modal is closed or video data changes
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen, video]);

  const handleFormAction = async (formData: FormData) => {
    if (isEditing) {
      await updateVideoAction(formData);
    } else {
      await createVideoAction(formData);
    }
    formRef.current?.reset();
    onClose(); // Close modal on success
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Video' : 'Create New Video'}</h2>
        <form ref={formRef} action={handleFormAction}>
          {isEditing && <input type="hidden" name="slideId" value={video.id} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="user" className="block text-sm font-medium text-gray-300 mb-1">Uploader Name</label>
              <input type="text" id="user" name="user" defaultValue={video?.user || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
            </div>
            <div className="mb-4">
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Uploader Avatar URL</label>
              <input type="url" id="avatar" name="avatar" defaultValue={video?.avatar || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea id="description" name="description" defaultValue={video?.description || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" rows={3} />
          </div>

          <div className="mb-4">
            <label htmlFor="mp4Url" className="block text-sm font-medium text-gray-300 mb-1">MP4 URL</label>
            <input type="url" id="mp4Url" name="mp4Url" defaultValue={video?.mp4Url || ''} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
          </div>

          <div className="mb-4">
            <label htmlFor="poster" className="block text-sm font-medium text-gray-300 mb-1">Poster Image URL</label>
            <input type="url" id="poster" name="poster" defaultValue={video?.poster || ''} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" />
          </div>

          <div className="mb-4">
            <label htmlFor="access" className="block text-sm font-medium text-gray-300 mb-1">Access</label>
            <select id="access" name="access" defaultValue={video?.access || 'public'} required className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white">
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
