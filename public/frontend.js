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

    // Désactiver le bouton pour éviter double clic
    document.getElementById("joinGame").disabled = true;

    // Afficher message d'attente
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

    // Partie démarrée
    if (data.type === "game-start") {
        document.getElementById("menu").style.display = "none";
        document.getElementById("game").style.display = "block";
        updateScores(data.players);
        currentTurn = data.currentTurn;
        updateTurnDisplay();

        // Vider le message d'attente et bouton désactivé
        document.getElementById("menuError").innerText = "";
        document.getElementById("joinGame").disabled = false;

        // Notification spécifique
        if (data.players.some(p => p.name === playerName)) {
            document.getElementById("notification").innerText = "Vous êtes connecté à la partie !";
        } else {
            document.getElementById("notification").innerText = "Partie commencée !";
        }
    }

    // Action tirée
    if (data.type === "action-drawn") {
        document.getElementById("currentAction").innerText =
            data.player + " doit faire : " +
            data.action.name +
            " (+" + data.action.points + " pts)";
        if (data.player === playerName) document.getElementById("completeBtn").classList.remove("hidden");
        else document.getElementById("completeBtn").classList.add("hidden");
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

    // Victoire
    if (data.type === "victory") {
        document.getElementById("currentAction").innerText = `${data.winner} a gagné ! 🏆`;
        document.getElementById("notification").innerText = "Partie terminée !";

        // Masquer les boutons action
        document.getElementById("drawBtn").style.display = "none";
        document.getElementById("completeBtn").style.display = "none";

        // Afficher bouton Rejouer
        const replayBtn = document.getElementById("replayBtn");
        replayBtn.style.display = "inline-block";

        updateScores(data.players);

        replayBtn.onclick = () => {
            window.location.reload(); // Relancer une nouvelle partie
        };
    }

    // Erreur
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

// ===== COLOR & ANIMATION FOR ACTION CARD =====
const currentActionDiv = document.getElementById("currentAction");

const observer = new MutationObserver(() => {
    const text = currentActionDiv.innerText.toLowerCase();
    currentActionDiv.classList.remove("easy", "medium", "hard");
    if (text.includes("facile")) currentActionDiv.classList.add("easy");
    else if (text.includes("moyen")) currentActionDiv.classList.add("medium");
    else if (text.includes("difficile")) currentActionDiv.classList.add("hard");

    // Pop animation
    currentActionDiv.style.transform = "scale(0.95)";
    setTimeout(() => { currentActionDiv.style.transform = "scale(1)"; }, 150);
});
observer.observe(currentActionDiv, { childList: true, subtree: true });
