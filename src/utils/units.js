// Unit conversion utilities// src/utils/units.js
// Canonical unit conversion helpers for volume/mass + pricing helpers.


export const VOL_TO_ML = { L: 1000, ml: 1, oz: 29.5735, gal: 3785.41 };
export const MASS_TO_G = { lb: 453.592, g: 1 };


function isVol(unit) { return Object.prototype.hasOwnProperty.call(VOL_TO_ML, unit); }
function isMass(unit) { return Object.prototype.hasOwnProperty.call(MASS_TO_G, unit); }


export function toCanonical(amount, unit) {
if (amount == null || isNaN(amount)) return 0;
if (isVol(unit)) return amount * VOL_TO_ML[unit];
if (isMass(unit)) return amount * MASS_TO_G[unit];
// 'each' or unknown: treat as count
return amount;
}


export function sameFamily(u1, u2) {
if (u1 === 'each' && u2 === 'each') return true;
if (isVol(u1) && isVol(u2)) return true;
if (isMass(u1) && isMass(u2)) return true;
return false;
}


export function servingsPerPurchase(purchase, serving) {
if (!purchase || !serving) return 0;
const { size: pSize = 0, packQty = 1, baseUnit: pUnit = 'each' } = purchase;
const { size: sSize = 0, baseUnit: sUnit = pUnit, yieldLossPct = 0 } = serving;


if (!sameFamily(pUnit, sUnit)) return 0;
const totalPurchase = toCanonical(pSize, pUnit) * (packQty || 1);
const singleServing = toCanonical(sSize, sUnit);
if (singleServing <= 0) return 0;


const raw = totalPurchase / singleServing;
const loss = Math.min(Math.max(yieldLossPct, 0), 100) / 100; // clamp 0–100
return Math.max(0, raw * (1 - loss));
}


export function costPerServing(costPerPurchase, servings) {
const cost = parseFloat(costPerPurchase) || 0;
return servings > 0 ? cost / servings : 0;
}


export function suggestedPrice(costServing, targetMarginPct = 0) {
const cost = parseFloat(costServing) || 0;
const m = (parseFloat(targetMarginPct) || 0) / 100;
if (m <= 0 || m >= 1) return undefined;
return +(cost / (1 - m)).toFixed(2);
}