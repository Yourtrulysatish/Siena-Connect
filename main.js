/*
  SIENA CONNECT — main.js  v2.0
  ─────────────────────────────────────────────────────────────────────────────
  Sections:
   1.  State
   2.  EU nationality set
   3.  Utils
   4.  Supabase init & auth
   5.  Auth modal (magic link)
   6.  Nav & routing
   7.  Scroll reveal
   8.  Guide personalisation, progress, categories
   9.  Global search
  10.  Events (DB-backed with RSVP)
  11.  Housing (DB-backed CRUD + save)
  12.  Community / Posts
  13.  Dashboard
  14.  Admin panel
  15.  Partner enquiry
  16.  Live stats
  17.  Counters & banners
  18.  Boot
  ─────────────────────────────────────────────────────────────────────────────*/

// ── 1. STATE ──────────────────────────────────────────────────────────────────
let sb              = null;   // Supabase client (null until initSupabase resolves)
let currentSession  = null;   // Supabase Auth session
let currentProfile  = null;   // row from `profiles` table
let housingData     = [];     // active housing listings
let eventsData      = [];     // published events
let posts           = [];     // community posts
let rsvpdEventIds   = new Set();   // event IDs the logged-in user RSVPd to
let savedListingIds = new Set();   // listing IDs the logged-in user saved

// ── 2. EU NATIONALITY SET ─────────────────────────────────────────────────────
const EU_COUNTRIES = new Set([
  'Austria','Belgium','Bulgaria','Croatia','Cyprus','Czech Republic',
  'Denmark','Estonia','Finland','France','Germany','Greece','Hungary',
  'Ireland','Italy','Latvia','Lithuania','Luxembourg','Malta','Netherlands',
  'Poland','Portugal','Romania','Slovakia','Slovenia','Spain','Sweden'
]);

// All countries list used to populate nationality dropdowns
const EU_EEA_COUNTRIES = [
  { flag:'🇦🇹', name:'Austria' },{ flag:'🇧🇪', name:'Belgium' },{ flag:'🇧🇬', name:'Bulgaria' },
  { flag:'🇭🇷', name:'Croatia' },{ flag:'🇨🇾', name:'Cyprus' },{ flag:'🇨🇿', name:'Czech Republic' },
  { flag:'🇩🇰', name:'Denmark' },{ flag:'🇪🇪', name:'Estonia' },{ flag:'🇫🇮', name:'Finland' },
  { flag:'🇫🇷', name:'France' },{ flag:'🇩🇪', name:'Germany' },{ flag:'🇬🇷', name:'Greece' },
  { flag:'🇭🇺', name:'Hungary' },{ flag:'🇮🇸', name:'Iceland' },{ flag:'🇮🇪', name:'Ireland' },
  { flag:'🇮🇹', name:'Italy' },{ flag:'🇱🇻', name:'Latvia' },{ flag:'🇱🇮', name:'Liechtenstein' },
  { flag:'🇱🇹', name:'Lithuania' },{ flag:'🇱🇺', name:'Luxembourg' },{ flag:'🇲🇹', name:'Malta' },
  { flag:'🇳🇱', name:'Netherlands' },{ flag:'🇳🇴', name:'Norway' },{ flag:'🇵🇱', name:'Poland' },
  { flag:'🇵🇹', name:'Portugal' },{ flag:'🇷🇴', name:'Romania' },{ flag:'🇸🇰', name:'Slovakia' },
  { flag:'🇸🇮', name:'Slovenia' },{ flag:'🇪🇸', name:'Spain' },{ flag:'🇸🇪', name:'Sweden' },
  { flag:'🇨🇭', name:'Switzerland' },
];
const WORLD_COUNTRIES = [
  { flag:'🇦🇫', name:'Afghanistan' },{ flag:'🇦🇱', name:'Albania' },{ flag:'🇩🇿', name:'Algeria' },
  { flag:'🇦🇩', name:'Andorra' },{ flag:'🇦🇴', name:'Angola' },{ flag:'🇦🇬', name:'Antigua and Barbuda' },
  { flag:'🇦🇷', name:'Argentina' },{ flag:'🇦🇲', name:'Armenia' },{ flag:'🇦🇺', name:'Australia' },
  { flag:'🇦🇿', name:'Azerbaijan' },{ flag:'🇧🇸', name:'Bahamas' },{ flag:'🇧🇭', name:'Bahrain' },
  { flag:'🇧🇩', name:'Bangladesh' },{ flag:'🇧🇧', name:'Barbados' },{ flag:'🇧🇾', name:'Belarus' },
  { flag:'🇧🇿', name:'Belize' },{ flag:'🇧🇯', name:'Benin' },{ flag:'🇧🇹', name:'Bhutan' },
  { flag:'🇧🇴', name:'Bolivia' },{ flag:'🇧🇦', name:'Bosnia and Herzegovina' },{ flag:'🇧🇼', name:'Botswana' },
  { flag:'🇧🇷', name:'Brazil' },{ flag:'🇧🇳', name:'Brunei' },{ flag:'🇧🇫', name:'Burkina Faso' },
  { flag:'🇧🇮', name:'Burundi' },{ flag:'🇨🇻', name:'Cabo Verde' },{ flag:'🇰🇭', name:'Cambodia' },
  { flag:'🇨🇲', name:'Cameroon' },{ flag:'🇨🇦', name:'Canada' },{ flag:'🇨🇫', name:'Central African Republic' },
  { flag:'🇹🇩', name:'Chad' },{ flag:'🇨🇱', name:'Chile' },{ flag:'🇨🇳', name:'China' },
  { flag:'🇨🇴', name:'Colombia' },{ flag:'🇰🇲', name:'Comoros' },{ flag:'🇨🇩', name:'Congo (DRC)' },
  { flag:'🇨🇬', name:'Congo (Republic)' },{ flag:'🇨🇷', name:'Costa Rica' },{ flag:'🇨🇮', name:"Côte d'Ivoire" },
  { flag:'🇨🇺', name:'Cuba' },{ flag:'🇩🇯', name:'Djibouti' },{ flag:'🇩🇲', name:'Dominica' },
  { flag:'🇩🇴', name:'Dominican Republic' },{ flag:'🇪🇨', name:'Ecuador' },{ flag:'🇪🇬', name:'Egypt' },
  { flag:'🇸🇻', name:'El Salvador' },{ flag:'🇬🇶', name:'Equatorial Guinea' },{ flag:'🇪🇷', name:'Eritrea' },
  { flag:'🇸🇿', name:'Eswatini' },{ flag:'🇪🇹', name:'Ethiopia' },{ flag:'🇫🇯', name:'Fiji' },
  { flag:'🇬🇦', name:'Gabon' },{ flag:'🇬🇲', name:'Gambia' },{ flag:'🇬🇪', name:'Georgia' },
  { flag:'🇬🇭', name:'Ghana' },{ flag:'🇬🇩', name:'Grenada' },{ flag:'🇬🇹', name:'Guatemala' },
  { flag:'🇬🇳', name:'Guinea' },{ flag:'🇬🇼', name:'Guinea-Bissau' },{ flag:'🇬🇾', name:'Guyana' },
  { flag:'🇭🇹', name:'Haiti' },{ flag:'🇭🇳', name:'Honduras' },{ flag:'🇮🇳', name:'India' },
  { flag:'🇮🇩', name:'Indonesia' },{ flag:'🇮🇷', name:'Iran' },{ flag:'🇮🇶', name:'Iraq' },
  { flag:'🇮🇱', name:'Israel' },{ flag:'🇯🇲', name:'Jamaica' },{ flag:'🇯🇵', name:'Japan' },
  { flag:'🇯🇴', name:'Jordan' },{ flag:'🇰🇿', name:'Kazakhstan' },{ flag:'🇰🇪', name:'Kenya' },
  { flag:'🇰🇮', name:'Kiribati' },{ flag:'🇰🇼', name:'Kuwait' },{ flag:'🇰🇬', name:'Kyrgyzstan' },
  { flag:'🇱🇦', name:'Laos' },{ flag:'🇱🇧', name:'Lebanon' },{ flag:'🇱🇸', name:'Lesotho' },
  { flag:'🇱🇷', name:'Liberia' },{ flag:'🇱🇾', name:'Libya' },{ flag:'🇲🇬', name:'Madagascar' },
  { flag:'🇲🇼', name:'Malawi' },{ flag:'🇲🇾', name:'Malaysia' },{ flag:'🇲🇻', name:'Maldives' },
  { flag:'🇲🇱', name:'Mali' },{ flag:'🇲🇭', name:'Marshall Islands' },{ flag:'🇲🇷', name:'Mauritania' },
  { flag:'🇲🇺', name:'Mauritius' },{ flag:'🇲🇽', name:'Mexico' },{ flag:'🇫🇲', name:'Micronesia' },
  { flag:'🇲🇩', name:'Moldova' },{ flag:'🇲🇨', name:'Monaco' },{ flag:'🇲🇳', name:'Mongolia' },
  { flag:'🇲🇪', name:'Montenegro' },{ flag:'🇲🇦', name:'Morocco' },{ flag:'🇲🇿', name:'Mozambique' },
  { flag:'🇲🇲', name:'Myanmar' },{ flag:'🇳🇦', name:'Namibia' },{ flag:'🇳🇷', name:'Nauru' },
  { flag:'🇳🇵', name:'Nepal' },{ flag:'🇳🇿', name:'New Zealand' },{ flag:'🇳🇮', name:'Nicaragua' },
  { flag:'🇳🇪', name:'Niger' },{ flag:'🇳🇬', name:'Nigeria' },{ flag:'🇰🇵', name:'North Korea' },
  { flag:'🇲🇰', name:'North Macedonia' },{ flag:'🇴🇲', name:'Oman' },{ flag:'🇵🇰', name:'Pakistan' },
  { flag:'🇵🇼', name:'Palau' },{ flag:'🇵🇸', name:'Palestine' },{ flag:'🇵🇦', name:'Panama' },
  { flag:'🇵🇬', name:'Papua New Guinea' },{ flag:'🇵🇾', name:'Paraguay' },{ flag:'🇵🇪', name:'Peru' },
  { flag:'🇵🇭', name:'Philippines' },{ flag:'🇶🇦', name:'Qatar' },{ flag:'🇷🇺', name:'Russia' },
  { flag:'🇷🇼', name:'Rwanda' },{ flag:'🇰🇳', name:'Saint Kitts and Nevis' },{ flag:'🇱🇨', name:'Saint Lucia' },
  { flag:'🇻🇨', name:'Saint Vincent and the Grenadines' },{ flag:'🇼🇸', name:'Samoa' },
  { flag:'🇸🇲', name:'San Marino' },{ flag:'🇸🇹', name:'São Tomé and Príncipe' },
  { flag:'🇸🇦', name:'Saudi Arabia' },{ flag:'🇸🇳', name:'Senegal' },{ flag:'🇷🇸', name:'Serbia' },
  { flag:'🇸🇨', name:'Seychelles' },{ flag:'🇸🇱', name:'Sierra Leone' },{ flag:'🇸🇬', name:'Singapore' },
  { flag:'🇸🇧', name:'Solomon Islands' },{ flag:'🇸🇴', name:'Somalia' },{ flag:'🇿🇦', name:'South Africa' },
  { flag:'🇰🇷', name:'South Korea' },{ flag:'🇸🇸', name:'South Sudan' },{ flag:'🇱🇰', name:'Sri Lanka' },
  { flag:'🇸🇩', name:'Sudan' },{ flag:'🇸🇷', name:'Suriname' },{ flag:'🇸🇾', name:'Syria' },
  { flag:'🇹🇼', name:'Taiwan' },{ flag:'🇹🇯', name:'Tajikistan' },{ flag:'🇹🇿', name:'Tanzania' },
  { flag:'🇹🇭', name:'Thailand' },{ flag:'🇹🇱', name:'Timor-Leste' },{ flag:'🇹🇬', name:'Togo' },
  { flag:'🇹🇴', name:'Tonga' },{ flag:'🇹🇹', name:'Trinidad and Tobago' },{ flag:'🇹🇳', name:'Tunisia' },
  { flag:'🇹🇷', name:'Turkey' },{ flag:'🇹🇲', name:'Turkmenistan' },{ flag:'🇹🇻', name:'Tuvalu' },
  { flag:'🇺🇬', name:'Uganda' },{ flag:'🇺🇦', name:'Ukraine' },{ flag:'🇦🇪', name:'United Arab Emirates' },
  { flag:'🇬🇧', name:'United Kingdom' },{ flag:'🇺🇸', name:'United States' },{ flag:'🇺🇾', name:'Uruguay' },
  { flag:'🇺🇿', name:'Uzbekistan' },{ flag:'🇻🇺', name:'Vanuatu' },{ flag:'🇻🇦', name:'Vatican City' },
  { flag:'🇻🇪', name:'Venezuela' },{ flag:'🇻🇳', name:'Vietnam' },{ flag:'🇾🇪', name:'Yemen' },
  { flag:'🇿🇲', name:'Zambia' },{ flag:'🇿🇼', name:'Zimbabwe' },
];

