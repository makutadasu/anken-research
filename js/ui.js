/**
 * UI コンポーネント管理モジュール
 */

/**
 * Render a single result card
 * @param {Object} listing
 * @param {number} index - for animation delay
 * @returns {string} HTML string
 */
export function renderResultCard(listing, index = 0) {
    const sourceClass = `badge-${listing.source}`;
    const sourceName = {
        cinepu: 'シネマプランナーズ',
        x: 'X',
        tiktok: 'TikTok',
    }[listing.source] || listing.source;

    const badges = [`<span class="badge ${sourceClass}">${sourceName}</span>`];

    if (listing.isPaid) {
        badges.push('<span class="badge badge-paid">💰 報酬あり</span>');
    }

    if (listing.categories) {
        listing.categories.forEach(cat => {
            if (cat !== 'キャスト募集') {
                badges.push(`<span class="badge badge-category">${cat}</span>`);
            }
        });
    }

    const metaItems = [];
    if (listing.regions && listing.regions.length) {
        metaItems.push(`<span class="meta-item">📍 ${listing.regions.join('・')}</span>`);
    }
    if (listing.ageFilter) {
        const ageLabel = listing.ageFilter.replace('age', '') + '代';
        metaItems.push(`<span class="meta-item">👤 ${ageLabel}</span>`);
    }
    if (listing.deadline) {
        metaItems.push(`<span class="meta-item">⏰ 〆 ${listing.deadline}</span>`);
    }

    const delay = Math.min(index * 50, 500);

    return `
    <article class="result-card" style="animation-delay: ${delay}ms;">
      <div class="card-top">
        <div class="card-badges">${badges.join('')}</div>
        <span class="card-date">${listing.date || ''}</span>
      </div>
      <h3 class="card-title">${escapeHtml(listing.title)}</h3>
      ${metaItems.length ? `<div class="card-meta">${metaItems.join('')}</div>` : ''}
      <div class="card-actions">
        <a href="${listing.url}" target="_blank" rel="noopener noreferrer" class="card-link">
          詳細を見る
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </article>
  `;
}

/**
 * Render all result cards into the grid
 * @param {Array} listings
 * @param {HTMLElement} container 
 */
export function renderResults(listings, container) {
    if (!listings.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = listings.map((l, i) => renderResultCard(l, i)).join('');
}

/**
 * Show toast notification
 * @param {string} message
 * @param {'success'|'error'} type
 */
export function showToast(message, type = 'success') {
    // Remove existing toasts
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.transition = 'all 300ms ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
