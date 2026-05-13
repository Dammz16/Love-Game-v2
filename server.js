const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const victoryScore = 125;

const actions = JSON.parse(
fs.readFileSync("./data/actions.json")
);

// ======================
// STATE GLOBAL
// ======================

let players = [];
let gameStarted = false;
let currentTurn = null;
let history = [];
let lastActions = [];
let rematchVotes = 0;

// ======================
// UTILS
// ======================

function broadcast(data){
wss.clients.forEach(client=>{
if(client.readyState === WebSocket.OPEN){
client.send(JSON.stringify(data));
}
});
}

function getPlayer(ws){
return players.find(p => p.ws === ws);
}

// évite répétition des actions
function drawAction(list){

let action;

do {
action = list[Math.floor(Math.random() * list.length)];
}
while(lastActions.includes(action.name));

lastActions.push(action.name);

if(lastActions.length > 3){
lastActions.shift();
}

return action;
}

// ======================
// CONNECTION
// ======================

wss.on("connection",(ws)=>{

ws.on("message",(message)=>{

const data = JSON.parse(message);

// ======================
// JOIN GAME
// ======================

if(data.type === "join"){

const existing = players.find(p => p.name === data.name);

// reconnexion simple
if(existing){
existing.ws = ws;
return;
}

if(players.length >= 2){
ws.send(JSON.stringify({
type:"error",
message:"Partie pleine"
}));
return;
}

players.push({
name:data.name,
points:0,
ws
});

// démarrage partie
if(players.length === 2 && !gameStarted){

gameStarted = true;
currentTurn = players[0].name;

broadcast({
type:"game-start",
players,
currentTurn
});

}

}

// ======================
// DRAW ACTION
// ======================

if(data.type === "draw-action"){

const player = getPlayer(ws);
if(!player) return;

if(currentTurn !== player.name) return;

const actionList = actions[data.difficulty];
if(!actionList) return;

const action = drawAction(actionList);

ws.currentAction = action;

broadcast({
type:"action-drawn",
player:player.name,
action
});

}

// ======================
// COMPLETE ACTION
// ======================

if(data.type === "complete-action"){

const player = getPlayer(ws);
if(!player) return;

if(!ws.currentAction) return;

player.points += ws.currentAction.points;

history.push(
player.name + " : " + ws.currentAction.name
);

// victoire
if(player.points >= victoryScore){

broadcast({
type:"victory",
winner:player.name
});

return;
}

// switch turn
const otherPlayer = players.find(p => p.name !== player.name);

if(otherPlayer){
currentTurn = otherPlayer.name;
}

broadcast({
type:"update",
players,
currentTurn,
history
});

ws.currentAction = null;

}

// ======================
// REMATCH
// ======================

if(data.type === "rematch"){

rematchVotes++;

if(rematchVotes === 2){

players.forEach(p => {
p.points = 0;
});

history = [];
lastActions = [];
gameStarted = true;

currentTurn = players[0].name;

broadcast({
type:"game-start",
players,
currentTurn
});

rematchVotes = 0;
}

}

});

// ======================
// DISCONNECT
// ======================

ws.on("close",()=>{

const player = getPlayer(ws);

if(!player) return;

// remove player
players = players.filter(p => p.ws !== ws);

// reset state
gameStarted = false;
currentTurn = null;
rematchVotes = 0;

broadcast({
type:"player-disconnected"
});

});

});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{
console.log("Server running on port " + PORT);
});
