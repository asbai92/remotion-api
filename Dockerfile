FROM docker.io/library/node:20-bookworm-slim

# On garde FFmpeg et les polices, mais on n'a plus besoin de 'chromium' système
RUN apt-get update && apt-get install -y \
    ffmpeg fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

# --- AJOUT CRUCIAL ---
# On force Remotion à télécharger son Chrome Headless Shell dès maintenant
RUN npx remotion browser install
# ---------------------

COPY . .

RUN npx remotion bundle src/index.tsx build/bundle.js

# On SUPPRIME la ligne ENV REMOTION_CHROME_EXECUTABLE car on veut laisser Remotion choisir le sien
EXPOSE 3000

CMD ["npm", "start"]
