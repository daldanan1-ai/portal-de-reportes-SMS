/* ============================================================
   PORTAL SMS — CSFS  |  app.js
   Lógica de la aplicación: navegación, API Atalaya, formularios
   ============================================================ */

const API_BASE = 'https://atalaya-production-f377.up.railway.app/api';
let currentOrgId = null;

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
function showHome() {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('home').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showForm(type) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById('form-' + type).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── CARGA INICIAL ───────────────────────────────────────── */
window.addEventListener('load', async () => {
  /* Código QR */
  new QRCode(document.getElementById('qr-container'), {
    text: window.location.href,
    width: 180,
    height: 180,
    colorDark: '#1e40af',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });

  /* Fecha de hoy en los formularios */
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('asr-fecha').value = today;
  document.getElementById('rso-fecha').value = today;

  /* Obtener organización de Atalaya */
  try {
    const res = await fetch(`${API_BASE}/auth/organizaciones`);
    if (res.ok) {
      const orgs = await res.json();
      if (orgs.length > 0) currentOrgId = orgs[0].id;
    }
  } catch (e) {
    console.warn('No se pudo conectar con Atalaya al cargar:', e);
  }
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

/* ── ENVÍO ASR ───────────────────────────────────────────── */
async function submitASR(e) {
  e.preventDefault();
  const data = collectForm('asr-form');
  const btn  = document.querySelector('#asr-form .btn-submit');

  if (!currentOrgId) {
    alert('Error de conexión con el sistema Atalaya. Por favor recarga la página e intenta de nuevo.');
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/reportes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizacionId:        currentOrgId,
        reportanteId:          null,
        tipo:                  'ASR',
        descripcion:           buildASRBody(data),
        ubicacion:             null,
        area:                  'HANDLING',
        fechaEvento:           data.fecha || null,
        nivelConfidencialidad: data.confidencial === 'Sí' ? 'CONFIDENCIAL' : 'ANONIMO',
      }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    document.getElementById('asr-submitbar').style.display = 'none';
    document.getElementById('asr-success').classList.add('show');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

  if (!currentOrgId) {
    alert('Error de conexión con el sistema Atalaya. Por favor recarga la página e intenta de nuevo.');
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/reportes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizacionId:        currentOrgId,
        reportanteId:          null,
        tipo:                  'RSO',
        descripcion:           buildRSOBody(data),
        ubicacion:             data.aeropuerto || null,
        area:                  'OMA',
        fechaEvento:           data.fecha || null,
        nivelConfidencialidad: data.confidencial === 'Sí' ? 'CONFIDENCIAL' : 'ANONIMO',
      }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    document.getElementById('rso-submitbar').style.display = 'none';
    document.getElementById('rso-success').classList.add('show');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } catch (err) {
    alert(`No se pudo enviar el reporte. Por favor intenta de nuevo.\n\nDetalle: ${err.message}`);
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}
