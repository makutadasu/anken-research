/**
 * シネマプランナーズ (cinepu.com) スクレイピングモジュール
 */

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const BASE_URL = 'https://cinepu.com/cast/';

// Age path mapping
const AGE_PATHS = {
  age10: 'age10/',
  age20: 'age20/',
  age30: 'age30/',
  age40: 'age40/',
  age50: 'age50/',
  age60: 'age60/',
};

// Region path mapping
const REGION_PATHS = {
  'JP-13': 'JP-13/',
  'JP-14': 'JP-14/',
  'JP-11': 'JP-11/',
  'JP-12': 'JP-12/',
  'JP-27': 'JP-27/',
  all: '',
};

/**
 * Fetch and parse listings from cinepu.com
 * @param {Object} options - { ages: string[], regions: string[] }
 * @param {Function} onProgress - callback with progress message
 * @returns {Promise<Array>}
 */
export async function fetchCinepuListings(options = {}, onProgress = () => { }) {
  const { ages = ['age10', 'age20', 'age30'], regions = ['JP-13'] } = options;
  const allListings = [];
  const seen = new Set();

  // Generate URLs to fetch
  const urls = [];

  // Age-based URLs
  for (const age of ages) {
    const path = AGE_PATHS[age];
    if (path !== undefined) {
      urls.push({ url: `${BASE_URL}${path}`, label: `${age.replace('age', '')}代`, type: 'age', value: age });
    }
  }

  // Region-based URLs
  for (const region of regions) {
    if (region === 'all') {
      urls.push({ url: BASE_URL, label: '全国', type: 'region', value: 'all' });
    } else {
      const path = REGION_PATHS[region];
      if (path) {
        const regionName = getRegionName(region);
        urls.push({ url: `${BASE_URL}${path}`, label: regionName, type: 'region', value: region });
      }
    }
  }

  // Fetch each URL
  for (let i = 0; i < urls.length; i++) {
    const { url, label, type, value } = urls[i];
    onProgress(`シネマプランナーズ：${label}の案件を取得中 (${i + 1}/${urls.length})`);

    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        console.warn(`Failed to fetch ${url}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const listings = parseListings(html, type, value);

      for (const listing of listings) {
        if (!seen.has(listing.url)) {
          seen.add(listing.url);
          allListings.push(listing);
        }
      }
    } catch (err) {
      console.warn(`Error fetching ${url}:`, err);
    }

    // Small delay to be polite
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return allListings;
}

/**
 * Parse HTML to extract listing data
 */
function parseListings(html, filterType, filterValue) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const listings = [];

  // Find listing links - cinepu.com uses anchor tags with structured content
  const links = doc.querySelectorAll('a[href*="/cast/"]');

  for (const link of links) {
    const href = link.getAttribute('href');

    // Skip navigation/category links
    if (!href || href === '/cast/' || href.length < 15) continue;

    // Must be a specific listing URL (contains an ID-like path)
    const fullUrl = href.startsWith('http') ? href : `https://cinepu.com${href}`;
    if (!fullUrl.match(/\/cast\/[a-zA-Z0-9_-]{3,}\/?$/)) continue;

    const text = link.textContent || '';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    if (lines.length < 2) continue;

    // Extract info
    const isPaid = text.includes('報酬あり');
    const title = extractTitle(lines);
    const date = extractDate(text);
    const categories = extractCategories(text);
    const regions = extractRegions(text);

    if (!title) continue;

    listings.push({
      source: 'cinepu',
      title: title,
      url: fullUrl,
      date: date,
      isPaid: isPaid,
      categories: categories,
      regions: regions,
      conditions: buildConditions(isPaid, categories, regions),
      deadline: '',
      ageFilter: filterType === 'age' ? filterValue : '',
      regionFilter: filterType === 'region' ? filterValue : '',
    });
  }

  return listings;
}

function extractTitle(lines) {
  // Skip badge-like lines and find the actual title
  for (const line of lines) {
    if (line.startsWith('[') || line.startsWith('投稿日') || line === '報酬あり') continue;
    if (line.length > 5 && line.length < 200) return line;
  }
  return lines.find(l => l.length > 5) || '';
}

function extractDate(text) {
  const match = text.match(/投稿日[：:]?\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function extractCategories(text) {
  const cats = [];
  if (text.includes('[映画]')) cats.push('映画');
  if (text.includes('[演劇]')) cats.push('演劇');
  if (text.includes('[キャスト') || text.includes('役者募集')) cats.push('オーディション');
  if (text.includes('[エキストラ]')) cats.push('エキストラ');
  return cats;
}

function extractRegions(text) {
  const regionNames = ['東京', '神奈川', '埼玉', '千葉', '大阪', '全国', '北海道', '愛知', '福岡'];
  return regionNames.filter(r => text.includes(r));
}

function buildConditions(isPaid, categories, regions) {
  const parts = [];
  if (isPaid) parts.push('報酬あり');
  if (categories.length) parts.push(categories.join('・'));
  if (regions.length) parts.push(regions.join('・'));
  return parts.join(' / ');
}

function getRegionName(code) {
  const map = {
    'JP-13': '東京',
    'JP-14': '神奈川',
    'JP-11': '埼玉',
    'JP-12': '千葉',
    'JP-27': '大阪',
  };
  return map[code] || code;
}
