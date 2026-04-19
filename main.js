// ── MAP POPUPS ──
const mapPins = [
  { icon: '🏛️', name: 'Università degli Studi di Siena', addr: 'Via Banchi di Sotto 55', note: 'Main university buildings & secretariat' },
  { icon: '📄', name: 'Agenzia delle Entrate', addr: 'Via Massetana Romana 12', note: 'Get your Codice Fiscale here (free, same day)' },
  { icon: '🚌', name: 'Piazza Gramsci Bus Terminal', addr: 'Piazza Antonio Gramsci', note: 'Main hub for all urban & regional Tiemme buses' },
  { icon: '🏥', name: 'Policlinico Le Scotte', addr: 'Viale Mario Bracci 16', note: 'Main hospital — Emergency: 118' },
  { icon: '🍽️', name: 'Mensa di San Miniato', addr: 'Via San Miniato', note: 'University canteen — subsidised meals from €1' },
  { icon: '🏦', name: 'Monte dei Paschi di Siena', addr: 'Piazza Salimbeni', note: "World's oldest bank — student accounts available" },
];

function mapPopup(i) {
  const p = mapPins[i];
  document.getElementById('popup-content').innerHTML =
    `<strong style="font-size:.9rem;color:#1A1208;display:block;margin-bottom:.3rem">${p.icon} ${p.name}</strong>` +
    `<span style="color:#C4623A;font-size:.75rem">📍 ${p.addr}</span><br>` +
    `<span style="font-size:.78rem">${p.note}</span>`;
  document.getElementById('map-popup').style.display = 'block';
}

// ── NAVIGATION ──
function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initReveal, 50);
}

// ── REVEAL ON SCROLL ──
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .1 });
  document.querySelectorAll('.page.active .reveal:not(.visible)').forEach(el => obs.observe(el));
}
initReveal();

// ── GLOBAL SEARCH ──
const searchIndex = [
  { title: 'Codice Fiscale', sub: 'Documents · How to get your tax code', page: 'guide', icon: '🔢', action: () => { go('guide'); switchCat('documents', document.querySelector('.cat-tab')); } },
  { title: 'Permesso di Soggiorno', sub: 'Documents · Residence permit guide', page: 'guide', icon: '📋', action: () => { go('guide'); switchCat('documents', document.querySelector('.cat-tab')); } },
  { title: 'Residency Registration', sub: 'Documents · Register at the Comune', page: 'guide', icon: '🏛️', action: () => go('guide') },
  { title: 'Finding Accommodation', sub: 'Housing · Apartments, DSU, private rooms', page: 'guide', icon: '🏠', action: () => { go('guide'); switchCat('housing', document.querySelectorAll('.cat-tab')[1]); } },
  { title: 'Bus Pass (Abbonamento)', sub: 'Transport · Tiemme monthly pass', page: 'guide', icon: '🎫', action: () => { go('guide'); switchCat('transport', document.querySelectorAll('.cat-tab')[2]); } },
  { title: 'Opening a Bank Account', sub: 'Banking · MPS, N26, Revolut', page: 'guide', icon: '💳', action: () => { go('guide'); switchCat('banking', document.querySelectorAll('.cat-tab')[4]); } },
  { title: 'Registering with a GP', sub: 'Health · National Health Service access', page: 'guide', icon: '👨‍⚕️', action: () => { go('guide'); switchCat('health', document.querySelectorAll('.cat-tab')[3]); } },
  { title: 'Events & Activities', sub: 'Browse all upcoming student events', page: 'events', icon: '🎭', action: () => go('events') },
  { title: 'Community Forum', sub: 'Ask questions & connect with students', page: 'community', icon: '💬', action: () => go('community') },
  { title: 'About Us', sub: 'The founding team and our story', page: 'about', icon: '👥', action: () => go('about') },
  { title: 'Palio History Tour', sub: 'Events · Cultural — 14 Mar 2026', page: 'events', icon: '🏛️', action: () => go('events') },
  { title: 'International Coffee Hour', sub: 'Events · Social — 18 Mar 2026', page: 'events', icon: '☕', action: () => go('events') },
  { title: 'Bureaucracy Q&A Workshop', sub: 'Events · Academic — 19 Mar 2026', page: 'events', icon: '📚', action: () => go('events') },
];

function openSearch() {
  document.getElementById('search-overlay').classList.add('open');
  setTimeout(() => document.getElementById('search-main-input').focus(), 80);
}
function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('search-main-input').value = '';
  document.getElementById('search-results').innerHTML = '<div class="search-empty">Start typing to search across all pages…</div>';
}
function closeSearchOutside(e) { if (e.target.id === 'search-overlay') closeSearch(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });

function runSearch(q) {
  const box = document.getElementById('search-results');
  q = q.trim().toLowerCase();
  if (!q) { box.innerHTML = '<div class="search-empty">Start typing to search across all pages…</div>'; return; }
  const res = searchIndex.filter(i => i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q));
  if (!res.length) { box.innerHTML = '<div class="search-empty">No results for "' + q + '"</div>'; return; }
  box.innerHTML = res.map(r => `
    <div class="search-result-item">
      <div class="sri-icon">${r.icon}</div>
      <div class="sri-text"><div class="sri-title">${r.title}</div><div class="sri-sub">${r.sub}</div></div>
      <span class="sri-page">${r.page}</span>
    </div>`).join('');
  box.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.onclick = () => { res[i].action(); closeSearch(); };
  });
}

// ── GUIDE SEARCH ──
function searchGuide(q) {
  q = q.trim().toLowerCase();
  const noRes = document.getElementById('guide-no-results');
  const tabs = document.getElementById('cat-tabs');
  if (!q) {
    noRes.style.display = 'none'; tabs.style.display = 'flex';
    document.querySelectorAll('#guide .guide-section').forEach(s => s.style.display = '');
    document.querySelectorAll('#guide .gstep').forEach(s => s.style.display = '');
    return;
  }
  tabs.style.display = 'none';
  document.querySelectorAll('#guide .guide-section').forEach(s => { s.classList.remove('active'); s.style.display = 'block'; });
  let any = false;
  document.querySelectorAll('#guide .gstep').forEach(step => {
    const kw = (step.dataset.keywords || '') + ' ' + step.innerText;
    if (kw.toLowerCase().includes(q)) { step.style.display = 'block'; any = true; }
    else step.style.display = 'none';
  });
  noRes.style.display = any ? 'none' : 'block';
}