function populateNationalitySelects() {
  const euOptions = EU_EEA_COUNTRIES.map(c => `<option value="${c.name}">${c.flag} ${c.name}</option>`).join('');
  const worldOptions = WORLD_COUNTRIES.map(c => `<option value="${c.name}">${c.flag} ${c.name}</option>`).join('');
  const html = `<option value="">Select country…</option><optgroup label="EU / EEA">${euOptions}</optgroup><optgroup label="Rest of World">${worldOptions}</optgroup>`;
  ['sig-nationality','prof-nationality'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

// ── 3. UTILS ──────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// Provides a unified user object for both logged-in and legacy localStorage paths
const getUser = () => {
  if (currentProfile) {
    return {
      firstName:   currentProfile.first_name,
      lastName:    currentProfile.last_name,
      email:       currentProfile.email,
      nationality: currentProfile.nationality,
      university:  currentProfile.university,
      arrival:     currentProfile.arrival_month,
      isEU:        currentProfile.is_eu,
    };
  }
  return JSON.parse(localStorage.getItem('sc_user') || 'null');
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function escAttr(s) {
  return String(s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── 4. SUPABASE INIT & AUTH ───────────────────────────────────────────────────
async function initSupabase() {
  // 1. Try window globals set by config.js (local dev)
  let url = window.SUPABASE_URL;
  let key = window.SUPABASE_ANON_KEY;

  // 2. Fall back to /api/config (Vercel — env vars injected server-side)
  if (!url || !key) {
    try {
      const r = await fetch('/api/config');
      if (r.ok) { const c = await r.json(); url = c.supabaseUrl; key = c.supabaseAnonKey; }
    } catch (_) { /* offline or local without config */ }
  }

  if (!url || !key) {
    console.warn('Siena Connect: no Supabase config — running in offline mode');
    bootApp();
    return;
  }

  sb = window.supabase.createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });

  // Auth state listener — fires on every sign in / sign out / token refresh
  sb.auth.onAuthStateChange(async (event, session) => {
    currentSession = session;
    if (event === 'SIGNED_IN')  await handleSignedIn(session);
    if (event === 'SIGNED_OUT') handleSignedOut();
  });

  // Recover any existing session (e.g. page reload)
  const { data: { session } } = await sb.auth.getSession();
  if (session) { currentSession = session; await handleSignedIn(session); }

  bootApp();
}

async function handleSignedIn(session) {
  // Load this user's profile
  const { data: profile } = await sb
    .from('profiles').select('*').eq('id', session.user.id).single();

  currentProfile = profile;

  if (!profile) {
    // Check for profile data stored before sending the magic link
    const pending = JSON.parse(sessionStorage.getItem('sc_pending_profile') || 'null');
    if (pending) {
      await createProfile(session.user.id, session.user.email, pending);
      sessionStorage.removeItem('sc_pending_profile');
    } else {
      // First-time sign-in without a pre-filled form — ask for profile details
      updateNavAuth(session);
      openProfileCompletion();
      return;
    }
  } else {
    await Promise.all([loadUserRsvps(), loadUserSavedListings()]);
  }

  updateNavAuth(session);
  updateGuidePersonalization();

  // If the magic-link-sent view is open, redirect to dashboard
  const stepInput = document.getElementById('modal-auth-step');
  if (stepInput && (stepInput.value === 'sent' || stepInput.value === 'email')) {
    closeAuth();
    showToast(`Welcome back, ${currentProfile?.first_name || ''}! 👋`);
    go('dashboard');
  }
}

function handleSignedOut() {
  currentProfile  = null;
  currentSession  = null;
  rsvpdEventIds.clear();
  savedListingIds.clear();
  updateNavAuth(null);
  updateGuidePersonalization();

  // If on a protected page, bounce home
  const activePage = document.querySelector('.page.active');
  if (activePage && ['dashboard','admin'].includes(activePage.id)) go('home');

  renderEvents();
  renderHousingBoard();
}

async function createProfile(userId, email, data) {
  const isEU = EU_COUNTRIES.has(data.nationality);
  const { data: profile } = await sb.from('profiles').upsert({
    id:           userId,
    first_name:   data.firstName  || data.first_name,
    last_name:    data.lastName   || data.last_name,
    email,
    nationality:  data.nationality,
    university:   data.university,
    arrival_month: data.arrival   || data.arrival_month,
    is_eu:        isEU,
  }).select().single();

  if (profile) {
    currentProfile = profile;
    updateNavAuth(currentSession);
    updateGuidePersonalization();
    // Fire-and-forget welcome email
    fetch('/api/send-welcome', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, firstName: profile.first_name, university: profile.university, nationality: profile.nationality }),
    }).catch(() => {});
  }
}

async function loadUserRsvps() {
  if (!sb || !currentSession) return;
  const { data } = await sb.from('event_rsvps').select('event_id').eq('user_id', currentSession.user.id);
  rsvpdEventIds = new Set((data || []).map(r => r.event_id));
}

