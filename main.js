// TOAST
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// NAV
function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  document.querySelectorAll('[data-page]').forEach(a => a.classList.toggle('active', a.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initReveal, 50);
  document.getElementById('mobile-menu').classList.remove('open');
}
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }

// REVEAL
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: .08 });
  document.querySelectorAll('.page.active .reveal:not(.visible)').forEach(el => obs.observe(el));
}
initReveal();

// SEARCH
const searchIndex = [
  { title: 'Codice Fiscale', sub: 'Documents · Tax code guide', page: 'guide', icon: '🔢', action: () => { go('guide'); switchCat('documents'); } },
  { title: 'Permesso di Soggiorno', sub: 'Documents · Residence permit', page: 'guide', icon: '📋', action: () => { go('guide'); switchCat('documents'); } },
  { title: 'Residency Registration', sub: 'Documents · Comune di Siena', page: 'guide', icon: '🏛️', action: () => { go('guide'); switchCat('documents'); } },
  { title: 'Finding Accommodation', sub: 'Housing · DSU, private, flatshares', page: 'guide', icon: '🏠', action: () => { go('guide'); switchCat('housing'); } },
  { title: 'Bus Pass', sub: 'Transport · Tiemme monthly pass', page: 'guide', icon: '🎫', action: () => { go('guide'); switchCat('transport'); } },
  { title: 'Opening a Bank Account', sub: 'Banking · MPS, N26, Revolut', page: 'guide', icon: '💳', action: () => { go('guide'); switchCat('banking'); } },
  { title: 'Registering with a GP', sub: 'Health · National Health Service', page: 'guide', icon: '👨‍⚕️', action: () => { go('guide'); switchCat('health'); } },
  { title: 'University Enrolment', sub: 'University · ESSE3, student ID', page: 'guide', icon: '🎓', action: () => { go('guide'); switchCat('university'); } },
  { title: 'Events & Activities', sub: 'Browse upcoming student events', page: 'events', icon: '🎭', action: () => go('events') },
  { title: 'Community Forum', sub: 'Ask questions, share tips', page: 'community', icon: '💬', action: () => go('community') },
  { title: 'About the Founder', sub: 'Satish Chand Gupta · Siena 2026', page: 'about', icon: '👤', action: () => go('about') },
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
  document.getElementById('search-results').innerHTML = '<div class="search-empty">Start typing to search…</div>';
}
function closeSearchOutside(e) { if (e.target.id === 'search-overlay') closeSearch(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSearch(); closeSignup(); } });

function runSearch(q) {
  const box = document.getElementById('search-results');
  q = q.trim().toLowerCase();
  if (!q) { box.innerHTML = '<div class="search-empty">Start typing to search…</div>'; return; }
  const res = searchIndex.filter(i => i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q));
  if (!res.length) { box.innerHTML = '<div class="search-empty">No results for "' + q + '"</div>'; return; }
  box.innerHTML = '';
  res.forEach(r => {
    const el = document.createElement('div'); el.className = 'search-result-item';
    el.innerHTML = `<div class="sri-icon">${r.icon}</div><div class="sri-text"><div class="sri-title">${r.title}</div><div class="sri-sub">${r.sub}</div></div><span class="sri-page">${r.page}</span>`;
    el.onclick = () => { r.action(); closeSearch(); };
    box.appendChild(el);
  });
}

// SIGNUP MODAL
function openSignup() { document.getElementById('signup-modal').classList.add('open'); }
function closeSignup() {
  document.getElementById('signup-modal').classList.remove('open');
  document.getElementById('modal-form-view').style.display = 'block';
  document.getElementById('modal-success-view').style.display = 'none';
}
function closeModalOutside(e) { if (e.target.id === 'signup-modal') closeSignup(); }
function submitSignup() {
  document.getElementById('modal-form-view').style.display = 'none';
  document.getElementById('modal-success-view').style.display = 'block';
}

