// src/components/products/ProductForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Calculator, AlertTriangle } from "lucide-react";
import { fohCategories } from "../../data/categories";
import SKUGenerator from "./SKUGenerator";
import {
  servingsPerPurchase,
  costPerServing,
  suggestedPrice,
  sameFamily,
} from "../../utils/units";

/**
 * Product form goals:
 * - Master catalog entry for anything you buy/sell (beer, wine, cider, NA, liquor, kitchen, etc.)
 * - Purchase unit + Serving unit with conversions and yield loss
 * - Vendor & category mapping for POS/reporting alignment
 * - Live derived fields: Servings per purchase, Cost/Serving, Suggested Price (optional margin)
 * - Archive/Active toggle
 * - Safe defaults; validation on key fields; friendly UI
 */

const DEFAULT_FORM = {
  id: null,
  name: "",
  sku: "",
  category: "",
  subcategory: "",
  vendor: "",
  description: "",
  isActive: true,

  purchaseUnit: { name: "", size: 0, packQty: 1, baseUnit: "L" }, // how you buy
  servingUnit: { name: "", size: 0, baseUnit: "oz", yieldLossPct: 0 }, // how you sell

  costPerPurchase: 0,
  targetMarginPct: 0, // optional
  // Derived (computed on submit/display):
  // servingsPerPurchase
  // costPerServing
  // suggestedPrice
};

const UNIT_OPTIONS = [
  { label: "Each", value: "each" },
  { label: "ml", value: "ml" },
  { label: "L", value: "L" },
  { label: "oz", value: "oz" },
  { label: "gal", value: "gal" },
  { label: "g", value: "g" },
  { label: "lb", value: "lb" },
];

