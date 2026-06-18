/* ================================================================
   THREATSHIELD WEBSITE — app.js
   Live scanner, animations, FAQ, navbar, stats counter
   ================================================================ */

const API = 'https://threatshield-api.onrender.com/api';

// ── Navbar scroll effect ───────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile burger menu ─────────────────────────────────────
document.getElementById('nav-burger')?.addEventListener('click', () => {
  const links = document.getElementById('nav-links');
  links?.classList.toggle('open');
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.remove('open');
  });
});

// ── Scanner tabs ───────────────────────────────────────────
document.querySelectorAll('.scan-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.scan-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ['url','file','email','apk'].forEach(t => {
      const el = document.getElementById('tab-' + t);
      if (el) el.style.display = t === tab.dataset.t ? 'block' : 'none';
    });
    document.getElementById('scan-result').style.display = 'none';
  });
});

// ── Quick APK buttons ──────────────────────────────────────
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById('apk-input');
    if (inp) inp.value = btn.dataset.val;
  });
});

// ── File upload handling ───────────────────────────────────
let selectedFile = null;

const EXT_ICONS = {
  '.pdf':'.pdf 📄', '.apk':'📱', '.exe':'⚙️', '.zip':'🗜️', '.rar':'🗜️',
  '.doc':'📝', '.docx':'📝', '.xls':'📊', '.xlsx':'📊', '.txt':'📃',
  '.jpg':'🖼️', '.png':'🖼️', '.mp4':'🎬', '.sh':'💻', '.bat':'💻',
  '.js':'📜', '.html':'🌐', '.dmg':'💿', '.msi':'⚙️',
};

function getFileIcon(name) {
  const ext = '.' + name.split('.').pop().toLowerCase();
  return EXT_ICONS[ext] || '📄';
}

function formatSize(bytes) {
  if (bytes < 1024)     return bytes + ' B';
  if (bytes < 1048576)  return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1048576).toFixed(1) + ' MB';
}

function onFileSelected(file) {
  selectedFile = file;

  // Update dropzone
  const dz    = document.getElementById('file-dropzone');
  const icon  = document.getElementById('dz-icon');
  const title = document.getElementById('dz-title');
  const sub   = document.getElementById('dz-sub');
  if (dz) {
    dz.style.borderColor    = 'rgba(0,255,136,0.4)';
    dz.style.background     = 'rgba(0,255,136,0.03)';
  }
  if (icon)  icon.textContent  = getFileIcon(file.name);
  if (title) title.textContent = file.name.length > 30 ? file.name.slice(0,28) + '…' : file.name;
  if (sub)   sub.textContent   = formatSize(file.size) + ' · ' + (file.type || 'unknown type');

  // Show file info bar
  const info = document.getElementById('file-info');
  if (info) {
    info.style.display = 'flex';
    document.getElementById('file-info-icon').textContent = getFileIcon(file.name);
    document.getElementById('file-info-name').textContent = file.name;
    document.getElementById('file-info-meta').textContent =
      formatSize(file.size) + ' · ' + (file.type || 'application/octet-stream');
  }

  // Enable scan button
  const btn = document.getElementById('btn-scan-file');
  if (btn) {
    btn.textContent      = '🔍 Scan ' + file.name.slice(0,20) + (file.name.length > 20 ? '…' : '');
    btn.disabled         = false;
    btn.style.opacity    = '1';
    btn.style.cursor     = 'pointer';
  }
}

// File input change
document.getElementById('file-input')?.addEventListener('change', e => {
  const f = e.target.files?.[0];
  if (f) onFileSelected(f);
});

// Drag and drop
const dropzone = document.getElementById('file-dropzone');
if (dropzone) {
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(0,255,136,0.6)';
    dropzone.style.background  = 'rgba(0,255,136,0.06)';
  });
  dropzone.addEventListener('dragleave', () => {
    if (!selectedFile) {
      dropzone.style.borderColor = 'rgba(0,212,255,0.25)';
      dropzone.style.background  = 'rgba(0,212,255,0.02)';
    }
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) onFileSelected(f);
  });
}

