import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

const MODES = {
  focus: { label: 'DEEP FOCUS', duration: 25 * 60, color: '#00e5ff', icon: Brain },
  shortBreak: { label: 'MICRO BREAK', duration: 5 * 60, color: '#10b981', icon: Coffee },
  longBreak: { label: 'RECOVERY', duration: 15 * 60, color: '#7c3aed', icon: Coffee },
};

const FocusTimer = ({ onSessionComplete, addLog }) => {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const currentMode = MODES[mode];
  const progress = 1 - timeLeft / currentMode.duration;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const size = 90;
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (mode === 'focus') {
              const newCount = sessions + 1;
              setSessions(newCount);
              if (onSessionComplete) onSessionComplete(newCount);
              if (addLog) addLog(`Focus Session #${newCount} Complete`, 'success');
              // Auto-switch to break
              if (newCount % 4 === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              if (addLog) addLog('Break Complete — Back to Focus', 'info');
              switchMode('focus');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, mode, sessions, onSessionComplete, addLog, switchMode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning && addLog) {
      addLog(`${currentMode.label} Timer Started`, 'info');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(currentMode.duration);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const ModeIcon = currentMode.icon;

  return (
    <div className="glass-panel p-5" style={{ background: 'rgba(10,14,24,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', background: `${currentMode.color}15`, borderRadius: '8px' }}>
          <Timer size={16} style={{ color: currentMode.color }} />
        </div>
        <h3 style={{
          fontSize: '10px', fontWeight: 900, color: 'rgb(100,116,139)',
          textTransform: 'uppercase', letterSpacing: '2px', flex: 1,
        }}>
          Focus Protocol
        </h3>
        <div style={{
          fontSize: '9px', fontWeight: 900, color: currentMode.color,
          padding: '2px 8px', background: `${currentMode.color}15`,
          borderRadius: '6px', border: `1px solid ${currentMode.color}30`,
          letterSpacing: '1px',
        }}>
          #{sessions}
        </div>
      </div>

      {/* Mode selector tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            style={{
              flex: 1, padding: '6px 4px', fontSize: '8px', fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '6px',
              border: mode === key ? `1px solid ${m.color}50` : '1px solid rgba(255,255,255,0.05)',
              background: mode === key ? `${m.color}15` : 'rgba(255,255,255,0.02)',
              color: mode === key ? m.color : 'rgb(100,116,139)',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={radius} fill="none"
              stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
            <motion.circle cx={size/2} cy={size/2} r={radius} fill="none"
              stroke={currentMode.color} strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: 'spring', stiffness: 30, damping: 15 }}
              style={{ filter: `drop-shadow(0 0 4px ${currentMode.color}40)` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ModeIcon size={14} style={{ color: currentMode.color, marginBottom: '2px' }} />
            <span style={{
              fontSize: '20px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
              color: 'white', letterSpacing: '-1px',
            }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={toggleTimer}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: isRunning ? 'rgba(239,68,68,0.15)' : `${currentMode.color}20`,
              border: `1px solid ${isRunning ? 'rgba(239,68,68,0.3)' : `${currentMode.color}40`}`,
              color: isRunning ? '#ef4444' : currentMode.color,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
          </button>
          <button
            onClick={resetTimer}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgb(100,116,139)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
