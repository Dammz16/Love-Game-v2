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
// STATE
// ======================

let players = [];
let gameStarted = false;

let currentTurn = null;

let history = [];

let lastActions = [];

let rematchVotes = 0;

let selectedCategories = [];

let categoriesLocked = false;

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
// JOIN
// ======================

if(data.type === "join"){

const existing = players.find(p => p.name === data.name);

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

// START ROOM (mais pas jeu)
if(players.length === 2){

gameStarted = true;

broadcast({
type:"game-start",
players,
currentTurn:null,
needCategories:true
});

}

}

// ======================
// SET CATEGORIES (PHASE 2)
// ======================

if(data.type === "set-categories"){

selectedCategories = data.categories || [];
categoriesLocked = true;

currentTurn = players[0].name;

broadcast({
type:"categories-confirmed",
categories:selectedCategories,
currentTurn
});
}

// ======================
// DRAW ACTION
// ======================

if(data.type === "draw-action"){

const player = getPlayer(ws);
if(!player) return;

if(!categoriesLocked) return;

if(currentTurn !== player.name) return;

/* 🔥 RANDOM MODE */
if(data.mode === "random"){

const allActions = [];

selectedCategories.forEach(cat=>{
if(actions[cat]){
allActions.push(...actions[cat]);
}
});

if(allActions.length === 0) return;

const action = drawAction(allActions);

action.points = action.points * 2;

ws.currentAction = action;

broadcast({
type:"action-drawn",
player:player.name,
action,
mode:"random"
});

return;
}

/* 🟢 NORMAL MODE */
let pool = [];

selectedCategories.forEach(cat=>{
if(actions[cat]){
pool.push(...actions[cat]);
}
});

if(pool.length === 0) return;

const action = drawAction(pool);

ws.currentAction = action;

broadcast({
type:"action-drawn",
player:player.name,
action,
mode:"normal"
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

if(player.points >= victoryScore){

broadcast({
type:"victory",
winner:player.name
});

return;
}

const other = players.find(p => p.name !== player.name);

if(other){
currentTurn = other.name;
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

players.forEach(p => p.points = 0);

history = [];
lastActions = [];

categoriesLocked = false;

selectedCategories = [];

currentTurn = null;

broadcast({
type:"game-start",
players,
currentTurn:null,
needCategories:true
});

rematchVotes = 0;
}
}

});

ws.on("close",()=>{

players = players.filter(p => p.ws !== ws);

gameStarted = false;

categoriesLocked = false;

selectedCategories = [];

currentTurn = null;

rematchVotes = 0;

broadcast({
type:"player-disconnected"
});

});

});

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{
console.log("Server running on port " + PORT);
});