export default function ProductForm({ isOpen, onClose, onSave, product }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  const isEditing = !!(product && product.id);

  // Initialize form on open/product change
  useEffect(() => {
    if (product) setForm({ ...DEFAULT_FORM, ...product });
    else setForm(DEFAULT_FORM);
    setErrors({});
  }, [product, isOpen]);

  // Derived metrics
  const derived = useMemo(() => {
    // sanity: serving & purchase units must be compatible
    const compatible = sameFamily(
      form.purchaseUnit?.baseUnit,
      form.servingUnit?.baseUnit
    );

    const servings = compatible
      ? Math.floor(servingsPerPurchase(form.purchaseUnit, form.servingUnit))
      : 0;

    const cps = costPerServing(form.costPerPurchase, servings);
    const sp =
      form.targetMarginPct > 0 ? suggestedPrice(cps, form.targetMarginPct) : undefined;

    return { compatible, servings, cps, sp };
  }, [form]);

  // Helpers
  const onChange = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        cur[key] = Array.isArray(cur[key]) ? [...cur[key]] : { ...(cur[key] || {}) };
        cur = cur[key];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required.";
    if (!form.category) e.category = "Category is required.";
    if (!form.vendor?.trim()) e.vendor = "Vendor is required.";
    if (!form.purchaseUnit?.baseUnit) e.purchaseUnit = "Purchase unit is required.";
    if (!form.servingUnit?.baseUnit) e.servingUnit = "Serving unit is required.";
    if (Number(form.purchaseUnit?.size) <= 0) e.purchaseSize = "Purchase size must be > 0.";
    if (Number(form.servingUnit?.size) <= 0) e.servingSize = "Serving size must be > 0.";
    if (!derived.compatible)
      e.unitFamily = "Purchase and serving units must be in the same unit family (volume↔volume, mass↔mass, or 'each').";
    if (Number(form.costPerPurchase) < 0) e.cost = "Cost cannot be negative.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      servingsPerPurchase: derived.servings,
      costPerServing: +derived.cps.toFixed(4),
      suggestedPrice: derived.sp,
      updatedAt: new Date().toISOString(),
    };

    onSave?.(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {isEditing ? "Edit Product" : "Add Product"}
            </h3>
            <p className="text-xs text-gray-500">
              Master catalog entry • Conversions & pricing update live
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" aria-label="Close">
            <X />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Basics */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.name ? "border-red-400" : ""}`}
                placeholder="House IPA (Keg)"
              />
              {errors.name && (
                <div className="text-xs text-red-600 mt-1">{errors.name}</div>
              )}
            </div>

            {/* SKU + Generator */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => onChange("sku", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="DKR-BR-IPA-1234"
                />
              </div>
              <SKUGenerator
                name={form.name}
                vendor={form.vendor}
                category={form.category}
                onGenerate={(sku) => onChange("sku", sku)}
              />
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-sm font-medium mb-1">Vendor</label>
              <input
                value={form.vendor}
                onChange={(e) => onChange("vendor", e.target.value)}
                className={`w-full border rounded px-3 py-2 ${errors.vendor ? "border-red-400" : ""}`}
                placeholder="Dickerson, Coca-Cola, BCC, etc."
              />
              {errors.vendor && (
                <div className="text-xs text-red-600 mt-1">{errors.vendor}</div>
              )}
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => onChange("category", e.target.value)}
                  className={`w-full border rounded px-3 py-2 bg-white ${errors.category ? "border-red-400" : ""}`}
                >
                  <option value="">Select…</option>
                  {Array.isArray(fohCategories) &&
                    fohCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
                {errors.category && (
                  <div className="text-xs text-red-600 mt-1">{errors.category}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Subcategory (optional)
                </label>
                <input
                  value={form.subcategory}
                  onChange={(e) => onChange("subcategory", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="IPA, Syrup, Red, etc."
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => onChange("isActive", e.target.checked)}
              />
              <label htmlFor="active" className="text-sm">
                Active (uncheck to archive)
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="Notes for your team…"
              />
            </div>
          </div>

          {/* RIGHT: Units & Pricing */}
          <div className="space-y-4">
            {/* Purchase Unit */}
            <div className="p-3 rounded-lg border">
              <div className="font-semibold mb-2">Purchase Unit (how you buy)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit name</label>
                  <input
                    value={form.purchaseUnit.name}
                    onChange={(e) => onChange("purchaseUnit.name", e.target.value)}
                    className={`w-full border rounded px-3 py-2 ${errors.purchaseUnit ? "border-red-400" : ""}`}
                    placeholder="keg / case / bag"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pack Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={form.purchaseUnit.packQty ?? 1}
                    onChange={(e) =>
                      onChange("purchaseUnit.packQty", +e.target.value || 1)
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Size per Unit
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.purchaseUnit.size}
                    onChange={(e) =>
                      onChange("purchaseUnit.size", +e.target.value || 0)
                    }
                    className={`w-full border rounded px-3 py-2 ${errors.purchaseSize ? "border-red-400" : ""}`}
                    placeholder="e.g., 58.67 (L) for 1/2 BBL"
                  />
                  {errors.purchaseSize && (
                    <div className="text-xs text-red-600 mt-1">{errors.purchaseSize}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Unit</label>
                  <select
                    value={form.purchaseUnit.baseUnit}
                    onChange={(e) => onChange("purchaseUnit.baseUnit", e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-white"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Serving Unit */}
            <div className="p-3 rounded-lg border">
              <div className="font-semibold mb-2">Serving Unit (how you sell)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Serving name</label>
                  <input
                    value={form.servingUnit.name}
                    onChange={(e) => onChange("servingUnit.name", e.target.value)}
                    className={`w-full border rounded px-3 py-2 ${errors.servingUnit ? "border-red-400" : ""}`}
                    placeholder="pint / 2oz / 6oz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.servingUnit.size}
                    onChange={(e) =>
                      onChange("servingUnit.size", +e.target.value || 0)
                    }
                    className={`w-full border rounded px-3 py-2 ${errors.servingSize ? "border-red-400" : ""}`}
                  />
                  {errors.servingSize && (
                    <div className="text-xs text-red-600 mt-1">{errors.servingSize}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Base Unit</label>
                  <select
                    value={form.servingUnit.baseUnit}
                    onChange={(e) => onChange("servingUnit.baseUnit", e.target.value)}
                    className="w-full border rounded px-3 py-2 bg-white"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yield Loss %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.servingUnit.yieldLossPct ?? 0}
                    onChange={(e) =>
                      onChange(
                        "servingUnit.yieldLossPct",
                        +e.target.value || 0
                      )
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {!derived.compatible && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    Purchase and serving units must be from the same unit family
                    (volume↔volume, mass↔mass, or <em>each</em>).
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="p-3 rounded-lg border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cost per Purchase Unit ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={form.costPerPurchase}
                    onChange={(e) =>
                      onChange("costPerPurchase", +e.target.value || 0)
                    }
                    className={`w-full border rounded px-3 py-2 ${errors.cost ? "border-red-400" : ""}`}
                  />
                  {errors.cost && (
                    <div className="text-xs text-red-600 mt-1">{errors.cost}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target Margin % (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={95}
                    value={form.targetMarginPct ?? 0}
                    onChange={(e) =>
                      onChange("targetMarginPct", +e.target.value || 0)
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Derived */}
              <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                <div className="p-2 border rounded-lg">
                  <div className="font-semibold">Servings / Purchase</div>
                  <div>{derived.servings || 0}</div>
                </div>
                <div className="p-2 border rounded-lg">
                  <div className="font-semibold">Cost / Serving</div>
                  <div>${(derived.cps || 0).toFixed(4)}</div>
                </div>
                <div className="p-2 border rounded-lg">
                  <div className="font-semibold">Suggested Price</div>
                  <div>{derived.sp ? `$${derived.sp.toFixed(2)}` : "—"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                <Calculator className="h-4 w-4" />
                <span>Suggested price = cost / (1 - margin)</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800 inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isEditing ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
