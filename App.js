import supabase from "./supabaseClient.js";

// --- STATE MANAGEMENT ---
let notices = [];
let activities = [];
let profile = {
  nickname: 'Resident_101',
  area: 'Anna Nagar Colony',
  role: 'Resident',
  familySize: 4,
  notificationSound: true,
  dailyDigest: true,
  mutedCategories: [],
  onboardingCompleted: true
};

let currentScreen = 'splash';
let previousScreen = 'splash';
let postCategory = 'power';
let postUrgency = 'normal';
let postExpiryDays = 3;
let postExpiryLabel = '3 Days';
let activeSearchCategory = 'All';
let activeSearchUrgency = 'All';
let activeFeedTab = 'All';
let searchKeyword = '';
let viewArchivedNotices = false;
let activeDetailNotice = null;
let isAdminLoggedIn = false;
let backendMode = 'sandbox'; // 'sandbox' or 'supabase'

// --- DATA SEEDS ---
const residents = [
  {
    username: "resident",
    password: "1234",
    name: "Rahul Kumar",
    block: "Block A",
    colony: "Anna Nagar Colony",
    room: "A-203"
  },
  {
    username: "admin",
    password: "123",
    name: "Admin",
    block: "Office",
    colony: "Anna Nagar Colony",
    room: "Admin"
  }
];

// --- DOM ELEMENTS & SETUP ---
const screenViewport = document.getElementById('screen-container');
const logsTerminal = document.getElementById('terminal-logs-box');
const API_BASE = 'http://localhost:3005/api';

