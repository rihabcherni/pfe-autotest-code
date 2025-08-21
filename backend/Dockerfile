FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash curl gnupg unzip wget docker.io \
    chromium chromium-driver xvfb \
    libglib2.0-0 libnss3 libgconf-2-4 libxss1 libasound2 libxtst6 \
    libgtk-3-0 fonts-liberation xdg-utils libxrandr2 libpangocairo-1.0-0 \
    libatk1.0-0 libcairo-gobject2 libgdk-pixbuf2.0-0 libxcomposite1 \
    libxdamage1 libappindicator1 lsb-release \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium \
    GOOGLE_CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver

RUN groupadd -r chromeuser && useradd -r -g chromeuser -G audio,video,docker chromeuser \
    && mkdir -p /home/chromeuser/Downloads \
    && chown -R chromeuser:chromeuser /home/chromeuser

WORKDIR /backend

COPY . .

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

RUN mkdir -p /backend/static/screenshots && chown -R chromeuser:chromeuser /backend/static
USER chromeuser
EXPOSE 8000 8001
CMD ["bash", "-c", "uvicorn main:combined_app --host 0.0.0.0 --port 8000 & uvicorn websocket_server:app --host 0.0.0.0 --port 8001 && wait"]
