/* ============================================
   TROPICALÍSIMA – Sensacional 107.7 FM
   Script Principal
   ============================================ */

/* ──────────────────────────────────────────
   MÓDULO 1: REPRODUCTOR / HORARIO VENEZUELA
   Zona horaria: UTC-4 (Venezuela)
   Programa: Sábados 4:00 PM – 6:00 PM
   ────────────────────────────────────────── */

/**
 * Devuelve la fecha/hora actual en hora de Venezuela (UTC-4).
 * Venezuela no tiene horario de verano, así que el offset es
 * siempre -4. Se calcula restando 4 horas al instante UTC actual
 * y se leen sus componentes con los métodos "getUTC*" — así el
 * resultado no depende de la zona horaria del dispositivo ni de
 * volver a parsear un texto (que en algunos navegadores fallaba
 * y dejaba el contador congelado en cero).
 */
function getVZTime() {
  return new Date(Date.now() - 4 * 60 * 60 * 1000);
}

/**
 * Determina si el programa está actualmente al aire
 * Sábado (day=6), entre 16:00 (960 min) y 18:00 (1080 min)
 */
function isOnAir() {
  const vz   = getVZTime();
  const day  = vz.getUTCDay();
  const mins = vz.getUTCHours() * 60 + vz.getUTCMinutes();
  return day === 6 && mins >= 960 && mins < 1080;
}

/**
 * Calcula la fecha del próximo sábado a las 4:00 PM (hora Venezuela)
 */
function getNextSat4PM() {
  const vz = getVZTime();
  let daysUntil = (6 - vz.getUTCDay() + 7) % 7;

  // Si ya es sábado pero el programa terminó, buscar el siguiente sábado
  if (daysUntil === 0) {
    const mins = vz.getUTCHours() * 60 + vz.getUTCMinutes();
    if (mins >= 1080) daysUntil = 7;
  }

  // Si es sábado antes del programa (daysUntil = 0 y aún no son las 4PM),
  // quedarse en el mismo sábado
  if (daysUntil === 0) {
    const mins = vz.getUTCHours() * 60 + vz.getUTCMinutes();
    if (mins < 960) daysUntil = 0;
  }

  const next = new Date(vz);
  next.setUTCDate(next.getUTCDate() + daysUntil);
  next.setUTCHours(16, 0, 0, 0);
  return next;
}

/**
 * Actualiza el contenido del reproductor fijo según el horario:
 * si está en vivo, muestra el reproductor de audio; si no, muestra
 * el mensaje de "fuera de aire" — ambos dentro del mismo widget fijo.
 */
