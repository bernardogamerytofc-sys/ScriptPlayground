const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const openMenuBtn = document.getElementById('openMenuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');

const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');

// Funções para abrir e fechar o menu
function openMenu() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
}

function closeMenu() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

// Eventos do Menu
openMenuBtn.addEventListener('click', openMenu);
closeMenuBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

// Ações dos botões
document.getElementById('createBtn').addEventListener('click', () => {
    pageTitle.textContent = "➕ Create a Playground";
    pageDescription.textContent = "Aqui você vai configurar e criar uma nova sala/servidor.";
    closeMenu();
});

document.getElementById('joinBtn').addEventListener('click', () => {
    pageTitle.textContent = "🎟 Join a Playground";
    pageDescription.textContent = "Digite o código ou convite para entrar em uma sala existente.";
    closeMenu();
});

document.getElementById('listBtn').addEventListener('click', () => {
    pageTitle.textContent = "📝 Playground List";
    pageDescription.textContent = "Veja todas as salas ativas disponíveis no momento.";
    closeMenu();
});