// Initialize Workspace App
document.addEventListener('DOMContentLoaded', () => {
  addLog('Initializing LocalPulse web simulator components...', 'cyan');
  
  // Event listeners for backend selector toggles
  document.getElementById('btn-sandbox').addEventListener('click', () => setBackendMode('sandbox'));
  document.getElementById('btn-supabase').addEventListener('click', () => setBackendMode('supabase'));
  
  // Modal configurations
  const modal = document.getElementById('config-modal');
  if (modal) {
    document.getElementById('open-config-btn').addEventListener('click', () => modal.style.display = 'flex');
    document.getElementById('close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('cancel-config-btn').addEventListener('click', () => modal.style.display = 'none');
  }
  
  // Profile Controller bindings
  document.getElementById('update-profile-btn').addEventListener('click', applyControllerProfile);
  
  // Handle auto login routing cleanly
  const savedUser = localStorage.getItem("loggedInUser");
  if (savedUser) {
    const user = JSON.parse(savedUser);
    profile.nickname = user.name;
    profile.area = user.colony;
    if (user.username === "admin") {
      profile.role = "Admin";
      isAdminLoggedIn = true;
    }
    setScreen("feed");
  } else {
    setScreen("login");
  }

  // Load Initial Data
  syncData();
  
  // Periodic sync check (offline/live pooling loop)
  setInterval(syncData, 10000);
});

// Logs Helper
function addLog(message, type = '') {
  if (!logsTerminal) return;
  const line = document.createElement('div');
  line.className = 'log-line';
  const now = new Date().toLocaleTimeString();
  
  let formatted = `[${now}] `;
  if (type === 'cyan') {
    formatted += `<span class="cyan">${message}</span>`;
  } else if (type === 'red') {
    formatted += `<span class="red">${message}</span>`;
  } else {
    formatted += message;
  }
  
  line.innerHTML = formatted;
  logsTerminal.appendChild(line);
  logsTerminal.scrollTop = logsTerminal.scrollHeight;
}

// Synchronize all data reactively from Sandbox or Supabase DB
async function syncData() {
  try {
    if (backendMode === 'supabase') {
      // Fetch dynamic data from Supabase DB Client
      let { data: sbNotices, error: nErr } = await supabase.from('notices').select('*');
      if (nErr) throw nErr;
      notices = sbNotices || [];

      let { data: sbProfile, error: pErr } = await supabase.from('profile').select('*').single();
      if (!pErr && sbProfile) profile = sbProfile;

      let { data: sbAct, error: aErr } = await supabase.from('activities').select('*').order('created_at', { ascending: false });
      if (!aErr) activities = sbAct || [];
    } else {
      // Sandbox fallback REST fetches
      const resNotices = await fetch(`${API_BASE}/notices`);
      notices = await resNotices.json();
      
      const resProfile = await fetch(`${API_BASE}/profile`);
      profile = await resProfile.json();
      
      const resActivities = await fetch(`${API_BASE}/activities`);
      activities = await resActivities.json();
    }
    
    updateMetrics();
    renderFeedNotices();
    renderSearchNotices();
    renderProfileScreen();
    renderAdminPanel();
    renderNotificationLog();
    
    // UI controller sync elements
    const simNick = document.getElementById('sim-nickname');
    const simRole = document.getElementById('sim-role');
    const simArea = document.getElementById('sim-area');
    if (simNick) simNick.value = profile.nickname;
    if (simRole) simRole.value = profile.role;
    if (simArea) simArea.value = profile.area;

  } catch (e) {
    addLog('Offline Merge or Sync error: Local notices caching architecture active.', 'red');
    console.error(e);
  }
}

// Update Widgets, Metrics and Layout labels
function updateMetrics() {
  const activeCount = notices.filter(n => !n.archived).length;
  const pinnedCount = notices.filter(n => n.pinned && !n.archived).length;
  const urgentCount = notices.filter(n => n.urgency === 'urgent' && !n.archived).length;
  const totalVotes = notices.reduce((sum, n) => sum + (n.upvotes || 0), 0);

  const weeklyPostsEl = document.getElementById('widget-weekly-posts');
  if (weeklyPostsEl) weeklyPostsEl.innerText = activeCount;
  
  const mostUpvotedEl = document.getElementById('widget-most-upvoted');
  if (mostUpvotedEl) {
    mostUpvotedEl.innerText = `${Math.max(...notices.map(n => n.upvotes || 0), 0)} upvotes`;
  }
  
  const categories = notices.map(n => n.category).filter(Boolean);
  const topCat = categories.sort((a,b) =>
        categories.filter(v => v===a).length - categories.filter(v => v===b).length
  ).pop() || 'None';
  
  const topCatEl = document.getElementById('widget-top-category');
  if (topCatEl) topCatEl.innerText = topCat.toUpperCase();

  // Feed Header stats
  const statActive = document.getElementById('stat-active-count');
  const statPinned = document.getElementById('stat-pinned-count');
  const statUrgent = document.getElementById('stat-urgent-count');
  if (statActive) statActive.innerText = activeCount;
  if (statPinned) statPinned.innerText = pinnedCount;
  if (statUrgent) statUrgent.innerText = urgentCount;
  
  // Urgent notification broadcast systems banner
  const urgentAlertBox = document.getElementById('urgent-alert-banner');
  if (urgentAlertBox) {
    if (urgentCount > 0) {
      urgentAlertBox.style.display = 'flex';
      document.getElementById('urgent-alert-count').innerText = urgentCount;
    } else {
      urgentAlertBox.style.display = 'none';
    }
  }

  // Admin and Digest board monitors
  if (document.getElementById('adm-active')) document.getElementById('adm-active').innerText = activeCount;
  if (document.getElementById('adm-pinned')) document.getElementById('adm-pinned').innerText = pinnedCount;
  if (document.getElementById('adm-urgent')) document.getElementById('adm-urgent').innerText = urgentCount;
  if (document.getElementById('adm-upvotes')) document.getElementById('adm-upvotes').innerText = totalVotes;
  
  if (document.getElementById('dig-count')) document.getElementById('dig-count').innerText = activeCount;
  if (document.getElementById('dig-cat')) document.getElementById('dig-cat').innerText = `${topCat.toUpperCase()} (${notices.filter(n => n.category === topCat).length})`;
  if (document.getElementById('dig-upvoted')) document.getElementById('dig-upvoted').innerText = `${Math.max(...notices.map(n => n.upvotes || 0), 0)} upvotes`;
  if (document.getElementById('dig-archived')) document.getElementById('dig-archived').innerText = notices.filter(n => n.archived).length;
}

// Router view switcher inside emulator
function setScreen(screenName) {
  if (screenName !== "login" && !localStorage.getItem("loggedInUser")) {
    screenName = "login";
  }

  previousScreen = currentScreen;
  currentScreen = screenName;

  const screens = document.querySelectorAll('.sim-screen');
  screens.forEach(s => s.classList.remove('active-screen'));

  const target = document.getElementById(`scr-${screenName}`);
  if (target) {
    target.classList.add('active-screen');
    addLog(`Simulator rendered screen: [${screenName}]`, 'cyan');
  }

  if (screenName === 'feed') {
    renderFeedNotices();
  }
}

// --- RENDERING PIPELINES ---
function renderFeedNotices() {
  const container = document.getElementById('feed-notices-container');
  if (!container) return;
  container.innerHTML = '';
  
  const areaBadge = document.getElementById('feed-area-badge');
  if (areaBadge) areaBadge.innerText = `🏘️ ${profile.area || 'Anna Nagar'}`;

  // Filter local array data cleanly
  let filtered = notices.filter(n => !n.archived && n.area && n.area.toLowerCase() === (profile.area || '').toLowerCase());
  
  if (activeFeedTab === 'Pinned') {
    filtered = filtered.filter(n => n.pinned);
  } else if (activeFeedTab === 'Today') {
    const today = new Date();
    today.setHours(0,0,0,0);
    filtered = filtered.filter(n => new Date(n.created_at || n.id) >= today);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 30px 10px;">
        <span style="font-size: 32px;">📭</span>
        <h4 style="font-size: 13px; color: var(--text-primary); margin-top: 8px;">No notices active</h4>
        <p style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Notice board is clear.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(notice => {
    const card = document.createElement('div');
    card.className = `notice-card ${notice.pinned ? 'pinned-card' : ''} ${notice.urgency === 'urgent' ? 'urgent-card' : ''} ${notice.urgency === 'important' ? 'important-card' : ''}`;
    
    const isUpvotedByMe = notice.upvoted_by && notice.upvoted_by.includes(profile.nickname);
    const expiresText = getExpiresLabel(notice.expires_at);

    card.innerHTML = `
      <div class="urgency-border"></div>
      <div class="notice-card-content">
        <div class="card-header-row">
          <h4>${notice.pinned ? '📌 ' : ''}${notice.title}</h4>
          <span class="category-badge ${notice.category}">${notice.category.toUpperCase()}</span>
        </div>
        <p class="card-description">${notice.description}</p>
        <div class="card-meta-row">
          <span class="meta-pill">👤 ${notice.author}</span>
          <span class="meta-pill">🕐 ${timeAgo(notice.created_at || notice.id)}</span>
          <span class="meta-pill">${expiresText}</span>
        </div>
        <div class="card-actions-row">
          <button class="card-upvote-btn ${isUpvotedByMe ? 'upvoted' : ''}" onclick="toggleUpvoteNotice('${notice.id}')">
            👍 ${notice.upvotes || 0}
          </button>
          <span class="card-detail-btn" onclick="viewNoticeDetails('${notice.id}')">View Details →</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function setFeedTab(tab) {
  activeFeedTab = tab;
  document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
  
  if (tab === 'All') document.getElementById('tab-all')?.classList.add('active');
  if (tab === 'Pinned') document.getElementById('tab-pinned')?.classList.add('active');
  if (tab === 'Today') document.getElementById('tab-today')?.classList.add('active');

  renderFeedNotices();
}

function filterByUrgentOnly() {
  setScreen('feed');
  const container = document.getElementById('feed-notices-container');
  if (!container) return;
  container.innerHTML = '';

  const urgentNotices = notices.filter(n =>
    n.urgency === 'urgent' && !n.archived && n.area && n.area.toLowerCase() === (profile.area || '').toLowerCase()
  );

  if (urgentNotices.length === 0) {
    container.innerHTML = `<div style="padding:20px; text-align:center;">No urgent notices found.</div>`;
    return;
  }

  urgentNotices.forEach(notice => {
    const card = document.createElement('div');
    card.className = 'notice-card urgent-card';
    card.innerHTML = `
      <div class="urgency-border"></div>
      <div class="notice-card-content">
        <div class="card-header-row">
          <h4>🚨 ${notice.title}</h4>
          <span class="category-badge ${notice.category}">${notice.category.toUpperCase()}</span>
        </div>
        <p class="card-description">${notice.description}</p>
        <div class="card-meta-row">
          <span class="meta-pill">👤 ${notice.author}</span>
          <span class="meta-pill">👍 ${notice.upvotes || 0}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  addLog('Displaying all urgent notices.', 'cyan');
}

// --- BUSINESS ACTION HANDLERS ---
async function toggleUpvoteNotice(id) {
  addLog(`Upvoting notice: [${id}]`);
  try {
    if (backendMode === 'supabase') {
      const noticeToVote = notices.find(n => n.id === id);
      if (!noticeToVote) return;
      
      let upvotedByArray = noticeToVote.upvoted_by || [];
      let newUpvotesCount = noticeToVote.upvotes || 0;
      
      if (upvotedByArray.includes(profile.nickname)) {
        upvotedByArray = upvotedByArray.filter(name => name !== profile.nickname);
        newUpvotesCount = Math.max(0, newUpvotesCount - 1);
      } else {
        upvotedByArray.push(profile.nickname);
        newUpvotesCount += 1;
      }

      const { data, error } = await supabase
        .from('notices')
        .update({ upvotes: newUpvotesCount, upvoted_by: upvotedByArray })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      addLog(`Notice vote synchronized live via Supabase. Total: ${data.upvotes}`);
    } else {
      const res = await fetch(`${API_BASE}/notices/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, nickname: profile.nickname })
      });
      const updated = await res.json();
      addLog(`Notice vote count sandbox: ${updated.upvotes}`);
    }
    syncData();
  } catch (e) {
    addLog('Upvote sync error: backend interaction failed.', 'red');
    console.error(e);
  }
}

function viewNoticeDetails(id) {
  const notice = notices.find(n => n.id === id);
  if (!notice) return;
  
  activeDetailNotice = notice;
  
  document.getElementById('detail-title-text').innerText = notice.title;
  document.getElementById('detail-desc-text').innerText = notice.description;
  document.getElementById('detail-author').innerText = notice.author;
  document.getElementById('detail-contact').innerText = notice.contact || 'Not Provided';
  document.getElementById('detail-created').innerText = timeAgo(notice.created_at || notice.id);
  document.getElementById('detail-expires').innerText = getExpiresLabel(notice.expires_at);
  document.getElementById('detail-upvotes').innerText = notice.upvotes || 0;
  
  const cat = document.getElementById('detail-category');
  cat.className = `category-badge detail-cat ${notice.category}`;
  cat.innerText = notice.category.toUpperCase();

  const urg = document.getElementById('detail-urgency');
  urg.className = `urgency-badge detail-urg ${notice.urgency}`;
  urg.innerText = notice.urgency.toUpperCase();

  const upvoteBtn = document.getElementById('detail-upvote-btn');
  const isUpvotedByMe = notice.upvoted_by && notice.upvoted_by.includes(profile.nickname);
  if (isUpvotedByMe) {
    upvoteBtn.classList.add('active');
    document.getElementById('detail-upvote-btn-text').innerText = `Upvoted (${notice.upvotes || 0})`;
  } else {
    upvoteBtn.classList.remove('active');
    document.getElementById('detail-upvote-btn-text').innerText = `${notice.upvotes || 0} Upvotes`;
  }

  // Admin moderation panels layout
  const adminBox = document.getElementById('detail-admin-controls');
  if (profile.role === 'Admin' || isAdminLoggedIn) {
    if (adminBox) adminBox.style.display = 'block';
    const pinBtn = document.getElementById('detail-admin-pin-btn');
    if (pinBtn) pinBtn.innerText = notice.pinned ? '📍 Unpin Notice' : '📌 Pin Notice';
  } else {
    if (adminBox) adminBox.style.display = 'none';
  }

  setScreen('detail');
}

async function toggleUpvoteDetail() {
  if (activeDetailNotice) {
    await toggleUpvoteNotice(activeDetailNotice.id);
    setTimeout(() => {
      viewNoticeDetails(activeDetailNotice.id);
    }, 200);
  }
}

async function togglePinDetail() {
  if (activeDetailNotice) {
    addLog(`Admin pin toggling: [${activeDetailNotice.id}]`);
    if (backendMode === 'supabase') {
      const { error } = await supabase
        .from('notices')
        .update({ pinned: !activeDetailNotice.pinned })
        .eq('id', activeDetailNotice.id);
      if (error) console.error(error);
    } else {
      await fetch(`${API_BASE}/notices/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeDetailNotice.id })
      });
    }
    setTimeout(() => {
      syncData().then(() => viewNoticeDetails(activeDetailNotice.id));
    }, 250);
  }
}

async function deleteNoticeDetail() {
  if (activeDetailNotice && confirm('Wipe notice from community board?')) {
    addLog(`Admin notice deletion: [${activeDetailNotice.id}]`);
    if (backendMode === 'supabase') {
      const { error } = await supabase.from('notices').delete().eq('id', activeDetailNotice.id);
      if (error) console.error(error);
    } else {
      await fetch(`${API_BASE}/notices/${activeDetailNotice.id}`, { method: 'DELETE' });
    }
    setScreen('feed');
    syncData();
  }
}

// --- CREATION & PUBLISHING LOGIC ---
function selectPostCategory(el, category) {
  postCategory = category;
  document.querySelectorAll('.cat-option').forEach(opt => opt.classList.remove('active'));
  el.classList.add('active');
  addLog(`Posting Category selected: [${category}]`);
}

function savePostDetails() {
  const title = document.getElementById('post-title').value.trim();
  const description = document.getElementById('post-description').value.trim();
  
  if (!title || !description) {
    alert('Please enter a title and description.');
    return;
  }
  setScreen('post_urgency');
}

function selectPostUrgency(el, urgency) {
  postUrgency = urgency;
  document.querySelectorAll('.urg-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  
  let helper = 'Normal notices appear chronologically in the main notices feed.';
  if (urgency === 'urgent') helper = 'Urgent notices appear at the top of the feed with a red alert banner.';
  if (urgency === 'important') helper = 'Important notices are flagged with a prominent yellow side indicator.';
  document.getElementById('urgency-helper-text').innerText = helper;
  addLog(`Posting Urgency selected: [${urgency}]`);
}

function selectExpiryChip(el, days, label) {
  postExpiryDays = days;
  postExpiryLabel = label;
  document.querySelectorAll('#scr-post_expiry .suggestion-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  addLog(`Posting Expiry duration: [${label}]`);
}

function renderNoticePreview() {
  const title = document.getElementById('post-title').value.trim();
  const desc = document.getElementById('post-description').value.trim();
  const contact = document.getElementById('post-contact').value.trim();
  const container = document.getElementById('live-card-preview-container');
  if (!container) return;
  
  let borderLeftColor = 'transparent';
  if (postUrgency === 'urgent') borderLeftColor = 'var(--urgent-red)';
  if (postUrgency === 'important') borderLeftColor = 'var(--important-amber)';

  container.innerHTML = `
    <div class="notice-card" style="box-shadow: none; border-color: var(--primary-blue);">
      <div class="urgency-border" style="background-color: ${borderLeftColor};"></div>
      <div class="notice-card-content">
        <div class="card-header-row">
          <h4>${title}</h4>
          <span class="category-badge ${postCategory}">${postCategory.toUpperCase()}</span>
        </div>
        <p class="card-description">${desc}</p>
        <div class="card-meta-row">
          <span class="meta-pill">👤 ${profile.nickname}</span>
          <span class="meta-pill">🕐 Just Now</span>
          <span class="meta-pill">⏳ Expires in ${postExpiryLabel}</span>
        </div>
        ${contact ? `<div style="font-size: 10px; margin-top: 10px; font-weight:700; color:rgb(0,0,0);">📞 Contact: ${contact}</div>` : ''}
      </div>
    </div>
  `;
  
  setScreen('post_preview');
}

async function publishNoticeToServer() {
  const title = document.getElementById('post-title').value.trim();
  const desc = document.getElementById('post-description').value.trim();
  const contact = document.getElementById('post-contact').value.trim();
  
  if (!title || !desc || !contact) {
    alert('Please fill all fields.');
    return;
  }

  const phoneNumber = contact.replace(/\D/g, '');
  if (phoneNumber.length !== 10) {
    alert('Please enter a valid 10-digit contact number.');
    return;
  }

  addLog('Publishing notice to operational DB server environment...');
  const expiresAtDate = new Date();
  expiresAtDate.setDate(expiresAtDate.getDate() + postExpiryDays);
  
  try {
    if (backendMode === 'supabase') {
      const { error } = await supabase.from('notices').insert([{
        title,
        description: desc,
        contact,
        category: postCategory,
        urgency: postUrgency,
        author: profile.nickname,
        area: profile.area,
        pinned: false,
        archived: false,
        upvotes: 0,
        upvoted_by: [],
        expires_at: expiresAtDate.toISOString()
      }]);
      if (error) throw error;
    } else {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: desc,
          contact,
          category: postCategory,
          urgency: postUrgency,
          author: profile.nickname,
          expiryDays: postExpiryDays,
          area: profile.area
        })
      });
      if (res.status !== 201) throw new Error('Sandbox post failure');
    }
    
    addLog('Notice saved and cached successfully.', 'cyan');
    document.getElementById('post-title').value = '';
    document.getElementById('post-description').value = '';
    document.getElementById('post-contact').value = '';
    
    setScreen('post_success');
    syncData();
  } catch (e) {
    addLog('Posting error: Sync connection pipeline refused.', 'red');
    console.error(e);
  }
}

