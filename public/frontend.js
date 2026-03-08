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

    document.getElementById("joinGame").disabled = true;
    document.getElementById("menuError").innerText = "En attente de l’autre joueur…";

    ws.send(JSON.stringify({ type: "join", name: playerName }));
};

// ===== DRAW ACTION =====
document.getElementById("drawBtn").onclick = () => {
    const difficulty = document.getElementById("difficulty").value;
    if (currentTurn !== playerName) { alert("Ce n'est pas ton tour !"); return; }
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

        if (data.players.some(p => p.name === playerName)) {
            document.getElementById("notification").innerText = "Vous êtes connecté à la partie !";
        } else {
            document.getElementById("notification").innerText = "Partie commencée !";
        }
    }

    if (data.type === "action-drawn") {
        document.getElementById("currentAction").innerText =
            data.player + " doit faire : " +
            data.action.name +
            " (+" + data.action.points + " pts)";
        if (data.player === playerName) document.getElementById("completeBtn").classList.remove("hidden");
        else document.getElementById("completeBtn").classList.add("hidden");
    }

    if (data.type === "notification") {
        document.getElementById("notification").innerText = data.message;
    }

    if (data.type === "update") {
        currentTurn = data.currentTurn;
        updateTurnDisplay();
        updateScores(data.players);
    }

    if (data.type === "victory") {
        document.getElementById("currentAction").innerText = `${data.winner} a gagné ! 🏆`;
        document.getElementById("notification").innerText = "Partie terminée !";

        document.getElementById("drawBtn").style.display = "none";
        document.getElementById("completeBtn").style.display = "none";

        const replayBtn = document.getElementById("replayBtn");
        replayBtn.style.display = "inline-block";

        updateScores(data.players);

        replayBtn.onclick = () => {
            window.location.reload();
        };
    }

    if (data.type === "error") {
        document.getElementById("menuError").innerText = data.message;
        document.getElementById("joinGame").disabled = false;
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
