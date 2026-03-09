const express=require("express");
const http=require("http");
const WebSocket=require("ws");

const app=express();
const server=http.createServer(app);
const wss=new WebSocket.Server({server});

app.use(express.static("public"));

const victoryScore=125;

let players=[];
let currentTurn=null;
let history=[];
let lastActions=[];
let rematchVotes=0;

const actions={
easy:[
{name:"10 squats",points:10},
{name:"planche 15s",points:10}
],
medium:[
{name:"15 pompes",points:20},
{name:"30s planche",points:20}
],
hard:[
{name:"20 burpees",points:30},
{name:"1min planche",points:30}
]
};

function broadcast(data){
wss.clients.forEach(client=>{
if(client.readyState===WebSocket.OPEN)
client.send(JSON.stringify(data));
});
}

function drawAction(list){

let action;

do{
action=list[Math.floor(Math.random()*list.length)];
}
while(lastActions.includes(action.name));

lastActions.push(action.name);

if(lastActions.length>3)
lastActions.shift();

return action;
}

wss.on("connection",(ws)=>{

ws.on("message",(message)=>{

const data=JSON.parse(message);

if(data.type==="join"){

players.push({
name:data.name,
points:0,
ws
});

if(players.length===2){

currentTurn=players[0].name;

broadcast({
type:"game-start",
players,
currentTurn
});

}

}

if(data.type==="draw-action"){

if(currentTurn!==players.find(p=>p.ws===ws).name) return;

const action=drawAction(actions[data.difficulty]);

broadcast({
type:"action-drawn",
player:currentTurn,
action
});

ws.currentAction=action;

}

if(data.type==="complete-action"){

const player=players.find(p=>p.ws===ws);

if(!ws.currentAction) return;

player.points+=ws.currentAction.points;

history.push(
player.name+" : "+ws.currentAction.name+" (+"+ws.currentAction.points+")"
);

if(player.points>=victoryScore){

broadcast({
type:"victory",
winner:player.name
});

return;

}

currentTurn=players.find(p=>p.name!==player.name).name;

broadcast({
type:"update",
players,
currentTurn,
history
});

ws.currentAction=null;

}

if(data.type==="rematch"){

rematchVotes++;

if(rematchVotes===2){

players.forEach(p=>p.points=0);

history=[];
lastActions=[];

currentTurn=players[0].name;

broadcast({
type:"game-start",
players,
currentTurn
});

rematchVotes=0;

}

}

});

ws.on("close",()=>{

broadcast({
type:"player-disconnected"
});

});

});

server.listen(3000,()=>{
console.log("Server running on port 3000");
});
