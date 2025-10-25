const express = require('express');
const router = express.Router();
const crypto = require('crypto');

router.post('/hash', (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const hash = crypto.createHash('md5')
                      .update(text)
                      .digest('hex');

    res.json({ hash });
});

module.exports = router;