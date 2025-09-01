// src/components/products/ProductFamilyForm.jsx
// v7.0 — Unified wizard matching Aslan flow
// Modes: Full (beer/packaged), Recipe (batch cocktails), Simple (cider/kombucha), Ingredient
// Output: onSubmit(productsArray, familyMeta)
//
// Highlights:
// - Full/Simple: Purchase Unit Preset + Purchase Quantity (items per purchase) + Each Size (qty+unit)
//   -> purchaseMl = quantity * eachSizeMl
// - Beer draft presets + conditional "Wholesale (½ BBL / ⅙ BBL)" serving
// - Servings UI simplified (no redundant quick-size column)
// - Recipe: Batch qty+unit + Batch SKU, live rollups
// - Uses optional utils/aslanbranding for look/feel

import React, { useMemo, useState, useEffect } from "react";
import {
  ML_PER_US_FL_OZ,
  ML_PER_L,
  ML_PER_US_GAL,
  coerceServingLabelToMl,
  computePurchaseMl,
  formatVolume,
  servingsPerPurchaseExact,
  servingsPerPurchasePourable,
} from "../../utils/units";

// ---- Branding (soft import) ----
function getBranding() {
  try {
    // eslint-disable-next-line global-require
    const mod = require("../../utils/aslanBranding");
    const b = mod?.default || mod || {};
    return {
      colors: {
        primary: b.colors?.primary || "#111111",
        surface: b.colors?.surface || "#ffffff",
        surfaceMuted: b.colors?.surfaceMuted || "#f6f7f8",
        border: b.colors?.border || "#e5e7eb",
        text: b.colors?.text || "#111827",
        hint: b.colors?.hint || "#6b7280",
        overlay: b.colors?.overlay || "rgba(0,0,0,0.4)",
      },
      radii: {
        card: b.radii?.card || "1rem",
        pill: b.radii?.pill || "999px",
        button: b.radii?.button || "0.75rem",
        field: b.radii?.field || "0.5rem",
        modal: b.radii?.modal || "1rem",
      },
      classes: {
        buttonPrimary: b.classes?.buttonPrimary || "bg-black text-white hover:opacity-90 transition",
        buttonSecondary: b.classes?.buttonSecondary || "border hover:bg-gray-50 transition",
        chip: b.classes?.chip || "rounded-full border px-3 py-1 text-sm hover:bg-gray-50",
        input: b.classes?.input || "border rounded px-3 py-2",
        tableHead: b.classes?.tableHead || "bg-gray-50",
      },
    };
  } catch {
    return {
      colors: {
        primary: "#111111",
        surface: "#ffffff",
        surfaceMuted: "#f6f7f8",
        border: "#e5e7eb",
        text: "#111827",
        hint: "#6b7280",
        overlay: "rgba(0,0,0,0.4)",
      },
      radii: { card: "1rem", pill: "999px", button: "0.75rem", field: "0.5rem", modal: "1rem" },
      classes: {
        buttonPrimary: "bg-black text-white hover:opacity-90 transition",
        buttonSecondary: "border hover:bg-gray-50 transition",
        chip: "rounded-full border px-3 py-1 text-sm hover:bg-gray-50",
        input: "border rounded px-3 py-2",
        tableHead: "bg-gray-50",
      },
    };
  }
}
const BRAND = getBranding();

// ---------- Presets & helpers ----------
const BEER_SERVING_PRESETS = [
  ".5L",
  ".3L",
  "12oz",
  "10oz",
  "8oz",
  "4oz",
  "Taster (2oz)",
  "Pitcher (64oz)",
  "32oz Growler",
  "64oz Growler",
];
const CIDER_SERVING_PRESETS = ["12oz", "4oz", "Taster (2oz)"];
const KOMBUCHA_SERVING_PRESETS = ["12oz", "4oz", "Taster (2oz)"];

const PURCHASE_PRESETS = [
  // Draft
  { key: "keg_half", label: "½ BBL Keg", kind: "keg", eachMl: computePurchaseMl("1/2 BBL"), defaultQty: 1 },
  { key: "keg_sixth", label: "⅙ BBL Keg", kind: "keg", eachMl: computePurchaseMl("1/6 BBL"), defaultQty: 1 },
  { key: "keg_20l", label: "20L Keg", kind: "keg", eachMl: computePurchaseMl("20L"), defaultQty: 1 },
  { key: "keg_50l", label: "50L Keg", kind: "keg", eachMl: computePurchaseMl("50L"), defaultQty: 1 },
  // Packaged beer (cans/bottles)
  { key: "case_24x12", label: "Case (24×12oz cans)", kind: "pack", eachMl: 12 * ML_PER_US_FL_OZ, defaultQty: 24 },
  { key: "pack_6x12", label: "6-Pack (6×12oz cans)", kind: "pack", eachMl: 12 * ML_PER_US_FL_OZ, defaultQty: 6 },
  { key: "single_12", label: "Single (12oz can)", kind: "pack", eachMl: 12 * ML_PER_US_FL_OZ, defaultQty: 1 },
  { key: "bottle_500", label: "Single (500ml bottle)", kind: "pack", eachMl: 500, defaultQty: 1 },
];

function presetByKey(key) {
  return PURCHASE_PRESETS.find((p) => p.key === key) || null;
}

function toMlFromQtyUnit(q, unit) {
  const qty = Number(q) || 0;
  switch (unit) {
    case "ml":
      return qty;
    case "l":
      return qty * ML_PER_L;
    case "gal":
      return qty * ML_PER_US_GAL;
    case "floz":
      return qty * ML_PER_US_FL_OZ;
    default:
      return 0;
  }
}

