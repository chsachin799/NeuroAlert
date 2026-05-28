import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, Activity, AlertTriangle, BarChart3, Settings, User, Brain, Zap, Clock, 
  Volume2, VolumeX, Sliders, UserCheck, Info, Gauge, History, Sparkles, X, ChevronRight, 
  ActivitySquare, Shield, TrendingUp, TrendingDown, Minus, Award, Keyboard
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { setupFaceMesh, EYE_INDICES, MOUTH_INDICES, IRIS_INDICES, HEAD_POSE_INDICES } from './utils/mediapipe';

// New components
import CircularGauge from './components/CircularGauge';
import ParticleCanvas from './components/ParticleCanvas';
import BiometricPanel from './components/BiometricPanel';
import FocusTimer from './components/FocusTimer';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import BrainGame from './components/BrainGame';
import InsightsHeatmap from './components/InsightsHeatmap';

const App = () => {
  // Application UI states
  const [showSplash, setShowSplash] = useState(true);
  
  // Basic states
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationStep, setCalibrationStep] = useState('none');
  const [showTest, setShowTest] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [cliScore, setCliScore] = useState(8);
  const [status, setStatus] = useState("Optimal");
  const [triggers, setTriggers] = useState([]);
  const [stats, setStats] = useState({ blinks: 0, yawns: 0, reactionTime: 0.3, stability: 1.0 });
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  
  // New enhanced states
  const [cognitiveScore, setCognitiveScore] = useState(100);
  const [fatigueTrend, setFatigueTrend] = useState('stable');
  const [fatigueZone, setFatigueZone] = useState('optimal');
  const [zoneDistribution, setZoneDistribution] = useState({ optimal: 100, light: 0, moderate: 0, heavy: 0, critical: 0 });
  const [liveEar, setLiveEar] = useState(0.28);
  const [liveMar, setLiveMar] = useState(0.15);
  const [blinksPerMinute, setBlinksPerMinute] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isFlashlightMode, setIsFlashlightMode] = useState(false);
  const [flashlightStyle, setFlashlightStyle] = useState('stark');
  const [showBrainGame, setShowBrainGame] = useState(false);
  
  // Backend dynamic features
  const [recommendations, setRecommendations] = useState([
    "💡 Connecting to AI Core...",
    "💧 Stabilizing neural pathways..."
  ]);
  const [sessionDuration, setSessionDuration] = useState("0s");
  const [fps, setFps] = useState(0);
  
  // Activity Log
  const [activityLogs, setActivityLogs] = useState([
    { id: '1', time: new Date().toLocaleTimeString(), msg: 'System Initialized', type: 'info' }
  ]);
  
  // Calibration twin parameters
  const [calibratedBaselines, setCalibratedBaselines] = useState({
    baselineEar: 0.28, baselineMar: 0.15, earThreshold: 0.22, marThreshold: 0.55
  });

  // Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Settings Panel Config
  const [soundMuted, setSoundMuted] = useState(false);
  const [sensitivity, setSensitivity] = useState('medium');
  const [customCalibrationTime, setCustomCalibrationTime] = useState(3);
  const [gazeTrackingEnabled, setGazeTrackingEnabled] = useState(true);
  const [reactionTestEnabled, setReactionTestEnabled] = useState(true);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(true);
  const [yawnTrackingEnabled, setYawnTrackingEnabled] = useState(true);

  // Visual Overlays
  const [showBlinkFlash, setShowBlinkFlash] = useState(false);
  const [showYawnFlash, setShowYawnFlash] = useState(false);
  const [showCriticalFlash, setShowCriticalFlash] = useState(false);

  const [reactionHistory, setReactionHistory] = useState([0.31, 0.28, 0.35, 0.29]);
  const [history, setHistory] = useState([
    { time: 'Init', score: 8, isPredicted: false }
  ]);
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const ws = useRef(null);
  const framesRendered = useRef(0);
  const lastFpsTime = useRef(Date.now());

  // Live biometric refs for interactive calibration
  const latestEarRef = useRef(0.28);
  const latestMarRef = useRef(0.15);
  const neutralEarRef = useRef(0.28);
  const neutralMarRef = useRef(0.15);
  const lastFaceDetectTime = useRef(Date.now());
  const lumaCanvasRef = useRef(document.createElement('canvas'));
  const lastFlashlightToggleTime = useRef(0);
  const lastChartUpdateTime = useRef(0);
  const activeTriggersRef = useRef([]);

  const isCalibratingRef = useRef(isCalibrating);
  const calibrationStepRef = useRef(calibrationStep);
  const soundMutedRef = useRef(soundMuted);
  const isFlashlightModeRef = useRef(isFlashlightMode);

  useEffect(() => { isCalibratingRef.current = isCalibrating; }, [isCalibrating]);
  useEffect(() => { calibrationStepRef.current = calibrationStep; }, [calibrationStep]);
  useEffect(() => { soundMutedRef.current = soundMuted; }, [soundMuted]);
  useEffect(() => { isFlashlightModeRef.current = isFlashlightMode; }, [isFlashlightMode]);

  const calculateLuma = (videoElement) => {
    const canvas = lumaCanvasRef.current;
    if (canvas.width !== 64 || canvas.height !== 48) {
      canvas.width = 64;
      canvas.height = 48;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(videoElement, 0, 0, 64, 48);
    const imgData = ctx.getImageData(0, 0, 64, 48).data;
    let totalLuma = 0;
    for (let i = 0; i < imgData.length; i += 4) {
      totalLuma += (0.2126 * imgData[i] + 0.7152 * imgData[i+1] + 0.0722 * imgData[i+2]);
    }
    return totalLuma / (64 * 48);
  };

  // Splash Screen Timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage for Heatmap
  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('neuroalert_history');
      let history = stored ? JSON.parse(stored) : {};
      
      const now = new Date();
      const dayStr = now.toISOString().split('T')[0];
      const hourStr = now.getHours().toString();
      
      if (!history[dayStr]) history[dayStr] = {};
      
      // Moving average update for the hour
      const prevScore = history[dayStr][hourStr];
      if (prevScore) {
        history[dayStr][hourStr] = (prevScore + cliScore) / 2;
      } else {
        history[dayStr][hourStr] = cliScore;
      }
      
      localStorage.setItem('neuroalert_history', JSON.stringify(history));
    }, 60000); // Save every 1 minute
    
    return () => clearInterval(interval);
  }, [cliScore]);

  const addLog = (msg, type = 'info') => {
    setActivityLogs(prev => {
      const newLog = { id: Math.random().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg, type };
      return [newLog, ...prev].slice(0, 15);
    });
  };

  const resetSession = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: "reset" }));
      addLog('Session Reset', 'warning');
    }
  };

  const updateSensitivityOnServer = (level) => {
    setSensitivity(level);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ sensitivity: level }));
      addLog(`Sensitivity: ${level.toUpperCase()}`, 'info');
    }
  };

  const triggerBlinkFlash = () => {
    setShowBlinkFlash(true);
    setTimeout(() => setShowBlinkFlash(false), 200);
  };

  const triggerYawnFlash = () => {
    setShowYawnFlash(true);
    setTimeout(() => setShowYawnFlash(false), 400);
  };

  const playPremiumAlertSound = () => {
    if (soundMutedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const filterNode = audioCtx.createBiquadFilter();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, audioCtx.currentTime); 
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4); 
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(224, audioCtx.currentTime); 
      osc2.frequency.exponentialRampToValueAtTime(888, audioCtx.currentTime + 0.4);
      
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(400, audioCtx.currentTime);
      filterNode.frequency.exponentialRampToValueAtTime(3000, audioCtx.currentTime + 0.2); 
      filterNode.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.5);
      filterNode.Q.setValueAtTime(8, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05); 
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45); 
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); 
      
      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start(); osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5); osc2.stop(audioCtx.currentTime + 0.5);
    } catch (err) {
      console.warn("Audio blocked", err);
    }
  };

  const playNotificationSound = (type = 'info') => {
    if (soundMutedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      } else {
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime); // F4
        osc.frequency.setValueAtTime(440.00, audioCtx.currentTime + 0.1); // A4
      }
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.warn("Audio blocked", err);
    }
  };

  useEffect(() => {
    const host = window.location.hostname || 'localhost';
    ws.current = new WebSocket(`ws://${host}:8080/ws/fatigue`);
    
    ws.current.onopen = () => addLog("WebSocket Connected to AI Core", "success");
    ws.current.onclose = () => addLog("WebSocket Disconnected", "danger");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.ear !== undefined) latestEarRef.current = data.ear;
      if (data.mar !== undefined) latestMarRef.current = data.mar;
      
      if (data.cli !== undefined) {
        setCliScore(Math.round(data.cli));
        setStatus(data.status);
        
        // Enhanced data
        if (data.ear !== undefined) setLiveEar(data.ear);
        if (data.mar !== undefined) setLiveMar(data.mar);
        if (data.cognitiveScore !== undefined) setCognitiveScore(data.cognitiveScore);
        if (data.fatigueTrend !== undefined) setFatigueTrend(data.fatigueTrend);
        if (data.fatigueZone !== undefined) setFatigueZone(data.fatigueZone);
        if (data.zoneDistribution) setZoneDistribution(data.zoneDistribution);
        if (data.blinksPerMinute !== undefined) setBlinksPerMinute(data.blinksPerMinute);
        
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
        
        if (data.sessionDuration !== undefined) {
          const m = Math.floor(data.sessionDuration / 60);
          const s = Math.floor(data.sessionDuration % 60);
          setSessionDuration(`${m}m ${s}s`);
        }

        // Handle Triggers Logging
        if (data.triggers && data.triggers.length > 0) {
          data.triggers.forEach(t => {
            if (!activeTriggersRef.current.includes(t)) {
              addLog(`Detected: ${t}`, 'warning');
            }
          });
          activeTriggersRef.current = data.triggers;
          setTriggers(data.triggers);
        } else {
          activeTriggersRef.current = [];
          setTriggers([]);
        }

        if (data.predictions) setPredictions(data.predictions);
        
        if (data.baselineEar !== undefined) {
          setCalibratedBaselines({
            baselineEar: data.baselineEar,
            baselineMar: data.baselineMar,
            earThreshold: data.earThreshold,
            marThreshold: data.marThreshold
          });
        }
        
        setStats(prev => {
          if (data.stats) {
            if (data.stats.blinks > prev.blinks) triggerBlinkFlash();
            if (data.stats.yawns > prev.yawns) {
              triggerYawnFlash();
              addLog("Yawn Detected", "warning");
            }
            return data.stats;
          }
          return prev;
        });
        
        if (data.cli > 65) {
          playPremiumAlertSound();
          setShowCriticalFlash(true);
          setTimeout(() => setShowCriticalFlash(false), 200);
        }
        
        // Auto-trigger Brain Game if critical and not already shown
        if (data.cli > 85 && !showBrainGame && Math.random() > 0.95) {
          setShowBrainGame(true);
          addLog("Critical Fatigue: Cognitive Test Triggered", "warning");
        }

        const nowTime = Date.now();
        if (nowTime - lastChartUpdateTime.current >= 1500) {
          lastChartUpdateTime.current = nowTime;
          setHistory(prev => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const newEntry = { time: timeStr, score: Math.round(data.cli), isPredicted: false };
            const baseHistory = [...prev.filter(h => !h.isPredicted), newEntry].slice(-30);
            
            const predictedEntries = (data.predictions || []).map((p, i) => {
              const predTime = new Date(now.getTime() + (i + 1) * 30000); 
              return {
                time: predTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                score: Math.round(p),
                isPredicted: true
              };
            });
            return [...baseHistory, ...predictedEntries];
          });
        }
      }
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const onResults = (results) => {
    framesRendered.current += 1;
    const now = Date.now();
    if (now - lastFpsTime.current >= 1000) {
      setFps(framesRendered.current);
      framesRendered.current = 0;
      lastFpsTime.current = now;
    }

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    
    lastFaceDetectTime.current = Date.now();
    
    const landmarks = results.multiFaceLandmarks[0];
    const filterValid = (arr) => arr.filter(p => p !== undefined && p !== null);
    const leftEye = filterValid(EYE_INDICES.left.map(i => landmarks[i]));
    const rightEye = filterValid(EYE_INDICES.right.map(i => landmarks[i]));
    const leftIris = filterValid(IRIS_INDICES.left.map(i => landmarks[i]));
    const rightIris = filterValid(IRIS_INDICES.right.map(i => landmarks[i]));
    const mouth = filterValid(MOUTH_INDICES.map(i => landmarks[i]));
    
    // Head Pose Estimation landmarks
    const nose = landmarks[HEAD_POSE_INDICES.nose];
    const chin = landmarks[HEAD_POSE_INDICES.chin];
    const forehead = landmarks[HEAD_POSE_INDICES.forehead];

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        leftEye, rightEye, leftIris, rightIris, mouth,
        nose, chin, forehead,
        isCalibrating: isCalibratingRef.current,
        calibrationStep: calibrationStepRef.current,
        faceMissingInDarkness: false,
        timestamp: Date.now()
      }));
    }

    const canvasElement = canvasRef.current;
    if (canvasElement && webcamRef.current && webcamRef.current.video) {
      const video = webcamRef.current.video;
      if (canvasElement.width !== video.videoWidth || canvasElement.height !== video.videoHeight) {
        canvasElement.width = video.videoWidth;
        canvasElement.height = video.videoHeight;
      }
      
      const canvasCtx = canvasElement.getContext('2d');
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      const drawContour = (ctx, points, color, glowColor) => {
        if (points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur = 4; // Optimized from 12 for high performance rendering
        ctx.moveTo(points[0].x * canvasElement.width, points[0].y * canvasElement.height);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x * canvasElement.width, points[i].y * canvasElement.height);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0; 
      };

      const drawIrisCenter = (ctx, points, color) => {
        if (points.length === 0) return;
        const center = points[0];
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5; // Optimized from 15 for high performance rendering
        ctx.arc(center.x * canvasElement.width, center.y * canvasElement.height, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      if (eyeTrackingEnabled) {
        drawContour(canvasCtx, leftEye, '#00e5ff', 'rgba(0,229,255,0.8)');
        drawContour(canvasCtx, rightEye, '#00e5ff', 'rgba(0,229,255,0.8)');
      }
      if (yawnTrackingEnabled) {
        drawContour(canvasCtx, mouth, '#ff007f', 'rgba(255,0,127,0.8)');
      }
      if (gazeTrackingEnabled) {
        drawIrisCenter(canvasCtx, leftIris, '#f59e0b');
        drawIrisCenter(canvasCtx, rightIris, '#f59e0b');
      }
    }
  };

  useEffect(() => {
    const faceMesh = setupFaceMesh(onResults);
    let videoElement = null;
    let lastLumaCheck = 0;
    let isProcessing = false;

    const interval = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video) {
        videoElement = webcamRef.current.video;
        if (videoElement.readyState === 4) {
          if (!isProcessing) {
            isProcessing = true;
            try {
              await faceMesh.send({ image: videoElement });
            } catch (err) {
              console.warn("FaceMesh processing error:", err);
            } finally {
              isProcessing = false;
            }
          }
          
          const nowTime = Date.now();
          if (nowTime - lastLumaCheck >= 500) {
            lastLumaCheck = nowTime;
            // Live Luma (Brightness) Tracking
            try {
              const avgLuma = calculateLuma(videoElement);
              
              const isDark = avgLuma < 40 || (isFlashlightModeRef.current && avgLuma < 45);
              const nowToggle = Date.now();
              if (isDark !== isFlashlightModeRef.current && (nowToggle - lastFlashlightToggleTime.current > 3000)) {
                setIsFlashlightMode(isDark);
                lastFlashlightToggleTime.current = nowToggle;
                if (isDark) {
                  addLog("Low Light Detected: Flashlight Mode Active", "warning");
                  playNotificationSound('warning');
                } else {
                  addLog("Light Restored: Flashlight Mode Disabled", "success");
                  playNotificationSound('success');
                  lastFaceDetectTime.current = Date.now(); // Reset timer upon light restoration
                }
              }
              
              // Anti-Cheating Evasion Penalty
              if (isDark && (Date.now() - lastFaceDetectTime.current > 3000)) {
                 if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                   ws.current.send(JSON.stringify({
                     faceMissingInDarkness: true,
                     timestamp: Date.now()
                   }));
                 }
              }
            } catch(e) {}
          }
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      faceMesh.close();
    };
  }, [eyeTrackingEnabled, yawnTrackingEnabled, gazeTrackingEnabled]);

  const startCalibration = async () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setCalibrationProgress(0);
    addLog("Calibration Sequence Initiated", "info");
    
    // Step 1: Neutral (Look Straight)
    setCalibrationStep('neutral');
    let neutralTicks = 0;
    while (neutralTicks < 30) { // roughly 3 seconds
      await new Promise(r => setTimeout(r, 100));
      neutralTicks++;
      setCalibrationProgress(Math.round((neutralTicks / 30) * 33));
    }
    neutralEarRef.current = latestEarRef.current || 0.28;
    neutralMarRef.current = latestMarRef.current || 0.15;
    
    // Step 2: Blink Repeatedly
    setCalibrationStep('blink');
    let blinkCount = 0;
    let isEyeClosed = false;
    while (blinkCount < 3) {
      await new Promise(r => setTimeout(r, 50));
      const currentEar = latestEarRef.current;
      // Trigger a blink if EAR drops to 75% of baseline
      if (currentEar < neutralEarRef.current * 0.75) {
        if (!isEyeClosed) {
          isEyeClosed = true;
        }
      } else {
        if (isEyeClosed) {
          isEyeClosed = false;
          blinkCount++;
          setCalibrationProgress(33 + Math.round((blinkCount / 3) * 33));
        }
      }
    }
    
    // Short pause between phases
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Yawn (Open Mouth Wide)
    setCalibrationStep('yawn');
    let yawnProgress = 0;
    while (yawnProgress < 100) {
      await new Promise(r => setTimeout(r, 100));
      const currentMar = latestMarRef.current;
      // Trigger yawn if MAR is 180% of baseline or > 0.4
      if (currentMar > neutralMarRef.current * 1.8 || currentMar > 0.4) {
        yawnProgress += 10; // Must hold for ~1 second
      } else {
        if (yawnProgress > 0) yawnProgress -= 5;
      }
      const boundedYawn = Math.min(100, Math.max(0, yawnProgress));
      setCalibrationProgress(66 + Math.round((boundedYawn / 100) * 34));
    }

    setCalibrationStep('none');
    setIsCalibrating(false);
    setCalibrationProgress(100);
    addLog("Twin Calibration Completed", "success");
  };

  const startReactionTest = () => {
    if (!reactionTestEnabled) return;
    setShowTest(true);
    setReactionTime(null);
    addLog("Sensory Test Standby", "info");
    setTimeout(() => {
      setTestStartTime(Date.now());
    }, Math.random() * 2000 + 1500);
  };

  const handleTestClick = () => {
    if (testStartTime) {
      const diff = (Date.now() - testStartTime) / 1000;
      setReactionTime(diff);
      setReactionHistory(prev => [...prev, diff].slice(-8));
      setTestStartTime(null);
      addLog(`Latency Logged: ${diff}s`, 'success');
      setTimeout(() => setShowTest(false), 2000);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ reactionTime: diff }));
      }
    }
  };

  const fetchRiskReport = async () => {
    try {
      const host = window.location.hostname || 'localhost';
      const res = await fetch(`http://${host}:8080/api/risk-report`);
      const data = await res.json();
      setReportData(data);
      setShowReport(true);
    } catch (err) {
      console.error("Failed to fetch report", err);
      addLog("Risk Report Generation Failed", "danger");
    }
  };

  const trendIcon = fatigueTrend === 'rising' ? TrendingUp : fatigueTrend === 'declining' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const zoneColors = {
    optimal: { color: '#00e5ff', bg: 'rgba(0,229,255,0.1)', border: 'rgba(0,229,255,0.2)' },
    light: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    heavy: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)' },
  };

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col gap-5 max-w-[1800px] mx-auto relative overflow-hidden">
      
      {/* Neural Network Particle Background */}
      <ParticleCanvas />
      
      {/* Auto-Flashlight Mode Overlay */}
      <AnimatePresence>
        {isFlashlightMode && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none" 
            style={{ 
              zIndex: 5, 
              background: flashlightStyle === 'stark' 
                ? '#ffffff' 
                : 'radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.85) 45%, rgba(255,255,255,0.1) 85%)',
              opacity: flashlightStyle === 'stark' ? 0.95 : 1.0,
              filter: flashlightStyle === 'stark' ? 'none' : 'blur(4px)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Flashlight Mode Alert Toast */}
      <AnimatePresence>
        {isFlashlightMode && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[80] px-6 py-3 bg-white text-black font-extrabold rounded-full shadow-[0_0_35px_rgba(255,255,255,0.9)] border border-slate-200 flex items-center gap-2.5 text-xs uppercase tracking-widest pointer-events-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Low Light Detected: Flashlight Mode Active</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Melatonin Suppressor (Blue Light Therapy) Overlay */}
      <AnimatePresence>
        {cliScore > 75 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.25 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 2 }}
            className="fixed inset-0 bg-[#0044ff] pointer-events-none mix-blend-screen" 
            style={{ zIndex: 6 }}
          />
        )}
      </AnimatePresence>

      {/* Brain Game Modal */}
      <AnimatePresence>
        {showBrainGame && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
              onClick={() => setShowBrainGame(false)}
            />
            <BrainGame 
              onClose={() => setShowBrainGame(false)} 
              onComplete={(score) => {
                addLog(`Cognitive Test Complete: Score ${score}`, 'success');
                setTimeout(() => setShowBrainGame(false), 4000);
              }}
            />
          </>
        )}
      </AnimatePresence>
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        onToggleSettings={() => { setShowSettings(prev => !prev); setShowProfile(false); }}
        onToggleProfile={() => { setShowProfile(prev => !prev); setShowSettings(false); }}
        onStartCalibration={startCalibration}
        onStartReactionTest={startReactionTest}
        onFetchReport={fetchRiskReport}
        onResetSession={resetSession}
        onToggleMute={() => { setSoundMuted(prev => !prev); addLog(soundMuted ? 'Audio Enabled' : 'Audio Muted', 'info'); }}
      />

      {/* 🚀 CINEMATIC SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#030508] flex items-center justify-center"
          >
            <div className="flex flex-col items-center" style={{ animation: 'splashLogoEntry 2s ease-out' }}>
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-full border border-[#00e5ff]/30 absolute inset-0 m-auto" style={{ animation: 'splashRingPulse 2s infinite' }}></div>
                <div className="w-40 h-40 rounded-full border border-[#7c3aed]/30 absolute inset-0 m-auto" style={{ animation: 'splashRingPulse 2s infinite 0.5s' }}></div>
                <div className="w-40 h-40 rounded-full border border-[#ff007f]/20 absolute inset-0 m-auto" style={{ animation: 'splashRingPulse 2s infinite 1s' }}></div>
                <Brain size={72} className="text-[#00e5ff] relative z-10 neon-pulse bg-[#030508] rounded-full p-3" />
              </div>
              <h1 className="text-5xl font-black gradient-text tracking-tighter mb-2">NEUROALERT</h1>
              <p className="text-sm text-slate-500 font-medium tracking-wider mb-6">AI-Powered Cognitive Fatigue Detection</p>
              <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00e5ff] via-[#7c3aed] to-[#ff007f]" style={{ animation: 'splashBarFill 2.8s ease-out forwards' }}></div>
              </div>
              <p className="mt-4 text-[10px] text-slate-600 font-black tracking-widest uppercase">Initializing Neural Twin Engine...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OVERLAYS */}
      <AnimatePresence>
        {showBlinkFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-40 border-[8px] border-[#00e5ff]/20 shadow-[inset_0_0_80px_rgba(0,229,255,0.15)]" />}
        {showYawnFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-40 border-[8px] border-[#ff007f]/20 shadow-[inset_0_0_80px_rgba(255,0,127,0.15)]" />}
        {showCriticalFlash && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 pointer-events-none z-50 border-[12px] border-red-500/40 shadow-[inset_0_0_120px_rgba(239,68,68,0.3)] bg-red-500/5" />}
      </AnimatePresence>

      {/* HEADER */}
      <header className="flex justify-between items-center glass-panel p-4 px-6 relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-[#00e5ff]/10 rounded-xl border border-[#00e5ff]/20 neon-pulse">
            <Brain className="text-[#00e5ff]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              NEURO<span className="text-[#00e5ff]">ALERT</span>
              <span className="text-[9px] font-black text-[#00e5ff] px-2 py-0.5 bg-[#00e5ff]/10 border border-[#00e5ff]/20 rounded-full tracking-widest ml-2">PRO v2.5</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
              LIVE AI GUARD
              <span className="mx-1 text-slate-600">|</span>
              <span style={{ color: zoneColors[fatigueZone]?.color || '#00e5ff' }}>{fatigueZone.toUpperCase()} ZONE</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Cognitive Score Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg">
            <Award size={14} className="text-amber-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Score</span>
            <span className="text-sm font-black mono" style={{ color: cognitiveScore > 70 ? '#10b981' : cognitiveScore > 40 ? '#f59e0b' : '#ef4444' }}>
              {Math.round(cognitiveScore)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={startCalibration}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all border ${isCalibrating ? 'bg-[#00e5ff]/20 border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.4)] text-[#00e5ff]' : 'btn-primary'}`}
            >
              {isCalibrating ? `CALIBRATING: ${calibrationStep.toUpperCase()} ${calibrationProgress}%` : 'CALIBRATE TWIN'}
            </button>
            <button onClick={resetSession} className="px-4 py-2 rounded-lg text-xs font-bold transition-all border bg-white/5 border-white/10 hover:bg-white/10 text-slate-300">
              RESET
            </button>
          </div>
          <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>
          <button onClick={() => setShowShortcuts(!showShortcuts)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors hover-lift hidden md:block" title="Keyboard Shortcuts">
            <Keyboard size={18} className="text-slate-400" />
          </button>
          <button onClick={() => { setShowSettings(true); setShowProfile(false); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors hover-lift">
            <Settings size={20} className="text-slate-300" />
          </button>
          <button onClick={() => { setShowProfile(true); setShowSettings(false); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors hover-lift relative">
            <User size={20} className="text-slate-300" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#070a10]"></span>
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-grow relative z-10">
        
        {/* LEFT COLUMN: Feed & Chart */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* CAMERA FEED */}
          <div className="relative glass-panel overflow-hidden aspect-video bg-black/95 group rounded-2xl border border-white/10">
            <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full object-cover opacity-50" mirrored />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#00e5ff]/5 to-transparent h-32 animate-scanline"></div>

            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-2">
                <Camera size={14} className="text-[#00e5ff]" />
                <span className="text-[10px] font-black tracking-widest uppercase text-[#00e5ff]">OPTICAL SYNC</span>
              </div>
              <AnimatePresence>
                {triggers.map((t, i) => (
                  <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="bg-red-500/20 backdrop-blur border border-red-500/50 text-red-400 text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 alert-flash">
                    <AlertTriangle size={12} /> {t}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-10">
              <div className="glass-panel bg-black/60 px-4 py-3 rounded-xl border-white/10">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block mb-1">State Vector</span>
                <span className={`text-2xl font-black tracking-tight ${cliScore > 65 ? 'text-red-500 glow-text' : (cliScore > 35 ? 'text-amber-500' : 'text-[#00e5ff]')}`}>{status}</span>
              </div>
              
              <div className="flex gap-3">
                {/* Trend indicator */}
                <div className="glass-panel bg-black/60 px-4 py-3 rounded-xl border-white/10 text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Trend</div>
                  <div className="flex items-center justify-end gap-1">
                    <TrendIcon size={16} className={`${fatigueTrend === 'rising' ? 'text-red-400' : fatigueTrend === 'declining' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className={`text-sm font-black uppercase ${fatigueTrend === 'rising' ? 'text-red-400' : fatigueTrend === 'declining' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {fatigueTrend}
                    </span>
                  </div>
                </div>
                <div className="glass-panel bg-black/60 px-4 py-3 rounded-xl border-white/10 text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Mesh FPS</div>
                  <div className="text-xl font-black mono text-[#7c3aed]">{fps}</div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isCalibrating && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md">
                  <div className="text-center p-8 glass-panel border-[#00e5ff]/30 w-80">
                    <Sparkles className="text-[#00e5ff] mx-auto mb-4 neon-pulse p-2 rounded-full bg-[#00e5ff]/10" size={56} />
                    <h3 className="text-xs font-black uppercase text-[#00e5ff] tracking-widest mb-2">Neural Mapping</h3>
                    <motion.div key={calibrationStep} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-xl font-extrabold tracking-wide text-white mb-6">
                      {calibrationStep === 'neutral' && 'LOOK STRAIGHT AHEAD'}
                      {calibrationStep === 'blink' && 'BLINK NATURALLY'}
                      {calibrationStep === 'yawn' && 'OPEN MOUTH WIDE'}
                    </motion.div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <motion.div className="h-full bg-gradient-to-r from-[#00e5ff] to-[#7c3aed]" animate={{ width: `${calibrationProgress}%` }} transition={{ ease: "easeOut" }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-black mono uppercase tracking-wider block mt-4">{calibrationProgress}% SYNCHRONIZED</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showTest && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-lg z-40">
                  <div className="glass-panel p-10 text-center max-w-sm border-[#00e5ff]/20">
                    <Gauge className="text-[#00e5ff] mx-auto mb-4" size={40} />
                    <h2 className="text-xl font-black tracking-widest mb-2">COGNITIVE LATENCY</h2>
                    <p className="text-xs text-slate-400 mb-8 font-medium">Click the core the exact moment it glows <span className="text-emerald-400 font-bold">GREEN</span>.</p>
                    <button onMouseDown={handleTestClick} className={`w-36 h-36 rounded-full border-[6px] transition-all flex flex-col items-center justify-center text-sm font-black tracking-widest mx-auto ${testStartTime ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-300 text-black shadow-[0_0_80px_rgba(16,185,129,0.6)] scale-110' : 'bg-[#070a10] border-white/10 text-slate-500 hover:border-white/20'}`}>
                      {reactionTime ? `${reactionTime}s` : (testStartTime ? 'STRIKE!' : 'STANDBY')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TWO-PANEL ROW: Chart + Zone Distribution */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* AREA CHART */}
            <div className="glass-panel p-6 xl:col-span-2">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#7c3aed]/10 rounded-lg">
                    <ActivitySquare className="text-[#7c3aed]" size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight">Cognitive Load Graph</h3>
                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Real-time CLI Telemetry</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-black"><div className="w-2 h-2 rounded-full bg-amber-400 alert-breathe"></div> AI PREDICTION</span>
                </div>
              </div>
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCli" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="glass-panel p-3 border-[#00e5ff]/20 bg-[#070a10]/95 shadow-xl">
                              <p className="text-[9px] text-slate-400 font-bold mb-1 tracking-widest">{data.time}</p>
                              <p className="text-sm font-black">
                                CLI Score: <span className={data.isPredicted ? 'text-amber-500' : 'text-[#00e5ff]'}>{data.score}</span>
                                {data.isPredicted && <span className="text-[9px] ml-2 text-amber-500/60 uppercase font-black block mt-1">FORECAST</span>}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#00e5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorCli)" activeDot={{ r: 6, fill: '#00e5ff', stroke: '#000', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ZONE DISTRIBUTION */}
            <div className="glass-panel p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Zone Distribution</h3>
                  <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Session Breakdown</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 flex-grow justify-center">
                {Object.entries(zoneDistribution).map(([zone, pct]) => (
                  <div key={zone} className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-wider w-16 text-right" style={{ color: zoneColors[zone]?.color || '#64748b' }}>
                      {zone}
                    </span>
                    <div className="flex-1 h-3 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: zoneColors[zone]?.color || '#64748b' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 0.5)}%` }}
                        transition={{ type: 'spring', stiffness: 30, damping: 15 }}
                      />
                    </div>
                    <span className="text-[10px] font-black mono w-10" style={{ color: zoneColors[zone]?.color || '#64748b' }}>
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gauges, Biometrics, Timer, Stats */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* CLI Giant Circular Gauge */}
          <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-[#00e5ff]/8 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-[#7c3aed]/8 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
            <CircularGauge value={cliScore} size={200} label="Fatigue Index" status={status} />
          </div>

          {/* Live Biometrics Panel */}
          <BiometricPanel
            ear={liveEar}
            mar={liveMar}
            earThreshold={calibratedBaselines.earThreshold}
            marThreshold={calibratedBaselines.marThreshold}
            stability={stats.stability}
            blinksPerMinute={blinksPerMinute}
          />

          <FocusTimer 
            onSessionComplete={(count) => addLog(`Focus Session #${count} Complete`, 'success')} 
            addLog={addLog}
            onBreakStart={() => setShowBrainGame(true)}
          />

          <InsightsHeatmap />

          {/* Advanced Settings Link */}
          <button 
            onClick={() => { setShowProfile(false); setShowSettings(true); }}
            className="mt-4 flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors group"
          >
            <span className="text-xs font-bold text-slate-300">View Advanced Telemetry</span>
            <span className="text-[#00e5ff] font-black">&rarr;</span>
          </button>

          {/* AI Recommendations */}
          <div className="glass-panel p-5 border-l-4 border-l-amber-500 bg-amber-500/[0.03]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-amber-500" size={16} />
              <h3 className="font-black text-xs uppercase tracking-widest text-white">AI Prescriptions</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex gap-3 text-sm items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 mt-1.5 shrink-0" />
                  <span className="text-slate-300 font-medium leading-relaxed text-[13px]">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neural Biometrics Summary */}
          <div className="glass-panel p-5 flex flex-col">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Activity size={14} className="text-[#00e5ff]" /> Quick Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Blinks', val: stats.blinks, icon: Camera, col: '#00e5ff' },
                { label: 'Yawns', val: stats.yawns, icon: Clock, col: '#ff007f' },
                { label: 'Latency', val: `${stats.reactionTime}s`, icon: Zap, col: '#10b981' },
                { label: 'Session', val: sessionDuration, icon: Clock, col: '#7c3aed' },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center p-3 bg-white/[0.03] rounded-xl border border-white/5 hover-lift group">
                  <f.icon size={14} className="text-slate-500 group-hover:text-white mb-1.5 transition-colors" style={{ '--hover-color': f.col }} />
                  <div className="text-lg font-black mono tracking-tight" style={{ color: f.col }}>{f.val}</div>
                  <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{f.label}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 flex gap-2">
               <button onClick={startReactionTest} disabled={!reactionTestEnabled} className="flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center gap-2">
                 <Gauge size={12} /> Diagnostic
               </button>
               <button onClick={fetchRiskReport} className="flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20 rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#00e5ff]/20">
                 <BarChart3 size={12} /> Report
               </button>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="glass-panel p-4 px-6 flex flex-wrap justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-500 relative z-20">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div> WS: CONNECTED</span>
          <span>SESSION: <span className="text-white">{sessionDuration}</span></span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden sm:inline text-slate-600">PRESS <span className="text-[#00e5ff]">?</span> FOR SHORTCUTS</span>
          <span className="text-[#00e5ff]">AI CORE // ACTIVE</span>
        </div>
      </footer>

      {/* ACTIVITY LOG (Floating Left Bottom) */}
      <div className="fixed bottom-24 left-8 w-72 h-64 z-30 flex flex-col-reverse gap-2 overflow-y-auto activity-scroll p-2 pointer-events-none hidden xl:flex">
        <AnimatePresence>
          {activityLogs.map(log => (
            <motion.div 
              key={log.id} initial={{ opacity: 0, x: -20, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`p-3 rounded-xl border backdrop-blur-md glass-panel flex flex-col gap-1 pointer-events-auto shadow-lg
                ${log.type === 'danger' ? 'border-red-500/30 bg-red-900/20' : 
                  log.type === 'warning' ? 'border-amber-500/30 bg-amber-900/10' : 
                  log.type === 'success' ? 'border-emerald-500/30 bg-emerald-900/10' : 
                  'border-[#00e5ff]/20 bg-[#070a10]/80'}`}
            >
              <span className="text-[8px] font-black mono text-slate-400">{log.time}</span>
              <span className={`text-xs font-bold ${log.type==='danger'?'text-red-400':log.type==='warning'?'text-amber-400':log.type==='success'?'text-emerald-400':'text-white'}`}>{log.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* KEYBOARD SHORTCUTS MODAL */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcuts(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="glass-panel p-8 max-w-md w-full border-[#00e5ff]/20">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <Keyboard size={20} className="text-[#00e5ff]" />
                    <h2 className="text-lg font-black tracking-tight text-white">Keyboard Shortcuts</h2>
                  </div>
                  <button onClick={() => setShowShortcuts(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={16} /></button>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'C', desc: 'Start Calibration' },
                    { key: 'T', desc: 'Reaction Test' },
                    { key: 'R', desc: 'Generate Report' },
                    { key: 'S', desc: 'Toggle Settings' },
                    { key: 'P', desc: 'Toggle Profile' },
                    { key: 'M', desc: 'Toggle Mute' },
                    { key: 'X', desc: 'Reset Session' },
                    { key: 'ESC', desc: 'Close Panels' },
                  ].map(s => (
                    <div key={s.key} className="flex items-center justify-between bg-white/[0.03] p-3 rounded-lg border border-white/5">
                      <span className="text-sm text-slate-300 font-medium">{s.desc}</span>
                      <kbd className="px-2.5 py-1 bg-white/10 border border-white/15 rounded text-[11px] font-black mono text-[#00e5ff]">{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SETTINGS SIDEBAR */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 sidebar-panel p-6 md:p-8 flex flex-col gap-8 overflow-y-auto activity-scroll">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00e5ff]/10 rounded-lg"><Sliders size={20} className="text-[#00e5ff]" /></div>
                  <h2 className="text-xl font-black tracking-tight uppercase text-white">System Config</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors bg-white/5"><X size={18} /></button>
              </div>

              {/* Audio Config */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Volume2 size={12}/> Audio Telemetry</h3>
                <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl border border-white/5">
                  <span className="text-sm font-bold text-white">Synthesizer Alerts</span>
                  <button onClick={() => {setSoundMuted(!soundMuted); addLog(soundMuted ? 'Audio Enabled' : 'Audio Muted', 'info');}} className={`p-2.5 rounded-xl transition-all border ${soundMuted ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-[#00e5ff]/10 border-[#00e5ff]/30 text-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.2)]'}`}>
                    {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>

              {/* Sensitivity Config */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Sensitivity</h3>
                <div className="flex flex-col gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/5">
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map((level) => (
                      <button key={level} onClick={() => updateSensitivityOnServer(level)} className={`flex-1 py-2.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${sensitivity === level ? 'bg-[#00e5ff] text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]' : 'bg-black/50 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium mt-1">High sensitivity rapidly accelerates fatigue detection penalties based on micro-expressions.</p>
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detection Modules</h3>
                <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                  {[
                    { label: 'Eye Tracking', state: eyeTrackingEnabled, toggle: setEyeTrackingEnabled },
                    { label: 'Yawn Detection', state: yawnTrackingEnabled, toggle: setYawnTrackingEnabled },
                    { label: 'Gaze Stability', state: gazeTrackingEnabled, toggle: setGazeTrackingEnabled },
                    { label: 'Reaction Tests', state: reactionTestEnabled, toggle: setReactionTestEnabled },
                  ].map((mod, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{mod.label}</span>
                      <button onClick={() => mod.toggle(!mod.state)} className={`w-10 h-6 rounded-full transition-all relative ${mod.state ? 'bg-[#00e5ff]' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${mod.state ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Low Light Evasion Config */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Light Flashlight Style</h3>
                <div className="flex gap-2 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  {[
                    { id: 'stark', label: 'Stark White' },
                    { id: 'aura', label: 'Blurred Aura' }
                  ].map((styleOpt) => (
                    <button 
                      key={styleOpt.id} 
                      onClick={() => setFlashlightStyle(styleOpt.id)} 
                      className={`flex-1 py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${flashlightStyle === styleOpt.id ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.35)]' : 'bg-black/50 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      {styleOpt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calibration Config */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Twin Calibration Time</h3>
                <div className="flex flex-col gap-4 bg-white/[0.03] p-5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Stage Duration</span>
                    <span className="text-xs font-black text-[#00e5ff] mono px-2 py-1 bg-[#00e5ff]/10 rounded">{customCalibrationTime}s</span>
                  </div>
                  <input type="range" min="2" max="8" value={customCalibrationTime} onChange={(e) => setCustomCalibrationTime(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROFILE SIDEBAR */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfile(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 sidebar-panel p-6 md:p-8 flex flex-col gap-8 overflow-y-auto activity-scroll">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#7c3aed]/10 rounded-lg"><UserCheck size={20} className="text-[#7c3aed]" /></div>
                  <h2 className="text-xl font-black tracking-tight uppercase text-white">Cognitive Profile</h2>
                </div>
                <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors bg-white/5"><X size={18} /></button>
              </div>

              <div className="flex flex-col items-center gap-4 py-4 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#00e5ff]/20 to-[#7c3aed]/20 blur-3xl rounded-full"></div>
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#00e5ff] to-[#7c3aed] p-1 shadow-[0_0_30px_rgba(0,229,255,0.4)] relative z-10">
                  <div className="w-full h-full rounded-full bg-[#070a10] flex items-center justify-center">
                    <User size={48} className="text-white" />
                  </div>
                </div>
                <div className="text-center relative z-10">
                  <h3 className="text-xl font-black text-white">Deepak X.</h3>
                  <span className="text-[9px] text-[#00e5ff] tracking-widest font-black uppercase inline-block mt-1.5 border border-[#00e5ff]/20 bg-[#00e5ff]/10 px-3 py-1 rounded-full shadow-inner">ELITE OPERATOR</span>
                </div>
              </div>

              {/* Cognitive Performance Score */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Award size={12}/> Cognitive Performance</h3>
                <div className="bg-white/[0.03] p-5 rounded-xl border border-white/5 text-center">
                  <div className="text-5xl font-black mono mb-2" style={{ color: cognitiveScore > 70 ? '#10b981' : cognitiveScore > 40 ? '#f59e0b' : '#ef4444' }}>
                    {Math.round(cognitiveScore)}
                  </div>
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Performance Score</div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: cognitiveScore > 70 ? '#10b981' : cognitiveScore > 40 ? '#f59e0b' : '#ef4444' }}
                      animate={{ width: `${cognitiveScore}%` }}
                      transition={{ type: 'spring', stiffness: 30 }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Baselines</h3>
                <div className="bg-white/[0.03] p-1 rounded-xl border border-white/5 flex flex-col">
                  <div className="flex justify-between items-center p-3">
                    <span className="text-xs text-slate-300 font-bold">Open-Eye EAR</span>
                    <span className="mono font-black text-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 rounded">{calibratedBaselines.baselineEar.toFixed(3)}</span>
                  </div>
                  <div className="w-full h-px bg-white/5" />
                  <div className="flex justify-between items-center p-3">
                    <span className="text-xs text-slate-300 font-bold">Blink EAR Threshold</span>
                    <span className="mono font-black text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded">{calibratedBaselines.earThreshold.toFixed(3)}</span>
                  </div>
                  <div className="w-full h-px bg-white/5" />
                  <div className="flex justify-between items-center p-3">
                    <span className="text-xs text-slate-300 font-bold">Yawn MAR Threshold</span>
                    <span className="mono font-black text-[#ff007f] bg-[#ff007f]/10 px-2 py-0.5 rounded">{calibratedBaselines.marThreshold.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><History size={12}/> Diagnostic Latency Trace</h3>
                <div className="bg-white/[0.03] p-5 rounded-xl border border-white/5">
                  <div className="flex items-end gap-2 h-20">
                    {reactionHistory.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <div style={{ height: `${Math.min(100, (val / 0.8) * 100)}%` }} className={`w-full rounded transition-all ${val < 0.35 ? 'bg-gradient-to-t from-emerald-500/20 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-t from-amber-500/20 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`} />
                        <span className="text-[9px] mono font-bold text-slate-500 group-hover:text-white transition-colors">{val.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RISK REPORT MODAL */}
      <AnimatePresence>
        {showReport && reportData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.95 }} className="glass-panel max-w-2xl w-full p-8 border-[#00e5ff]/30 shadow-[0_0_60px_rgba(0,229,255,0.15)] relative max-h-[90vh] overflow-y-auto activity-scroll">
              <button onClick={() => setShowReport(false)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
              
              <div className="mb-6">
                <h2 className="text-3xl font-black gradient-text tracking-tight uppercase mb-1">Cognitive Risk Audit</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex gap-4">
                  <span>ID: {reportData.user_id}</span>
                  <span className="text-[#00e5ff]">DURATION: {reportData.session_duration}</span>
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Mean CLI</div>
                  <div className="text-2xl font-black text-[#00e5ff] mono">{reportData.average_cli}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Peak Load</div>
                  <div className="text-2xl font-black text-red-400 mono">{reportData.peak_fatigue}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Risk Level</div>
                  <div className={`text-2xl font-black ${reportData.risk_level === 'High' ? 'text-red-500' : 'text-emerald-400'}`}>{reportData.risk_level}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1.5">Cog Score</div>
                  <div className="text-2xl font-black text-emerald-400 mono">{reportData.cognitiveScore || '—'}</div>
                </div>
              </div>

              {/* Zone Distribution in Report */}
              {reportData.zoneDistribution && (
                <div className="mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2"><Shield size={14} className="text-[#00e5ff]" /> Zone Analysis</h4>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex gap-1 h-6 rounded-lg overflow-hidden mb-3">
                      {Object.entries(reportData.zoneDistribution).map(([zone, pct]) => (
                        pct > 0 && <div key={zone} style={{ width: `${pct}%`, background: zoneColors[zone]?.color || '#64748b' }} className="transition-all" title={`${zone}: ${pct}%`} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(reportData.zoneDistribution).map(([zone, pct]) => (
                        <span key={zone} className="flex items-center gap-1.5 text-[10px] font-bold">
                          <div className="w-2 h-2 rounded-full" style={{ background: zoneColors[zone]?.color || '#64748b' }} />
                          <span className="text-slate-400 uppercase">{zone}</span>
                          <span className="mono font-black" style={{ color: zoneColors[zone]?.color || '#64748b' }}>{pct}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300 mb-3 flex items-center gap-2"><UserCheck size={14} className="text-[#00e5ff]" /> Mitigation Plan</h4>
                <div className="flex flex-col gap-2.5">
                  {reportData.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="w-2 h-2 bg-[#00e5ff] rounded-full shadow-[0_0_8px_#00e5ff]"></div>
                      <span className="text-slate-200 font-medium text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => window.print()} className="w-full py-4 bg-gradient-to-r from-[#00e5ff] to-[#7c3aed] hover:from-[#00e5ff] hover:to-[#00e5ff] text-black font-black uppercase text-xs tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all">
                EXPORT ARCHIVE PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
