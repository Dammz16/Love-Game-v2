const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentTurn = "";
let selectedDifficulty = "easy";
let currentAction = null;

// =====================
// DIFFICULTY
// =====================

document.querySelectorAll(".difficultyBtn").forEach(btn=>{
btn.onclick=()=>{

document.querySelectorAll(".difficultyBtn")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

selectedDifficulty = btn.dataset.difficulty;

};
});

// =====================
// JOIN + CATEGORIES
// =====================

document.getElementById("joinGame").onclick=()=>{

playerName = document.getElementById("playerName").value.trim();

if(!playerName){
document.getElementById("menuError").innerText="Entre ton prénom";
return;
}

// collect categories
let selected = [];

document.querySelectorAll("#categories input:checked")
.forEach(cb=>{
selected.push(cb.value);
});

// send categories first
ws.send(JSON.stringify({
type:"set-categories",
categories:selected
}));

// join game
ws.send(JSON.stringify({
type:"join",
name:playerName
}));

document.getElementById("joinGame").disabled=true;
document.getElementById("menuError").innerText="En attente joueur...";
};

// =====================
// NORMAL ACTION
// =====================

document.getElementById("mainButton").onclick=()=>{

if(currentTurn !== playerName){
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
difficulty:selectedDifficulty,
mode:"normal"
}));
};

// =====================
// RANDOM BUTTON
// =====================

document.getElementById("randomBtn").onclick=()=>{

if(currentTurn !== playerName){
alert("Pas ton tour");
return;
}

ws.send(JSON.stringify({
type:"draw-action",
mode:"random"
}));
};

// =====================
// REMATCH
// =====================

document.getElementById("rematchBtn").onclick=()=>{

ws.send(JSON.stringify({
type:"rematch"
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
updateTurn();

currentAction = null;
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
document.getElementById("player1Name").innerText = players[0].name;
document.getElementById("player1Points").innerText = players[0].points;
}

if(players[1]){
document.getElementById("player2Name").innerText = players[1].name;
document.getElementById("player2Points").innerText = players[1].points;
}

}

function updateTurn(){

document.getElementById("turnBanner").innerText =
currentTurn === playerName
? "🟢 À ton tour"
: "⏳ Tour de " + currentTurn;

}