function fromMlToBest(ml) {
  if (!Number.isFinite(ml) || ml <= 0) return { qty: "", unit: "ml" };
  if (ml >= 1000 && ml % ML_PER_L === 0) return { qty: ml / ML_PER_L, unit: "l" };
  if (ml >= ML_PER_US_GAL && (ml / ML_PER_US_GAL) % 1 === 0) return { qty: ml / ML_PER_US_GAL, unit: "gal" };
  if (ml % ML_PER_US_FL_OZ === 0) return { qty: ml / ML_PER_US_FL_OZ, unit: "floz" };
  return { qty: ml, unit: "ml" };
}

function QtyUnit({ label, qty, unit, onChange, hint }) {
  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <div className="flex gap-2 items-start">
        <input
          type="number"
          className={`${BRAND.classes.input} w-28`}
          placeholder="e.g., 5"
          value={Number.isFinite(qty) ? qty : ""}
          onChange={(e) => onChange({ qty: Number(e.target.value), unit })}
        />
        <select
          className={`${BRAND.classes.input} w-28`}
          value={unit}
          onChange={(e) => onChange({ qty, unit: e.target.value })}
        >
          <option value="ml">ml</option>
          <option value="l">L</option>
          <option value="gal">US gal</option>
          <option value="floz">US fl oz</option>
        </select>
        {hint}
      </div>
    </div>
  );
}

