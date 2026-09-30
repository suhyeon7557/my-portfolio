const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
});
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('is-open')));

const rail = document.querySelector('.project-rail');
let isDown = false, startX, scrollStart, hasDragged = false;
rail?.addEventListener('pointerdown', (event) => { isDown = true; hasDragged = false; startX = event.clientX; scrollStart = rail.scrollLeft; rail.setPointerCapture(event.pointerId); rail.classList.add('dragging'); });
rail?.addEventListener('pointermove', (event) => { if (isDown) { const distance = event.clientX - startX; if (Math.abs(distance) > 6) hasDragged = true; rail.scrollLeft = scrollStart - distance; } });
rail?.addEventListener('pointerup', (event) => { isDown = false; rail.classList.remove('dragging'); if (!hasDragged) { const card = document.elementFromPoint(event.clientX, event.clientY)?.closest('.project-card'); if (card?.href) window.location.assign(card.href); } });
document.querySelectorAll('.rail-control').forEach(button => button.addEventListener('click', () => {
  const card = rail?.querySelector('.project-card');
  if (!rail || !card) return;
  rail.scrollBy({ left: button.dataset.direction === 'next' ? card.getBoundingClientRect().width + 18 : -(card.getBoundingClientRect().width + 18), behavior: 'smooth' });
}));
document.querySelectorAll('.project-tabs button').forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  document.querySelectorAll('.project-tabs button').forEach(tab => tab.classList.toggle('is-active', tab === button));
  document.querySelectorAll('.project-card[data-category]').forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
  if (rail) rail.scrollLeft = 0;
}));

const projectPreviewVideos = [...document.querySelectorAll('.project-rail .project-card video')];
const playOnlyPreview = (activeVideo) => {
  projectPreviewVideos.forEach(video => { if (video !== activeVideo && !video.paused) video.pause(); });
  activeVideo?.play().catch(() => { /* Muted preview playback can be unavailable until visible. */ });
};
const syncVisiblePreview = () => {
  if (!rail) return;
  const railCenter = rail.getBoundingClientRect().left + rail.getBoundingClientRect().width / 2;
  const cards = [...rail.querySelectorAll('.project-card:not([hidden])')];
  const activeCard = cards.sort((a, b) => Math.abs((a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2) - railCenter) - Math.abs((b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2) - railCenter))[0];
  playOnlyPreview(activeCard?.querySelector('video'));
};
if (rail) {
  rail.addEventListener('scroll', () => requestAnimationFrame(syncVisiblePreview), { passive: true });
  window.addEventListener('load', syncVisiblePreview, { once: true });
  requestAnimationFrame(syncVisiblePreview);
}
document.querySelectorAll('.project-detail video').forEach(video => video.addEventListener('play', () => {
  document.querySelectorAll('.project-detail video').forEach(other => { if (other !== video && !other.paused) other.pause(); });
}));

const contactModal = document.querySelector('.contact-modal');
const contactForm = document.querySelector('.contact-form');
const closeContact = () => { contactModal?.classList.remove('is-open'); contactModal?.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); };
document.querySelectorAll('[data-open-contact]').forEach(link => link.addEventListener('click', (event) => { event.preventDefault(); contactModal?.classList.add('is-open'); contactModal?.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); contactModal?.querySelector('input[name="name"]')?.focus(); }));
document.querySelectorAll('[data-close-contact]').forEach(button => button.addEventListener('click', closeContact));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeContact(); });
contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = contactForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(contactForm)).toString() });
    contactForm.querySelectorAll('label, button').forEach(element => element.hidden = true);
    contactForm.querySelector('.form-success').hidden = false;
  } catch { submit.disabled = false; submit.textContent = 'PLEASE TRY AGAIN'; }
});

