import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

def get_engine(url, max_retries=5, retry_interval=5):
    retries = 0
    last_exception = None
    
    while retries < max_retries:
        try:
            engine = create_engine(url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"Database connection successful after {retries} retries")
            return engine
        except Exception as e:
            last_exception = e
            retries += 1
            print(f"Connection attempt {retries}/{max_retries} failed: {e}")
            if retries < max_retries:
                print(f"Retrying in {retry_interval} seconds...")
                time.sleep(retry_interval)
    
    print(f"Failed to connect to database after {max_retries} attempts")
    raise last_exception

engine = get_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()