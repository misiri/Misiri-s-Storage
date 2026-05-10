(function () {
    const data = window.worksData;
    if (!data || !data.length) return;

    let current = 0;

    const mainImg  = document.getElementById('works-main-image');
    const typeEl   = document.getElementById('works-type');
    const titleEl  = document.getElementById('works-title');
    const descEl   = document.getElementById('works-description');
    const metaEl   = document.getElementById('works-meta');
    const iconsEl  = document.getElementById('works-icons');
    const prevBtn  = document.getElementById('prev-btn');
    const nextBtn  = document.getElementById('next-btn');
    const videoLink = document.getElementById('watch-video');

    function render(index) {
        const w = data[index];
        if (mainImg)  { mainImg.src = w.image; mainImg.alt = w.title || ''; }
        if (typeEl)   typeEl.textContent  = w.type        || '';
        if (titleEl)  titleEl.textContent = w.title       || '';
        if (descEl)   descEl.textContent  = w.description || '';
        if (metaEl)   metaEl.textContent  = w.meta        || '';
        if (videoLink) {
            if (w.videoUrl) {
                videoLink.href = w.videoUrl;
                videoLink.style.display = '';
            } else {
                videoLink.style.display = 'none';
            }
        }
        if (iconsEl) {
            iconsEl.innerHTML = '';
            (w.icons || []).forEach(icon => {
                const img = document.createElement('img');
                img.src = icon;   // use path as-is
                img.alt = '';
                iconsEl.appendChild(img);
            });
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        current = (current - 1 + data.length) % data.length;
        render(current);
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        current = (current + 1) % data.length;
        render(current);
    });

    render(0);
})();
