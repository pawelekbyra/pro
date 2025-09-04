"use client";

import { useState, FormEvent } from 'react';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState('');
  const [userType, setUserType] = useState('');
  const [url, setUrl] = useState('/');
  const [targetPwa, setTargetPwa] = useState(false);
  const [targetBrowser, setTargetBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, userId, userType, url, targetPwa, targetBrowser }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Notification sent successfully!');
        setTitle('');
        setBody('');
        setUserId('');
        setUserType('');
        setUrl('/');
        setTargetPwa(false);
        setTargetBrowser(false);
      } else {
        setMessage(data.message || 'Failed to send notification.');
      }
    } catch (err) {
      setMessage('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Send Push Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="body">Body</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium" htmlFor="url">URL</label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="border-t border-gray-600 pt-4">
          <p className="text-sm text-gray-400 mb-2">Targeting:</p>
          <div className="flex flex-col gap-2">
            <div>
              <label className="block mb-1 font-medium" htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setUserType(''); setTargetPwa(false); setTargetBrowser(false); }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 7bfdb7c9-3d8f-4b70-ac77-92741d889861"
              />
            </div>
            <div className="my-2 text-center text-gray-400">OR</div>
            <div>
              <label className="block mb-1 font-medium" htmlFor="userType">User Type</label>
              <select
                id="userType"
                value={userType}
                onChange={(e) => { setUserType(e.target.value); setUserId(''); setTargetPwa(false); setTargetBrowser(false); }}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select Type</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
             <div className="my-2 text-center text-gray-400">OR</div>
             <div className="flex gap-4 justify-center">
                 <label className="flex items-center gap-2 text-gray-300">
                     <input type="checkbox" checked={targetPwa} onChange={(e) => { setTargetPwa(e.target.checked); setUserId(''); setUserType(''); }} />
                     PWA Users
                 </label>
                 <label className="flex items-center gap-2 text-gray-300">
                     <input type="checkbox" checked={targetBrowser} onChange={(e) => { setTargetBrowser(e.target.checked); setUserId(''); setUserType(''); }} />
                     Browser Users
                 </label>
             </div>
          </div>
        </div>
        {message && <p className="text-sm mt-4">{message}</p>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}
