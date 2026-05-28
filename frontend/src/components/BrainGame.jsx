import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Clock, X, Check, XCircle } from 'lucide-react';

const COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#10b981' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#8b5cf6' }
];

const BrainGame = ({ onClose, onComplete }) => {
  const [gameState, setGameState] = useState('start'); // start, playing, complete
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [currentColor, setCurrentColor] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const generateRound = useCallback(() => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let colorIdx = Math.floor(Math.random() * COLORS.length);
    
    // 70% chance they don't match (to cause Stroop effect)
    if (Math.random() > 0.3) {
      while (colorIdx === wordIdx) {
        colorIdx = Math.floor(Math.random() * COLORS.length);
      }
    }
    
    setCurrentWord(COLORS[wordIdx]);
    setCurrentColor(COLORS[colorIdx]);

    // Generate options (correct color + 3 random ones)
    const correctHex = COLORS[colorIdx].hex;
    const shuffledOptions = [COLORS[colorIdx]];
    
    while(shuffledOptions.length < 4) {
      const randomOption = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (!shuffledOptions.find(o => o.hex === randomOption.hex)) {
        shuffledOptions.push(randomOption);
      }
    }
    setOptions(shuffledOptions.sort(() => Math.random() - 0.5));
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    generateRound();
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('complete');
      if (onComplete) onComplete(score);
    }
  }, [timeLeft, gameState, onComplete, score]);

  const handleGuess = (hex) => {
    if (hex === currentColor.hex) {
      setScore(s => s + 10);
      setFeedback('correct');
    } else {
      setScore(s => Math.max(0, s - 5));
      setFeedback('wrong');
    }
    
    setTimeout(() => {
      setFeedback(null);
      generateRound();
    }, 300);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel p-6"
      style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Brain className="text-blue-400" size={24} />
          <h2 className="text-white font-bold text-lg tracking-wider">COGNITIVE WAKE-UP</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {gameState === 'start' && (
        <div className="text-center py-8">
          <Zap className="mx-auto text-yellow-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Stroop Test</h3>
          <p className="text-slate-400 text-sm mb-6 px-4">
            Click the color of the INK, not the word itself. 
            This forces your brain to override automatic reading habits.
          </p>
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold tracking-widest transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          >
            START (30s)
          </button>
        </div>
      )}

      {gameState === 'playing' && currentWord && (
        <div className="text-center">
          <div className="flex justify-between items-center px-4 mb-8 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="text-slate-400" size={16} />
              <span className={`font-mono text-xl ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="font-mono text-xl text-yellow-400">Score: {score}</div>
          </div>

          <div className="h-32 flex items-center justify-center relative">
            <h1 
              style={{ color: currentColor.hex }}
              className="text-6xl font-black tracking-tight"
            >
              {currentWord.name}
            </h1>
            
            {feedback === 'correct' && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute absolute-center">
                <Check className="text-green-500 opacity-50" size={100} />
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute absolute-center">
                <XCircle className="text-red-500 opacity-50" size={100} />
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-8">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleGuess(opt.hex)}
                className="py-4 rounded-lg font-bold text-lg border transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  borderColor: opt.hex,
                  color: opt.hex,
                  boxShadow: `0 0 10px ${opt.hex}20`
                }}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'complete' && (
        <div className="text-center py-8">
          <Award className="mx-auto text-yellow-400 mb-4" size={48} />
          <h3 className="text-2xl font-bold text-white mb-2">Test Complete!</h3>
          <p className="text-slate-400 mb-6">Final Score: <span className="text-blue-400 font-bold text-xl">{score}</span></p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={startGame}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold"
            >
              Try Again
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
            >
              Back to Work
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BrainGame;
