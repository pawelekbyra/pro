'use client';

import { Video, User } from '@/lib/db'; // Changed from Slide
import React, { useState } from 'react';
import VideoEditModal from '@/components/admin/VideoEditModal';

interface VideoManagementClientProps {
  videos: Video[]; // Changed from Slide[]
  users: User[];
  createVideoAction: (formData: FormData) => Promise<void>;
  updateVideoAction: (formData: FormData) => Promise<void>;
  deleteVideoAction: (formData: FormData) => Promise<void>;
}

export default function VideoManagementClient({ videos, users, createVideoAction, updateVideoAction, deleteVideoAction }: VideoManagementClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null); // Changed from Slide

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedVideo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: Video) => { // Changed from Slide
    setModalMode('edit');
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVideo(null);
    setModalMode(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleOpenCreateModal}
          className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded"
        >
          New Video
        </button>
      </div>
      <div className="bg-gray-800 shadow-md rounded-lg p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2">ID</th>
              <th className="p-2">Description</th>
              <th className="p-2">Uploader</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-2 truncate" title={video.id}>{video.id.substring(0, 8)}...</td>
                <td className="p-2">{video.description}</td>
                <td className="p-2">{video.username}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(video)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    Edit
                  </button>
                  <form action={deleteVideoAction}>
                    <input type="hidden" name="videoId" value={video.id} />
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
      <VideoEditModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        video={selectedVideo}
        users={users}
        createVideoAction={createVideoAction}
        updateVideoAction={updateVideoAction}
      />
    </>
  );
}
