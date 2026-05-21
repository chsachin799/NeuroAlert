import React from 'react';
import { motion } from 'framer-motion';
import { Eye, MoveHorizontal } from 'lucide-react';

const ArcGauge = ({ value, max, threshold, label, icon: Icon, color, unit = '' }) => {
  const size = 100;
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  // Draw a 180-degree arc (semicircle)
  const halfCircumference = Math.PI * radius;
  const normalized = Math.min(1, Math.max(0, value / max));
  const offset = halfCircumference - normalized * halfCircumference;
  const thresholdAngle = (threshold / max) * 180;
  const isAlert = label === 'EAR' ? value < threshold : value > threshold;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 16 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.path
            d={`M ${strokeWidth} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size / 2}`}
            fill="none"
            stroke={isAlert ? '#ef4444' : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            initial={{ strokeDashoffset: halfCircumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            style={{
              filter: isAlert ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : `drop-shadow(0 0 4px ${color}40)`,
            }}
          />
          {/* Threshold marker */}
          {(() => {
            const angle = (180 - thresholdAngle) * (Math.PI / 180);
            const cx = size / 2 + radius * Math.cos(angle);
            const cy = size / 2 - radius * Math.sin(angle);
            return (
              <circle cx={cx} cy={cy} r={3} fill="#f59e0b" stroke="#000" strokeWidth={1.5} opacity={0.8} />
            );
          })()}
        </svg>
        {/* Center value */}
        <div style={{
          position: 'absolute',
          bottom: '4px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            color: isAlert ? '#ef4444' : color,
            textShadow: isAlert ? '0 0 10px rgba(239,68,68,0.4)' : 'none',
            transition: 'color 0.3s ease',
          }}>
            {typeof value === 'number' ? value.toFixed(3) : value}{unit}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Icon size={12} style={{ color: 'rgb(100,116,139)' }} />
        <span style={{
          fontSize: '9px',
          fontWeight: 900,
          color: 'rgb(100,116,139)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {label}
        </span>
      </div>
      {isAlert && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: '8px',
            fontWeight: 900,
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            padding: '2px 8px',
            background: 'rgba(239,68,68,0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          THRESHOLD BREACH
        </motion.div>
      )}
    </div>
  );
};

const BiometricPanel = ({ ear = 0.28, mar = 0.15, earThreshold = 0.22, marThreshold = 0.55, stability = 1.0, blinksPerMinute = 0 }) => {
  return (
    <div className="glass-panel p-5" style={{ background: 'rgba(10,14,24,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ padding: '6px', background: 'rgba(0,229,255,0.1)', borderRadius: '8px' }}>
          <Eye size={16} style={{ color: '#00e5ff' }} />
        </div>
        <h3 style={{
          fontSize: '10px',
          fontWeight: 900,
          color: 'rgb(100,116,139)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          Live Biometrics
        </h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
        <ArcGauge
          value={ear}
          max={0.45}
          threshold={earThreshold}
          label="EAR"
          icon={Eye}
          color="#00e5ff"
        />
        <div style={{
          width: '1px',
          height: '60px',
          background: 'rgba(255,255,255,0.06)',
          alignSelf: 'center',
        }} />
        <ArcGauge
          value={mar}
          max={1.0}
          threshold={marThreshold}
          label="MAR"
          icon={MoveHorizontal}
          color="#ff007f"
        />
      </div>

      {/* Bottom stats row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgb(100,116,139)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Gaze Stability
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            color: stability > 0.7 ? '#10b981' : stability > 0.4 ? '#f59e0b' : '#ef4444',
          }}>
            {Math.round(stability * 100)}%
          </div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '8px', fontWeight: 900, color: 'rgb(100,116,139)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            Blinks/Min
          </div>
          <div style={{
            fontSize: '16px',
            fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            color: blinksPerMinute > 25 ? '#f59e0b' : '#7c3aed',
          }}>
            {blinksPerMinute.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricPanel;
