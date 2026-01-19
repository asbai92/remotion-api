const express = require('express');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// CONFIGURATION DES CHEMINS (Utilisation de path.resolve pour garantir le serveUrl)
const bundlePath = path.resolve(__dirname, 'build', 'bundle.js');
const outDir = path.resolve(__dirname, 'out');

// Initialisation du dossier de sortie
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

        // 1. Vérification physique du fichier (Indispensable pour le serveUrl)
        if (!fs.existsSync(bundlePath)) {
            console.error(`[${requestId}] ERREUR : Le bundle est introuvable à ${bundlePath}`);
            return res.status(500).json({ error: "Le fichier bundle.js n'existe pas dans le dossier build." });
        }

        // 2. Sélection de la composition
        // On passe 'bundlePath' comme paramètre 'bundle' (équivalent du serveUrl)
        console.log(`[${requestId}] ÉTAPE 2 : Chargement de la composition '${compId}'`);
        const composition = await selectComposition({
            bundle: bundlePath, 
            id: compId,
            inputProps: inputProps || {},
        });
        console.log(`[${requestId}] SUCCESS : Composition chargée.`);

        // 3. Préparation du rendu
        const outputName = `video-${requestId}.mp4`;
        const outputLocation = path.join(outDir, outputName);

        // 4. Rendu média (Utilisation stricte du serveUrl comme dans la doc)
        console.log(`[${requestId}] ÉTAPE 3 : Lancement du rendu...`);
        await renderMedia({
            composition,
            serveUrl: bundlePath, // <-- C'est ici que la doc insiste
            codec: 'h264',
            outputLocation: outputLocation,
            inputProps: inputProps || {},
            chromiumOptions: {
                // On laisse Remotion gérer le binaire installé par 'npx remotion browser install'
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            },
            onProgress: ({ progress }) => {
                console.log(`[${requestId}] PROGRESSION : ${Math.round(progress * 100)}%`);
            }
        });

        console.log(`[${requestId}] ÉTAPE 4 : Vidéo générée avec succès.`);
        
        res.json({ 
            success: true, 
            url: `https://api-video.mohamedasb.com/out/${outputName}`,
            requestId: requestId 
        });

    } catch (e) {
        console.error(`[${requestId}] ERREUR CRITIQUE :`, e.message);
        res.status(500).json({ 
            error: e.message, 
            stack: e.stack,
            suggestion: "Vérifiez que les dépendances Linux sont bien installées dans le Dockerfile."
        });
    }
});

app.use('/out', express.static(outDir));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`---------------------------------------------------`);
    console.log(`SERVEUR REMOTION PRÊT`);
    console.log(`ServeUrl (Bundle) : ${bundlePath}`);
    console.log(`---------------------------------------------------`);
});