// GUIDE PROGRESS
let totalSteps = 14;
let completedSteps = 0;
function markDone(e, checkEl) {
  e.stopPropagation();
  const step = checkEl.closest('.gstep');
  const wasDone = step.classList.contains('done');
  step.classList.toggle('done');
  completedSteps = wasDone ? completedSteps - 1 : completedSteps + 1;
  updateProgress();
  if (!wasDone) showToast('Task marked complete ✓');
}
function updateProgress() {
  const pct = Math.round((completedSteps / totalSteps) * 100);
  document.getElementById('pb-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = completedSteps + ' of ' + totalSteps + ' tasks completed';
}

// GUIDE SEARCH
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

function switchCat(cat, btn) {
  document.querySelectorAll('#guide .guide-section').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
  document.querySelectorAll('#guide .cat-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('cat-' + cat);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('cat-tabs').style.display = 'flex';
}
function toggleStep(header) { header.parentElement.classList.toggle('open'); }

// FAQ
function toggleFaq(q) { q.parentElement.classList.toggle('open'); }

// EVENTS
const eventsData = [
  { cat: 'cultural', color: '#F0E6D3', emoji: '🏛️', date: 'SAT 14 MAR 2026', title: 'Palio Explained: History & Traditions', desc: "A guided walk through Siena's most iconic event — the contrade, the race, centuries of rivalry.", location: 'Piazza del Campo', time: '3:00 PM', free: true, going: 0 },
  { cat: 'social', color: '#D8EAD8', emoji: '☕', date: 'WED 18 MAR 2026', title: 'International Coffee Hour', desc: 'Informal meetup for students from all over the world. Come make friends over an aperitivo.', location: 'Bar il Palio', time: '6:00 PM', free: true, going: 0 },
  { cat: 'academic', color: '#D3DFF0', emoji: '📚', date: 'THU 19 MAR 2026', title: 'Bureaucracy Q&A Workshop', desc: 'International Office staff walk you through permesso, codice fiscale, and residency step by step.', location: 'Rettorato, Aula Magna', time: '10:00 AM', free: true, going: 0 },
  { cat: 'sport', color: '#EAE0D3', emoji: '🏃', date: 'SAT 21 MAR 2026', title: 'Student 5K Morning Run', desc: "A fun, non-competitive run through Siena's historic centre. All fitness levels welcome.", location: 'Fortezza Medicea', time: '9:00 AM', free: true, going: 0 },
  { cat: 'cultural', color: '#E5D8F0', emoji: '🍝', date: 'FRI 27 MAR 2026', title: 'Tuscan Cooking Class', desc: 'Learn to make pici pasta and ribollita from a local chef. Max 12 participants.', location: 'Via Banchi di Sopra', time: '5:30 PM', free: false, price: '€15', going: 0 },
  { cat: 'social', color: '#D3EAE4', emoji: '🎮', date: 'SAT 28 MAR 2026', title: 'International Game Night', desc: 'Board games and card games. Bring a favourite from your home country.', location: 'ESN Siena HQ', time: '7:00 PM', free: true, going: 0 },
  { cat: 'academic', color: '#F0DDD3', emoji: '🗣️', date: 'TUE 1 APR 2026', title: 'Language Exchange Evening', desc: "Pair up with Italian students and practise each other's languages in a relaxed format.", location: 'Biblioteca Comunale', time: '6:00 PM', free: true, going: 0 },
  { cat: 'sport', color: '#D3EAF0', emoji: '⚽', date: 'SUN 5 APR 2026', title: 'International Football Tournament', desc: '5-a-side open to all. Form a team or join one on the day.', location: 'Campo Sportivo Fontebecci', time: '10:00 AM', free: true, going: 0 },
  { cat: 'cultural', color: '#EAE6D3', emoji: '🎭', date: 'FRI 10 APR 2026', title: 'Siena Theatre Night', desc: 'University theatre group performance followed by a discussion with the cast.', location: 'Teatro dei Rinnovati', time: '8:30 PM', free: false, price: '€8 students', going: 0 },
];

let evtFilter = 'all';
function filterEvents(cat, btn) {
  evtFilter = cat;
  document.querySelectorAll('#events .ftag').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderEvents();
}
function renderEvents() {
  const q = (document.getElementById('events-search-input') || { value: '' }).value.trim().toLowerCase();
  const grid = document.getElementById('events-grid');
  const noEv = document.getElementById('no-events');
  let filtered = evtFilter === 'all' ? eventsData : eventsData.filter(e => e.cat === evtFilter);
  if (q) filtered = filtered.filter(e => e.title.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q));
  grid.innerHTML = '';
  if (!filtered.length) { noEv.style.display = 'block'; return; }
  noEv.style.display = 'none';
  filtered.forEach(ev => {
    const c = document.createElement('div'); c.className = 'ecard';
    const goingTxt = ev.going > 0 ? ` · ${ev.going} going` : '';
    c.innerHTML =
      `<div class="ecard-banner" style="background:${ev.color}">${ev.emoji}<span class="ecard-cat">${ev.cat}</span></div>` +
      `<div class="ecard-body"><div class="ecard-date">${ev.date}</div><h3>${ev.title}</h3><p>${ev.desc}</p>` +
      `<div class="ecard-meta"><span>📍 ${ev.location}</span><span>🕐 ${ev.time}${goingTxt}</span></div></div>` +
      `<div class="ecard-footer"><span class="price ${ev.free ? 'free' : ''}">${ev.free ? 'Free' : ev.price}</span>` +
      `<button class="rsvp-btn" data-idx="${eventsData.indexOf(ev)}" onclick="rsvpEvent(this)">RSVP</button></div>`;
    grid.appendChild(c);
  });
}
function rsvpEvent(btn) {
  const idx = parseInt(btn.dataset.idx);
  const ev = eventsData[idx];
  const going = btn.classList.contains('going');
  ev.going = going ? ev.going - 1 : ev.going + 1;
  btn.classList.toggle('going');
  btn.textContent = btn.classList.contains('going') ? '✓ Going' : 'RSVP';
  if (!going) showToast("You're going to " + ev.title.slice(0, 30) + '…');
}
renderEvents();

// COMMUNITY
let posts = [
  { id: 1, author: 'Priya S.', initials: 'P', color: 'var(--terra)', country: '🇮🇳 India', time: '2 hours ago', tag: 'Tip', title: 'Codice fiscale is easier than it looks', body: "I was terrified but it took 20 minutes at the Agenzia delle Entrate. Bring your passport, they give it on the spot for free.", likes: 14, liked: false, replies: [{ author: 'Amine B.', initials: 'A', color: 'var(--green)', body: 'Confirmed. Go early — there can be a queue by 10am.' }] },
  { id: 2, author: 'Amine B.', initials: 'A', color: 'var(--green)', country: '🇹🇳 Tunisia', time: 'Yesterday', tag: 'Question', title: 'Where to find a language exchange partner?', body: "Trying to improve my Italian while helping with French or Arabic. Is there a university group or should I use an app?", likes: 8, liked: false, replies: [{ author: 'Léa M.', initials: 'L', color: 'var(--purple)', body: 'There is a Language Exchange Evening in the Events section — I found my exchange partner there last semester.' }] },
  { id: 3, author: 'Batmunkh G.', initials: 'B', color: 'var(--blue)', country: '🇲🇳 Mongolia', time: '2 days ago', tag: 'Housing', title: 'Always request a registered rental contract', body: "My first landlord wanted a private agreement with no official contract. I could not register at the Comune or use it for the permesso. Always insist on a registered contract.", likes: 31, liked: false, replies: [{ author: 'Kaito T.', initials: 'K', color: '#8B6A4A', body: 'So important. The Student Guide on here explains exactly what a valid contract looks like.' }] },
  { id: 4, author: 'Léa M.', initials: 'L', color: 'var(--purple)', country: '🇫🇷 France', time: '3 days ago', tag: 'Social', title: 'Anyone want to explore the Crete Senesi?', body: "Looking for 2–3 people to share a car rental for a day trip this weekend. The landscape is stunning in spring.", likes: 19, liked: false, replies: [] },
  { id: 5, author: 'Kaito T.', initials: 'K', color: '#8B6A4A', country: '🇯🇵 Japan', time: '4 days ago', tag: 'Documents', title: 'How long does the permesso actually take?', body: "Submitted my kit postale 6 weeks ago with no Questura date yet. Is this normal?", likes: 5, liked: false, replies: [{ author: 'Priya S.', initials: 'P', color: 'var(--terra)', body: '6–10 weeks is normal. Keep the receipt — it acts as your temporary permit.' }] },
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
  if (q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q));
  list.innerHTML = '';
  if (!filtered.length) { nop.style.display = 'block'; return; }
  nop.style.display = 'none';
  filtered.forEach(p => {
    const el = document.createElement('div'); el.className = 'post'; el.dataset.id = p.id;
    el.innerHTML =
      `<div class="post-top"><div class="avatar" style="background:${p.color}">${p.initials}</div>` +
      `<div class="post-meta"><div class="post-author">${p.author} <span style="font-size:.72rem;color:var(--light);font-weight:300">${p.country}</span></div><div class="post-info">${p.time}</div></div>` +
      `<span class="post-tag">${p.tag}</span></div>` +
      `<h4>${p.title}</h4><p>${p.body}</p>` +
      `<div class="post-actions">` +
      `<button class="pa-btn like-btn${p.liked ? ' liked' : ''}" onclick="likePost(${p.id},this)">❤️ ${p.likes}</button>` +
      `<button class="pa-btn" onclick="toggleReplies(${p.id},this)">💬 ${p.replies.length} ${p.replies.length === 1 ? 'reply' : 'replies'}</button>` +
      `</div>` +
      `<div class="replies-section" id="replies-${p.id}">` +
      p.replies.map(r =>
        `<div class="reply"><div class="avatar" style="background:${r.color};width:1.8rem;height:1.8rem;font-size:.7rem">${r.initials}</div>` +
        `<div class="reply-bubble"><div class="rb-author">${r.author}</div><p>${r.body}</p></div></div>`
      ).join('') +
      `<div class="reply-compose"><div class="avatar" style="width:1.8rem;height:1.8rem;font-size:.7rem">Y</div>` +
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
  p.replies.push({ author: 'You', initials: 'Y', color: 'var(--terra)', body: txt });
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
  posts.unshift({
    id: Date.now(), author: 'You', initials: 'Y', color: 'var(--terra)',
    country: '🌍 International', time: 'Just now',
    tag: selectedTag || 'Tip', title: txt.slice(0, 60) + (txt.length > 60 ? '…' : ''),
    body: txt, likes: 0, liked: false, replies: []
  });
  document.getElementById('compose-text').value = '';
  selectedTag = ''; document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  postFilter = 'all'; document.querySelectorAll('.pf-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  renderPosts();
  showToast('Post shared with the community ✓');
}
renderPosts();
