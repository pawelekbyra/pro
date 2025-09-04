"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';

const CompanyPitch: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'about' | 'mission' | 'team' | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case 'about':
        return (
          <div className="p-4 text-center">
            <h3 className="text-2xl font-bold mb-2">Who We Are?</h3>
            <p>We are innovators, creators, and dreamers. Our goal is to revolutionize the digital space with cutting-edge solutions that inspire and engage.</p>
          </div>
        );
      case 'mission':
        return (
          <div className="p-4 text-center">
            <h3 className="text-2xl font-bold mb-2">Our Mission</h3>
            <p>Our mission is to build a connected world where technology serves humanity. We strive to create intuitive and powerful tools for everyone.</p>
            {/* Video placeholder */}
            <div className="w-full h-64 bg-black mt-4 flex items-center justify-center">
              <p className="text-white">Company Story Video</p>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="p-4 text-center">
            <h3 className="text-2xl font-bold mb-2">The Team</h3>
            <div className="flex justify-center gap-4 mt-4">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-600 mx-auto mb-2"></div>
                <p>Jules</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-600 mx-auto mb-2"></div>
                <p>Alex</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-600 mx-auto mb-2"></div>
                <p>Maria</p>
              </div>
            </div>
          </div>
        );
      default:
        return <h2 className="text-4xl font-bold">Our Company</h2>;
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-800 text-white p-8">
      <div className="absolute top-5 flex gap-4">
        <Button onClick={() => setActiveSection('about')} className="bg-indigo-600 hover:bg-indigo-700">Who We Are?</Button>
        <Button onClick={() => setActiveSection('mission')} className="bg-indigo-600 hover:bg-indigo-700">Our Mission</Button>
        <Button onClick={() => setActiveSection('team')} className="bg-indigo-600 hover:bg-indigo-700">The Team</Button>
      </div>
      <div className="mt-16">
        {renderContent()}
      </div>
    </div>
  );
};

export default CompanyPitch;
