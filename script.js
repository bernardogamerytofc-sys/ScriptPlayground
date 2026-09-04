// --- SISTEMA DE PERSISTÊNCIA EM NUVEM (LocalStorage Simulator) ---
const STORAGE_KEY = "PLAYSCRIPT_STUDIO_CLOUD_V2";

function loadCloudPlaygrounds() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return [
        {
            name: "Lobby Principal",
            vis: "public",
            code: "#PG-1001",
            owner: "AdminDev",
            codeContent: '// Bem-vindo ao PlayScript Studio 2.0!\non join: send "Conectado ao Lobby Cloud!"\nlocal vida = 100\nif vida == 100 then send "Status: SAUDÁVEL"\n<button color="#6366f1">Entrar na Arena</button>\nloop 3 times: create box "#22c55e"'
        }
    ];
}

function saveCloudPlaygrounds() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playgrounds));
    const status = document.getElementById('cloudStatus');
    status.textContent = "☁️ Salvo na Nuvem!";
    setTimeout(() => { status.textContent = "☁️ Nuvem Sincronizada"; }, 2000);
}

let playgrounds = loadCloudPlaygrounds();

// --- ÁUDIO E EFETOS ---
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
    btn.addEventListener('mouseenter', () => playSound(450, 'sine', 0.03));
    btn.addEventListener('click', () => playSound(650, 'triangle', 0.06));
});

// --- CANVAS DE FUNDO ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for (let i = 0; i < 40; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedY: Math.random() * 0.3 + 0.1
    });
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
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

// --- CONTROLE DE USUÁRIO E PERMISSÕES ---
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
        userStatus.textContent = `👤 ${currentUser.name} ${currentUser.canEdit ? '(Editor/Admin)' : ''}`;
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

// --- MENU & NAVEGAÇÃO ---
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const createModal = document.getElementById('createModal');
const joinModal = document.getElementById('joinModal');

const welcomeView = document.getElementById('welcomeView');
const listView = document.getElementById('listView');
const helpView = document.getElementById('helpView');
const changelogView = document.getElementById('changelogView');
const roomView = document.getElementById('roomView');
const playgroundGrid = document.getElementById('playgroundGrid');

let activeRoom = null;

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
    changelogView.classList.add('hidden');
    roomView.classList.add('hidden');
    view.classList.remove('hidden');
}

document.getElementById('createBtn').onclick = () => { toggleMenu(false); createModal.classList.add('active'); };
document.getElementById('joinBtn').onclick = () => { toggleMenu(false); joinModal.classList.add('active'); };
document.getElementById('listBtn').onclick = () => { toggleMenu(false); showView(listView); renderPlaygrounds(); };
document.getElementById('helpBtn').onclick = () => { toggleMenu(false); showView(helpView); };
document.getElementById('changelogBtn').onclick = () => { toggleMenu(false); showView(changelogView); };

document.getElementById('heroCreateBtn').onclick = () => createModal.classList.add('active');
document.getElementById('heroListBtn').onclick = () => { showView(listView); renderPlaygrounds(); };

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
        const room = {
            name,
            vis,
            code,
            owner: currentUser.name,
            codeContent: '// Novo Playground Studio\non join: send "Bem-vindo!"\n<button color="#6366f1">Ação</button>'
        };
        playgrounds.push(room);
        saveCloudPlaygrounds();
        createModal.classList.remove('active');
        enterRoom(room);
    }
};