function updatePlayer() {
  const floating = document.getElementById('floatingPlayerWidget');
  if (!floating) return;

  if (isOnAir()) {
    // ── EN VIVO ──────────────────────────────
    // Solo insertar el reproductor real si aún no existe en el DOM
    // (evita cortar el audio que ya está sonando en cada revisión)
    if (!document.getElementById('radioPlayer')) {
      floating.innerHTML = `
    <div class="custom-player">

      <div class="player-drag-handle" id="floatingDragHandle">
        <img src="img/logoinformativo-player.png" alt="Tropicalísima – Sensacional 107.7 FM" class="player-logo">
      </div>

      <div class="sound-waves" id="soundWaves">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>

      <div class="player-controls">
        <div class="volume-wrapper">
          🔈
          <input
            type="range"
            class="volume-slider"
            id="volumeSlider"
            min="0" max="1" step="0.05"
            value="0.8">
        </div>

        <button class="btn-play-pause" id="btnPlayPause">⏸</button>

        <div class="volume-wrapper" style="opacity:0; pointer-events:none; width:118px"></div>
      </div>

      <div class="stream-status" id="streamStatus">Cargando transmisión...</div>

      <audio id="radioPlayer" autoplay>
        <source src="https://stream.zeno.fm/z844v8tx398uv" type="audio/mpeg">
      </audio>

    </div>`;

      // Referencias
      const audio      = document.getElementById('radioPlayer');
      const btnPlay    = document.getElementById('btnPlayPause');
      const volSlider  = document.getElementById('volumeSlider');
      const waves      = document.getElementById('soundWaves');
      const status     = document.getElementById('streamStatus');

      // Volumen inicial
      audio.volume = 0.8;

      // Play / Pausa
      btnPlay.addEventListener('click', () => {
        if (audio.paused) {
          audio.play();
          btnPlay.textContent = '⏸';
          waves.classList.remove('paused');
        } else {
          audio.pause();
          btnPlay.textContent = '▶';
          waves.classList.add('paused');
        }
      });

      // Control de volumen
      volSlider.addEventListener('input', () => {
        audio.volume = volSlider.value;
      });

      // Estado del stream
      audio.addEventListener('playing', () => {
        status.textContent = '● Transmisión en vivo activa';
        status.style.color = '#4cff91';
        waves.classList.remove('paused');
      });

      audio.addEventListener('waiting', () => {
        status.textContent = '⏳ Conectando con el stream...';
        status.style.color = 'rgba(255,255,255,0.45)';
      });

      audio.addEventListener('error', () => {
        status.textContent = '⚠ Error al conectar. Reintentando...';
        status.style.color = '#ff6b6b';
        setTimeout(() => { audio.load(); audio.play(); }, 3000);
      });
    }

  } else {
    // ── FUERA DEL AIRE ───────────────────────
    // Solo insertar el mensaje si aún no está mostrado (evita
    // reconstruir el DOM en cada revisión de 30s sin necesidad)
    if (!floating.querySelector('.player-offline-fixed')) {
      floating.innerHTML = `
    <div class="custom-player custom-player--offline">

      <img src="img/logoinformativo-player.png" alt="Tropicalísima" class="player-logo player-logo-left">

      <div class="offline-center">
        <p class="player-offline-fixed">
          🎙️ El programa no está al aire en este momento.<br>
          <strong>Sintonízanos los sábados de 4:00 PM a 6:00 PM</strong>
        </p>

        <!-- Contador regresivo al próximo programa -->
        <div class="countdown-box" id="countdownBox">
          <div class="countdown-label">⏱ Próximo programa en</div>
          <div class="countdown-timer">
            <div class="countdown-unit">
              <span id="cdDays">00</span>
              <span>Días</span>
            </div>
            <div class="countdown-unit">
              <span id="cdHours">00</span>
              <span>Horas</span>
            </div>
            <div class="countdown-unit">
              <span id="cdMins">00</span>
              <span>Min</span>
            </div>
            <div class="countdown-unit">
              <span id="cdSecs">00</span>
              <span>Seg</span>
            </div>
          </div>
        </div>
      </div>

      <img src="img/logo-sensacional-nav.png" alt="Sensacional 107.7 FM" class="player-logo-right">

    </div>`;
    }
  }
}

/**
 * Actualiza el contador regresivo al próximo programa.
 * Cuando llega a cero, fuerza la actualización del reproductor
 * sin esperar el intervalo de 30 segundos.
 */
function updateCountdown() {
  // Si ya está en vivo, actualizar el reproductor y salir
  if (isOnAir()) {
    updatePlayer();
    return;
  }

  const diff = Math.max(0, getNextSat4PM() - getVZTime());

  // Cuando el contador llega a cero, forzar updatePlayer de inmediato
  if (diff === 0) {
    updatePlayer();
    return;
  }

  let remaining = diff;
  const days  = Math.floor(remaining / 86400000); remaining -= days  * 86400000;
  const hours = Math.floor(remaining / 3600000);  remaining -= hours * 3600000;
  const mins  = Math.floor(remaining / 60000);    remaining -= mins  * 60000;
  const secs  = Math.floor(remaining / 1000);

  const elDays  = document.getElementById('cdDays');
  const elHours = document.getElementById('cdHours');
  const elMins  = document.getElementById('cdMins');
  const elSecs  = document.getElementById('cdSecs');
  if (elDays)  elDays.textContent  = String(days).padStart(2, '0');
  if (elHours) elHours.textContent = String(hours).padStart(2, '0');
  if (elMins)  elMins.textContent  = String(mins).padStart(2, '0');
  if (elSecs)  elSecs.textContent  = String(secs).padStart(2, '0');
}

// Inicializar reproductor y contador
updatePlayer();
updateCountdown();
setInterval(updatePlayer,    30000); // Revisa el horario cada 30 segundos
setInterval(updateCountdown,  1000); // Actualiza el contador cada segundo


/* ──────────────────────────────────────────
   MÓDULO 1B: ARRASTRE DEL REPRODUCTOR FLOTANTE
   El widget vive fijo al final del <body>, por lo
   que nunca queda tapado por otras secciones al
   hacer scroll en el resto de la página.
   - Móvil y Tablet en vertical (≤768px): anclado al tope inferior (sin arrastre).
   - PC y Tablet en horizontal (>768px): panel arrastrable, tomándolo
     desde el nombre/frecuencia de la emisora.
   ────────────────────────────────────────── */
