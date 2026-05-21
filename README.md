# NeuroAlert: AI-Based Cognitive Fatigue Detection

NeuroAlert is a state-of-the-art AI system that detects, tracks, and predicts cognitive fatigue in real-time. Designed with a premium, futuristic glassmorphic UI, it leverages computer vision and machine learning to keep you alert and focused during long sessions.

## 🌟 Features

- **Live Biometric Tracking**: Uses MediaPipe to track your Eye Aspect Ratio (EAR) and Mouth Aspect Ratio (MAR) in real-time.
- **Interactive Twin Calibration**: A robust, interactive calibration sequence that mathematically calculates your personal neutral baselines using `np.median` to resist outliers (like accidental blinks). It physically verifies your blinks and yawns before proceeding.
- **Cognitive Load Index (CLI)**: A dynamic scoring system (0-100) that calculates your fatigue level based on eye closures, yawning frequency, and gaze stability.
- **Micro-Tests**: Randomized, interactive reaction time tests to validate your cognitive alertness.
- **Focus Protocol**: Built-in Pomodoro-style timer to encourage healthy work-rest cycles.
- **Risk Audit Reports**: Generate and export comprehensive session analytics and AI prescriptions.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Framer Motion (for micro-animations), Recharts (for telemetry graphs), Tailwind CSS, MediaPipe Face Mesh.
- **Backend**: Python, FastAPI, NumPy, WebSockets (for ultra-low latency, bi-directional communication).

## 🚀 Getting Started

### Prerequisites
- Python 3.9+ installed
- Node.js 18+ installed

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/chsachin799/NeuroAlert.git
   cd NeuroAlert
   ```

2. **Setup the Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Setup the Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

## 💻 How to Run

To run NeuroAlert, you need to start both the backend and frontend servers simultaneously in two different terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
python main.py
```
*The WebSocket server will start on `http://0.0.0.0:8080`.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).*

## 🎮 Steps to Use

1. **Allow Camera Access**: When you open the web app, grant browser permissions for your webcam.
2. **Calibrate Your Twin**: 
   - Click the **"CALIBRATE TWIN"** button at the top right.
   - **Neutral Phase**: Look straight ahead for 3 seconds to establish your mathematical baseline.
   - **Blink Phase**: Perform 3 natural blinks. The system will physically verify them.
   - **Yawn Phase**: Open your mouth wide and hold it to fill the progress bar.
3. **Monitor Fatigue**: Watch the real-time telemetry graph, zone distributions, and CLI score. If you start to fatigue, the system will alert you and suggest breaks.
4. **Take a Reaction Test**: Click "Diagnostic" to test your sensory latency. Click the circle the exact moment it turns green!
5. **Generate a Report**: Click the "Report" button to view a detailed Cognitive Risk Audit of your current session.
