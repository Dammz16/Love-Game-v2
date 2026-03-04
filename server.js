const express = require('express');
const { WebSocketServer } = require('ws');
const fs = require('fs');

const app = express();
app.use(express.static('public'));

// Charger actions et cadeaux
let actions = JSON.parse(fs.readFileSync('./data/actions.json'));
let gifts = JSON.parse(fs.readFileSync('./data/gifts.json'));

// Endpoints HTTP
app.get('/api/actions', (req, res) => res.json(actions));
app.get('/api/gifts', (req, res) => res.json(gifts));

// PORT dynamique pour déploiement
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// WebSocket
const wss = new WebSocketServer({ server });
let players = [];

// Fonction pour envoyer le leaderboard à tous
function broadcastLeaderboard() {
    const leaderboard = players.map(p => ({ name: p.playerData.name, points: p.playerData.points }));
    players.forEach(p => p.send(JSON.stringify({ type: 'leaderboard', leaderboard })));
}

// Gestion des connexions
wss.on('connection', ws => {
    // Initialisation joueur
    ws.playerData = { points: 0, name: `Player${players.length + 1}` };
    players.push(ws);

    ws.send(JSON.stringify({ type: 'connected', msg: `Bienvenue ${ws.playerData.name} !` }));
    broadcastLeaderboard();

    ws.on('message', message => {
        const data = JSON.parse(message);

        switch(data.type) {
            case 'draw-action':
                const filtered = actions.filter(a => a.difficulty === data.difficulty);
                const action = filtered[Math.floor(Math.random() * filtered.length)];
            
                // Envoyer à tous les joueurs
                players.forEach(p => p.send(JSON.stringify({ type: 'action-drawn', action })));
                // Notification
                players.forEach(p => p.send(JSON.stringify({ type: 'notification', msg: `${ws.playerData.name} a tiré une action !` })));
                break;

            case 'complete-action':
                ws.playerData.points += data.points;
                ws.send(JSON.stringify({ type: 'points-updated', points: ws.playerData.points }));
                // Notification globale
                players.forEach(p => p.send(JSON.stringify({ type: 'notification', msg: `${ws.playerData.name} a complété une action et gagné ${data.points} points !` })));
                broadcastLeaderboard();
                break;

            case 'buy-gift':
                const gift = gifts.find(g => g.id === data.giftId);
                if (gift && ws.playerData.points >= gift.cost) {
                    ws.playerData.points -= gift.cost;
                    ws.send(JSON.stringify({ type: 'gift-bought', gift, points: ws.playerData.points }));
                    players.forEach(p => p.send(JSON.stringify({ type: 'notification', msg: `${ws.playerData.name} a acheté ${gift.name} !` })));
                } else {
                    ws.send(JSON.stringify({ type: 'gift-failed', msg: "Pas assez de points !" }));
                }
                broadcastLeaderboard();
                break;

            case 'set-name':
                ws.playerData.name = data.name || ws.playerData.name;
                broadcastLeaderboard();
                break;
        }
    });

    ws.on('close', () => {
        players = players.filter(p => p !== ws);
        broadcastLeaderboard();
    });

});
