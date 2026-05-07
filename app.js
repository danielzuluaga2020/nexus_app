/* ========================================
   NEXUS — app.js (Versión Prototipo Limpio)
   ======================================== */

const DEMO_USERS = [
  { id: 'admin', email: 'admin@nexus.app', password: 'admin123', name: 'Admin', role: 'admin', createdAt: new Date('2024-01-01').toISOString(), matches: [], likes: [], dislikes: [] }
];

const DEMO_PROFILES = [
  { id: 'p1', userId: 'u1', name: 'Valentina', age: 25, city: 'Bogotá', gender: 'mujer', showMe: 'hombres', lookingFor: 'relacion', bio: 'Diseñadora gráfica apasionada por el arte y los viajes.', interests: ['🎨 Arte', '✈️ Viajes', '☕ Café', '📚 Leer', '🎵 Música'], photo: '🎨', compat: 94, active: true, verified: true },
  { id: 'p2', userId: 'u2', name: 'Andrés', age: 29, city: 'Medellín', gender: 'hombre', showMe: 'mujeres', lookingFor: 'relacion', bio: 'Músico y desarrollador.', interests: ['🎸 Música', '💻 Tech', '🏃 Running', '🍕 Gastronomía', '🎬 Series'], photo: '🎸', compat: 91, active: true, verified: true },
  { id: 'p3', userId: 'u3', name: 'Camila', age: 26, city: 'Cali', gender: 'mujer', showMe: 'todos', lookingFor: 'amistad', bio: 'Investigadora científica de día, amante de la salsa de noche.', interests: ['🧪 Ciencia', '💃 Baile', '🌿 Naturaleza', '📷 Fotografía', '🧘 Yoga'], photo: '🧪', compat: 88, active: true, verified: false },
  { id: 'p4', userId: 'u4', name: 'Sebastián', age: 31, city: 'Barranquilla', gender: 'hombre', showMe: 'mujeres', lookingFor: 'casual', bio: 'Chef amateur, runner de fin de semana.', interests: ['🍜 Cocinar', '🏃 Running', '🎤 Karaoke', '🌙 Noche', '⚽ Fútbol'], photo: '🍜', compat: 85, active: false, verified: true }
];

let currentUser = null;
let users        = JSON.parse(localStorage.getItem('nexus_users')) || [...DEMO_USERS];
let profiles     = JSON.parse(localStorage.getItem('nexus_profiles')) || [...DEMO_PROFILES];
let messages     = JSON.parse(localStorage.getItem('nexus_messages')) || {};
let currentSection = 'home';

let setupData = { gender: null, showMe: null, interests: [], lookingFor: null, photos: [], step: 1 };
let smsConfirmationResult = null;
let countdownTimer = null;

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hidden'), 1800);
  generateParticles();

  const savedTheme = localStorage.getItem('nexus_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (document.getElementById('toggleLightMode')) document.getElementById('toggleLightMode').checked = savedTheme === 'light';

  window.addEventListener('scroll', () => document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40));

  const savedUser = localStorage.getItem('nexus_session');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    onLogin(currentUser, false);
  }

  setupScrollObserver();
  animateCounters();
  renderRecentProfiles();
  setupOTPInputs();
  initSetupModal();
  setupSettingsSliders();

  document.addEventListener('click', (e) => {
    const dd = document.getElementById('userDropdown');
    const btn = document.getElementById('btnUserMenu');
    if (dd && !dd.contains(e.target) && !btn.contains(e.target)) dd.classList.remove('show');
  });
});

function generateParticles() {
  const container = document.getElementById('particlesBg');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 80 + 20;
    p.style.cssText = `width:${size}px; height:${size}px; left:${Math.random() * 100}%; animation-duration:${Math.random() * 20 + 15}s; animation-delay:${Math.random() * 10}s;`;
    container.appendChild(p);
  }
}

window.showSection = function(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById('section' + capitalize(name));
  if (section) section.classList.add('active');

  const link = document.querySelector(`[data-section="${name}"]`);
  if (link) link.classList.add('active');

  currentSection = name;

  const footer = document.getElementById('mainFooter');
  if (footer) footer.style.display = ['home', 'about', 'stats'].includes(name) ? '' : 'none';

  const fab = document.getElementById('fabButton');
  if (fab) fab.classList.toggle('hidden', ['explore','matches','mymatches'].includes(name));

  document.getElementById('navMenu').classList.remove('open');

  if (name === 'explore')    renderProfiles();
  if (name === 'matches')    renderMatches();
  if (name === 'mymatches')  renderMyMatches();
  if (name === 'stats')      renderStats();
  if (name === 'admin')      renderAdmin();
  if (name === 'profile')    renderProfilePage();
  if (name === 'settings')   syncSettingsUI();

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
window.toggleNav = function() { document.getElementById('navMenu').classList.toggle('open'); };
window.toggleUserDropdown = function() { document.getElementById('userDropdown').classList.toggle('show'); };
window.toggleTheme = function(checkbox) {
  const theme = checkbox.checked ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('nexus_theme', theme);
};

window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('show'); document.body.style.overflow = 'hidden'; }
};
window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('show'); document.body.style.overflow = ''; }
};
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) { e.target.classList.remove('show'); document.body.style.overflow = ''; }
});

