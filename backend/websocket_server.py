import os
import uvicorn
from fastapi import FastAPI, WebSocket
from starlette.websockets import WebSocketDisconnect
from app.configuration.config import configure_cors
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()
configure_cors(app)
connected_clients = {}

@app.websocket("/ws/{user_id}")
async def start_websocket(websocket: WebSocket, user_id: int):
    await websocket.accept()
    print(f"WebSocket client connected for user {user_id}.")
    if user_id not in connected_clients:
        connected_clients[user_id] = set()
    connected_clients[user_id].add(websocket)

    try:
        while True:
            msg = await websocket.receive_text()
            print(f"Message received from user {user_id}: {msg}")
            await send_to_user_clients(msg, user_id, websocket)
    except WebSocketDisconnect:
        print(f"Connection closed for user {user_id}.")
    except Exception as e:
        print(f"An error occurred in WebSocket connection for user {user_id}: {str(e)}")
    finally:
        if user_id in connected_clients:
            connected_clients[user_id].discard(websocket)
            if not connected_clients[user_id]:
                del connected_clients[user_id]

async def send_to_user_clients(message, user_id, sender_websocket=None):
    if user_id not in connected_clients:
        return
    
    clients_to_remove = []
    for client in list(connected_clients[user_id]):
        if client != sender_websocket:  
            try:
                await client.send_text(message)
                print(f"Message sent to user {user_id} client: {message}")
            except Exception as e:
                print(f"Error sending message to user {user_id} client: {str(e)}")
                clients_to_remove.append(client)
    
    # Nettoyer les connexions fermées
    for client in clients_to_remove:
        connected_clients[user_id].discard(client)

async def send_notification_to_user(user_id: int, message: str, notif_type: str = "info"):
    if user_id not in connected_clients:
        print(f"No connected clients for user {user_id}")
        return
    
    notification_data = {
        "message": message,
        "type": notif_type,
        "user_id": user_id,
        "created_at": None 
    }
    
    payload = json.dumps(notification_data)
    clients_to_remove = []
    
    for client in list(connected_clients[user_id]):
        try:
            await client.send_text(payload)
            print(f"Notification sent to user {user_id}: {message}")
        except Exception as e:
            print(f"Error sending notification to user {user_id}: {str(e)}")
            clients_to_remove.append(client)
    
    # Nettoyer les connexions fermées
    for client in clients_to_remove:
        connected_clients[user_id].discard(client)

print("WebSocket server started")

APP_HOST = os.getenv("APP_HOST", "localhost")
APP_PORT_WB = int(os.getenv("APP_PORT_WB", 8001))

if __name__ == "__main__":
    uvicorn.run(app, host=APP_HOST, port=APP_PORT_WB)