async function loadUserSavedListings() {
  if (!sb || !currentSession) return;
  const { data } = await sb.from('saved_listings').select('listing_id').eq('user_id', currentSession.user.id);
  savedListingIds = new Set((data || []).map(r => r.listing_id));
}

function updateNavAuth(session) {
  const joinBtn   = document.getElementById('nav-join-btn');
  const userMenu  = document.getElementById('nav-user-menu');
  const adminLink = document.getElementById('admin-nav-link');

  if (!session || !currentProfile) {
    if (joinBtn)  joinBtn.style.display  = '';
    if (userMenu) userMenu.style.display = 'none';
    return;
  }

  if (joinBtn)  joinBtn.style.display  = 'none';
  if (userMenu) userMenu.style.display = 'flex';

  const initials  = ((currentProfile.first_name?.[0] || '') + (currentProfile.last_name?.[0] || '')).toUpperCase();
  const avatarEl  = document.getElementById('nav-user-avatar');
  const nameEl    = document.getElementById('nav-user-name');
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = currentProfile.first_name;
  if (adminLink) adminLink.style.display = currentProfile.is_admin ? '' : 'none';

  // Also update mobile menu sign-in link
  const mobileSignIn  = document.getElementById('mobile-signin-link');
  const mobileSignOut = document.getElementById('mobile-signout-link');
  if (mobileSignIn)  mobileSignIn.style.display  = 'none';
  if (mobileSignOut) mobileSignOut.style.display = '';
}

async function signOut() {
  if (sb) await sb.auth.signOut();
  handleSignedOut();
  showToast('Signed out. See you soon! 👋');
}

// ── 5. AUTH MODAL (magic link) ────────────────────────────────────────────────
function openAuth(mode) {
  // mode: 'signup' (default, shows profile fields) | 'signin' (email only)
  const modal = document.getElementById('signup-modal');
  if (!modal) return;
  modal.classList.add('open');
  setAuthStep('email');

  const profileFields = document.getElementById('auth-profile-fields');
  const signinHint    = document.getElementById('auth-signin-hint');
  const submitBtn     = document.querySelector('#modal-form-view .modal-submit');

  if (mode === 'signin') {
    if (profileFields) profileFields.style.display = 'none';
    if (signinHint)    signinHint.style.display    = 'block';
    if (submitBtn)     submitBtn.textContent        = 'Send magic link →';
  } else {
    if (profileFields) profileFields.style.display = '';
    if (signinHint)    signinHint.style.display    = 'none';
    if (submitBtn)     submitBtn.textContent        = 'Create my free account →';
  }
}

// Backwards-compat alias (HTML still calls openSignup())
function openSignup() { openAuth('signup'); }

function closeAuth() {
  const modal = document.getElementById('signup-modal');
  if (modal) modal.classList.remove('open');
  clearFormErrors();
}
function closeSignup() { closeAuth(); }

function closeModalOutside(e) { if (e.target.id === 'signup-modal') closeAuth(); }

function setAuthStep(step) {
  // step: 'email' | 'sent' | 'profile' | 'success'
  const stepInput = document.getElementById('modal-auth-step');
  if (stepInput) stepInput.value = step;

  const views = {
    'modal-form-view':    step === 'email',
    'modal-sent-view':    step === 'sent',
    'modal-profile-view': step === 'profile',
    'modal-success-view': step === 'success',
  };
  Object.entries(views).forEach(([id, show]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
  });
}

function clearFormErrors() {
  document.querySelectorAll('#signup-modal .form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('#signup-modal input, #signup-modal select').forEach(el => el.classList.remove('input-error'));
}

function fieldError(el, msg) {
  if (!el) return;
  el.classList.add('input-error');
  const err = el.closest('.form-group')?.querySelector('.form-error');
  if (err) err.textContent = msg;
}

// Main signup/signin form submission
async function submitSignup() {
  clearFormErrors();
  const email       = document.getElementById('sig-email')?.value.trim()      || '';
  const firstName   = document.getElementById('sig-first')?.value.trim()      || '';
  const lastName    = document.getElementById('sig-last')?.value.trim()       || '';
  const nationality = document.getElementById('sig-nationality')?.value       || '';
  const university  = document.getElementById('sig-university')?.value        || '';
  const arrival     = document.getElementById('sig-arrival')?.value           || '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldError(document.getElementById('sig-email'), 'Enter a valid email');
    return;
  }

  const profileFields = document.getElementById('auth-profile-fields');
  const isSignupMode  = profileFields && profileFields.style.display !== 'none';

  if (isSignupMode) {
    let ok = true;
    if (!firstName)   { fieldError(document.getElementById('sig-first'),       'Required'); ok = false; }
    if (!lastName)    { fieldError(document.getElementById('sig-last'),        'Required'); ok = false; }
    if (!nationality) { fieldError(document.getElementById('sig-nationality'), 'Select your country'); ok = false; }
    if (!university)  { fieldError(document.getElementById('sig-university'),  'Select your university'); ok = false; }
    if (!ok) return;

    // Cache profile data so we can create it after the auth callback fires
    sessionStorage.setItem('sc_pending_profile', JSON.stringify({ firstName, lastName, nationality, university, arrival }));
  }

  const btn = document.querySelector('#modal-form-view .modal-submit');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

  if (sb) {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      if (btn) { btn.textContent = isSignupMode ? 'Create my free account →' : 'Send magic link →'; btn.disabled = false; }
      showToast('Could not send link — try again');
      return;
    }
  }

  if (btn) { btn.textContent = isSignupMode ? 'Create my free account →' : 'Send magic link →'; btn.disabled = false; }

  const sentEmailEl = document.getElementById('sent-email-display');
  if (sentEmailEl) sentEmailEl.textContent = email;
  setAuthStep('sent');
}

function openProfileCompletion() {
  const modal = document.getElementById('signup-modal');
  if (modal) { modal.classList.add('open'); setAuthStep('profile'); }
}

async function submitProfile() {
  const firstName   = document.getElementById('prof-first')?.value.trim()    || '';
  const lastName    = document.getElementById('prof-last')?.value.trim()     || '';
  const nationality = document.getElementById('prof-nationality')?.value     || '';
  const university  = document.getElementById('prof-university')?.value      || '';
  const arrival     = document.getElementById('prof-arrival')?.value         || '';

  let ok = true;
  if (!firstName)   { fieldError(document.getElementById('prof-first'),       'Required'); ok = false; }
  if (!lastName)    { fieldError(document.getElementById('prof-last'),        'Required'); ok = false; }
  if (!nationality) { fieldError(document.getElementById('prof-nationality'), 'Select your country'); ok = false; }
  if (!university)  { fieldError(document.getElementById('prof-university'),  'Select your university'); ok = false; }
  if (!ok) return;

  const btn = document.querySelector('#modal-profile-view .modal-submit');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  await createProfile(currentSession.user.id, currentSession.user.email, { firstName, lastName, nationality, university, arrival });
  await loadUserRsvps();
  await loadUserSavedListings();

  if (btn) { btn.textContent = 'Complete profile →'; btn.disabled = false; }
  setAuthStep('success');
  setTimeout(() => { closeAuth(); go('dashboard'); }, 1800);
}

// User menu toggle
function toggleUserMenu() { document.getElementById('nav-user-dropdown')?.classList.toggle('open'); }
function closeUserMenu()  { document.getElementById('nav-user-dropdown')?.classList.remove('open'); }

document.addEventListener('click', e => {
  const menu = document.getElementById('nav-user-menu');
  if (menu && !menu.contains(e.target)) closeUserMenu();
});

// ── 6. NAV & ROUTING ──────────────────────────────────────────────────────────
function go(page) {
  if (page === 'dashboard' && !currentSession)                              { openAuth('signin'); return; }
  if (page === 'admin'     && (!currentSession || !currentProfile?.is_admin)) { showToast('Admin access only'); return; }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(page);
  if (target) target.classList.add('active');

  document.querySelectorAll('[data-page]').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page));

  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initReveal, 50);
  document.getElementById('mobile-menu')?.classList.remove('open');

  if (page === 'guide')     { updateGuidePersonalization(); loadProgress(); }
  if (page === 'community') loadPosts();
  if (page === 'events')    { loadEvents(); }
  if (page === 'dashboard') renderDashboard();
  if (page === 'admin')     loadAdminPanel();
}

function toggleMenu() { document.getElementById('mobile-menu')?.classList.toggle('open'); }

// ── 7. SCROLL REVEAL ──────────────────────────────────────────────────────────
function initReveal() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: .08 });
  document.querySelectorAll('.page.active .reveal:not(.visible)').forEach(el => obs.observe(el));
}
initReveal();

// ── 8. GUIDE PERSONALISATION ──────────────────────────────────────────────────
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

// ── GUIDE PROGRESS ────────────────────────────────────────────────────────────
const TOTAL_STEPS = 12;
let completedSteps = 0;

