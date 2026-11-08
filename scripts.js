const track = document.getElementById('carousel');
const prev = document.querySelector('.carousel-btn.prev');
const next = document.querySelector('.carousel-btn.next');

if (track) {
  const scrollByCard = () => {
    const card = track.querySelector('.gallery-card');
    return card ? card.offsetWidth + parseInt(getComputedStyle(track).gap || 16) : track.clientWidth * 0.8;
  };

  prev && prev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollByCard(), behavior: 'smooth' });
  });
  next && next.addEventListener('click', () => {
    track.scrollBy({ left: scrollByCard(), behavior: 'smooth' });
  });

  // pointer drag to scroll
  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('pointerdown', (e) => {
    isDown = true;
    track.setPointerCapture(e.pointerId);
    startX = e.clientX;
    scrollLeft = track.scrollLeft;
    track.classList.add('dragging');
  });

  track.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const x = e.clientX;
    const walk = (startX - x);
    track.scrollLeft = scrollLeft + walk;
  });

  const stopDrag = (e) => {
    isDown = false;
    try { track.releasePointerCapture(e && e.pointerId); } catch (err) {}
    track.classList.remove('dragging');
  };

  track.addEventListener('pointerup', stopDrag);
  track.addEventListener('pointercancel', stopDrag);
  track.addEventListener('pointerleave', stopDrag);

  // keyboard navigation
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next && next.click();
    if (e.key === 'ArrowLeft') prev && prev.click();
  });
}

// Lightbox functionality（媒体中心风格面板：名称/尺寸/下载/翻页）
(function() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lbTitle = document.getElementById('lb-title');
  const lbSize = document.getElementById('lb-size');
  const lbDownload = document.getElementById('lb-download');
  const lbIndex = document.getElementById('lb-index');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  const closeBtn = document.querySelector('.lightbox-close');
  const cards = Array.from(document.querySelectorAll('.gallery-card'));
  const sizes = window.GALLERY_SIZES || {};
  let current = -1;

  const nameOf = (card) => (card && card.dataset.name) || '';
  const fullOf = (card) => (card && card.dataset.full) || '';
  const displayName = (n) => String(n).replace(/\.[^.]+$/, '');

  function render() {
    if (current < 0 || current >= cards.length) return;
    const card = cards[current];
    const name = nameOf(card);
    const full = fullOf(card);
    if (lightboxImg) lightboxImg.src = full;
    if (lbTitle) lbTitle.textContent = displayName(name);
    if (lbSize) lbSize.textContent = sizes[name] || '';
    if (lbIndex) lbIndex.textContent = (current + 1) + ' / ' + cards.length;
    if (lbDownload) {
      lbDownload.href = full;
      lbDownload.setAttribute('download', name || 'wallpaper');
    }
  }

  function openLightbox(index) {
    if (index < 0 || index >= cards.length) return;
    current = index;
    render();
    if (lightbox) lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxImg) lightboxImg.src = '';
    current = -1;
  }
  function step(d) {
    if (cards.length === 0) return;
    if (current < 0) { openLightbox(0); return; }
    openLightbox((current + d + cards.length) % cards.length);
  }

  cards.forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(i));
  });
  lbPrev && lbPrev.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  lbNext && lbNext.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  closeBtn && closeBtn.addEventListener('click', closeLightbox);
  lightbox && lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // 下载：http(s) 下 fetch->blob 直接下载；file:// 下浏览器禁止直接下载，降级为新标签打开原图（可右键另存）
  function startDownload(name, full) {
    if (!full) return;
    if (window.location.protocol === 'file:') {
      const a = document.createElement('a');
      a.href = full;
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    const fallback = () => {
      const a = document.createElement('a');
      a.href = full;
      a.download = name || 'wallpaper';
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    if (typeof fetch !== 'function') { fallback(); return; }
    fetch(full).then(function(r) {
      if (!r.ok) throw new Error('not ok');
      return r.blob();
    }).then(function(blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'wallpaper';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function() { URL.revokeObjectURL(url); }, 4000);
    }).catch(fallback);
  }
  lbDownload && lbDownload.addEventListener('click', function(e) {
    if (current < 0) return;
    const card = cards[current];
    e.preventDefault();
    startDownload(nameOf(card), fullOf(card));
  });
})();

// 卡片缩略图懒加载：进入视口才加载背景图（Safari/移动端友好）
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.gallery-card[data-bg]'));
  if (!cards.length) return;
  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (c) {
      var bg = c.getAttribute('data-bg');
      if (bg) c.style.backgroundImage = "url('" + bg + "')";
    });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var c = e.target;
        var bg = c.getAttribute('data-bg');
        if (bg) c.style.backgroundImage = "url('" + bg + "')";
        io.unobserve(c);
      }
    });
  }, { rootMargin: '300px 0px' });
  cards.forEach(function (c) { io.observe(c); });
})();
