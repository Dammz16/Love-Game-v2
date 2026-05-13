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
// CATEGORIES CONFIRM
// =====================

document.getElementById("confirmCategories").onclick=()=>{

let selected = [];

document.querySelectorAll("#categoryScreen input:checked")
.forEach(cb=>{
selected.push(cb.value);
});

ws.send(JSON.stringify({
type:"set-categories",
categories:selected
}));

document.getElementById("categoryScreen").style.display="none";
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

// START ROOM
if(data.type==="game-start"){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

if(data.needCategories){
document.getElementById("categoryScreen").style.display="block";
}

};

// CATEGORIES CONFIRMED
if(data.type==="categories-confirmed"){

currentTurn = data.currentTurn;

};

// ACTION
if(data.type==="action-drawn"){

currentAction = data.action;

document.getElementById("actionText").innerText =
data.player + " : " + data.action.name;

document.getElementById("actionPoints").innerText =
"+" + data.action.points + " pts";

};

// UPDATE
if(data.type==="update"){

currentTurn = data.currentTurn;
currentAction = null;

};

// VICTORY
if(data.type==="victory"){

document.getElementById("actionText").innerText =
data.winner + " gagne 🏆";

document.getElementById("rematchBtn").style.display="block";

};

// REMATCH
if(data.type==="game-start" && !data.needCategories){

document.getElementById("rematchBtn").style.display="none";

};

};
