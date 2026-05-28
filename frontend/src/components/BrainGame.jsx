import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Brain, Zap, Clock, X, Check, XCircle, Award, GripHorizontal } from 'lucide-react';

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
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();

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
    /* Full-screen overlay that acts as drag constraint boundary */
    <div
      ref={constraintsRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        // Close when clicking the backdrop (not the modal itself)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        drag
        dragConstraints={constraintsRef}
        dragElastic={0}
        dragMomentum={false}
        dragControls={dragControls}
        dragListener={false}
        className="glass-panel"
        style={{
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
          height: '480px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(15, 23, 42, 0.97)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          boxShadow: '0 0 60px rgba(59, 130, 246, 0.25), 0 25px 50px rgba(0, 0, 0, 0.5)',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drag Handle Header ── */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          style={{
            padding: '16px 20px 0 20px',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
          onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
        >
          {/* Drag indicator dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <GripHorizontal size={20} style={{ color: 'rgba(100, 116, 139, 0.5)' }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain className="text-blue-400" size={24} />
              <h2 style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '0.1em',
                margin: 0,
              }}>
                COGNITIVE WAKE-UP
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div style={{ padding: '0 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* ── Start Screen ── */}
          {gameState === 'start' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}>
                <Zap className="text-yellow-400" size={36} />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
              }}>
                Stroop Test
              </h3>
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                marginBottom: '24px',
                padding: '0 16px',
              }}>
                Click the color of the <strong style={{ color: '#00e5ff' }}>INK</strong>, not the word itself.
                This forces your brain to override automatic reading habits.
              </p>
              <button 
                onClick={startGame}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)';
                }}
              >
                START (30s)
              </button>
            </div>
          )}

          {/* ── Playing Screen ── */}
          {gameState === 'playing' && currentWord && (
            <div style={{ textAlign: 'center' }}>
              {/* Timer & Score Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                marginBottom: '20px',
                background: 'rgba(30, 41, 59, 0.6)',
                borderRadius: '10px',
                border: '1px solid rgba(51, 65, 85, 0.6)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock style={{ color: '#94a3b8' }} size={16} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    color: timeLeft <= 5 ? '#ef4444' : '#60a5fa',
                    animation: timeLeft <= 5 ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}>
                    {timeLeft}s
                  </span>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: '#facc15',
                }}>
                  Score: {score}
                </div>
              </div>

              {/* Color Word Display */}
              <div style={{
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <h1 
                  style={{
                    color: currentColor.hex,
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    textShadow: `0 0 30px ${currentColor.hex}40`,
                  }}
                >
                  {currentWord.name}
                </h1>
                
                {feedback === 'correct' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Check style={{ color: '#22c55e', opacity: 0.5 }} size={100} />
                  </motion.div>
                )}
                {feedback === 'wrong' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <XCircle style={{ color: '#ef4444', opacity: 0.5 }} size={100} />
                  </motion.div>
                )}
              </div>

              {/* Answer Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginTop: '20px',
              }}>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleGuess(opt.hex)}
                    style={{
                      padding: '14px 8px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: `1.5px solid ${opt.hex}`,
                      color: opt.hex,
                      cursor: 'pointer',
                      boxShadow: `0 0 12px ${opt.hex}20`,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = `0 0 20px ${opt.hex}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `0 0 12px ${opt.hex}20`;
                    }}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Complete Screen ── */}
          {gameState === 'complete' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}>
                <Award style={{ color: '#facc15' }} size={36} />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '8px',
              }}>
                Test Complete!
              </h3>
              <p style={{
                color: '#94a3b8',
                marginBottom: '24px',
                fontSize: '1rem',
              }}>
                Final Score: <span style={{
                  color: '#60a5fa',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                }}>{score}</span>
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={startGame}
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(51, 65, 85, 0.8)',
                    border: '1px solid rgba(71, 85, 105, 0.6)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(71, 85, 105, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(51, 65, 85, 0.8)';
                  }}
                >
                  Try Again
                </button>
                <button 
                  onClick={onClose}
                  style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  Back to Work
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default BrainGame;
