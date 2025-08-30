'use client';

import { Slide, VideoSlide } from '@/lib/types';
import { User } from '@/lib/db.interfaces';
import React, { useState } from 'react';
import SlideEditModal from '@/components/admin/SlideEditModal';

interface SlideManagementClientProps {
  slides: Slide[];
  users: User[];
  createSlideAction: (formData: FormData) => Promise<void>;
  updateSlideAction: (formData: FormData) => Promise<void>;
  deleteSlideAction: (formData: FormData) => Promise<void>;
}

export default function SlideManagementClient({ slides, users, createSlideAction, updateSlideAction, deleteSlideAction }: SlideManagementClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedSlide(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: Slide) => {
    setModalMode('edit');
    setSelectedSlide(slide);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlide(null);
    setModalMode(null);
  };

  const getSlideDescription = (slide: Slide) => {
    if (slide.type === 'video') {
      return (slide as VideoSlide).data.description;
    }
    if (slide.type === 'html') {
      return 'HTML Content';
    }
    return 'N/A';
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenCreateModal}
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
                    onClick={() => handleOpenEditModal(slide)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    Edit
                  </button>
                  <form action={deleteSlideAction}>
                    <input type="hidden" name="slideId" value={slide.id} />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlideEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        slide={selectedSlide}
        users={users}
        createSlideAction={createSlideAction}
        updateSlideAction={updateSlideAction}
      />
    </>
  );
}