(function initFloatingPlayerDrag() {
  const widget = document.getElementById('floatingPlayerWidget');
  if (!widget) return;

  let isDragging = false;
  let startX, startY, startLeft, startTop;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function canDrag(target) {
    // El reproductor flotante ahora es estático (anclado al tope de la
    // página en PC/Tablet, igual que en móvil), por lo que el arrastre
    // queda deshabilitado en todos los tamaños de pantalla.
    return false;
  }

  function dragStart(clientX, clientY) {
    const rect = widget.getBoundingClientRect();
    isDragging = true;
    startX = clientX;
    startY = clientY;
    startLeft = rect.left;
    startTop  = rect.top;
    widget.classList.add('dragging');
  }

  function dragMove(clientX, clientY) {
    if (!isDragging) return;
    const rect = widget.getBoundingClientRect();
    const newLeft = clamp(startLeft + (clientX - startX), 10, window.innerWidth  - rect.width  - 10);
    const newTop  = clamp(startTop  + (clientY - startY), 10, window.innerHeight - rect.height - 10);
    widget.style.left = newLeft + 'px';
    widget.style.top  = newTop  + 'px';
  }

  function dragEnd() {
    isDragging = false;
    widget.classList.remove('dragging');
  }

  // Mouse
  widget.addEventListener('mousedown', (e) => {
    if (!canDrag(e.target)) return;
    e.preventDefault();
    dragStart(e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', (e) => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', dragEnd);

  // Touch (tablet)
  widget.addEventListener('touchstart', (e) => {
    if (!canDrag(e.target)) return;
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchend', dragEnd);

  // Si la ventana cambia de tamaño, mantener el widget dentro del área visible
  window.addEventListener('resize', () => {
    if (!widget.classList.contains('active') || window.innerWidth <= 768 || !widget.style.left) return;
    const rect = widget.getBoundingClientRect();
    widget.style.left = clamp(rect.left, 10, window.innerWidth  - rect.width  - 10) + 'px';
    widget.style.top  = clamp(rect.top,  10, window.innerHeight - rect.height - 10) + 'px';
  });
})();

/* ──────────────────────────────────────────
   MÓDULO 1C: BURBUJAS FLOTANTES (WhatsApp / TikTok)
   Arrastrables en PC, móvil y tablet. Misma lógica
   reutilizada para cada burbuja mediante su id.
   Las burbujas quedan fijas en la posición definida por el CSS
   (sin arrastre). Posición y tamaño se controlan en styles.css.
   ────────────────────────────────────────── */



/* ──────────────────────────────────────────
   MÓDULO 2: CARRUSEL DE ANUNCIANTES
   Avance automático cada 5 segundos
   ────────────────────────────────────────── */

(function initCarousel() {
  const slides  = document.querySelectorAll('.carousel-slide');
  const dotsEl  = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  let current   = 0;
  let autoTimer;

  // Crear puntos de navegación dinámicamente
  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  /**
   * Navega al slide indicado
   * @param {number} n - índice del slide destino
   */
  function goTo(n) {
    slides[current].classList.remove('active');
    dotsEl.children[current].classList.remove('active');

    current = (n + slides.length) % slides.length;

    slides[current].classList.add('active');
    dotsEl.children[current].classList.add('active');

    resetTimer();
  }

  /**
   * Reinicia el temporizador automático
   */
  function resetTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  // Eventos de botones (visibles solo en PC; ver CSS ≤768px)
  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  /**
   * Deslizamiento (swipe) — reemplaza a los botones en tablet y móvil.
   * Se detecta sobre el track del carrusel; el temporizador automático
   * y el avance cada 5s no se ven afectados.
   */
  const track = document.querySelector('.carousel-track');
  const SWIPE_THRESHOLD = 40; // px mínimos para considerar un swipe válido
  let touchStartX = 0;
  let touchStartY = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Solo actuar si el movimiento es predominantemente horizontal
    // (evita interferir con el scroll vertical de la página)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > SWIPE_THRESHOLD) {
      if (diffX > 0) {
        goTo(current + 1); // deslizó hacia la izquierda → siguiente anunciante
      } else {
        goTo(current - 1); // deslizó hacia la derecha → anunciante anterior
      }
    }
  }, { passive: true });

  // Iniciar avance automático
  resetTimer();
})();

/* ──────────────────────────────────────────
   MÓDULO 3: NAVBAR HAMBURGUESA
   (eliminado: la navbar ya no tiene menú de
   hamburguesa ni enlaces — ahora muestra el
   logo de Sensacional 107.7 FM del lado derecho)
   ────────────────────────────────────────── */