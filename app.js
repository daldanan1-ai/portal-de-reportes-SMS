/* ============================================================
   PORTAL SMS — CSFS  |  app.js
   Formularios públicos ASR y RSO — sin autenticación de usuario
   ============================================================ */

const API_BASE  = 'https://thriving-kindness-production-443e.up.railway.app/api';
const CHAT_BASE = 'https://welcoming-trust-production-b45b.up.railway.app';
const ORG_ID    = '0cdba0e3-9586-49f7-8bad-046c6a7d11f0';

const _SVC = { email: 'josequinteroh0000@gmail.com', pass: 'Johana130615' };
let _token   = null;
let _tokenEx = 0;

async function getToken() {
  if (_token && Date.now() < _tokenEx) return _token;
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: _SVC.email, password: _SVC.pass }),
  });
  if (!res.ok) throw new Error('No se pudo conectar con Atalaya SMS');
  const d = await res.json();
  _token   = d.token;
  _tokenEx = Date.now() + 23 * 3600 * 1000;
  return _token;
}

/* ── ESTADO ──────────────────────────────────────────────── */
let selectedPhotos = { asr: [], oma: [] };
let chatState = { open: false, initialized: false };
let chatHistory = [];

/* ── TEMA (dark / light) ─────────────────────────────────── */
(function initTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root   = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);

  function syncIcon() {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? '<i class="ph-bold ph-sun"></i>'
      : '<i class="ph-bold ph-moon"></i>';
  }
  syncIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      syncIcon();
    });
  }
})();

/* ── NAVEGACIÓN ──────────────────────────────────────────── */
function showSection(id) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function showHome() {
  showSection('home');
}

function showForm(type) {
  resetForm(type);
  showSection(`form-${type}`);
}

function resetForm(type) {
  const isASR       = type === 'handling';
  const formId      = isASR ? 'asr-form'      : 'rso-form';
  const successId   = isASR ? 'asr-success'   : 'rso-success';
  const submitBarId = isASR ? 'asr-submitbar' : 'rso-submitbar';
  const photoType   = isASR ? 'asr'           : 'oma';
  const fechaId     = isASR ? 'asr-fecha'     : 'rso-fecha';

  const form = document.getElementById(formId);
  if (form) form.reset();

  selectedPhotos[photoType] = [];
  const grid = document.getElementById(`${photoType}-preview-grid`);
  if (grid) grid.innerHTML = '';

  const success = document.getElementById(successId);
  if (success) success.classList.remove('show');
  const bar = document.getElementById(submitBarId);
  if (bar) bar.style.display = '';
  const btn = form ? form.querySelector('.btn-submit') : null;
  if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

  const today = new Date().toISOString().split('T')[0];
  const fechaEl = document.getElementById(fechaId);
  if (fechaEl) fechaEl.value = today;
}

