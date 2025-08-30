"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';

interface QuizProps {
  quizData: {
    question: string;
    answers: {
      text: string;
      nextSlide: { x: number; y: number };
    }[];
  };
  onNavigate: (coordinates: { x: number; y: number }) => void;
}

const Quiz: React.FC<QuizProps> = ({ quizData, onNavigate }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswerClick = (nextSlide: { x: number; y: number }, index: number) => {
    setSelectedAnswer(index);
    setTimeout(() => {
      onNavigate(nextSlide);
    }, 1000); // Wait a second before navigating
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
      <h2 className="text-3xl font-bold mb-8 text-center">{quizData.question}</h2>
      <div className="w-full max-w-md">
        {quizData.answers.map((answer, index) => (
          <Button
            key={index}
            onClick={() => handleAnswerClick(answer.nextSlide, index)}
            className={`w-full mb-4 text-lg p-6 ${selectedAnswer === index ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {answer.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Quiz;
