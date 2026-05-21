import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const CircularGauge = ({ value = 0, size = 220, label = 'CLI Score', status = 'Optimal' }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  const { color, glowColor, bgGlow, statusColor } = useMemo(() => {
    if (value > 65) return {
      color: '#ef4444',
      glowColor: 'rgba(239,68,68,0.6)',
      bgGlow: 'rgba(239,68,68,0.08)',
      statusColor: '#ef4444'
    };
    if (value > 35) return {
      color: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.5)',
      bgGlow: 'rgba(245,158,11,0.06)',
      statusColor: '#f59e0b'
    };
    return {
      color: '#00e5ff',
      glowColor: 'rgba(0,229,255,0.5)',
      bgGlow: 'rgba(0,229,255,0.06)',
      statusColor: '#00e5ff'
    };
  }, [value]);

  const center = size / 2;

  // Create tick marks
  const ticks = useMemo(() => {
    const tickElements = [];
    for (let i = 0; i <= 100; i += 5) {
      const angle = (i / 100) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const isMajor = i % 25 === 0;
      const innerR = radius - (isMajor ? 14 : 8);
      const outerR = radius - 2;
      tickElements.push(
        <line
          key={i}
          x1={center + innerR * Math.cos(rad)}
          y1={center + innerR * Math.sin(rad)}
          x2={center + outerR * Math.cos(rad)}
          y2={center + outerR * Math.sin(rad)}
          stroke={i <= progress ? color : 'rgba(255,255,255,0.08)'}
          strokeWidth={isMajor ? 2 : 1}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.5s ease' }}
        />
      );
    }
    return tickElements;
  }, [progress, color, center, radius]);

  return (
    <div className="circular-gauge-container" style={{ position: 'relative', width: size, height: size }}>
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          inset: '15%',
          borderRadius: '50%',
          background: bgGlow,
          filter: 'blur(30px)',
          transition: 'background 0.5s ease',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}
      >
        <defs>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={value > 65 ? '#ff007f' : value > 35 ? '#ef4444' : '#7c3aed'} />
          </linearGradient>
        </defs>

        {/* Tick marks */}
        <g style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
          {ticks}
        </g>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
          filter="url(#gaugeGlow)"
        />

        {/* Endpoint dot */}
        {progress > 0 && (
          <motion.circle
            cx={center + radius * Math.cos(((progress / 100) * 360 - 90) * Math.PI / 180)}
            cy={center + radius * Math.sin(((progress / 100) * 360 - 90) * Math.PI / 180)}
            r={5}
            fill={color}
            animate={{ 
              r: [5, 7, 5],
              opacity: [1, 0.7, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            filter="url(#gaugeGlow)"
          />
        )}
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <span style={{
          fontSize: '10px',
          fontWeight: 900,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          marginBottom: '4px',
        }}>
          {label}
        </span>
        <motion.span
          key={value}
          initial={{ scale: 1.15, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontSize: size * 0.28,
            fontWeight: 900,
            color: color,
            lineHeight: 1,
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: `0 0 20px ${glowColor}`,
            transition: 'color 0.5s ease',
          }}
        >
          {Math.round(value)}
        </motion.span>
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          color: statusColor,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginTop: '6px',
          transition: 'color 0.5s ease',
        }}>
          {status}
        </span>
      </div>
    </div>
  );
};

export default CircularGauge;
