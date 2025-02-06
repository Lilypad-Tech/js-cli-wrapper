const WebSocket = require('ws');

// Create WebSocket server on port 3009
const wss = new WebSocket.Server({ host: '0.0.0.0', port: 3009 });

// Store clients with unique IDs
const clients = new Map();

// Handle connections
wss.on('connection', (ws) => {
  const id = generateUniqueId();
  clients.set(id, ws);
  console.log(`New client connected: ${id}`);

  // Send welcome message with client ID
  ws.send(JSON.stringify({ type: 'welcome', id }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
    
    const parsedMessage = JSON.parse(message);
    console.log('Received:', parsedMessage);

    if (parsedMessage.type === 'direct_message') {
      const targetClient = clients.get(parsedMessage.targetId);
      if (targetClient && targetClient.readyState === WebSocket.OPEN) {
        targetClient.send(JSON.stringify({ from: id, message: parsedMessage.message }));
      }
    } else {
      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ from: id, message: parsedMessage.message }));
        }
      });
    }
    }catch(err){
      console.log(err);
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`Client disconnected: ${id}`);
  });
});

console.log('WebSocket Server running on ws://localhost:3009');

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}