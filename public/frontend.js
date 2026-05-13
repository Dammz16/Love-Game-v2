const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentTurn = null;
let currentAction = null;

// =====================
// JOIN
// =====================

document.getElementById("joinGame").onclick=()=>{

playerName = document.getElementById("playerName").value.trim();

if(!playerName){
document.getElementById("menuError").innerText="Entre ton prénom";
return;
}

ws.send(JSON.stringify({
type:"join",
name:playerName
}));

};

// =====================
// NORMAL ACTION
// =====================

document.getElementById("mainButton").onclick=()=>{

if(!currentTurn || currentTurn !== playerName){
alert("Pas ton tour");
return;
}

if(currentAction){

ws.send(JSON.stringify({
type:"complete-action"
}));

return;
}

ws.send(JSON.stringify({
type:"draw-action",
difficulty:"easy",
mode:"normal"
}));
};

// =====================
// RANDOM ACTION
// =====================

document.getElementById("randomBtn").onclick=()=>{

if(!currentTurn || currentTurn !== playerName){
alert("Pas ton tour");
return;
}

ws.send(JSON.stringify({
type:"draw-action",
mode:"random"
}));
};

// =====================
// SOCKET
// =====================

ws.onmessage=(event)=>{

const data = JSON.parse(event.data);

if(data.type==="game-start"){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

updateScores(data.players);

currentTurn = data.currentTurn;

updateTurn();
}

if(data.type==="action-drawn"){

currentAction = data.action;

document.getElementById("actionText").innerText =
data.player + " : " + data.action.name;

document.getElementById("actionPoints").innerText =
"+" + data.action.points + " pts";
}

if(data.type==="update"){

updateScores(data.players);

currentTurn = data.currentTurn;

currentAction = null;

updateTurn();
}

if(data.type==="victory"){

document.getElementById("actionText").innerText =
data.winner + " gagne 🏆";

document.getElementById("rematchBtn").style.display="block";
}

};

// =====================
// UI
// =====================

function updateScores(players){

if(players[0]){
document.getElementById("p1").innerText = players[0].points;
}

if(players[1]){
document.getElementById("p2").innerText = players[1].points;
}

}

function updateTurn(){

document.getElementById("turnBanner").innerText =
currentTurn === playerName
? "🟢 À ton tour"
: "⏳ Tour de " + currentTurn;

}
