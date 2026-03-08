const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentTurn = "";

// ===== MENU =====
document.getElementById("joinGame").onclick = () => {
    playerName = document.getElementById("playerName").value.trim();
    if (!playerName) { document.getElementById("menuError").innerText = "Entre ton prénom"; return; }

    document.getElementById("joinGame").disabled = true;
    document.getElementById("menuError").innerText = "En attente de l’autre joueur…";

    ws.send(JSON.stringify({ type: "join", name: playerName }));
};

// ===== DRAW ACTION =====
document.getElementById("drawBtn").onclick = () => {
    const difficulty = document.getElementById("difficulty").value;
    if (currentTurn !== playerName) { showNotification("Ce n'est pas ton tour !"); return; }
    ws.send(JSON.stringify({ type: "draw-action", difficulty }));
};

// ===== COMPLETE ACTION =====
document.getElementById("completeBtn").onclick = () => {
    ws.send(JSON.stringify({ type: "complete-action" }));
    document.getElementById("completeBtn").classList.add("hidden");
    document.getElementById("currentAction").innerText = "";
};

// ===== WEBSOCKET =====
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "game-start") {
        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
        updateScores(data.players);
        currentTurn = data.currentTurn;
        updateTurnDisplay();

        document.getElementById("menuError").innerText = "";
        document.getElementById("joinGame").disabled = false;

        if (data.players.some(p => p.name === playerName)) showNotification("Vous êtes connecté à la partie !");
        else showNotification("Partie commencée !");
    }

    if (data.type === "action-drawn") {
        const actionText = `${data.player} doit faire : ${data.action.name} (+${data.action.points} pts)`;
        const currentActionDiv = document.getElementById("currentAction");
        currentActionDiv.innerText = actionText;
        currentActionDiv.className = data.action.difficulty; // easy/medium/hard pour couleur
        popCard();

        if (data.player === playerName) document.getElementById("completeBtn").classList.remove("hidden");
        else document.getElementById("completeBtn").classList.add("hidden");
    }

    if (data.type === "notification") showNotification(data.message);

    if (data.type === "update") {
        currentTurn = data.currentTurn;
        updateTurnDisplay();
        updateScores(data.players);

        if (data.clearAction) {
            document.getElementById("currentAction").innerText = "";
            document.getElementById("completeBtn").classList.add("hidden");
        }

        if (data.notification) showNotification(data.notification);
    }

    if (data.type === "victory") {
        document.getElementById("currentAction").innerText = `${data.winner} a gagné ! 🏆`;
        showNotification("Partie terminée !");
        document.getElementById("drawBtn").style.display = "none";
        document.getElementById("completeBtn").style.display = "none";

        const replayBtn = document.getElementById("replayBtn");
        replayBtn.style.display = "inline-block";
        updateScores(data.players);

        replayBtn.onclick = () => window.location.reload();
    }

    if (data.type === "error") {
        document.getElementById("menuError").innerText = data.message;
        document.getElementById("joinGame").disabled = false;
    }
};

// ===== HELPERS =====
function updateTurnDisplay() {
    document.getElementById("currentTurn").innerText = "Tour de : " + currentTurn;
}

function updateScores(players) {
    const list = document.getElementById("scoreList");
    list.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = `${p.name} : ${p.points} pts`;
        li.classList.add("update");
        setTimeout(() => li.classList.remove("update"), 300);
        list.appendChild(li);
    });
}

// Pop animation pour carte
function popCard() {
    const card = document.getElementById("currentAction");
    card.style.transform = "scale(0.9)";
    setTimeout(() => { card.style.transform = "scale(1)"; }, 150);
}

// Notification flottante
function showNotification(msg) {
    const notif = document.getElementById("notification");
    notif.innerText = msg;
    notif.classList.add("show");
    setTimeout(() => notif.classList.remove("show"), 2500);
}
