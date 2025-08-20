// src/components/products/ProductList.jsx — v3.3 (Add flow with Single vs Family toggle)
// - Add button now supports choosing between: Single Product or Product Family
// - Remembers last-used create mode
// - Categories & vendors derived from products (no external dep)
// - Compatible with ProductForm, ProductFamilyForm, productService

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RotateCcw, ChevronDown, PackagePlus, Beer } from 'lucide-react';
import * as productSvc from '../../services/productService';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import ProductFamilyForm from './ProductFamilyForm';

// small debounce to keep typing smooth
function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

const CREATE_MODE_KEY = 'aslan_create_mode_v1';
function loadCreateMode() {
  try { return localStorage.getItem(CREATE_MODE_KEY) || 'single'; } catch { return 'single'; }
}
function saveCreateMode(m) { try { localStorage.setItem(CREATE_MODE_KEY, m); } catch { /* noop */ } }

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // create flow state
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createMode, setCreateMode] = useState(loadCreateMode); // 'single' | 'family'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [cat, setCat] = useState('');
  const [vendor, setVendor] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // load products
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (typeof productSvc.fetchAll !== 'function') throw new Error('productService.fetchAll is not defined');
        const data = await productSvc.fetchAll();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // derive category & vendor lists from items
  const categories = useMemo(() => {
    const set = new Set((items || []).map(p => (p.category || '').trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [items]);

  const vendors = useMemo(() => {
    const set = new Set((items || []).map(p => (p.vendor || '').trim()).filter(Boolean));
    return Array.from(set).sort((a,b) => a.localeCompare(b));
  }, [items]);

  // apply filters
  const filtered = useMemo(() => {
    let arr = [...(items || [])];
    if (!showInactive) arr = arr.filter(p => p.isActive !== false);
    if (cat) arr = arr.filter(p => p.category === cat);
    if (vendor) arr = arr.filter(p => (p.vendor || '').toLowerCase() === vendor.toLowerCase());
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      arr = arr.filter(p => [p.name, p.sku, p.vendor, p.category, p.subcategory]
        .some(x => (x || '').toLowerCase().includes(q)));
    }
    return arr;
  }, [items, showInactive, cat, vendor, debouncedSearch]);

  // open flow helpers
  const openCreateDefault = () => {
    if (createMode === 'single') { setEditing(null); setIsFormOpen(true); }
    if (createMode === 'family') { setIsFamilyOpen(true); }
  };
  const chooseMode = (mode) => {
    setCreateMode(mode); saveCreateMode(mode); setCreateMenuOpen(false);
    if (mode === 'single') { setEditing(null); setIsFormOpen(true); }
    if (mode === 'family') { setIsFamilyOpen(true); }
  };

  const openEdit = (p) => { setEditing(p); setIsFormOpen(true); };

  const handleSave = async (payload) => {
    try {
      if (payload.id) {
        if (typeof productSvc.update !== 'function') throw new Error('productService.update is not defined');
        const updated = await productSvc.update(payload);
        setItems(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        if (typeof productSvc.create !== 'function') throw new Error('productService.create is not defined');
        const created = await productSvc.create(payload);
        setItems(prev => [...prev, created]);
      }
      setIsFormOpen(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      if (typeof productSvc.remove !== 'function') throw new Error('productService.remove is not defined');
      await productSvc.remove(id);
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); alert(e?.message || 'Delete failed'); }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      if (typeof productSvc.setActive !== 'function') throw new Error('productService.setActive is not defined');
      const updated = await productSvc.setActive(id, isActive);
      setItems(prev => prev.map(p => p.id === id ? updated : p));
    } catch (e) { console.error(e); alert(e?.message || 'Update failed'); }
  };

  const resetFilters = () => { setSearch(''); setCat(''); setVendor(''); setShowInactive(false); };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-gray-600">Master catalog for everything you buy and sell.</p>
        </div>
        <div className="relative">
          <div className="inline-flex rounded-md shadow-sm overflow-hidden border">
            <button onClick={openCreateDefault} className="inline-flex items-center gap-2 px-3 py-2 bg-green-700 text-white hover:bg-green-800">
              <Plus className="h-4 w-4"/>
              {createMode === 'single' ? 'Add Product' : 'Add Family'}
            </button>
            <button onClick={()=>setCreateMenuOpen(v=>!v)} className="px-2 py-2 bg-green-700 text-white hover:bg-green-800 border-l border-white/20">
              <ChevronDown className="h-4 w-4"/>
            </button>
          </div>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg overflow-hidden z-20">
              <button onClick={()=>chooseMode('single')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
                <PackagePlus className="h-4 w-4"/> Single Product
              </button>
              <button onClick={()=>chooseMode('family')} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
                <Beer className="h-4 w-4"/> Product Family (Variants + Serving)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* filters */}
      <div className="bg-white border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/>
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                placeholder="Name, SKU, vendor, category…"
                className="w-full border rounded pl-9 pr-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={cat} onChange={(e)=>setCat(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
              <option value="">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <select value={vendor} onChange={(e)=>setVendor(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
              <option value="">All</option>
              {vendors.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)} />
            <span className="text-sm">Show inactive</span>
          </label>
          <button onClick={resetFilters} className="inline-flex items-center gap-2 px-3 py-1.5 rounded border">
            <RotateCcw className="h-4 w-4"/> Reset
          </button>
        </div>
      </div>

      {/* table */}
      {loading ? (
        <div className="text-center text-gray-500">Loading…</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <ProductTable
          products={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Single product modal */}
      <ProductForm
        isOpen={isFormOpen}
        product={editing}
        onClose={() => { setIsFormOpen(false); setEditing(null); }}
        onSave={handleSave}
      />

      {/* Family modal */}
      <ProductFamilyForm
        isOpen={isFamilyOpen}
        onClose={() => setIsFamilyOpen(false)}
        onCreated={(created=[]) => setItems(prev => [...prev, ...created])}
      />
    </div>
  );
}
