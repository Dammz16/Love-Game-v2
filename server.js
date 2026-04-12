const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const victoryScore = 125;

// Charger les actions depuis le fichier JSON
const actions = JSON.parse(
  fs.readFileSync("./data/actions.json")
);

let players = [];
let currentTurn = null;
let history = [];
let lastActions = [];
let rematchVotes = 0;

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Empêche les 3 dernières actions de revenir
function drawAction(list) {

  let action;

  do {
    action = list[Math.floor(Math.random() * list.length)];
  }
  while (lastActions.includes(action.name));

  lastActions.push(action.name);

  if (lastActions.length > 3)
    lastActions.shift();

  return action;
}

wss.on("connection", (ws) => {

  ws.on("message", (message) => {

    const data = JSON.parse(message);

    // JOIN GAME
    if (data.type === "join") {

      if (players.length >= 2) {
        ws.send(JSON.stringify({
          type: "error",
          message: "La partie est pleine"
        }));
        return;
      }

      players.push({
        name: data.name,
        points: 0,
        ws
      });

      if (players.length === 2) {

        currentTurn = players[0].name;

        broadcast({
          type: "game-start",
          players,
          currentTurn
        });

      }

    }

    // DRAW ACTION
    if (data.type === "draw-action") {

      const player = players.find(p => p.ws === ws);

      if (!player || currentTurn !== player.name) return;

      const actionList = actions[data.difficulty];

      if (!actionList) return;

      const action = drawAction(actionList);

      ws.currentAction = action;

      broadcast({
        type: "action-drawn",
        player: currentTurn,
        action
      });

    }

    // COMPLETE ACTION
    if (data.type === "complete-action") {

      const player = players.find(p => p.ws === ws);

      if (!player || !ws.currentAction) return;

      player.points += ws.currentAction.points;

      history.push(
        `${player.name} : ${ws.currentAction.name} (+${ws.currentAction.points})`
      );

      // Victoire
      if (player.points >= victoryScore) {

        broadcast({
          type: "victory",
          winner: player.name
        });

        return;
      }

      // Changer de joueur
      const otherPlayer = players.find(p => p.name !== player.name);

      if (otherPlayer)
        currentTurn = otherPlayer.name;

      broadcast({
        type: "update",
        players,
        currentTurn,
        history
      });

      ws.currentAction = null;

    }

    // REMATCH
    if (data.type === "rematch") {

      rematchVotes++;

      if (rematchVotes === 2) {

        players.forEach(p => p.points = 0);

        history = [];
        lastActions = [];

        currentTurn = players[0].name;

        broadcast({
          type: "game-start",
          players,
          currentTurn
        });

        rematchVotes = 0;
      }

    }

  });

  // DECONNEXION
  ws.on("close", () => {

    players = players.filter(p => p.ws !== ws);

    broadcast({
      type: "player-disconnected"
    });

    if (players.length === 0) {
      history = [];
      lastActions = [];
      currentTurn = null;
    }

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