window.switchLoginMethod = function(method, btn) {
  document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('loginPhone').style.display = method === 'phone' ? '' : 'none';
  document.getElementById('loginEmail').style.display = method === 'email' ? '' : 'none';
};

window.loginWithGoogle = function() {
  const fakeGoogleUser = { id: 'google_' + Date.now(), email: 'usuario@gmail.com', name: 'Usuario Google', role: 'user', createdAt: new Date().toISOString(), matches: [], likes: [], dislikes: [], authProvider: 'google' };
  let existing = users.find(u => u.email === fakeGoogleUser.email);
  if (!existing) { users.push(fakeGoogleUser); saveUsers(); }
  const user = existing || fakeGoogleUser;
  onLogin(user, true);
  closeModal('loginModal');
  showToast('¡Bienvenido con Google! 🎉', 'success');
  if (!profiles.find(p => p.userId === user.id)) setTimeout(() => openProfileSetup(), 600);
};

window.sendSMS = async function() {
  const btn = document.getElementById('sendSmsBtn');
  const code = document.getElementById('countryCode').value;
  const num  = document.getElementById('phoneInput').value.replace(/\s/g, '');
  if (num.length < 7) { showToast('Ingresa un número válido', 'error'); return; }
  const fullPhone = code + num;
  setLoading(btn, true);

  try {
    await delay(1200);
    smsConfirmationResult = { _demoPhone: fullPhone, _demoCode: '123456' };
    showToast(`SMS enviado a ${fullPhone} ✓`, 'success');
    document.getElementById('phoneSentTo').textContent = fullPhone;
    document.getElementById('phoneStep1').style.display = 'none';
    document.getElementById('phoneStep2').style.display  = '';
    startCountdown();
    document.querySelector('.otp-input').focus();
  } catch (err) { showToast(friendlyError(err), 'error'); }
  setLoading(btn, false);
};

window.verifyOTPCode = async function() {
  const btn  = document.getElementById('verifyOtpBtn');
  const code = [...document.querySelectorAll('.otp-input')].map(i => i.value).join('');
  if (code.length < 6) { showToast('Ingresa los 6 dígitos', 'error'); return; }
  setLoading(btn, true);

  try {
    await delay(900);
    if (code !== smsConfirmationResult._demoCode && code !== '000000') throw new Error('auth/invalid-verification-code');
    const phone = smsConfirmationResult._demoPhone;
    let user = users.find(u => u.phone === phone);
    if (!user) {
      user = { id: 'ph_' + Date.now(), phone, name: 'Usuario', role: 'user', createdAt: new Date().toISOString(), matches: [], likes: [], dislikes: [] };
      users.push(user); saveUsers();
    }
    onLogin(user, true);
    closeModal('loginModal');
    showToast('¡Verificado! Bienvenido 👋', 'success');
    if (!profiles.find(p => p.userId === user.id)) setTimeout(() => openProfileSetup(), 600);
  } catch (err) {
    showToast('Código incorrecto. (Demo: usa 123456)', 'error');
    document.querySelectorAll('.otp-input').forEach(i => i.value = '');
    document.querySelector('.otp-input').focus();
  }
  setLoading(btn, false);
};

window.resendSMS = function() { sendSMS(); };

function startCountdown(seconds = 30) {
  clearInterval(countdownTimer);
  const el = document.getElementById('countdown');
  const rb  = document.getElementById('resendBtn');
  if (!el) return;
  el.style.display = ''; rb.style.display = 'none';
  let s = seconds;
  el.textContent = `Reenviar en ${s}s`;
  countdownTimer = setInterval(() => {
    s--;
    if (s <= 0) { clearInterval(countdownTimer); el.style.display = 'none'; rb.style.display  = ''; } 
    else { el.textContent = `Reenviar en ${s}s`; }
  }, 1000);
}