/* ── CARGA INICIAL ───────────────────────────────────────── */
window.addEventListener('load', () => {
  try {
    new QRCode(document.getElementById('qr-container'), {
      text: window.location.href,
      width: 180,
      height: 180,
      colorDark: '#1e40af',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (e) {
    console.warn('QR code error:', e);
  }

  showHome();
  showChatWidget();
});

/* ── QR DOWNLOAD ─────────────────────────────────────────── */
function downloadQR() {
  const canvas = document.querySelector('#qr-container canvas');
  if (!canvas) {
    alert('El QR aún se está generando. Por favor espera un momento.');
    return;
  }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'QR-SMS-CSFS-Reportes-Seguridad.png';
  a.click();
}

/* ── UTILIDADES DE FORMULARIO ────────────────────────────── */
function collectForm(formId) {
  const data = {};
  new FormData(document.getElementById(formId)).forEach((value, key) => {
    data[key] = data[key] ? `${data[key]} | ${value}` : value;
  });
  return data;
}

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

/* ── BUILDERS DE TEXTO PARA API ──────────────────────────── */
function buildASRBody(d) {
  return `AVIATION SAFETY REPORT (ASR) — CSFS SMS
=========================================
REPORTANTE:       ${d.nombre            || '—'}
CARGO:            ${d.cargo             || '—'}
FECHA:            ${d.fecha             || '—'}
CORREO:           ${d.mail              || '—'}
ASR No:           ${d.asr_num           || 'Por asignar'}
CONFIDENCIAL:     ${d.confidencial      || 'No'}

--- DESCRIPCIÓN DEL EVENTO / IMAGEN DE PELIGRO ---
${d.descripcion || '—'}

--- SUGERENCIAS PREVENTIVAS ---
${d.sugerencias || '—'}

--- ANÁLISIS DEL RIESGO ---
Peligro Genérico:        ${d.peligro_generico      || '—'}
Peligro Característico:  ${d.peligro_caracteristico || '—'}
Consecuencia:            ${d.consecuencia           || '—'}
Riesgo:                  ${d.riesgo                 || '—'}
Defensas Propuestas:     ${d.defensas               || '—'}

--
Enviado desde el Portal SMS · CSFS`;
}

function buildRSOBody(d) {
  return `REPORTE DE SEGURIDAD OPERACIONAL (RSO) — FT-GSMS-001
=====================================================
NOMBRE:       ${d.nombre      || '—'}
CARGO:        ${d.cargo       || '—'}
CONTACTO:     ${d.contacto    || '—'}
CONFIDENCIAL: ${d.confidencial || 'No'}

--- DATOS DEL EVENTO ---
Aeropuerto:    ${d.aeropuerto    || '—'}
Fecha:         ${d.fecha         || '—'}
Hora:          ${d.hora          || '—'}
Tipo aeronave: ${d.tipo_aeronave || '—'}
Matrícula:     ${d.matricula     || '—'}
No. Vuelo:     ${d.num_vuelo     || '—'}
Posición:      ${d.posicion      || '—'}
Retraso (hrs): ${d.retraso       || '0'}
Cancelado:     ${d.cancelado     ? 'Sí' : 'No'}

--- TIPO DE EVENTO ---
${d.evento || '—'}

--- DESCRIPCIÓN BREVE ---
${d.descripcion || '—'}

--- CAUSA APARENTE ---
${d.causa || '—'}

--- VÍCTIMAS ---
Fatalidades Pasajeros: ${d.fat_pasajeros || '0'}
Heridos Pasajeros:     ${d.her_pasajeros || '0'}
Fatalidades Empleados: ${d.fat_empleados || '0'}
Heridos Empleados:     ${d.her_empleados || '0'}
Otros:                 ${d.otros         || '0'}
Sin víctimas:          ${d.ninguno       ? 'Sí' : 'No'}

--- PERSONAL INVOLUCRADO ---
Persona 1: ${d.pers1_nombre || '—'} | ${d.pers1_cargo || '—'} | ${d.pers1_id || '—'} | ${d.pers1_cia || '—'}
Persona 2: ${d.pers2_nombre || '—'} | ${d.pers2_cargo || '—'} | ${d.pers2_id || '—'} | ${d.pers2_cia || '—'}

--- CONDICIONES AMBIENTALES ---
Clima:        ${d.clima       || '—'}
Área Rampa:   ${d.rampa       || '—'}
Visibilidad:  ${d.visibilidad || '—'}
Iluminación:  ${d.iluminacion || '—'}

--- DESCRIPCIÓN DETALLADA ---
${d.detalle || '—'}

--- TERCEROS NOTIFICADOS ---
${d.terceros || '—'}

--
Enviado desde el Portal SMS · CSFS`;
}

/* ── FOTOS ───────────────────────────────────────────────── */
function onPhotoSelect(files, type) {
  const MAX = 10;
  const newFiles = Array.from(files).filter(f =>
    f.type.startsWith('image/') || f.type.startsWith('video/')
  );
  if (!newFiles.length) return;

  selectedPhotos[type] = [...selectedPhotos[type], ...newFiles].slice(0, MAX);
  renderPhotoPreviews(type);

  const input = document.getElementById(`${type}-photo-input`);
  if (input) input.value = '';
}

function renderPhotoPreviews(type) {
  const grid = document.getElementById(`${type}-preview-grid`);
  if (!grid) return;
  grid.innerHTML = '';

  selectedPhotos[type].forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const item = document.createElement('div');
    item.className = 'photo-preview-item';

    const mediaEl = isVideo
      ? `<video src="${url}" class="preview-video" muted playsinline
           onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0"></video>
         <span class="preview-video-badge"><i class="ph-bold ph-video-camera"></i></span>`
      : `<img src="${url}" alt="Foto ${idx + 1}" onload="URL.revokeObjectURL(this.src)">`;

    item.innerHTML = `
      ${mediaEl}
      <button type="button" class="photo-remove-btn" onclick="removePhoto('${type}',${idx})" aria-label="Eliminar">
        <i class="ph-bold ph-x"></i>
      </button>
      <div class="photo-name">${file.name.length > 18 ? file.name.slice(0,15)+'...' : file.name}</div>
    `;
    grid.appendChild(item);
  });
}

function removePhoto(type, idx) {
  selectedPhotos[type].splice(idx, 1);
  renderPhotoPreviews(type);
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, type) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const files = e.dataTransfer?.files;
  if (files) onPhotoSelect(files, type);
}