function slug(s) {
  return (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
}
function servingCode(ml) {
  if (!Number.isFinite(ml) || ml <= 0) return "UNK";
  if (ml >= 1000) return `${Math.round(ml / 10) * 10}ML`;
  const oz = ml / ML_PER_US_FL_OZ;
  return `${Math.round(oz * 10) / 10}OZ`.replace(".", "");
}
function genSku(familyName, variantLabel, ml, index = 0) {
  const fam = slug(familyName).slice(0, 6);
  const varc = slug(variantLabel || "VAR").slice(0, 4);
  return `${fam}-${varc}-${servingCode(ml)}${index ? "-" + index : ""}`;
}

// ------------- Component -------------
export default function ProductFamilyForm({
  defaultMode = "full",
  productOptions = [],
  seedFamily,
  seedRows,
  onSubmit,
  onCancel,
}) {
  // Detect mode when editing
  const detectedMode = useMemo(() => {
    if (Array.isArray(seedRows) && seedRows.length) {
      if (seedRows.some((r) => r.familyRecipe)) return "recipe";
      if (seedRows.every((r) => r.isIngredient && r.isSellable === false)) return "ingredient";
    }
    return defaultMode;
  }, [seedRows, defaultMode]);

  const [mode, setMode] = useState(detectedMode);

  // Family header
  const [familyName, setFamilyName] = useState(seedFamily?.name || "");
  const [category, setCategory] = useState(seedFamily?.category || "");
  const [notes, setNotes] = useState("");

  // Full/Simple variants
  const [variants, setVariants] = useState(() => {
    if (seedRows && seedRows.length && detectedMode !== "recipe" && detectedMode !== "ingredient") {
      // Rehydrate variants from rows
      const byVar = new Map();
      for (const r of seedRows) {
        const key = r.subcategory || "";
        const v = byVar.get(key) || {
          id: key || `var_${Math.random().toString(36).slice(2, 7)}`,
          label: key,
          // We don't know their original preset/qty; derive each as one purchase
          presetKey: "",
          purchaseQty: 1,
          eachQty: fromMlToBest(Number.isFinite(r.purchaseMl) ? r.purchaseMl : 0).qty,
          eachUnit: fromMlToBest(Number.isFinite(r.purchaseMl) ? r.purchaseMl : 0).unit,
          costPerPurchase: Number(r.costPerPurchase) || 0,
          purchaseMl: Number(r.purchaseMl) || 0,
          servings: [],
        };
        v.servings.push({
          id: r.id || `srv_${Math.random().toString(36).slice(2, 7)}`,
          label: r.servingUnit || "",
          servingMl: Number.isFinite(r.servingMl) ? r.servingMl : coerceServingLabelToMl(r.servingUnit || ""),
          sku: r.sku || "",
          posSku: r.posSku || "",
        });
        byVar.set(key, v);
      }
      return Array.from(byVar.values());
    }
    // Default new variant (½ BBL keg)
    return [
      {
        id: `var_${Math.random().toString(36).slice(2, 7)}`,
        label: "",
        presetKey: "keg_half",
        purchaseQty: 1,
        eachQty: fromMlToBest(computePurchaseMl("1/2 BBL")).qty,
        eachUnit: fromMlToBest(computePurchaseMl("1/2 BBL")).unit,
        purchaseMl: computePurchaseMl("1/2 BBL"),
        costPerPurchase: 0,
        servings: [],
      },
    ];
  });

  // Recipe state
  const [batchQty, setBatchQty] = useState(5);
  const [batchUnit, setBatchUnit] = useState("gal");
  const batchVolumeMl = useMemo(() => toMlFromQtyUnit(batchQty, batchUnit), [batchQty, batchUnit]);
  const [batchSku, setBatchSku] = useState("");

  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [recipeServings, setRecipeServings] = useState([]);

  // Ingredient state
  const [ingUnitKind, setIngUnitKind] = useState("ml"); // 'ml' | 'g'
  const [ingPurchaseLabel, setIngPurchaseLabel] = useState(seedRows?.[0]?.purchaseUnit || "");
  const [ingQty, setIngQty] = useState(
    Number.isFinite(seedRows?.[0]?.purchaseMl) ? seedRows[0].purchaseMl : 1000
  );
  const [ingQtyUnit, setIngQtyUnit] = useState("ml");
  const [ingCostPerPurchase, setIngCostPerPurchase] = useState(
    Number.isFinite(seedRows?.[0]?.costPerPurchase) ? seedRows[0].costPerPurchase : 0
  );
  const ingPurchaseQtyMl = useMemo(
    () => (ingUnitKind === "ml" ? toMlFromQtyUnit(ingQty, ingQtyUnit) : 0),
    [ingQty, ingQtyUnit, ingUnitKind]
  );
  const ingCostPerUnit = useMemo(() => {
    const q = ingUnitKind === "ml" ? (ingPurchaseQtyMl || 0) : (Number(ingQty) || 0);
    const c = Number(ingCostPerPurchase) || 0;
    return q > 0 ? c / q : 0;
  }, [ingPurchaseQtyMl, ingQty, ingUnitKind, ingCostPerPurchase]);

  // Family meta
  const familyMeta = useMemo(
    () => ({
      id: seedFamily?.id || `fam_${slug(familyName) || Math.random().toString(36).slice(2, 7)}`,
      name: familyName || "(Family)",
      category: category || "",
      notes,
      mode,
    }),
    [familyName, category, notes, mode, seedFamily]
  );

  // ------- Variant mutators -------
  const setVariant = (vid, updater) =>
    setVariants((prev) => prev.map((v) => (v.id === vid ? updater(v) : v)));
  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        id: `var_${Math.random().toString(36).slice(2, 7)}`,
        label: "",
        presetKey: "keg_sixth",
        purchaseQty: 1,
        eachQty: fromMlToBest(computePurchaseMl("1/6 BBL")).qty,
        eachUnit: fromMlToBest(computePurchaseMl("1/6 BBL")).unit,
        purchaseMl: computePurchaseMl("1/6 BBL"),
        costPerPurchase: 0,
        servings: [],
      },
    ]);
  const removeVariant = (vid) => setVariants((prev) => prev.filter((v) => v.id !== vid));

  // Keep purchaseMl in sync when qty/each changes
  useEffect(() => {
    setVariants((prev) =>
      prev.map((v) => {
        const eachMl = toMlFromQtyUnit(v.eachQty, v.eachUnit);
        const purchaseMl = (Number(v.purchaseQty) || 0) * (eachMl || 0);
        return { ...v, purchaseMl };
      })
    );
  }, [variants.map((v) => [v.purchaseQty, v.eachQty, v.eachUnit]).flat().join("|")]); // minimal re-run hack

  const onPresetChange = (vid, key) =>
    setVariant(vid, (v) => {
      const p = presetByKey(key);
      if (!p) return { ...v, presetKey: "" };
      const best = fromMlToBest(p.eachMl);
      const purchaseMl = p.defaultQty * p.eachMl;
      return {
        ...v,
        presetKey: key,
        purchaseQty: p.defaultQty,
        eachQty: best.qty,
        eachUnit: best.unit,
        purchaseMl,
      };
    });

  // Serving rows
  const addServingRow = (vid, label = "") =>
    setVariant(vid, (v) => ({
      ...v,
      servings: [
        ...v.servings,
        {
          id: `srv_${Math.random().toString(36).slice(2, 7)}`,
          label,
          servingMl: coerceServingLabelToMl(label) || 0,
          sku: "",
          posSku: "",
        },
      ],
    }));
  const removeServingRow = (vid, sid) =>
    setVariant(vid, (v) => ({ ...v, servings: v.servings.filter((s) => s.id !== sid) }));
  const setServingField = (vid, sid, field, value) =>
    setVariant(vid, (v) => ({
      ...v,
      servings: v.servings.map((s) => (s.id === sid ? { ...s, [field]: value } : s)),
    }));

  // Presets (draft / cider / kombucha)
  const addBeerPresets = (vid) => BEER_SERVING_PRESETS.forEach((p) => addServingRow(vid, p));
  const addCiderPresets = (vid) => CIDER_SERVING_PRESETS.forEach((p) => addServingRow(vid, p));
  const addKombuchaPresets = (vid) => KOMBUCHA_SERVING_PRESETS.forEach((p) => addServingRow(vid, p));

  // Conditional wholesale serving for kegs
  const addWholesaleServingIfKeg = (v) => {
    const p = presetByKey(v.presetKey);
    if (!p || p.kind !== "keg") return null;
    const label = p.key === "keg_half" ? "½ BBL wholesale" : p.key === "keg_sixth" ? "⅙ BBL wholesale" : "Wholesale (Keg)";
    return { label, ml: v.purchaseMl || toMlFromQtyUnit(v.eachQty, v.eachUnit) * (v.purchaseQty || 1) };
  };

  // SKU tools
  const bulkPasteSkus = (vid, text) =>
    setVariant(vid, (v) => {
      const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const map = new Map();
      for (const line of lines) {
        const [servingLabel, sku, posSku] = line.split(/[\t,]+/).map((x) => x.trim());
        if (servingLabel && sku) map.set(servingLabel.toLowerCase(), { sku, posSku: posSku || "" });
      }
      return {
        ...v,
        servings: v.servings.map((s) => {
          const hit = map.get((s.label || "").toLowerCase());
          return hit ? { ...s, ...hit } : s;
        }),
      };
    });

  const generateSkus = (vid) =>
    setVariant(vid, (v) => ({
      ...v,
      servings: v.servings.map((s, i) => {
        if (s.sku?.trim()) return s;
        const ml = s.servingMl || coerceServingLabelToMl(s.label || "");
        return { ...s, sku: genSku(familyName, v.label, ml, i + 1) };
      }),
    }));

  // ------- Recipe calcs -------
  const recipeCost = useMemo(() => {
    if (mode !== "recipe") return { totalCost: 0, costPerMl: 0 };
    let total = 0;
    for (const ing of recipeIngredients) {
      const linked = productOptions.find((p) => p.id === ing.productId);
      const unitCost =
        ing.unit === "ml" ? (linked?.costPerMl ?? ing.fallbackCostPerUnit ?? 0) : (linked?.costPerG ?? ing.fallbackCostPerUnit ?? 0);
      total += (ing.qty || 0) * unitCost;
    }
    const perMl = batchVolumeMl > 0 ? total / batchVolumeMl : 0;
    return { totalCost: total, costPerMl: perMl };
  }, [mode, recipeIngredients, productOptions, batchVolumeMl]);

  // ------- Submit builders -------
  function buildProductsFullOrSimple() {
    const out = [];
    for (const v of variants) {
      const vPurchaseMl = Number(v.purchaseMl) || 0;
      const vCost = Number(v.costPerPurchase) || 0;

      for (const s of v.servings) {
        const sMl = Number(s.servingMl) || coerceServingLabelToMl(s.label || "") || 0;
        const per = vPurchaseMl > 0 && sMl > 0 ? servingsPerPurchasePourable(vPurchaseMl, sMl) : 0;
        const cps = per > 0 ? vCost / per : 0;

        out.push({
          familyId: familyMeta.id,
          familyName: familyMeta.name,
          subcategory: v.label || "",
          category: category || "",
          isSellable: true,
          isIngredient: false,
          isArchived: false,
          purchaseUnit: "", // textual unit is free-form; we keep exact ml
          purchaseMl: vPurchaseMl,
          costPerPurchase: vCost,
          servingUnit: s.label || "",
          servingMl: sMl,
          servingsPerPurchase: per,
          costPerServing: cps,
          sku: s.sku || "",
          posSku: s.posSku || "",
          familyRecipe: undefined,
        });
      }
    }
    return out;
  }

  function buildProductsRecipe() {
    const out = [];
    const perMl = recipeCost.costPerMl || 0;

    for (const s of recipeServings) {
      const sMl = Number(s.servingMl) || coerceServingLabelToMl(s.label || "") || 0;
      const per = sMl > 0 && batchVolumeMl > 0 ? servingsPerPurchaseExact(batchVolumeMl, sMl) : 0;
      const cps = sMl * perMl;

      out.push({
        familyId: familyMeta.id,
        familyName: familyMeta.name,
        subcategory: "Batch",
        category: category || "Batch Cocktails",
        isSellable: true,
        isIngredient: false,
        isArchived: false,
        purchaseUnit: "Batch Output",
        purchaseMl: batchVolumeMl,
        costPerPurchase: perMl * batchVolumeMl,
        servingUnit: s.label || "",
        servingMl: sMl,
        servingsPerPurchase: per,
        costPerServing: cps,
        sku: s.sku || "",
        posSku: s.posSku || "",
        familyRecipe: {
          batchVolumeMl,
          batchSku: batchSku || "",
          ingredients: recipeIngredients.map((ing) => ({
            productId: ing.productId || null,
            name: ing.name || "",
            qty: ing.qty || 0,
            unit: ing.unit,
            fallbackCostPerUnit: ing.fallbackCostPerUnit || 0,
          })),
          totalCost: perMl * batchVolumeMl,
          costPerMl: perMl,
        },
      });
    }
    return out;
  }

  function buildProductsIngredient() {
    const isVolume = ingUnitKind === "ml";
    const perUnitCost = ingCostPerUnit || 0;
    return [
      {
        familyId: familyMeta.id,
        familyName: familyMeta.name,
        subcategory: "",
        category: category || "Ingredient",
        isSellable: false,
        isIngredient: true,
        isArchived: false,
        purchaseUnit: ingPurchaseLabel || (isVolume ? "Bottle" : "Bag"),
        purchaseMl: isVolume ? (ingPurchaseQtyMl || 0) : undefined,
        costPerPurchase: Number(ingCostPerPurchase) || 0,
        servingUnit: "",
        servingMl: undefined,
        servingsPerPurchase: undefined,
        costPerServing: undefined,
        sku: "",
        posSku: "",
        ingredientEconomics: { unitKind: ingUnitKind, costPerUnit: perUnitCost },
      },
    ];
  }

  function collectAndSubmit() {
    let products = [];
    if (mode === "recipe") products = buildProductsRecipe();
    else if (mode === "ingredient") products = buildProductsIngredient();
    else products = buildProductsFullOrSimple();

    const payloadFamily = {
      id: familyMeta.id,
      name: familyMeta.name,
      category: familyMeta.category,
      notes: familyMeta.notes,
      mode,
    };

    onSubmit?.(products, payloadFamily);
  }

  // ------- UI -------
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div
        className="p-4 border"
        style={{ borderColor: BRAND.colors.border, borderRadius: BRAND.radii.card, background: BRAND.colors.surface }}
      >
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="inline-flex rounded-lg border overflow-hidden">
            {["full", "recipe", "simple", "ingredient"].map((m) => (
              <button
                key={m}
                type="button"
                className={`px-3 py-1.5 text-sm ${mode === m ? "bg-black text-white" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "full"
                  ? "Full (Beer/Packaged)"
                  : m === "recipe"
                  ? "Recipe (Batch)"
                  : m === "simple"
                  ? "Simple (Cider/Kombucha)"
                  : "Ingredient"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="button" className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={`${BRAND.classes.buttonPrimary} rounded px-3 py-1.5 text-sm`} onClick={collectAndSubmit}>
              {seedFamily ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Family name</label>
            <input
              className={`${BRAND.classes.input} w-full`}
              placeholder="e.g., Batch 15, House Cider, Margarita"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Category</label>
            <select className={`${BRAND.classes.input} w-full`} value={category} onChange={(e) => setCategory(e.target.value)}>
              {["", "Beer", "Cider", "Batch Cocktails", "Kitchen", "N/A", "Ingredient"].map((c) => (
                <option key={c || "(none)"} value={c}>
                  {c || "Choose a category…"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <input
              className={`${BRAND.classes.input} w-full`}
              placeholder="Any internal notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {mode === "recipe" && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <QtyUnit
                label="Batch volume"
                qty={batchQty}
                unit={batchUnit}
                onChange={({ qty, unit }) => {
                  setBatchQty(qty);
                  setBatchUnit(unit);
                }}
                hint={<div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
                  = {formatVolume(batchVolumeMl || 0, { unit: "l", decimals: 2 })}
                </div>}
              />
              <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
                Tip: 5 gal ≈ {(5 * ML_PER_US_GAL).toFixed(0)} ml
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Batch SKU (optional)</label>
              <input
                className={`${BRAND.classes.input} w-full`}
                placeholder="SKU for the batch container (for mapping)"
                value={batchSku}
                onChange={(e) => setBatchSku(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mode panels */}
      {mode === "recipe" ? (
        <RecipePanel
          productOptions={productOptions}
          recipeIngredients={recipeIngredients}
          setRecipeIngredients={setRecipeIngredients}
          recipeServings={recipeServings}
          setRecipeServings={setRecipeServings}
          batchVolumeMl={batchVolumeMl}
          recipeCost={recipeCost}
        />
      ) : mode === "ingredient" ? (
        <IngredientPanel
          ingUnitKind={ingUnitKind}
          setIngUnitKind={setIngUnitKind}
          ingPurchaseLabel={ingPurchaseLabel}
          setIngPurchaseLabel={setIngPurchaseLabel}
          ingQty={ingQty}
          setIngQty={setIngQty}
          ingQtyUnit={ingQtyUnit}
          setIngQtyUnit={setIngQtyUnit}
          ingCostPerPurchase={ingCostPerPurchase}
          setIngCostPerPurchase={setIngCostPerPurchase}
          ingCostPerUnit={ingCostPerUnit}
        />
      ) : (
        <FullSimplePanel
          mode={mode}
          variants={variants}
          setVariant={setVariant}
          addVariant={addVariant}
          removeVariant={removeVariant}
          addServingRow={addServingRow}
          removeServingRow={removeServingRow}
          setServingField={setServingField}
          addBeerPresets={addBeerPresets}
          addCiderPresets={addCiderPresets}
          addKombuchaPresets={addKombuchaPresets}
          addWholesaleServingIfKeg={addWholesaleServingIfKeg}
          bulkPasteSkus={bulkPasteSkus}
          generateSkus={generateSkus}
        />
      )}
    </div>
  );
}

// ---------- Subcomponents ----------

function FullSimplePanel({
  mode, // 'full' | 'simple'
  variants,
  setVariant,
  addVariant,
  removeVariant,
  addServingRow,
  removeServingRow,
  setServingField,
  addBeerPresets,
  addCiderPresets,
  addKombuchaPresets,
  addWholesaleServingIfKeg,
  bulkPasteSkus,
  generateSkus,
}) {
  const isSimple = mode === "simple";

  return (
    <div className="flex flex-col gap-4">
      {variants.map((v, idx) => {
        const eachMl = toMlFromQtyUnit(v.eachQty, v.eachUnit);
        const purchaseMl = (Number(v.purchaseQty) || 0) * (eachMl || 0);

        return (
          <div
            key={v.id}
            className="p-4 border"
            style={{ borderColor: BRAND.colors.border, borderRadius: BRAND.radii.card, background: BRAND.colors.surface }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">
                {isSimple ? "Format" : `Variant ${idx + 1}`}{" "}
                <span className="text-xs" style={{ color: BRAND.colors.hint }}>
                  (purchase & servings)
                </span>
              </div>
              <div className="flex gap-2">
                {!isSimple && (
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={() => removeVariant(v.id)}
                  >
                    Remove
                  </button>
                )}
                {isSimple && idx === variants.length - 1 && (
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={addVariant}
                  >
                    + Add Format
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Label */}
              <div>
                <label className="block text-sm mb-1">{isSimple ? "Format label" : "Variant label"}</label>
                <input
                  className={`${BRAND.classes.input} w-full`}
                  placeholder={isSimple ? "e.g., ½ BBL Cider" : "e.g., ½ BBL, ⅙ BBL, Case, Singles"}
                  value={v.label}
                  onChange={(e) => setVariant(v.id, (x) => ({ ...x, label: e.target.value }))}
                />
              </div>

              {/* Purchase Unit Preset */}
              <div>
                <label className="block text-sm mb-1">Purchase Unit Preset</label>
                <select
                  className={`${BRAND.classes.input} w-full`}
                  value={v.presetKey || ""}
                  onChange={(e) => onPresetChange(v.id, e.target.value)}
                >
                  <option value="">Pick a preset…</option>
                  {PURCHASE_PRESETS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label} ({formatVolume(p.eachMl * p.defaultQty, { unit: "l", decimals: 2 })})
                    </option>
                  ))}
                </select>
                <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
                  Sets default **items per purchase** and **each size** automatically.
                </div>
              </div>

              {/* Purchase Quantity (items per purchase) */}
              <div>
                <label className="block text-sm mb-1">Purchase Quantity</label>
                <input
                  type="number"
                  className={`${BRAND.classes.input} w-full`}
                  placeholder="e.g., 24 (case) • 1 (keg)"
                  value={Number.isFinite(v.purchaseQty) ? v.purchaseQty : ""}
                  onChange={(e) => setVariant(v.id, (x) => ({ ...x, purchaseQty: Number(e.target.value) }))}
                />
                <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
                  Items per purchase container (e.g., case=24 cans; keg=1).
                </div>
              </div>

              {/* Each Size (qty+unit) */}
              <div>
                <QtyUnit
                  label="Each size"
                  qty={Number.isFinite(v.eachQty) ? v.eachQty : ""}
                  unit={v.eachUnit || "ml"}
                  onChange={({ qty, unit }) => setVariant(v.id, (x) => ({ ...x, eachQty: qty, eachUnit: unit }))}
                  hint={
                    <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
                      = {formatVolume(eachMl || 0, { unit: "l", decimals: 2 })}
                    </div>
                  }
                />
              </div>

              {/* Cost per purchase */}
              <div>
                <label className="block text-sm mb-1">Cost per purchase ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className={`${BRAND.classes.input} w-full`}
                  placeholder="e.g., 189.00"
                  value={Number.isFinite(v.costPerPurchase) ? v.costPerPurchase : ""}
                  onChange={(e) => setVariant(v.id, (x) => ({ ...x, costPerPurchase: Number(e.target.value) }))}
                />
              </div>

              {/* Purchase total ml hint */}
              <div className="md:col-span-3">
                <div className="text-sm mt-7">
                  Purchase volume (computed): <strong>{formatVolume(purchaseMl || 0, { unit: "l", decimals: 2 })}</strong>
                </div>
              </div>
            </div>

            {/* Servings */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Servings</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={() => addServingRow(v.id, "")}
                  >
                    + Add Serving
                  </button>

                  {/* Category presets */}
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={() => addBeerPresets(v.id)}
                  >
                    Beer Presets
                  </button>
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={() => addCiderPresets(v.id)}
                  >
                    Cider Presets
                  </button>
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                    onClick={() => addKombuchaPresets(v.id)}
                  >
                    Kombucha Presets
                  </button>

                  {/* Conditional wholesale for ½ / ⅙ kegs */}
                  {(() => {
                    const maybe = addWholesaleServingIfKeg(v);
                    return maybe ? (
                      <button
                        type="button"
                        className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
                        onClick={() => {
                          addServingRow(v.id, maybe.label);
                          setServingField(v.id, v.servings[v.servings.length]?.id, "servingMl", maybe.ml);
                        }}
                        title="Sell whole keg as a single item"
                      >
                        Add {maybe.label}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className={BRAND.classes.tableHead}>
                    <tr>
                      <th className="px-2 py-2 text-left">Serving</th>
                      <th className="px-2 py-2 text-left">Serving (ml)</th>
                      <th className="px-2 py-2 text-right">Servings / Purchase</th>
                      <th className="px-2 py-2 text-right">Cost / Serving</th>
                      <th className="px-2 py-2 text-left">SKU</th>
                      <th className="px-2 py-2 text-left">POS SKU</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.servings.map((s) => {
                      const sMl = Number(s.servingMl) || coerceServingLabelToMl(s.label || "") || 0;
                      const per =
                        sMl > 0 && (v.purchaseMl || 0) > 0
                          ? servingsPerPurchasePourable(v.purchaseMl, sMl)
                          : 0;
                      const cps = per > 0 && Number(v.costPerPurchase) > 0 ? v.costPerPurchase / per : 0;

                      return (
                        <tr key={s.id} className="border-t">
                          <td className="px-2 py-2 align-top">
                            <input
                              className={`${BRAND.classes.input} w-48`}
                              placeholder='e.g., .5L, 12oz, "Taster (2oz)", "Pitcher (64oz)"'
                              value={s.label}
                              onChange={(e) => {
                                const label = e.target.value;
                                const ml = coerceServingLabelToMl(label);
                                setServingField(v.id, s.id, "label", label);
                                if (ml) setServingField(v.id, s.id, "servingMl", ml);
                              }}
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              type="number"
                              className={`${BRAND.classes.input} w-32`}
                              placeholder="(ml)"
                              value={Number.isFinite(s.servingMl) ? s.servingMl : ""}
                              onChange={(e) => setServingField(v.id, s.id, "servingMl", Number(e.target.value))}
                            />
                          </td>
                          <td className="px-2 py-2 text-right align-top">{per ? per.toFixed(2) : "—"}</td>
                          <td className="px-2 py-2 text-right align-top">{cps ? `$${cps.toFixed(4)}` : "—"}</td>
                          <td className="px-2 py-2 align-top">
                            <input
                              className={`${BRAND.classes.input} w-44`}
                              placeholder="SKU"
                              value={s.sku || ""}
                              onChange={(e) => setServingField(v.id, s.id, "sku", e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <input
                              className={`${BRAND.classes.input} w-44`}
                              placeholder="POS SKU (optional)"
                              value={s.posSku || ""}
                              onChange={(e) => setServingField(v.id, s.id, "posSku", e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-2 text-right align-top">
                            <button
                              type="button"
                              className={`${BRAND.classes.buttonSecondary} rounded px-2 py-0.5 text-xs`}
                              onClick={() => removeServingRow(v.id, s.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!v.servings.length && (
                      <tr>
                        <td className="px-2 py-4 text-sm" colSpan={7} style={{ color: BRAND.colors.hint }}>
                          No servings yet. Use **Beer/Cider/Kombucha Presets** or add a custom serving.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SKU tools */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="text-sm font-medium">SKU tools</div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`}
                    onClick={() => generateSkus(v.id)}
                    title="Generate SKUs for blank rows"
                  >
                    Generate All
                  </button>
                  <BulkSkuPaste onPaste={(text) => bulkPasteSkus(v.id, text)} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!isSimple && (
        <div className="flex justify-end">
          <button type="button" className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`} onClick={addVariant}>
            + Add Variant
          </button>
        </div>
      )}
    </div>
  );
}

function BulkSkuPaste({ onPaste }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  return (
    <div>
      {!open ? (
        <button
          type="button"
          className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`}
          onClick={() => setOpen(true)}
          title='Paste "Serving,SKU[,POS]" (comma or tab separated)'
        >
          Bulk Paste…
        </button>
      ) : (
        <div className="mt-2 grid gap-2">
          <textarea
            className={`${BRAND.classes.input} w-[560px] h-28`}
            placeholder={`Example:\n.5L,SKU-001\n"Pitcher (64oz)",SKU-064\n"Taster (2oz)"\tSKU-T2OZ\tPOS-T2`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className={`${BRAND.classes.buttonPrimary} rounded px-3 py-1.5 text-sm`}
              onClick={() => {
                onPaste?.(text);
                setOpen(false);
                setText("");
              }}
            >
              Apply
            </button>
            <button
              type="button"
              className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`}
              onClick={() => {
                setOpen(false);
                setText("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecipePanel({
  productOptions,
  recipeIngredients,
  setRecipeIngredients,
  recipeServings,
  setRecipeServings,
  batchVolumeMl,
  recipeCost,
}) {
  const addIngredient = () =>
    setRecipeIngredients((r) => [
      ...r,
      { id: `ing_${Math.random().toString(36).slice(2, 7)}`, productId: "", name: "", qty: 0, unit: "ml", fallbackCostPerUnit: 0 },
    ]);
  const removeIngredient = (id) => setRecipeIngredients((r) => r.filter((x) => x.id !== id));
  const setIngredientField = (id, field, value) =>
    setRecipeIngredients((r) => r.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const addRecipeServing = (label = "6oz") =>
    setRecipeServings((s) => [
      ...s,
      { id: `rs_${Math.random().toString(36).slice(2, 7)}`, label, servingMl: coerceServingLabelToMl(label) || 0, sku: "", posSku: "" },
    ]);
  const removeRecipeServing = (sid) => setRecipeServings((s) => s.filter((x) => x.id !== sid));
  const setRecipeServingField = (sid, field, value) =>
    setRecipeServings((s) => s.map((x) => (x.id === sid ? { ...x, [field]: value } : x)));

  return (
    <div className="flex flex-col gap-4">
      <div
        className="p-4 border"
        style={{ borderColor: BRAND.colors.border, borderRadius: BRAND.radii.card, background: BRAND.colors.surface }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="block text-sm mb-1">Ingredients</label>
            <div className="rounded border overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={BRAND.classes.tableHead}>
                  <tr>
                    <th className="px-2 py-2 text-left">Link product (optional)</th>
                    <th className="px-2 py-2 text-left">Name (fallback)</th>
                    <th className="px-2 py-2 text-right">Qty</th>
                    <th className="px-2 py-2 text-left">Unit</th>
                    <th className="px-2 py-2 text-right">Fallback $/unit</th>
                    <th className="px-2 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeIngredients.map((ing) => (
                    <tr key={ing.id} className="border-t">
                      <td className="px-2 py-2">
                        <select
                          className={`${BRAND.classes.input} w-64`}
                          value={ing.productId || ""}
                          onChange={(e) => setIngredientField(ing.id, "productId", e.target.value)}
                        >
                          <option value="">—</option>
                          {productOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.sku ? `(${p.sku})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className={`${BRAND.classes.input} w-56`}
                          placeholder="e.g., Tequila, Lime juice, Agave"
                          value={ing.name}
                          onChange={(e) => setIngredientField(ing.id, "name", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          className={`${BRAND.classes.input} w-28 text-right`}
                          placeholder="e.g., 8400"
                          value={Number.isFinite(ing.qty) ? ing.qty : ""}
                          onChange={(e) => setIngredientField(ing.id, "qty", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className={`${BRAND.classes.input} w-28`}
                          value={ing.unit}
                          onChange={(e) => setIngredientField(ing.id, "unit", e.target.value)}
                        >
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.0001"
                          className={`${BRAND.classes.input} w-28 text-right`}
                          placeholder="e.g., 0.0025"
                          value={Number.isFinite(ing.fallbackCostPerUnit) ? ing.fallbackCostPerUnit : ""}
                          onChange={(e) => setIngredientField(ing.id, "fallbackCostPerUnit", Number(e.target.value))}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          className={`${BRAND.classes.buttonSecondary} rounded px-2 py-0.5 text-xs`}
                          onClick={() => removeIngredient(ing.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!recipeIngredients.length && (
                    <tr>
                      <td className="px-2 py-4 text-sm" colSpan={6} style={{ color: BRAND.colors.hint }}>
                        No ingredients yet. Add spirits, juices, syrups… link products to auto-pull costs; fallback $/unit if needed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <button type="button" className={`${BRAND.classes.buttonSecondary} rounded px-3 py-1.5 text-sm`} onClick={addIngredient}>
                + Add Ingredient
              </button>
            </div>

            <div className="text-sm mt-3">
              Batch cost: <strong>${(recipeCost.totalCost || 0).toFixed(2)}</strong> • Cost/ml:{" "}
              <strong>${(recipeCost.costPerMl || 0).toFixed(4)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div
        className="p-4 border"
        style={{ borderColor: BRAND.colors.border, borderRadius: BRAND.radii.card, background: BRAND.colors.surface }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium">Output servings</div>
          <div className="flex gap-2">
            <button
              type="button"
              className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
              onClick={() => {
                ["6oz"].forEach((p) =>
                  setRecipeServings((s) => [
                    ...s,
                    { id: `rs_${Math.random().toString(36).slice(2, 7)}`, label: p, servingMl: coerceServingLabelToMl(p) || 0, sku: "", posSku: "" },
                  ])
                );
              }}
            >
              + Add 6oz
            </button>
            <button
              type="button"
              className={`${BRAND.classes.buttonSecondary} rounded px-2 py-1 text-xs`}
              onClick={() =>
                ["8oz", "10oz"].forEach((p) =>
                  setRecipeServings((s) => [
                    ...s,
                    { id: `rs_${Math.random().toString(36).slice(2, 7)}`, label: p, servingMl: coerceServingLabelToMl(p) || 0, sku: "", posSku: "" },
                  ])
                )
              }
            >
              Add 8oz & 10oz
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={BRAND.classes.tableHead}>
              <tr>
                <th className="px-2 py-2 text-left">Serving</th>
                <th className="px-2 py-2 text-left">Serving (ml)</th>
                <th className="px-2 py-2 text-right">Servings / Batch</th>
                <th className="px-2 py-2 text-left">SKU</th>
                <th className="px-2 py-2 text-left">POS SKU</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipeServings.map((s) => {
                const sMl = Number(s.servingMl) || coerceServingLabelToMl(s.label || "") || 0;
                const per = sMl > 0 && batchVolumeMl > 0 ? servingsPerPurchaseExact(batchVolumeMl, sMl) : 0;
                return (
                  <tr key={s.id} className="border-t">
                    <td className="px-2 py-2">
                      <input
                        className={`${BRAND.classes.input} w-44`}
                        placeholder="e.g., 6oz"
                        value={s.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          const ml = coerceServingLabelToMl(label);
                          setRecipeServings((rows) =>
                            rows.map((row) => (row.id === s.id ? { ...row, label, servingMl: ml || row.servingMl } : row))
                          );
                        }}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        className={`${BRAND.classes.input} w-32`}
                        placeholder="(ml)"
                        value={Number.isFinite(s.servingMl) ? s.servingMl : ""}
                        onChange={(e) =>
                          setRecipeServings((rows) => rows.map((row) => (row.id === s.id ? { ...row, servingMl: Number(e.target.value) } : row)))
                        }
                      />
                    </td>
                    <td className="px-2 py-2 text-right">{per ? per.toFixed(2) : "—"}</td>
                    <td className="px-2 py-2">
                      <input
                        className={`${BRAND.classes.input} w-44`}
                        placeholder="SKU"
                        value={s.sku || ""}
                        onChange={(e) =>
                          setRecipeServings((rows) => rows.map((row) => (row.id === s.id ? { ...row, sku: e.target.value } : row)))
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        className={`${BRAND.classes.input} w-44`}
                        placeholder="POS SKU (optional)"
                        value={s.posSku || ""}
                        onChange={(e) =>
                          setRecipeServings((rows) => rows.map((row) => (row.id === s.id ? { ...row, posSku: e.target.value } : row)))
                        }
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        className={`${BRAND.classes.buttonSecondary} rounded px-2 py-0.5 text-xs`}
                        onClick={() => removeRecipeServing(s.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!recipeServings.length && (
                <tr>
                  <td className="px-2 py-4 text-sm" colSpan={6} style={{ color: BRAND.colors.hint }}>
                    Add at least one serving size (e.g., 6oz) to create sellable SKUs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-xs mt-2" style={{ color: BRAND.colors.hint }}>
          Cost/serving shows in the product table (computed from batch). We can surface it live here later if you want.
        </div>
      </div>
    </div>
  );
}

function IngredientPanel({
  ingUnitKind,
  setIngUnitKind,
  ingPurchaseLabel,
  setIngPurchaseLabel,
  ingQty,
  setIngQty,
  ingQtyUnit,
  setIngQtyUnit,
  ingCostPerPurchase,
  setIngCostPerPurchase,
  ingCostPerUnit,
}) {
  const qtyMl = toMlFromQtyUnit(ingQty, ingQtyUnit);
  const hint = ingUnitKind === "ml" ? (
    <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
      = {formatVolume(qtyMl || 0, { unit: "l", decimals: 2 })}
    </div>
  ) : null;

  return (
    <div
      className="p-4 border"
      style={{ borderColor: BRAND.colors.border, borderRadius: BRAND.radii.card, background: BRAND.colors.surface }}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Purchase label</label>
          <input
            className={`${BRAND.classes.input} w-full`}
            placeholder='e.g., "1L bottle", "10 lb bag", "Case (12 × 1L)"'
            value={ingPurchaseLabel}
            onChange={(e) => setIngPurchaseLabel(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Ingredient unit kind</label>
          <select className={`${BRAND.classes.input} w-full`} value={ingUnitKind} onChange={(e) => setIngUnitKind(e.target.value)}>
            <option value="ml">ml (volume)</option>
            <option value="g">g (weight)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <QtyUnit
            label={ingUnitKind === "ml" ? "Purchase size (volume)" : "Purchase size (weight)"}
            qty={ingQty}
            unit={ingQtyUnit}
            onChange={({ qty, unit }) => {
              setIngQty(qty);
              setIngQtyUnit(unit);
            }}
            hint={hint}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Cost per purchase ($)</label>
          <input
            type="number"
            step="0.01"
            className={`${BRAND.classes.input} w-full`}
            placeholder="e.g., 23.50"
            value={Number.isFinite(ingCostPerPurchase) ? ingCostPerPurchase : ""}
            onChange={(e) => setIngCostPerPurchase(Number(e.target.value))}
          />
        </div>

        <div className="md:col-span-3">
          <div className="text-sm mt-7">
            Computed unit cost: <strong>{ingCostPerUnit ? `$${ingCostPerUnit.toFixed(4)} / ${ingUnitKind}` : "—"}</strong>
          </div>
          <div className="text-xs mt-1" style={{ color: BRAND.colors.hint }}>
            Recipes linked to this ingredient will use this unit cost automatically.
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs" style={{ color: BRAND.colors.hint }}>
        Ingredient products are <strong>non-sellable</strong> and <strong>hidden</strong> by default. Use them in recipes.
      </div>
    </div>
  );
}