window.loginWithEmail = async function() {
  const btn   = document.getElementById('btnLogin');
  const email = document.getElementById('loginEmailInput').value.trim();
  const pass  = document.getElementById('loginPasswordInput').value;
  if (!email || !pass) { showToast('Completa todos los campos', 'error'); return; }
  await delay(600);
  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) { showToast('Email o contraseña incorrectos', 'error'); return; }
  onLogin(user, true);
  closeModal('loginModal');
  showToast(`Bienvenido, ${user.name} 👋`, 'success');
};

window.registerWithEmail = async function() {
  const email = document.getElementById('loginEmailInput').value.trim();
  const pass  = document.getElementById('loginPasswordInput').value;
  if (!email) { showToast('Ingresa tu correo', 'error'); return; }
  if (pass.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
  if (users.find(u => u.email === email)) { showToast('Ese correo ya está registrado', 'error'); return; }
  await delay(600);
  const user = { id: 'em_' + Date.now(), email, password: pass, name: email.split('@')[0], role: 'user', createdAt: new Date().toISOString(), matches: [], likes: [], dislikes: [] };
  users.push(user); saveUsers();
  onLogin(user, true);
  closeModal('loginModal');
  showToast('¡Cuenta creada! 🎉', 'success');
  setTimeout(() => openProfileSetup(), 600);
};

window.forgotPassword = async function() {
  const email = document.getElementById('loginEmailInput').value.trim();
  if (!email) { showToast('Primero ingresa tu correo', 'error'); return; }
  await delay(500);
  showToast(`Enlace de recuperación enviado a ${email} ✓`, 'success');
};

function onLogin(user, save) {
  currentUser = user;
  if (save) localStorage.setItem('nexus_session', JSON.stringify(user));
  document.getElementById('btnLogin').style.display    = 'none';
  document.getElementById('btnUserMenu').style.display  = '';
  document.getElementById('userNameNav').textContent    = user.name.split(' ')[0];
  document.getElementById('userAvatarNav').textContent  = user.name.charAt(0).toUpperCase();
  if (user.role === 'admin') document.getElementById('adminLink').style.display = '';
}

window.logout = function() {
  currentUser = null;
  localStorage.removeItem('nexus_session');
  document.getElementById('btnLogin').style.display   = '';
  document.getElementById('btnUserMenu').style.display = 'none';
  document.getElementById('userDropdown').classList.remove('show');
  document.getElementById('adminLink').style.display   = 'none';
  showSection('home');
  showToast('Sesión cerrada', 'info');
};

function setupOTPInputs() {
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((input, idx) => {
    input.addEventListener('input', () => {
      if (input.value && idx < inputs.length - 1) inputs[idx + 1].focus();
      if ([...inputs].map(i => i.value).join('').length === 6) verifyOTPCode();
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !input.value && idx > 0) inputs[idx - 1].focus(); });
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      [...inputs].forEach((inp, i) => inp.value = pasted[i] || '');
      if (pasted.length === 6) verifyOTPCode();
    });
  });
}

window.togglePassword = function(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
};

function setupScrollObserver() {
  const observer = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.12 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

function animateCounters() {
  const targets = { statUsers: 2400000, statMatches: 98000, statCountries: 48, statCouples: 124000 };
  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let start = 0; const step = target / 60;
    const timer = setInterval(() => { start += step; if (start >= target) { start = target; clearInterval(timer); } el.textContent = formatNumber(Math.floor(start)); }, 30);
  });
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'k';
  return n.toString();
}

function renderRecentProfiles() {
  const container = document.getElementById('recentProfilesHome');
  if (container) container.innerHTML = profiles.slice(0, 4).map(p => profileCardHTML(p)).join('');
}

