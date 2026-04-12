const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentTurn = "";
const victoryScore = 125;

document.getElementById("joinGame").onclick = () => {

playerName = document.getElementById("playerName").value.trim();

if(!playerName){
document.getElementById("menuError").innerText="Entre ton prénom";
return;
}

document.getElementById("joinGame").disabled=true;
document.getElementById("menuError").innerText="En attente de l’autre joueur…";

ws.send(JSON.stringify({type:"join",name:playerName}));

};

document.getElementById("drawBtn").onclick=()=>{

const difficulty=document.getElementById("difficulty").value;

if(currentTurn!==playerName){
showNotification("Ce n'est pas ton tour !");
return;
}

ws.send(JSON.stringify({type:"draw-action",difficulty}));

};

document.getElementById("completeBtn").onclick=()=>{
ws.send(JSON.stringify({type:"complete-action"}));
};

document.getElementById("rematchBtn").onclick=()=>{
ws.send(JSON.stringify({type:"rematch"}));
};

ws.onmessage=(event)=>{

const data=JSON.parse(event.data);

if(data.type==="game-start"){

document.getElementById("menu").style.display="none";
document.getElementById("game").style.display="block";

updateScores(data.players);
updateProgress(data.players);

currentTurn=data.currentTurn;
updateTurnDisplay();

}

if(data.type==="action-drawn"){

document.getElementById("currentAction").innerText=
data.player+" doit "+data.action.name+" (+"+data.action.points+" pts)";

if(data.player===playerName)
document.getElementById("completeBtn").style.display="inline-block";

showPoints(data.action.points);

}

if(data.type==="update"){

currentTurn=data.currentTurn;

updateTurnDisplay();
updateScores(data.players);
updateProgress(data.players);

document.getElementById("currentAction").innerText="";
document.getElementById("completeBtn").style.display="none";

if(data.history)
updateHistory(data.history);

}

if(data.type==="victory"){

document.getElementById("currentAction").innerText=data.winner+" a gagné 🏆";

document.getElementById("drawBtn").disabled=true;

document.getElementById("rematchBtn").style.display="inline-block";

}

if(data.type==="player-disconnected"){

showNotification("⚠️ Joueur déconnecté");
document.getElementById("drawBtn").disabled=true;

}

};

function updateTurnDisplay(){

const turn=document.getElementById("currentTurn");

if(currentTurn===playerName){

turn.innerText="🟢 À ton tour !";
turn.classList.add("myTurn");
document.getElementById("drawBtn").disabled=false;

}else{

turn.innerText="⏳ Tour de "+currentTurn;
turn.classList.remove("myTurn");
document.getElementById("drawBtn").disabled=true;

}

}

function updateScores(players){

const list=document.getElementById("scoreList");

list.innerHTML="";

players.forEach(p=>{

const li=document.createElement("li");

li.innerText=p.name+" : "+p.points+" pts";

list.appendChild(li);

});

}

function updateProgress(players){

const container=document.getElementById("progressBars");

container.innerHTML="";

players.forEach(p=>{

const percent=Math.min(100,(p.points/victoryScore)*100);

const div=document.createElement("div");

div.className="progressContainer";

div.innerHTML=`
<div>${p.name}</div>
<div class="progressBar">
<div class="progressFill" style="width:${percent}%"></div>
</div>
`;

container.appendChild(div);

});

}

function updateHistory(history){

const list=document.getElementById("historyList");

list.innerHTML="";

history.slice(-5).reverse().forEach(action=>{

const li=document.createElement("li");

li.innerText=action;

list.appendChild(li);

});

}

function showPoints(points){

const popup=document.getElementById("pointsPopup");

popup.innerText="+"+points+" pts";

popup.classList.add("show");

setTimeout(()=>{
popup.classList.remove("show");
},1000);

}

function showNotification(msg){

const n=document.getElementById("notification");

n.innerText=msg;

n.classList.add("show");

setTimeout(()=>n.classList.remove("show"),2500);

}
