const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const WebSocket = require('ws');
const cors = require('cors');
const crypto = require('crypto');

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = 'uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Store active WebSocket connections
const socketConnections = new Map();

// Generate a unique socket ID
function generateSocketId() {
  return crypto.randomBytes(16).toString('hex');
}

// Endpoint to upload the Excel file
app.post('/upload', upload.single('excelFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  console.log('Uploaded file:', req.file);

  // Generate a unique socket ID for this upload
  const socketId = generateSocketId();

  res.json({
    message: 'File uploaded successfully',
    fileName: req.file.filename,
    filePath: req.file.path,
    socketId: socketId
  });
});

// Endpoint to process the uploaded Excel file
app.post('/process', (req, res) => {
  const { fileName, socketId } = req.body;

  if (!fileName || !socketId) {
    return res.status(400).send('Missing file name or socket ID.');
  }

  const filePath = path.join(__dirname, 'uploads', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  console.log('Processing file:', filePath);

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pythonProcess = exec(`python3 auto.py "${filePath}" "${socketId}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      const ws = socketConnections.get(socketId);
      if (ws) {
        ws.send(JSON.stringify({
          progress: 0,
          message: 'Error processing file',
          error: error.message
        }));
      }
      return res.status(500).send('Error processing file');
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    res.send('File processed successfully');
  });
});

// Set up WebSocket server
const server = app.listen(3008, () => {
  console.log(`Server running at http://localhost:3008`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
  // More robust socket ID extraction
  const parts = req.url.split('/');
  const socketId = parts[parts.length - 1];
  
  if (!socketId) {
    console.log('Error: socketId not provided in the URL');
    ws.close();
    return;
  }

  console.log('Connected Socket ID:', socketId);

  // Store the WebSocket connection
  socketConnections.set(socketId, ws);

  // Send connection establishment message
  ws.send(JSON.stringify({ 
    message: 'WebSocket connection established', 
    socketId: socketId 
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  // Handle WebSocket closure
  ws.on('close', () => {
    console.log(`WebSocket connection closed for socket ID: ${socketId}`);
    socketConnections.delete(socketId);
  });
});

// Upgrade HTTP request to WebSocket
server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/progress')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();  // Reject non-WebSocket connections
  }
});

// Optional: Add a root route for basic server check
app.get('/', (req, res) => {
  res.send('PDF Generation Server is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});