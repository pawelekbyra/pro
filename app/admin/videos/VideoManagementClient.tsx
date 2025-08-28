'use client';

import { Slide } from '@/lib/db';
import React from 'react';

interface VideoManagementClientProps {
  videos: Slide[];
  deleteVideoAction: (formData: FormData) => Promise<void>;
}

export default function VideoManagementClient({ videos, deleteVideoAction }: VideoManagementClientProps) {
  return (
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
              <td className="p-2">{video.user}</td>
              <td className="p-2">
                <form action={deleteVideoAction}>
                  <input type="hidden" name="slideId" value={video.id} />
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
  );
}