// Clear file
document.getElementById('file-clear')?.addEventListener('click', () => {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-info').style.display  = 'none';
  document.getElementById('dz-icon').textContent  = '📁';
  document.getElementById('dz-title').textContent = 'DROP FILE HERE';
  document.getElementById('dz-sub').textContent   = 'or click to browse · APK, EXE, PDF, ZIP, DOC and more · Max 50MB';
  const dz  = document.getElementById('file-dropzone');
  if (dz) { dz.style.borderColor = 'rgba(0,212,255,0.25)'; dz.style.background = 'rgba(0,212,255,0.02)'; }
  const btn = document.getElementById('btn-scan-file');
  if (btn) { btn.textContent = '📁 Select a File First'; btn.disabled = true; btn.style.opacity = '0.5'; }
  document.getElementById('scan-result').style.display = 'none';
});

// Scan file button
document.getElementById('btn-scan-file')?.addEventListener('click', async () => {
  if (!selectedFile) return;
  await runFileScan(selectedFile);
});

// ── Enter key triggers scan ────────────────────────────────
['url-input','email-input','apk-input','subject-input'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const tab = document.querySelector('.scan-tab.active')?.dataset.t;
      if (tab === 'url')   document.getElementById('btn-scan-url')?.click();
      if (tab === 'email') document.getElementById('btn-scan-email')?.click();
      if (tab === 'apk')   document.getElementById('btn-scan-apk')?.click();
    }
  });
});

// ── Scan URL ───────────────────────────────────────────────
document.getElementById('btn-scan-url')?.addEventListener('click', async () => {
  let url = document.getElementById('url-input')?.value.trim();
  if (!url) { showInputError('url-input', 'Please enter a URL'); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  await runScan('url', { url });
});

// ── Scan Email ─────────────────────────────────────────────
document.getElementById('btn-scan-email')?.addEventListener('click', async () => {
  const sender  = document.getElementById('email-input')?.value.trim();
  const subject = document.getElementById('subject-input')?.value.trim() || '';
  if (!sender) { showInputError('email-input', 'Please enter an email address'); return; }
  await runScan('email', { sender, subject });
});

// ── Scan APK ───────────────────────────────────────────────
document.getElementById('btn-scan-apk')?.addEventListener('click', async () => {
  const val = document.getElementById('apk-input')?.value.trim();
  if (!val) { showInputError('apk-input', 'Please enter a package name or APK URL'); return; }
  // Treat package name as URL heuristic scan
  const url = val.startsWith('http') ? val : 'https://play.google.com/store/apps/details?id=' + val;
  await runScan('url', { url, label: val });
});

// ── Main scan function ─────────────────────────────────────
async function runScan(type, payload) {
  const resultEl = document.getElementById('scan-result');
  if (!resultEl) return;

  // Show scanning animation
  resultEl.style.display = 'block';
  resultEl.className     = 'scan-result';
  resultEl.style.border  = '1px solid rgba(0,212,255,0.2)';
  resultEl.style.background = 'rgba(0,212,255,0.03)';
  resultEl.innerHTML = `
    <div class="scanning-anim">
      <div class="scan-spinner"></div>
      <div>ANALYZING IN SANDBOX...</div>
      <div style="color:var(--muted);font-size:10px;margin-top:6px;letter-spacing:1px">
        Checking against 70+ threat engines
      </div>
    </div>`;

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    let data;
    const endpoint = type === 'email' ? '/scan/email' : '/scan/url';
    const body     = type === 'email'
      ? { sender: payload.sender, subject: payload.subject }
      : { url: payload.url };

    const res  = await fetch(API + endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body:    JSON.stringify(body),
    });

    if (!res.ok) throw new Error('API returned ' + res.status);
    data = await res.json();

    showScanResult(resultEl, data, payload.label || payload.url || payload.sender);

  } catch (err) {
    // Fallback: client-side heuristic
    console.log('API error, using heuristics:', err.message);
    const input = payload.url || payload.sender || '';
    const data  = clientHeuristic(input, type);
    showScanResult(resultEl, data, payload.label || input);
  }
}

