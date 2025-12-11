// index.js (Backend)

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('Teleprompter Backend Ready!');
});

// ตัวแปรเก็บจำนวนผู้เข้าชม (จะรีเซ็ตเมื่อ Server ดับ/Restart)
let totalVisitors = 0;

io.on('connection', (socket) => {
    // เมื่อมีคน connect เข้ามา เพิ่มยอดทันที
    totalVisitors++;
    console.log(`User connected. Total: ${totalVisitors}`);
    
    // ส่งยอดปัจจุบันกลับไปบอกทุกคน
    io.emit('update-visitor', totalVisitors);

    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
    });

    socket.on('send-command', (data) => {
        const { sessionId, command, value } = data;
        io.to(sessionId).emit('receive-command', { command, value });
    });

    socket.on('disconnect', () => {
        // (Optional) ถ้าอยากให้นับเฉพาะคนออนไลน์ปัจจุบัน ให้ใส่ totalVisitors-- ตรงนี้
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
