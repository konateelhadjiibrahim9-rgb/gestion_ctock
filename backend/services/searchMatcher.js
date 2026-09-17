const BRAND_NAMES = ['hp', 'dell', 'lenovo', 'asus', 'acer', 'apple', 'msi', 'toshiba', ' fujitsu '];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseCapacity(value) {
  if (!value) return null;
  const number = Number.parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(number)) return null;
  const unit = String(value).toLowerCase().includes('tb') ? 'tb' : 'gb';
  return unit === 'tb' ? number * 1024 : number;
}

function extractSpecs(text = '') {
  const normalized = normalize(text);
  const specs = {
    brand: null,
    model: null,
    processor: null,
    processorGeneration: null,
    ram: null,
    storage: null,
    storageType: null,
    screen: null,
    price: null
  };

  const brandMatch = normalized.match(/\b(hp|dell|lenovo|asus|acer|apple|msi|toshiba|fujitsu)\b/);
  specs.brand = brandMatch ? brandMatch[1] : null;

  const processorMatch = normalized.match(/\b(i[3-9])\s*(?:-|\/)?\s*(\d{4,5})?\b|\b(ryzen\s*[3-9])\s*(\d{4,5})?\b/);
  if (processorMatch) {
    specs.processor = normalize(processorMatch[1] || processorMatch[3]);
    specs.processorGeneration = processorMatch[2] || processorMatch[4] || null;
  }

  const ramMatch = normalized.match(/\b(\d{1,3})\s*(?:gb|go)\s*(?:ram|ddr|memory|memoire)?\b|\bram\s*[:=]?\s*(\d{1,3})\s*(?:gb|go)?\b/);
  specs.ram = parseCapacity(ramMatch && (ramMatch[1] || ramMatch[2]));

  const storageMatch = normalized.match(/\b(ssd|hdd|nvme|emmc)?\s*(\d{2,4})\s*(gb|go|tb|to)\b|\b(\d{2,4})\s*(gb|go|tb|to)\s*(ssd|hdd|nvme|emmc)\b/);
  if (storageMatch) {
    specs.storageType = normalize(storageMatch[1] || storageMatch[6]);
    specs.storage = parseCapacity(`${storageMatch[2] || storageMatch[4]}${storageMatch[3] || storageMatch[5]}`);
  }

  const screenMatch = normalized.match(/\b(\d{1,2}(?:\.\d)?)\s*(?:pouces|inch|\")\b|\b(?:ecran|screen)\s*[:=]?\s*(\d{1,2}(?:\.\d)?)/);
  specs.screen = screenMatch ? Number.parseFloat(screenMatch[1] || screenMatch[2]) : null;

  const priceMatch = normalized.match(/(?:prix|price|promo)\D{0,12}(\d[\d .]*)\s*(?:fcfa|fr|xof)?\b/);
  specs.price = priceMatch ? Number.parseFloat(priceMatch[1].replace(/[ .]/g, '')) : null;

  const modelWords = normalized.match(/\b(latitude|elitebook|probook|thinkpad|ideapad|vivobook|aspire|macbook|pavilion|precision|inspiron|xps|chromebook)\b(?:\s+(?:[a-z]*\d[a-z0-9-]*|\d[a-z0-9-]*))?/);
  specs.model = modelWords ? modelWords[0].trim() : null;

  return specs;
}

function splitQueries(text = '') {
  const lines = String(text)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  const queries = [];
  let current = [];

  for (const line of lines) {
    current.push(line);
    if (/\b(prix|promo|price)\b/i.test(line) || /\b\d{2,3}[ .]\d{3}\s*(?:f|fr|fcfa|xof)?\b/i.test(line)) {
      queries.push(current.join('\n'));
      current = [];
    }
  }

  if (current.length > 0) queries.push(current.join('\n'));
  return queries.length > 0 ? queries : [String(text).trim()];
}

function scoreProduct(querySpecs, product) {
  const productText = `${product.nom || ''} ${product.description || ''}`;
  const productSpecs = extractSpecs(productText);
  const fields = ['brand', 'model', 'processor', 'ram', 'storage', 'screen'];
  const available = fields.filter(field => querySpecs[field] !== null);
  if (available.length === 0) return { score: 0, productSpecs };

  let score = 0;
  let matched = 0;
  for (const field of available) {
    const queryValue = querySpecs[field];
    const productValue = productSpecs[field];
    if (field === 'screen' && queryValue && productValue && Math.abs(queryValue - productValue) <= 0.4) {
      score += 1;
      matched++;
    } else if (field === 'ram' || field === 'storage') {
      if (queryValue && productValue && queryValue === productValue) {
        score += 1;
        matched++;
      }
    } else if (queryValue && productValue && normalize(queryValue) === normalize(productValue)) {
      score += 1;
      matched++;
    }
  }

  let percentage = Math.round((score / available.length) * 100);
  const exact = available.length >= 3 && matched === available.length;
  if (!exact && matched > 0 && querySpecs.processor && productSpecs.processor) percentage = Math.max(70, Math.min(90, percentage));
  if (!exact && percentage === 100) percentage = 90;
  return { score: exact ? 100 : percentage, productSpecs };
}

function productKey(product) {
  return normalize(product.nom || product.code_produit);
}

function uniqueByProduct(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = productKey(item.product);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchProducts(text, products) {
  return splitQueries(text).map(query => {
    const querySpecs = extractSpecs(query);
    const ranked = products
      .map(product => ({ product, ...scoreProduct(querySpecs, product) }))
      .filter(item => item.score >= 35)
      .sort((a, b) => b.score - a.score || Number(a.product.prix_vente || 0) - Number(b.product.prix_vente || 0));

    const exactItem = ranked.find(item => item.score === 100);
    const alternatives = uniqueByProduct(ranked
      .filter(item => !exactItem || productKey(item.product) !== productKey(exactItem.product)))
      .slice(0, 3)
      .map(item => ({ ...item.product, score: item.score }));

    return {
      query,
      specs: querySpecs,
      match: exactItem ? { ...exactItem.product, score: exactItem.score } : null,
      alternatives
    };
  });
}

module.exports = { extractSpecs, matchProducts };
