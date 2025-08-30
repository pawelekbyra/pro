"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { TypingChallengeData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TypingChallengeProps {
  challengeData: TypingChallengeData;
}

const TypingChallenge: React.FC<TypingChallengeProps> = ({ challengeData }) => {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [finalTitle, setFinalTitle] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const selectNewPhrase = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * challengeData.phrases.length);
    setCurrentPhrase(challengeData.phrases[randomIndex]);
  }, [challengeData.phrases]);

  useEffect(() => {
    selectNewPhrase();
  }, [selectNewPhrase]);

  const resetTest = () => {
    selectNewPhrase();
    setUserInput('');
    setIsTyping(false);
    setStartTime(null);
    setWpm(0);
    setFinalTitle(null);
    setIsFinished(false);
  };

  const calculateWPM = (timeTaken: number) => {
    const words = currentPhrase.split(' ').length;
    const minutes = timeTaken / 1000 / 60;
    return Math.round(words / minutes);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setUserInput(value);

    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      setStartTime(Date.now());
    }

    if (value === currentPhrase) {
      setIsFinished(true);
      if (startTime) {
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        const calculatedWpm = calculateWPM(timeTaken);
        setWpm(calculatedWpm);

        if (calculatedWpm < 30) {
          setFinalTitle(challengeData.titles.slow);
        } else if (calculatedWpm < 60) {
          setFinalTitle(challengeData.titles.average);
        } else if (calculatedWpm < 90) {
          setFinalTitle(challengeData.titles.fast);
        } else {
          setFinalTitle(challengeData.titles.insane);
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Wielki Test Szybkości Pisania</h1>
      <div className="p-4 bg-gray-800 rounded-lg mb-4">
        <p className="text-lg text-center font-mono">{currentPhrase}</p>
      </div>
      <Input
        type="text"
        value={userInput}
        onChange={handleInputChange}
        placeholder="Zacznij pisać tutaj..."
        className="w-full max-w-md text-black"
        disabled={isFinished}
      />
      {isFinished ? (
        <div className="text-center mt-4">
          <h2 className="text-xl">Gratulacje!</h2>
          <p className="text-3xl font-bold">{wpm} WPM</p>
          <p className="text-lg mt-2">{finalTitle}</p>
          <Button onClick={resetTest} className="mt-4">
            Spróbuj jeszcze raz
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-gray-400">Powodzenia!</p>
      )}
    </div>
  );
};

export default TypingChallenge;
