const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let clients = [];

app.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);
  req.on('close', () => clients = clients.filter(c => c !== res));
});

function broadcast(line) {
  clients.forEach(res => res.write(`data: ${line}\n\n`));
}

app.post('/generate', async (req, res) => {
  const { username, password } = req.body;

  const script = spawn('node', ['generate.js', username, password]);

  let base64Buffer = '';

  script.stdout.on('data', data => {
    const msg = data.toString();
    if (msg.startsWith('PDF_BASE64_START')) {
      base64Buffer += msg.replace('PDF_BASE64_START', '');
    } else if (msg.startsWith('PDF_BASE64_CONT')) {
      base64Buffer += msg.replace('PDF_BASE64_CONT', '');
    } else {
      broadcast(msg);
    }
  });

  script.stderr.on('data', data => {
    broadcast('❌ Error: ' + data.toString());
  });

  script.on('close', () => {
    res.json({ base64Pdf: base64Buffer });
  });
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