// --- SEARCH FILTER SYSTEMS ---
function setSearchCategory(el, cat) {
  activeSearchCategory = cat;
  document.querySelectorAll('#scr-search .search-chip').forEach(c => {
    if (c.innerText.toLowerCase().includes(cat.toLowerCase()) || (cat === 'All' && c.innerText === 'All')) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
  runSearchFilter();
}

function setSearchUrgency(el, urg) {
  activeSearchUrgency = urg;
  const urgencyContainer = el.parentElement;
  if (urgencyContainer) {
    urgencyContainer.querySelectorAll('.search-chip').forEach(chip => chip.classList.remove('active'));
  }
  el.classList.add('active');
  runSearchFilter();
}

function toggleArchiveView() {
  viewArchivedNotices = !viewArchivedNotices;
  const btn = document.getElementById('archive-toggle-btn');
  if (btn) btn.innerText = viewArchivedNotices ? 'View Active' : 'View Archives';
  runSearchFilter();
}

function runSearchFilter() {
  const searchInput = document.getElementById('search-input-field');
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const container = document.getElementById('search-results-container');
  if (!container) return;
  container.innerHTML = '';

  let base = notices.filter(n => n.area && n.area.toLowerCase() === (profile.area || '').toLowerCase());
  base = viewArchivedNotices ? base.filter(n => n.archived) : base.filter(n => !n.archived);

  let filtered = base.filter(n => {
    const textMatch = (n.title || '').toLowerCase().includes(keyword) || (n.description || '').toLowerCase().includes(keyword);
    const catMatch = activeSearchCategory === 'All' || n.category === activeSearchCategory;
    const urgMatch = activeSearchUrgency === 'All' || n.urgency === activeSearchUrgency;
    return textMatch && catMatch && urgMatch;
  });

  const countLabel = document.getElementById('results-count-label');
  if (countLabel) countLabel.innerText = `RESULTS FOUND (${filtered.length})`;

  if (filtered.length === 0) {
    container.innerHTML = `<p style="font-size:11px; color:var(--text-faint); padding: 12px;">No notices matched the search criteria.</p>`;
    return;
  }

  filtered.forEach(notice => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <h5>${notice.title}</h5>
        <p>👤 ${notice.author} · 👍 ${notice.upvotes || 0} upvotes</p>
      </div>
      <span style="font-size:12px; color:var(--primary-blue);">→</span>
    `;
    card.addEventListener('click', () => viewNoticeDetails(notice.id));
    container.appendChild(card);
  });
}

function renderSearchNotices() {
  runSearchFilter();
}

// --- RESIDENT CONTROLLER & SECURITY ---
function loginResident() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const error = document.getElementById("login-error");

  const user = residents.find(u => u.username === username && u.password === password);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    profile.nickname = user.name;
    profile.area = user.colony;
    profile.role = (user.username === "admin") ? "Admin" : "Resident";
    isAdminLoggedIn = (user.username === "admin");

    if (error) error.innerText = "";
    
    // FORCE SCREEN SWITCH
    setScreen("feed");
    addLog(`User ${user.name} logged in.`, 'cyan');
    syncData();
  } else {
    if (error) error.innerText = "Invalid username or password";
  }
}

function logoutResident() {
  localStorage.removeItem("loggedInUser");
  isAdminLoggedIn = false;
  profile = { nickname: '', area: '', role: 'Resident' };
  setScreen("login");
}

// --- PROFILE BOARD MANAGEMENT ---
function renderProfileScreen() {
  const nickname = profile.nickname || 'Resident_User';
  
  if(document.getElementById('profile-display-name')) document.getElementById('profile-display-name').innerText = nickname;
  if(document.getElementById('profile-display-area')) document.getElementById('profile-display-area').innerText = profile.area;
  if(document.getElementById('settings-nickname-lbl')) document.getElementById('settings-nickname-lbl').innerText = nickname;
  if(document.getElementById('settings-area-lbl')) document.getElementById('settings-area-lbl').innerText = profile.area;

  const myPosts = notices.filter(n => n.author === nickname);
  if(document.getElementById('profile-posted-count')) document.getElementById('profile-posted-count').innerText = myPosts.length;
  
  const myUpvotes = notices.filter(n => n.upvoted_by && n.upvoted_by.includes(nickname));
  if(document.getElementById('profile-upvoted-count')) document.getElementById('profile-upvoted-count').innerText = myUpvotes.length;

  const container = document.getElementById('profile-my-notices-container');
  if (!container) return;
  container.innerHTML = '';

  if (myPosts.length === 0) {
    container.innerHTML = `<p style="font-size:10px; color:var(--text-faint); padding:10px;">You haven't posted any notices yet.</p>`;
  } else {
    myPosts.forEach(n => {
      const card = document.createElement('div');
      card.className = 'activity-log-row';
      card.style.cursor = 'pointer';
      card.innerHTML = `<p>${n.title}</p><span>👍 ${n.upvotes || 0}</span>`;
      card.addEventListener('click', () => viewNoticeDetails(n.id));
      container.appendChild(card);
    });
  }

  const actContainer = document.getElementById('profile-activities-container');
  if (actContainer) {
    actContainer.innerHTML = '';
    activities.slice(0, 3).forEach(act => {
      const row = document.createElement('div');
      row.className = 'activity-log-row';
      row.innerHTML = `<p>${act.action}</p><span>${timeAgo(act.timestamp || Date.now())}</span>`;
      actContainer.appendChild(row);
    });
  }
}

function saveProfileDetailsForm() {
  const nick = document.getElementById('edit-profile-nickname').value.trim();
  const area = document.getElementById('edit-profile-area').value.trim();
  const family = parseInt(document.getElementById('edit-profile-family').value) || 1;
  const sound = document.getElementById('edit-profile-sound').checked;
  const digest = document.getElementById('edit-profile-digest').checked;

  if (!nick || !area) {
    alert('Please enter nickname and area.');
    return;
  }

  addLog('Saving user profile modifications...');
  
  fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nick, area, familySize: family, notificationSound: sound, dailyDigest: digest })
  }).then(res => res.json()).then(() => {
    addLog('Profile synchronized with Sandbox DB.', 'cyan');
    syncData();
    setScreen('profile');
  });
}

