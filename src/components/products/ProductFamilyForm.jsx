// src/components/products/ProductFamilyForm.jsx — v5.2 (Stepper + Recipe Mode + Gen All SKUs)
// Drop-in replacement using the SAME filename/export.
// Key upgrades in v5.2:
// - Detailed/clean stepper UI
// - Recipe Mode: compute batch cost from ingredient Products (if available) or manual hints
// - In Recipe Mode, purchase format cost is derived from the recipe (per-L multiplied by output size)
// - One-click "Generate all SKUs" button (fills missing SKUs only)
// - ASCII-only to avoid parser issues

import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Plus, Trash2, Wand2, ChevronRight, ChevronLeft } from 'lucide-react';
import * as productSvc from '../../services/productService';
import { fohCategories } from '../../data/categories';
import { servingsPerPurchase, costPerServing } from '../../utils/units';

const UNIT_OPTS = ['each', 'ml', 'L', 'oz', 'gal', 'g', 'lb'];

const DEFAULT = {
  name: '',
  category: 'Beer',
  vendor: '',
  description: '',
  nameTemplate: '{family} - {variant} - {serving}',
  hasRecipe: false,
  recipe: { batchSize: 18.927, batchUnit: 'L', ingredients: [] }, // default 5 gal in liters
  variants: [],
};

// --- unit helpers ---
const OZ_TO_L = 0.0295735295625; // fluid ounce -> liter
const GAL_TO_L = 3.785411784;
const LB_TO_G = 453.59237;

function isVol(u){ return ['ml','L','oz','gal'].includes(u); }
function isMass(u){ return ['g','lb'].includes(u); }
function isEach(u){ return u === 'each'; }

function toLiters(v,u){
  if (u==='L') return v;
  if (u==='ml') return v/1000;
  if (u==='oz') return v*OZ_TO_L;
  if (u==='gal') return v*GAL_TO_L;
  return NaN;
}
function toGrams(v,u){
  if (u==='g') return v;
  if (u==='lb') return v*LB_TO_G;
  return NaN;
}

function sameKind(a,b){
  if (isVol(a) && isVol(b)) return 'vol';
  if (isMass(a) && isMass(b)) return 'mass';
  if (isEach(a) && isEach(b)) return 'each';
  return null;
}

