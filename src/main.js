import './style.css';
import basePlants from './data/plants.json';
import extraPlants from './data/extra-plants.json';
import plantImages from './data/images.js';
const plantsData = [...basePlants, ...extraPlants];

// ===== IMAGE HELPER =====
const getImg = (id) => plantImages[id] || '';

// ===== THEME =====
const initTheme = () => {
  const saved = localStorage.getItem('cellulose-theme');
  const theme = saved || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cellulose-theme', next);
  });
};

// ===== TOAST =====
const showToast = (msg) => {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
};

// ===== GARDEN STORE =====
const GardenStore = {
  _key: 'cellulose-garden',
  getAll() { return JSON.parse(localStorage.getItem(this._key) || '[]'); },
  save(items) { localStorage.setItem(this._key, JSON.stringify(items)); },
  add(plantId, date) {
    const items = this.getAll();
    if (items.find(i => i.plantId === plantId)) return false;
    items.push({ plantId, plantedDate: date, tasksCompleted: {} });
    this.save(items); return true;
  },
  remove(plantId) {
    this.save(this.getAll().filter(i => i.plantId !== plantId));
  },
  completeTask(plantId, taskType) {
    const items = this.getAll();
    const item = items.find(i => i.plantId === plantId);
    if (item) { item.tasksCompleted[taskType] = new Date().toISOString(); this.save(items); }
  },
  getPlantData(plantId) { return plantsData.find(p => p.id === plantId); }
};

// ===== REMINDER ENGINE =====
const ReminderEngine = {
  getStage(plantedDate, harvestDays) {
    const days = Math.floor((Date.now() - new Date(plantedDate)) / 86400000);
    const maxH = parseInt(harvestDays.toString().split('-').pop()) || 90;
    if (days < 14) return 'Seedling';
    if (days < maxH * 0.4) return 'Vegetative';
    if (days < maxH * 0.7) return 'Flowering';
    if (days < maxH) return 'Fruiting';
    return 'Harvest Ready';
  },
  getDaysSincePlanted(plantedDate) {
    return Math.floor((Date.now() - new Date(plantedDate)) / 86400000);
  },
  getTasks(gardenItems) {
    const tasks = [];
    gardenItems.forEach(item => {
      const plant = GardenStore.getPlantData(item.plantId);
      if (!plant) return;
      const sched = plant.reminderSchedule;
      const now = new Date();
      ['water', 'fertilize', 'prune'].forEach(type => {
        if (!sched[type] || sched[type] === 0) return;
        const lastDone = item.tasksCompleted[type] ? new Date(item.tasksCompleted[type]) : new Date(item.plantedDate);
        const daysSince = Math.floor((now - lastDone) / 86400000);
        const due = daysSince >= sched[type];
        const overdue = daysSince >= sched[type] * 1.5;
        tasks.push({ plantId: item.plantId, plantName: plant.name, emoji: plant.emoji, type, due, overdue, daysSince, interval: sched[type] });
      });
    });
    return tasks.sort((a, b) => (b.overdue - a.overdue) || (b.due - a.due) || (a.daysSince / a.interval > b.daysSince / b.interval ? -1 : 1));
  }
};

// ===== SEARCH HELPERS =====
const fuzzyMatch = (query, text) => text.toLowerCase().includes(query.toLowerCase());

