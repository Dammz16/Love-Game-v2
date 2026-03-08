const ws = new WebSocket(location.origin.replace(/^http/, 'ws'));

let playerName = "";
let currentRoom = "";
let currentTurn = "";
let mode = "";

// ======================
// MENU ACTIONS
// ======================

document.getElementById("createRoom").onclick = () => {
    playerName = document.getElementById("playerName").value.trim();
    mode = document.getElementById("mode").value;

    if (!playerName) {
        document.getElementById("menuError").innerText = "Entre ton prénom";
        return;
    }

    ws.send(JSON.stringify({
        type: "create-room",
        name: playerName,
        mode: mode
    }));
};

document.getElementById("joinRoom").onclick = () => {
    playerName = document.getElementById("playerName").value.trim();
    const code = document.getElementById("roomCode").value.trim().toUpperCase();

    if (!playerName || !code) {
        document.getElementById("menuError").innerText = "Nom + code requis";
        return;
    }

    ws.send(JSON.stringify({
        type: "join-room",
        name: playerName,
        code: code
    }));
};

// ======================
// GAME ACTIONS
// ======================

document.getElementById("drawBtn").onclick = () => {
    const difficulty = document.getElementById("difficulty").value;

    if (currentTurn !== playerName) {
        alert("Ce n'est pas ton tour !");
        return;
    }

    ws.send(JSON.stringify({
        type: "draw-action",
        difficulty: difficulty
    }));
};

document.getElementById("completeBtn").onclick = () => {
    ws.send(JSON.stringify({
        type: "complete-action"
    }));

    document.getElementById("completeBtn").classList.add("hidden");
    document.getElementById("currentAction").innerText = "";
};

// ======================
// WEBSOCKET MESSAGES
// ======================

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Room created
    if (data.type === "room-created") {
        currentRoom = data.code;
        document.getElementById("roomDisplay").innerText = "Salle : " + currentRoom;
        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
    }

    // Game start
    if (data.type === "game-start") {

    // 🔥 Forcer l'affichage du jeu pour TOUS les joueurs
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    document.getElementById("notification").innerText = "Partie commencée !";

    updateScores(data.players.map(name => ({ name, points: 0 })));

    currentTurn = data.currentTurn;
    updateTurnDisplay();
}

    // Action drawn
    if (data.type === "action-drawn") {
        document.getElementById("currentAction").innerText =
            data.action.name + " (+ " + data.action.points + " pts)";
        document.getElementById("completeBtn").classList.remove("hidden");
    }

    // Notification
    if (data.type === "notification") {
        document.getElementById("notification").innerText = data.message;
    }

    // Error
    if (data.type === "error") {
        document.getElementById("menuError").innerText = data.message;
    }
};

// ======================
// UI HELPERS
// ======================

function updateTurnDisplay() {
    document.getElementById("currentTurn").innerText =
        "Tour de : " + currentTurn;
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


