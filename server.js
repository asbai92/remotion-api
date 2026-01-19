const express = require('express');
const { renderMedia, renderStill, selectComposition, getCompositions } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Dossier de sortie pour les vidéos
const OUT_DIR = path.resolve('./out');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const BUNDLE_PATH = path.resolve('./bundle.js');

// 1. Lister toutes les compositions (Équivalent de 'remotion compositions')
app.get('/compositions', async (req, res) => {
    try {
        const compositions = await getCompositions(BUNDLE_PATH);
        res.json(compositions.map(c => ({ id: c.id, durationInFrames: c.durationInFrames, fps: c.fps })));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Rendu Vidéo (Équivalent de 'remotion render')
app.post('/render', async (req, res) => {
    try {
        const { id, inputProps, codec = 'h264' } = req.body;
        const outputLocation = path.join(OUT_DIR, `video-${Date.now()}.mp4`);

        const composition = await selectComposition({
            bundle: BUNDLE_PATH,
            id: id || 'MyComp',
            inputProps: inputProps || {},
        });

        await renderMedia({
            composition,
            serveUrl: BUNDLE_PATH,
            codec,
            outputLocation,
            chromiumOptions: { executablePath: process.env.REMOTION_CHROME_EXECUTABLE }
        });

        res.json({ success: true, file: path.basename(outputLocation) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Rendu Image/Still (Équivalent de 'remotion still')
app.post('/still', async (req, res) => {
    try {
        const { id, frame = 0, inputProps } = req.body;
        const outputLocation = path.join(OUT_DIR, `image-${Date.now()}.png`);

        const composition = await selectComposition({
            bundle: BUNDLE_PATH,
            id: id || 'MyComp',
            inputProps: inputProps || {},
        });

        await renderStill({
            composition,
            serveUrl: BUNDLE_PATH,
            outputLocation,
            frame,
            chromiumOptions: { executablePath: process.env.REMOTION_CHROME_EXECUTABLE }
        });

        res.json({ success: true, file: path.basename(outputLocation) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serveur les fichiers statiques pour pouvoir les télécharger
app.use('/out', express.static(OUT_DIR));

app.listen(3000, () => console.log('API Remotion Full Commandes prête sur port 3000'));
