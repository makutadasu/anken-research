/**
 * 案件リサーチ - メインエントリーポイント
 */
import { fetchCinepuListings } from './js/scraper.js';
import { getSearchLinks } from './js/search.js';
import { getListings, saveListings, clearListings, getMeta, formatLastUpdate } from './js/storage.js';
import { downloadCSV } from './js/export.js';
import { renderResults, showToast } from './js/ui.js';

// ============================================
// DOM Elements
// ============================================
const els = {
    totalCount: document.getElementById('totalCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    keywordTags: document.getElementById('keywordTags'),
    keywordInput: document.getElementById('keywordInput'),
    ageFilter: document.getElementById('ageFilter'),
    regionFilter: document.getElementById('regionFilter'),
    sourceFilter: document.getElementById('sourceFilter'),
    toggleFilters: document.getElementById('toggleFilters'),
    filtersBody: document.getElementById('filtersBody'),
    btnSearch: document.getElementById('btnSearch'),
    btnExportCSV: document.getElementById('btnExportCSV'),
    loadingState: document.getElementById('loadingState'),
    loadingDetail: document.getElementById('loadingDetail'),
    externalLinks: document.getElementById('externalLinks'),
    xSearchLink: document.getElementById('xSearchLink'),
    tiktokSearchLink: document.getElementById('tiktokSearchLink'),
    emptyState: document.getElementById('emptyState'),
    resultsHeader: document.getElementById('resultsHeader'),
    resultsGrid: document.getElementById('resultsGrid'),
    resultCount: document.getElementById('resultCount'),
    btnClearResults: document.getElementById('btnClearResults'),
};

// ============================================
// State
// ============================================
let state = {
    keywords: ['オーディション', '出演者募集'],
    activeAges: ['age10', 'age20', 'age30'],
    activeRegions: ['JP-13'],
    activeSources: ['cinepu', 'x', 'tiktok'],
    isSearching: false,
};

// ============================================
// Initialization
// ============================================
function init() {
    // Load existing data
    updateHeaderStats();
    loadExistingResults();

    // Set up event listeners
    setupFilterToggles();
    setupKeywordInput();
    setupChipToggles();
    setupActionButtons();
}

function updateHeaderStats() {
    const meta = getMeta();
    els.totalCount.textContent = meta.totalCount;
    els.lastUpdate.textContent = formatLastUpdate(meta.lastUpdate);
}

function loadExistingResults() {
    const listings = getListings();
    if (listings.length > 0) {
        showResults(listings);
    }
}

// ============================================
// Filter Controls
// ============================================
function setupFilterToggles() {
    els.toggleFilters.addEventListener('click', () => {
        els.filtersBody.classList.toggle('collapsed');
        const icon = els.toggleFilters.querySelector('svg');
        if (els.filtersBody.classList.contains('collapsed')) {
            icon.style.transform = 'rotate(-90deg)';
        } else {
            icon.style.transform = '';
        }
    });
}

function setupKeywordInput() {
    // Click to remove tags
    els.keywordTags.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag[data-keyword]');
        if (!tag) return;

        const keyword = tag.dataset.keyword;
        state.keywords = state.keywords.filter(k => k !== keyword);
        tag.remove();
    });

    // Add new keyword on Enter
    els.keywordInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const val = els.keywordInput.value.trim();
        if (!val || state.keywords.includes(val)) return;

        state.keywords.push(val);

        const newTag = document.createElement('span');
        newTag.className = 'tag tag-active';
        newTag.dataset.keyword = val;
        newTag.textContent = `${val} ✕`;
        els.keywordTags.insertBefore(newTag, els.keywordInput.parentElement);

        els.keywordInput.value = '';
    });
}

function setupChipToggles() {
    // Age chips
    els.ageFilter.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        chip.classList.toggle('chip-active');
        state.activeAges = getActiveValues(els.ageFilter, 'age');
    });

    // Region chips
    els.regionFilter.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        chip.classList.toggle('chip-active');
        state.activeRegions = getActiveValues(els.regionFilter, 'region');
    });

    // Source chips
    els.sourceFilter.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        chip.classList.toggle('chip-active');
        state.activeSources = getActiveValues(els.sourceFilter, 'source');
    });
}

function getActiveValues(container, dataAttr) {
    return [...container.querySelectorAll('.chip-active')]
        .map(c => c.dataset[dataAttr])
        .filter(Boolean);
}

// ============================================
// Actions
// ============================================
function setupActionButtons() {
    // Search button
    els.btnSearch.addEventListener('click', handleSearch);

    // CSV export
    els.btnExportCSV.addEventListener('click', () => {
        const listings = getListings();
        if (!listings.length) {
            showToast('エクスポートする案件がありません', 'error');
            return;
        }
        const success = downloadCSV(listings);
        if (success) {
            showToast(`${listings.length}件をCSV出力しました`);
        }
    });

    // Clear results
    els.btnClearResults.addEventListener('click', () => {
        clearListings();
        els.resultsGrid.innerHTML = '';
        els.resultsHeader.style.display = 'none';
        els.emptyState.style.display = '';
        els.externalLinks.style.display = 'none';
        updateHeaderStats();
        showToast('結果をクリアしました');
    });
}

async function handleSearch() {
    if (state.isSearching) return;
    state.isSearching = true;

    // Disable button
    els.btnSearch.disabled = true;

    // Show loading
    els.loadingState.style.display = '';
    els.emptyState.style.display = 'none';

    const allNewListings = [];

    try {
        // 1. Fetch from cinepu.com if selected
        if (state.activeSources.includes('cinepu')) {
            const cinepuResults = await fetchCinepuListings(
                {
                    ages: state.activeAges,
                    regions: state.activeRegions,
                },
                (msg) => {
                    els.loadingDetail.textContent = msg;
                }
            );
            allNewListings.push(...cinepuResults);
        }

        // 2. Generate external search links
        const links = getSearchLinks(state.keywords);

        if (state.activeSources.includes('x')) {
            els.xSearchLink.href = links.x;
        }
        if (state.activeSources.includes('tiktok')) {
            els.tiktokSearchLink.href = links.tiktok;
        }

        // Show external links section
        if (state.activeSources.includes('x') || state.activeSources.includes('tiktok')) {
            els.externalLinks.style.display = '';
        }

        // 3. Save results
        if (allNewListings.length > 0) {
            const { listings, addedCount } = saveListings(allNewListings);
            showResults(listings);
            updateHeaderStats();

            if (addedCount > 0) {
                showToast(`${addedCount}件の新しい案件を発見しました`);
            } else {
                showToast('新しい案件はありませんでした');
            }
        } else if (!state.activeSources.includes('cinepu')) {
            // If only external sources, show existing + toast
            const existing = getListings();
            if (existing.length) {
                showResults(existing);
            }
            showToast('X・TikTokの検索リンクを生成しました');
        } else {
            showToast('案件が見つかりませんでした', 'error');
        }
    } catch (err) {
        console.error('Search error:', err);
        showToast('検索中にエラーが発生しました', 'error');
    } finally {
        // Hide loading
        els.loadingState.style.display = 'none';
        els.btnSearch.disabled = false;
        state.isSearching = false;
    }
}

function showResults(listings) {
    els.emptyState.style.display = 'none';
    els.resultsHeader.style.display = '';
    els.resultCount.textContent = `${listings.length}件`;
    renderResults(listings, els.resultsGrid);
}

// ============================================
// Boot
// ============================================
document.addEventListener('DOMContentLoaded', init);
