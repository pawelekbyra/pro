import React, { useState, useEffect, useCallback } from 'react';
import type { GameSlide } from '@/lib/types';

const GAME_HEIGHT = 500;
const PLAYER_SIZE = 40;
const GRAVITY = 800; // Adjusted for deltaTime implementation
const JUMP_STRENGTH = -350; // A direct impulse
const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 180; // Slightly larger gap
const OBSTACLE_SPEED = 180; // Pixels per second
const OBSTACLE_INTERVAL = 1800; // ms

const FlappyDivGame = ({ slide }: { slide: GameSlide }) => {
  const [playerY, setPlayerY] = useState(GAME_HEIGHT / 2);
  const [velocityY, setVelocityY] = useState(0);
  const [obstacles, setObstacles] = useState<{ x: number; gapY: number }[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const resetGame = useCallback(() => {
    setPlayerY(GAME_HEIGHT / 2);
    setVelocityY(0);
    setObstacles([]);
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
  }, []);

  const jump = useCallback(() => {
    if (!isGameOver) {
      setVelocityY(JUMP_STRENGTH);
    }
  }, [isGameOver]);

  const gameLoopRef = React.useRef<number>();
  const lastTimeRef = React.useRef<number>();
  const lastObstacleTimeRef = React.useRef<number>(0);

  const gameLoop = useCallback((time: number) => {
    if (lastTimeRef.current === undefined) {
      lastTimeRef.current = time;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const deltaTime = (time - lastTimeRef.current) / 1000; // in seconds

    // --- Game Logic ---
    // Gravity
    setPlayerY(prevPlayerY => {
        const newVelocityY = velocityY + GRAVITY * deltaTime;
        setVelocityY(newVelocityY);
        const newPlayerY = prevPlayerY + newVelocityY;

        if (newPlayerY >= GAME_HEIGHT - PLAYER_SIZE) {
            setIsGameOver(true);
            setIsRunning(false);
            return GAME_HEIGHT - PLAYER_SIZE;
        }
        return Math.max(0, newPlayerY);
    });

    // Obstacle generation
    if (time - lastObstacleTimeRef.current > OBSTACLE_INTERVAL) {
        lastObstacleTimeRef.current = time;
        const gapY = Math.random() * (GAME_HEIGHT - OBSTACLE_GAP - 100) + 50;
        setObstacles(prev => [...prev, { x: 500, gapY }]);
    }

    // Move obstacles, check collision, and score
    setObstacles(prevObstacles => {
        let newScore = score;
        const newObstacles = prevObstacles
            .map(obs => ({ ...obs, x: obs.x - OBSTACLE_SPEED * deltaTime }))
            .filter(obs => obs.x > -OBSTACLE_WIDTH);

        const playerRect = { x: 100, y: playerY, width: PLAYER_SIZE, height: PLAYER_SIZE };
        for (const obs of newObstacles) {
            const topPipeRect = { x: obs.x, y: 0, width: OBSTACLE_WIDTH, height: obs.gapY };
            const bottomPipeRect = { x: obs.x, y: obs.gapY + OBSTACLE_GAP, width: OBSTACLE_WIDTH, height: GAME_HEIGHT };

            if (
                playerRect.x < obs.x + OBSTACLE_WIDTH && playerRect.x + playerRect.width > obs.x &&
                (playerRect.y < topPipeRect.y + topPipeRect.height || playerRect.y + playerRect.height > bottomPipeRect.y)
            ) {
                setIsGameOver(true);
                setIsRunning(false);
                return [];
            }
        }

        const passedObstacle = prevObstacles.find(obs => obs.x + OBSTACLE_WIDTH < playerRect.x && obs.x + OBSTACLE_WIDTH >= playerRect.x - (OBSTACLE_SPEED * deltaTime));
        if(passedObstacle) {
            newScore++;
        }
        setScore(newScore);

        return newObstacles;
    });
    // --- End Game Logic ---

    lastTimeRef.current = time;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [velocityY, playerY, score]);

  useEffect(() => {
    if (isRunning && !isGameOver) {
      lastTimeRef.current = undefined; // Reset time for new game loop
      lastObstacleTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isRunning, isGameOver, gameLoop]);

  const handleInteraction = useCallback(() => {
    if (!isRunning && isGameOver) {
      resetGame();
    } else if (!isRunning) {
        setIsRunning(true);
        jump();
    } else {
      jump();
    }
  }, [isRunning, isGameOver, resetGame, jump]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleInteraction();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInteraction]);

  return (
    <div
      onClick={handleInteraction}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
        overflow: 'hidden',
        fontFamily: 'monospace',
        color: 'white',
        cursor: 'pointer',
      }}
    >
      {/* Player */}
      <div style={{ position: 'absolute', top: playerY, left: 100, width: PLAYER_SIZE, height: PLAYER_SIZE, background: '#FFD700', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
        DIV
      </div>

      {/* Obstacles */}
      {obstacles.map((obs, i) => (
        <React.Fragment key={i}>
          <div style={{ position: 'absolute', top: 0, left: obs.x, width: OBSTACLE_WIDTH, height: obs.gapY, background: '#FF4136' }}></div>
          <div style={{ position: 'absolute', top: obs.gapY + OBSTACLE_GAP, left: obs.x, width: OBSTACLE_WIDTH, height: GAME_HEIGHT, background: '#FF4136' }}></div>
        </React.Fragment>
      ))}

      {/* Score */}
      <div style={{ position: 'absolute', top: 10, left: 10, fontSize: '2rem' }}>
        Score: {score}
      </div>

      {/* Start/Game Over Message */}
      {!isRunning && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
          <h1>{isGameOver ? 'Game Over' : (slide.data.description || 'Flappy Div')}</h1>
          <p>Click or Press Space to {isGameOver ? 'Play Again' : 'Start'}</p>
        </div>
      )}
    </div>
  );
};

export default FlappyDivGame;
