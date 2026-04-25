/*
  SUPABASE SETUP — run this SQL in your Supabase SQL editor first:

  CREATE TABLE signups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    nationality text,
    university text,
    arrival_month text,
    is_eu boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author text NOT NULL,
    initials text,
    color text,
    country text,
    tag text,
    title text NOT NULL,
    body text NOT NULL,
    likes int DEFAULT 0,
    created_at timestamptz DEFAULT now()
  );

  CREATE TABLE partner_inquiries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    business_type text,
    created_at timestamptz DEFAULT now()
  );

  ALTER TABLE signups ENABLE ROW LEVEL SECURITY;
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "public insert" ON signups FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY "public select" ON posts FOR SELECT TO anon USING (true);
  CREATE POLICY "public insert" ON posts FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY "public update likes" ON posts FOR UPDATE TO anon USING (true);
  CREATE POLICY "public insert" ON partner_inquiries FOR INSERT TO anon WITH CHECK (true);
*/

// ── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Paste your values from supabase.com → Settings → API
const SUPABASE_URL  = 'https://sqgoisqvkihjeapkptzk.supabase.co';
const SUPABASE_ANON = 'sb_publishable_674M9s3RPiVq_RGKt0gjuA_W5f-9PAY';

const sb = (SUPABASE_URL && SUPABASE_ANON)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// ── EU NATIONALITY SET ────────────────────────────────────────────────────────
const EU_COUNTRIES = new Set([
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic',
  'Denmark','Estonia','Finland','France','Germany','Greece','Hungary',
  'Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands',
  'Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden'
]);

// ── USER PROFILE (localStorage) ──────────────────────────────────────────────
const getUser = () => JSON.parse(localStorage.getItem('sc_user') || 'null');
const saveUser = u  => localStorage.setItem('sc_user', JSON.stringify(u));

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ── NAV ───────────────────────────────────────────────────────────────────────
function go(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  document.querySelectorAll('[data-page]').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initReveal, 50);
  document.getElementById('mobile-menu').classList.remove('open');
  if (page === 'guide')     { updateGuidePersonalization(); loadProgress(); }
  if (page === 'community') loadPosts();
}
function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }

// ── SCROLL REVEAL ─────────────────────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: .08 });
  document.querySelectorAll('.page.active .reveal:not(.visible)').forEach(el => obs.observe(el));
}
initReveal();

// ── GUIDE PERSONALISATION BANNER ─────────────────────────────────────────────
function updateGuidePersonalization() {
  const user   = getUser();
  const banner = document.getElementById('guide-user-banner');
  if (!banner) return;
  if (!user) { banner.style.display = 'none'; return; }
  const isEU = EU_COUNTRIES.has(user.nationality);
  banner.style.display = 'flex';
  banner.innerHTML = `
    <div class="gub-left">
      <div class="gub-avatar">${user.firstName.charAt(0).toUpperCase()}</div>
      <div>
        <div class="gub-name">Hi ${user.firstName} — your personalised guide</div>
        <div class="gub-detail">${user.nationality || 'International'} · ${user.university || 'University of Siena'}</div>
      </div>
    </div>
    <span class="gub-path ${isEU ? 'eu' : 'non-eu'}">${isEU ? '🇪🇺 EU path' : '🌍 Non-EU path'}</span>`;
  document.querySelectorAll('.non-eu-only').forEach(el => { el.style.display = isEU ? 'none' : ''; });
  document.querySelectorAll('.eu-only').forEach(el =>    { el.style.display = isEU ? '' : 'none'; });
}

