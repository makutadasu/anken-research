/**
 * X / TikTok 検索URL生成モジュール
 */

/**
 * Generate X (Twitter) search URL
 * @param {string[]} keywords - search keywords
 * @returns {string} X search URL
 */
export function generateXSearchUrl(keywords = ['オーディション', '出演者募集']) {
    const query = keywords.join(' OR ');
    // f=live で最新順
    return `https://x.com/search?q=${encodeURIComponent(query)}&f=live`;
}

/**
 * Generate TikTok search URL
 * @param {string[]} keywords - search keywords
 * @returns {string} TikTok search URL
 */
export function generateTikTokSearchUrl(keywords = ['オーディション', '出演者募集']) {
    // TikTok search uses single query
    const query = keywords.join(' ');
    return `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Get all external search links
 * @param {string[]} keywords 
 * @returns {{ x: string, tiktok: string }}
 */
export function getSearchLinks(keywords) {
    return {
        x: generateXSearchUrl(keywords),
        tiktok: generateTikTokSearchUrl(keywords),
    };
}
