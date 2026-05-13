// public/frontend.js

const ws = new WebSocket(
location.origin.replace(/^http/, 'ws')
);

let playerName = "";
let currentTurn = "";

let selectedDifficulty = "easy";

let currentAction = null;

document
.querySelectorAll(".difficultyBtn")
.forEach(btn=>{

btn.onclick=()=>{

document
.querySelectorAll(".difficultyBtn")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

selectedDifficulty = btn.dataset.difficulty;

};

});

/* JOIN */

document.getElementById("joinGame").onclick=()=>{

playerName =
document
.getElementById("playerName")
.value
.trim();

if(!playerName){

document.getElementById("menuError")
.innerText="Entre ton prénom";

return;
}

document.getElementById("joinGame")
.disabled=true;

document.getElementById("menuError")
.innerText="En attente de l’autre joueur...";

ws.send(JSON.stringify({
type:"join",
name:playerName
}));

};

/* MAIN BUTTON */

document.getElementById("mainButton").onclick=()=>{

if(currentTurn!==playerName){

showNotification("Ce n'est pas ton tour");

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
difficulty:selectedDifficulty
}));

};

/* REMATCH */

document.getElementById("rematchBtn").onclick=()=>{

ws.send(JSON.stringify({
type:"rematch"
}));

};

/* SOCKET */

ws.onmessage=(event)=>{

const data = JSON.parse(event.data);

/* GAME START */

if(data.type==="game-start"){

document.getElementById("menu")
.style.display="none";

document.getElementById("game")
.style.display="block";

updateScores(data.players);

currentTurn=data.currentTurn;

updateTurn();

resetCard();

document.getElementById("mainButton")
.disabled=false;

document.getElementById("mainButton")
.innerText="Découvrir le défi";

document.getElementById("rematchBtn")
.style.display="none";

currentAction=null;

}

/* ACTION DRAWN */

if(data.type==="action-drawn"){

currentAction=data.action;

const badge=
document.getElementById("difficultyBadge");

if(selectedDifficulty==="easy")
badge.innerText="🟢 Soft";

if(selectedDifficulty==="medium")
badge.innerText="🟠 Medium";

if(selectedDifficulty==="hard")
badge.innerText="🔴 Hard";

document.getElementById("actionText")
.innerText=
data.player+
" doit "+
data.action.name;

document.getElementById("actionPoints")
.innerText=
"+"+
data.action.points+
" pts";

document.getElementById("mainButton")
.innerText="Défi terminé";

}

/* UPDATE */

if(data.type==="update"){

updateScores(data.players);

currentTurn=data.currentTurn;

updateTurn();

resetCard();

currentAction=null;

document.getElementById("mainButton")
.innerText="Découvrir le défi";

}

/* VICTORY */

if(data.type==="victory"){

document.getElementById("actionText")
.innerText=
data.winner+
" a gagné 🏆";

document.getElementById("actionPoints")
.innerText="";

document.getElementById("difficultyBadge")
.innerText="Victoire";

document.getElementById("mainButton")
.disabled=true;

document.getElementById("rematchBtn")
.style.display="block";

}

/* DISCONNECTED */

if(data.type==="player-disconnected"){

showNotification("⚠️ Joueur déconnecté");

document.getElementById("mainButton")
.disabled=true;

}

};

/* FUNCTIONS */

function updateScores(players){

if(players[0]){

document.getElementById("player1Name")
.innerText=players[0].name;

document.getElementById("player1Points")
.innerText=players[0].points;

}

if(players[1]){

document.getElementById("player2Name")
.innerText=players[1].name;

document.getElementById("player2Points")
.innerText=players[1].points;

}

}

function updateTurn(){

const banner=
document.getElementById("turnBanner");

banner.classList.remove("myTurn");

if(currentTurn===playerName){

banner.innerText="🟢 À ton tour";

banner.classList.add("myTurn");

}else{

banner.innerText=
"⏳ Tour de "+
currentTurn;

}

}

function resetCard(){

document.getElementById("difficultyBadge")
.innerText="Choisis une difficulté";

document.getElementById("actionText")
.innerText=
"Prêt à découvrir ton défi ?";

document.getElementById("actionPoints")
.innerText="";

}

function showNotification(message){

const notif=
document.getElementById("notification");

notif.innerText=message;

notif.classList.add("show");

setTimeout(()=>{

notif.classList.remove("show");

},2500);

}