// ── GLOBAL SEARCH ─────────────────────────────────────────────────────────────
const searchIndex = [
  { title: 'Codice Fiscale',         sub: 'Documents · Tax code',               page: 'guide',     icon: '🔢', action: () => { go('guide'); switchCat('documents',null); } },
  { title: 'Permesso di Soggiorno',  sub: 'Documents · Residence permit (non-EU)', page: 'guide',  icon: '📋', action: () => { go('guide'); switchCat('documents',null); } },
  { title: 'Residency Registration', sub: 'Documents · Comune di Siena',        page: 'guide',     icon: '🏛️', action: () => { go('guide'); switchCat('documents',null); } },
  { title: 'Finding Accommodation',  sub: 'Housing · DSU, private, flatshares', page: 'guide',     icon: '🏠', action: () => { go('guide'); switchCat('housing',null); } },
  { title: 'Housing Board',          sub: 'Housing · Rooms posted by students', page: 'guide',     icon: '🔑', action: () => { go('guide'); switchCat('housing-board',null); } },
  { title: 'Bus Pass',               sub: 'Transport · Tiemme monthly pass',    page: 'guide',     icon: '🎫', action: () => { go('guide'); switchCat('transport',null); } },
  { title: 'Opening a Bank Account', sub: 'Banking · MPS, N26, Revolut',        page: 'guide',     icon: '💳', action: () => { go('guide'); switchCat('banking',null); } },
  { title: 'Registering with a GP',  sub: 'Health · National Health Service',   page: 'guide',     icon: '👨‍⚕️', action: () => { go('guide'); switchCat('health',null); } },
  { title: 'University Enrolment',   sub: 'University · ESSE3, student ID',     page: 'guide',     icon: '🎓', action: () => { go('guide'); switchCat('university',null); } },
  { title: 'Events & Activities',    sub: 'Browse upcoming student events',     page: 'events',    icon: '🎭', action: () => go('events') },
  { title: 'Community Forum',        sub: 'Ask questions, share tips',          page: 'community', icon: '💬', action: () => go('community') },
  { title: 'About the Founder',      sub: 'Satish Chand Gupta · Siena 2026',   page: 'about',     icon: '👤', action: () => go('about') },
  { title: 'Partner with Us',        sub: 'Businesses · language schools, accommodation, services', page: 'about', icon: '🤝', action: () => { go('about'); setTimeout(() => document.getElementById('partner-section').scrollIntoView({behavior:'smooth'}), 220); } },
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
  if (!res.length) { box.innerHTML = `<div class="search-empty">No results for "${q}"</div>`; return; }
  box.innerHTML = '';
  res.forEach(r => {
    const el = document.createElement('div'); el.className = 'search-result-item';
    el.innerHTML = `<div class="sri-icon">${r.icon}</div><div class="sri-text"><div class="sri-title">${r.title}</div><div class="sri-sub">${r.sub}</div></div><span class="sri-page">${r.page}</span>`;
    el.onclick = () => { r.action(); closeSearch(); };
    box.appendChild(el);
  });
}

// ── SIGNUP MODAL ──────────────────────────────────────────────────────────────
function openSignup()  { document.getElementById('signup-modal').classList.add('open'); }
function closeSignup() {
  document.getElementById('signup-modal').classList.remove('open');
  document.getElementById('modal-form-view').style.display  = 'block';
  document.getElementById('modal-success-view').style.display = 'none';
  clearFormErrors();
}
function closeModalOutside(e) { if (e.target.id === 'signup-modal') closeSignup(); }