async function loadProgress() {
  const saved = JSON.parse(localStorage.getItem('sc_progress') || '{}');

  // Merge DB progress for logged-in users
  if (sb && currentSession) {
    const { data } = await sb.from('checklist_progress')
      .select('step_index, completed').eq('user_id', currentSession.user.id);
    (data || []).forEach(r => { if (r.completed) saved[r.step_index] = true; });
  }

  completedSteps = 0;
  document.querySelectorAll('#guide .gstep').forEach((step, i) => {
    step.classList.toggle('done', !!saved[i]);
    if (saved[i]) completedSteps++;
  });
  updateProgress();
}

async function saveProgress() {
  const state = {};
  document.querySelectorAll('#guide .gstep').forEach((step, i) => {
    if (step.classList.contains('done')) state[i] = true;
  });
  localStorage.setItem('sc_progress', JSON.stringify(state));

  if (sb && currentSession && Object.keys(state).length) {
    const upserts = Object.entries(state).map(([idx]) => ({
      user_id:     currentSession.user.id,
      step_index:  parseInt(idx),
      completed:   true,
      completed_at: new Date().toISOString(),
    }));
    await sb.from('checklist_progress').upsert(upserts);
  }
}

function markDone(e, checkEl) {
  e.stopPropagation();
  const step    = checkEl.closest('.gstep');
  const wasDone = step.classList.contains('done');
  step.classList.toggle('done');
  completedSteps = wasDone ? completedSteps - 1 : completedSteps + 1;
  updateProgress();
  saveProgress();
  if (!wasDone) showToast('Task marked complete ✓');
}

function updateProgress() {
  const pct = Math.round((completedSteps / TOTAL_STEPS) * 100);
  const fill = document.getElementById('pb-fill');
  const text = document.getElementById('progress-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = `${completedSteps} of ${TOTAL_STEPS} tasks completed`;
  // Keep dashboard progress bar in sync
  const df = document.getElementById('dash-pb-fill');
  const dt = document.getElementById('dash-progress-text');
  if (df) df.style.width = pct + '%';
  if (dt) dt.textContent = `${completedSteps} of ${TOTAL_STEPS} tasks`;
}

// ── GUIDE SEARCH & NAVIGATION ─────────────────────────────────────────────────
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
    const match = kw.toLowerCase().includes(q);
    step.style.display = match ? 'block' : 'none';
    if (match) any = true;
  });
  noRes.style.display = any ? 'none' : 'block';
}

function switchCat(cat, btn) {
  document.querySelectorAll('#guide .guide-section').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
  document.querySelectorAll('#guide .cat-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('cat-' + cat);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelector(`#guide .cat-tab[data-cat="${cat}"]`)?.classList.add('active');
  document.getElementById('cat-tabs').style.display = 'flex';
  if (cat === 'housing-board') renderHousingBoard();
}

function toggleStep(header) { header.parentElement.classList.toggle('open'); }
function toggleFaq(q)       { q.parentElement.classList.toggle('open'); }

// ── 9. GLOBAL SEARCH ──────────────────────────────────────────────────────────
const searchIndex = [
  { title:'Codice Fiscale',           sub:'Documents · Tax code',                           page:'guide',     icon:'🔢', action:()=>{ go('guide'); switchCat('documents',null); } },
  { title:'Permesso di Soggiorno',    sub:'Documents · Residence permit (non-EU)',           page:'guide',     icon:'📋', action:()=>{ go('guide'); switchCat('documents',null); } },
  { title:'Residency Registration',   sub:'Documents · Comune di Siena',                    page:'guide',     icon:'🏛️', action:()=>{ go('guide'); switchCat('documents',null); } },
  { title:'Finding Accommodation',    sub:'Housing · DSU, private, flatshares',             page:'guide',     icon:'🏠', action:()=>{ go('guide'); switchCat('housing',null); } },
  { title:'Housing Board',            sub:'Housing · Rooms posted by students',             page:'guide',     icon:'🔑', action:()=>{ go('guide'); switchCat('housing-board',null); } },
  { title:'Bus Pass',                 sub:'Transport · Tiemme monthly pass',                page:'guide',     icon:'🎫', action:()=>{ go('guide'); switchCat('transport',null); } },
  { title:'Opening a Bank Account',   sub:'Banking · MPS, N26, Revolut',                   page:'guide',     icon:'💳', action:()=>{ go('guide'); switchCat('banking',null); } },
  { title:'Registering with a GP',    sub:'Health · National Health Service',               page:'guide',     icon:'👨‍⚕️', action:()=>{ go('guide'); switchCat('health',null); } },
  { title:'University Enrolment',     sub:'University · ESSE3, student ID',                page:'guide',     icon:'🎓', action:()=>{ go('guide'); switchCat('university',null); } },
  { title:'Events & Activities',      sub:'Browse upcoming student events',                 page:'events',    icon:'🎭', action:()=>go('events') },
  { title:'Community Forum',          sub:'Ask questions, share tips',                      page:'community', icon:'💬', action:()=>go('community') },
  { title:'Dashboard',                sub:'Your checklist, saved housing & events',         page:'dashboard', icon:'📊', action:()=>go('dashboard') },
  { title:'About the Founder',        sub:'Satish Chand Gupta · Siena 2026',               page:'about',     icon:'👤', action:()=>go('about') },
  { title:'Partner with Us',          sub:'Language schools, accommodation, businesses',    page:'about',     icon:'🤝', action:()=>{ go('about'); setTimeout(()=>document.getElementById('partner-section').scrollIntoView({behavior:'smooth'}),220); } },
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
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeSearch(); closeAuth(); } });

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

// ── 10. EVENTS (DB-backed with RSVP) ─────────────────────────────────────────
const EVENTS_FALLBACK = [
  { id:'ef1', cat:'social',   color:'#D8EAD8', emoji:'☕', event_date:'WED 7 MAY 2026',   title:'International Coffee Hour',             description:'Informal meetup for students from all over the world. Come make friends over an aperitivo.',                location:'Bar il Palio',              event_time:'6:00 PM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef2', cat:'academic', color:'#D3DFF0', emoji:'📚', event_date:'THU 14 MAY 2026',  title:'Bureaucracy Q&A Workshop',              description:'International Office staff walk you through permesso, codice fiscale, and residency step by step.',           location:'Rettorato, Aula Magna',     event_time:'10:00 AM', is_free:true,  price:null, rsvp_count:0 },
  { id:'ef3', cat:'cultural', color:'#F0E6D3', emoji:'🏛️', event_date:'SAT 17 MAY 2026',  title:'Palio Explained: History & Traditions', description:"A guided walk through Siena's most iconic event — the contrade, the race, centuries of rivalry.",          location:'Piazza del Campo',          event_time:'3:00 PM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef4', cat:'sport',    color:'#EAE0D3', emoji:'🏃', event_date:'SAT 24 MAY 2026',  title:'Student 5K Morning Run',                description:"A fun, non-competitive run through Siena's historic centre. All fitness levels welcome.",                    location:'Fortezza Medicea',          event_time:'9:00 AM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef5', cat:'cultural', color:'#E5D8F0', emoji:'🍝', event_date:'FRI 30 MAY 2026',  title:'Tuscan Cooking Class',                  description:'Learn to make pici pasta and ribollita from a local chef. Max 12 participants.',                               location:'Via Banchi di Sopra',       event_time:'5:30 PM',  is_free:false, price:'€15', rsvp_count:0 },
  { id:'ef6', cat:'social',   color:'#D3EAE4', emoji:'🎮', event_date:'SAT 6 JUN 2026',   title:'International Game Night',              description:'Board games and card games. Bring a favourite from your home country.',                                         location:'ESN Siena HQ',              event_time:'7:00 PM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef7', cat:'academic', color:'#F0DDD3', emoji:'🗣️', event_date:'TUE 10 JUN 2026',  title:'Language Exchange Evening',             description:"Pair up with Italian students and practise each other's languages in a relaxed format.",                        location:'Biblioteca Comunale',       event_time:'6:00 PM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef8', cat:'sport',    color:'#D3EAF0', emoji:'⚽', event_date:'SUN 14 JUN 2026',  title:'International Football Tournament',     description:'5-a-side open to all. Form a team or join one on the day.',                                                      location:'Campo Sportivo Fontebecci', event_time:'10:00 AM', is_free:true,  price:null, rsvp_count:0 },
  { id:'ef9', cat:'cultural', color:'#EAE6D3', emoji:'🎭', event_date:'FRI 19 SEP 2026',  title:'Welcome Week Opening Night',            description:'Kick off the new semester with music, food stalls, and a chance to meet the whole international community.',     location:'Piazza del Campo',          event_time:'7:00 PM',  is_free:true,  price:null, rsvp_count:0 },
  { id:'ef10',cat:'academic', color:'#D3DFF0', emoji:'🎓', event_date:'MON 22 SEP 2026',  title:'New Student Orientation',               description:'Everything you need to know about the university, admin, and life in Siena.',                                     location:'Rettorato, Aula Magna',     event_time:'9:00 AM',  is_free:true,  price:null, rsvp_count:0 },
];

