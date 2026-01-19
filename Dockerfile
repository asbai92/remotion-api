FROM node:20-bookworm-slim

# Installation des dépendances pour le rendu (Chromium, FFmpeg)
RUN apt-get update && apt-get install -y \
    chromium ffmpeg fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des paquets
COPY package*.json ./
RUN npm install

# Copie du code
COPY . .

# Configuration de l'environnement
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium
EXPOSE 3000

CMD ["npm", "start"]
