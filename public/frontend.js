const ws = new WebSocket(
location.origin.replace(/^http/, 'ws')
);

let playerName = "";
let currentTurn = "";
let selectedDifficulty = "easy";
let mode = "normal";
let currentAction = null;

/* DIFFICULTY BUTTONS */
document.querySelectorAll(".difficultyBtn").forEach(btn=>{
btn.onclick=()=>{

document.querySelectorAll(".difficultyBtn")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

selectedDifficulty = btn.dataset.difficulty;
mode = "normal";

};
});

/* RANDOM MODE */
document.getElementById("randomBtn").onclick = () => {
mode = "random";
showNotification("🎲 Mode Random activé (x2)");
};

/* JOIN */
document.getElementById("joinGame").onclick=()=>{

playerName =
document.getElementById("playerName").value.trim();

if(!playerName){
document.getElementById("menuError").innerText="Entre ton prénom";
return;
}

document.getElementById("joinGame").disabled=true;

document.getElementById("menuError").innerText="En attente de l’autre joueur...";

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
difficulty:selectedDifficulty,
mode:mode
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

/* START */
if(data.type==="game-start"){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

updateScores(data.players);

currentTurn=data.currentTurn;

updateTurn();

resetCard();

document.getElementById("mainButton").innerText="Découvrir le défi";

document.getElementById("rematchBtn").style.display="none";

currentAction=null;
}

/* ACTION */
if(data.type==="action-drawn"){

currentAction=data.action;

document.getElementById("difficultyBadge").innerText =
data.mode==="random"
? "🎲 RANDOM x2"
: "Mode normal";

document.getElementById("actionText").innerText =
data.player + " doit " + data.action.name;

document.getElementById("actionPoints").innerText =
"+" + data.action.points + " pts";

document.getElementById("mainButton").innerText="Défi terminé";
}

/* UPDATE */
if(data.type==="update"){

updateScores(data.players);
currentTurn=data.currentTurn;
updateTurn();

resetCard();
currentAction=null;

document.getElementById("mainButton").innerText="Découvrir le défi";
}

/* VICTORY */
if(data.type==="victory"){

document.getElementById("actionText").innerText =
data.winner + " a gagné 🏆";

document.getElementById("mainButton").disabled=true;
document.getElementById("rematchBtn").style.display="block";
}

/* DISCONNECT */
if(data.type==="player-disconnected"){
showNotification("⚠️ Joueur déconnecté");
document.getElementById("mainButton").disabled=true;
}
};

/* UI FUNCTIONS */
function updateScores(players){

if(players[0]){
document.getElementById("player1Name").innerText=players[0].name;
document.getElementById("player1Points").innerText=players[0].points;
}

if(players[1]){
document.getElementById("player2Name").innerText=players[1].name;
document.getElementById("player2Points").innerText=players[1].points;
}
}

function updateTurn(){

const banner=document.getElementById("turnBanner");

if(currentTurn===playerName){
banner.innerText="🟢 À ton tour";
}else{
banner.innerText="⏳ Tour de "+currentTurn;
}
}

function resetCard(){
document.getElementById("difficultyBadge").innerText="Choisis une difficulté";
document.getElementById("actionText").innerText="Prêt à découvrir ton défi ?";
document.getElementById("actionPoints").innerText="";
}

function showNotification(message){

const notif=document.getElementById("notification");

notif.innerText=message;
notif.classList.add("show");

setTimeout(()=>{
notif.classList.remove("show");
},2500);
}