// SKU helpers
function slug(s = '', max = 12) { return (s + '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max); }
function code(str = '', len = 3) { const clean = (str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase(); return clean.slice(0, len).padEnd(len, 'X'); }
function suggestSku({ vendor, category, family, variant, serving }){ const v = code(vendor,3), c=code(category,2), f=slug(family,8), s=slug(serving,6); return [v,c,f,s].filter(Boolean).join('-'); }
function replaceAllStr(s,find,rep){ return (s||'').split(find).join(rep); }
function applyTemplate(tpl,ctx){ let out=tpl||''; out=replaceAllStr(out,'{family}',ctx.family||''); out=replaceAllStr(out,'{variant}',ctx.variant||''); out=replaceAllStr(out,'{serving}',ctx.serving||''); return out.trim(); }

export default function ProductFamilyForm({ isOpen, onClose, seed, onCreated }){
  const [data, setData] = useState(DEFAULT);
  const [step, setStep] = useState(0);
  const [allProducts, setAllProducts] = useState([]); // for recipe linking

  useEffect(() => {
    if (!isOpen) return;
    const seeded = seed ? { ...DEFAULT, ...seed } : DEFAULT;
    setData(seeded);
    setStep(0);
    (async () => {
      // best-effort load for ingredient linking; safe if function not present
      try {
        if (typeof productSvc.fetchAll === 'function') {
          const rows = await productSvc.fetchAll();
          setAllProducts(Array.isArray(rows) ? rows : []);
        }
      } catch {}
    })();
  }, [isOpen, seed]);

  const setPath = (path, value) => {
    setData((prev) => {
      const next = { ...prev };
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...(cur[k] || {}) };
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const steps = ['Family', 'Formats', 'Servings', 'SKUs', 'Review'];
  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // --- recipe cost calculator ---
  const ingredientRows = data.recipe?.ingredients || [];

  function findProductByNameOrSku(txt){
    const t = (txt||'').trim().toLowerCase();
    if (!t) return null;
    return allProducts.find(p => (p.name||'').toLowerCase()===t || (p.sku||'').toLowerCase()===t) || null;
  }

  function costFromLinkedProduct(prod, qty, unit){
    if (!prod || !prod.purchaseUnit || !prod.costPerPurchase) return NaN;
    const pu = prod.purchaseUnit;
    // derive unit cost
    if (isVol(pu.baseUnit) && isVol(unit)){
      const sizeL = toLiters(pu.size, pu.baseUnit);
      const qtyL = toLiters(qty, unit);
      if (!isFinite(sizeL) || !isFinite(qtyL) || sizeL<=0) return NaN;
      const perL = prod.costPerPurchase / sizeL;
      return perL * qtyL;
    }
    if (isMass(pu.baseUnit) && isMass(unit)){
      const sizeG = toGrams(pu.size, pu.baseUnit);
      const qtyG = toGrams(qty, unit);
      if (!isFinite(sizeG) || !isFinite(qtyG) || sizeG<=0) return NaN;
      const perG = prod.costPerPurchase / sizeG;
      return perG * qtyG;
    }
    if (isEach(pu.baseUnit) && isEach(unit)){
      const pack = pu.packQty || 1;
      const perEach = prod.costPerPurchase / (pack * (pu.size || 1));
      return perEach * qty;
    }
    return NaN; // kind mismatch
  }

  const recipeCalc = useMemo(() => {
    let total = 0;
    const lines = ingredientRows.map((r) => {
      const linked = r.linkedName ? findProductByNameOrSku(r.linkedName) : null;
      const fromLinked = linked ? costFromLinkedProduct(linked, +r.quantity || 0, r.unit || 'L') : NaN;
      const lineCost = isFinite(fromLinked) ? fromLinked : (+r.costHint || 0);
      total += lineCost;
      return { ...r, linkedProduct: linked, lineCost: +lineCost.toFixed(4) };
    });
    const batchKind = isVol(data.recipe.batchUnit) ? 'vol' : isMass(data.recipe.batchUnit) ? 'mass' : isEach(data.recipe.batchUnit) ? 'each' : null;
    let perUnit = 0;
    if (batchKind === 'vol'){
      const sizeL = toLiters(data.recipe.batchSize || 0, data.recipe.batchUnit);
      perUnit = sizeL>0 ? total / sizeL : 0; // cost per liter
    } else if (batchKind === 'mass'){
      const sizeG = toGrams(data.recipe.batchSize || 0, data.recipe.batchUnit);
      perUnit = sizeG>0 ? total / sizeG : 0; // cost per gram
    } else if (batchKind === 'each'){
      const sizeE = data.recipe.batchSize || 1;
      perUnit = sizeE>0 ? total / sizeE : 0; // cost per each
    }
    return { lines, total: +total.toFixed(4), perUnit: +perUnit.toFixed(6), batchKind };
  }, [ingredientRows, allProducts, data.recipe.batchSize, data.recipe.batchUnit]);

  // --- Step 2: formats ---
  const addVariant = () => setData((d) => ({
    ...d,
    variants: [
      ...d.variants,
      { label: d.hasRecipe ? 'Batch Output' : '1/2 BBL', costPerPurchase: 0, purchaseUnit: { name: d.hasRecipe ? 'batch' : 'keg', size: d.hasRecipe ? (d.recipe.batchSize||18.927) : 58.67, baseUnit: d.hasRecipe ? (d.recipe.batchUnit||'L') : 'L', packQty: 1 }, servingOptions: [] },
    ],
  }));
  const removeVariant = (idx) => setData((d) => ({ ...d, variants: d.variants.filter((_, i) => i !== idx) }));

  // --- Step 3: servings ---
  const addServing = (vidx) => setData((d) => {
    const v = d.variants[vidx];
    const nextOpts = [ ...(v.servingOptions || []), { label: '', size: 0, baseUnit: v.purchaseUnit.baseUnit || 'L', yieldLossPct: 0, sku: '', posSku: '' } ];
    const variants = d.variants.map((x, i) => (i === vidx ? { ...v, servingOptions: nextOpts } : x));
    return { ...d, variants };
  });
  const removeServing = (vidx, sidx) => setData((d) => {
    const v = d.variants[vidx];
    const nextOpts = (v.servingOptions || []).filter((_, i) => i !== sidx);
    const variants = d.variants.map((x, i) => (i === vidx ? { ...v, servingOptions: nextOpts } : x));
    return { ...d, variants };
  });

  // one-click beer presets
  const beerPresets = (vidx) => setData((d) => {
    const v = d.variants[vidx];
    const pu = v.purchaseUnit || { size: 0, baseUnit: 'L' };
    const presets = [
      { label: '0.5L Pour', size: 0.5, baseUnit: 'L' },
      { label: '0.3L Pour', size: 0.3, baseUnit: 'L' },
      { label: '4oz', size: 4, baseUnit: 'oz' },
      { label: 'Taster (2oz)', size: 2, baseUnit: 'oz' },
      { label: 'Pitcher (64oz)', size: 64, baseUnit: 'oz' },
      { label: 'Growler 32oz', size: 32, baseUnit: 'oz' },
      { label: 'Growler 64oz', size: 64, baseUnit: 'oz' },
      { label: 'Whole Keg', size: pu.size || 0, baseUnit: pu.baseUnit || 'L' },
    ];
    const nextOpts = presets.map((p) => ({ ...p, yieldLossPct: 0, sku: '', posSku: '' }));
    const variants = d.variants.map((x, i) => (i === vidx ? { ...v, servingOptions: nextOpts } : x));
    return { ...d, variants };
  });

  // --- Step 4: SKU grid rows ---
  const skuRows = useMemo(() => {
    const rows = [];
    (data.variants || []).forEach((v, vidx) => {
      (v.servingOptions || []).forEach((s, sidx) => {
        rows.push({
          key: `${vidx}:${sidx}`,
          variant: v.label,
          serving: s.label || `${s.size} ${s.baseUnit}`,
          size: s.size,
          baseUnit: s.baseUnit,
          sku: s.sku || '',
          posSku: s.posSku || '',
          setSku: (val) => setData((d) => { const n = { ...d }; n.variants[vidx].servingOptions[sidx].sku = val; return n; }),
          setPosSku: (val) => setData((d) => { const n = { ...d }; n.variants[vidx].servingOptions[sidx].posSku = val; return n; }),
          setServing: (val) => setData((d) => { const n = { ...d }; n.variants[vidx].servingOptions[sidx].label = val; return n; }),
          suggest: () => suggestSku({ vendor: data.vendor, category: data.category, family: data.name, variant: v.label, serving: s.label || `${s.size} ${s.baseUnit}` }),
        });
      });
    });
    return rows;
  }, [data]);

  const genAllSkus = () => setData((d) => {
    const n = { ...d };
    (n.variants||[]).forEach((v) => {
      (v.servingOptions||[]).forEach((s) => {
        if (!s.sku || !s.sku.trim()){
          s.sku = suggestSku({ vendor: n.vendor, category: n.category, family: n.name, variant: v.label, serving: s.label || `${s.size} ${s.baseUnit}` });
        }
      });
    });
    return n;
  });

  // --- review stats ---
  const reviewStats = useMemo(() => {
    let totalProducts = 0;
    let maxCps = 0;
    (data.variants || []).forEach((v) => {
      const pu = v.purchaseUnit || {};
      (v.servingOptions || []).forEach((s) => {
        totalProducts += 1;
        const sp = Math.floor(servingsPerPurchase(pu, s));
        const cps = costPerServing((data.hasRecipe ? 0 : (v.costPerPurchase || 0)), sp); // display only; in recipe mode we show per-variant computed below
        maxCps = Math.max(maxCps, cps || 0);
      });
    });
    return { totalProducts, minCostPer: +maxCps.toFixed(4) };
  }, [data]);

  // --- materialize ---
  const materialize = async () => {
    const famId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());

    // Compute per-unit recipe cost if in recipe mode
    let recipePerVolUnit = 0; // cost per liter if volume; per gram if mass; per each if count
    if (data.hasRecipe && recipeCalc.batchKind){
      recipePerVolUnit = recipeCalc.perUnit; // name kept generic; we handle kind below
    }

    const created = [];
    for (const v of (data.variants || [])) {
      const pu = v.purchaseUnit || {};

      // Determine costPerPurchase for this variant
      let costPerPurchase = v.costPerPurchase || 0;
      if (data.hasRecipe && recipeCalc.batchKind){
        if (recipeCalc.batchKind === 'vol' && isVol(pu.baseUnit)){
          const sizeL = toLiters(pu.size||0, pu.baseUnit);
          costPerPurchase = isFinite(sizeL) ? recipePerVolUnit * sizeL : 0;
        } else if (recipeCalc.batchKind === 'mass' && isMass(pu.baseUnit)){
          const sizeG = toGrams(pu.size||0, pu.baseUnit);
          costPerPurchase = isFinite(sizeG) ? recipePerVolUnit * sizeG : 0;
        } else if (recipeCalc.batchKind === 'each' && isEach(pu.baseUnit)){
          const sizeE = pu.size || 1;
          costPerPurchase = recipePerVolUnit * sizeE;
        } else {
          // kind mismatch; fallback to entered number
          costPerPurchase = v.costPerPurchase || 0;
        }
      }

      for (const s of (v.servingOptions || [])) {
        const servingName = s.label || `${s.size} ${s.baseUnit}`;
        const servings = Math.floor(servingsPerPurchase(pu, s));
        const cps = costPerServing(costPerPurchase, servings);
        const name = applyTemplate(data.nameTemplate, { family: data.name, variant: v.label, serving: servingName });
        const payload = {
          name,
          sku: (s.sku || '').trim(),
          pos: s.posSku ? { system: 'TOAST', sku: (s.posSku || '').trim() } : undefined,
          category: data.category,
          subcategory: v.label,
          vendor: data.vendor,
          description: data.description,
          isActive: true,
          familyId: famId,
          familyName: data.name,
          purchaseUnit: { ...pu },
          servingUnit: { name: servingName, size: s.size, baseUnit: s.baseUnit, yieldLossPct: s.yieldLossPct || 0 },
          costPerPurchase,
          servingsPerPurchase: servings,
          costPerServing: +cps.toFixed(4),
          suggestedPrice: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (data.hasRecipe){
          payload.familyRecipe = {
            batchSize: data.recipe.batchSize,
            batchUnit: data.recipe.batchUnit,
            totalCost: recipeCalc.total,
            ingredients: ingredientRows.map((r) => ({ linkedName: r.linkedName || '', quantity: r.quantity || 0, unit: r.unit || 'L', costHint: r.costHint || 0 })),
          };
        }
        const row = await productSvc.create(payload);
        created.push(row);
      }
    }
    return created;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name.trim()) return alert('Family name is required');
    if (!data.category) return alert('Category is required');
    if (!data.variants.length) return alert('Add at least one purchase format');
    for (const v of data.variants) {
      if (!v.label || !v.label.trim()) return alert('Each format needs a label');
      if (!(v.purchaseUnit && v.purchaseUnit.baseUnit && v.purchaseUnit.size > 0)) return alert('Each format needs a valid size and base unit');
      if (!Array.isArray(v.servingOptions) || v.servingOptions.length === 0) return alert('Each format needs at least one serving option');
    }
    const created = await materialize();
    onCreated && onCreated(created);
    onClose && onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">New Family</h3>
            <p className="text-xs text-gray-600">Create a family with purchase formats and serving options. Toggle Recipe to compute costs from ingredients.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close"><X /></button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4">
          <ol className="grid grid-cols-5 gap-2">
            {steps.map((label, i) => (
              <li key={label} className={`flex items-center gap-2 p-2 rounded border ${i===step? 'bg-green-50 border-green-200':'bg-gray-50 border-gray-200'} text-sm`}>
                <span className={`h-6 w-6 inline-flex items-center justify-center rounded-full text-xs font-semibold ${i<=step? 'bg-green-600 text-white':'bg-gray-300 text-gray-700'}`}>{i+1}</span>
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* STEP 1: FAMILY */}
          {step===0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Family Name</label>
                  <input className="w-full border rounded px-3 py-2" value={data.name} onChange={(e)=> setPath('name', e.target.value)} placeholder="Batch 15 / Margarita" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select className="w-full border rounded px-3 py-2 bg-white" value={data.category} onChange={(e)=> setPath('category', e.target.value)}>
                    {Array.isArray(fohCategories) && fohCategories.map(c=> <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <input className="w-full border rounded px-3 py-2" value={data.vendor} onChange={(e)=> setPath('vendor', e.target.value)} placeholder="Aslan / Dickerson / ..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={data.description} onChange={(e)=> setPath('description', e.target.value)} placeholder="Notes, seasonality, etc." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Name Template</label>
                  <input className="w-full border rounded px-3 py-2" value={data.nameTemplate} onChange={(e)=> setPath('nameTemplate', e.target.value)} />
                  <p className="text-xs text-gray-500 mt-1">Tokens: {'{family}'}, {'{variant}'}, {'{serving}'} (used for auto names)</p>
                </div>
                <label className="inline-flex items-center gap-2 self-end">
                  <input type="checkbox" checked={data.hasRecipe} onChange={(e)=> setPath('hasRecipe', e.target.checked)} />
                  <span className="text-sm">This family has a batch recipe</span>
                </label>
              </div>

              {data.hasRecipe && (
                <div className="border rounded-xl p-4 space-y-3">
                  <div className="font-semibold">Recipe</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Size</label>
                      <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={data.recipe.batchSize} onChange={(e)=> setPath('recipe.batchSize', +e.target.value || 0)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Batch Unit</label>
                      <select className="w-full border rounded px-3 py-2 bg-white" value={data.recipe.batchUnit} onChange={(e)=> setPath('recipe.batchUnit', e.target.value)}>
                        {UNIT_OPTS.map(u=> <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end text-sm text-gray-700">
                      Total recipe cost: <span className="font-semibold ml-2">${recipeCalc.total.toFixed(2)}</span> {recipeCalc.batchKind==='vol' && (<span className="ml-3">(${recipeCalc.perUnit.toFixed(4)} per L)</span>)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-2 text-xs text-gray-600">
                      <div className="md:col-span-3">Link product (by name or SKU)</div>
                      <div>Qty</div>
                      <div>Unit</div>
                      <div className="md:col-span-2">Manual cost (fallback)</div>
                      <div>Line cost</div>
                      <div></div>
                    </div>
                    {ingredientRows.map((r, idx)=>{
                      const linked = r.linkedName ? findProductByNameOrSku(r.linkedName) : null;
                      const fromLinked = linked ? costFromLinkedProduct(linked, +r.quantity||0, r.unit||'L') : NaN;
                      const lineCost = isFinite(fromLinked) ? fromLinked : (+r.costHint || 0);
                      return (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
                          <div className="md:col-span-3">
                            <input list="ingredient-products" className="w-full border rounded px-3 py-2" value={r.linkedName||''} onChange={(e)=> setPath(`recipe.ingredients.${idx}.linkedName`, e.target.value)} placeholder="Tequila Blanco 1L / SKU123" />
                          </div>
                          <div>
                            <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={r.quantity||0} onChange={(e)=> setPath(`recipe.ingredients.${idx}.quantity`, +e.target.value||0)} />
                          </div>
                          <div>
                            <select className="w-full border rounded px-3 py-2 bg-white" value={r.unit||'L'} onChange={(e)=> setPath(`recipe.ingredients.${idx}.unit`, e.target.value)}>
                              {UNIT_OPTS.map(u=> <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={r.costHint||''} onChange={(e)=> setPath(`recipe.ingredients.${idx}.costHint`, +e.target.value||0)} placeholder="If not linked" />
                          </div>
                          <div className="text-sm text-gray-700 py-2">${(lineCost||0).toFixed(2)}</div>
                          <div className="flex justify-end">
                            <button type="button" onClick={()=> setPath('recipe.ingredients', ingredientRows.filter((_,i)=> i!==idx))} className="px-2 py-2 rounded border text-red-600">Remove</button>
                          </div>
                        </div>
                      );
                    })}
                    <datalist id="ingredient-products">
                      {allProducts.map(p => <option key={p.id} value={p.sku || p.name}>{p.name} {p.sku? `(${p.sku})`: ''}</option>)}
                    </datalist>
                    <div className="pt-1">
                      <button type="button" onClick={()=> setPath('recipe.ingredients', [...ingredientRows, { linkedName:'', quantity:0, unit: isVol(data.recipe.batchUnit)? 'L' : isMass(data.recipe.batchUnit)? 'g' : 'each', costHint: 0 }])} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border bg-gray-50 hover:bg-gray-100"><Plus className="h-4 w-4"/> Add ingredient</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: FORMATS */}
          {step===1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{data.hasRecipe ? 'Batch output (containers)' : 'Purchase formats'}</h4>
                <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border bg-gray-50 hover:bg-gray-100"><Plus className="h-4 w-4"/> Add {data.hasRecipe ? 'output' : 'format'}</button>
              </div>
              {(data.variants||[]).map((v, vidx)=> (
                <div key={vidx} className="border rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Label</label>
                      <input className="w-full border rounded px-3 py-2" value={v.label} onChange={(e)=> setPath(`variants.${vidx}.label`, e.target.value)} placeholder={data.hasRecipe ? '5 gal corny' : '1/2 BBL / 1/6 BBL / Case 24'} />
                    </div>
                    {!data.hasRecipe && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost per purchase ($)</label>
                        <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={v.costPerPurchase || 0} onChange={(e)=> setPath(`variants.${vidx}.costPerPurchase`, +e.target.value || 0)} />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">{data.hasRecipe ? 'Output size' : 'Purchase size'}</label>
                      <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={v.purchaseUnit?.size || 0} onChange={(e)=> setPath(`variants.${vidx}.purchaseUnit.size`, +e.target.value || 0)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Base unit</label>
                      <select className="w-full border rounded px-3 py-2 bg-white" value={v.purchaseUnit?.baseUnit || (isVol(data.recipe.batchUnit)? 'L' : isMass(data.recipe.batchUnit)? 'g' : 'each')} onChange={(e)=> setPath(`variants.${vidx}.purchaseUnit.baseUnit`, e.target.value)}>
                        {UNIT_OPTS.map(u=> <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Unit name</label>
                      <input className="w-full border rounded px-3 py-2" value={v.purchaseUnit?.name || (data.hasRecipe ? 'batch' : '')} onChange={(e)=> setPath(`variants.${vidx}.purchaseUnit.name`, e.target.value)} placeholder={data.hasRecipe ? 'batch / corny / keg' : 'keg / flat / case'} />
                    </div>
                    <div className="flex items-end justify-between">
                      {data.hasRecipe ? (
                        <div className="text-xs text-gray-600">Cost computed from recipe</div>
                      ) : (
                        <div />
                      )}
                      <button type="button" onClick={()=> removeVariant(vidx)} className="px-3 py-2 rounded border text-red-600">Remove</button>
                    </div>
                  </div>
                  {data.hasRecipe && (
                    <div className="text-sm text-gray-700">
                      {/* show computed cost for this output */}
                      {(() => {
                        const pu = v.purchaseUnit || {};
                        let computed = 0;
                        if (recipeCalc.batchKind==='vol' && isVol(pu.baseUnit)) computed = recipeCalc.perUnit * (toLiters(pu.size||0, pu.baseUnit)||0);
                        else if (recipeCalc.batchKind==='mass' && isMass(pu.baseUnit)) computed = recipeCalc.perUnit * (toGrams(pu.size||0, pu.baseUnit)||0);
                        else if (recipeCalc.batchKind==='each' && isEach(pu.baseUnit)) computed = recipeCalc.perUnit * (pu.size||1);
                        return <div>Computed cost for this output: <span className="font-semibold">${(computed||0).toFixed(2)}</span></div>;
                      })()}
                    </div>
                  )}
                </div>
              ))}
              {(!data.variants || data.variants.length===0) && (
                <div className="text-sm text-gray-600">No {data.hasRecipe ? 'outputs' : 'formats'} yet. Add one above.</div>
              )}
            </div>
          )}

          {/* STEP 3: SERVINGS */}
          {step===2 && (
            <div className="space-y-6">
              {(data.variants||[]).map((v, vidx)=> (
                <div key={vidx} className="border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{v.label}</div>
                    <button type="button" onClick={()=> beerPresets(vidx)} className="inline-flex items-center gap-2 px-2 py-1 rounded border bg-gray-50 hover:bg-gray-100"><Wand2 className="h-4 w-4"/> Beer presets</button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-2 text-xs text-gray-600">
                      <div className="md:col-span-2">Serving name</div>
                      <div>Size</div>
                      <div>Unit</div>
                      <div>Yield loss %</div>
                      <div>Servings/purchase</div>
                      <div>Cost/serving</div>
                      <div></div>
                    </div>
                    {(v.servingOptions||[]).map((s, sidx)=>{
                      const sp = Math.floor(servingsPerPurchase(v.purchaseUnit, s));
                      const pu = v.purchaseUnit||{};
                      let variantCost = v.costPerPurchase||0;
                      if (data.hasRecipe){
                        if (recipeCalc.batchKind==='vol' && isVol(pu.baseUnit)) variantCost = recipeCalc.perUnit * (toLiters(pu.size||0, pu.baseUnit)||0);
                        else if (recipeCalc.batchKind==='mass' && isMass(pu.baseUnit)) variantCost = recipeCalc.perUnit * (toGrams(pu.size||0, pu.baseUnit)||0);
                        else if (recipeCalc.batchKind==='each' && isEach(pu.baseUnit)) variantCost = recipeCalc.perUnit * (pu.size||1);
                      }
                      const cps = costPerServing(variantCost, sp);
                      return (
                        <div key={sidx} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
                          <div className="md:col-span-2">
                            <input className="w-full border rounded px-3 py-2" value={s.label || ''} onChange={(e)=> setPath(`variants.${vidx}.servingOptions.${sidx}.label`, e.target.value)} placeholder="0.5L Pour / 4oz / Whole Keg" />
                          </div>
                          <div>
                            <input type="number" min={0} step="any" className="w-full border rounded px-3 py-2" value={s.size || 0} onChange={(e)=> setPath(`variants.${vidx}.servingOptions.${sidx}.size`, +e.target.value || 0)} />
                          </div>
                          <div>
                            <select className="w-full border rounded px-3 py-2 bg-white" value={s.baseUnit || v.purchaseUnit.baseUnit} onChange={(e)=> setPath(`variants.${vidx}.servingOptions.${sidx}.baseUnit`, e.target.value)}>
                              {UNIT_OPTS.map(u=> <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div>
                            <input type="number" min={0} max={100} className="w-full border rounded px-3 py-2" value={s.yieldLossPct || 0} onChange={(e)=> setPath(`variants.${vidx}.servingOptions.${sidx}.yieldLossPct`, +e.target.value || 0)} />
                          </div>
                          <div className="text-sm text-gray-700 py-2">{sp}</div>
                          <div className="text-sm text-gray-700 py-2">${cps.toFixed(4)}</div>
                          <div className="flex justify-end">
                            <button type="button" onClick={()=> removeServing(vidx, sidx)} className="px-2 py-2 rounded border text-red-600">Remove</button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-1">
                      <button type="button" onClick={()=> addServing(vidx)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border bg-gray-50 hover:bg-gray-100"><Plus className="h-4 w-4"/> Add serving</button>
                    </div>
                  </div>
                </div>
              ))}
              {(!data.variants || data.variants.length===0) && (
                <div className="text-sm text-gray-600">No {data.hasRecipe ? 'outputs' : 'formats'} defined yet. Go back and add at least one.</div>
              )}
            </div>
          )}

          {/* STEP 4: SKUs GRID */}
          {step===3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">Fill SKUs for each serving. You can paste from Toast or click Generate All.</div>
                <button type="button" onClick={genAllSkus} className="px-3 py-1.5 rounded border">Generate all (missing only)</button>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Variant</th>
                      <th className="px-3 py-2 text-left">Serving</th>
                      <th className="px-3 py-2 text-left">Size</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">POS SKU (Toast)</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuRows.length===0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No servings yet. Add servings in the previous step.</td></tr>
                    )}
                    {skuRows.map((r)=> (
                      <tr key={r.key} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{r.variant}</td>
                        <td className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={r.serving} onChange={(e)=> r.setServing(e.target.value)} /></td>
                        <td className="px-3 py-2 w-28">{r.size}</td>
                        <td className="px-3 py-2 w-24">{r.baseUnit}</td>
                        <td className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={r.sku} onChange={(e)=> r.setSku(e.target.value)} placeholder="Paste or generate" /></td>
                        <td className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={r.posSku} onChange={(e)=> r.setPosSku(e.target.value)} placeholder="Optional" /></td>
                        <td className="px-3 py-2"><button type="button" onClick={()=> r.setSku(r.suggest())} className="px-2 py-1 rounded border">Gen</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {step===4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Family</div>
                  <div className="font-medium">{data.name || '(unnamed)'}</div>
                  <div className="text-sm text-gray-600">{data.category} {data.vendor ? ' • ' + data.vendor : ''}</div>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Totals</div>
                  <div className="text-sm">Products: {reviewStats.totalProducts}</div>
                  {data.hasRecipe && <div className="text-sm">Recipe cost total: ${recipeCalc.total.toFixed(2)}</div>}
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Recipe</div>
                  <div className="text-sm">{data.hasRecipe? 'Included' : 'None'}</div>
                </div>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Variant</th>
                      <th className="px-3 py-2 text-left">Serving</th>
                      <th className="px-3 py-2 text-left">SKU</th>
                      <th className="px-3 py-2 text-left">POS SKU</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skuRows.map(r=> (
                      <tr key={r.key} className="border-t">
                        <td className="px-3 py-2">{r.variant}</td>
                        <td className="px-3 py-2">{r.serving}</td>
                        <td className="px-3 py-2">{r.sku || '-'}</td>
                        <td className="px-3 py-2">{r.posSku || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} disabled={step===0} className="inline-flex items-center gap-2 px-3 py-2 rounded border disabled:opacity-50"><ChevronLeft className="h-4 w-4"/> Back</button>
              <button type="button" onClick={next} disabled={step===steps.length-1} className="inline-flex items-center gap-2 px-3 py-2 rounded border disabled:opacity-50">Next <ChevronRight className="h-4 w-4"/></button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded border">Cancel</button>
              <button type="submit" disabled={step!==steps.length-1} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-green-700 text-white disabled:opacity-50"><Save className="h-4 w-4"/> Create Products</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
