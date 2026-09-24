const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const chatHandler = require('./api/chat');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

app.post('/api/chat', chatHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Wariqa API is running'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Wariqa app running at http://localhost:${port}`);
});
