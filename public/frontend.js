const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentTurn = "";

// ===== MENU =====
document.getElementById("joinGame").onclick = () => {

    playerName = document.getElementById("playerName").value.trim();

    if (!playerName) {
        document.getElementById("menuError").innerText = "Entre ton prénom";
        return;
    }

    ws.send(JSON.stringify({
        type: "join",
        name: playerName
    }));
};

// ===== GAME =====
document.getElementById("drawBtn").onclick = () => {
    const difficulty = document.getElementById("difficulty").value;
    if (currentTurn !== playerName) { alert("Ce n'est pas ton tour !"); return; }

    ws.send(JSON.stringify({ type: "draw-action", difficulty }));
};

document.getElementById("completeBtn").onclick = () => {
    ws.send(JSON.stringify({ type: "complete-action" }));
    document.getElementById("completeBtn").classList.add("hidden");
    document.getElementById("currentAction").innerText = "";
};

// ===== WEBSOCKET =====
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Partie démarrée
    if (data.type === "game-start") {
        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
        updateScores(data.players);
        currentTurn = data.currentTurn;
        updateTurnDisplay();
        document.getElementById("notification").innerText = "Partie commencée !";
    }

    // Action tirée
    if (data.type === "action-drawn") {
        document.getElementById("currentAction").innerText =
            data.player + " doit faire : " +
            data.action.name +
            " (+" + data.action.points + " pts)";

        if (data.player === playerName) {
            document.getElementById("completeBtn").classList.remove("hidden");
        } else {
            document.getElementById("completeBtn").classList.add("hidden");
        }
    }

    // Notification simple
    if (data.type === "notification") {
        document.getElementById("notification").innerText = data.message;
    }

    // Mise à jour des scores et tour
    if (data.type === "update") {
        currentTurn = data.currentTurn;
        updateTurnDisplay();
        updateScores(data.players);
    }

    // Erreur
    if (data.type === "error") {
        document.getElementById("menuError").innerText = data.message;
    }
};

// ===== UI HELPERS =====
function updateTurnDisplay() {
    document.getElementById("currentTurn").innerText = "Tour de : " + currentTurn;
}

function updateScores(players) {
    const list = document.getElementById("scoreList");
    list.innerHTML = "";
    players.forEach(p => {
        const li = document.createElement("li");
        li.innerText = p.name + " : " + (p.points || 0) + " pts";
        list.appendChild(li);
    });
}
