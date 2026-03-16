/**
 * LocalStorage データ管理モジュール
 */

const STORAGE_KEY = 'anken_listings';
const META_KEY = 'anken_meta';

/**
 * Get all stored listings
 * @returns {Array}
 */
export function getListings() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Save listings to storage (merge with existing, avoiding duplicates)
 * @param {Array} newListings
 * @returns {Array} merged listings
 */
export function saveListings(newListings) {
    const existing = getListings();
    const existingUrls = new Set(existing.map(l => l.url));

    const merged = [...existing];
    let addedCount = 0;

    for (const listing of newListings) {
        if (!existingUrls.has(listing.url)) {
            merged.push(listing);
            existingUrls.add(listing.url);
            addedCount++;
        }
    }

    // Sort by date (newest first)
    merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    updateMeta();

    return { listings: merged, addedCount };
}

/**
 * Clear all stored listings
 */
export function clearListings() {
    localStorage.removeItem(STORAGE_KEY);
    updateMeta();
}

/**
 * Update metadata
 */
function updateMeta() {
    const meta = {
        lastUpdate: new Date().toISOString(),
        totalCount: getListings().length,
    };
    localStorage.setItem(META_KEY, JSON.stringify(meta));
}

/**
 * Get metadata
 * @returns {{ lastUpdate: string, totalCount: number }}
 */
export function getMeta() {
    try {
        const data = localStorage.getItem(META_KEY);
        return data ? JSON.parse(data) : { lastUpdate: null, totalCount: 0 };
    } catch {
        return { lastUpdate: null, totalCount: 0 };
    }
}

/**
 * Format date for display
 * @param {string} isoDate 
 * @returns {string}
 */
export function formatLastUpdate(isoDate) {
    if (!isoDate) return '未取得';
    const d = new Date(isoDate);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes} 更新`;
}