async function uploadPhotos(reporteId, type) {
  const files = selectedPhotos[type] || [];
  if (!files.length) return;

  const token = await getToken();
  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      await fetch(`${API_BASE}/reportes/${reporteId}/adjuntos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      console.warn('Error subiendo foto:', err);
    }
  }
}

/* ── ENVÍO ASR ───────────────────────────────────────────── */
async function submitASR(e) {
  e.preventDefault();

  const data = collectForm('asr-form');
  const btn  = document.querySelector('#asr-form .btn-submit');

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/reportes`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        organizacionId:        ORG_ID,
        tipo:                  'ASR',
        descripcion:           buildASRBody(data),
        ubicacion:             null,
        area:                  'HANDLING',
        fechaEvento:           data.fecha || null,
        nivelConfidencialidad: data.confidencial === 'Sí' ? 'CONFIDENCIAL' : 'PUBLICO',
        emailReportante:       data.mail   || null,
        nombreReportante:      data.nombre || null,
      }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const reporte = await res.json();

    if (selectedPhotos.asr.length) {
      await uploadPhotos(reporte.id, 'asr');
    }

    document.getElementById('asr-submitbar').style.display = 'none';
    document.getElementById('asr-success').classList.add('show');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    selectedPhotos.asr = [];
  } catch (err) {
    alert(`No se pudo enviar el reporte. Por favor intenta de nuevo.\n\nDetalle: ${err.message}`);
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* ── ENVÍO RSO ───────────────────────────────────────────── */
async function submitRSO(e) {
  e.preventDefault();

  const data = collectForm('rso-form');
  const btn  = document.querySelector('#rso-form .btn-submit');

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/reportes`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        organizacionId:        ORG_ID,
        tipo:                  'RSO',
        descripcion:           buildRSOBody(data),
        ubicacion:             data.aeropuerto || null,
        area:                  'OMA',
        fechaEvento:           data.fecha || null,
        nivelConfidencialidad: data.confidencial === 'Sí' ? 'CONFIDENCIAL' : 'PUBLICO',
        emailReportante:       data.contacto || null,
        nombreReportante:      data.nombre   || null,
      }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const reporte = await res.json();

    if (selectedPhotos.oma.length) {
      await uploadPhotos(reporte.id, 'oma');
    }

    document.getElementById('rso-submitbar').style.display = 'none';
    document.getElementById('rso-success').classList.add('show');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    selectedPhotos.oma = [];
  } catch (err) {
    alert(`No se pudo enviar el reporte. Por favor intenta de nuevo.\n\nDetalle: ${err.message}`);
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

/* ── CHATBOT ─────────────────────────────────────────────── */
function showChatWidget() {
  const w = document.getElementById('chat-widget');
  if (w) w.style.display = 'flex';
}

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  if (!panel) return;

  chatState.open = !chatState.open;
  panel.classList.toggle('chat-panel-open', chatState.open);

  const openIcon = document.querySelector('.chat-fab-icon-open');
  const closeIcon = document.querySelector('.chat-fab-icon-close');
  if (openIcon) openIcon.style.display = chatState.open ? 'none' : '';
  if (closeIcon) closeIcon.style.display = chatState.open ? '' : 'none';

  if (chatState.open && !chatState.initialized) {
    initChatbot();
  }
}

function initChatbot() {
  chatState.initialized = true;
  chatHistory = [];
  const greeting = '¡Hola! Soy AVI 👋 Estoy aquí para ayudarte a registrar tu reporte de seguridad de forma fácil, sin formularios complicados.\n\n¿Qué situación quieres reportar?';
  chatHistory.push({ rol: 'assistant', contenido: greeting });
  appendChatMsg('assistant', greeting);
}

async function sendChatMsg() {
  const input = document.getElementById('chat-text-input');
  const sendBtn = document.querySelector('.chat-send-btn');
  const text = input?.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  chatHistory.push({ rol: 'user', contenido: text });
  appendChatMsg('user', text);

  const typingId = appendChatMsg('assistant', '', true);

  try {
    const res = await fetch(`${CHAT_BASE}/portal/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensajes: chatHistory, orgId: ORG_ID }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const data = await res.json();
    removeTyping(typingId);

    const respText = data.texto || 'Hubo un problema procesando tu mensaje. Por favor intenta de nuevo.';
    chatHistory.push({ rol: 'assistant', contenido: respText });
    appendChatMsg('assistant', respText);

    if (data.documentoCreado?.id) {
      appendReporteCreado(data.documentoCreado.id);
    }
  } catch (err) {
    removeTyping(typingId);
    const errMsg = 'No pude conectarme en este momento. Por favor intenta de nuevo.';
    chatHistory.push({ rol: 'assistant', contenido: errMsg });
    appendChatMsg('assistant', errMsg);
  } finally {
    input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    input.focus();
  }
}

function appendReporteCreado(reporteId) {
  const list = document.getElementById('chat-messages-list');
  if (!list) return;

  const div = document.createElement('div');
  div.className = 'chat-msg chat-msg-assistant';
  div.innerHTML = `
    <div class="chat-bubble chat-bubble-success">
      <div class="chat-success-title">✅ Reporte registrado</div>
      <div class="chat-success-id">${reporteId}</div>
      <div class="chat-success-note">Guarda este número para hacer seguimiento de tu reporte con el Coordinador SMS.</div>
    </div>
  `;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

let _chatMsgId = 0;
function appendChatMsg(rol, texto, isTyping = false) {
  const list = document.getElementById('chat-messages-list');
  if (!list) return null;

  const id = `cm-${++_chatMsgId}`;
  const div = document.createElement('div');
  div.id = id;
  div.className = `chat-msg chat-msg-${rol}`;

  if (isTyping) {
    div.innerHTML = '<div class="chat-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>';
  } else {
    div.innerHTML = `<div class="chat-bubble">${formatChatText(texto)}</div>`;
  }

  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function formatChatText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
