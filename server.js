const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const actions = JSON.parse(fs.readFileSync('./data/actions.json'));

let rooms = {};

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function broadcastRoom(roomCode, message) {
    rooms[roomCode].players.forEach(player => {
        player.send(JSON.stringify(message));
    });
}

function nextTurn(roomCode) {
    const room = rooms[roomCode];
    room.currentTurn = (room.currentTurn + 1) % room.players.length;
}

wss.on('connection', (ws) => {

    ws.playerData = {
        name: "",
        roomCode: "",
        points: 0
    };

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        // ======================
        // CREATE ROOM
        // ======================
        if (data.type === "create-room") {
            const code = generateRoomCode();

            rooms[code] = {
                players: [ws],
                currentTurn: 0,
                mode: data.mode,
                totalPoints: 0
            };

            ws.playerData.name = data.name;
            ws.playerData.roomCode = code;

            ws.send(JSON.stringify({ type: "room-created", code }));
        }

        // ======================
        // JOIN ROOM
        // ======================
        if (data.type === "join-room") {
            const room = rooms[data.code];

            if (!room) {
                ws.send(JSON.stringify({ type: "error", message: "Salle introuvable" }));
                return;
            }

            if (room.players.length >= 2) {
                ws.send(JSON.stringify({ type: "error", message: "Salle pleine" }));
                return;
            }

            ws.playerData.name = data.name;
            ws.playerData.roomCode = data.code;

            room.players.push(ws);

            broadcastRoom(data.code, {
                type: "game-start",
                players: room.players.map(p => p.playerData.name),
                currentTurn: room.players[room.currentTurn].playerData.name
            });
        }

        // ======================
        // DRAW ACTION
        // ======================
        if (data.type === "draw-action") {
            const room = rooms[ws.playerData.roomCode];

            if (room.players[room.currentTurn] !== ws) return;

            const filtered = actions.filter(a => a.difficulty === data.difficulty);
            const action = filtered[Math.floor(Math.random() * filtered.length)];

            ws.currentAction = action;

            ws.send(JSON.stringify({
                type: "action-drawn",
                action
            }));

            broadcastRoom(ws.playerData.roomCode, {
                type: "notification",
                message: `${ws.playerData.name} a tiré une action`
            });
        }
    });

    ws.on('close', () => {
        const code = ws.playerData.roomCode;
        if (!code || !rooms[code]) return;

        rooms[code].players = rooms[code].players.filter(p => p !== ws);

        if (rooms[code].players.length === 0) {
            delete rooms[code];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));

