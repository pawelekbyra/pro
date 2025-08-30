"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Check } from 'lucide-react';

interface PollData {
  question: string;
  options: string[];
}

interface PollProps {
  pollData: PollData;
}

const Poll: React.FC<PollProps> = ({ pollData }) => {
  const [voted, setVoted] = useState<number | null>(null);
  const mockResults = [42, 69, 13]; // Hardcoded results

  const handleVote = (index: number) => {
    setVoted(index);
  };

  const totalVotes = mockResults.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      <h2 className="text-2xl font-bold text-center mb-6">{pollData.question}</h2>
      <div className="w-full max-w-sm">
        {pollData.options.map((option, index) => (
          <div key={index} className="mb-3">
            {voted === null ? (
              <Button
                onClick={() => handleVote(index)}
                className="w-full justify-start text-lg p-6 bg-white/10 hover:bg-white/20"
              >
                {option}
              </Button>
            ) : (
              <div className="relative w-full text-left p-4 bg-white/10 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-green-500/50"
                  style={{ width: `${(mockResults[index] / totalVotes) * 100}%` }}
                />
                <div className="relative flex justify-between items-center">
                  <span>{option}</span>
                  <span className="font-bold">{`${Math.round((mockResults[index] / totalVotes) * 100)}%`}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {voted !== null && (
        <div className="flex items-center mt-6 text-lg">
          <Check className="mr-2 text-green-400" />
          <p>Dziękujemy za udział!</p>
        </div>
      )}
    </div>
  );
};

export default Poll;
