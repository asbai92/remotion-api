const express = require('express');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

let bundled = null; // Contiendra le chemin du bundle une fois prêt

// INITIALISATION : On crée le bundle au démarrage du serveur
const initBundle = async () => {
    console.log("[INIT] Création du bundle Remotion...");
    bundled = await bundle({
        entryPoint: path.resolve(__dirname, './src/index.tsx'), // Vérifie bien .tsx ou .ts
        webpackOverride: (config) => config,
    });
    console.log("[INIT] Bundle prêt !");
};

initBundle().catch(console.error);

app.post('/render', async (req, res) => {
    if (!bundled) return res.status(503).json({ error: "Le bundle n'est pas encore prêt." });

    const requestId = Date.now();
    try {
        const { id, inputProps } = req.body;
        const compositionId = id || 'HelloWorld';

        // 1. Sélection de la composition
        const composition = await selectComposition({
            serveUrl: bundled,
            id: compositionId,
            inputProps: inputProps || {},
        });

        const outputName = `video-${requestId}.mp4`;
        const outputLocation = path.resolve(__dirname, 'out', outputName);

        // 2. Rendu (Options recommandées par la doc 2024)
        console.log(`[${requestId}] Rendu en cours : ${compositionId}`);
        await renderMedia({
            codec: 'h264',
            composition,
            serveUrl: bundled,
            outputLocation: outputLocation,
            chromiumOptions: {
                enableMultiProcessOnLinux: true, // RECOMMANDÉ PAR LA DOC
            },
            inputProps: inputProps || {},
        });

        res.json({ 
            success: true, 
            url: `https://api-video.mohamedasb.com/out/${outputName}` 
        });

    } catch (e) {
        console.error("Erreur:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.use('/out', express.static(path.resolve(__dirname, 'out')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
