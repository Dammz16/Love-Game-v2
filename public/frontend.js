const ws = new WebSocket(`ws://${location.host}`);
let currentAction = null;

const pointsEl = document.getElementById('points');
const currentActionEl = document.getElementById('currentAction');
const notifEl = document.getElementById('notifications');
const leaderboardEl = document.getElementById('leaderboard');
const nameInput = document.getElementById('nameInput');

function addNotification(msg, type="info") {
    const p = document.createElement('p');
    p.textContent = msg;
    p.style.margin = "2px 0";
    p.style.padding = "2px 5px";
    p.style.borderRadius = "3px";

    if(type === "error") p.style.backgroundColor = "#f44336";
    else if(type === "success") p.style.backgroundColor = "#4CAF50";
    else p.style.backgroundColor = "#e0e0e0";

    notifEl.appendChild(p);
    notifEl.scrollTop = notifEl.scrollHeight;
}

function updateLeaderboard(list) {
    leaderboardEl.innerHTML = '';
    list.sort((a,b) => b.points - a.points)
        .forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name} : ${p.points} points`;
            if (p.name === nameInput.value.trim()) li.style.fontWeight = "bold";
            leaderboardEl.appendChild(li);
        });
}

// Gestion WebSocket
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
        case 'connected': console.log(data.msg); break;
        case 'action-drawn':
            currentAction = data.action;
            currentActionEl.textContent = `Action à faire : ${currentAction.name} (${currentAction.points} points)`;
            break;
        case 'points-updated': pointsEl.textContent = data.points; break;
        case 'gift-bought':
            pointsEl.textContent = data.points;
            addNotification(`Vous avez acheté : ${data.gift.name}`, "success");
            break;
        case 'gift-failed': addNotification(data.msg, "error"); break;
        case 'leaderboard': updateLeaderboard(data.leaderboard); break;
        case 'notification': addNotification(data.msg); break;
    }
};

// Tirer action
document.getElementById('drawBtn').addEventListener('click', () => {
    const difficulty = document.getElementById('difficulty').value;
    ws.send(JSON.stringify({ type: 'draw-action', difficulty }));
});

// Compléter action
document.getElementById('completeBtn').addEventListener('click', () => {
    if(currentAction){
        ws.send(JSON.stringify({ type: 'complete-action', points: currentAction.points }));
        currentAction = null;
        currentActionEl.textContent = '';
    }
});

// Charger cadeaux
fetch('/api/gifts')
    .then(res => res.json())
    .then(gifts => {
        const select = document.getElementById('gifts');
        gifts.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.textContent = `${g.name} (${g.cost} points)`;
            select.appendChild(opt);
        });
    });

// Acheter cadeau
document.getElementById('buyGiftBtn').addEventListener('click', () => {
    const giftId = parseInt(document.getElementById('gifts').value);
    ws.send(JSON.stringify({ type: 'buy-gift', giftId }));
});

// Saisie pseudo
document.getElementById('nameBtn').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if(name) ws.send(JSON.stringify({ type: 'set-name', name }));

});
