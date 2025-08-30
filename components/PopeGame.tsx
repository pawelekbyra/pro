"use client";

import React, { useState, useEffect } from 'react';
import { PopeGameData } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface PopeGameProps {
  gameData: PopeGameData;
}

const RobotRobert = ({ text }: { text: string }) => {
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <p className="text-white text-center">{text}</p>
    </div>
  );
};

const PopeGame: React.FC<PopeGameProps> = ({ gameData }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(gameData.scenarios[0]);
  const [finalTitle, setFinalTitle] = useState('');
  const [isChoiceMade, setIsChoiceMade] = useState(false);

  useEffect(() => {
    if (gameState === 'playing' && !isChoiceMade) {
      if (currentRound < gameData.scenarios.length) {
        setCurrentScenario(gameData.scenarios[currentRound]);
      } else if (currentRound === gameData.scenarios.length) {
        setCurrentScenario(gameData.bossFight);
      } else {
        setGameState('finished');
      }
    }
  }, [gameState, currentRound, gameData, isChoiceMade]);

  useEffect(() => {
    if (gameState === 'finished') {
      if (score < 10) {
        setFinalTitle('Papież Sarkastycznej Dobroci');
      } else if (score < 15) {
        setFinalTitle('Papież Neutralnego Pokoju');
      } else {
        setFinalTitle('Papież Prawdziwej Świętości');
      }
    }
  }, [gameState, score]);

  const handleChoice = (choice: 'dopyskuj' | 'powiedz_milo') => {
    if (isChoiceMade) return;

    if (choice === 'dopyskuj') {
      setScore(s => s + 3);
    } else {
      setScore(s => s + 5);
    }
    setIsChoiceMade(true);

    setTimeout(() => {
      setCurrentRound(r => r + 1);
      setIsChoiceMade(false);
    }, 2000);
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentRound(0);
    setScore(0);
    setIsChoiceMade(false);
  };

  const renderContent = () => {
    switch (gameState) {
      case 'intro':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <RobotRobert text="Witaj w grze 'Papież: Gra w bycie miłym'. Kliknij START, aby rozpocząć." />
            <Button onClick={startGame} className="mt-4">START GAME</Button>
          </div>
        );
      case 'playing':
        return (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <RobotRobert text={currentScenario.text} />
            <div className="flex mt-4">
              <Button onClick={() => handleChoice('dopyskuj')} className="mr-2" disabled={isChoiceMade}>
                {currentScenario.choices.dopyskuj}
              </Button>
              <Button onClick={() => handleChoice('powiedz_milo')} disabled={isChoiceMade}>
                {currentScenario.choices.powiedz_milo}
              </Button>
            </div>
            {isChoiceMade && <p className="text-white mt-4">Chwila namysłu...</p>}
          </div>
        );
      case 'finished':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <RobotRobert text={`Koniec gry! Twój wynik to: ${score}.`} />
            <h2 className="text-2xl text-white mt-4">{finalTitle}</h2>
            <Button onClick={startGame} className="mt-4">Zagraj ponownie</Button>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full bg-black text-white">
      {renderContent()}
    </div>
  );
};

export default PopeGame;
