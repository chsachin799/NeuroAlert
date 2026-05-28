import numpy as np
import time

class FatigueEngine:
    def __init__(self):
        self.ear_threshold = 0.22
        self.mar_threshold = 0.55
        
        self.blink_count = 0
        self.yawn_count = 0
        
        # Temporal state counters (at 100ms intervals)
        self.consecutive_closed_frames = 0
        self.consecutive_open_mouth_frames = 0
        
        self.last_mar_state = False  # True if actively yawning
        self.last_ear_state = False  # True if eye is in prolonged closure
        self.triggers = []
        self.iris_history = []
        
        # Session tracking
        self.session_start_time = time.time()
        
        # Alert history: timestamps when CLI > 65, capped at 50
        self.alert_history = []
        
        # CLI history buffer for computing averages
        self.cli_history_buffer = []
        
        # Track how often consecutive_closed_frames goes high
        self.high_closure_events = 0
        
        # Fatigue zone tracking (new)
        self.zone_history = []  # List of (timestamp, zone) tuples
        self.peak_cli = 0
        self.min_cli = 100
        self.total_frames = 0
        self.fatigue_episodes = []  # List of {start, end, peak_cli} dicts
        self._in_episode = False
        self._episode_start = None
        self._episode_peak = 0

    def record_alert(self, cli_score):
        """Record a fatigue alert if CLI > 65. Cap history at 50 entries."""
        if cli_score > 65:
            self.alert_history.append(time.time())
            if len(self.alert_history) > 50:
                self.alert_history.pop(0)
    
    def update_cli_buffer(self, cli_score):
        """Track CLI scores for session statistics."""
        self.cli_history_buffer.append(cli_score)
        if len(self.cli_history_buffer) > 200:
            self.cli_history_buffer.pop(0)
        # Track high closure events
        if self.consecutive_closed_frames >= 4:
            self.high_closure_events += 1
        
        # Track peak and min
        self.peak_cli = max(self.peak_cli, cli_score)
        if cli_score > 0:
            self.min_cli = min(self.min_cli, cli_score)
        self.total_frames += 1
        
        # Track fatigue zone
        zone = self.classify_zone(cli_score)
        self.zone_history.append((time.time(), zone))
        if len(self.zone_history) > 500:
            self.zone_history.pop(0)
        
        # Track fatigue episodes (CLI > 35 for sustained periods)
        if cli_score > 35:
            if not self._in_episode:
                self._in_episode = True
                self._episode_start = time.time()
                self._episode_peak = cli_score
            else:
                self._episode_peak = max(self._episode_peak, cli_score)
        else:
            if self._in_episode:
                self._in_episode = False
                duration = time.time() - self._episode_start
                if duration > 3:  # Only record episodes > 3 seconds
                    self.fatigue_episodes.append({
                        'start': self._episode_start,
                        'end': time.time(),
                        'duration': round(duration, 1),
                        'peak_cli': round(self._episode_peak, 1),
                    })
                    if len(self.fatigue_episodes) > 20:
                        self.fatigue_episodes.pop(0)

    @staticmethod
    def classify_zone(cli_score):
        """Classify fatigue zone from CLI score."""
        if cli_score <= 20:
            return 'optimal'
        elif cli_score <= 35:
            return 'light'
        elif cli_score <= 55:
            return 'moderate'
        elif cli_score <= 75:
            return 'heavy'
        else:
            return 'critical'

    def get_zone_distribution(self):
        """Get percentage time spent in each zone."""
        if not self.zone_history:
            return {'optimal': 100, 'light': 0, 'moderate': 0, 'heavy': 0, 'critical': 0}
        
        counts = {'optimal': 0, 'light': 0, 'moderate': 0, 'heavy': 0, 'critical': 0}
        for _, zone in self.zone_history:
            counts[zone] = counts.get(zone, 0) + 1
        
        total = len(self.zone_history)
        return {k: round((v / total) * 100, 1) for k, v in counts.items()}

    def get_fatigue_trend(self):
        """Analyze the trend of fatigue over the session."""
        if len(self.cli_history_buffer) < 20:
            return 'stable'
        
        recent = self.cli_history_buffer[-20:]
        older = self.cli_history_buffer[-40:-20] if len(self.cli_history_buffer) >= 40 else self.cli_history_buffer[:20]
        
        recent_avg = np.mean(recent)
        older_avg = np.mean(older)
        
        diff = recent_avg - older_avg
        if diff > 8:
            return 'rising'
        elif diff < -8:
            return 'declining'
        else:
            return 'stable'

    def get_cognitive_score(self):
        """Calculate an overall cognitive performance score (0-100, higher = better)."""
        if not self.cli_history_buffer:
            return 100
        
        avg_cli = np.mean(self.cli_history_buffer[-50:])
        # Inverse of fatigue
        score = max(0, min(100, 100 - avg_cli))
        
        # Penalize for episodes
        episode_penalty = len(self.fatigue_episodes) * 2
        score = max(0, score - episode_penalty)
        
        # Bonus for gaze stability
        if len(self.iris_history) >= 10:
            coords = np.array(self.iris_history)
            variance = np.var(coords, axis=0)
            total_variance = np.sum(variance)
            stability = max(0.0, 1.0 - (total_variance * 800))
            if stability > 0.8:
                score = min(100, score + 5)
        
        return round(score, 1)

    def get_dynamic_recommendations(self):
        """Return 3-4 contextual recommendations based on current fatigue state."""
        recommendations = []
        
        # Specific recommendations based on current state
        if self.blink_count > 20:
            recommendations.append("⚠️ High blink rate detected — take a 20-second eye break (look 20ft away)")
        
        if self.yawn_count > 3:
            recommendations.append("😴 Frequent yawning detected — take a 10-15 minute rest break now")
        
        stability = 1.0
        if len(self.iris_history) >= 10:
            coords = np.array(self.iris_history)
            variance = np.var(coords, axis=0)
            total_variance = np.sum(variance)
            stability = max(0.0, 1.0 - (total_variance * 800))
        
        if stability < 0.7:
            recommendations.append("🪑 Unstable gaze detected — adjust your posture and screen position")
        
        if self.high_closure_events > 5:
            recommendations.append("☕ Frequent prolonged eye closures — consider caffeine intake or a power nap")
        
        # Trend-based recommendations
        trend = self.get_fatigue_trend()
        if trend == 'rising':
            recommendations.append("📈 Fatigue is trending upward — consider a break within the next 5 minutes")
        
        # Fill with generic recommendations to always return 3-4
        generic_pool = [
            "💡 Increase workspace illumination to reduce eye strain",
            "💧 Stay hydrated — drink water every 30 minutes",
            "🕐 Follow the 20-20-20 rule: every 20 min, look 20ft away for 20 sec",
            "🧘 Practice deep breathing for 1 minute to boost alertness",
            "🚶 Stand up and stretch every 45 minutes",
            "📱 Reduce screen brightness to match ambient lighting"
        ]
        
        for rec in generic_pool:
            if len(recommendations) >= 4:
                break
            if rec not in recommendations:
                recommendations.append(rec)
        
        return recommendations[:4]

    def get_session_stats(self):
        """Return comprehensive session statistics."""
        now = time.time()
        session_duration = now - self.session_start_time
        
        avg_cli = 0.0
        if self.cli_history_buffer:
            avg_cli = round(sum(self.cli_history_buffer) / len(self.cli_history_buffer), 2)
        
        blinks_per_minute = 0.0
        if session_duration > 0:
            minutes_elapsed = session_duration / 60.0
            blinks_per_minute = round(self.blink_count / max(minutes_elapsed, 0.01), 2)
        
        return {
            "session_duration_seconds": round(session_duration, 1),
            "alerts_count": len(self.alert_history),
            "avg_cli": avg_cli,
            "blinks_per_minute": blinks_per_minute,
            "peak_cli": round(self.peak_cli, 1),
            "cognitive_score": self.get_cognitive_score(),
            "fatigue_trend": self.get_fatigue_trend(),
            "zone_distribution": self.get_zone_distribution(),
            "fatigue_episodes": len(self.fatigue_episodes),
            "total_blinks": self.blink_count,
            "total_yawns": self.yawn_count,
        }
        
    def calculate_ear(self, landmarks):
        """
        Calculate Eye Aspect Ratio (EAR)
        """
        try:
            # Vertical distances
            v1 = np.linalg.norm(np.array(landmarks[1]) - np.array(landmarks[5]))
            v2 = np.linalg.norm(np.array(landmarks[2]) - np.array(landmarks[4]))
            # Horizontal distance
            h = np.linalg.norm(np.array(landmarks[0]) - np.array(landmarks[3]))
            
            ear = (v1 + v2) / (2.0 * h)
            return ear
        except Exception:
            return 0.3

    def calculate_mar(self, landmarks):
        """
        Calculate Mouth Aspect Ratio (MAR) for Yawn Detection
        """
        try:
            v = np.linalg.norm(np.array(landmarks[1]) - np.array(landmarks[7])) # Top to bottom
            h = np.linalg.norm(np.array(landmarks[0]) - np.array(landmarks[4])) # Left to right
            mar = v / h
            return mar
        except Exception:
            return 0.1

    def calculate_gaze_stability(self, left_iris, right_iris):
        """
        Calculate gaze stability based on iris movement variance.
        """
        if not left_iris or not right_iris:
            return 1.0
        
        # Use the center point of iris
        center = np.mean([left_iris[0], right_iris[0]], axis=0)
        self.iris_history.append(center)
        if len(self.iris_history) > 30:
            self.iris_history.pop(0)
            
        if len(self.iris_history) < 10:
            return 1.0
            
        coords = np.array(self.iris_history)
        variance = np.var(coords, axis=0)
        total_variance = np.sum(variance)
        
        # Normalize: high variance = low stability
        stability = max(0.0, 1.0 - (total_variance * 800)) 
        return round(stability, 2)

    def get_cli_score(self, ear, mar, stability=1.0, reaction_time=0.3, face_missing_in_darkness=False, face_missing=False):
        """
        Calculate Cognitive Load Index (0-100) and identify triggers.
        """
        self.triggers = []
        
        # Anti-Evasion Check
        if face_missing_in_darkness or face_missing:
            self.triggers.append("Camera Blocked / Dark Evasion")
            return 100.0, self.triggers
            
        # Eye Closure analysis
        eye_score = 0
        if ear < self.ear_threshold:
            self.consecutive_closed_frames += 1
            # If closed for 4 or more frames (>= 400ms), it's a micro-sleep
            if self.consecutive_closed_frames >= 4:
                eye_score = 60
                self.triggers.append("Prolonged Eye Closure")
                self.last_ear_state = True
        else:
            # If the eye was closed briefly (< 4 frames), count it as a completed normal blink
            if 0 < self.consecutive_closed_frames < 4:
                self.blink_count += 1
            
            self.consecutive_closed_frames = 0
            self.last_ear_state = False

        # Yawn analysis
        mouth_score = 0
        if mar > self.mar_threshold:
            self.consecutive_open_mouth_frames += 1
            # If open for 10 or more frames (>= 1.0s), it's a yawn
            if self.consecutive_open_mouth_frames >= 10:
                mouth_score = 40
                self.triggers.append("Yawning Detected")
                if not self.last_mar_state:
                    self.yawn_count += 1
                    self.last_mar_state = True
        else:
            self.consecutive_open_mouth_frames = 0
            self.last_mar_state = False
        
        # Stability penalty
        stability_score = (1.0 - stability) * 35 if stability < 0.85 else 0
        if stability_score > 15:
            self.triggers.append("Unstable Gaze")
        
        # Reaction time penalty
        rt_score = (reaction_time - 0.3) * 160 if reaction_time > 0.35 else 0
        if rt_score > 20:
            self.triggers.append("Slow Reaction Time")
        
        total_score = min(100.0, eye_score + mouth_score + stability_score + rt_score)
        
        # Decay logic for scores if no active triggers
        if not self.triggers:
            # Base cognitive load rests around 8.0, decays smoothly
            total_score = max(8.0, total_score * 0.92)

        return round(total_score, 2), self.triggers

    def predict_future_fatigue(self, history):
        """
        Predict CLI for the next 10 minutes based on history
        """
        if len(history) < 5:
            return []
        
        # Simple linear regression for trend
        x = np.arange(len(history))
        y = np.array(history)
        slope, intercept = np.polyfit(x, y, 1)
        
        predictions = []
        last_idx = len(history)
        for i in range(1, 11): # Predict 10 steps ahead
            pred = slope * (last_idx + i) + intercept
            # Add some "fatigue acceleration" if trend is upwards
            if slope > 0:
                pred += (i ** 1.5) * 0.5
            
            predictions.append(round(min(100.0, max(0.0, pred)), 2))
            
        return predictions