const bgm = document.querySelector('#global-bgm');
const soundControl = document.querySelector('.sound-control');
if (bgm && soundControl) {
  const BGM_VOLUME = 0.8;
  const FADE_DURATION = 700;
  const playlist = [
    { title: 'CREATIVE TECHNOLOGY SHOWREEL', src: 'music/pumpupthemind-creative-technology-showreel-241274.mp3' },
    { title: 'HAZY AFTER HOURS', src: 'music/mixkit-hazy-after-hours-132.mp3' },
    { title: 'VASTNESS', src: 'music/mixkit-vastness-184.mp3' },
    { title: 'WINE PON ME', src: 'music/mixkit-wine-pon-me-333.mp3' },
    { title: 'DEEP FUTURE GARAGE', src: 'music/nveravetyanmusic-deep-future-garage-royalty-free-music-163081.mp3' },
    { title: 'LAZY DAY — FUTURISTIC CHILL', src: 'music/penguinmusic-lazy-day-stylish-futuristic-chill-239287.mp3' },
    { title: 'AMBIENT SCI-FI ELECTRONIC DREAMER', src: 'music/uniquecreativeaudio-ambient-sci-fi-electronic-dreamer-calm-synth-instrumental-294746.mp3' },
  ];
  const preferenceKey = 'suhyun-portfolio-sound-preference-v2';
  const trackKey = 'suhyun-portfolio-sound-track';
  const playButton = document.querySelector('[data-bgm-play]');
  const titleElement = document.querySelector('[data-bgm-title]');
  let userSoundOff = false;
  let manuallyStopped = false;
  let pausedByVideo = false;
  let fadeToken = 0;
  let trackIndex = 0;
  let resumeWhenReady = false;
  try {
    userSoundOff = localStorage.getItem(preferenceKey) === 'off';
    const savedTrack = Number(localStorage.getItem(trackKey));
    if (Number.isInteger(savedTrack) && savedTrack >= 0 && savedTrack < playlist.length) trackIndex = savedTrack;
  } catch { /* Storage can be unavailable in private contexts. */ }
  if (document.querySelector('#top')) trackIndex = 0;

  const positionKey = () => `suhyun-portfolio-sound-position-${trackIndex}`;
  const videosArePlaying = () => [...document.querySelectorAll('video')].some(video => !video.muted && !video.paused && !video.ended && video.readyState > 2);
  const updatePlayer = () => {
    const playing = !bgm.paused && bgm.volume > 0.01;
    soundControl.classList.toggle('is-off', userSoundOff);
    soundControl.classList.toggle('is-playing', playing);
    soundControl.setAttribute('aria-pressed', String(!userSoundOff));
    soundControl.setAttribute('aria-label', userSoundOff ? '배경음악 켜기' : '배경음악 끄기');
    soundControl.querySelector('[data-sound-state]').textContent = userSoundOff ? 'OFF' : 'ON';
    if (titleElement) { titleElement.textContent = playlist[trackIndex].title; titleElement.title = playlist[trackIndex].title; }
    if (playButton) { playButton.textContent = playing ? 'Ⅱ' : '▶'; playButton.setAttribute('aria-label', playing ? '일시정지' : '재생'); }
  };
  const fadeVolume = (to, done) => {
    const token = ++fadeToken;
    const from = bgm.volume;
    const started = performance.now();
    const step = (now) => {
      if (token !== fadeToken) return;
      const progress = Math.min((now - started) / FADE_DURATION, 1);
      bgm.volume = from + (to - from) * progress;
      updatePlayer();
      if (progress < 1) requestAnimationFrame(step); else done?.();
    };
    requestAnimationFrame(step);
  };
  const pauseForVideo = () => {
    pausedByVideo = true;
    fadeVolume(0, () => { if (pausedByVideo || userSoundOff || manuallyStopped) bgm.pause(); });
  };
  const resumeBgm = async () => {
    if (userSoundOff || manuallyStopped || videosArePlaying()) return;
    pausedByVideo = false;
    fadeToken += 1;
    bgm.volume = 0;
    try { await bgm.play(); fadeVolume(BGM_VOLUME); } catch { updatePlayer(); }
  };
  const loadTrack = (nextIndex, shouldPlay = true) => {
    trackIndex = (nextIndex + playlist.length) % playlist.length;
    resumeWhenReady = shouldPlay && !userSoundOff && !manuallyStopped && !videosArePlaying();
    fadeToken += 1;
    bgm.pause();
    bgm.src = playlist[trackIndex].src;
    bgm.load();
    try { localStorage.setItem(trackKey, String(trackIndex)); } catch { /* Track stays selected for this page. */ }
    updatePlayer();
  };
  const checkVideosBeforeResuming = () => requestAnimationFrame(() => { if (!videosArePlaying() && !userSoundOff && !manuallyStopped) resumeBgm(); });

  [...document.querySelectorAll('video:not([muted])')].forEach(video => {
    video.addEventListener('play', pauseForVideo);
    video.addEventListener('pause', checkVideosBeforeResuming);
    video.addEventListener('ended', checkVideosBeforeResuming);
  });
  bgm.addEventListener('play', updatePlayer);
  bgm.addEventListener('pause', updatePlayer);
  bgm.addEventListener('timeupdate', () => { try { sessionStorage.setItem(positionKey(), String(bgm.currentTime)); } catch { /* Ignore unavailable session storage. */ } });
  bgm.addEventListener('ended', () => loadTrack(trackIndex + 1));
  bgm.addEventListener('loadedmetadata', () => {
    try {
      const savedPosition = Number(sessionStorage.getItem(positionKey()));
      if (Number.isFinite(savedPosition) && savedPosition > 0 && savedPosition < bgm.duration) bgm.currentTime = savedPosition;
    } catch { /* Start at the beginning when no saved position is available. */ }
    if (videosArePlaying()) pauseForVideo();
    else if (resumeWhenReady || (!userSoundOff && !manuallyStopped)) resumeBgm();
    resumeWhenReady = false;
  });
  soundControl.addEventListener('click', () => {
    userSoundOff = !userSoundOff;
    if (!userSoundOff) manuallyStopped = false;
    try { localStorage.setItem(preferenceKey, userSoundOff ? 'off' : 'on'); } catch { /* Preference remains active for this page. */ }
    if (userSoundOff) fadeVolume(0, () => bgm.pause()); else resumeBgm();
    updatePlayer();
  });
  document.querySelector('[data-bgm-previous]')?.addEventListener('click', () => loadTrack(trackIndex - 1));
  document.querySelector('[data-bgm-next]')?.addEventListener('click', () => loadTrack(trackIndex + 1));
  playButton?.addEventListener('click', () => {
    if (!bgm.paused) { manuallyStopped = true; bgm.pause(); }
    else { manuallyStopped = false; userSoundOff = false; try { localStorage.setItem(preferenceKey, 'on'); } catch { /* Continue without persistence. */ } resumeBgm(); }
    updatePlayer();
  });
  document.querySelector('[data-bgm-stop]')?.addEventListener('click', () => {
    manuallyStopped = true;
    fadeVolume(0, () => { bgm.pause(); bgm.currentTime = 0; updatePlayer(); });
    try { sessionStorage.setItem(positionKey(), '0'); } catch { /* Continue without persistence. */ }
  });
  const firstInteraction = (event) => { if (!(event.target instanceof Element && event.target.closest('.sound-player')) && !userSoundOff && !manuallyStopped && !videosArePlaying()) resumeBgm(); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(eventName => document.addEventListener(eventName, firstInteraction, { once: true, passive: true }));
  window.addEventListener('pagehide', () => { try { sessionStorage.setItem(positionKey(), String(bgm.currentTime)); } catch { /* Ignore unavailable session storage. */ } });
  loadTrack(trackIndex, true);
  updatePlayer();
}
