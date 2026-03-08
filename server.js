const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const actions = JSON.parse(fs.readFileSync('./data/actions.json'));

let players = [];
let currentTurn = 0;

function broadcast(message) {
    players.forEach(p => p.send(JSON.stringify(message)));
}

function nextTurn() {
    currentTurn = (currentTurn + 1) % players.length;
}

wss.on('connection', (ws) => {

    ws.playerData = {
        name: "",
        points: 0
    };

    ws.on('message', (msg) => {

        const data = JSON.parse(msg);

        // ===== JOIN GAME =====
        if (data.type === "join") {

            if (players.length >= 2) {
                ws.send(JSON.stringify({ type: "error", message: "La partie est pleine" }));
                return;
            }

            ws.playerData.name = data.name;
            players.push(ws);

            if (players.length === 2) {

                broadcast({
                    type: "game-start",
                    players: players.map(p => ({
                        name: p.playerData.name,
                        points: p.playerData.points
                    })),
                    currentTurn: players[currentTurn].playerData.name
                });

            }

        }

        // ===== DRAW ACTION =====
        if (data.type === "draw-action") {

            if (players[currentTurn] !== ws) return;

            const filtered = actions.filter(a => a.difficulty === data.difficulty);
            const action = filtered[Math.floor(Math.random() * filtered.length)];

            ws.currentAction = action;

            ws.send(JSON.stringify({
                type: "action-drawn",
                action
            }));

            broadcast({
                type: "notification",
                message: `${ws.playerData.name} a tiré une action`
            });

        }

        // ===== COMPLETE ACTION =====
        if (data.type === "complete-action") {

            if (!ws.currentAction) return;

            ws.playerData.points += ws.currentAction.points;
            ws.currentAction = null;

            nextTurn();

            broadcast({
                type: "update",
                players: players.map(p => ({
                    name: p.playerData.name,
                    points: p.playerData.points
                })),
                currentTurn: players[currentTurn].playerData.name
            });

        }

    });

    ws.on('close', () => {

        players = players.filter(p => p !== ws);

        if (players.length === 0) {
            currentTurn = 0;
        }

    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
