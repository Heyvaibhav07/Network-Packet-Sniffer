import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  // Packet Simulation Logic
  const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS', 'TLS', 'SSH', 'FTP'];
  const ips = [
    '192.168.1.1', '192.168.1.15', '10.0.0.5', '172.16.0.10',
    '8.8.8.8', '1.1.1.1', '142.250.190.46', '31.13.71.36'
  ];
  const ports = [80, 443, 22, 53, 3000, 8080, 5000, 21];

  const generatePacket = () => {
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const srcIp = ips[Math.floor(Math.random() * ips.length)];
    let dstIp = ips[Math.floor(Math.random() * ips.length)];
    while (dstIp === srcIp) dstIp = ips[Math.floor(Math.random() * ips.length)];

    const srcPort = Math.floor(Math.random() * 65535);
    const dstPort = ports[Math.floor(Math.random() * ports.length)];
    const size = Math.floor(Math.random() * 1500) + 40;
    
    // Simulate potential threats
    let threat = null;
    const rand = Math.random();
    if (rand < 0.02) {
      threat = { type: 'Port Scan', severity: 'medium', description: 'Sequential port probing detected from ' + srcIp };
    } else if (rand < 0.03) {
      threat = { type: 'SYN Flood', severity: 'high', description: 'High volume of SYN packets from ' + srcIp };
    } else if (rand < 0.035) {
      threat = { type: 'Data Exfiltration', severity: 'critical', description: 'Unusual outbound data volume to ' + dstIp };
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      protocol,
      srcIp,
      dstIp,
      srcPort,
      dstPort,
      size,
      info: getProtocolInfo(protocol, dstPort),
      threat
    };
  };

  const getProtocolInfo = (proto: string, port: number) => {
    switch (proto) {
      case 'HTTP': return `GET /api/v1/resource HTTP/1.1`;
      case 'DNS': return `Standard query 0x1234 A google.com`;
      case 'TCP': return `[SYN] Seq=0 Win=64240 Len=0 MSS=1460`;
      case 'TLS': return `Client Hello, Version: TLS 1.2`;
      default: return `Data transfer on port ${port}`;
    }
  };

  // Broadcast packets to all clients
  setInterval(() => {
    const packet = generatePacket();
    const message = JSON.stringify({ type: 'PACKET', data: packet });
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, 500); // Send a packet every 500ms

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
