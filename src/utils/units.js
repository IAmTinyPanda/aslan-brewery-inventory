// src/utils/Units.js
// Canonical units: volume = ml, weight = g (US Customary for fluid measures)
// JSDoc included for strong editor hints.
// If you previously imported from "utils/units", switch to "utils/Units".

//////////////////////////
// CONSTANTS
//////////////////////////

export const ML_PER_L = 1000;
export const ML_PER_US_FL_OZ = 29.5735295625; // US fluid ounce
export const ML_PER_US_GAL = 3785.411784;     // US gallon

export const G_PER_KG = 1000;
export const G_PER_LB = 453.59237;
export const G_PER_OZ = 28.349523125;         // avoirdupois ounce (weight)

// Common keg/container volumes (in ml)
export const KEG_ML = Object.freeze({
  "1/2 BBL": 15.5 * ML_PER_US_GAL,            // ~58,673.882652 ml
  "1/4 BBL": 7.75 * ML_PER_US_GAL,            // ~29,336.941326 ml
  "1/6 BBL": (31 / 6) * ML_PER_US_GAL,        // ~19,557.960884 ml (Sixtel)
  "1/3 BBL": (31 / 3) * ML_PER_US_GAL,        // ~39,115.921768 ml
  "5 gal corny": 5 * ML_PER_US_GAL,           // ~18,927.05892 ml
  "50L": 50 * ML_PER_L,                       // 50,000 ml
  "30L": 30 * ML_PER_L,                       // 30,000 ml
  "20L": 20 * ML_PER_L,                       // 20,000 ml
  "10L": 10 * ML_PER_L,                       // 10,000 ml
});

// Aliases → KEG_ML keys
const KEG_ALIASES = Object.freeze({
  "1/2bbl": "1/2 BBL",
  "½bbl": "1/2 BBL",
  "half bbl": "1/2 BBL",
  "halfbarrel": "1/2 BBL",

  "1/4bbl": "1/4 BBL",
  "¼bbl": "1/4 BBL",
  "quarter bbl": "1/4 BBL",
  "quarterbarrel": "1/4 BBL",

  "1/6bbl": "1/6 BBL",
  "⅙bbl": "1/6 BBL",
  "sixtel": "1/6 BBL",
  "sixth bbl": "1/6 BBL",

  "1/3bbl": "1/3 BBL",
  "⅓bbl": "1/3 BBL",
  "third bbl": "1/3 BBL",

  "corny": "5 gal corny",
  "5gal corny": "5 gal corny",
  "corny 5 gal": "5 gal corny",

  "50 l": "50L",
  "30 l": "30L",
  "20 l": "20L",
  "10 l": "10L",
});

// Serving label synonyms (labels → ml)
const SERVING_SYNONYMS_ML = Object.freeze({
  "taster": 2 * ML_PER_US_FL_OZ,      // 2 oz
  "tasters": 2 * ML_PER_US_FL_OZ,
  "sampler": 2 * ML_PER_US_FL_OZ,
  "pint": 16 * ML_PER_US_FL_OZ,       // 16 oz
  "half liter": 0.5 * ML_PER_L,       // 0.5 L
  "half-litre": 0.5 * ML_PER_L,
  "stein 0.5l": 0.5 * ML_PER_L,
  "pitcher": 64 * ML_PER_US_FL_OZ,    // default pitcher
  "growler": 64 * ML_PER_US_FL_OZ,    // default growler
});

//////////////////////////
// INTERNAL HELPERS
//////////////////////////

const clampTiny = (n) => (Math.abs(n) < 1e-12 ? 0 : n);

const lowerNoSpaces = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");

