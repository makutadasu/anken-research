/**
 * CSV / エクスポート モジュール
 */

/**
 * Convert listings to CSV string
 * @param {Array} listings
 * @returns {string}
 */
export function listingsToCSV(listings) {
    const headers = ['媒体', '案件名', '条件', '締切', 'URL', '投稿日'];
    const rows = listings.map(l => [
        getSourceName(l.source),
        escapeCSV(l.title),
        escapeCSV(l.conditions),
        escapeCSV(l.deadline || ''),
        l.url,
        l.date || '',
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
    ].join('\n');

    // Add BOM for Excel compatibility with Japanese characters
    return '\uFEFF' + csvContent;
}

/**
 * Download CSV file
 * @param {Array} listings
 */
export function downloadCSV(listings) {
    if (!listings.length) {
        return false;
    }

    const csv = listingsToCSV(listings);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const filename = `案件リスト_${today}.csv`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
}

function getSourceName(source) {
    const map = {
        cinepu: 'シネマプランナーズ',
        x: 'X (Twitter)',
        tiktok: 'TikTok',
    };
    return map[source] || source;
}

function escapeCSV(str) {
    if (!str) return '""';
    // If contains comma, newline, or quote, wrap in quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
