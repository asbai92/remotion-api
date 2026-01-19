const express = require('express');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const app = express();
app.use(express.json());

app.post('/render', async (req, res) => {
    try {
        const { templateId, inputProps } = req.body;
        const outputLocation = path.join(__dirname, 'out', `video-${Date.now()}.mp4`);
        
        console.log(`Rendu lancé pour : ${templateId}`);
        // Logique de rendu ici...
        
        res.json({ success: true, message: "Rendu démarré" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => console.log('Serveur Remotion actif sur le port 3000'));
