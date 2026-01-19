const express = require('express');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// CONFIGURATION DU CHEMIN
const bundlePath = path.resolve(__dirname, 'build', 'bundle.js');
const outDir = path.resolve(__dirname, 'out');

if (!fs.existsSync(outDir)) {
    console.log(`[INIT] Création du dossier de sortie : ${outDir}`);
    fs.mkdirSync(outDir, { recursive: true });
}

app.post('/render', async (req, res) => {
    const requestId = Date.now();
    console.log(`[${requestId}] REQUÊTE REÇUE :`, JSON.stringify(req.body));

    try {
        const { id, inputProps } = req.body;
        const compId = id || 'HelloWorld';

        // 1. Vérification du bundle
        console.log(`[${requestId}] ÉTAPE 1 : Vérification du bundle à ${bundlePath}`);
        if (!fs.existsSync(bundlePath)) {
            console.error(`[${requestId}] ERREUR : Bundle introuvable !`);
            return res.status(500).json({ 
                error: "Bundle introuvable", 
                pathChecked: bundlePath,
                filesInApp: fs.readdirSync(__dirname) // Aide à voir ce qui existe à la racine
            });
        }
        console.log(`[${requestId}] SUCCESS : Bundle détecté.`);

        // 2. Sélection de la composition
        console.log(`[${requestId}] ÉTAPE 2 : Sélection de la composition '${compId}'`);
        const composition = await selectComposition({
            bundle: bundlePath,
            id: compId,
            inputProps: inputProps || {},
        });
        console.log(`[${requestId}] SUCCESS : Composition chargée.`);

        // 3. Préparation du rendu
        const outputName = `video-${requestId}.mp4`;
        const outputLocation = path.join(outDir, outputName);
        console.log(`[${requestId}] ÉTAPE 3 : Lancement du rendu vers ${outputLocation}`);

        // 4. Rendu média
        await renderMedia({
            composition,
            serveUrl: bundlePath,
            codec: 'h264',
            outputLocation: outputLocation,
            chromiumOptions: {
                executablePath: process.env.REMOTION_CHROME_EXECUTABLE || '/usr/bin/chromium',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            onProgress: ({ progress }) => {
                // Log de progression toutes les 25% pour ne pas surcharger les logs
                if ((progress * 100) % 25 === 0) {
                    console.log(`[${requestId}] PROGRESSION : ${Math.round(progress * 100)}%`);
                }
            }
        });

        console.log(`[${requestId}] ÉTAPE 4 : Rendu terminé avec succès.`);
        
        res.json({ 
            success: true, 
            url: `https://api-video.mohamedasb.com/out/${outputName}`,
            requestId: requestId 
        });

    } catch (e) {
        console.error(`[${requestId}] ERREUR CRITIQUE durant le rendu :`, e.stack);
        res.status(500).json({ 
            error: e.message, 
            stack: e.stack,
            requestId: requestId 
        });
    }
});

// Route de debug pour voir le contenu du dossier build à tout moment
app.get('/debug-build', (req, res) => {
    const buildFolder = path.join(__dirname, 'build');
    if (fs.existsSync(buildFolder)) {
        res.json({ folder: 'build', files: fs.readdirSync(buildFolder) });
    } else {
        res.json({ error: 'Dossier build inexistant' });
    }
});

app.use('/out', express.static(outDir));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`---------------------------------------------------`);
    console.log(`SERVEUR ACTIF SUR PORT ${PORT}`);
    console.log(`Bundle attendu : ${bundlePath}`);
    console.log(`Dossier sortie : ${outDir}`);
    console.log(`---------------------------------------------------`);
});