// ===== PAGES =====
const renderHome = () => {
  const gardenItems = GardenStore.getAll();
  const tasks = ReminderEngine.getTasks(gardenItems);
  const dueTasks = tasks.filter(t => t.due);
  const categories = [
    { emoji: '🥬', label: 'Vegetables', cat: 'vegetable' },
    { emoji: '🌿', label: 'Herbs', cat: 'herb' },
    { emoji: '🌸', label: 'Flowers', cat: 'flower' },
    { emoji: '🍎', label: 'Fruits', cat: 'fruit' },
  ];
  const popular = plantsData.filter(p => ['tomato','basil','strawberry','sunflower','lavender','mint'].includes(p.id));
  return `
    <div class="hero">
      <div class="hero-particles" aria-hidden="true">${Array.from({length:12},(_,i)=>`<span class="particle" style="--i:${i}"></span>`).join('')}</div>
      <h1>Grow with <span class="accent">Cellulose</span></h1>
      <p>Your intelligent gardening companion. Search plants, get planting guides, and never forget to water again.</p>
      <div class="hero-search">
        <input type="text" id="hero-search-input" placeholder="Search for a plant..." autocomplete="off" />
        <button id="hero-search-btn">Search</button>
      </div>
    </div>
    ${dueTasks.length > 0 ? `
    <div class="today-section">
      <h2 class="section-title">📋 Today's Tasks <span style="font-size:0.85rem;color:var(--text-muted);font-weight:400">(${dueTasks.length} due)</span></h2>
      <div class="task-list">
        ${dueTasks.slice(0, 6).map(t => `
          <div class="task-item ${t.overdue ? '' : ''}" data-plant="${t.plantId}" data-type="${t.type}">
            <div class="task-check"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
            <span class="task-icon">${t.emoji}</span>
            <div class="task-info">
              <div class="task-text">${taskLabel(t.type)} ${t.plantName}</div>
              <div class="task-sub">${t.overdue ? '⚠️ Overdue' : 'Due today'} · Every ${t.interval} days</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>` : gardenItems.length > 0 ? `<div class="today-section"><h2 class="section-title">✅ All Tasks Complete!</h2><p style="color:var(--text-muted)">Great work! All your plants are well cared for.</p></div>` : ''}
    <h2 class="section-title">🌱 Browse by Category</h2>
    <div class="quick-categories">
      ${categories.map(c => `<div class="category-card" data-category="${c.cat}"><span class="emoji">${c.emoji}</span><span class="label">${c.label}</span></div>`).join('')}
    </div>
    <h2 class="section-title">🔥 Popular Plants</h2>
    <div class="popular-plants">
      ${popular.map(p => `<div class="popular-card" data-id="${p.id}">${getImg(p.id) ? `<img class="popular-thumb" src="${getImg(p.id)}" alt="${p.name}" loading="lazy" />` : `<span class="popular-emoji">${p.emoji}</span>`}<span class="popular-name">${p.name}</span><span class="popular-diff ${p.difficulty}">${p.difficulty}</span></div>`).join('')}
    </div>
    ${gardenItems.length === 0 ? `<div class="empty-state"><div class="empty-icon">🌿</div><p>You haven't added any plants yet. Search for a plant and add it to your garden to get started!</p></div>` : ''}
  `;
};

const taskLabel = (type) => ({ water: '🚿 Water', fertilize: '🧪 Fertilize', prune: '✂️ Prune' })[type] || type;

const renderSearch = (query = '', category = '') => {
  let results = plantsData;
  if (query) results = results.filter(p => fuzzyMatch(query, p.name) || fuzzyMatch(query, p.scientific) || fuzzyMatch(query, p.category));
  if (category) results = results.filter(p => p.category === category);
  const cats = ['all', 'vegetable', 'herb', 'flower', 'fruit'];
  return `
    <div class="search-header">
      <h1>🔍 Find Your Perfect Plant</h1>
      <div class="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="search-input" placeholder="Search plants..." value="${query}" autocomplete="off" />
      </div>
      <div class="filter-pills">
        ${cats.map(c => `<button class="filter-pill ${(c === 'all' && !category) || c === category ? 'active' : ''}" data-cat="${c}">${c === 'all' ? '🌍 All' : c === 'vegetable' ? '🥬 Vegetables' : c === 'herb' ? '🌿 Herbs' : c === 'flower' ? '🌸 Flowers' : '🍎 Fruits'}</button>`).join('')}
      </div>
    </div>
    <div class="plant-grid">
      ${results.length ? results.map((p, i) => `
        <div class="plant-card" data-id="${p.id}" style="--i:${i}">
          <div class="plant-card-img">
            <span class="difficulty-badge ${p.difficulty}">${p.difficulty}</span>
            ${getImg(p.id) ? `<img src="${getImg(p.id)}" alt="${p.name}" loading="lazy" /><div class="img-shimmer"></div>` : p.emoji}
          </div>
          <div class="plant-card-body">
            <h3>${p.name}</h3>
            <div class="scientific">${p.scientific}</div>
            <div class="plant-card-stats">
              <span class="plant-stat">☀️ ${p.sun.split('(')[0].trim()}</span>
              <span class="plant-stat">💧 Every ${p.waterDays}d</span>
              <span class="plant-stat">📅 ${p.harvestDays}d</span>
            </div>
          </div>
        </div>
      `).join('') : '<div class="empty-state"><div class="empty-icon">🔍</div><p>No plants found matching your search. Try a different term!</p></div>'}
    </div>
  `;
};

const renderPlantDetail = (plantId) => {
  const p = plantsData.find(pl => pl.id === plantId);
  if (!p) return '<div class="empty-state"><div class="empty-icon">❓</div><p>Plant not found.</p></div>';
  const inGarden = GardenStore.getAll().some(i => i.plantId === p.id);
  return `
    <div class="plant-detail">
      <button class="back-btn" id="back-btn">← Back</button>
      <div class="detail-header">
        <div class="detail-img">${getImg(p.id) ? `<img src="${getImg(p.id)}" alt="${p.name}" />` : p.emoji}</div>
        <div class="detail-info">
          <h1>${p.name}</h1>
          <div class="scientific">${p.scientific}</div>
          <p class="description">${p.description}</p>
          <div class="detail-stats-grid">
            <div class="detail-stat"><div class="stat-icon">📏</div><div class="stat-label">Depth</div><div class="stat-value">${p.depth}</div></div>
            <div class="detail-stat"><div class="stat-icon">↔️</div><div class="stat-label">Spacing</div><div class="stat-value">${p.spacing}</div></div>
            <div class="detail-stat"><div class="stat-icon">☀️</div><div class="stat-label">Sun</div><div class="stat-value">${p.sun.split('(')[0].trim()}</div></div>
            <div class="detail-stat"><div class="stat-icon">🌍</div><div class="stat-label">Soil</div><div class="stat-value">${p.soil}</div></div>
            <div class="detail-stat"><div class="stat-icon">💧</div><div class="stat-label">Water</div><div class="stat-value">Every ${p.waterDays}d</div></div>
            <div class="detail-stat"><div class="stat-icon">🌱</div><div class="stat-label">Germination</div><div class="stat-value">${p.germinationDays}d</div></div>
            <div class="detail-stat"><div class="stat-icon">📅</div><div class="stat-label">Harvest</div><div class="stat-value">${p.harvestDays}d</div></div>
            <div class="detail-stat"><div class="stat-icon">📆</div><div class="stat-label">Seasons</div><div class="stat-value">${p.seasons.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}</div></div>
          </div>
          ${inGarden ? '<div style="padding:12px 20px;background:var(--green-100);border-radius:var(--radius-sm);color:var(--green-800);font-weight:500;display:inline-block">✅ In your garden</div>' : `<button class="btn-primary" id="add-garden-btn" data-id="${p.id}">🌱 Add to My Garden</button>`}
        </div>
      </div>
      <div class="instructions-section">
        <h2>📝 How to Grow ${p.name}</h2>
        <div class="instruction-steps">
          ${p.steps.map((s, i) => `<div class="instruction-step"><div class="step-number">${i + 1}</div><div class="step-content"><p>${s}</p></div></div>`).join('')}
        </div>
      </div>
      ${p.companions.length ? `
      <div class="instructions-section">
        <h2>🤝 Companion Planting</h2>
        <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:8px">
          <div><h4 style="color:var(--green-600);margin-bottom:8px">✅ Good Companions</h4>${p.companions.map(c => `<div class="companion-item good">+ ${c}</div>`).join('')}</div>
          <div><h4 style="color:#ef5350;margin-bottom:8px">❌ Avoid</h4>${p.avoid.map(c => `<div class="companion-item bad">− ${c}</div>`).join('')}</div>
        </div>
      </div>` : ''}
    </div>
  `;
};

const renderGarden = () => {
  const items = GardenStore.getAll();
  return `
    <div class="garden-header">
      <h1>🪴 My Garden</h1>
      <div class="garden-stats">
        <div class="garden-stat-item"><div class="num">${items.length}</div><div class="lbl">Plants</div></div>
      </div>
    </div>
    ${items.length ? `<div class="garden-grid">${items.map(item => {
      const p = GardenStore.getPlantData(item.plantId);
      if (!p) return '';
      const stage = ReminderEngine.getStage(item.plantedDate, p.harvestDays);
      const days = ReminderEngine.getDaysSincePlanted(item.plantedDate);
      const tasks = ReminderEngine.getTasks([item]).filter(t => t.due);
      return `
        <div class="care-card">
          <div class="care-card-top">
            <h3>${p.emoji} ${p.name}</h3>
            <span class="stage-badge">${stage}</span>
          </div>
          <div class="planted-date">Planted ${new Date(item.plantedDate).toLocaleDateString()} · Day ${days}</div>
          ${tasks.length ? `<div class="next-task">⏰ ${tasks.map(t => taskLabel(t.type)).join(', ')} due</div>` : '<div class="next-task" style="background:var(--green-100);color:var(--green-700)">✅ All caught up!</div>'}
          <div class="care-card-actions">
            <button data-action="water" data-plant="${p.id}">🚿 Water</button>
            <button data-action="fertilize" data-plant="${p.id}">🧪 Feed</button>
            <button class="btn-sync-cal" data-action="sync-cal" data-plant="${p.id}">📅 Sync Calendar</button>
            <button class="btn-remove" data-action="remove" data-plant="${p.id}">🗑️</button>
          </div>
        </div>`;
    }).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">🌱</div><p>Your garden is empty! <a href="#/search" style="color:var(--green-600);font-weight:600">Search for plants</a> and add them to get started.</p></div>`}
  `;
};

const renderCompanions = () => {
  const plants = plantsData.filter(p => p.companions.length > 0);
  return `
    <div class="companions-page">
      <h1>🤝 Companion Planting Guide</h1>
      <p class="subtitle">Learn which plants grow well together and which to keep apart.</p>
      <div class="companion-grid">
        ${plants.map(p => `
          <div class="companion-card">
            <h3>${p.emoji} ${p.name}</h3>
            <div class="companion-list">
              ${p.companions.map(c => `<div class="companion-item good">✅ ${c}</div>`).join('')}
              ${p.avoid.map(c => `<div class="companion-item bad">❌ ${c}</div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const renderCalendar = () => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const seasonMonths = {
    spring: [2,3,4], summer: [5,6,7], fall: [8,9,10], winter: [11,0,1]
  };
  const now = new Date();
  const currentMonth = now.getMonth();
  return `
    <div class="calendar-page">
      <h1>📅 Planting Calendar</h1>
      <p class="subtitle">See what to plant each month based on growing seasons.</p>
      <div class="calendar-grid">
        ${months.map((m, idx) => {
          const plantsThisMonth = plantsData.filter(p => p.seasons.some(s => seasonMonths[s]?.includes(idx)));
          const isCurrent = idx === currentMonth;
          return `
            <div class="calendar-month ${isCurrent ? 'current' : ''}">
              <div class="month-header">${m}${isCurrent ? ' <span class="current-badge">Now</span>' : ''}</div>
              <div class="month-plants">
                ${plantsThisMonth.length ? plantsThisMonth.map(p => `<a href="#/plant/${p.id}" class="month-plant" title="${p.name}">${p.emoji}</a>`).join('') : '<span class="no-plants">Rest season</span>'}
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;
};

// ===== DOCTOR =====
const renderDoctor = () => {
  const apiKey = localStorage.getItem('cellulose-gemini-key') || '';
  
  return `
    <div class="doctor-page">
      <h1>🩺 AI Plant Doctor</h1>
      <p class="subtitle">Upload a photo of a sick plant and our AI botanist will diagnose it.</p>
      
      <div class="doctor-container">
        ${!apiKey ? `
          <div class="api-key-box" id="api-key-box">
            <h3>🔑 Setup Required</h3>
            <p>Since Cellulose doesn't have a backend server, you need to provide your own free Gemini API key to use the Plant Doctor. It will be saved securely in your browser.</p>
            <input type="password" id="gemini-key-input" placeholder="Paste your Gemini API key here..." />
            <button id="save-key-btn">Save Key</button>
          </div>
        ` : `<div style="text-align:right"><button id="clear-key-btn" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;text-decoration:underline">Clear API Key</button></div>`}
        
        <div class="upload-dropzone" id="upload-dropzone" ${!apiKey ? 'style="opacity:0.5;pointer-events:none"' : ''}>
          <div class="upload-icon">📸</div>
          <h3>Tap to Upload Image</h3>
          <p>Or drag and drop a photo of your plant</p>
          <input type="file" id="doctor-file-input" accept="image/*" capture="environment" />
          <img id="upload-preview" class="upload-preview" />
        </div>
        
        <div class="doctor-loading" id="doctor-loading">
          <div class="spinner"></div>
          <p>Analyzing plant data...</p>
        </div>
        
        <div class="doctor-result" id="doctor-result">
          <!-- Filled by JS -->
        </div>
      </div>
    </div>
  `;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

const attachDoctorEvents = () => {
  const saveBtn = document.getElementById('save-key-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const val = document.getElementById('gemini-key-input').value.trim();
      if (val) {
        localStorage.setItem('cellulose-gemini-key', val);
        showToast('API Key saved!');
        router(); // re-render
      }
    });
  }
  
  const clearBtn = document.getElementById('clear-key-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem('cellulose-gemini-key');
      router();
    });
  }

  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('doctor-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--green-500)'; });
    dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });
    
    fileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });
  }
};

const handleImageUpload = async (file) => {
  const preview = document.getElementById('upload-preview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
  
  const icon = document.querySelector('.upload-icon');
  const h3 = document.querySelector('#upload-dropzone h3');
  const p = document.querySelector('#upload-dropzone p');
  if (icon) icon.style.display = 'none';
  if (h3) h3.style.display = 'none';
  if (p) p.style.display = 'none';

  document.getElementById('doctor-loading').style.display = 'block';
  document.getElementById('doctor-result').style.display = 'none';
  
  try {
    const base64Img = await fileToBase64(file);
    const mimeType = file.type;
    const apiKey = localStorage.getItem('cellulose-gemini-key');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "You are an expert botanist and plant pathologist. Analyze this plant image. Diagnose any diseases, pests, or nutrient deficiencies. Return ONLY a JSON response (no markdown blocks or other text) with these exactly named keys: 'diagnosis' (short name of issue), 'confidence' (percentage string), 'explanation' (1-2 sentences explaining what you see), and 'treatment' (array of 3 short actionable string steps)." },
            { inline_data: { mime_type: mimeType, data: base64Img } }
          ]
        }]
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to call Gemini API');
    }
    
    let aiText = data.candidates[0].content.parts[0].text;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(aiText);
    
    const resultBox = document.getElementById('doctor-result');
    resultBox.className = 'doctor-result';
    resultBox.innerHTML = `
      <div class="diagnosis-header">
        <h2 class="diagnosis-title">${result.diagnosis}</h2>
        <span class="diagnosis-confidence">${result.confidence} Match</span>
      </div>
      <p class="diagnosis-explanation">${result.explanation}</p>
      <h3>Prescription</h3>
      <ul class="treatment-list">
        ${result.treatment.map(t => `<li>${t}</li>`).join('')}
      </ul>
    `;
    resultBox.style.display = 'block';
    
  } catch (err) {
    console.error('Doctor Error:', err);
    const resultBox = document.getElementById('doctor-result');
    resultBox.className = 'doctor-result error';
    resultBox.innerHTML = `
      <div class="diagnosis-header"><h2 class="diagnosis-title" style="color:#ef5350">Diagnosis Failed</h2></div>
      <p class="diagnosis-explanation">${err.message || 'Something went wrong while analyzing the image. Please check your API key and try again.'}</p>
    `;
    resultBox.style.display = 'block';
  } finally {
    document.getElementById('doctor-loading').style.display = 'none';
  }
};

// ===== ROUTER =====
let currentSearchQuery = '';
let currentCategory = '';

const router = () => {
  const hash = location.hash || '#/';
  const main = document.getElementById('app-main');
  // Update active nav
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
    const route = el.dataset.route;
    el.classList.toggle('active', hash === '#/' && route === 'home' || hash.startsWith('#/' + route));
  });

  if (hash === '#/' || hash === '#') {
    main.innerHTML = renderHome();
    attachHomeEvents();
  } else if (hash === '#/search' || hash.startsWith('#/search?')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    currentSearchQuery = params.get('q') || '';
    currentCategory = params.get('cat') || '';
    main.innerHTML = renderSearch(currentSearchQuery, currentCategory);
    attachSearchEvents();
  } else if (hash.startsWith('#/plant/')) {
    const id = hash.split('/')[2];
    main.innerHTML = renderPlantDetail(id);
    attachDetailEvents();
  } else if (hash === '#/garden') {
    main.innerHTML = renderGarden();
    attachGardenEvents();
  } else if (hash === '#/companions') {
    main.innerHTML = renderCompanions();
  } else if (hash === '#/calendar') {
    main.innerHTML = renderCalendar();
  } else if (hash === '#/doctor') {
    main.innerHTML = renderDoctor();
    attachDoctorEvents();
  } else {
    main.innerHTML = renderHome();
    attachHomeEvents();
  }
  window.scrollTo(0, 0);
};

// ===== EVENT HANDLERS =====
const attachHomeEvents = () => {
  const input = document.getElementById('hero-search-input');
  const btn = document.getElementById('hero-search-btn');
  const goSearch = () => { location.hash = `#/search?q=${encodeURIComponent(input.value)}`; };
  btn?.addEventListener('click', goSearch);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') goSearch(); });
  document.querySelectorAll('.category-card').forEach(el => {
    el.addEventListener('click', () => { location.hash = `#/search?cat=${el.dataset.category}`; });
  });
  document.querySelectorAll('.popular-card').forEach(el => {
    el.addEventListener('click', () => { location.hash = `#/plant/${el.dataset.id}`; });
  });
  document.querySelectorAll('.task-item').forEach(el => {
    el.addEventListener('click', () => {
      GardenStore.completeTask(el.dataset.plant, el.dataset.type);
      el.classList.add('done');
      showToast(`${taskLabel(el.dataset.type)} completed! 🎉`);
      setTimeout(router, 500);
    });
  });
};

const attachSearchEvents = () => {
  const input = document.getElementById('search-input');
  let debounce;
  input?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      currentSearchQuery = input.value;
      const main = document.getElementById('app-main');
      main.innerHTML = renderSearch(currentSearchQuery, currentCategory);
      attachSearchEvents();
      document.getElementById('search-input').focus();
      document.getElementById('search-input').setSelectionRange(currentSearchQuery.length, currentSearchQuery.length);
    }, 200);
  });
  document.querySelectorAll('.filter-pill').forEach(el => {
    el.addEventListener('click', () => {
      currentCategory = el.dataset.cat === 'all' ? '' : el.dataset.cat;
      const main = document.getElementById('app-main');
      main.innerHTML = renderSearch(currentSearchQuery, currentCategory);
      attachSearchEvents();
    });
  });
  document.querySelectorAll('.plant-card').forEach(el => {
    el.addEventListener('click', () => { location.hash = `#/plant/${el.dataset.id}`; });
  });
};

