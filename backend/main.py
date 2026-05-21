from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import time
import numpy as np
from fatigue_engine import FatigueEngine

app = FastAPI(title="NeuroAlert API", version="2.5.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active Session Registry to support multiple clients/sessions
active_sessions = {
    "NA-8829-X": {
        "cli_history": [8.0],
        "blink_count": 0,
        "yawn_count": 0,
        "last_reaction_time": 0.3,
        "baseline_ear": 0.28,
        "baseline_mar": 0.15,
        "ear_threshold": 0.22,
        "mar_threshold": 0.55,
        "risk_level": "Low",
        "session_duration": "45m"
    }
}

@app.get("/")
async def root():
    return {"message": "NeuroAlert API is active", "version": "2.5.0"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "uptime": time.time(),
        "active_sessions": len(active_sessions),
        "version": "2.5.0"
    }

@app.get("/api/risk-report")
async def get_risk_report(session_id: str = "NA-8829-X"):
    session = active_sessions.get(session_id)
    if not session:
        return {"error": f"Session {session_id} not found"}
        
    history = session["cli_history"]
    
    # Use dynamic recommendations from engine if available
    engine = session.get("_engine")
    if engine:
        recommendations = engine.get_dynamic_recommendations()
        session_stats = engine.get_session_stats()
        zone_distribution = engine.get_zone_distribution()
        cognitive_score = engine.get_cognitive_score()
        fatigue_trend = engine.get_fatigue_trend()
        fatigue_episodes = engine.fatigue_episodes[-10:]  # Last 10 episodes
    else:
        recommendations = [
            "💡 Increase workspace illumination to reduce eye strain",
            "🕐 Schedule 15m break every 2h",
            "💧 Stay hydrated — drink water every 30 minutes"
        ]
        session_stats = {"alerts_count": 0, "avg_cli": 0.0, "blinks_per_minute": 0.0}
        zone_distribution = {"optimal": 100, "light": 0, "moderate": 0, "heavy": 0, "critical": 0}
        cognitive_score = 100
        fatigue_trend = "stable"
        fatigue_episodes = []
    
    return {
        "user_id": session_id,
        "session_duration": session["session_duration"],
        "average_cli": round(sum(history)/len(history), 2) if history else 0.0,
        "peak_fatigue": max(history) if history else 0.0,
        "total_blinks": session["blink_count"],
        "total_yawns": session["yawn_count"],
        "risk_level": "High" if any(c > 60 for c in history) else "Low",
        "recommendations": recommendations,
        "alertsCount": session_stats["alerts_count"],
        "avgCli": session_stats["avg_cli"],
        "blinksPerMinute": session_stats["blinks_per_minute"],
        # New enhanced data
        "zoneDistribution": zone_distribution,
        "cognitiveScore": cognitive_score,
        "fatigueTrend": fatigue_trend,
        "fatigueEpisodes": fatigue_episodes,
    }

@app.get("/api/session-analytics")
async def get_session_analytics(session_id: str = "NA-8829-X"):
    """Advanced analytics endpoint for the dashboard."""
    session = active_sessions.get(session_id)
    if not session:
        return {"error": f"Session {session_id} not found"}
    
    engine = session.get("_engine")
    if not engine:
        return {"error": "No active engine for session"}
    
    stats = engine.get_session_stats()
    
    return {
        "sessionId": session_id,
        "cognitiveScore": engine.get_cognitive_score(),
        "fatigueTrend": engine.get_fatigue_trend(),
        "zoneDistribution": engine.get_zone_distribution(),
        "fatigueEpisodes": engine.fatigue_episodes[-10:],
        "stats": stats,
        "baselines": {
            "ear": session["baseline_ear"],
            "mar": session["baseline_mar"],
            "earThreshold": session["ear_threshold"],
            "marThreshold": session["mar_threshold"],
        }
    }

@app.websocket("/ws/fatigue")
async def fatigue_websocket(websocket: WebSocket):
    await websocket.accept()
    print("New client connected to NeuroAlert WebSocket")
    
    # Connection-scoped Fatigue Engine
    engine = FatigueEngine()
    session_id = "NA-8829-X"
    session_start = time.time()
    
    # Initialize session in the registry
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "cli_history": [8.0],
            "blink_count": 0,
            "yawn_count": 0,
            "last_reaction_time": 0.3,
            "baseline_ear": 0.28,
            "baseline_mar": 0.15,
            "ear_threshold": 0.22,
            "mar_threshold": 0.55,
            "risk_level": "Low",
            "session_duration": "45m"
        }
        
    session = active_sessions[session_id]
    
    # Store engine reference in session for risk-report endpoint access
    session["_engine"] = engine
    
    # Specific buffers for each calibration step
    calib_buffers = {
        "neutral_ear": [],
        "neutral_mar": [],
        "blink_ear": [],
        "yawn_mar": []
    }
    
    last_step = "none"
    was_calibrating = False
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle action commands (like session reset)
            action = message.get("action")
            if action == "reset":
                engine.blink_count = 0
                engine.yawn_count = 0
                engine.consecutive_closed_frames = 0
                engine.consecutive_open_mouth_frames = 0
                engine.last_mar_state = False
                engine.last_ear_state = False
                engine.iris_history.clear()
                engine.alert_history.clear()
                engine.cli_history_buffer.clear()
                engine.high_closure_events = 0
                engine.session_start_time = time.time()
                engine.peak_cli = 0
                engine.min_cli = 100
                engine.total_frames = 0
                engine.fatigue_episodes.clear()
                engine.zone_history.clear()
                engine._in_episode = False
                session_start = time.time()
                
                session["cli_history"] = [8.0]
                session["blink_count"] = 0
                session["yawn_count"] = 0
                
                print("Session statistics and history reset.")
                await websocket.send_json({
                    "cli": 8.0,
                    "status": "Optimal",
                    "triggers": [],
                    "predictions": [],
                    "stats": {
                        "blinks": 0,
                        "yawns": 0,
                        "reactionTime": round(session["last_reaction_time"], 3),
                        "stability": 1.0
                    },
                    "ear": 0.3,
                    "mar": 0.1,
                    "cognitiveScore": 100,
                    "fatigueTrend": "stable",
                    "zoneDistribution": {"optimal": 100, "light": 0, "moderate": 0, "heavy": 0, "critical": 0},
                    "timestamp": message.get("timestamp")
                })
                continue

            # Handle sensitivity updates
            sensitivity = message.get("sensitivity")
            if sensitivity:
                base_ear_t = session["ear_threshold"]
                base_mar_t = session["mar_threshold"]
                if sensitivity == "high":
                    engine.ear_threshold = round(base_ear_t * 1.15, 3)
                    engine.mar_threshold = round(base_mar_t * 0.85, 3)
                elif sensitivity == "low":
                    engine.ear_threshold = round(base_ear_t * 0.85, 3)
                    engine.mar_threshold = round(base_mar_t * 1.15, 3)
                else: # medium / default
                    engine.ear_threshold = base_ear_t
                    engine.mar_threshold = base_mar_t
                print(f"Sensitivity updated to: {sensitivity.upper()}. Active thresholds: EAR={engine.ear_threshold}, MAR={engine.mar_threshold}")
                await websocket.send_json({
                    "action": "sensitivity_updated",
                    "ear_threshold": engine.ear_threshold,
                    "mar_threshold": engine.mar_threshold
                })
                continue

            # Extract landmarks and calibration status
            left_eye = message.get("leftEye", [])
            right_eye = message.get("rightEye", [])
            left_iris = message.get("leftIris", [])
            right_iris = message.get("rightIris", [])
            mouth = message.get("mouth", [])
            is_calibrating = message.get("isCalibrating", False)
            calibration_step = message.get("calibrationStep", "none")
            reaction_time = message.get("reactionTime")

            if reaction_time is not None:
                session["last_reaction_time"] = reaction_time
                print(f"Recorded Reaction Time: {reaction_time}s")
                await websocket.send_json({
                    "action": "reaction_recorded",
                    "reactionTime": round(reaction_time, 3)
                })
                continue
            
            # Convert landmarks to coordinate lists
            def to_coords(landmarks):
                if not landmarks: return []
                return [[l['x'], l['y']] for l in landmarks if l and 'x' in l and 'y' in l]
            
            le_coords = to_coords(left_eye)
            re_coords = to_coords(right_eye)
            li_coords = to_coords(left_iris)
            ri_coords = to_coords(right_iris)
            m_coords = to_coords(mouth)
            
            # Calculate metrics
            ear_l = engine.calculate_ear(le_coords) if le_coords else 0.3
            ear_r = engine.calculate_ear(re_coords) if re_coords else 0.3
            avg_ear = (ear_l + ear_r) / 2.0
            
            mar = engine.calculate_mar(m_coords) if m_coords else 0.1
            stability = engine.calculate_gaze_stability(li_coords, ri_coords)
            
            # Step-Aware Calibration Logic
            if is_calibrating:
                if not was_calibrating:
                    # Calibration just started, clear previous buffer data
                    for key in calib_buffers:
                        calib_buffers[key].clear()
                    print("New multi-step calibration session started. Cleared buffers.")
                
                # Buffer raw frames according to step
                if calibration_step == "neutral":
                    calib_buffers["neutral_ear"].append(avg_ear)
                    calib_buffers["neutral_mar"].append(mar)
                    if last_step != "neutral":
                        print("Calibration Stage: NEUTRAL - Hold neutral expression")
                elif calibration_step == "blink":
                    calib_buffers["blink_ear"].append(avg_ear)
                    if last_step != "blink":
                        print("Calibration Stage: BLINK - Blink naturally")
                elif calibration_step == "yawn":
                    calib_buffers["yawn_mar"].append(mar)
                    if last_step != "yawn":
                        print("Calibration Stage: YAWN - Open mouth wide")
                
                last_step = calibration_step
            else:
                # If calibration just stopped, finalize calculations exactly ONCE
                if was_calibrating:
                    neutral_ears = calib_buffers["neutral_ear"]
                    neutral_mars = calib_buffers["neutral_mar"]
                    blink_ears = calib_buffers["blink_ear"]
                    yawn_mars = calib_buffers["yawn_mar"]
                    
                    b_ear = np.median(neutral_ears) if neutral_ears else 0.28
                    b_mar = np.median(neutral_mars) if neutral_mars else 0.15
                    
                    # Blink threshold midpoint: average open vs min closed
                    min_blink = np.min(blink_ears) if blink_ears else b_ear * 0.7
                    t_ear = round((b_ear + min_blink) / 2.0, 3)
                    
                    # Yawn threshold: 75% of maximum yawn
                    max_yawn = np.max(yawn_mars) if yawn_mars else b_mar * 3.5
                    t_mar = round(max_yawn * 0.75, 3)
                    
                    # Save metrics back to class and global session
                    session["baseline_ear"] = b_ear
                    session["baseline_mar"] = b_mar
                    session["ear_threshold"] = t_ear
                    session["mar_threshold"] = t_mar
                    
                    engine.ear_threshold = t_ear
                    engine.mar_threshold = t_mar
                    
                    print(f"=== Dynamic Twin Calibration Complete ===")
                    print(f"Baseline Open-Eye EAR: {b_ear:.3f} | Min Blink EAR: {min_blink:.3f}")
                    print(f"  -> Set EAR Threshold to: {t_ear}")
                    print(f"Baseline Closed-Mouth MAR: {b_mar:.3f} | Max Yawn MAR: {max_yawn:.3f}")
                    print(f"  -> Set MAR Threshold to: {t_mar}")
                    print(f"=========================================")
                    
                    last_step = "none"
            
            was_calibrating = is_calibrating
            
            # Calculate CLI relative to active baseline
            cli, triggers = engine.get_cli_score(avg_ear, mar, stability, session["last_reaction_time"])
            
            # Adjust CLI based on deviation from baseline
            baseline_ear_val = session["baseline_ear"]
            ear_dev = (baseline_ear_val - avg_ear) / baseline_ear_val if avg_ear < baseline_ear_val else 0
            cli = min(100.0, cli + ear_dev * 40.0)
            
            # Track CLI in engine buffer and record alerts
            engine.update_cli_buffer(cli)
            engine.record_alert(cli)
            
            # Update history (limited to last 100 entries)
            cli_history = session["cli_history"]
            cli_history.append(cli)
            if len(cli_history) > 100:
                cli_history.pop(0)
            
            # Update values in global session dictionary
            session["blink_count"] = engine.blink_count
            session["yawn_count"] = engine.yawn_count
            
            # Predict future fatigue
            predictions = engine.predict_future_fatigue(cli_history)
            
            # Determine overall cognitive state
            status = "Optimal"
            if cli > 35: status = "Moderate Fatigue"
            if cli > 65: status = "Critical Fatigue"
            
            # Get dynamic data
            session_stats = engine.get_session_stats()
            recommendations = engine.get_dynamic_recommendations()
            session_duration = time.time() - session_start
            
            # Send results back to React client
            await websocket.send_json({
                "cli": round(cli, 1),
                "status": status,
                "triggers": triggers,
                "predictions": predictions,
                "stats": {
                    "blinks": engine.blink_count,
                    "yawns": engine.yawn_count,
                    "reactionTime": round(session["last_reaction_time"], 3),
                    "stability": stability
                },
                "ear": round(avg_ear, 3),
                "mar": round(mar, 3),
                "timestamp": message.get("timestamp"),
                # Dynamic Baselines and Thresholds
                "baselineEar": round(session["baseline_ear"], 3),
                "baselineMar": round(session["baseline_mar"], 3),
                "earThreshold": round(engine.ear_threshold, 3),
                "marThreshold": round(engine.mar_threshold, 3),
                # Enhanced session data
                "sessionDuration": round(session_duration, 1),
                "recommendations": recommendations,
                "alertsCount": len(engine.alert_history),
                "blinksPerMinute": session_stats["blinks_per_minute"],
                # New enhanced analytics
                "cognitiveScore": engine.get_cognitive_score(),
                "fatigueTrend": engine.get_fatigue_trend(),
                "zoneDistribution": engine.get_zone_distribution(),
                "fatigueZone": engine.classify_zone(cli),
            })
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in WebSocket: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