// ── GUIDE ACCORDION ──
function switchCat(cat, btn) {
  document.querySelectorAll('#guide .guide-section').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
  document.querySelectorAll('#guide .cat-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('cat-' + cat).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('guide-search-input').value = '';
  searchGuide('');
  document.getElementById('cat-tabs').style.display = 'flex';
}
function toggleStep(header) { header.parentElement.classList.toggle('open'); }

// ── EVENTS ──
const eventsData = [
  { cat: 'cultural', color: '#E8D5C0', emoji: '🏛️', date: 'SAT 14 MAR 2026', title: 'Palio Explained: History & Traditions', desc: "A guided tour through Siena's most famous event — the contrade, the race, and the centuries-old rivalry.", location: 'Piazza del Campo', time: '3:00 PM', free: true },
  { cat: 'social', color: '#D5E0C8', emoji: '☕', date: 'WED 18 MAR 2026', title: 'International Coffee Hour', desc: 'Informal meet-up for students from all over the world. Come and make new friends over an aperitivo.', location: 'Bar il Palio', time: '6:00 PM', free: true },
  { cat: 'academic', color: '#C8D5E0', emoji: '📚', date: 'THU 19 MAR 2026', title: 'Italian Bureaucracy Q&A Workshop', desc: 'International Office staff walk you through permesso di soggiorno, codice fiscale, and residency step by step.', location: 'Rettorato, Aula Magna', time: '10:00 AM', free: true },
  { cat: 'sport', color: '#E0D5C8', emoji: '🏃', date: 'SAT 21 MAR 2026', title: 'Siena Student 5K Run', desc: "A fun, non-competitive morning run through Siena's historic centre. All fitness levels welcome.", location: 'Fortezza Medicea', time: '9:00 AM', free: true },
  { cat: 'cultural', color: '#D5C8E0', emoji: '🍝', date: 'FRI 27 MAR 2026', title: 'Cooking Class: Tuscan Classics', desc: 'Learn to make handmade pici pasta and ribollita from a local chef. Maximum 12 participants.', location: 'Centro Culturale, Via Banchi di Sopra', time: '5:30 PM', free: false, price: '€15' },
  { cat: 'social', color: '#C8E0D5', emoji: '🎮', date: 'SAT 28 MAR 2026', title: 'International Game Night', desc: 'Board games, card games, and lots of laughter. Bring a favourite game from your home country to share.', location: 'ESN Siena HQ', time: '7:00 PM', free: true },
  { cat: 'academic', color: '#E0C8C8', emoji: '🗣️', date: 'TUE 1 APR 2026', title: 'Language Exchange Evening', desc: "Pair up with Italian students and practice each other's languages in a relaxed, structured format.", location: 'Biblioteca Comunale', time: '6:00 PM', free: true },
  { cat: 'sport', color: '#C8E0E0', emoji: '⚽', date: 'SUN 5 APR 2026', title: 'International Students Football Tournament', desc: '5-a-side football tournament open to all students. Form a team or join one at the event.', location: 'Campo Sportivo Fontebecci', time: '10:00 AM', free: true },
  { cat: 'cultural', color: '#E0D5C8', emoji: '🎭', date: 'FRI 10 APR 2026', title: 'Siena Theatre Night', desc: 'A performance by the university theatre group followed by a discussion with the cast.', location: 'Teatro dei Rinnovati', time: '8:30 PM', free: false, price: '€8 students' },
];

let evtFilter = 'all';
function filterEvents(cat, btn) {
  evtFilter = cat;
  document.querySelectorAll('#events .ftag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEvents();
}
function renderEvents() {
  const q = (document.getElementById('events-search-input') || { value: '' }).value.trim().toLowerCase();
  const grid = document.getElementById('events-grid');
  const noEv = document.getElementById('no-events');
  let filtered = evtFilter === 'all' ? eventsData : eventsData.filter(e => e.cat === evtFilter);
  if (q) filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
  grid.innerHTML = '';
  if (!filtered.length) { noEv.style.display = 'block'; return; }
  noEv.style.display = 'none';
  filtered.forEach(ev => {
    const c = document.createElement('div'); c.className = 'ecard';
    c.innerHTML =
      `<div class="ecard-banner" style="background:${ev.color}"><span style="font-size:3.2rem">${ev.emoji}</span><span class="ecard-cat">${ev.cat}</span></div>` +
      `<div class="ecard-body"><div class="ecard-date">${ev.date}</div><h3>${ev.title}</h3><p>${ev.desc}</p>` +
      `<div class="ecard-meta"><span>📍 ${ev.location}</span><span>🕐 ${ev.time}</span></div></div>` +
      `<div class="ecard-footer"><span class="price ${ev.free ? 'free' : ''}">${ev.free ? 'Free entry' : ev.price}</span>` +
      `<button class="rsvp-btn" onclick="this.classList.toggle('going');this.textContent=this.classList.contains('going')?'✓ Going':'RSVP'">RSVP</button></div>`;
    grid.appendChild(c);
  });
}
renderEvents();

// ── COMMUNITY ──
let posts = [
  { id: 1, author: 'Priya S.', initials: 'P', color: '#C4623A', country: '🇮🇳 India', time: '2 hours ago', tag: 'Tip', title: 'The codice fiscale is easier than it looks', body: "I was terrified about getting my codice fiscale but honestly it took 20 minutes at the Agenzia delle Entrate. Bring your passport and that's it. They give it to you on the spot!", likes: 14, liked: false, replies: [{ author: 'Amine B.', initials: 'A', color: '#6B8F71', body: 'Confirmed! Same for me, was super quick. Make sure to go early in the morning though, there can be a queue.' }] },
  { id: 2, author: 'Amine B.', initials: 'A', color: '#6B8F71', country: '🇹🇳 Tunisia', time: 'Yesterday', tag: 'Question', title: 'Where to find a good language exchange partner?', body: "I'm looking to improve my Italian while helping someone with French or Arabic. Is there a group at the university or should I just look on apps?", likes: 8, liked: false, replies: [{ author: 'Léa M.', initials: 'L', color: '#7B6EA6', body: 'There is a Language Exchange Evening event coming up — check the Events page! I found my exchange partner there last semester.' }] },
  { id: 3, author: 'Batmunkh G.', initials: 'B', color: '#5B8DB8', country: '🇲🇳 Mongolia', time: '2 days ago', tag: 'Housing', title: 'Warning: always request a registered contract', body: "My first landlord in Siena wanted to do a 'private agreement' with no official contract. Turned out I couldn't register at the Comune or use it for the permesso. Make sure any contract is officially registered!", likes: 31, liked: false, replies: [{ author: 'Kaito T.', initials: 'K', color: '#8B6A4A', body: 'This is so important! I made the same mistake. The Student Guide on this site explains exactly what a valid contract looks like.' }] },
  { id: 4, author: 'Léa M.', initials: 'L', color: '#7B6EA6', country: '🇫🇷 France', time: '3 days ago', tag: 'Social', title: 'Anyone want to explore the Crete Senesi together?', body: "I'd love to do a day trip to the Crete Senesi area this weekend. Looking for 2–3 people to share a car rental. The landscape is absolutely stunning in spring!", likes: 19, liked: false, replies: [] },
  { id: 5, author: 'Kaito T.', initials: 'K', color: '#8B6A4A', country: '🇯🇵 Japan', time: '4 days ago', tag: 'Documents', title: 'How long does the permesso di soggiorno actually take?', body: "I submitted my kit postale 6 weeks ago and still haven't received a date for the Questura appointment. Is this normal?", likes: 5, liked: false, replies: [{ author: 'Priya S.', initials: 'P', color: '#C4623A', body: '6–10 weeks is quite normal unfortunately. Keep the receipt safe — it acts as your temporary permit. You can call the Questura to check the status.' }, { author: 'Batmunkh G.', initials: 'B', color: '#5B8DB8', body: "Mine took 9 weeks. The university's International Office can sometimes help you follow up if it's taking unusually long." }] },
];

let postFilter = 'all';

function filterPostsBtn(tag, btn) {
  postFilter = tag;
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPosts();
}

function renderPosts() {
  const q = (document.getElementById('comm-search-input') || { value: '' }).value.trim().toLowerCase();
  const list = document.getElementById('posts-list');
  const nop = document.getElementById('no-posts');
  let filtered = postFilter === 'all' ? posts : posts.filter(p => p.tag === postFilter);
  if (q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
  list.innerHTML = '';
  if (!filtered.length) { nop.style.display = 'block'; return; }
  nop.style.display = 'none';
  filtered.forEach(p => {
    const el = document.createElement('div');
    el.className = 'post'; el.dataset.id = p.id;
    el.innerHTML =
      `<div class="post-top">` +
      `<div class="avatar" style="background:${p.color}">${p.initials}</div>` +
      `<div class="post-meta"><div class="post-author">${p.author} <span style="font-size:.75rem;color:var(--light);font-weight:300">${p.country}</span></div><div class="post-info">${p.time}</div></div>` +
      `<span class="post-tag">${p.tag}</span></div>` +
      `<h4>${p.title}</h4><p>${p.body}</p>` +
      `<div class="post-actions">` +
      `<button class="pa-btn like-btn${p.liked ? ' liked' : ''}" onclick="likePost(${p.id},this)">❤️ ${p.likes}</button>` +
      `<button class="pa-btn reply-toggle" onclick="toggleReplies(${p.id},this)">💬 ${p.replies.length} ${p.replies.length === 1 ? 'reply' : 'replies'}</button>` +
      `<button class="pa-btn">↗️ Share</button></div>` +
      `<div class="replies-section" id="replies-${p.id}">` +
      p.replies.map(r =>
        `<div class="reply"><div class="avatar" style="background:${r.color};width:1.9rem;height:1.9rem;font-size:.72rem">${r.initials}</div>` +
        `<div class="reply-bubble"><div class="rb-author">${r.author}</div><p>${r.body}</p></div></div>`
      ).join('') +
      `<div class="reply-compose">` +
      `<div class="avatar" style="width:1.9rem;height:1.9rem;font-size:.72rem">Y</div>` +
      `<input id="reply-input-${p.id}" placeholder="Write a reply…" onkeydown="if(event.key==='Enter')submitReply(${p.id})" />` +
      `<button onclick="submitReply(${p.id})">Reply</button></div></div>`;
    list.appendChild(el);
  });
}

function toggleReplies(id) {
  const sec = document.getElementById('replies-' + id);
  sec.classList.toggle('open');
  if (sec.classList.contains('open')) document.getElementById('reply-input-' + id).focus();
}
function likePost(id, btn) {
  const p = posts.find(x => x.id === id); if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
  btn.classList.toggle('liked', p.liked);
  btn.textContent = '❤️ ' + p.likes;
}
function submitReply(id) {
  const input = document.getElementById('reply-input-' + id);
  const txt = input.value.trim(); if (!txt) return;
  const p = posts.find(x => x.id === id); if (!p) return;
  p.replies.push({ author: 'You', initials: 'Y', color: '#C4623A', body: txt });
  input.value = '';
  renderPosts();
  const sec = document.getElementById('replies-' + id);
  if (sec) sec.classList.add('open');
}

let selectedTag = '';
function selectTag(tag, btn) {
  document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  if (selectedTag === tag) { selectedTag = ''; return; }
  selectedTag = tag; btn.classList.add('sel');
}
function submitPost() {
  const txt = document.getElementById('compose-text').value.trim(); if (!txt) return;
  const newP = {
    id: Date.now(), author: 'You', initials: 'Y', color: '#C4623A',
    country: '🌍 International', time: 'Just now',
    tag: selectedTag || 'Tip', title: txt.slice(0, 60) + (txt.length > 60 ? '…' : ''),
    body: txt, likes: 0, liked: false, replies: []
  };
  posts.unshift(newP);
  document.getElementById('compose-text').value = '';
  selectedTag = ''; document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  postFilter = 'all'; document.querySelectorAll('.pf-btn').forEach((b, i) => { b.classList.toggle('active', i === 0); });
  renderPosts();
}
renderPosts();
