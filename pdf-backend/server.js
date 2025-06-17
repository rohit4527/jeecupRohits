const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let clients = [];

app.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

function broadcastLog(line) {
  clients.forEach(res => res.write(`data: ${line}\n\n`));
}

app.post('/generate', async (req, res) => {
  const { username, password } = req.body;

  const script = spawn('node', ['generate.js', username, password]);

  script.stdout.on('data', data => {
    broadcastLog(data.toString());
  });

  script.stderr.on('data', data => {
    broadcastLog('❌ Error: ' + data.toString());
  });

  script.on('close', async () => {
    if (fs.existsSync('final-output.pdf')) {
      const pdfData = fs.readFileSync('final-output.pdf');
      fs.unlinkSync('final-output.pdf'); // clean up
      res.json({ base64Pdf: pdfData.toString('base64') });
    } else {
      res.status(500).json({ error: 'PDF generation failed' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