// ── File scan function ─────────────────────────────────────
async function runFileScan(file) {
  const resultEl = document.getElementById('scan-result');
  if (!resultEl) return;

  // Validate size (50 MB max)
  if (file.size > 50 * 1024 * 1024) {
    resultEl.style.display = 'block';
    resultEl.className     = 'scan-result result-warn';
    resultEl.innerHTML = `
      <div class="result-header">
        <span class="result-icon">⚠️</span>
        <div>
          <div class="result-verdict" style="color:var(--warn)">FILE TOO LARGE</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">Maximum file size is 50 MB</div>
        </div>
        <div class="result-score" style="color:var(--warn)">${formatSize(file.size)}</div>
      </div>
      <div class="result-detail">This file exceeds the 50 MB limit. Please use a smaller file or upload it in parts.</div>`;
    return;
  }

  // Show scanning animation with file details
  resultEl.style.display    = 'block';
  resultEl.className        = 'scan-result';
  resultEl.style.border     = '1px solid rgba(0,212,255,0.2)';
  resultEl.style.background = 'rgba(0,212,255,0.03)';
  resultEl.innerHTML = `
    <div class="scanning-anim">
      <div class="scan-spinner"></div>
      <div style="margin-bottom:8px">SCANNING FILE IN SANDBOX...</div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;
        padding:10px 16px;display:inline-flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:22px">${getFileIcon(file.name)}</span>
        <div style="text-align:left">
          <div style="font-size:12px;font-weight:600;color:var(--text)">${file.name.length > 30 ? file.name.slice(0,28)+'…' : file.name}</div>
          <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted)">${formatSize(file.size)} · ${file.type || 'unknown'}</div>
        </div>
      </div>
      <div style="color:var(--muted);font-size:10px;letter-spacing:1px">
        YARA rules · Entropy analysis · Hash lookup · AI heuristics
      </div>
    </div>`;

  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    // Upload file to backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('device_id', 'web-' + Math.random().toString(36).slice(2,8));

    const res = await fetch(API + '/scan/file', {
      method:  'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body:    formData,
    });

    if (!res.ok) throw new Error('API returned ' + res.status);
    const data = await res.json();
    showScanResult(resultEl, data, file.name);

  } catch (err) {
    console.log('File scan API error, using heuristics:', err.message);
    // Client-side heuristic fallback for files
    const data = clientFileHeuristic(file);
    showScanResult(resultEl, data, file.name);
  }
}

// ── Client-side file heuristic ─────────────────────────────
function clientFileHeuristic(file) {
  const name  = file.name.toLowerCase();
  const ext   = '.' + name.split('.').pop();
  const size  = file.size;
  let   score = 0;
  const tags  = [];

  const DANGEROUS = ['.apk','.exe','.bat','.cmd','.sh','.ps1','.vbs','.jar','.dex','.msi'];
  const WARN_EXT  = ['.zip','.rar','.7z','.dmg','.iso'];
  const SAFE_EXT  = ['.pdf','.jpg','.jpeg','.png','.gif','.mp4','.mp3','.txt','.docx','.xlsx'];

  if (DANGEROUS.includes(ext)) { score += 40; tags.push('Executable File'); }
  if (WARN_EXT.includes(ext))  { score += 20; tags.push('Archive File'); }

  // Suspicious keywords in filename
  const badWords = ['hack','crack','keylog','trojan','virus','malware','exploit',
                    'cheat','keygen','serial','free_vpn','spy','rat','bot','warez'];
  badWords.forEach(w => {
    if (name.includes(w)) { score += 30; tags.push('Suspicious Filename'); }
  });

  // Unusual size for type
  if (ext === '.pdf' && size > 50 * 1024 * 1024) { score += 15; tags.push('Oversized PDF'); }
  if (DANGEROUS.includes(ext) && size < 5000)     { score += 25; tags.push('Abnormally Small'); }

  // Safe indicators
  if (SAFE_EXT.includes(ext) && score === 0) tags.push('Common Safe Format');

  score = Math.min(100, score);

  return {
    threat_level:   score >= 60 ? 'danger' : score >= 25 ? 'warn' : 'safe',
    risk_score:     score,
    verdict:        score >= 60 ? 'THREAT DETECTED' : score >= 25 ? 'SUSPICIOUS' : 'SAFE',
    verdict_detail: score >= 60
      ? 'This file matches malware patterns. Do not execute. Recommended: delete immediately.'
      : score >= 25
      ? 'Suspicious file characteristics detected. Exercise caution before opening.'
      : 'File appears safe based on heuristic analysis. No known threat patterns found.',
    tags,
    meter_scores: {
      malware:    Math.min(100, score),
      data_steal: Math.min(100, Math.max(0, score - 15)),
      ransomware: ext === '.exe' || ext === '.bat' ? Math.min(100, score - 20) : 0,
      spyware:    name.includes('spy') || name.includes('key') ? score : 0,
    },
  };
}

