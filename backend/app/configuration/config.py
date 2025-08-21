from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()
def configure_cors(app):
    origins = [
        os.getenv("FRONT_LINK"),
        os.getenv("WEBSOCKET_LINK")
    ]
    origins = [origin for origin in origins if origin is not None]
    print(f"CORS Origins autorisés : {origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )