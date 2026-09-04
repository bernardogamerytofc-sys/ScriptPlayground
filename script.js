// ÁUDIO WEB API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'sine', duration = 0.08) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('mouseenter', () => playSound(420, 'sine', 0.04));
    btn.addEventListener('click', () => playSound(650, 'triangle', 0.08));
});

// CANVAS FUNDO
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for (let i = 0; i < 35; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedY: Math.random() * 0.4 + 0.1
    });
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
    particles.forEach(p => {
        p.y -= p.speedY;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// CONTROLE DE USUÁRIO
let currentUser = { name: "Visitante", canEdit: false };
const userStatus = document.getElementById('userStatus');
const loginModal = document.getElementById('loginModal');
const adminEditBtn = document.getElementById('adminEditBtn');

document.getElementById('loginBtn').onclick = () => { toggleMenu(false); loginModal.classList.add('active'); };
document.getElementById('closeLoginModal').onclick = () => loginModal.classList.remove('active');

document.getElementById('confirmLogin').onclick = () => {
    const name = document.getElementById('usernameInput').value.trim();
    if (name) {
        currentUser.name = name;
        currentUser.canEdit = name.toLowerCase().includes('admin') || name.toLowerCase().includes('dev');
        userStatus.textContent = `👤 ${currentUser.name} ${currentUser.canEdit ? '(Editor)' : ''}`;
        loginModal.classList.remove('active');
        updatePermissionsUI();
    }
};

function updatePermissionsUI() {
    if (currentUser.canEdit) {
        adminEditBtn.classList.remove('hidden');
    } else {
        adminEditBtn.classList.add('hidden');
    }
}

// MENU & NAVEGAÇÃO
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const createModal = document.getElementById('createModal');
const joinModal = document.getElementById('joinModal');

const welcomeView = document.getElementById('welcomeView');
const listView = document.getElementById('listView');
const helpView = document.getElementById('helpView');
const roomView = document.getElementById('roomView');
const playgroundGrid = document.getElementById('playgroundGrid');

let playgrounds = [
    { name: "Lobby Principal", vis: "public", code: "#PG-100", owner: "Dev", codeContent: 'on join: send "Bem-vindo ao lobby!"\n<button color="#6366f1">Entrar</button>' }
];

function toggleMenu(open) {
    sidebar.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
}

document.getElementById('openMenuBtn').onclick = () => toggleMenu(true);
document.getElementById('closeMenuBtn').onclick = () => toggleMenu(false);
overlay.onclick = () => toggleMenu(false);

function showView(view) {
    welcomeView.classList.add('hidden');
    listView.classList.add('hidden');
    helpView.classList.add('hidden');
    roomView.classList.add('hidden');
    view.classList.remove('hidden');
}

document.getElementById('createBtn').onclick = () => { toggleMenu(false); createModal.classList.add('active'); };
document.getElementById('joinBtn').onclick = () => { toggleMenu(false); joinModal.classList.add('active'); };
document.getElementById('listBtn').onclick = () => { toggleMenu(false); showView(listView); renderPlaygrounds(); };
document.getElementById('helpBtn').onclick = () => { toggleMenu(false); showView(helpView); };

document.getElementById('closeCreateModal').onclick = () => createModal.classList.remove('active');
document.getElementById('closeJoinModal').onclick = () => joinModal.classList.remove('active');

document.getElementById('confirmJoin').onclick = () => {
    joinModal.classList.remove('active');
    const inputCode = document.getElementById('joinCodeInput').value.trim();
    const foundRoom = playgrounds.find(p => p.code === inputCode) || playgrounds[0];
    enterRoom(foundRoom);
};

document.getElementById('confirmCreate').onclick = () => {
    const name = document.getElementById('roomName').value.trim();
    const vis = document.getElementById('roomVisibility').value;
    if (name) {
        const code = "#PG-" + Math.floor(1000 + Math.random() * 9000);
        const room = { name, vis, code, owner: currentUser.name, codeContent: 'on join: send "Nova Sala"\n<button color="#22c55e">Iniciar</button>' };
        playgrounds.push(room);
        createModal.classList.remove('active');
        enterRoom(room);
    }
};

function renderPlaygrounds() {
    playgroundGrid.innerHTML = "";
    playgrounds.filter(p => p.vis === 'public').forEach(pg => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${pg.name}</h3><span>Dono: ${pg.owner}</span><br><span class="code-tag">${pg.code}</span>`;
        card.onclick = () => enterRoom(pg);
        playgroundGrid.appendChild(card);
    });
}

function enterRoom(room) {
    showView(roomView);
    document.getElementById('roomTitle').textContent = room.name;
    document.getElementById('roomBadge').textContent = room.vis === 'public' ? 'Pública' : 'Privada';
    document.getElementById('roomCodeDisplay').textContent = room.code;
    document.getElementById('codeEditor').value = room.codeContent;
    updatePermissionsUI();
    runPlayScript();
}

// TAB COMPLETE & IDE ENGINE
const codeEditor = document.getElementById('codeEditor');
const autocompleteKeywords = [
    'on join: send ""',
    'local var = 10',
    '<button color="#6366f1">Clique</button>',
    'send alert ""'
];

codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const cursor = codeEditor.selectionStart;
        const textBefore = codeEditor.value.substring(0, cursor);
        const lastWord = textBefore.split(/\s+/).pop();

        if (lastWord) {
            const match = autocompleteKeywords.find(k => k.startsWith(lastWord));
            if (match) {
                codeEditor.value = textBefore.substring(0, cursor - lastWord.length) + match + codeEditor.value.substring(cursor);
                runPlayScript();
            }
        }
    }
});

const previewCanvas = document.getElementById('previewCanvas');
const aiOutput = document.getElementById('aiOutput');

codeEditor.addEventListener('input', runPlayScript);

function runPlayScript() {
    const lines = codeEditor.value.split('\n');
    previewCanvas.innerHTML = "";
    let errors = [];

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) return;

        const skriptJoin = trimmed.match(/^on join:\s*send\s*"([^"]+)"$/);
        const htmlButton = trimmed.match(/^<button\s+color="([^"]+)">([^<]+)<\/button>$/);

        if (skriptJoin) {
            const p = document.createElement('p');
            p.textContent = `[EVENTO]: ${skriptJoin[1]}`;
            p.style.color = "#38bdf8";
            previewCanvas.appendChild(p);
        } else if (htmlButton) {
            const btn = document.createElement('button');
            btn.className = "btn";
            btn.style.backgroundColor = htmlButton[1];
            btn.textContent = htmlButton[2];
            previewCanvas.appendChild(btn);
        } else {
            errors.push(`Linha ${idx + 1}: Erro de sintaxe.`);
        }
    });

    if (errors.length > 0) {
        aiOutput.textContent = `⚠️ ${errors[0]}`;
        aiOutput.style.color = "#f87171";
    } else {
        aiOutput.textContent = "🤖 Código compilado perfeitamente!";
        aiOutput.style.color = "#4ade80";
    }
}