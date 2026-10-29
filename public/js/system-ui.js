/**
 * ARISE — System UI Utilities
 * Notifications, Holographic Modals, Typewriter effects
 */

// Toast container singleton
function getOrCreateToastContainer() {
  let container = document.getElementById('system-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'system-toast-container';
    container.className = 'system-toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Display a [SYSTEM] style notification toast
 * @param {string} title - e.g. "[SYSTEM NOTICE]"
 * @param {string} message - description text
 * @param {'info'|'success'|'error'|'gold'} type 
 * @param {number} durationMs - auto-dismiss ms (default 4000)
 */
function showSystemToast(title, message, type = 'info', durationMs = 4000) {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  
  let typeClass = '';
  let badgeColor = 'text-primary-container';
  let dotColor = 'bg-primary-container shadow-[0_0_8px_#00d4ff]';

  if (type === 'error') {
    typeClass = 'toast-error';
    badgeColor = 'text-error';
    dotColor = 'bg-error shadow-[0_0_8px_#ff5577]';
  } else if (type === 'gold' || type === 'success') {
    typeClass = 'toast-gold';
    badgeColor = 'text-tertiary-fixed';
    dotColor = 'bg-tertiary shadow-[0_0_8px_#ffd5d8]';
  }

  toast.className = `system-toast ${typeClass} flex flex-col gap-1 select-none`;
  toast.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse"></span>
        <span class="font-label-xs text-label-xs ${badgeColor} font-bold tracking-widest uppercase">${escapeHtml(title)}</span>
      </div>
      <button class="text-outline hover:text-on-surface text-xs" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
    <div class="font-body-sm text-xs text-on-surface leading-snug pl-3">
      ${escapeHtml(message)}
    </div>
  `;

  container.appendChild(toast);

  if (durationMs > 0) {
    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.25s ease-out forwards';
      setTimeout(() => toast.remove(), 250);
    }, durationMs);
  }
}

/**
 * Display a holographic [SYSTEM] modal dialog
 * @param {Object} options
 * @param {string} options.title - e.g. "LEVEL UP!"
 * @param {string} [options.subtitle] - e.g. "You have surpassed your limits."
 * @param {string} [options.message]
 * @param {string[]} [options.rewards] - list of reward strings
 * @param {string} [options.buttonText] - default "[ ACKNOWLEDGE ]"
 * @param {Function} [options.onConfirm]
 */
function showSystemModal({ title, subtitle = '', message = '', rewards = [], buttonText = '[ ACKNOWLEDGE ]', onConfirm }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'system-modal-backdrop select-none';

  let rewardsHtml = '';
  if (rewards && rewards.length > 0) {
    rewardsHtml = `
      <div class="p-2.5 rounded bg-surface-container-low/90 border border-primary/20 flex flex-col gap-1.5 mt-2">
        <span class="font-label-xs text-label-xs text-primary-fixed uppercase tracking-wider">[ REWARDS ACQUIRED ]</span>
        <div class="flex flex-col gap-1 text-xs text-on-surface">
          ${rewards.map(r => `<div class="flex items-center gap-1.5 text-primary-container"><span class="material-symbols-outlined text-xs">bolt</span><span>${escapeHtml(r)}</span></div>`).join('')}
        </div>
      </div>
    `;
  }

  backdrop.innerHTML = `
    <div class="system-modal-card">
      <div class="absolute -top-1.5 -left-1.5 font-label-xs text-primary-container text-xs select-none pointer-events-none drop-shadow-[0_0_6px_#00d4ff]">┌</div>
      <div class="absolute -top-1.5 -right-1.5 font-label-xs text-primary-container text-xs select-none pointer-events-none drop-shadow-[0_0_6px_#00d4ff]">┐</div>
      <div class="absolute -bottom-1.5 -left-1.5 font-label-xs text-primary-container text-xs select-none pointer-events-none drop-shadow-[0_0_6px_#00d4ff]">└</div>
      <div class="absolute -bottom-1.5 -right-1.5 font-label-xs text-primary-container text-xs select-none pointer-events-none drop-shadow-[0_0_6px_#00d4ff]">┘</div>

      <div class="flex flex-col items-center text-center gap-2">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary-container font-label-xs text-label-xs tracking-widest uppercase">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_6px_#00d4ff] animate-ping"></span>
          <span>[ SYSTEM NOTIFICATION ]</span>
        </div>

        <h2 class="font-headline-lg text-2xl font-black text-primary-container uppercase tracking-widest drop-shadow-[0_0_12px_rgba(0,212,255,0.7)]">
          ${escapeHtml(title)}
        </h2>

        ${subtitle ? `<p class="font-label-xs text-xs text-secondary tracking-wider">${escapeHtml(subtitle)}</p>` : ''}
        ${message ? `<p class="font-body-sm text-xs text-on-surface-variant leading-relaxed mt-1">${escapeHtml(message)}</p>` : ''}

        ${rewardsHtml}

        <button class="w-full mt-4 py-2.5 px-4 rounded bg-primary-container/20 hover:bg-primary-container/30 border border-primary-container text-primary-container hover:text-white font-title-md text-xs uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_14px_rgba(0,212,255,0.3)] cursor-pointer" id="modal-confirm-btn">
          ${escapeHtml(buttonText)}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);

  const confirmBtn = backdrop.querySelector('#modal-confirm-btn');
  confirmBtn.focus();
  confirmBtn.addEventListener('click', () => {
    backdrop.remove();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  });
}

/**
 * Typewriter effect for text container
 * @param {HTMLElement} element 
 * @param {string} text 
 * @param {number} speedMs 
 * @returns {Promise<void>}
 */
function typewriter(element, text, speedMs = 25) {
  return new Promise((resolve) => {
    if (!element) return resolve();
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        resolve();
      }
    }, speedMs);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