const fractionToNumber = (s) => {
  // supports "1/2", "3/4" and unicode ½, ¼, ¾
  const map = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
  if (s in map) return map[s];
  if (s.includes("/")) {
    const [a, b] = s.split("/");
    const num = Number(a);
    const den = Number(b);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) return num / den;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

//////////////////////////
// VOLUME CONVERSIONS
//////////////////////////

/**
 * Convert a numeric volume to ml.
 * @param {number} value
 * @param {'ml'|'l'|'oz'|'gal'|'liter'|'litre'|'floz'} unit
 * @returns {number}
 */
export function toMl(value, unit) {
  if (!Number.isFinite(value)) return NaN;
  const u = String(unit || "").toLowerCase();
  switch (u) {
    case "ml": return value;
    case "l":
    case "lt":
    case "liter":
    case "litre": return value * ML_PER_L;
    case "oz":
    case "fl oz":
    case "floz": return value * ML_PER_US_FL_OZ;
    case "gal":
    case "gallon":
    case "us gal": return value * ML_PER_US_GAL;
    default: return NaN;
  }
}

/**
 * Convert ml to a target unit.
 * @param {number} ml
 * @param {'ml'|'l'|'oz'|'gal'|'liter'|'litre'|'floz'} unit
 * @returns {number}
 */
export function fromMl(ml, unit) {
  if (!Number.isFinite(ml)) return NaN;
  const u = String(unit || "").toLowerCase();
  switch (u) {
    case "ml": return ml;
    case "l":
    case "lt":
    case "liter":
    case "litre": return ml / ML_PER_L;
    case "oz":
    case "fl oz":
    case "floz": return ml / ML_PER_US_FL_OZ;
    case "gal":
    case "gallon":
    case "us gal": return ml / ML_PER_US_GAL;
    default: return NaN;
  }
}

/**
 * Generic volume conversion.
 * @param {number} value
 * @param {string} fromUnit
 * @param {string} toUnit
 */
export function convertVolume(value, fromUnit, toUnit) {
  return fromMl(toMl(value, fromUnit), toUnit);
}

/**
 * Format a volume given in ml to "12 oz", "0.50 L", etc.
 * @param {number} ml
 * @param {{unit?: 'ml'|'l'|'oz'|'gal', decimals?: number, stripZero?: boolean}} opts
 * @returns {string}
 */
export function formatVolume(ml, opts = {}) {
  const { unit = "oz", decimals = 2, stripZero = true } = opts;
  const v = fromMl(ml, unit);
  if (!Number.isFinite(v)) return "";
  const fixed = v.toFixed(decimals);
  const s = stripZero ? fixed.replace(/\.0+$/, "") : fixed;
  const suffix = unit === "oz" ? "oz" : unit === "l" ? "L" : unit === "ml" ? "ml" : "gal";
  return `${s} ${suffix}`;
}

/**
 * Parse a free-form volume string to { value, unit, ml }.
 * Supports:
 *  - Kegs: "1/2 BBL", "½ BBL", "50L", aliases like "sixtel", "corny"
 *  - Simple: "12oz", "0.5 L", "64 oz", "5 gal"
 *  - Case x Size: "24x16oz", "6 x 750ml"
 *  - Serving synonyms: "taster", "pint", "half liter"
 * @param {string} input
 * @returns {{ value:number, unit:string, ml:number }}
 */
export function parseVolume(input) {
  const raw = String(input || "").trim();
  if (!raw) return { value: NaN, unit: "", ml: NaN };

  // Direct KEG key
  const key = raw.toUpperCase();
  if (key in KEG_ML) return { value: 1, unit: key, ml: KEG_ML[key] };

  // Aliases → KEG key
  const alias = KEG_ALIASES[lowerNoSpaces(raw)];
  if (alias && alias in KEG_ML) return { value: 1, unit: alias, ml: KEG_ML[alias] };

  // Count x Size: "24x16oz" or "6 x 750 ml"
  const cx = raw.match(/^\s*(\d+)\s*[xX]\s*([\d¼½¾\/\.]+)\s*(ml|l|oz|gal)\s*$/i);
  if (cx) {
    const count = Number(cx[1]);
    const size = fractionToNumber(cx[2]);
    const unit = cx[3].toLowerCase();
    const eachMl = toMl(size, unit);
    if (Number.isFinite(count) && Number.isFinite(eachMl)) {
      return { value: count * size, unit: `${count}x${unit}`, ml: count * eachMl };
    }
  }

  // "<num><unit>" or "<num> <unit>"
  const m = raw.match(/^\s*([\d¼½¾\/\.]+)\s*(ml|l|oz|gal)\s*$/i);
  if (m) {
    const num = fractionToNumber(m[1]);
    const unit = m[2].toLowerCase();
    const ml = toMl(num, unit);
    return { value: num, unit, ml };
  }

  // Serving synonyms: taster, pint, half liter, etc.
  const norm = lowerNoSpaces(raw);
  if (norm in SERVING_SYNONYMS_ML) {
    return { value: 1, unit: norm, ml: SERVING_SYNONYMS_ML[norm] };
  }

  return { value: NaN, unit: "", ml: NaN };
}

/**
 * Coerce a serving label (e.g., "0.5L", "12oz", "taster") to ml.
 * @param {string} servingLabel
 * @returns {number} ml
 */
export function coerceServingLabelToMl(servingLabel) {
  const p = parseVolume(servingLabel);
  return p.ml;
}

//////////////////////////
// PURCHASE VOLUME HELPERS
//////////////////////////

/**
 * Compute total purchase ml from a purchase descriptor.
 * Supports:
 *  - String: "1/2 BBL", "50L", "24x16oz", "6 x 750ml", "5 gal", "corny"
 *  - Object:
 *      { type:'keg', size:'1/2 BBL' }
 *      { type:'case', count:12, size:'1L' }  OR { type:'case', count:24, value:16, unit:'oz' }
 *      { type:'volume', value:5, unit:'gal' }
 * @param {string|object} purchase
 * @returns {number} ml
 */
export function computePurchaseMl(purchase) {
  if (typeof purchase === "string") return parseVolume(purchase).ml;
  if (!purchase || typeof purchase !== "object") return NaN;

  if (purchase.type === "keg") {
    const size = String(purchase.size || "").trim();
    return parseVolume(size).ml;
  }

  if (purchase.type === "case") {
    const count = Number(purchase.count);
    if (!Number.isFinite(count) || count <= 0) return NaN;

    if (purchase.size) {
      const each = parseVolume(purchase.size).ml; // "750ml", "16oz", "1L"
      return Number.isFinite(each) ? count * each : NaN;
    }
    const value = Number(purchase.value);
    const unit = String(purchase.unit || "");
    const each = toMl(value, unit);
    return Number.isFinite(each) ? count * each : NaN;
  }

  if (purchase.type === "volume") {
    return toMl(Number(purchase.value), String(purchase.unit || ""));
  }

  return NaN;
}

/**
 * Exact (unrounded) servings per purchase.
 * @param {number} totalPurchaseMl
 * @param {number} servingMl
 * @returns {number}
 */
export function servingsPerPurchaseExact(totalPurchaseMl, servingMl) {
  if (!Number.isFinite(totalPurchaseMl) || !Number.isFinite(servingMl) || servingMl <= 0) return NaN;
  return clampTiny(totalPurchaseMl / servingMl);
}

/**
 * "Pourable" servings per purchase with spillage/foam % and rounding strategy.
 * @param {number} totalPurchaseMl
 * @param {number} servingMl
 * @param {{spillagePct?:number, round?:'floor'|'round'|'ceil'}} opts
 * @returns {number}
 */
export function servingsPerPurchasePourable(totalPurchaseMl, servingMl, opts = {}) {
  const { spillagePct = 0, round = "floor" } = opts;
  const effectiveMl = totalPurchaseMl * (1 - (spillagePct || 0));
  const exact = servingsPerPurchaseExact(effectiveMl, servingMl);
  if (!Number.isFinite(exact)) return NaN;
  if (round === "round") return Math.round(exact);
  if (round === "ceil") return Math.ceil(exact);
  return Math.floor(exact);
}

//////////////////////////
// WEIGHT CONVERSIONS
//////////////////////////

/**
 * Convert a numeric weight to grams.
 * @param {number} value
 * @param {'g'|'kg'|'lb'|'lbs'|'oz'} unit
 * @returns {number}
 */
export function toGrams(value, unit) {
  if (!Number.isFinite(value)) return NaN;
  const u = String(unit || "").toLowerCase();
  switch (u) {
    case "g": return value;
    case "kg": return value * G_PER_KG;
    case "lb":
    case "lbs": return value * G_PER_LB;
    case "oz": return value * G_PER_OZ;
    default: return NaN;
  }
}

/**
 * Convert grams to a target unit.
 * @param {number} grams
 * @param {'g'|'kg'|'lb'|'lbs'|'oz'} unit
 * @returns {number}
 */
export function fromGrams(grams, unit) {
  if (!Number.isFinite(grams)) return NaN;
  const u = String(unit || "").toLowerCase();
  switch (u) {
    case "g": return grams;
    case "kg": return grams / G_PER_KG;
    case "lb":
    case "lbs": return grams / G_PER_LB;
    case "oz": return grams / G_PER_OZ;
    default: return NaN;
  }
}

/**
 * Generic weight conversion.
 * @param {number} value
 * @param {string} fromUnit
 * @param {string} toUnit
 */
export function convertWeight(value, fromUnit, toUnit) {
  return fromGrams(toGrams(value, fromUnit), toUnit);
}

/**
 * Convert between mass and volume given a density (g/ml).
 * e.g., water ~1.0 g/ml, lime juice ~1.03 g/ml, syrups ~1.2 g/ml (varies)
 * @param {number} value
 * @param {'g'|'kg'|'lb'|'lbs'|'oz'|'ml'|'l'|'oz_fl'|'gal'} fromUnit
 * @param {'g'|'kg'|'lb'|'lbs'|'oz'|'ml'|'l'|'oz_fl'|'gal'} toUnit
 * @param {number} densityGPerMl
 * @returns {number}
 */
export function convertWithDensity(value, fromUnit, toUnit, densityGPerMl) {
  if (!Number.isFinite(value) || !Number.isFinite(densityGPerMl) || densityGPerMl <= 0) return NaN;

  const v = String(fromUnit || "").toLowerCase();
  const t = String(toUnit || "").toLowerCase();

  // normalize from → grams or ml
  let grams = NaN;
  let ml = NaN;

  if (v === "g" || v === "kg" || v === "lb" || v === "lbs" || v === "oz") {
    grams = toGrams(value, v);
    ml = grams / densityGPerMl;
  } else {
    const unit = v === "oz_fl" ? "oz" : v; // disambiguate fluid ounces
    ml = toMl(value, unit);
    grams = ml * densityGPerMl;
  }

  if (t === "g" || t === "kg" || t === "lb" || t === "lbs" || t === "oz") {
    return fromGrams(grams, t);
  } else {
    const unit = t === "oz_fl" ? "oz" : t;
    return fromMl(ml, unit);
  }
}

//////////////////////////
// LABEL NORMALIZATION
//////////////////////////

/**
 * Normalize serving labels to a canonical display and ml.
 * Examples:
 *  - "taster" -> { label: "2 oz", ml: 59.147 }
 *  - "0.5L"   -> { label: "16.91 oz", ml: 500 }
 *  - "12oz"   -> { label: "12 oz", ml: 354.882 }
 * @param {string} label
 * @param {{displayUnit?: 'ml'|'l'|'oz'|'gal', decimals?: number}} opts
 * @returns {{ label:string, ml:number }}
 */
export function normalizeServingLabel(label, { displayUnit = "oz", decimals = 2 } = {}) {
  const ml = coerceServingLabelToMl(label);
  if (!Number.isFinite(ml)) return { label: String(label || ""), ml: NaN };
  return { label: formatVolume(ml, { unit: displayUnit, decimals }), ml };
}
