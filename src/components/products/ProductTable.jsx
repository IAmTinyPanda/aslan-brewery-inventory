// src/components/products/ProductTable.jsx — v4.2
// Adds: internal scrolling, Show Ingredients toggle, family-level archive/restore,
// keeps tree (Family ▶ Variant ▶ Serving) and allows collapse even in Detailed.

import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, ChevronRight, Settings, Download, CheckSquare, Square, ArchiveRestore, Filter } from 'lucide-react';

// ---- helpers ----
const fmt = (n, d = 2) => { const x = parseFloat(n); return isFinite(x) ? x.toFixed(d) : '—'; };
const $ = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return '—'; } };

const PREFS_KEY = 'aslan_product_table_prefs_v4';
const defaultPrefs = {
  view: 'compact', // 'compact' | 'full'
  pageSize: 25,
  showIngredients: false, // NEW: hide ingredient/non-sellable by default
  visibleCols: {
    name: true,
    sku: true,
    category: true,
    vendor: true,
    purchaseUnit: true,
    servingUnit: true,
    servingsPerPurchase: true,
    costPerPurchase: true,
    costPerServing: true,
    suggestedPrice: true,
    updatedAt: false,
    isActive: true,
  },
  sort: [{ id: 'name', dir: 'asc' }],
};
function loadPrefs() { try { const p = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null'); return p ? { ...defaultPrefs, ...p, visibleCols: { ...defaultPrefs.visibleCols, ...(p.visibleCols||{}) } } : defaultPrefs; } catch { return defaultPrefs; } }
function savePrefs(p) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch {} }

function createColumns(prefs){
  return [
    { id:'name', label:'Name', visible:true, sortable:true, render:(p)=>p.__servingLabel || p.name || '—', val:(p)=>(p.name||'').toLowerCase() },
    { id:'sku', label:'SKU', visible:prefs.visibleCols.sku, sortable:true, render:(p)=>p.sku||'—', val:(p)=>(p.sku||'').toLowerCase() },
    { id:'category', label:'Category', visible:prefs.visibleCols.category, sortable:true, render:(p)=> p.category ? (p.subcategory? `${p.category} • ${p.subcategory}`: p.category) : '—', val:(p)=>`${(p.category||'').toLowerCase()}|${(p.subcategory||'').toLowerCase()}` },
    { id:'vendor', label:'Vendor', visible:prefs.visibleCols.vendor, sortable:true, render:(p)=>p.vendor||'—', val:(p)=>(p.vendor||'').toLowerCase() },
    { id:'purchaseUnit', label:'Purchase Unit', visible:prefs.visibleCols.purchaseUnit, sortable:false, render:(p)=>{ const u=p.purchaseUnit||{}; return `${u.packQty||1} x ${u.size??'—'} ${u.baseUnit||''} (${u.name||'unit'})`; } },
    { id:'servingUnit', label:'Serving Unit', visible:prefs.visibleCols.servingUnit, sortable:false, render:(p)=>{ const s=p.servingUnit||{}; return `${s.size??'—'} ${s.baseUnit||''} (${s.name||'serving'})`; } },
    { id:'servingsPerPurchase', label:'Servings/Purchase', visible:prefs.visibleCols.servingsPerPurchase, sortable:true, render:(p)=>p.servingsPerPurchase ?? '—', val:(p)=>+(p.servingsPerPurchase||0) },
    { id:'costPerPurchase', label:'Cost/Purchase', visible:prefs.visibleCols.costPerPurchase, sortable:true, render:(p)=>`$${fmt(p.costPerPurchase)}`, val:(p)=>+(p.costPerPurchase||0) },
    { id:'costPerServing', label:'Cost/Serving', visible:prefs.visibleCols.costPerServing, sortable:true, render:(p)=>`$${fmt(p.costPerServing,4)}`, val:(p)=>+(p.costPerServing||0) },
    { id:'suggestedPrice', label:'Suggested Price', visible:prefs.visibleCols.suggestedPrice, sortable:true, render:(p)=> p.suggestedPrice!=null?`$${fmt(p.suggestedPrice)}`:'—', val:(p)=>+(p.suggestedPrice||0) },
    { id:'updatedAt', label:'Updated', visible:prefs.visibleCols.updatedAt, sortable:true, render:(p)=>$(p.updatedAt), val:(p)=> new Date(p.updatedAt||0).getTime() },
    { id:'isActive', label:'Active', visible:prefs.visibleCols.isActive, sortable:true, render:(p)=> (<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${p.isActive? 'bg-green-50 text-green-700 border border-green-200':'bg-gray-50 text-gray-600 border border-gray-200'}`}>{p.isActive? 'Yes':'No'}</span>), val:(p)=> (p.isActive?1:0) },
  ];
}

// ---- hierarchy helpers ----
function keyForFamily(p){ if (p.familyId) return `id:${p.familyId}`; if (p.familyName) return `name:${p.familyName}`; return null; }
function familyTitleFrom(p){ if (p.familyName) return p.familyName; if (p.family?.name) return p.family.name; if (typeof p.name==='string' && p.name.includes(' - ')) return p.name.split(' - ')[0].trim(); return '(Family)'; }
function servingLabelFrom(p){ return (p.servingUnit && p.servingUnit.name) || p.displayLabel || 'Serving'; }
function isIngredientProduct(p){
  // Hide when not sellable or flagged ingredient; be permissive with field names
  if (p.isSellable === false) return true;
  if (p.isIngredient === true) return true;
  const cat = (p.category||'').toLowerCase();
  if (cat === 'ingredient' || cat === 'ingredients') return true;
  return false;
}

function buildHierarchy(products, showIngredients){
  const famMap = new Map();
  const singles = [];
  for (const p of products){
    if (!showIngredients && isIngredientProduct(p)) continue;
    const famKey = keyForFamily(p);
    if (!famKey){ singles.push(p); continue; }
    const fam = famMap.get(famKey) || { key:famKey, id:p.familyId||famKey, name:familyTitleFrom(p), category:p.category||'', vendor:p.vendor||'', variants:new Map() };
    const vLabel = p.subcategory || p.purchaseUnit?.name || 'Variant';
    const v = fam.variants.get(vLabel) || { label:vLabel, items:[] };
    v.items.push({ ...p, __servingLabel: servingLabelFrom(p) });
    fam.variants.set(vLabel, v);
    famMap.set(famKey, fam);
  }
  const families = Array.from(famMap.values()).sort((a,b)=>a.name.localeCompare(b.name));
  for (const f of families){
    f.variantList = Array.from(f.variants.values()).sort((a,b)=>a.label.localeCompare(b.label));
    for (const v of f.variantList){ v.items.sort((a,b)=>{ const sa=a.servingUnit?.size??0, sb=b.servingUnit?.size??0; return sa!==sb? sa-sb : (a.__servingLabel||'').localeCompare(b.__servingLabel||''); }); }
  }
  return { families, singles };
}

export default function ProductTable({ products=[], onEdit, onDelete, onToggleActive }){
  const [prefs,setPrefs] = useState(loadPrefs);
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(prefs.pageSize||25);
  const [colMenu,setColMenu] = useState(false);
  const [selected,setSelected] = useState(()=> new Set());
  const [openFamilies,setOpenFamilies] = useState(()=> new Set());
  const [openVariants,setOpenVariants] = useState(()=> new Set()); // key: famKey::label

  useEffect(()=>{ savePrefs({ ...prefs, pageSize }); },[prefs,pageSize]);

  const columns = useMemo(()=> createColumns(prefs),[prefs]);
  const { families, singles } = useMemo(()=> buildHierarchy(products, prefs.showIngredients),[products, prefs.showIngredients]);

  // Rows for current page
  const rows = useMemo(()=>{
    const list=[];
    const pushFamily=(f)=>{
      list.push({ type:'family', id:f.key, data:f });
      const famOpen = openFamilies.has(f.key); // allow closing even in Detailed
      if(!famOpen && prefs.view !== 'full') return; // in compact, closed stays closed; in full, we will auto-open via effect below
      for (const v of f.variantList){
        const vKey = `${f.key}::${v.label}`;
        list.push({ type:'variant', id:vKey, familyKey:f.key, data:v });
        const varOpen = openVariants.has(vKey);
        if(!varOpen && prefs.view !== 'full') continue;
        for (const p of v.items) list.push({ type:'product', id:p.id, data:p });
      }
    };
    for (const f of families) pushFamily(f);
    for (const p of singles) list.push({ type:'product', id:p.id, data:p });
    return list;
  },[families,singles,openFamilies,openVariants,prefs.view]);

  // Auto-open when entering Detailed, but let user collapse afterward
  useEffect(() => {
    if (prefs.view !== 'full') return;
    const famKeys = new Set(families.map(f => f.key));
    setOpenFamilies(famKeys);
    const varKeys = new Set();
    families.forEach(f => (f.variantList||[]).forEach(v => varKeys.add(`${f.key}::${v.label}`)));
    setOpenVariants(varKeys);
  }, [prefs.view, families]);

  const total = rows.length; const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page,totalPages);
  const start = (safePage-1)*pageSize, end = Math.min(start+pageSize,total);
  const pageRows = rows.slice(start,end);
  const activeCount = useMemo(()=> products.filter(p=>p.isActive).length, [products]);

  const toggleSort = (id, multi=false)=>{ setPrefs(prev=>{ const cur=[...(prev.sort||[])]; const i=cur.findIndex(s=>s.id===id); const next = { ...prev }; if(i===-1) next.sort = multi? [...cur,{id,dir:'asc'}] : [{id,dir:'asc'}]; else { const dir = cur[i].dir==='asc'?'desc':'asc'; next.sort = multi? cur.map((s,idx)=> idx===i?{...s,dir}:s) : [{id,dir}]; } return next; }); };
  const setVisible = (id,val)=> setPrefs(prev=>({ ...prev, visibleCols:{ ...prev.visibleCols, [id]:!!val } }));

  const isPageAllSelected = pageRows.filter(r=>r.type==='product').every(r=> selected.has(r.id));
  const toggleSelectAllOnPage = ()=> setSelected(prev=>{ const next=new Set(prev); const prows=pageRows.filter(r=>r.type==='product'); const all = prows.length>0 && prows.every(r=> next.has(r.id)); if(all) prows.forEach(r=>next.delete(r.id)); else prows.forEach(r=>next.add(r.id)); return next; });
  const toggleSelectRow = (id)=> setSelected(prev=>{ const next=new Set(prev); next.has(id)? next.delete(id): next.add(id); return next; });
  const clearSel = ()=> setSelected(new Set());

  const bulkArchive = async()=>{ for (const id of selected) await onToggleActive?.(id,false); clearSel(); };
  const bulkRestore = async()=>{ for (const id of selected) await onToggleActive?.(id,true); clearSel(); };
  const bulkDelete = async()=>{ if(!confirm(`Delete ${selected.size} product(s)?`)) return; for (const id of selected) await onDelete?.(id); clearSel(); };

  const exportCSV = ()=>{
    const vis = columns.filter(c=>c.visible);
    const just = pageRows.filter(r=>r.type==='product').map(r=>r.data);
    const head = vis.map(c=>`"${c.label.replace(/"/g,'""')}"`).join(',');
    const body = just.map(row => vis.map(c=>{ const v = c.val? c.val(row): (c.render? c.render(row): row[c.id]); return `"${(v??'').toString().replace(/"/g,'""')}"`; }).join(',')).join('\n');
    const csv = head+'\n'+body; const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='aslan_products.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // Family-level archive/restore
  const archiveFamily = async (famKey, active=false) => {
    const fam = families.find(f => f.key === famKey);
    if (!fam) return;
    for (const v of (fam.variantList||[])){
      for (const p of (v.items||[])){
        await onToggleActive?.(p.id, active);
      }
    }
  };

  const Head = ({ col }) => {
    const active = (prefs.sort||[]).find(s=>s.id===col.id);
    return (
      <th className={`text-left font-semibold px-4 py-2 whitespace-nowrap sticky top-0 bg-gray-50 z-10 ${col.sortable?'cursor-pointer select-none':''}`} onClick={(e)=> col.sortable && toggleSort(col.id, e.shiftKey)}>
        <div className="inline-flex items-center gap-1">
          <span>{col.label}</span>
          {active ? (active.dir==='asc'? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>) : null}
        </div>
      </th>
    );
  };

  const FamRow = ({ f }) => {
    const open = openFamilies.has(f.key);
    const famActive = (f.variantList||[]).some(v => (v.items||[]).some(p => p.isActive));
    return (
      <tr className="border-t bg-gray-50/60 hover:bg-gray-50">
        <td className="px-3 py-2">
          <button onClick={()=> setOpenFamilies(prev=>{ const s=new Set(prev); s.has(f.key)? s.delete(f.key): s.add(f.key); return s; })} className="p-1 rounded border bg-white" title={open?'Collapse':'Expand'}>
            {open? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
          </button>
        </td>
        <td className="px-4 py-2 font-semibold" colSpan={columns.filter(c=>c.visible).length - 2}>
          <span className="mr-3">{f.name}</span>
          <span className="text-xs text-gray-500">{f.category}{f.vendor? ` • ${f.vendor}`: ''}</span>
        </td>
        <td className="px-4 py-2" colSpan={3}>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={()=> archiveFamily(f.key, false)} className="p-1 rounded hover:bg-gray-100" title="Archive family"><EyeOff className="h-4 w-4"/></button>
            <button onClick={()=> archiveFamily(f.key, true)} className="p-1 rounded hover:bg-gray-100" title="Restore family"><Eye className="h-4 w-4"/></button>
          </div>
        </td>
      </tr>
    );
  };

  const VarRow = ({ fKey, v }) => {
    const key = `${fKey}::${v.label}`;
    const open = openVariants.has(key);
    return (
      <tr className="border-t bg-white hover:bg-gray-50/50">
        <td className="px-3 py-2"/>
        <td className="px-4 py-2" colSpan={columns.filter(c=>c.visible).length + 1}>
          <div className="flex items-center gap-2">
            <button onClick={()=> setOpenVariants(prev=>{ const s=new Set(prev); s.has(key)? s.delete(key): s.add(key); return s; })} className="p-1 rounded border bg-white" title={open?'Collapse':'Expand'}>
              {open? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
            </button>
            <span className="font-medium">{v.label}</span>
          </div>
        </td>
      </tr>
    );
  };

  const ProdRow = ({ p }) => (
    <tr className="border-t hover:bg-gray-50/50">
      <td className="px-3 py-2">
        <label className="inline-flex items-center"><input type="checkbox" className="mr-2" checked={selected.has(p.id)} onChange={()=> toggleSelectRow(p.id)} /></label>
      </td>
      {columns.filter(c=>c.visible).map(col => (
        <td key={col.id} className="px-4 py-2 whitespace-nowrap">{col.render(p)}</td>
      ))}
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button onClick={()=> onEdit?.(p)} className="p-1 rounded hover:bg-gray-100" title="Edit"><Edit2 className="h-4 w-4"/></button>
          <button onClick={()=> onToggleActive?.(p.id, !p.isActive)} className="p-1 rounded hover:bg-gray-100" title={p.isActive ? 'Archive':'Restore'}>
            {p.isActive? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
          <button onClick={()=> onDelete?.(p.id)} className="p-1 rounded hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="h-4 w-4"/></button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-b">
        <div className="text-sm text-gray-600">Active products: {activeCount} • Rows {start+1}-{end} of {total}</div>
        <div className="flex items-center gap-2">
          {/* Show Ingredients toggle */}
          <label className="inline-flex items-center gap-2 px-2 py-1 rounded border bg-white">
            <input type="checkbox" checked={prefs.showIngredients} onChange={(e)=> setPrefs(p=>({ ...p, showIngredients: e.target.checked }))} />
            <span className="text-sm">Show ingredients</span>
          </label>

          {selected.size>0 && (
            <div className="flex items-center gap-2">
              <button onClick={bulkArchive} className="px-2 py-1 text-sm rounded border">Archive</button>
              <button onClick={bulkRestore} className="px-2 py-1 text-sm rounded border">Restore</button>
              <button onClick={bulkDelete} className="px-2 py-1 text-sm rounded border text-red-600">Delete</button>
              <span className="text-xs text-gray-500">{selected.size} selected</span>
            </div>
          )}
          <button onClick={exportCSV} className="inline-flex items-center gap-1 px-2 py-1 rounded border" title="Export CSV"><Download className="h-4 w-4"/> Export</button>
          <div className="relative">
            <button onClick={()=> setColMenu(v=>!v)} className="inline-flex items-center gap-1 px-2 py-1 rounded border" title="Columns"><Settings className="h-4 w-4"/> View & Columns</button>
            {colMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg p-2 z-20">
                <div className="text-xs font-semibold text-gray-600 px-2 py-1">Visible Columns (product rows)</div>
                {Object.keys(prefs.visibleCols).map(key => key==='name'? null : (
                  <label key={key} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={!!prefs.visibleCols[key]} onChange={(e)=> setVisible(key, e.target.checked)} />
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g,' $1')}</span>
                  </label>
                ))}
                <div className="border-t my-2"/>
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-sm">View</span>
                  <div className="space-x-1">
                    <button onClick={()=> setPrefs(p=>({ ...p, view:'compact' }))} className={`px-2 py-0.5 text-sm rounded border ${prefs.view==='compact'?'bg-gray-100':''}`}>Compact</button>
                    <button onClick={()=> setPrefs(p=>({ ...p, view:'full' }))} className={`px-2 py-0.5 text-sm rounded border ${prefs.view==='full'?'bg-gray-100':''}`}>Detailed</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows:</span>
            <select value={pageSize} onChange={(e)=>{ setPageSize(+e.target.value); setPage(1); }} className="border rounded px-2 py-1 bg-white text-sm">
              {[10,25,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* table — internal scroll */}
      <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                <button onClick={toggleSelectAllOnPage} className="p-1 rounded border">{isPageAllSelected? <CheckSquare className="h-4 w-4"/> : <Square className="h-4 w-4"/>}</button>
              </th>
              {columns.filter(c=>c.visible).map(col=> <Head key={col.id} col={col} />)}
              <th className="text-left font-semibold px-4 py-2 whitespace-nowrap sticky top-0 bg-gray-50 z-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => {
              if (r.type==='family') return <FamRow key={`fam-${r.id}`} f={r.data} />;
              if (r.type==='variant') return <VarRow key={`var-${r.id}`} fKey={r.familyKey} v={r.data} />;
              return <ProdRow key={`prod-${r.id}`} p={r.data} />;
            })}
            {pageRows.length===0 && (
              <tr><td colSpan={columns.filter(c=>c.visible).length + 2} className="px-4 py-8 text-center text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
        <div className="text-gray-600">Page {safePage} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{ setPage(1); clearSel(); }} disabled={safePage===1} className="px-2 py-1 rounded border disabled:opacity-50">First</button>
          <button onClick={()=>{ setPage(p=>Math.max(1,p-1)); clearSel(); }} disabled={safePage===1} className="px-2 py-1 rounded border disabled:opacity-50">Prev</button>
          <button onClick={()=>{ setPage(p=>Math.min(totalPages,p+1)); clearSel(); }} disabled={safePage===totalPages} className="px-2 py-1 rounded border disabled:opacity-50">Next</button>
          <button onClick={()=>{ setPage(totalPages); clearSel(); }} disabled={safePage===totalPages} className="px-2 py-1 rounded border disabled:opacity-50">Last</button>
        </div>
      </div>
    </div>
  );
}
