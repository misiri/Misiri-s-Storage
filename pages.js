document.body.insertAdjacentHTML('beforeend', `
    <nav class="nav-panel" id="nav-panel">
        <a href="./index.html" class="home-link"><img src="./home.png" alt="Home" /></a>
        <ul>
            <li><a href="./reel.html" data-text="Reel">Reel</a></li>
            <li><a href="./design.html" data-text="Design">Design</a></li>
            <li><a href="./motion.html" data-text="Motion">Motion</a></li>
            <li><a href="./3d.html" data-text="3D">3D</a></li>
            <li><a href="./profile.html" data-text="Profile">Profile</a></li>
            <li><a href="./contact.html" data-text="Contact">Contact</a></li>
        </ul>
    </nav>
    <button class="close-btn" id="close-btn">&#x2715;</button>
`);

const currentFile = window.location.pathname.split('/').pop();
document.querySelectorAll('.nav-panel ul a').forEach(link => {
    if (link.getAttribute('href') === `./${currentFile}`) link.classList.add('active');
});

const burgerBtn = document.getElementById('burger-btn');
const navPanel  = document.getElementById('nav-panel');
const closeBtn  = document.getElementById('close-btn');

function openNav() {
    navPanel.classList.add('open');
    closeBtn.classList.add('open');
}

function closeNav() {
    navPanel.classList.remove('open');
    closeBtn.classList.remove('open');
}

burgerBtn.addEventListener('click', openNav);
closeBtn.addEventListener('click', closeNav);
document.addEventListener('click', (e) => {
    if (navPanel.classList.contains('open')
        && !navPanel.contains(e.target)
        && !burgerBtn.contains(e.target)
        && !closeBtn.contains(e.target)) {
        closeNav();
    }
});
