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
  // 预览集合：分页与搜索后，只在当前可见的这批卡片之间翻页
  let activeList = cards;
  let current = -1;

  function visibleCards() {
    return cards.filter(function (card) { return card.style.display !== 'none'; });
  }

  const nameOf = (card) => (card && card.dataset.name) || '';
  const fullOf = (card) => (card && card.dataset.full) || '';
  const displayName = (n) => String(n).replace(/\.[^.]+$/, '');

  function render() {
    if (current < 0 || current >= activeList.length) return;
    const card = activeList[current];
    const name = nameOf(card);
    const full = fullOf(card);
    if (lightboxImg) lightboxImg.src = full;
    if (lbTitle) lbTitle.textContent = displayName(name);
    if (lbSize) lbSize.textContent = sizes[name] || '';
    if (lbIndex) lbIndex.textContent = (current + 1) + ' / ' + activeList.length;
    if (lbDownload) {
      lbDownload.href = full;
      lbDownload.setAttribute('download', name || 'wallpaper');
    }
  }

  function openLightbox(index) {
    if (index < 0 || index >= activeList.length) return;
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
    if (activeList.length === 0) return;
    if (current < 0) { openLightbox(0); return; }
    openLightbox((current + d + activeList.length) % activeList.length);
  }

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      // 优先沿用分页/搜索后的完整集合，让预览翻页与当前结果连续
      const shared = window.__galleryList;
      activeList = (shared && shared.indexOf(card) !== -1) ? shared : visibleCards();
      const idx = activeList.indexOf(card);
      openLightbox(idx >= 0 ? idx : 0);
    });
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
    const card = activeList[current];
    e.preventDefault();
    startDownload(nameOf(card), fullOf(card));
  });
})();

// 画廊分页 + 名称搜索：每页 12 张，底部显示页码与换页箭头（样式对齐媒体中心）
(function () {
  const grid = document.querySelector('.gallery-grid');
  const pager = document.getElementById('gallery-pager');
  if (!grid || !pager) return;

  const allCards = Array.prototype.slice.call(grid.querySelectorAll('.gallery-card'));
  const PAGE_SIZE = 12;
  let list = allCards.slice();
  let totalPages = 1;
  let currentPage = 1;
  let keyword = '';

  const pagesBox = pager.querySelector('.pager-pages');
  const prevBtn = pager.querySelector('.pager-arrow.prev');
  const nextBtn = pager.querySelector('.pager-arrow.next');
  const input = document.getElementById('gallery-search');
  const clearBtn = document.getElementById('gallery-search-clear');
  const summary = document.getElementById('gallery-search-summary');
  const emptyTip = document.getElementById('gallery-empty');

  function loadThumb(card) {
    if (!card || card.dataset.thumbLoaded === '1') return;
    const bg = card.getAttribute('data-bg');
    if (!bg) return;
    card.style.backgroundImage = "url('" + bg + "')";
    card.dataset.thumbLoaded = '1';
  }

  function scrollToGrid() {
    const top = grid.getBoundingClientRect().top + window.pageYOffset - 96;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  function showPage(page) {
    currentPage = Math.min(Math.max(1, page), totalPages);
    allCards.forEach(function (card) { card.style.display = 'none'; });
    const start = (currentPage - 1) * PAGE_SIZE;
    list.slice(start, start + PAGE_SIZE).forEach(function (card) {
      card.style.display = '';
      loadThumb(card);
    });
    renderPager();
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (emptyTip) emptyTip.hidden = list.length > 0;
    pager.style.display = list.length ? '' : 'none';
  }

  function pageNumbers() {
    const out = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
      return out;
    }
    out.push(1);
    const s = Math.max(2, currentPage - 2);
    const e = Math.min(totalPages - 1, currentPage + 2);
    if (s > 2) out.push('…');
    for (let i = s; i <= e; i++) out.push(i);
    if (e < totalPages - 1) out.push('…');
    out.push(totalPages);
    return out;
  }

  function renderPager() {
    if (!pagesBox) return;
    pagesBox.innerHTML = '';
    if (!list.length) return;
    pageNumbers().forEach(function (p) {
      if (p === '…') {
        const dot = document.createElement('span');
        dot.className = 'pager-ellipsis';
        dot.textContent = '…';
        pagesBox.appendChild(dot);
        return;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pager-num' + (p === currentPage ? ' active' : '');
      b.textContent = String(p);
      b.setAttribute('aria-label', '第 ' + p + ' 页');
      b.addEventListener('click', function () { goTo(p); });
      pagesBox.appendChild(b);
    });
    pager.setAttribute('aria-label', (keyword ? '搜索结果分页' : '画廊分页') + '，共 ' + totalPages + ' 页');
  }

  function goTo(p) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    showPage(p);
    scrollToGrid();
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/\s+/g, '');
  }

  function runSearch(raw, scroll) {
    keyword = String(raw || '').trim();
    const q = norm(keyword);
    list = q ? allCards.filter(function (card) {
      return norm(card.getAttribute('data-name')).indexOf(q) !== -1;
    }) : allCards.slice();
    totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    currentPage = 1;
    if (clearBtn) clearBtn.hidden = !keyword;
    if (summary) {
      if (q && list.length) {
        summary.textContent = '搜索结果：' + list.length + ' 张';
        summary.hidden = false;
      } else {
        summary.textContent = '';
        summary.hidden = true;
      }
    }
    showPage(1);
    if (scroll) scrollToGrid();
    window.__galleryList = list;
  }

  prevBtn && prevBtn.addEventListener('click', function () { goTo(currentPage - 1); });
  nextBtn && nextBtn.addEventListener('click', function () { goTo(currentPage + 1); });

  let timer = null;
  if (input) {
    input.addEventListener('input', function () {
      if (clearBtn) clearBtn.hidden = !input.value.trim();
      clearTimeout(timer);
      timer = setTimeout(function () { runSearch(input.value, true); }, 220);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(timer);
        runSearch(input.value, true);
      } else if (e.key === 'Escape') {
        input.value = '';
        clearTimeout(timer);
        runSearch('', false);
      }
    });
  }
  clearBtn && clearBtn.addEventListener('click', function () {
    if (input) { input.value = ''; input.focus(); }
    clearTimeout(timer);
    runSearch('', false);
  });

  runSearch('', false);
})();
