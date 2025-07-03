const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// ✅ Save files to Desktop in "wordProcessorFiles" folder (only on your server)
const desktopPath = path.join(os.homedir(), 'Desktop', 'wordProcessorFiles');

// ✅ Create the folder if it doesn't exist
if (!fs.existsSync(desktopPath)) {
  fs.mkdirSync(desktopPath, { recursive: true });
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Save file
app.post('/api/files/save', (req, res) => {
  const { filename, content } = req.body;
  const filePath = path.join(desktopPath, filename);

  try {
    fs.writeFileSync(filePath, content);
    res.json({ message: '✅ File saved to Desktop!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to save file.' });
  }
});

// ✅ Load file
app.get('/api/files/load/:filename', (req, res) => {
  const filePath = path.join(desktopPath, req.params.filename);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.json({ content });
    } else {
      res.status(404).json({ error: '❌ File not found on Desktop.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to load file.' });
  }
});

// ✅ Update file
app.put('/api/files/update', (req, res) => {
  const { filename, content } = req.body;
  const filePath = path.join(desktopPath, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      res.json({ message: '✅ File updated on Desktop!' });
    } else {
      res.status(404).json({ error: '❌ File not found to update.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to update file.' });
  }
});

// ✅ List files
app.get('/api/files/list', (req, res) => {
  try {
    const files = fs.readdirSync(desktopPath);
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '❌ Failed to list files.' });
  }
});

// ✅ Download file (for users)
app.get('/api/files/download/:filename', (req, res) => {
  const filePath = path.join(desktopPath, req.params.filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: '❌ File not found for download.' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📂 Files will be saved to: ${desktopPath}`);
});