function clearFormErrors() {
  document.querySelectorAll('#modal-form-view .form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('#modal-form-view input, #modal-form-view select')
    .forEach(el => el.classList.remove('input-error'));
}

function fieldError(el, msg) {
  el.classList.add('input-error');
  let err = el.closest('.form-group').querySelector('.form-error');
  if (err) err.textContent = msg;
}

async function submitSignup() {
  clearFormErrors();
  const firstName   = document.getElementById('sig-first').value.trim();
  const lastName    = document.getElementById('sig-last').value.trim();
  const email       = document.getElementById('sig-email').value.trim();
  const nationality = document.getElementById('sig-nationality').value;
  const university  = document.getElementById('sig-university').value;
  const arrival     = document.getElementById('sig-arrival').value;

  let valid = true;
  if (!firstName)   { fieldError(document.getElementById('sig-first'), 'Required'); valid = false; }
  if (!lastName)    { fieldError(document.getElementById('sig-last'),  'Required'); valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldError(document.getElementById('sig-email'), 'Enter a valid email'); valid = false;
  }
  if (!nationality) { fieldError(document.getElementById('sig-nationality'), 'Select your country'); valid = false; }
  if (!university)  { fieldError(document.getElementById('sig-university'),  'Select your university'); valid = false; }
  if (!valid) return;

  const btn = document.querySelector('.modal-submit');
  btn.textContent = 'Joining…'; btn.disabled = true;

  const isEU = EU_COUNTRIES.has(nationality);
  const profile = { firstName, lastName, email, nationality, university, arrival, isEU };

  if (sb) {
    const { error } = await sb.from('signups').insert({
      first_name: firstName, last_name: lastName, email,
      nationality, university, arrival_month: arrival, is_eu: isEU
    });
    if (error) {
      btn.textContent = 'Create my free account →'; btn.disabled = false;
      if (error.code === '23505') {
        fieldError(document.getElementById('sig-email'), 'This email is already registered');
      } else {
        showToast('Something went wrong — please try again');
      }
      return;
    }
  }

  saveUser(profile);
  btn.textContent = 'Create my free account →'; btn.disabled = false;

  document.getElementById('modal-form-view').style.display  = 'none';
  document.getElementById('modal-success-view').style.display = 'block';
  updateGuidePersonalization();
}

// ── GUIDE PROGRESS (localStorage) ────────────────────────────────────────────
const TOTAL_STEPS = 12;
let completedSteps = 0;

function loadProgress() {
  const saved = JSON.parse(localStorage.getItem('sc_progress') || '{}');
  completedSteps = 0;
  document.querySelectorAll('#guide .gstep').forEach((step, i) => {
    if (saved[i]) {
      step.classList.add('done');
      completedSteps++;
    } else {
      step.classList.remove('done');
    }
  });
  updateProgress();
}

function saveProgress() {
  const state = {};
  document.querySelectorAll('#guide .gstep').forEach((step, i) => {
    if (step.classList.contains('done')) state[i] = true;
  });
  localStorage.setItem('sc_progress', JSON.stringify(state));
}

function markDone(e, checkEl) {
  e.stopPropagation();
  const step   = checkEl.closest('.gstep');
  const wasDone = step.classList.contains('done');
  step.classList.toggle('done');
  completedSteps = wasDone ? completedSteps - 1 : completedSteps + 1;
  updateProgress();
  saveProgress();
  if (!wasDone) showToast('Task marked complete ✓');
}

function updateProgress() {
  const pct = Math.round((completedSteps / TOTAL_STEPS) * 100);
  document.getElementById('pb-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent =
    completedSteps + ' of ' + TOTAL_STEPS + ' tasks completed';
}

// ── GUIDE SEARCH ──────────────────────────────────────────────────────────────
function searchGuide(q) {
  q = q.trim().toLowerCase();
  const noRes = document.getElementById('guide-no-results');
  const tabs  = document.getElementById('cat-tabs');
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
  else {
    const matchBtn = document.querySelector(`#guide .cat-tab[data-cat="${cat}"]`);
    if (matchBtn) matchBtn.classList.add('active');
  }
  document.getElementById('cat-tabs').style.display = 'flex';
  if (cat === 'housing-board') renderHousingBoard();
}
function toggleStep(header) { header.parentElement.classList.toggle('open'); }

// ── FAQ ───────────────────────────────────────────────────────────────────────
function toggleFaq(q) { q.parentElement.classList.toggle('open'); }

// ── PARTNER ENQUIRY ───────────────────────────────────────────────────────────
async function submitPartnerInquiry() {
  const name  = document.getElementById('partner-name').value.trim();
  const email = document.getElementById('partner-email').value.trim();
  const type  = document.getElementById('partner-type').value;
  if (!name)  { showToast('Please enter your name or business.'); return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email address.'); return; }
  if (sb) {
    const { error } = await sb.from('partner_inquiries').insert({ name, email, business_type: type || 'Not specified' });
    if (!error) {
      showToast("Thanks! We'll be in touch within 48 hours 🤝");
    } else {
      showToast('Thanks! Email us at hello@sienaconnect.com');
    }
  } else {
    showToast('Thanks! Email us at hello@sienaconnect.com');
  }
  document.getElementById('partner-name').value  = '';
  document.getElementById('partner-email').value = '';
  document.getElementById('partner-type').value  = '';
}

// ── EVENTS ───────────────────────────────────────────────────────────────────
const eventsData = [
  { cat:'social',   color:'#D8EAD8', emoji:'☕', date:'WED 7 MAY 2026',   title:'International Coffee Hour',          desc:'Informal meetup for students from all over the world. Come make friends over an aperitivo.',                                        location:'Bar il Palio',               time:'6:00 PM',  free:true,  going:0 },
  { cat:'academic', color:'#D3DFF0', emoji:'📚', date:'THU 14 MAY 2026',  title:'Bureaucracy Q&A Workshop',           desc:'International Office staff walk you through permesso, codice fiscale, and residency step by step.',                                 location:'Rettorato, Aula Magna',      time:'10:00 AM', free:true,  going:0 },
  { cat:'cultural', color:'#F0E6D3', emoji:'🏛️', date:'SAT 17 MAY 2026',  title:'Palio Explained: History & Traditions', desc:"A guided walk through Siena's most iconic event — the contrade, the race, centuries of rivalry.",                               location:'Piazza del Campo',           time:'3:00 PM',  free:true,  going:0 },
  { cat:'sport',    color:'#EAE0D3', emoji:'🏃', date:'SAT 24 MAY 2026',  title:'Student 5K Morning Run',             desc:"A fun, non-competitive run through Siena's historic centre. All fitness levels welcome.",                                           location:'Fortezza Medicea',           time:'9:00 AM',  free:true,  going:0 },
  { cat:'cultural', color:'#E5D8F0', emoji:'🍝', date:'FRI 30 MAY 2026',  title:'Tuscan Cooking Class',               desc:'Learn to make pici pasta and ribollita from a local chef. Max 12 participants.',                                                    location:'Via Banchi di Sopra',        time:'5:30 PM',  free:false, price:'€15', going:0 },
  { cat:'social',   color:'#D3EAE4', emoji:'🎮', date:'SAT 6 JUN 2026',   title:'International Game Night',           desc:'Board games and card games. Bring a favourite from your home country.',                                                              location:'ESN Siena HQ',               time:'7:00 PM',  free:true,  going:0 },
  { cat:'academic', color:'#F0DDD3', emoji:'🗣️', date:'TUE 10 JUN 2026',  title:'Language Exchange Evening',          desc:"Pair up with Italian students and practise each other's languages in a relaxed format.",                                           location:'Biblioteca Comunale',        time:'6:00 PM',  free:true,  going:0 },
  { cat:'sport',    color:'#D3EAF0', emoji:'⚽', date:'SUN 14 JUN 2026',  title:'International Football Tournament',  desc:'5-a-side open to all. Form a team or join one on the day.',                                                                         location:'Campo Sportivo Fontebecci',  time:'10:00 AM', free:true,  going:0 },
  { cat:'cultural', color:'#EAE6D3', emoji:'🎭', date:'FRI 19 SEP 2026',  title:'Welcome Week Opening Night',         desc:'Kick off the new semester with music, food stalls, and a chance to meet the whole international community.',                         location:'Piazza del Campo',           time:'7:00 PM',  free:true,  going:0 },
  { cat:'academic', color:'#D3DFF0', emoji:'🎓', date:'MON 22 SEP 2026',  title:'New Student Orientation',            desc:'Everything you need to know about the university, admin, and life in Siena. Organised by the International Office.',                 location:'Rettorato, Aula Magna',      time:'9:00 AM',  free:true,  going:0 },
];

let evtFilter = 'all';
function filterEvents(cat, btn) {
  evtFilter = cat;
  document.querySelectorAll('#events .ftag').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderEvents();
}
function renderEvents() {
  const q    = (document.getElementById('events-search-input') || { value: '' }).value.trim().toLowerCase();
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
  const ev    = eventsData[parseInt(btn.dataset.idx)];
  const going = btn.classList.contains('going');
  ev.going    = going ? ev.going - 1 : ev.going + 1;
  btn.classList.toggle('going');
  btn.textContent = btn.classList.contains('going') ? '✓ Going' : 'RSVP';
  if (!going) showToast("You're going to " + ev.title.slice(0, 30) + '…');
}
renderEvents();

// ── HOUSING BOARD ─────────────────────────────────────────────────────────────
const housingData = [
  { type:'Single room', area:'Centro Storico',  price:420, available:'Jun 2026', desc:'Bright room in shared flat with 2 other students. 5 min walk from Piazza del Campo. All bills included.', author:'Léa M.',     initials:'L', color:'var(--purple)', country:'🇫🇷', posted:'2 days ago'  },
  { type:'Studio',      area:'Viale Bracci',    price:680, available:'Sep 2026', desc:'Private studio near Policlinico Le Scotte. Fully furnished, fast WiFi. Short walk to bus stop.',            author:'Marco B.',   initials:'M', color:'var(--green)',  country:'🇮🇹', posted:'5 days ago'  },
  { type:'Double room', area:'San Miniato',     price:320, available:'May 2026', desc:'Room in a large student house (6 people). Near university faculties. Bicycle available for use.',           author:'Priya S.',   initials:'P', color:'var(--terra)',  country:'🇮🇳', posted:'1 week ago'  },
  { type:'Single room', area:'Porta Romana',    price:390, available:'Jun 2026', desc:'Quiet room with street view. Shared kitchen and bathroom with 1 other student. 10 min to university.',      author:'Amine B.',   initials:'A', color:'var(--blue)',   country:'🇹🇳', posted:'1 week ago'  },
  { type:'Single room', area:'Acquacalda',      price:350, available:'Sep 2026', desc:'Affordable room near Tiemme bus stop. Good for students at any faculty. Bills not included (≈€50/mo).',     author:'Kaito T.',   initials:'K', color:'#8B6A4A',       country:'🇯🇵', posted:'2 weeks ago' },
  { type:'Studio',      area:'Centro Storico',  price:720, available:'Oct 2026', desc:'Independent studio apartment in the heart of the old city. Terrace with a view. Rare opportunity.',        author:'Sofia R.',   initials:'S', color:'var(--gold)',   country:'🇪🇸', posted:'3 days ago'  },
];

function renderHousingBoard() {
  const grid = document.getElementById('housing-board-grid');
  if (!grid) return;
  grid.innerHTML = '';
  housingData.forEach(h => {
    const card = document.createElement('div');
    card.className = 'hb-card';
    card.innerHTML = `
      <div class="hb-top">
        <div class="hb-type">${h.type}</div>
        <div class="hb-area">📍 ${h.area}</div>
      </div>
      <div class="hb-price">€${h.price}<span>/month</span></div>
      <p class="hb-desc">${h.desc}</p>
      <div class="hb-available">Available from <strong>${h.available}</strong></div>
      <div class="hb-footer">
        <div class="hb-author">
          <div class="avatar" style="background:${h.color};width:1.8rem;height:1.8rem;font-size:.7rem">${h.initials}</div>
          <div>
            <div class="hb-name">${h.author} ${h.country}</div>
            <div class="hb-posted">${h.posted}</div>
          </div>
        </div>
        <button class="hb-contact" onclick="showToast('Create an account to contact ${h.author.split(' ')[0]}')">Contact →</button>
      </div>`;
    grid.appendChild(card);
  });
}

// ── COMMUNITY / POSTS ─────────────────────────────────────────────────────────
const localPosts = [
  { id:1, author:'Priya S.',   initials:'P', color:'var(--terra)',  country:'🇮🇳 India',   time:'2 hours ago', tag:'Tip',       title:'Codice fiscale is easier than it looks',        body:"I was terrified but it took 20 minutes at the Agenzia delle Entrate. Bring your passport, they give it on the spot for free.",                                                     likes:14, liked:false, replies:[{ author:'Amine B.',  initials:'A', color:'var(--green)',  body:'Confirmed. Go early — there can be a queue by 10am.' }] },
  { id:2, author:'Amine B.',   initials:'A', color:'var(--green)',  country:'🇹🇳 Tunisia', time:'Yesterday',   tag:'Question',  title:'Where to find a language exchange partner?',   body:"Trying to improve my Italian while helping with French or Arabic. Is there a university group or should I use an app?",                                                         likes:8,  liked:false, replies:[{ author:'Léa M.',    initials:'L', color:'var(--purple)', body:'There is a Language Exchange Evening in the Events section — I found my exchange partner there last semester.' }] },
  { id:3, author:'Batmunkh G.',initials:'B', color:'var(--blue)',   country:'🇲🇳 Mongolia',time:'2 days ago',  tag:'Housing',   title:'Always request a registered rental contract', body:"My first landlord wanted a private agreement with no official contract. I could not register at the Comune or use it for the permesso. Always insist on a registered contract.",   likes:31, liked:false, replies:[{ author:'Kaito T.',  initials:'K', color:'#8B6A4A',       body:'So important. The Student Guide on here explains exactly what a valid contract looks like.' }] },
  { id:4, author:'Léa M.',     initials:'L', color:'var(--purple)', country:'🇫🇷 France',  time:'3 days ago',  tag:'Social',    title:'Anyone want to explore the Crete Senesi?',    body:"Looking for 2–3 people to share a car rental for a day trip this weekend. The landscape is stunning in spring.",                                                                  likes:19, liked:false, replies:[] },
  { id:5, author:'Kaito T.',   initials:'K', color:'#8B6A4A',       country:'🇯🇵 Japan',   time:'4 days ago',  tag:'Documents', title:'How long does the permesso actually take?',    body:"Submitted my kit postale 6 weeks ago with no Questura date yet. Is this normal?",                                                                                                 likes:5,  liked:false, replies:[{ author:'Priya S.',  initials:'P', color:'var(--terra)',  body:'6–10 weeks is normal. Keep the receipt — it acts as your temporary permit.' }] },
];
let posts = [...localPosts];

async function loadPosts() {
  if (!sb) { renderPosts(); return; }
  const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
  if (error || !data || !data.length) { renderPosts(); return; }
  posts = data.map(p => ({
    id: p.id, author: p.author, initials: p.initials || p.author.charAt(0),
    color: p.color || 'var(--terra)', country: p.country || '🌍 International',
    time: new Date(p.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }),
    tag: p.tag, title: p.title, body: p.body, likes: p.likes || 0, liked: false, replies: []
  }));
  renderPosts();
}

let postFilter = 'all';
function filterPostsBtn(tag, btn) {
  postFilter = tag;
  document.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderPosts();
}
function renderPosts() {
  const q    = (document.getElementById('comm-search-input') || { value:'' }).value.trim().toLowerCase();
  const list = document.getElementById('posts-list');
  const nop  = document.getElementById('no-posts');
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
      `<button class="pa-btn like-btn${p.liked ? ' liked' : ''}" onclick="likePost(${JSON.stringify(p.id)},this)">❤️ ${p.likes}</button>` +
      `<button class="pa-btn" onclick="toggleReplies(${JSON.stringify(p.id)},this)">💬 ${p.replies.length} ${p.replies.length === 1 ? 'reply' : 'replies'}</button>` +
      `</div>` +
      `<div class="replies-section" id="replies-${p.id}">` +
      p.replies.map(r =>
        `<div class="reply"><div class="avatar" style="background:${r.color};width:1.8rem;height:1.8rem;font-size:.7rem">${r.initials}</div>` +
        `<div class="reply-bubble"><div class="rb-author">${r.author}</div><p>${r.body}</p></div></div>`
      ).join('') +
      `<div class="reply-compose"><div class="avatar" style="width:1.8rem;height:1.8rem;font-size:.7rem">Y</div>` +
      `<input id="reply-input-${p.id}" placeholder="Write a reply…" onkeydown="if(event.key==='Enter')submitReply(${JSON.stringify(p.id)})" />` +
      `<button onclick="submitReply(${JSON.stringify(p.id)})">Reply</button></div></div>`;
    list.appendChild(el);
  });
}
function toggleReplies(id) {
  const sec = document.getElementById('replies-' + id);
  sec.classList.toggle('open');
  if (sec.classList.contains('open')) document.getElementById('reply-input-' + id).focus();
}
function likePost(id, btn) {
  const p = posts.find(x => x.id == id); if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
  btn.classList.toggle('liked', p.liked);
  btn.textContent = '❤️ ' + p.likes;
}
function submitReply(id) {
  const input = document.getElementById('reply-input-' + id);
  const txt   = input.value.trim(); if (!txt) return;
  const p     = posts.find(x => x.id == id); if (!p) return;
  p.replies.push({ author:'You', initials:'Y', color:'var(--terra)', body: txt });
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

async function submitPost() {
  const txt = document.getElementById('compose-text').value.trim(); if (!txt) return;
  const user = getUser();
  const post = {
    author: user ? `${user.firstName} ${user.lastName.charAt(0)}.` : 'Anonymous',
    initials: user ? user.firstName.charAt(0).toUpperCase() : 'A',
    color: 'var(--terra)',
    country: user ? `${user.nationality || '🌍 International'}` : '🌍 International',
    tag: selectedTag || 'Tip',
    title: txt.slice(0, 60) + (txt.length > 60 ? '…' : ''),
    body: txt,
  };

  if (sb) {
    const { error } = await sb.from('posts').insert(post);
    if (error) { showToast('Could not save post — check connection'); return; }
  }

  posts.unshift({ ...post, id: Date.now(), time: 'Just now', likes: 0, liked: false, replies: [] });
  document.getElementById('compose-text').value = '';
  selectedTag = ''; document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  postFilter = 'all'; document.querySelectorAll('.pf-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  renderPosts();
  showToast('Post shared with the community ✓');
}

// ── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function animateCounter(el, target, duration) {
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
(function initCounter() {
  const el = document.getElementById('trust-counter');
  if (!el) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { animateCounter(el, 4000, 1800); obs.disconnect(); }
    });
  }, { threshold: 0.5 });
  obs.observe(el);
})();

