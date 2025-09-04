'use client';

import { Slide } from '@/lib/types';
import { User } from '@/lib/db.interfaces';
import React, { useState } from 'react';
import SlideEditModal from '@/components/admin/SlideEditModal';

type ActionResponse = { success: boolean; error?: string };

interface SlideManagementClientProps {
  slides: Slide[];
  users: User[];
  createSlideAction: (formData: FormData) => Promise<ActionResponse>;
  updateSlideAction: (formData: FormData) => Promise<ActionResponse>;
  deleteSlideAction: (formData: FormData) => Promise<ActionResponse>;
}

export default function SlideManagementClient({ slides, users, createSlideAction, updateSlideAction, deleteSlideAction }: SlideManagementClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

  const handleNewSlide = () => {
    setEditingSlide(null);
    setIsModalOpen(true);
  };

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const handleSubmit = async (formData: FormData) => {
    const action = editingSlide ? updateSlideAction : createSlideAction;
    const result = await action(formData);
    if (result.success) {
      handleCloseModal();
    }
    return result;
  };

  const handleDelete = async (slideId: string) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      const formData = new FormData();
      formData.append('id', slideId); // Corrected from 'slideId' to 'id' to match server action
      const result = await deleteSlideAction(formData);
      if (result && !result.success) {
        alert(`Error deleting slide: ${result.error}`);
      }
      // The page will be revalidated by the server action on success
    }
  };

  const getSlideDescription = (slide: Slide) => {
    if (slide.type === 'video') return slide.data?.title || 'Video';
    if (slide.type === 'image') return slide.data?.altText || 'Image';
    if (slide.type === 'html') return 'HTML Content';
    return 'N/A';
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleNewSlide}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
        >
          New Slide
        </button>
      </div>
      <div className="bg-gray-800 shadow-md rounded-lg p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">Coords</th>
              <th className="p-2">Type</th>
              <th className="p-2">Description</th>
              <th className="p-2">Uploader</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map((slide) => (
              <tr key={slide.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-2 font-mono">{`(${slide.x},${slide.y})`}</td>
                <td className="p-2 capitalize">{slide.type}</td>
                <td className="p-2 truncate" title={getSlideDescription(slide)}>{getSlideDescription(slide)}</td>
                <td className="p-2">{slide.username}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(slide)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlideEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        slide={editingSlide}
        users={users}
      />
    </>
  );
}