// --- ADMIN CONTROL CENTER ---
function attemptAdminLogin() {
  const pass = document.getElementById('admin-pass-field').value.trim();
  if (pass === 'admin123') {
    isAdminLoggedIn = true;
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-board-view').style.display = 'block';
    const headerBtn = document.getElementById('admin-header-btn');
    if (headerBtn) {
      headerBtn.innerText = 'Logout';
      headerBtn.style.color = 'var(--urgent-red)';
    }
    addLog('Admin authenticated successfully.', 'cyan');
    syncData();
  } else {
    document.getElementById('admin-login-error').innerText = 'Invalid passcode! Try "admin123".';
  }
}

function logoutAdmin() {
  if (isAdminLoggedIn) {
    isAdminLoggedIn = false;
    document.getElementById('admin-login-view').style.display = 'block';
    document.getElementById('admin-board-view').style.display = 'none';
    const headerBtn = document.getElementById('admin-header-btn');
    if (headerBtn) {
      headerBtn.innerText = 'Login';
      headerBtn.style.color = 'var(--primary-blue)';
    }
    document.getElementById('admin-pass-field').value = '';
    document.getElementById('admin-login-error').innerText = '';
    addLog('Admin console logged out.');
    syncData();
  }
}

function renderAdminPanel() {
  const container = document.getElementById('admin-notices-container');
  if (!container) return;
  container.innerHTML = '';
  
  const areaTitle = document.getElementById('admin-area-title');
  if (areaTitle) areaTitle.innerText = profile.area;

  const activeNotices = notices.filter(n => !n.archived && n.area && n.area.toLowerCase() === (profile.area || '').toLowerCase());

  if (activeNotices.length === 0) {
    container.innerHTML = `<p style="font-size:10px; color:rgba(0,0,0,0.6); padding:10px;">No active notices to moderate.</p>`;
    return;
  }

  activeNotices.forEach(n => {
    const card = document.createElement('div');
    card.className = 'admin-mod-card';
    card.innerHTML = `
      <div class="mod-title-row"><h5>${n.pinned ? '📌 ' : ''}${n.title}</h5></div>
      <p>👤 ${n.author} · 👍 ${n.upvotes || 0} upvotes</p>
      <div class="mod-btn-row">
        <button onclick="togglePinAdmin('${n.id}')">${n.pinned ? 'Unpin' : 'Pin'}</button>
        <button class="mod-del" onclick="deleteNoticeAdmin('${n.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

async function togglePinAdmin(id) {
  addLog(`Admin Pin toggle notice: [${id}]`);
  if (backendMode === 'supabase') {
    const matchedNotice = notices.find(n => n.id === id);
    if (matchedNotice) {
      await supabase.from('notices').update({ pinned: !matchedNotice.pinned }).eq('id', id);
    }
  } else {
    await fetch(`${API_BASE}/notices/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  }
  syncData();
}

async function deleteNoticeAdmin(id) {
  if (confirm('Moderate: Delete notice from community board?')) {
    addLog(`Admin Moderate notice delete: [${id}]`);
    if (backendMode === 'supabase') {
      await supabase.from('notices').delete().eq('id', id);
    } else {
      await fetch(`${API_BASE}/notices/${id}`, { method: 'DELETE' });
    }
    syncData();
  }
}

function renderNotificationLog() {
  const container = document.getElementById('notifications-log-container');
  if (!container) return;
  container.innerHTML = '';

  const logs = activities.filter(a => a.type === 'post' || a.type === 'admin');
  if (logs.length === 0) {
    container.innerHTML = `<p style="font-size:10px; color:var(--text-faint); padding:10px;">No notification alerts logged.</p>`;
    return;
  }

  logs.forEach(log => {
    const card = document.createElement('div');
    card.className = 'notif-card';
    card.innerHTML = `
      <span class="n-icon">${log.type === 'admin' ? '🛡️' : '🔔'}</span>
      <div class="n-txt">
        <h5>${log.action}</h5>
        <span>${timeAgo(log.timestamp || Date.now())}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- UTILITY FILTERS & CONTROLS ---
function getExpiresLabel(expiryString) {
  if (!expiryString) return 'No Expiry Set';
  const now = new Date();
  const expiresAt = new Date(expiryString);
  if (now > expiresAt) return 'Expired';
  const diffTime = Math.abs(expiresAt - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 1 ? `Expires in ${diffDays}d` : 'Expires today';
}

function timeAgo(dateString) {
  const parsedTimestamp = isNaN(dateString) ? new Date(dateString) : new Date(parseInt(dateString));
  const seconds = Math.floor((new Date() - parsedTimestamp) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + "m ago";
  return "Just now";
}

function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const span = el.querySelector('span');
  if (!answer) return;
  
  if (answer.style.display === 'block') {
    answer.style.display = 'none';
    if (span) span.innerText = '+';
  } else {
    answer.style.display = 'block';
    if (span) span.innerText = '-';
  }
}

function selectColonyChip(chip, name) {
  const chips = document.querySelectorAll('.suggestion-chip');
  chips.forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const inputColony = document.getElementById('input-colony-name');
  if (inputColony) inputColony.value = name;
}

function bypassOnboarding() {
  addLog('Skipping onboarding wizard...');
  setScreen('feed');
}

function saveOnboardingArea() {
  const colony = document.getElementById('input-colony-name').value.trim();
  if (colony) {
    profile.area = colony;
    addLog(`Setting colony area to "${colony}"`);
    setScreen('feed');
  }
}

function submitSupportTicket() {
  addLog('developer ticket raised: support ticket registered.', 'cyan');
  alert('Developer support ticket raised successfully!');
  setScreen('settings');
}

function goBack() {
  setScreen(previousScreen);
}

// --- SIMULATION LAB WORKSPACE OVERRIDES ---
async function triggerMockAlert(type) {
  addLog(`Controller: Requesting mock announcement alert [Category: ${type}]`);
  const res = await fetch(`${API_BASE}/mock/alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  const mock = await res.json();
  addLog(`Immediate Board broadcast generated: "${mock.title}"`, 'cyan');
  syncData();
  setScreen('feed');
}

async function triggerFactoryReset() {
  if (confirm('Factory purge: Reset local sandbox database to pre-seeded notice templates?')) {
    addLog('Factory reset triggered. Wiping Sandbox DB...');
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
    addLog('Database reset complete. Notices seed templates re-loaded.', 'cyan');
    syncData();
    setScreen('splash');
  }
}

async function resetDatabaseWipe() {
  await triggerFactoryReset();
}

async function triggerArchiveCheck() {
  addLog('Triggering Auto-Archive expiration scanner...');
  const res = await fetch(`${API_BASE}/archive/check`, { method: 'POST' });
  const report = await res.json();
  addLog(`Auto-Archive complete. Expired count: ${report.expiredCount} notice(s).`, 'cyan');
  syncData();
}

function applyControllerProfile() {
  const nick = document.getElementById('sim-nickname').value.trim();
  const role = document.getElementById('sim-role').value;
  const area = document.getElementById('sim-area').value.trim();

  if (!nick || !area) return;

  addLog(`Controller: Applying profile sync for "${nick}"...`);
  fetch(`${API_BASE}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nick, role, area })
  }).then(res => res.json()).then(() => {
    addLog('Profile sync applied successfully.', 'cyan');
    
    if (role === 'Admin') {
      isAdminLoggedIn = true;
      document.getElementById('admin-login-view').style.display = 'none';
      document.getElementById('admin-board-view').style.display = 'block';
    } else {
      isAdminLoggedIn = false;
      document.getElementById('admin-login-view').style.display = 'block';
      document.getElementById('admin-board-view').style.display = 'none';
    }
    syncData();
  });
}

// --- SUPABASE ARCHITECTURE CONFIG LAYER ---
function setBackendMode(mode) {
  backendMode = mode;
  document.querySelectorAll('.toggle-group button').forEach(b => b.classList.remove('active'));
  
  const statusDot = document.getElementById('sync-dot');
  const statusMsg = document.getElementById('sync-status-msg');

  if (mode === 'sandbox') {
    document.getElementById('btn-sandbox')?.classList.add('active');
    if (statusDot) statusDot.className = 'status-indicator online';
    if (statusMsg) statusMsg.innerText = 'Local Workspace Server Active (Port 3005)';
    addLog('Backend Mode: Local Sandbox server active.');
  } else {
    document.getElementById('btn-supabase')?.classList.add('active');
    if (statusDot) statusDot.className = 'status-indicator online';
    if (statusMsg) statusMsg.innerText = 'Live Sync Mode: Supabase Connected';
    addLog('Backend Mode: Supabase cloud synchronization active.', 'cyan');
  }
  syncData();
}

function saveSupabaseCredentials() {
  const url = document.getElementById('sync-url').value.trim();
  const key = document.getElementById('sync-key').value.trim();
  if (!url || !key) {
    alert('Please enter a valid Supabase URL & Anon Key.');
    return;
  }
  saveSupabaseSetup(url, key);
}

function saveModalSupabaseCredentials() {
  const url = document.getElementById('modal-sync-url').value.trim();
  const key = document.getElementById('modal-sync-key').value.trim();
  if (!url || !key) {
    document.getElementById('modal-config-error').innerText = 'Credentials required!';
    return;
  }
  saveSupabaseSetup(url, key);
  document.getElementById('config-modal').style.display = 'none';
}

function saveSupabaseSetup(url, key) {
  addLog('Connecting to Supabase cloud server...');
  const banner = document.getElementById('connection-status-banner');
  if (banner) banner.className = 'connection-status-box connected';
  
  const connText = document.getElementById('connection-status-text');
  if (connText) connText.innerText = 'Connected (Supabase Cloud Sync Active)';
  
  if(document.getElementById('sync-url')) document.getElementById('sync-url').value = url;
  if(document.getElementById('sync-key')) document.getElementById('sync-key').value = key;
  if(document.getElementById('disconnect-sync-btn')) document.getElementById('disconnect-sync-btn').style.display = 'block';
  if(document.getElementById('save-sync-btn')) document.getElementById('save-sync-btn').style.display = 'none';
  if(document.getElementById('settings-cloud-lbl')) document.getElementById('settings-cloud-lbl').innerText = 'Connected (Supabase)';

  addLog('Supabase Cloud Sync Established!', 'cyan');
  setBackendMode('supabase');
}

function disconnectSupabaseCloud() {
  addLog('Disconnecting Supabase cloud backend...');
  const banner = document.getElementById('connection-status-banner');
  if (banner) banner.className = 'connection-status-box disconnected';
  
  const connText = document.getElementById('connection-status-text');
  if (connText) connText.innerText = 'Disconnected (Local Sandbox Active)';
  
  if(document.getElementById('sync-url')) document.getElementById('sync-url').value = '';
  if(document.getElementById('sync-key')) document.getElementById('sync-key').value = '';
  if(document.getElementById('disconnect-sync-btn')) document.getElementById('disconnect-sync-btn').style.display = 'none';
  if(document.getElementById('save-sync-btn')) document.getElementById('save-sync-btn').style.display = 'block';
  if(document.getElementById('settings-cloud-lbl')) document.getElementById('settings-cloud-lbl').innerText = 'Offline Mode (Configure Sync)';

  setBackendMode('sandbox');
}

// --- GLOBAL EXPORTS LAYER ---
window.setScreen = setScreen;
window.bypassOnboarding = bypassOnboarding;
window.saveOnboardingArea = saveOnboardingArea;
window.selectColonyChip = selectColonyChip;
window.toggleUpvoteNotice = toggleUpvoteNotice;
window.viewNoticeDetails = viewNoticeDetails;
window.toggleUpvoteDetail = toggleUpvoteDetail;
window.togglePinDetail = togglePinDetail;
window.deleteNoticeDetail = deleteNoticeDetail;
window.selectPostCategory = selectPostCategory;
window.savePostDetails = savePostDetails;
window.selectPostUrgency = selectPostUrgency;
window.selectExpiryChip = selectExpiryChip;
window.renderNoticePreview = renderNoticePreview;
window.publishNoticeToServer = publishNoticeToServer;
window.setFeedTab = setFeedTab;
window.filterByUrgentOnly = filterByUrgentOnly;
window.setSearchCategory = setSearchCategory;
window.setSearchUrgency = setSearchUrgency;
window.toggleArchiveView = toggleArchiveView;
window.saveProfileDetailsForm = saveProfileDetailsForm;
window.attemptAdminLogin = attemptAdminLogin;
window.logoutAdmin = logoutAdmin;
window.togglePinAdmin = togglePinAdmin;
window.deleteNoticeAdmin = deleteNoticeAdmin;
window.toggleFaq = toggleFaq;
window.submitSupportTicket = submitSupportTicket;
window.triggerMockAlert = triggerMockAlert;
window.triggerFactoryReset = triggerFactoryReset;
window.resetDatabaseWipe = resetDatabaseWipe;
window.triggerArchiveCheck = triggerArchiveCheck;
window.applyControllerProfile = applyControllerProfile;
window.setBackendMode = setBackendMode;
window.saveSupabaseCredentials = saveSupabaseCredentials;
window.saveModalSupabaseCredentials = saveModalSupabaseCredentials;
window.disconnectSupabaseCloud = disconnectSupabaseCloud;
window.goBack = goBack;
window.loginResident = loginResident;
window.logoutResident = logoutResident;