// ── HOUSING TEASER (homepage, first 3 listings) ───────────────────────────────
function renderHousingTeaser() {
  const grid = document.getElementById('housing-teaser-grid');
  if (!grid) return;
  grid.innerHTML = '';
  housingData.slice(0, 3).forEach(h => {
    const card = document.createElement('div');
    card.className = 'hb-card';
    card.style.cursor = 'pointer';
    card.onclick = () => { go('guide'); setTimeout(() => switchCat('housing-board', null), 150); };
    card.innerHTML = `
      <div class="hb-top"><div class="hb-type">${h.type}</div><div class="hb-area">📍 ${h.area}</div></div>
      <div class="hb-price">€${h.price}<span>/month</span></div>
      <p class="hb-desc">${h.desc}</p>
      <div class="hb-available">Available from <strong>${h.available}</strong></div>
      <div class="hb-footer">
        <div class="hb-author">
          <div class="avatar" style="background:${h.color};width:1.8rem;height:1.8rem;font-size:.7rem">${h.initials}</div>
          <div><div class="hb-name">${h.author} ${h.country}</div><div class="hb-posted">${h.posted}</div></div>
        </div>
        <span class="hb-contact">View →</span>
      </div>`;
    grid.appendChild(card);
  });
}

// ── URGENCY BANNER ────────────────────────────────────────────────────────────
function dismissBanner() {
  document.getElementById('urgency-banner').classList.add('hidden');
  document.body.classList.remove('has-banner');
  sessionStorage.setItem('sc_banner_dismissed', '1');
}
(function initBanner() {
  if (sessionStorage.getItem('sc_banner_dismissed')) {
    document.getElementById('urgency-banner').classList.add('hidden');
  } else {
    document.body.classList.add('has-banner');
  }
})();

// ── INIT ──────────────────────────────────────────────────────────────────────
loadPosts();
loadProgress();
updateGuidePersonalization();
renderHousingTeaser();