function renderProfiles() {
  const container = document.getElementById('profilesList');
  if (!container) return;
  const search   = (document.getElementById('searchProfiles')?.value || '').toLowerCase();
  const gender   = document.getElementById('filterGender')?.value   || '';
  const interest = document.getElementById('filterInterest')?.value || '';
  const looking  = document.getElementById('filterLooking')?.value  || '';

  let filtered = profiles.filter(p => {
    if (gender && p.gender !== gender) return false;
    if (looking && p.lookingFor !== looking) return false;
    if (interest && !p.interests?.some(i => i.toLowerCase().includes(interest))) return false;
    if (search && !`${p.name} ${p.city} ${p.bio}`.toLowerCase().includes(search)) return false;
    if (currentUser && currentUser.dislikes?.includes(p.id)) return false;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-user-slash"></i><h3>Sin perfiles</h3><p>Prueba ajustando los filtros</p></div>`;
    return;
  }
  container.innerHTML = filtered.map(p => profileCardHTML(p)).join('');
}
window.filterProfiles = renderProfiles;

function profileCardHTML(p) {
  const liked = currentUser?.likes?.includes(p.id);
  const looking = { relacion:'💜 Relación', casual:'✨ Casual', amistad:'🤝 Amistad', ver:'🔍 Explorando' };
  return `
  <div class="profile-card-swipe" onclick="viewProfile('${p.id}')">
    <div class="profile-card-photo"><span style="font-size:5rem">${p.photo}</span><span class="age-badge">${p.age} años</span><span class="compat-badge">⚡ ${p.compat}%</span></div>
    <div class="profile-card-body">
      <h3>${p.name}</h3><div class="location"><i class="fas fa-map-marker-alt"></i> ${p.city}</div><div class="bio">${p.bio}</div>
      <div class="interests-row">${(p.interests||[]).slice(0,3).map(i => `<span class="interest-tag">${i}</span>`).join('')}</div>
      <div class="profile-card-footer">
        <span style="font-size:0.78rem;color:var(--gray-light)">${looking[p.lookingFor]||''}</span>
        <div class="action-btns-row" onclick="event.stopPropagation()">
          <button class="swipe-btn nope" onclick="doDislike('${p.id}')" title="Nope">✕</button>
          <button class="swipe-btn super" onclick="doSuper('${p.id}')" title="Super Nexus">⭐</button>
          <button class="swipe-btn like ${liked?'liked':''}" onclick="doLike('${p.id}')" title="Like" id="likeBtn_${p.id}">${liked ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>
  </div>`;
}

window.doLike = function(profileId) {
  if (!requireLogin()) return;
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  if (!currentUser.likes) currentUser.likes = [];
  if (currentUser.likes.includes(profileId)) return;
  currentUser.likes.push(profileId); saveCurrentUser();
  const btn = document.getElementById('likeBtn_' + profileId);
  if (btn) { btn.textContent = '♥'; btn.classList.add('liked'); }
  showToast(`Le diste like a ${profile.name} ♥`, 'success');
  if (Math.random() > 0.5) setTimeout(() => triggerMatch(profile), 800);
};

window.doDislike = function(profileId) {
  if (!requireLogin()) return;
  if (!currentUser.dislikes) currentUser.dislikes = [];
  currentUser.dislikes.push(profileId); saveCurrentUser();
  const card = document.querySelector(`[onclick="viewProfile('${profileId}')"]`);
  if (card) { card.style.opacity = '0'; card.style.transform = 'translateX(-30px)'; setTimeout(() => card.remove(), 300); }
};

window.doSuper = function(profileId) {
  if (!requireLogin()) return;
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  showToast(`⭐ Super Nexus enviado a ${profile.name}!`, 'info');
  setTimeout(() => triggerMatch(profile), 500);
};

function triggerMatch(profile) {
  if (!currentUser.matches) currentUser.matches = [];
  if (currentUser.matches.includes(profile.id)) return;
  currentUser.matches.push(profile.id); saveCurrentUser();
  document.getElementById('matchedName').textContent = profile.name;
  document.getElementById('myMatchAv').textContent    = currentUser.name.charAt(0);
  document.getElementById('theirMatchAv').textContent = profile.photo;
  openModal('matchModal');
}

window.viewProfile = function(profileId) {
  const p = profiles.find(pr => pr.id === profileId);
  if (!p) return;
  const looking = { relacion:'💜 Relación seria', casual:'✨ Algo casual', amistad:'🤝 Amistad', ver:'🔍 Explorando' };
  document.getElementById('viewProfileContent').innerHTML = `
    <div style="text-align:center;padding:24px 0 16px">
      <div style="font-size:6rem;margin-bottom:12px">${p.photo}</div>
      <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:700;letter-spacing:-0.04em;color:var(--white)">${p.name}, ${p.age}</h2>
      <p style="color:var(--gray-light);margin-top:4px"><i class="fas fa-map-marker-alt"></i> ${p.city}</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="padding:14px;background:var(--glass);border-radius:var(--radius);border:1px solid var(--glass-border)">
        <div style="font-size:0.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Compatibilidad</div>
        <div style="font-size:1.4rem;font-weight:700;color:var(--white)">⚡ ${p.compat}%</div>
      </div>
      <div style="padding:14px;background:var(--glass);border-radius:var(--radius);border:1px solid var(--glass-border)">
        <div style="font-size:0.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Busca</div>
        <div style="font-size:0.95rem;font-weight:600;color:var(--white)">${looking[p.lookingFor]||'-'}</div>
      </div>
    </div>
    <div style="padding:16px;background:var(--glass);border-radius:var(--radius);border:1px solid var(--glass-border);margin-bottom:16px">
      <div style="font-size:0.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Bio</div>
      <p style="color:var(--light);line-height:1.75;font-size:0.95rem">${p.bio}</p>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:0.72rem;color:var(--gray);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Intereses</div>
      <div class="interests-row">${(p.interests||[]).map(i=>`<span class="interest-tag">${i}</span>`).join('')}</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline" style="flex:1" onclick="doDislike('${p.id}');closeModal('viewProfileModal')">✕ Nope</button>
      <button class="btn btn-primary" style="flex:1" onclick="doLike('${p.id}');closeModal('viewProfileModal')">♥ Like</button>
    </div>
  `;
  openModal('viewProfileModal');
};

function renderMatches() {
  const container = document.getElementById('matchesContainer');
  if (!container) return;
  if (!currentUser) { container.innerHTML = needLoginHTML(); return; }
  renderMyMatchesList(container);
}

function renderMyMatches() {
  const container = document.getElementById('myMatchesList');
  if (!container) return;
  if (!currentUser) { container.innerHTML = needLoginHTML(); return; }
  renderMyMatchesList(container);
}

function renderMyMatchesList(container) {
  const matchIds = currentUser.matches || [];
  if (matchIds.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-heart"></i><h3>Aún no tienes matches</h3><p>Explora perfiles y da likes para encontrar tu nexo</p><button class="btn btn-primary" onclick="showSection('explore')" style="margin-top:16px"><i class="fas fa-compass"></i> Explorar</button></div>`;
    return;
  }
  const matchedProfiles = profiles.filter(p => matchIds.includes(p.id));
  container.innerHTML = `<div class="matches-list">${matchedProfiles.map(p => `
      <div class="match-item" onclick="openChat('${p.id}')">
        <div class="match-avatar">${p.photo}</div>
        <div class="match-info"><h4>${p.name}, ${p.age}</h4><p>${getLastMessage(p.id) || 'Toca para empezar...'}</p></div>
        <div><div class="match-time">${getLastMessageTime(p.id)}</div>${hasUnread(p.id) ? '<div class="match-unread" style="margin-top:6px;margin-left:auto"></div>' : ''}</div>
      </div>`).join('')}</div>`;
}

window.openChat = function(profileId) {
  if (!requireLogin()) return;
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  const chatKey = [currentUser.id, profileId].sort().join('_');
  const msgs = messages[chatKey] || [];
  document.getElementById('viewProfileContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--glass-border)">
      <div style="font-size:2rem">${profile.photo}</div><div><div style="font-weight:700;color:var(--white)">${profile.name}, ${profile.age}</div><div style="font-size:0.8rem;color:var(--gray-light)">📍 ${profile.city}</div></div>
    </div>
    <div class="chat-area" id="chatArea">
      ${msgs.length === 0 ? `<div style="text-align:center;color:var(--gray);padding:40px 0"><i class="fas fa-heart" style="font-size:2rem;margin-bottom:12px;display:block"></i>¡Es un match!</div>` : ''}
      ${msgs.map(m => `<div class="msg ${m.from === currentUser.id ? 'me' : 'them'}"><div class="msg-bubble">${m.text}</div><div class="msg-time">${formatTime(m.ts)}</div></div>`).join('')}
    </div>
    <div class="chat-input-row">
      <input class="chat-input" id="chatInput" placeholder="Escribe algo..." onkeydown="if(event.key==='Enter')sendMsg('${profileId}')">
      <button class="btn btn-primary" style="height:44px;padding:0 18px" onclick="sendMsg('${profileId}')"><i class="fas fa-paper-plane"></i></button>
    </div>
  `;
  openModal('viewProfileModal');
  const chatArea = document.getElementById('chatArea');
  if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
};

window.sendMsg = function(profileId) {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  const chatKey = [currentUser.id, profileId].sort().join('_');
  if (!messages[chatKey]) messages[chatKey] = [];
  messages[chatKey].push({ from: currentUser.id, text, ts: Date.now(), read: false });
  localStorage.setItem('nexus_messages', JSON.stringify(messages));
  input.value = ''; openChat(profileId);
  setTimeout(() => {
    messages[chatKey].push({ from: profileId, text: '¡Hola! Qué bueno que escribiste 😊', ts: Date.now(), read: false });
    localStorage.setItem('nexus_messages', JSON.stringify(messages));
    openChat(profileId);
  }, 1500);
};

function getLastMessage(profileId) { const chatKey = [currentUser?.id, profileId].sort().join('_'); const msgs = messages[chatKey] || []; return msgs.length ? msgs[msgs.length - 1].text : null; }
function getLastMessageTime(profileId) { const chatKey = [currentUser?.id, profileId].sort().join('_'); const msgs = messages[chatKey] || []; return msgs.length ? formatTime(msgs[msgs.length - 1].ts) : 'Nuevo'; }
function hasUnread(profileId) { const chatKey = [currentUser?.id, profileId].sort().join('_'); return (messages[chatKey] || []).some(m => m.from !== currentUser?.id && !m.read); }

function renderStats() {
  const totalMatches = profiles.reduce((acc, _) => acc + Math.floor(Math.random() * 50 + 10), 0);
  animateNumber('totalUsersStat', users.length + 2400000); animateNumber('totalMatchesStat', totalMatches);
  animateNumber('totalMsgStat', totalMatches * 8); animateNumber('totalCouplesStat', Math.floor(totalMatches * 0.03));
  animateNumber('impactActive', Math.floor(users.length * 0.4) + 1200); animateNumber('impactNew', Math.floor(users.length * 0.1) + 48);
  renderInterestChart(); renderLookingChart();
}

function renderInterestChart() {
  const container = document.getElementById('interestChart'); if (!container) return;
  const interestCount = {}; profiles.forEach(p => (p.interests || []).forEach(i => { interestCount[i] = (interestCount[i] || 0) + 1; }));
  const sorted = Object.entries(interestCount).sort((a,b) => b[1]-a[1]).slice(0, 6); const max = sorted[0]?.[1] || 1;
  container.innerHTML = `<div class="chart-bar-container">${sorted.map(([label, count]) => `<div class="chart-bar-row"><span class="chart-bar-label">${label}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(count/max*100).toFixed(0)}%">${count}</div></div></div>`).join('')}</div>`;
}

function renderLookingChart() {
  const container = document.getElementById('lookingChart'); if (!container) return;
  const map = { relacion:'💜 Relación seria', casual:'✨ Casual', amistad:'🤝 Amistad', ver:'🔍 Explorando' };
  const counts = {}; profiles.forEach(p => { counts[p.lookingFor] = (counts[p.lookingFor] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]); const max = sorted[0]?.[1] || 1;
  container.innerHTML = `<div class="chart-bar-container">${sorted.map(([key, count]) => `<div class="chart-bar-row"><span class="chart-bar-label">${map[key]||key}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(count/max*100).toFixed(0)}%">${count}</div></div></div>`).join('')}</div>`;
}

function renderProfilePage() {
  if (!currentUser) return;
  document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('profileName').textContent   = currentUser.name;
  document.getElementById('profileEmail').textContent  = currentUser.email || currentUser.phone || '';
  document.getElementById('profileBadge').textContent  = currentUser.role === 'admin' ? '👑 Admin' : '✓ Miembro';
  const myProfile = profiles.find(p => p.userId === currentUser.id);
  if (myProfile) document.getElementById('profileCity').textContent = '📍 ' + myProfile.city;
  document.getElementById('profileMatches').textContent = (currentUser.matches || []).length;
  document.getElementById('profileLikes').textContent   = (currentUser.likes   || []).length;
  document.getElementById('profileDate').textContent    = formatDate(currentUser.createdAt);
}

function setupSettingsSliders() {
  const distRange = document.getElementById('distRange');
  if (distRange) { distRange.addEventListener('input', () => { document.getElementById('distVal').textContent = distRange.value; document.getElementById('distValDisplay').textContent = distRange.value + 'km'; }); }
}
function updateAgeLabel() {
  const mn = document.getElementById('ageMinRange')?.value || 18; const mx = document.getElementById('ageMaxRange')?.value || 40;
  if (document.getElementById('ageMinVal')) document.getElementById('ageMinVal').textContent = mn;
  if (document.getElementById('ageMaxVal')) document.getElementById('ageMaxVal').textContent = mx;
}
window.updateAgeLabel = updateAgeLabel;
window.updateRangeLabel = function(rangeId, labelId, suffix = '') {
  const val = document.getElementById(rangeId)?.value;
  if (document.getElementById(labelId)) document.getElementById(labelId).textContent = val;
  if (document.getElementById(rangeId.replace('Range', 'ValDisplay'))) document.getElementById(rangeId.replace('Range', 'ValDisplay')).textContent = val + suffix;
};
function syncSettingsUI() {
  const theme = document.documentElement.getAttribute('data-theme');
  if (document.getElementById('toggleLightMode')) document.getElementById('toggleLightMode').checked = theme === 'light';
}

window.confirmAction = function(title, msg, callback) {
  document.getElementById('confirmTitle').textContent = title; document.getElementById('confirmMessage').textContent = msg;
  const btn = document.getElementById('confirmAction');
  btn.onclick = () => { closeModal('confirmModal'); callback(); };
  openModal('confirmModal');
};
window.deleteAccount = function() { users = users.filter(u => u.id !== currentUser.id); saveUsers(); logout(); showToast('Cuenta eliminada', 'info'); };

window.switchAdminTab = function(tabId) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[onclick="switchAdminTab('${tabId}')"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
  if (tabId === 'adminUsers') renderAdminUsers(); if (tabId === 'adminProfiles') renderAdminProfiles(); if (tabId === 'adminOverview') renderAdminOverview();
};
function renderAdmin() { if (!currentUser || currentUser.role !== 'admin') { showSection('home'); showToast('Acceso denegado', 'error'); return; } renderAdminUsers(); }
function renderAdminUsers() {
  const query = document.getElementById('adminSearchUsers')?.value.toLowerCase() || ''; const tbody = document.getElementById('adminUsersTable'); if (!tbody) return;
  tbody.innerHTML = users.filter(u => `${u.name} ${u.email} ${u.phone||''}`.toLowerCase().includes(query)).map(u => `
    <tr><td><div class="user-avatar" style="width:32px;height:32px;font-size:0.85rem">${u.name.charAt(0)}</div></td><td style="font-weight:600;color:var(--white)">${u.name}</td><td style="color:var(--gray-light)">${u.email || u.phone || '-'}</td><td><span style="padding:3px 10px;border-radius:999px;background:var(--glass);font-size:0.75rem;border:1px solid var(--glass-border)">${u.role==='admin'?'👑 Admin':'Usuario'}</span></td><td>${(u.matches||[]).length}</td><td style="color:var(--gray-light)">${formatDate(u.createdAt)}</td><td><div style="display:flex;gap:6px"><button class="action-btn action-btn-delete" onclick="adminDeleteUser('${u.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}
window.renderAdminUsers = renderAdminUsers;

function renderAdminProfiles() {
  const query = document.getElementById('adminSearchProfiles')?.value.toLowerCase() || ''; const tbody = document.getElementById('adminProfilesTable'); if (!tbody) return;
  tbody.innerHTML = profiles.filter(p => `${p.name} ${p.city}`.toLowerCase().includes(query)).map(p => `
    <tr><td style="font-weight:600;color:var(--white)">${p.photo} ${p.name}</td><td>${p.age}</td><td style="color:var(--gray-light)">${p.city}</td><td>${p.gender}</td><td><span style="padding:3px 10px;border-radius:999px;background:var(--glass);font-size:0.75rem;border:1px solid var(--glass-border);color:${p.active?'#86efac':'#fca5a5'}">${p.active?'Activo':'Inactivo'}</span></td><td><div style="display:flex;gap:6px"><button class="action-btn action-btn-delete" onclick="adminDeleteProfile('${p.id}')"><i class="fas fa-trash"></i></button></div></td></tr>`).join('');
}
window.renderAdminProfiles = renderAdminProfiles;

function renderAdminOverview() {
  document.getElementById('overviewUsers').textContent = users.length;
  document.getElementById('overviewMatches').textContent = users.reduce((a, u) => a + (u.matches||[]).length, 0);
  document.getElementById('overviewVerified').textContent = profiles.filter(p => p.verified).length;
}

window.adminDeleteUser = function(id) { confirmAction('¿Eliminar usuario?', 'Esta acción no se puede deshacer.', () => { users = users.filter(u => u.id !== id); saveUsers(); renderAdminUsers(); showToast('Usuario eliminado', 'success'); }); };
window.adminDeleteProfile = function(id) { confirmAction('¿Eliminar perfil?', 'Esta acción no se puede deshacer.', () => { profiles = profiles.filter(p => p.id !== id); saveProfiles(); renderAdminProfiles(); showToast('Perfil eliminado', 'success'); }); };

function openProfileSetup() {
  setupData = { gender: null, showMe: null, interests: [], lookingFor: null, photos: [], step: 1 };
  updateSetupProgress(1);
  document.querySelectorAll('.setup-step').forEach((s, i) => { s.style.display = i === 0 ? '' : 'none'; });
  openModal('profileSetupModal');
}
window.handleNewProfile = function() { if (!requireLogin()) return; openProfileSetup(); };
window.handleStartMatch = function() { if (!currentUser) { openModal('loginModal'); return; } showSection('explore'); };

function initSetupModal() {
  const interests = ['🎵 Música','🎮 Gaming','📚 Leer','✈️ Viajes','🍕 Gastronomía','🎨 Arte','💪 Gym','🧘 Yoga','🐶 Mascotas','🌿 Naturaleza'];
  const grid = document.getElementById('interestsGrid');
  if (grid) grid.innerHTML = interests.map(i => `<button class="interest-chip" onclick="toggleInterest(this,'${i}')">${i}</button>`).join('');
  setupChoiceGrid('genderGrid', (val) => setupData.gender = val);
  setupChoiceGrid('showMeGrid', (val) => setupData.showMe = val);
  setupChoiceGrid('lookingGrid', (val) => setupData.lookingFor = val);
}

function setupChoiceGrid(gridId, setter) {
  const grid = document.getElementById(gridId); if (!grid) return;
  grid.addEventListener('click', (e) => { const btn = e.target.closest('.choice-btn'); if (!btn) return; grid.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); setter(btn.dataset.val); });
}

window.toggleInterest = function(chip, val) {
  if (chip.classList.contains('selected')) { chip.classList.remove('selected'); setupData.interests = setupData.interests.filter(i => i !== val); } 
  else { if (setupData.interests.length >= 10) { showToast('Máximo 10', 'error'); return; } chip.classList.add('selected'); setupData.interests.push(val); }
};

window.setupNext = function(step) {
  if (step === 1) { setupData.name = document.getElementById('setupName').value.trim(); setupData.age = 25; setupData.city = document.getElementById('setupCity')?.value.trim() || 'Colombia'; }
  document.getElementById(`setupStep${step}`).style.display = 'none';
  document.getElementById(`setupStep${step + 1}`).style.display = '';
  updateSetupProgress(step + 1);
};

window.setupPrev = function(step) {
  document.getElementById(`setupStep${step}`).style.display = 'none';
  document.getElementById(`setupStep${step - 1}`).style.display = '';
  updateSetupProgress(step - 1);
};

function updateSetupProgress(step) {
  const pct = Math.round((step / 5) * 100);
  document.getElementById('setupStepLabel').textContent = `Paso ${step} de 5`; document.getElementById('setupStepPct').textContent = pct + '%'; document.getElementById('setupProgressFill').style.width = pct + '%';
}

window.finishSetup = async function() {
  const btn = document.getElementById('finishSetupBtn'); setLoading(btn, true); await delay(1000);
  const newProfile = { id: 'p' + Date.now(), userId: currentUser.id, name: setupData.name, age: setupData.age, city: setupData.city, gender: setupData.gender, showMe: setupData.showMe, lookingFor: setupData.lookingFor, bio: 'Aquí para conectar ✨', interests: setupData.interests, photo: '😊', compat: 85, active: true, verified: false };
  profiles.push(newProfile); saveProfiles();
  currentUser.name = setupData.name; saveCurrentUser();
  document.getElementById('userNameNav').textContent = setupData.name.split(' ')[0]; document.getElementById('userAvatarNav').textContent = setupData.name.charAt(0).toUpperCase();
  setLoading(btn, false); closeModal('profileSetupModal'); showToast('¡Perfil creado! 🎉', 'success'); setTimeout(() => showSection('explore'), 600);
};

window.showToast = function(msg, type = 'info') {
  const container = document.getElementById('toastContainer'); if (!container) return;
  const toast = document.createElement('div'); toast.className = `toast toast-${type}`;
  const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' }; toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${msg}`;
  container.appendChild(toast); setTimeout(() => toast.remove(), 3800);
};

function requireLogin() { if (currentUser) return true; openModal('loginModal'); showToast('Inicia sesión para continuar', 'info'); return false; }
function needLoginHTML() { return `<div class="empty-state"><i class="fas fa-lock"></i><h3>Inicia sesión</h3><button class="btn btn-primary" onclick="openModal('loginModal')"><i class="fas fa-sign-in-alt"></i> Entrar</button></div>`; }
function setLoading(btn, loading) { if (!btn) return; if (loading) { btn._orig = btn.innerHTML; btn.innerHTML = '...'; btn.disabled = true; } else { btn.innerHTML = btn._orig || btn.innerHTML; btn.disabled = false; } }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function formatDate(iso) { return iso ? new Date(iso).toLocaleDateString('es', { month:'short', year:'numeric' }) : '-'; }
function formatTime(ts) { return ts ? new Date(ts).toLocaleTimeString('es', { hour:'2-digit', minute:'2-digit' }) : ''; }
function friendlyError(err) { return err?.message || 'Algo salió mal. Intenta de nuevo'; }

function saveUsers() { localStorage.setItem('nexus_users', JSON.stringify(users)); }
function saveProfiles() { localStorage.setItem('nexus_profiles', JSON.stringify(profiles)); }
function saveCurrentUser() { const idx = users.findIndex(u => u.id === currentUser.id); if (idx > -1) users[idx] = currentUser; saveUsers(); localStorage.setItem('nexus_session', JSON.stringify(currentUser)); }