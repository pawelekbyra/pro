'use client';

import React, { useState, useEffect } from 'react';
import { Slide } from '@/lib/types';
import { User } from '@/lib/db.interfaces';

interface SlideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<{ success: boolean, error?: string }>;
  slide?: Slide | null;
  users: User[];
}

export default function SlideEditModal({ isOpen, onClose, onSubmit, slide, users }: SlideEditModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [type, setType] = useState<'video' | 'image' | 'html'>('video');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorId, setAuthorId] = useState('');

  useEffect(() => {
    if (slide) {
      setType(slide.type);
      setAuthorId(slide.userId);
      if (slide.type === 'video' && slide.data?.mp4Url) {
        setTitle(slide.data.title || '');
        setContent(slide.data.mp4Url);
      } else if (slide.type === 'image' && slide.data?.imageUrl) {
        setTitle(slide.data.altText || '');
        setContent(slide.data.imageUrl);
      } else if (slide.type === 'html' && slide.data?.htmlContent) {
        setTitle('HTML Content'); // HTML slides don't have a title in the same way
        setContent(slide.data.htmlContent);
      }
    } else {
      // Reset form for new slide
      setType('video');
      setTitle('');
      setContent('');
      setAuthorId(users.length > 0 ? users[0].id : '');
    }
  }, [slide, users]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (slide) {
      formData.append('id', slide.id);
    }

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'An unknown error occurred.');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{slide ? 'Edit Slide' : 'Create New Slide'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}

          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-300">Type</label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="html">HTML</option>
            </select>
          </div>

          {!slide && (
            <div className="mb-4">
              <label htmlFor="author_id" className="block text-sm font-medium text-gray-300">Author</label>
              <select
                id="author_id"
                name="author_id"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">Content</label>
            <textarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              placeholder={
                type === 'video' ? 'Enter video URL' :
                type === 'image' ? 'Enter image URL' :
                'Enter HTML content'
              }
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-500"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
