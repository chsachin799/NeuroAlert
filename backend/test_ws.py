import asyncio
import websockets
import json

async def test():
    try:
        async with websockets.connect('ws://localhost:8080/ws/fatigue') as ws:
            print("Connected")
            # First send a valid reset
            await ws.send(json.dumps({'action': 'reset', 'timestamp': 1000}))
            res = await ws.recv()
            print('Reset Response:', res)
            
            # Now send some fake empty landmarks
            payload = {
                "leftEye": [],
                "rightEye": [],
                "leftIris": [],
                "rightIris": [],
                "mouth": [],
                "isCalibrating": False,
                "timestamp": 1001
            }
            await ws.send(json.dumps(payload))
            res = await ws.recv()
            print('Empty Landmarks Response Length:', len(res))

            # Now send nulls (which might happen if indices are out of bounds)
            payload_nulls = {
                "leftEye": [{"x": 0.5, "y": 0.5}, None],
                "rightEye": [None, None, None],
                "leftIris": [],
                "rightIris": [],
                "mouth": [],
                "isCalibrating": False,
                "timestamp": 1002
            }
            await ws.send(json.dumps(payload_nulls))
            res = await ws.recv()
            print('Nulls Response Length:', len(res))
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
