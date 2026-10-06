/* ============================================
   KONFIGURASI SUPABASE
   ============================================ */
const SUPABASE_URL = 'https://jxcktlqhcgdvpjpzzexg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_l-srqPYz_NAtYe6pmERuKw_sjoM3DLp';

/* ============================================
   OVERLAY BUKA UNDANGAN
   ============================================ */
const openingOverlay = document.getElementById('openingOverlay');
const btnOpen = document.getElementById('btnOpen');
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

document.body.classList.add('overlay-active');
bgMusic.volume = 0.5;
bgMusic.preload = 'auto';

btnOpen.addEventListener('click', () => {
  bgMusic.play().then(() => {
    musicBtn.classList.add('playing');
    musicBtn.textContent = '❚❚';
  }).catch(err => console.log('Play gagal:', err.message));

  openingOverlay.classList.add('hide');
  document.body.classList.remove('overlay-active');
});

/* ===== Efek Ornamen Bercahaya Jatuh ===== */
(function() {
  const particleContainer = document.getElementById('particles');
  if (!particleContainer) {
    console.warn('⚠️ Elemen #particles tidak ditemukan di HTML');
    return;
  }

  const particleCount = 60;

  function createParticle() {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 6 + 2;
    const left = Math.random() * 100;
    const duration = Math.random() * 8 + 6;
    const delay = Math.random() * 10;
    const opacity = Math.random() * 0.6 + 0.4;

    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = left + '%';
    p.style.animationDuration = duration + 's, ' + (Math.random() * 2 + 1.5) + 's';
    p.style.animationDelay = delay + 's, 0s';
    p.style.opacity = opacity;

    particleContainer.appendChild(p);
  }

  for (let i = 0; i < particleCount; i++) {
    createParticle();
  }

  console.log('✅ Partikel dibuat: ' + particleCount);
})();

/* ===== Music Toggle Manual ===== */
musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      musicBtn.classList.add('playing');
      musicBtn.textContent = '❚❚';
    }).catch(err => console.log('Play gagal:', err.message));
  } else {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
    musicBtn.textContent = '♪';
  }
});

/* ============================================
   INISIALISASI SUPABASE
   ============================================ */
let db = null;

try {
  if (window.supabase && window.supabase.createClient) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase terhubung');
  } else {
    console.error('❌ Library Supabase belum dimuat!');
  }
} catch (err) {
  console.error('❌ Gagal init Supabase:', err);
}

/* ============================================
   RSVP — FORM & DAFTAR TAMU + REALTIME
   ============================================ */
const rsvpForm = document.getElementById('rsvpForm');
const rsvpResult = document.getElementById('rsvpResult');

let currentRsvpData = [];

