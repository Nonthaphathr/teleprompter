// index.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // อนุญาตให้เชื่อมต่อข้ามโดเมนได้

const server = http.createServer(app);

// ตั้งค่า Socket.IO ให้ยอมรับการเชื่อมต่อจากทุกที่ (CORS)
// เพราะ Frontend ของคุณจะอยู่ที่ GitHub Pages แต่ Backend อยู่ที่ Render
const io = new Server(server, {
    cors: {
        origin: "*", // ใน Production จริงควรเปลี่ยนเป็น URL ของ GitHub Page คุณ
        methods: ["GET", "POST"]
    }
});

// Route สำหรับตรวจสอบว่า Server ทำงานอยู่หรือไม่
app.get('/', (req, res) => {
    res.send('Teleprompter Backend is Running! 🚀');
});

// เมื่อมีการเชื่อมต่อ WebSocket เข้ามา
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. Event: เข้าร่วมห้อง (Session)
    // ทั้งหน้าจอ Prompter และ Remote ต้องส่ง event นี้มาพร้อมรหัสห้องเดียวกัน
    socket.on('join-session', (sessionId) => {
        socket.join(sessionId);
        console.log(`User ${socket.id} joined session: ${sessionId}`);
    });

    // 2. Event: รับคำสั่งควบคุม (จาก Remote)
    socket.on('send-command', (data) => {
        // data ควรประกอบด้วย { sessionId: 'xyz', command: 'play', value: ... }
        const { sessionId, command, value } = data;
        
        console.log(`Command '${command}' to session '${sessionId}'`);

        // ส่งคำสั่งต่อไปยังทุกคนในห้องนั้น (รวมถึง Prompter)
        // .to(sessionId) คือส่งเฉพาะกลุ่มห้องนั้น ไม่ส่งไปห้องอื่น
        // .emit('receive-command', ...) คือชื่อ event ที่ฝั่ง Prompter ต้องรอรับ
        io.to(sessionId).emit('receive-command', { command, value });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// ใช้ process.env.PORT สำหรับ Server จริง (Render) หรือ 3000 สำหรับเครื่องตัวเอง
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