async function loadEvents() {
  if (!sb) { eventsData = EVENTS_FALLBACK; renderEvents(); return; }
  const { data, error } = await sb.from('events').select('*').eq('is_published', true).order('created_at');
  eventsData = (!error && data?.length) ? data : EVENTS_FALLBACK;
  renderEvents();
}

let evtFilter = 'all';
function filterEvents(cat, btn) {
  evtFilter = cat;
  document.querySelectorAll('#events .ftag').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderEvents();
}

function renderEvents() {
  const q    = (document.getElementById('events-search-input') || { value:'' }).value.trim().toLowerCase();
  const grid = document.getElementById('events-grid');
  const noEv = document.getElementById('no-events');
  if (!grid) return;

  let list = evtFilter === 'all' ? eventsData : eventsData.filter(e => e.cat === evtFilter);
  if (q) list = list.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));

  grid.innerHTML = '';
  if (!list.length) { noEv.style.display = 'block'; return; }
  noEv.style.display = 'none';

  list.forEach(ev => {
    const isGoing   = rsvpdEventIds.has(ev.id);
    const rsvpCount = ev.rsvp_count || 0;
    const c = document.createElement('div'); c.className = 'ecard';
    c.innerHTML =
      `<div class="ecard-banner" style="background:${ev.color || '#D8EAD8'}">${ev.emoji || '🎭'}<span class="ecard-cat">${ev.cat}</span></div>` +
      `<div class="ecard-body"><div class="ecard-date">${ev.event_date}</div><h3>${ev.title}</h3><p>${ev.description}</p>` +
      `<div class="ecard-meta"><span>📍 ${ev.location}</span><span>🕐 ${ev.event_time}${rsvpCount > 0 ? ` · ${rsvpCount} going` : ''}</span></div></div>` +
      `<div class="ecard-footer"><span class="price ${ev.is_free ? 'free' : ''}">${ev.is_free ? 'Free' : ev.price}</span>` +
      `<button class="rsvp-btn${isGoing ? ' going' : ''}" data-id="${ev.id}" onclick="rsvpEvent(this)">${isGoing ? '✓ Going' : 'RSVP'}</button></div>`;
    grid.appendChild(c);
  });
}

async function rsvpEvent(btn) {
  const id      = btn.dataset.id;
  const isGoing = btn.classList.contains('going');

  if (!currentSession) {
    showToast('Sign in to RSVP to events');
    openAuth('signin');
    return;
  }

  const ev = eventsData.find(e => String(e.id) === String(id));
  if (isGoing) {
    if (sb) {
      await sb.from('event_rsvps').delete().eq('user_id', currentSession.user.id).eq('event_id', id);
      if (ev) ev.rsvp_count = Math.max(0, (ev.rsvp_count || 1) - 1);
    }
    rsvpdEventIds.delete(id);
    btn.classList.remove('going'); btn.textContent = 'RSVP';
    showToast('RSVP removed');
  } else {
    if (sb) {
      await sb.from('event_rsvps').insert({ user_id: currentSession.user.id, event_id: id });
      if (ev) ev.rsvp_count = (ev.rsvp_count || 0) + 1;
    }
    rsvpdEventIds.add(id);
    btn.classList.add('going'); btn.textContent = '✓ Going';
    if (ev) showToast(`You're going to ${ev.title.slice(0,30)}…`);
  }
  renderEvents();
}

// ── 11. HOUSING (DB-backed CRUD + save) ───────────────────────────────────────
const HOUSING_FALLBACK = [
  { id:'hf1', type:'Single room', area:'Centro Storico', price:420, available_from:'Jun 2026', description:'Bright room in shared flat with 2 other students. 5 min walk from Piazza del Campo. All bills included.', author_name:'Léa M.',   author_country:'🇫🇷', contact_email:'', contact_whatsapp:'', is_approved:true },
  { id:'hf2', type:'Studio',      area:'Viale Bracci',   price:680, available_from:'Sep 2026', description:'Private studio near Policlinico Le Scotte. Fully furnished, fast WiFi. Short walk to bus stop.',           author_name:'Marco B.', author_country:'🇮🇹', contact_email:'', contact_whatsapp:'', is_approved:true },
  { id:'hf3', type:'Double room', area:'San Miniato',    price:320, available_from:'May 2026', description:'Room in a large student house (6 people). Near university faculties. Bicycle available for use.',          author_name:'Priya S.', author_country:'🇮🇳', contact_email:'', contact_whatsapp:'', is_approved:true },
  { id:'hf4', type:'Single room', area:'Porta Romana',   price:390, available_from:'Jun 2026', description:'Quiet room with street view. Shared kitchen and bathroom with 1 other student. 10 min to university.',     author_name:'Amine B.', author_country:'🇹🇳', contact_email:'', contact_whatsapp:'', is_approved:true },
  { id:'hf5', type:'Single room', area:'Acquacalda',     price:350, available_from:'Sep 2026', description:'Affordable room near Tiemme bus stop. Good for students at any faculty. Bills not included (≈€50/mo).',    author_name:'Kaito T.', author_country:'🇯🇵', contact_email:'', contact_whatsapp:'', is_approved:true },
  { id:'hf6', type:'Studio',      area:'Centro Storico', price:720, available_from:'Oct 2026', description:'Independent studio apartment in the heart of the old city. Terrace with a view. Rare opportunity.',        author_name:'Sofia R.', author_country:'🇪🇸', contact_email:'', contact_whatsapp:'', is_approved:true },
];

async function loadHousingListings() {
  if (!sb) { housingData = HOUSING_FALLBACK; return; }
  const { data, error } = await sb
    .from('housing_listings').select('*')
    .eq('is_approved', true).eq('is_rented', false)
    .order('created_at', { ascending: false });
  housingData = (!error && data?.length) ? data : HOUSING_FALLBACK;
}

const CARD_COLORS = ['var(--terra)','var(--green)','var(--blue)','var(--purple)','#8B6A4A','var(--gold)'];
function listingColor(id) { return CARD_COLORS[Math.abs((id || '').toString().charCodeAt(0)) % CARD_COLORS.length]; }