function renderRsvpList(data) {
  if (!data || data.length === 0) {
    rsvpResult.innerHTML = `
      <div class="result-empty">
        <div class="result-icon">💌</div>
        <p>Belum ada tamu yang mengisi konfirmasi.<br>Jadilah yang pertama!</p>
      </div>
    `;
    return;
  }

  const totalHadir = data.filter(d => d.attend === 'Hadir').length;
  const totalTidak = data.filter(d => d.attend === 'Tidak Hadir').length;
  const totalRagu = data.filter(d => d.attend === 'Masih Ragu').length;

  const listHtml = data.map(item => {
    let attendClass = '';
    let attendIcon = '';
    if (item.attend === 'Hadir') {
      attendClass = 'attend-hadir';
      attendIcon = '✅';
    } else if (item.attend === 'Tidak Hadir') {
      attendClass = 'attend-tidak';
      attendIcon = '❌';
    } else {
      attendClass = 'attend-ragu';
      attendIcon = '⏳';
    }

    const date = new Date(item.created_at);
    const timeStr = date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="guest-item">
        <div class="guest-header">
          <span class="guest-name">${escapeHtml(item.name)}</span>
          <span class="guest-badge ${attendClass}">${attendIcon} ${item.attend}</span>
        </div>
        ${item.message ? `<div class="guest-message">"${escapeHtml(item.message)}"</div>` : ''}
        <div class="guest-time">${timeStr}</div>
      </div>
    `;
  }).join('');

  rsvpResult.innerHTML = `
    <div class="result-filled">
      <div class="result-header">
        <span class="check-icon">🎉</span>
        <h3>Daftar Tamu</h3>
        <p style="color: #ccc; font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; margin-top: 8px;">
          ${data.length} konfirmasi • ${totalHadir} hadir • ${totalTidak} tidak • ${totalRagu} ragu
        </p>
      </div>
      <div class="guest-list">
        ${listHtml}
      </div>
    </div>
  `;
}

async function loadRsvpList() {
  if (!db) {
    rsvpResult.innerHTML = `
      <div class="result-empty">
        <div class="result-icon">💌</div>
        <p>Supabase belum siap. Cek Console (F12).</p>
      </div>
    `;
    return;
  }

  rsvpResult.innerHTML = `
    <div class="result-empty">
      <div class="result-icon" style="animation: pulse 1s infinite;">⏳</div>
      <p>Memuat daftar tamu...</p>
    </div>
  `;

  const { data, error } = await db
    .from('rsvp')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch error:', error);
    rsvpResult.innerHTML = `
      <div class="result-empty">
        <div class="result-icon" style="color: #ff8a8a;">✕</div>
        <p>Gagal memuat: ${escapeHtml(error.message)}</p>
      </div>
    `;
    return;
  }

  currentRsvpData = data || [];
  renderRsvpList(currentRsvpData);
}

rsvpForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  e.stopPropagation();

  const name = document.getElementById('name').value.trim();
  const attend = document.getElementById('attend').value;
  const message = document.getElementById('message').value.trim();

  if (!name || !attend) {
    alert('Nama dan konfirmasi kehadiran wajib diisi!');
    return;
  }

  if (!db) {
    alert('Supabase belum siap. Cek Console (F12).');
    return;
  }

  const submitBtn = rsvpForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengirim...';

  const { error } = await db
    .from('rsvp')
    .insert([{ name, attend, message }]);

  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (error) {
    console.error('Insert error:', error);
    alert('Gagal mengirim: ' + error.message);
    return;
  }

  rsvpForm.reset();
  await loadRsvpList();

  if (window.innerWidth < 768) {
    setTimeout(() => {
      rsvpResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }
});

window.addEventListener('load', () => {
  setTimeout(loadRsvpList, 500);
});

/* ============================================
   REALTIME
   ============================================ */
function setupRealtime() {
  if (!db) return;

  db
    .channel('rsvp-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rsvp' },
      (payload) => {
        console.log('🔄 Realtime update:', payload);

        if (payload.eventType === 'INSERT') {
          currentRsvpData.unshift(payload.new);
          renderRsvpList(currentRsvpData);
        } else if (payload.eventType === 'DELETE') {
          currentRsvpData = currentRsvpData.filter(d => d.id !== payload.old.id);
          renderRsvpList(currentRsvpData);
        } else if (payload.eventType === 'UPDATE') {
          currentRsvpData = currentRsvpData.map(d =>
            d.id === payload.new.id ? payload.new : d
          );
          renderRsvpList(currentRsvpData);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime aktif');
      }
    });
}

window.addEventListener('load', () => {
  setTimeout(setupRealtime, 800);
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ===== Lightbox Galeri ===== */
document.querySelectorAll('.gallery-item img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.92);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; cursor: zoom-out; padding: 20px;
      animation: fadeIn 0.3s ease;
    `;

    const bigImg = document.createElement('img');
    bigImg.src = img.src;
    bigImg.style.cssText = `
      max-width: 90%; max-height: 90%; border-radius: 12px;
      box-shadow: 0 0 50px rgba(212,175,55,0.7);
      border: 2px solid #d4af37;
    `;

    overlay.appendChild(bigImg);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.remove());
  });
});

/* ============================================
   HITUNGAN MUNDUR
   ============================================ */
const WEDDING_DATE = new Date('2026-12-14T08:00:00+07:00').getTime();

function updateCountdown() {
  const now = Date.now();
  const diff = WEDDING_DATE - now;

  const elDays = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMins = document.getElementById('cd-mins');
  const elSecs = document.getElementById('cd-secs');

  if (!elDays) return;

  if (diff <= 0) {
    elDays.textContent = '00';
    elHours.textContent = '00';
    elMins.textContent = '00';
    elSecs.textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  elDays.textContent = String(days).padStart(2, '0');
  elHours.textContent = String(hours).padStart(2, '0');
  elMins.textContent = String(mins).padStart(2, '0');
  elSecs.textContent = String(secs).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);