function renderPlaygrounds() {
    playgroundGrid.innerHTML = "";
    playgrounds.filter(p => p.vis === 'public').forEach(pg => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h3>${pg.name}</h3><span style="font-size:0.8rem; color:#a1a1aa">Dono: ${pg.owner}</span><br><span class="code-tag">${pg.code}</span>`;
        card.onclick = () => enterRoom(pg);
        playgroundGrid.appendChild(card);
    });
}

function enterRoom(room) {
    activeRoom = room;
    showView(roomView);
    document.getElementById('roomTitle').textContent = room.name;
    document.getElementById('roomBadge').textContent = room.vis === 'public' ? 'Pública' : 'Privada';
    document.getElementById('roomCodeDisplay').textContent = room.code;
    document.getElementById('codeEditor').value = room.codeContent;
    updatePermissionsUI();
    runPlayScript();
}

document.getElementById('saveCloudBtn').onclick = () => {
    if (activeRoom) {
        activeRoom.codeContent = document.getElementById('codeEditor').value;
        saveCloudPlaygrounds();
    }
};

document.getElementById('quickRunBtn').onclick = () => {
    runPlayScript();
    playSound(800, 'sine', 0.1);
};

// --- TAB COMPLETE NO EDITOR ---
const codeEditor = document.getElementById('codeEditor');
const autocompleteKeywords = [
    'on join: send ""',
    'local vida = 100',
    'if vida == 100 then send ""',
    'loop 3 times: create box "#22c55e"',
    '<button color="#6366f1">Clique</button>',
    'send alert ""',
    'effect particle "#a855f7"'
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
    } else if (e.key === 'F5') {
        e.preventDefault();
        runPlayScript();
    }
});

// --- ENGINE PLAYSCRIPT 2.0 (Skript + Luau + HTML) ---
const previewCanvas = document.getElementById('previewCanvas');
const aiOutput = document.getElementById('aiOutput');

codeEditor.addEventListener('input', () => {
    runPlayScript();
    if (activeRoom) {
        activeRoom.codeContent = codeEditor.value;
        saveCloudPlaygrounds();
    }
});

function runPlayScript() {
    const lines = codeEditor.value.split('\n');
    previewCanvas.innerHTML = "";
    let errors = [];
    let variables = {};

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) return;

        // Regras da linguagem PlayScript 2.0
        const luauVar = trimmed.match(/^local\s+([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
        const skriptJoin = trimmed.match(/^on join:\s*send\s*"([^"]+)"$/);
        const skriptIf = trimmed.match(/^if\s+([a-zA-Z0-9_]+)\s*==\s*(.+)\s+then\s+send\s*"([^"]+)"$/);
        const skriptLoop = trimmed.match(/^loop\s+(\d+)\s+times:\s*create box\s*"([^"]+)"$/);
        const htmlButton = trimmed.match(/^<button\s+color="([^"]+)">([^<]+)<\/button>$/);
        const effectParticle = trimmed.match(/^effect particle\s*"([^"]+)"$/);

        if (luauVar) {
            variables[luauVar[1]] = luauVar[2];
        } else if (skriptJoin) {
            const p = document.createElement('div');
            p.style.cssText = "color:#38bdf8; font-weight:bold; background:#18181b; padding:8px; border-radius:6px; border-left:3px solid #38bdf8;";
            p.textContent = `📢 [ENTROU]: ${skriptJoin[1]}`;
            previewCanvas.appendChild(p);
        } else if (skriptIf) {
            const varName = skriptIf[1];
            const varVal = skriptIf[2];
            const msg = skriptIf[3];

            if (variables[varName] && variables[varName] === varVal) {
                const p = document.createElement('div');
                p.style.cssText = "color:#4ade80; background:#18181b; padding:8px; border-radius:6px; border-left:3px solid #4ade80;";
                p.textContent = `✅ [CONDICIONAL]: ${msg}`;
                previewCanvas.appendChild(p);
            }
        } else if (skriptLoop) {
            const times = parseInt(skriptLoop[1]);
            const color = skriptLoop[2];
            const container = document.createElement('div');
            container.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";

            for (let i = 0; i < times; i++) {
                const box = document.createElement('div');
                box.style.cssText = `width:40px; height:40px; background:${color}; border-radius:6px; box-shadow:0 0 10px ${color}88;`;
                container.appendChild(box);
            }
            previewCanvas.appendChild(container);
        } else if (htmlButton) {
            const btn = document.createElement('button');
            btn.className = "btn";
            btn.style.backgroundColor = htmlButton[1];
            btn.textContent = htmlButton[2];
            btn.onclick = () => playSound(700, 'sine', 0.1);
            previewCanvas.appendChild(btn);
        } else if (effectParticle) {
            const effectBox = document.createElement('div');
            effectBox.style.cssText = `color:${effectParticle[1]}; font-size:0.85rem; font-weight:bold; text-shadow:0 0 8px ${effectParticle[1]};`;
            effectBox.textContent = `✨ [EFEITO DE PARTÍCULAS EXECUTADO]`;
            previewCanvas.appendChild(effectBox);
        } else {
            errors.push(`Linha ${idx + 1}: Comando desconhecido.`);
        }
    });

    if (errors.length > 0) {
        aiOutput.textContent = `⚠️ ${errors[0]}`;
        aiOutput.style.color = "#f87171";
    } else {
        aiOutput.textContent = "⚡ PlayScript 2.0 Compilado com Sucesso!";
        aiOutput.style.color = "#4ade80";
    }
}