function renderHousingBoard() {
  const grid = document.getElementById('housing-board-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!housingData.length) {
    grid.innerHTML = '<p style="color:var(--muted);font-size:.88rem;padding:2rem 0">No listings yet. Be the first to post a room!</p>';
    return;
  }

  housingData.forEach(h => {
    const isSaved  = savedListingIds.has(h.id);
    const isOwn    = currentSession && h.user_id === currentSession.user.id;
    const posted   = h.created_at ? timeAgo(h.created_at) : 'Recently';
    const initials = (h.author_name || 'A').charAt(0).toUpperCase();
    const color    = listingColor(h.id);
    const card = document.createElement('div');
    card.className = 'hb-card';
    card.innerHTML = `
      <div class="hb-top"><div class="hb-type">${h.type}</div><div class="hb-area">📍 ${h.area}</div></div>
      <div class="hb-price">€${h.price}<span>/month</span></div>
      <p class="hb-desc">${h.description}</p>
      <div class="hb-available">Available from <strong>${h.available_from}</strong></div>
      <div class="hb-footer">
        <div class="hb-author">
          <div class="avatar" style="background:${color};width:1.8rem;height:1.8rem;font-size:.7rem">${initials}</div>
          <div><div class="hb-name">${h.author_name} ${h.author_country || ''}</div><div class="hb-posted">${posted}</div></div>
        </div>
        <div style="display:flex;gap:.4rem;align-items:center">
          <button class="hb-save-btn${isSaved ? ' saved' : ''}" onclick="saveListing('${h.id}',this)" title="${isSaved ? 'Unsave' : 'Save'}">${isSaved ? '❤️' : '🤍'}</button>
          ${isOwn ? `<button class="hb-delete-btn" onclick="deleteListing('${h.id}')">Delete</button>` : ''}
          <button class="hb-contact" onclick="contactPoster('${escAttr(h.author_name)}','${escAttr(h.contact_email || '')}','${escAttr(h.contact_whatsapp || '')}')">Contact →</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function renderHousingTeaser() {
  const grid = document.getElementById('housing-teaser-grid');
  if (!grid) return;
  grid.innerHTML = '';
  housingData.slice(0, 3).forEach(h => {
    const card = document.createElement('div');
    card.className = 'hb-card';
    card.style.cursor = 'pointer';
    card.onclick = () => { go('guide'); setTimeout(() => switchCat('housing-board', null), 150); };
    const initials = (h.author_name || 'A').charAt(0).toUpperCase();
    const posted   = h.created_at ? timeAgo(h.created_at) : 'Recently';
    const color    = listingColor(h.id);
    card.innerHTML = `
      <div class="hb-top"><div class="hb-type">${h.type}</div><div class="hb-area">📍 ${h.area}</div></div>
      <div class="hb-price">€${h.price}<span>/month</span></div>
      <p class="hb-desc">${h.description}</p>
      <div class="hb-available">Available from <strong>${h.available_from}</strong></div>
      <div class="hb-footer">
        <div class="hb-author">
          <div class="avatar" style="background:${color};width:1.8rem;height:1.8rem;font-size:.7rem">${initials}</div>
          <div><div class="hb-name">${h.author_name} ${h.author_country || ''}</div><div class="hb-posted">${posted}</div></div>
        </div>
        <span class="hb-contact">View →</span>
      </div>`;
    grid.appendChild(card);
  });
}

// Post Room Modal
function openPostRoom() {
  if (!currentSession) { openAuth('signin'); showToast('Sign in to post a listing'); return; }
  document.getElementById('post-room-modal').classList.add('open');
}
function closePostRoom() {
  document.getElementById('post-room-modal').classList.remove('open');
  document.getElementById('post-room-form')?.reset();
}
function closePostRoomOutside(e) { if (e.target.id === 'post-room-modal') closePostRoom(); }

async function submitHousingListing() {
  if (!currentSession || !sb) { showToast('Sign in to post a listing'); return; }

  const type          = document.getElementById('pr-type').value;
  const area          = document.getElementById('pr-area').value.trim();
  const price         = parseInt(document.getElementById('pr-price').value);
  const available     = document.getElementById('pr-available').value.trim();
  const desc          = document.getElementById('pr-desc').value.trim();
  const contactEmail  = document.getElementById('pr-contact-email').value.trim();
  const contactWA     = document.getElementById('pr-contact-wa').value.trim();

  if (!type)                     { showToast('Select a room type'); return; }
  if (!area)                     { showToast('Enter the area / district'); return; }
  if (!price || price < 50)      { showToast('Enter a valid monthly price'); return; }
  if (!available)                { showToast('Enter when the room is available'); return; }
  if (!desc || desc.length < 20) { showToast('Write a description (min 20 characters)'); return; }

  const btn = document.querySelector('#post-room-form .modal-submit');
  if (btn) { btn.textContent = 'Submitting…'; btn.disabled = true; }

  const { error } = await sb.from('housing_listings').insert({
    user_id:         currentSession.user.id,
    type, area, price,
    available_from:  available,
    description:     desc,
    author_name:     currentProfile ? `${currentProfile.first_name} ${currentProfile.last_name.charAt(0)}.` : 'Anonymous',
    author_country:  '',
    contact_email:   contactEmail || currentSession.user.email,
    contact_whatsapp: contactWA,
    is_approved:     false,   // requires admin approval before going live
    is_rented:       false,
  });

  if (btn) { btn.textContent = 'Post listing →'; btn.disabled = false; }

  if (error) { showToast('Could not submit — try again'); return; }
  closePostRoom();
  showToast('Submitted! Your listing appears after admin approval ✓');
}

async function saveListing(id, btn) {
  if (!currentSession) { openAuth('signin'); showToast('Sign in to save listings'); return; }
  const isSaved = savedListingIds.has(id);
  if (isSaved) {
    if (sb) await sb.from('saved_listings').delete().eq('user_id', currentSession.user.id).eq('listing_id', id);
    savedListingIds.delete(id);
    if (btn) { btn.textContent = '🤍'; btn.classList.remove('saved'); }
    showToast('Listing unsaved');
  } else {
    if (sb) await sb.from('saved_listings').insert({ user_id: currentSession.user.id, listing_id: id });
    savedListingIds.add(id);
    if (btn) { btn.textContent = '❤️'; btn.classList.add('saved'); }
    showToast('Listing saved ❤️');
  }
}

async function deleteListing(id) {
  if (!confirm('Delete this listing permanently?')) return;
  if (sb) await sb.from('housing_listings').delete().eq('id', id).eq('user_id', currentSession.user.id);
  housingData = housingData.filter(h => h.id !== id);
  renderHousingBoard();
  showToast('Listing deleted');
}

function contactPoster(name, email, whatsapp) {
  if (!currentSession) { openAuth('signin'); showToast('Sign in to contact the poster'); return; }
  if (whatsapp) {
    window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank');
  } else if (email) {
    window.location.href = `mailto:${email}?subject=Room inquiry — Siena Connect`;
  } else {
    showToast(`Message ${name} via the community forum`);
  }
}

// ── 12. COMMUNITY / POSTS ────────────────────────────────────────────────────
const LOCAL_POSTS = [
  { id:1, author:'Priya S.',    initials:'P', color:'var(--terra)',  country:'🇮🇳 India',    time:'2 hours ago', tag:'Tip',      title:'Codice fiscale is easier than it looks',        body:"I was terrified but it took 20 minutes at the Agenzia delle Entrate. Bring your passport, they give it on the spot for free.",                                                     likes:14, liked:false, replies:[{ author:'Amine B.',   initials:'A', color:'var(--green)',  body:'Confirmed. Go early — there can be a queue by 10am.' }] },
  { id:2, author:'Amine B.',    initials:'A', color:'var(--green)',  country:'🇹🇳 Tunisia',  time:'Yesterday',   tag:'Question', title:'Where to find a language exchange partner?',   body:"Trying to improve my Italian while helping with French or Arabic. Is there a university group or should I use an app?",                                                         likes:8,  liked:false, replies:[{ author:'Léa M.',     initials:'L', color:'var(--purple)', body:'There is a Language Exchange Evening in the Events section — I found my exchange partner there last semester.' }] },
  { id:3, author:'Batmunkh G.', initials:'B', color:'var(--blue)',   country:'🇲🇳 Mongolia', time:'2 days ago',  tag:'Housing',  title:'Always request a registered rental contract', body:"My first landlord wanted a private agreement with no official contract. I could not register at the Comune or use it for the permesso. Always insist on a registered contract.",   likes:31, liked:false, replies:[{ author:'Kaito T.',   initials:'K', color:'#8B6A4A',       body:'So important. The Student Guide on here explains exactly what a valid contract looks like.' }] },
  { id:4, author:'Léa M.',      initials:'L', color:'var(--purple)', country:'🇫🇷 France',   time:'3 days ago',  tag:'Social',   title:'Anyone want to explore the Crete Senesi?',    body:"Looking for 2–3 people to share a car rental for a day trip this weekend. The landscape is stunning in spring.",                                                                  likes:19, liked:false, replies:[] },
  { id:5, author:'Kaito T.',    initials:'K', color:'#8B6A4A',       country:'🇯🇵 Japan',    time:'4 days ago',  tag:'Documents',title:'How long does the permesso actually take?',    body:"Submitted my kit postale 6 weeks ago with no Questura date yet. Is this normal?",                                                                                                 likes:5,  liked:false, replies:[{ author:'Priya S.',   initials:'P', color:'var(--terra)',  body:'6–10 weeks is normal. Keep the receipt — it acts as your temporary permit.' }] },
];
posts = [...LOCAL_POSTS];

async function loadPosts() {
  if (!sb) { renderPosts(); return; }
  const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending:false }).limit(50);
  if (error || !data?.length) { renderPosts(); return; }
  posts = data.map(p => ({
    id:       p.id,
    author:   p.author,
    initials: p.initials || p.author.charAt(0),
    color:    p.color    || 'var(--terra)',
    country:  p.country  || '🌍 International',
    time:     timeAgo(p.created_at),
    tag:      p.tag, title: p.title, body: p.body,
    likes:    p.likes || 0, liked: false, replies: [],
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
  const me = currentProfile ? currentProfile.first_name[0].toUpperCase() : 'Y';
  filtered.forEach(p => {
    const el = document.createElement('div'); el.className = 'post'; el.dataset.id = p.id;
    el.innerHTML =
      `<div class="post-top"><div class="avatar" style="background:${p.color}">${p.initials}</div>` +
      `<div class="post-meta"><div class="post-author">${p.author} <span style="font-size:.72rem;color:var(--light);font-weight:300">${p.country}</span></div><div class="post-info">${p.time}</div></div>` +
      `<span class="post-tag">${p.tag}</span></div>` +
      `<h4>${p.title}</h4><p>${p.body}</p>` +
      `<div class="post-actions">` +
      `<button class="pa-btn like-btn${p.liked ? ' liked' : ''}" onclick="likePost(${JSON.stringify(p.id)},this)">❤️ ${p.likes}</button>` +
      `<button class="pa-btn" onclick="toggleReplies(${JSON.stringify(p.id)})">💬 ${p.replies.length} ${p.replies.length === 1 ? 'reply' : 'replies'}</button>` +
      `</div>` +
      `<div class="replies-section" id="replies-${p.id}">` +
      p.replies.map(r =>
        `<div class="reply"><div class="avatar" style="background:${r.color};width:1.8rem;height:1.8rem;font-size:.7rem">${r.initials}</div>` +
        `<div class="reply-bubble"><div class="rb-author">${r.author}</div><p>${r.body}</p></div></div>`
      ).join('') +
      `<div class="reply-compose"><div class="avatar" style="width:1.8rem;height:1.8rem;font-size:.7rem">${me}</div>` +
      `<input id="reply-input-${p.id}" placeholder="Write a reply…" onkeydown="if(event.key==='Enter')submitReply(${JSON.stringify(p.id)})" />` +
      `<button onclick="submitReply(${JSON.stringify(p.id)})">Reply</button></div></div>`;
    list.appendChild(el);
  });
}

function toggleReplies(id) {
  const sec = document.getElementById('replies-' + id);
  sec?.classList.toggle('open');
  if (sec?.classList.contains('open')) document.getElementById('reply-input-' + id)?.focus();
}

async function likePost(id, btn) {
  const p = posts.find(x => x.id == id); if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
  btn.classList.toggle('liked', p.liked);
  btn.textContent = '❤️ ' + p.likes;
  if (sb && typeof id === 'string') {
    await sb.from('posts').update({ likes: p.likes }).eq('id', id);
  }
}

function submitReply(id) {
  const input = document.getElementById('reply-input-' + id);
  const txt   = input?.value.trim(); if (!txt) return;
  const p     = posts.find(x => x.id == id); if (!p) return;
  p.replies.push({
    author:   currentProfile ? `${currentProfile.first_name} ${currentProfile.last_name.charAt(0)}.` : 'You',
    initials: currentProfile ? currentProfile.first_name[0].toUpperCase() : 'Y',
    color:    'var(--terra)',
    body:     txt,
  });
  input.value = '';
  renderPosts();
  document.getElementById('replies-' + id)?.classList.add('open');
}

let selectedTag = '';
function selectTag(tag, btn) {
  document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  if (selectedTag === tag) { selectedTag = ''; return; }
  selectedTag = tag; btn.classList.add('sel');
}

async function submitPost() {
  const txt = document.getElementById('compose-text')?.value.trim(); if (!txt) return;
  const u   = currentProfile;
  const post = {
    author:   u ? `${u.first_name} ${u.last_name.charAt(0)}.` : 'Anonymous',
    initials: u ? u.first_name.charAt(0).toUpperCase() : 'A',
    color:    'var(--terra)',
    country:  u?.nationality || '🌍 International',
    tag:      selectedTag || 'Tip',
    title:    txt.slice(0,60) + (txt.length > 60 ? '…' : ''),
    body:     txt,
  };
  if (sb) {
    const { error } = await sb.from('posts').insert(post);
    if (error) { showToast('Could not save post — check connection'); return; }
  }
  posts.unshift({ ...post, id: Date.now(), time: 'Just now', likes: 0, liked: false, replies: [] });
  document.getElementById('compose-text').value = '';
  selectedTag = '';
  document.querySelectorAll('.ctag-btn').forEach(b => b.classList.remove('sel'));
  postFilter = 'all';
  document.querySelectorAll('.pf-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  renderPosts();
  showToast('Post shared with the community ✓');
}

// ── 13. DASHBOARD ─────────────────────────────────────────────────────────────
async function renderDashboard() {
  if (!currentProfile) return;

  // Greeting
  const p = currentProfile;
  const nameEl   = document.getElementById('dash-name');
  const subEl    = document.getElementById('dash-sub');
  const avatarEl = document.getElementById('dash-avatar');
  if (nameEl)   nameEl.textContent   = p.first_name;
  if (subEl)    subEl.textContent    = [p.university, p.nationality, p.is_eu ? '🇪🇺 EU' : '🌍 Non-EU'].filter(Boolean).join(' · ');
  if (avatarEl) avatarEl.textContent = ((p.first_name?.[0] || '') + (p.last_name?.[0] || '')).toUpperCase();

  // Progress
  await loadProgress();

  // Upcoming events (next 3)
  const eventsEl = document.getElementById('dash-events-list');
  if (eventsEl) {
    const upcoming = eventsData.slice(0, 3);
    eventsEl.innerHTML = upcoming.length
      ? upcoming.map(ev => `
          <div class="dei-item" onclick="go('events')">
            <span class="dei-emoji">${ev.emoji || '🎭'}</span>
            <div class="dei-text">
              <div class="dei-title">${ev.title}</div>
              <div class="dei-meta">${ev.event_date} · ${ev.location}</div>
            </div>
            <span class="dei-cat">${ev.cat}</span>
          </div>`).join('')
      : '<p style="color:var(--muted);font-size:.85rem">No upcoming events.</p>';
  }

  // Priority tasks (first 4 incomplete guide steps)
  const tasksEl = document.getElementById('dash-tasks');
  if (tasksEl) {
    const incomplete = Array.from(document.querySelectorAll('#guide .gstep'))
      .filter(s => !s.classList.contains('done')).slice(0, 4);
    tasksEl.innerHTML = incomplete.length
      ? incomplete.map(s => `
          <div class="dash-task-item" onclick="go('guide')">
            <span>${s.querySelector('.gstep-icon')?.textContent || '✓'}</span>
            <span>${s.querySelector('h4')?.textContent || 'Task'}</span>
            <span class="dti-arrow">→</span>
          </div>`).join('')
      : '<p style="color:var(--green);font-size:.85rem">All tasks complete! 🎉</p>';
  }

  // Saved listings
  await renderDashboardSavedListings();
}

async function renderDashboardSavedListings() {
  const el = document.getElementById('dash-saved-listings');
  if (!el) return;
  const saved = housingData.filter(h => savedListingIds.has(h.id));
  if (!saved.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:.85rem">No saved listings. <a onclick="go(\'guide\');setTimeout(()=>switchCat(\'housing-board\',null),150)" style="color:var(--terra);cursor:pointer;text-decoration:underline">Browse the Housing Board →</a></p>';
    return;
  }
  el.innerHTML = `<div class="dash-saved-grid">${saved.map(h => `
    <div class="dash-saved-card">
      <div class="dsc-type">${h.type} · ${h.area}</div>
      <div class="dsc-price">€${h.price}<span>/mo</span></div>
      <div class="dsc-desc">${h.description.slice(0,80)}…</div>
      <div class="dsc-actions">
        <button class="btn-primary" style="font-size:.72rem;padding:.35rem .85rem" onclick="contactPoster('${escAttr(h.author_name)}','${escAttr(h.contact_email || '')}','${escAttr(h.contact_whatsapp || '')}')">Contact →</button>
        <button onclick="saveListing('${h.id}',null);renderDashboard()" class="dsc-remove">Remove</button>
      </div>
    </div>`).join('')}</div>`;
}

// ── 14. ADMIN PANEL ───────────────────────────────────────────────────────────
let adminTab = 'housing';

async function loadAdminPanel() {
  if (!currentProfile?.is_admin) return;
  document.querySelectorAll('.at-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  switchAdminTab(adminTab, null);
}

function switchAdminTab(tab, btn) {
  adminTab = tab;
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.at-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('admin-' + tab)?.classList.add('active');
  if (btn) btn.classList.add('active');
  else document.querySelector(`.at-btn[data-tab="${tab}"]`)?.classList.add('active');

  const loaders = { housing: loadAdminHousing, events: loadAdminEvents, users: loadAdminUsers, posts: loadAdminPosts };
  loaders[tab]?.();
}

async function loadAdminHousing() {
  const el = document.getElementById('admin-housing'); if (!el || !sb) return;
  el.innerHTML = '<p class="admin-loading">Loading…</p>';
  const { data } = await sb.from('housing_listings').select('*').order('created_at', { ascending: false });
  if (!data?.length) { el.innerHTML = '<p class="admin-empty">No listings yet.</p>'; return; }
  el.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Type</th><th>Area</th><th>Price</th><th>Author</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${data.map(h => `<tr>
      <td>${h.type}</td><td>${h.area}</td><td>€${h.price}</td><td>${h.author_name}</td>
      <td><span class="admin-badge ${h.is_rented ? 'rented' : h.is_approved ? 'approved' : 'pending'}">${h.is_rented ? 'Rented' : h.is_approved ? 'Live' : 'Pending'}</span></td>
      <td class="admin-actions-cell">
        ${!h.is_approved
          ? `<button class="adm-btn approve" onclick="adminApproveHousing('${h.id}',true)">Approve</button>`
          : `<button class="adm-btn reject"  onclick="adminApproveHousing('${h.id}',false)">Unpublish</button>`}
        <button class="adm-btn delete" onclick="adminDeleteHousing('${h.id}')">Delete</button>
      </td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function adminApproveHousing(id, approve) {
  if (!sb) return;
  await sb.from('housing_listings').update({ is_approved: approve }).eq('id', id);
  showToast(approve ? 'Listing approved ✓' : 'Listing unpublished');
  loadAdminHousing();
  await loadHousingListings();
  renderHousingBoard();
}

async function adminDeleteHousing(id) {
  if (!confirm('Delete this listing permanently?')) return;
  await sb.from('housing_listings').delete().eq('id', id);
  showToast('Listing deleted');
  loadAdminHousing();
  await loadHousingListings();
}

async function loadAdminEvents() {
  const el = document.getElementById('admin-events'); if (!el || !sb) return;
  const { data } = await sb.from('events').select('*').order('created_at', { ascending: false });
  el.innerHTML = `
    <div class="admin-add-row">
      <button class="btn-primary" style="font-size:.8rem;padding:.55rem 1.2rem" onclick="toggleAdminAddEvent()">+ Add Event</button>
    </div>

    <!-- Add Event Form -->
    <div id="admin-add-event-form" style="display:none" class="admin-inline-form">
      <h4>Add New Event</h4>
      <div class="form-row">
        <div class="form-group"><label>Title</label><input id="ae-title" placeholder="Event title" /></div>
        <div class="form-group"><label>Category</label>
          <select id="ae-cat"><option value="social">Social</option><option value="cultural">Cultural</option><option value="academic">Academic</option><option value="sport">Sport</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Date</label><input id="ae-date" placeholder="e.g. WED 7 MAY 2026" /></div>
        <div class="form-group"><label>Time</label><input id="ae-time" placeholder="e.g. 6:00 PM" /></div>
      </div>
      <div class="form-group"><label>Location</label><input id="ae-location" placeholder="Venue and address" /></div>
      <div class="form-group"><label>Description</label><textarea id="ae-desc" rows="2" style="width:100%;border:1.5px solid rgba(196,98,58,.2);border-radius:10px;padding:.65rem 1rem;font-size:.88rem;resize:vertical;outline:none;font-family:inherit"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Emoji</label><input id="ae-emoji" placeholder="🎭" maxlength="2" style="font-size:1.2rem" /></div>
        <div class="form-group"><label>Price (leave blank if free)</label><input id="ae-price" placeholder="€15" /></div>
      </div>
      <button class="btn-primary" style="margin-top:.3rem" onclick="adminSaveEvent()">Save event →</button>
      <button onclick="toggleAdminAddEvent()" style="margin-left:.7rem;background:none;border:none;color:var(--muted);cursor:pointer;font-size:.85rem">Cancel</button>
    </div>

    ${!data?.length ? '<p class="admin-empty">No events in DB. Add the first one above.</p>' : `
    <div class="admin-table-wrap"><table class="admin-table">
      <thead><tr><th>Title</th><th>Date</th><th>Cat</th><th>Free?</th><th>Actions</th></tr></thead>
      <tbody>${data.map(ev => `<tr>
        <td>${ev.title}</td><td>${ev.event_date}</td><td>${ev.cat}</td>
        <td>${ev.is_free ? '✓ Free' : ev.price || '—'}</td>
        <td><button class="adm-btn delete" onclick="adminDeleteEvent('${ev.id}')">Delete</button></td>
      </tr>`).join('')}</tbody>
    </table></div>`}`;
}

function toggleAdminAddEvent() {
  const form = document.getElementById('admin-add-event-form');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function adminSaveEvent() {
  const title    = document.getElementById('ae-title')?.value.trim();
  const cat      = document.getElementById('ae-cat')?.value;
  const date     = document.getElementById('ae-date')?.value.trim();
  const time     = document.getElementById('ae-time')?.value.trim();
  const location = document.getElementById('ae-location')?.value.trim();
  const desc     = document.getElementById('ae-desc')?.value.trim();
  const emoji    = document.getElementById('ae-emoji')?.value.trim() || '🎭';
  const priceRaw = document.getElementById('ae-price')?.value.trim();

  if (!title || !date || !time || !location || !desc) { showToast('Fill in all required fields'); return; }

  const { error } = await sb.from('events').insert({
    title, cat, event_date: date, event_time: time, location, description: desc,
    emoji, is_free: !priceRaw, price: priceRaw || null,
    color: { social:'#D3EAE4', cultural:'#F0E6D3', academic:'#D3DFF0', sport:'#EAE0D3' }[cat] || '#D8EAD8',
    is_published: true, rsvp_count: 0,
  });

  if (error) { showToast('Error saving event'); return; }
  showToast('Event added ✓');
  await loadEvents();
  loadAdminEvents();
}

async function adminDeleteEvent(id) {
  if (!confirm('Delete this event permanently?')) return;
  await sb.from('events').delete().eq('id', id);
  showToast('Event deleted');
  await loadEvents();
  loadAdminEvents();
}

async function loadAdminUsers() {
  const el = document.getElementById('admin-users'); if (!el || !sb) return;
  el.innerHTML = '<p class="admin-loading">Loading…</p>';
  const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  if (!data?.length) { el.innerHTML = '<p class="admin-empty">No users yet.</p>'; return; }
  el.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Name</th><th>Email</th><th>Nationality</th><th>University</th><th>Joined</th><th>Actions</th></tr></thead>
    <tbody>${data.map(u => `<tr>
      <td>${u.first_name} ${u.last_name}</td><td>${u.email}</td>
      <td>${u.nationality || '—'}</td><td>${u.university || '—'}</td>
      <td>${new Date(u.created_at).toLocaleDateString('en-GB')}</td>
      <td>${u.is_admin
        ? '<span class="admin-badge approved">Admin</span>'
        : `<button class="adm-btn delete" onclick="adminDeleteUser('${u.id}')">Remove</button>`}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function adminDeleteUser(id) {
  if (!confirm('Remove this user? Cannot be undone.')) return;
  await sb.from('profiles').delete().eq('id', id);
  showToast('User removed');
  loadAdminUsers();
}

async function loadAdminPosts() {
  const el = document.getElementById('admin-posts'); if (!el || !sb) return;
  el.innerHTML = '<p class="admin-loading">Loading…</p>';
  const { data } = await sb.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
  if (!data?.length) { el.innerHTML = '<p class="admin-empty">No posts yet.</p>'; return; }
  el.innerHTML = `<div class="admin-table-wrap"><table class="admin-table">
    <thead><tr><th>Author</th><th>Tag</th><th>Title</th><th>Likes</th><th>Date</th><th>Actions</th></tr></thead>
    <tbody>${data.map(p => `<tr>
      <td>${p.author}</td><td>${p.tag}</td><td>${(p.title || '').slice(0,40)}</td>
      <td>${p.likes || 0}</td><td>${new Date(p.created_at).toLocaleDateString('en-GB')}</td>
      <td><button class="adm-btn delete" onclick="adminDeletePost('${p.id}')">Delete</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function adminDeletePost(id) {
  if (!confirm('Delete this post?')) return;
  await sb.from('posts').delete().eq('id', id);
  showToast('Post deleted');
  loadAdminPosts();
}

// ── 15. PARTNER ENQUIRY ───────────────────────────────────────────────────────
async function submitPartnerInquiry() {
  const name  = document.getElementById('partner-name')?.value.trim()  || '';
  const email = document.getElementById('partner-email')?.value.trim() || '';
  const type  = document.getElementById('partner-type')?.value         || '';
  if (!name)                       { showToast('Please enter your name or business.'); return; }
  if (!email || !email.includes('@')) { showToast('Please enter a valid email address.'); return; }
  if (sb) {
    const { error } = await sb.from('partner_inquiries').insert({ name, email, business_type: type || 'Not specified' });
    showToast(!error ? "Thanks! We'll be in touch within 48 hours 🤝" : 'Thanks! Email us at hello@sienaconnect.com');
  } else {
    showToast('Thanks! Email us at hello@sienaconnect.com');
  }
  if (document.getElementById('partner-name'))  document.getElementById('partner-name').value  = '';
  if (document.getElementById('partner-email')) document.getElementById('partner-email').value = '';
  if (document.getElementById('partner-type'))  document.getElementById('partner-type').value  = '';
}

// ── 16. LIVE STATS ────────────────────────────────────────────────────────────
async function loadLiveStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const { users, listings, events: evtCount } = await res.json();

    const counterEl = document.getElementById('trust-counter');
    if (counterEl && users > 10) animateCounter(counterEl, users, 1800);

    // Update stats bar
    const statNums = document.querySelectorAll('#home .stat-item .n');
    if (statNums[0] && users    > 0) statNums[0].textContent = users.toLocaleString()    + '+';
    if (statNums[2] && evtCount > 0) statNums[2].textContent = evtCount.toString();

    // Live listing count badge
    const listBadge = document.getElementById('live-listing-count');
    if (listBadge && listings > 0) listBadge.textContent = listings + ' active rooms';
  } catch (_) { /* non-critical */ }
}

// ── 17. COUNTERS & BANNERS ────────────────────────────────────────────────────
function animateCounter(el, target, duration) {
  const start = performance.now();
  (function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  })(performance.now());
}

(function initCounter() {
  const el = document.getElementById('trust-counter');
  if (!el) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { loadLiveStats(); obs.disconnect(); } });
  }, { threshold: 0.5 });
  obs.observe(el);
})();

function dismissBanner() {
  document.getElementById('urgency-banner')?.classList.add('hidden');
  document.body.classList.remove('has-banner');
  sessionStorage.setItem('sc_banner_dismissed', '1');
}

(function initBanner() {
  if (sessionStorage.getItem('sc_banner_dismissed')) {
    document.getElementById('urgency-banner')?.classList.add('hidden');
  } else {
    document.body.classList.add('has-banner');
  }
})();

// ── 18. BOOT ──────────────────────────────────────────────────────────────────
async function bootApp() {
  await loadHousingListings();
  await loadEvents();
  loadPosts();
  loadProgress();
  updateGuidePersonalization();
  renderHousingTeaser();
}

// Populate dropdowns immediately so they're ready before any Supabase async work
document.addEventListener('DOMContentLoaded', populateNationalitySelects);

// Kick everything off
initSupabase();