const attachDetailEvents = () => {
  document.getElementById('back-btn')?.addEventListener('click', () => history.back());
  document.getElementById('add-garden-btn')?.addEventListener('click', (e) => {
    const plantId = e.currentTarget.dataset.id;
    const plant = plantsData.find(p => p.id === plantId);
    const modal = document.getElementById('add-garden-modal');
    const body = document.getElementById('modal-body');
    body.innerHTML = `
      <p style="margin-bottom:16px">Add <strong>${plant.name}</strong> to your garden tracker.</p>
      <label for="plant-date">When did you plant it?</label>
      <input type="date" id="plant-date" value="${new Date().toISOString().split('T')[0]}" />
      <button class="btn-primary" id="confirm-add" style="width:100%;justify-content:center">🌱 Add to Garden</button>
    `;
    modal.hidden = false;
    document.getElementById('confirm-add').addEventListener('click', () => {
      const date = document.getElementById('plant-date').value;
      GardenStore.add(plantId, date);
      modal.hidden = true;
      showToast(`${plant.name} added to your garden! 🌱`);
      router();
    });
  });
};

const attachGardenEvents = () => {
  document.querySelectorAll('.care-card-actions button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const plantId = btn.dataset.plant;
      if (action === 'remove') {
        GardenStore.remove(plantId);
        showToast('Plant removed from garden');
        router();
      } else if (action === 'sync-cal') {
        GoogleAuth.syncPlantToCalendar(plantId);
      } else {
        GardenStore.completeTask(plantId, action);
        showToast(`${taskLabel(action)} done! 🎉`);
        router();
      }
    });
  });
};

