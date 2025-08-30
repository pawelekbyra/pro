"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

interface StoryChoice {
  text: string;
  nextSlide: { x: number; y: number };
}

interface StoryData {
  text: string;
  choices: StoryChoice[];
}

interface StoryProps {
  storyData: StoryData;
  onNavigate: (coordinates: { x: number; y: number }) => void;
}

const Story: React.FC<StoryProps> = ({ storyData, onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <BookOpen size={48} className="mb-4 text-yellow-400" />
      <p className="text-lg text-center leading-relaxed max-w-prose mb-8">
        {storyData.text}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        {storyData.choices.map((choice, index) => (
          <Button
            key={index}
            onClick={() => onNavigate(choice.nextSlide)}
            variant="outline"
            className="bg-transparent border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            {choice.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Story;
