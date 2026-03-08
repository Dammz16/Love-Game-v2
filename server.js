const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const actions = JSON.parse(fs.readFileSync('./data/actions.json'));

// Tableau de joueurs : { name, ws, points, currentAction }
let players = [];
let currentTurn = 0;

function broadcast(message) {
    players.forEach(p => {
        if (p.ws && p.ws.readyState === 1) {
            p.ws.send(JSON.stringify(message));
        }
    });
}

function nextTurn() {
    currentTurn = (currentTurn + 1) % players.length;
}

wss.on('connection', (ws) => {

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);

        // ===== JOIN GAME =====
        if (data.type === "join") {

            let existing = players.find(p => p.name === data.name);

            if (existing) {
                // Reconnexion
                existing.ws = ws;
                ws.playerData = { name: existing.name, points: existing.points };
            } else {
                if (players.length >= 2) {
                    ws.send(JSON.stringify({ type: "error", message: "La partie est pleine" }));
                    return;
                }
                ws.playerData = { name: data.name, points: 0 };
                players.push({ name: data.name, ws, points: 0, currentAction: null });
            }

            if (players.length === 2) {
                broadcast({
                    type: "game-start",
                    players: players.map(p => ({ name: p.name, points: p.points })),
                    currentTurn: players[currentTurn].name
                });
            }
        }

        // ===== DRAW ACTION =====
        if (data.type === "draw-action") {
            const playerObj = players.find(p => p.ws === ws);
            if (!playerObj || players[currentTurn].ws !== ws) return;

            const filtered = actions.filter(a => a.difficulty === data.difficulty);
            const action = filtered[Math.floor(Math.random() * filtered.length)];

            playerObj.currentAction = action;

            broadcast({
                type: "action-drawn",
                player: playerObj.name,
                action: action
            });

            broadcast({
                type: "notification",
                message: `${playerObj.name} a tiré une action`
            });
        }

        // ===== COMPLETE ACTION =====
        if (data.type === "complete-action") {
            const playerObj = players.find(p => p.ws === ws);
            if (!playerObj || !playerObj.currentAction) return;

            playerObj.points += playerObj.currentAction.points;
            playerObj.currentAction = null;

            // Vérifier victoire
            if (playerObj.points >= 125) {
                broadcast({
                    type: "victory",
                    winner: playerObj.name,
                    players: players.map(p => ({ name: p.name, points: p.points }))
                });
                return;
            }

            nextTurn();

            broadcast({
                type: "update",
                players: players.map(p => ({ name: p.name, points: p.points })),
                currentTurn: players[currentTurn].name,
                clearAction: true,
                notification: `À ton tour, ${players[currentTurn].name} !`
            });
        }
    });

    ws.on('close', () => {
        players.forEach(p => {
            if (p.ws === ws) p.ws = null;
        });
        if (players.filter(p => p.ws !== null).length === 0) currentTurn = 0;
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