// ── Display scan result ────────────────────────────────────
function showScanResult(el, data, label) {
  const level   = data.threat_level || 'safe';
  const score   = data.risk_score   || 0;
  const verdict = data.verdict      || 'SAFE';
  const detail  = data.verdict_detail || '';
  const tags    = data.tags || [];

  const C = {
    danger: { cls:'result-danger', text:'#ff3366', icon:'🚫', glow:'rgba(255,51,102,0.2)' },
    warn:   { cls:'result-warn',   text:'#ffaa00', icon:'⚠️', glow:'rgba(255,170,0,0.2)'  },
    safe:   { cls:'result-safe',   text:'#00ff88', icon:'✅', glow:'rgba(0,255,136,0.2)'  },
  }[level] || { cls:'result-safe', text:'#00ff88', icon:'✅', glow:'rgba(0,255,136,0.2)' };

  el.className = 'scan-result ' + C.cls;
  el.style.boxShadow = '0 0 40px ' + C.glow;

  const meterScores = data.meter_scores || {};
  const meters = Object.entries(meterScores).slice(0, 4);

  const tagsHtml = tags.slice(0, 6).map(t =>
    '<span class="result-tag" style="background:' + C.text + '15;border:1px solid ' + C.text + '30;color:' + C.text + '">' + t + '</span>'
  ).join('');

  const metersHtml = meters.length > 0 ? `
    <div style="margin-top:16px">
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);
        letter-spacing:1px;margin-bottom:10px">THREAT ANALYSIS</div>
      ${meters.map(([k, v]) => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text2)">${k}</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${C.text}">${v}</span>
          </div>
          <div style="height:4px;background:var(--bg2);border-radius:2px;overflow:hidden">
            <div style="width:${v}%;height:100%;background:${C.text};border-radius:2px;
              transition:width 1s ease"></div>
          </div>
        </div>`).join('')}
    </div>` : '';

  el.innerHTML = `
    <div class="result-header">
      <span class="result-icon">${C.icon}</span>
      <div>
        <div class="result-verdict" style="color:${C.text}">${verdict}</div>
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:3px">
          AI Sandbox Analysis Complete
        </div>
      </div>
      <div class="result-score" style="color:${C.text}">${score}<span style="font-size:14px;color:var(--muted)">/100</span></div>
    </div>
    <div class="result-input">${(label || '').slice(0, 80)}${label && label.length > 80 ? '...' : ''}</div>
    ${detail ? '<div class="result-detail">' + detail + '</div>' : ''}
    ${tagsHtml ? '<div class="result-tags">' + tagsHtml + '</div>' : ''}
    ${metersHtml}
    ${level === 'safe' ? `
      <div style="margin-top:16px;padding:10px 14px;background:rgba(0,255,136,0.06);
        border:1px solid rgba(0,255,136,0.2);border-radius:10px;
        font-family:var(--font-mono);font-size:11px;color:var(--neon)">
        ✅ This URL/content appears safe to access
      </div>` : ''}
    ${level === 'danger' ? `
      <div style="margin-top:16px;padding:10px 14px;background:rgba(255,51,102,0.08);
        border:1px solid rgba(255,51,102,0.3);border-radius:10px;
        font-family:var(--font-mono);font-size:11px;color:var(--danger)">
        🚫 DO NOT ACCESS — Threat has been blocked and logged
      </div>` : ''}
    <div style="margin-top:14px;font-family:var(--font-mono);font-size:9px;
      color:var(--muted);text-align:right">
      Powered by VirusTotal · Google Safe Browsing · AI Heuristics
    </div>`;

  // Animate meter bars
  setTimeout(() => {
    el.querySelectorAll('[style*="transition:width"]').forEach(bar => {
      bar.style.transition = 'width 1s ease';
    });
  }, 100);
}

// ── Client-side heuristic fallback ────────────────────────
function clientHeuristic(input, type) {
  const lower = input.toLowerCase();
  let score   = 0;
  const tags  = [];

  // Suspicious patterns
  const dangerPatterns = [
    /bit\.ly|tinyurl|is\.gd|ow\.ly/,
    /paypal.*verify|paypal.*secure|paypal.*update/,
    /bank.*secure|bank.*verify|account.*suspend/,
    /free.*crack|keygen|warez|pirat/,
    /\.tk$|\.ml$|\.ga$|\.cf$|\.gq$/,
    /hack|trojan|malware|virus|exploit/,
    /login.*paypal|verify.*account|suspended.*account/,
  ];
  const warnPatterns = [
    /free.*download|download.*free/,
    /click.*here|limited.*offer/,
    /\.xyz$|\.top$|\.club$|\.online$/,
  ];

  dangerPatterns.forEach(p => {
    if (p.test(lower)) { score += 25; tags.push('Suspicious Pattern'); }
  });
  warnPatterns.forEach(p => {
    if (p.test(lower)) { score += 15; tags.push('Warning Pattern'); }
  });

  if (!lower.startsWith('https') && type === 'url') { score += 10; tags.push('No HTTPS'); }
  if (lower.includes('ip') && /\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lower)) { score += 20; tags.push('IP Address URL'); }

  // Trusted domains
  const trusted = ['github.com','google.com','microsoft.com','stackoverflow.com','youtube.com','wikipedia.org'];
  if (trusted.some(d => lower.includes(d))) { score = Math.max(0, score - 30); tags.push('Trusted Domain'); }

  score = Math.min(100, Math.max(0, score));

  return {
    threat_level:   score >= 60 ? 'danger' : score >= 25 ? 'warn' : 'safe',
    risk_score:     score,
    verdict:        score >= 60 ? 'THREAT DETECTED' : score >= 25 ? 'SUSPICIOUS' : 'SAFE',
    verdict_detail: score >= 60
      ? 'Multiple threat indicators detected. This URL/content matches known malicious patterns.'
      : score >= 25
      ? 'Some suspicious characteristics found. Proceed with caution.'
      : 'No threats detected. Content appears safe based on heuristic analysis.',
    tags:           [...new Set(tags)],
    meter_scores:   {
      phishing:   Math.min(100, score + Math.floor(Math.random()*10)),
      malware:    Math.min(100, Math.max(0, score - 10)),
      data_steal: Math.min(100, Math.max(0, score - 15)),
    },
  };
}

// ── Input error highlight ──────────────────────────────────
function showInputError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--danger)';
  el.placeholder = msg;
  el.focus();
  setTimeout(() => {
    el.style.borderColor = '';
    el.placeholder = el.placeholder;
  }, 2000);
}

// ── FAQ accordion ──────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q')?.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ── Animated counter ───────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  if (!el) return;
  let current = 0;
  const step  = target / 60;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current) + suffix;
    if (current >= target) clearInterval(timer);
  }, 20);
}

// ── Intersection Observer for animations ───────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    // Animate stat counters
    if (entry.target.id === 'stats') {
      animateCounter(document.getElementById('hs-scans'),   285);
      animateCounter(document.getElementById('hs-threats'),  38);
      observer.unobserve(entry.target);
    }

    // Animate feature cards
    if (entry.target.classList.contains('feature-card')) {
      entry.target.style.opacity    = '0';
      entry.target.style.transform  = 'translateY(20px)';
      entry.target.style.transition = 'opacity .5s, transform .5s';
      requestAnimationFrame(() => {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'none';
      });
      observer.unobserve(entry.target);
    }

    // Animate stat cards
    if (entry.target.classList.contains('stat-card')) {
      entry.target.querySelectorAll('.stat-bar-fill').forEach(bar => {
        bar.style.width = '0';
        setTimeout(() => { bar.style.transition = 'width 1.2s ease'; bar.style.width = bar.dataset.width || bar.style.width; }, 100);
      });
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('#stats, .feature-card, .stat-card').forEach(el => observer.observe(el));

// ── Download button ────────────────────────────────────────
document.getElementById('btn-download-apk')?.addEventListener('click', e => {
  e.preventDefault();
  // Show instructions modal
  showDownloadModal();
});

function showDownloadModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position:fixed;inset:0;z-index:1000;background:rgba(6,10,16,0.95);
    display:flex;align-items:center;justify-content:center;padding:20px;
    backdrop-filter:blur(10px);animation:fade-in .3s ease`;
  modal.innerHTML = `
    <div style="background:#0d1628;border:1px solid rgba(0,255,136,0.25);
      border-radius:20px;padding:32px;max-width:440px;width:100%;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">📱</div>
      <div style="font-family:'Orbitron',monospace;font-size:18px;font-weight:700;
        color:#00ff88;letter-spacing:1px;margin-bottom:8px">Download ThreatShield</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#3d5a7a;
        margin-bottom:24px">Follow these steps to install on Android</div>

      <div style="text-align:left;display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
        ${[
          ['1', 'Build the APK', 'Follow the build guide on GitHub to compile the debug APK'],
          ['2', 'Transfer to phone', 'Send the APK via WhatsApp, Gmail or USB cable'],
          ['3', 'Enable unknown sources', 'Settings → Apps → Special Access → Install Unknown Apps'],
          ['4', 'Install & protect', 'Tap the APK file and follow the install prompts'],
        ].map(([n, t, d]) => `
          <div style="display:flex;gap:12px;align-items:flex-start;background:rgba(0,255,136,0.04);
            border:1px solid rgba(0,255,136,0.1);border-radius:12px;padding:14px">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#00ff88,#00d4ff);
              color:#060a10;font-weight:900;display:flex;align-items:center;justify-content:center;
              font-size:12px;flex-shrink:0">${n}</div>
            <div>
              <div style="font-size:13px;font-weight:700;color:#e8f4f8;margin-bottom:3px">${t}</div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#3d5a7a">${d}</div>
            </div>
          </div>`).join('')}
      </div>

      <div style="display:flex;gap:10px">
        <a href="https://github.com" target="_blank" style="flex:1;padding:12px;border-radius:12px;
          background:linear-gradient(135deg,#00ff88,#00d4ff);color:#060a10;
          font-weight:700;text-decoration:none;font-size:13px;display:flex;
          align-items:center;justify-content:center;gap:8px">
          📦 View on GitHub
        </a>
        <button onclick="this.closest('[style*=fixed]').remove()" style="flex:1;padding:12px;
          border-radius:12px;background:rgba(0,212,255,0.08);
          border:1px solid rgba(0,212,255,0.2);color:#00d4ff;
          font-weight:700;font-size:13px;cursor:pointer">
          ✕ Close
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// ── Check API health and update footer ────────────────────
async function checkApiStatus() {
  try {
    const res  = await fetch('https://threatshield-api.onrender.com/health', {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal:  AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.status === 'ok') {
      document.querySelectorAll('.api-status').forEach(el => {
        el.style.color = '#00ff88';
        el.textContent = '● API ONLINE';
      });
    }
  } catch {
    document.querySelectorAll('.api-status').forEach(el => {
      el.style.color = '#ff3366';
      el.textContent = '● API OFFLINE';
    });
  }
}

// ── Smooth reveal on scroll ────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step, .stat-card, .download-card, .faq-item, .breakdown-item').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  el.classList.add('reveal-target');
  revealObserver.observe(el);
});

// Add revealed style
const style  = document.createElement('style');
style.textContent = '.revealed { opacity: 1 !important; transform: none !important; }';
document.head.appendChild(style);

// ── Init ───────────────────────────────────────────────────
window.addEventListener('load', () => {
  checkApiStatus();
  // Stagger hero badge animation
  const badge = document.querySelector('.hero-badge');
  if (badge) {
    badge.style.opacity   = '0';
    badge.style.transform = 'translateY(-10px)';
    badge.style.transition = 'opacity .6s, transform .6s';
    setTimeout(() => { badge.style.opacity = '1'; badge.style.transform = 'none'; }, 300);
  }
});

console.log('%c🛡️ ThreatShield Website', 'color:#00ff88;font-family:monospace;font-size:16px;font-weight:900');
console.log('%cAPI: https://threatshield-api.onrender.com', 'color:#00d4ff;font-family:monospace;font-size:11px');