// ===== SMART WEATHER HELPERS =====
const getUserLocation = async () => {
  return new Promise((resolve) => {
    const cached = localStorage.getItem('cellulose-location');
    if (cached) return resolve(JSON.parse(cached));
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        localStorage.setItem('cellulose-location', JSON.stringify(coords));
        resolve(coords);
      },
      () => resolve(null)
    );
  });
};

const getWeatherForecast = async (lat, lon) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum&timezone=auto&forecast_days=14`;
    const res = await fetch(url);
    const data = await res.json();
    return data.daily;
  } catch (err) {
    console.error('Weather fetch error:', err);
    return null;
  }
};

// ===== GOOGLE AUTH & CALENDAR =====
const GOOGLE_CLIENT_ID = '346068449568-sh111kf2nrlt74qc53klud6j0617hmot.apps.googleusercontent.com'; // Replace with your Client ID
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const PROFILE_SCOPE = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

const GoogleAuth = {
  tokenClient: null,
  accessToken: null,
  user: null,
  pendingAction: null,

  init() {
    // Wait for GIS library to load
    const check = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(check);
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: `${PROFILE_SCOPE} ${CALENDAR_SCOPE}`,
          callback: (resp) => this.handleTokenResponse(resp),
        });
        // Check if we had a session
        const savedUser = localStorage.getItem('cellulose-user');
        if (savedUser) {
          this.user = JSON.parse(savedUser);
          this.renderAuthUI();
        }
      }
    }, 200);
    this.renderAuthUI();
  },

  handleTokenResponse(resp) {
    if (resp.error) { showToast('Google sign-in failed'); return; }
    this.accessToken = resp.access_token;
    // Fetch user profile
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    }).then(r => r.json()).then(profile => {
      this.user = { name: profile.name, email: profile.email, picture: profile.picture };
      localStorage.setItem('cellulose-user', JSON.stringify(this.user));
      this.renderAuthUI();
      showToast(`Welcome, ${profile.given_name || profile.name}! 🌱`);
      
      // Execute any pending action (like syncing a calendar event)
      if (this.pendingAction) {
        this.pendingAction();
        this.pendingAction = null;
      }
    });
  },

  signIn(action = null) {
    if (action) this.pendingAction = action;
    if (!this.tokenClient) { showToast('Google is still loading...'); return; }
    this.tokenClient.requestAccessToken();
  },

  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken);
    }
    this.accessToken = null;
    this.user = null;
    localStorage.removeItem('cellulose-user');
    this.renderAuthUI();
    showToast('Signed out');
  },

  renderAuthUI() {
    const area = document.getElementById('auth-area');
    if (!area) return;
    if (this.user) {
      area.innerHTML = `
        <div class="user-profile" id="user-profile-btn">
          <img class="user-avatar" src="${this.user.picture}" alt="${this.user.name}" referrerpolicy="no-referrer" />
          <span class="user-name">${this.user.name.split(' ')[0]}</span>
        </div>
      `;
      const profileBtn = document.getElementById('user-profile-btn');
      let menuOpen = false;
      profileBtn?.addEventListener('click', () => {
        const existing = document.getElementById('user-menu-dropdown');
        if (existing) { existing.remove(); menuOpen = false; return; }
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.id = 'user-menu-dropdown';
        menu.innerHTML = `
          <button id="menu-signout">🚪 Sign Out</button>
        `;
        profileBtn.parentElement.appendChild(menu);
        menuOpen = true;
        document.getElementById('menu-signout')?.addEventListener('click', () => { this.signOut(); menu.remove(); });
        setTimeout(() => document.addEventListener('click', function close(e) {
          if (!menu.contains(e.target) && !profileBtn.contains(e.target)) { menu.remove(); document.removeEventListener('click', close); }
        }), 10);
      });
    } else {
      area.innerHTML = `
        <button class="google-signin-btn" id="google-signin-btn">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          <span>Sign in</span>
        </button>
      `;
      document.getElementById('google-signin-btn')?.addEventListener('click', () => this.signIn());
    }
  },

  async syncPlantToCalendar(plantId) {
    if (!this.user || !this.accessToken) {
      showToast('Getting permission...');
      this.signIn(() => this.syncPlantToCalendar(plantId));
      return;
    }
    const plant = plantsData.find(p => p.id === plantId);
    const gardenItem = GardenStore.getAll().find(i => i.plantId === plantId);
    if (!plant || !gardenItem) return;

    // Smart Weather Check
    const loc = await getUserLocation();
    let weather = null;
    if (loc) {
      weather = await getWeatherForecast(loc.lat, loc.lon);
    }

    const sched = plant.reminderSchedule;
    const tasks = [];
    if (sched.water && sched.water > 0) tasks.push({ type: 'Water', interval: sched.water });
    if (sched.fertilize && sched.fertilize > 0) tasks.push({ type: 'Fertilize', interval: sched.fertilize });
    if (sched.prune && sched.prune > 0) tasks.push({ type: 'Prune', interval: sched.prune });

    showToast(`Syncing ${plant.name} to Calendar...`);

    try {
      for (const task of tasks) {
        if (task.type === 'Water' && weather && weather.time) {
          // Schedule the next 5 specific watering events with weather awareness
          for (let i = 1; i <= 5; i++) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (task.interval * i));
            
            // Format YYYY-MM-DD for weather lookup
            // Need to handle local timezone formatting manually since toISOString uses UTC
            const localDate = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000));
            const dateStr = localDate.toISOString().split('T')[0];
            
            const weatherIdx = weather.time.indexOf(dateStr);
            let title = `🌱 ${task.type} ${plant.name}`;
            let desc = `Cellulose reminder: Time to ${task.type.toLowerCase()} your ${plant.name}!`;

            if (weatherIdx !== -1) {
              const rain = weather.precipitation_sum[weatherIdx];
              if (rain > 2.0) { // More than 2mm of rain
                title = `🌧️ Skipped Watering: Rain Expected (${rain}mm)`;
                desc = `Cellulose Smart Weather: Heavy rain (${rain}mm) is forecast today. You can skip watering your ${plant.name}!`;
              }
            }

            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + 30);

            const localStart = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);
            const localEnd = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);

            const event = {
              summary: title,
              description: desc,
              start: { dateTime: localStart, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
              end: { dateTime: localEnd, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
              reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
            };

            const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
              method: 'POST',
              headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(event),
            });
            if (!res.ok) {
              const errTxt = await res.text();
              console.error('Calendar API Error (Weather Sync):', errTxt);
              throw new Error(`Calendar API returned ${res.status}`);
            }
          }
        } else {
          // Standard RRULE for non-water tasks or if weather failed
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + task.interval);
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + 30);

          const localStart = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);
          const localEnd = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);

          const event = {
            summary: `🌱 ${task.type} ${plant.name}`,
            description: `Cellulose reminder: Time to ${task.type.toLowerCase()} your ${plant.name}! Every ${task.interval} days.`,
            start: { dateTime: localStart, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end: { dateTime: localEnd, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            recurrence: [`RRULE:FREQ=DAILY;INTERVAL=${task.interval}`],
            reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
          };

          const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          });
          if (!res.ok) {
            const errTxt = await res.text();
            console.error('Calendar API Error (Standard Sync):', errTxt);
            throw new Error(`Calendar API returned ${res.status}`);
          }
        }
      }
      showToast(`${plant.name} care synced to Google Calendar! 📅`);
    } catch (err) {
      console.error('Calendar sync error:', err);
      showToast('Failed to sync — try signing in again');
      this.accessToken = null;
    }
  }
};

const initGoogleAuth = () => GoogleAuth.init();

// ===== MODAL CLOSE =====
document.getElementById('modal-close')?.addEventListener('click', () => {
  document.getElementById('add-garden-modal').hidden = true;
});
document.getElementById('add-garden-modal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.hidden = true;
});

// ===== INIT =====
initTheme();
initGoogleAuth();
window.addEventListener('hashchange', router);
router();

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
const initReveal = () => document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== IMAGE SHIMMER CLEANUP =====
document.addEventListener('load', (e) => {
  if (e.target.tagName === 'IMG' && e.target.closest('.plant-card-img')) {
    const shimmer = e.target.parentElement.querySelector('.img-shimmer');
    if (shimmer) shimmer.remove();
  }
}, true);

// ===== RIPPLE EFFECT =====
document.addEventListener('mousemove', (e) => {
  const btn = e.target.closest('.btn-primary');
  if (btn) {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', ((e.clientX - rect.left) / rect.width * 100) + '%');
    btn.style.setProperty('--y', ((e.clientY - rect.top) / rect.height * 100) + '%');
  }
});
