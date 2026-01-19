const express = require('express');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const OUT_DIR = path.resolve(__dirname, 'out');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

app.post('/render', async (req, res) => {
    try {
        const { id, inputProps } = req.body;
        
        // FORÇAGE DU CHEMIN ABSOLU
        const bundlePath = path.join(__dirname, 'bundle.js');

        // VÉRIFICATION PHYSIQUE DU BUNDLE
        if (!fs.existsSync(bundlePath)) {
            throw new Error(`ERREUR CRITIQUE: Le fichier ${bundlePath} est introuvable sur le serveur.`);
        }

        console.log(`Rendu lancé avec le bundle: ${bundlePath}`);

        const composition = await selectComposition({
            bundle: bundlePath,
            id: id || 'HelloWorld',
            inputProps: inputProps || {},
        });

        await renderMedia({
            composition,
            serveUrl: bundlePath, // Utilisation de la variable locale vérifiée
            codec: 'h264',
            outputLocation: path.join(OUT_DIR, `video-${Date.now()}.mp4`),
            chromiumOptions: {
                executablePath: process.env.REMOTION_CHROME_EXECUTABLE || '/usr/bin/chromium',
                args: ['--no-sandbox']
            }
        });

        res.json({ success: true, message: "Rendu réussi" });
    } catch (e) {
        console.error("Détails de l'erreur:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.use('/out', express.static(OUT_DIR));
app.listen(3000, () => console.log('Serveur actif sur port 3000'));
