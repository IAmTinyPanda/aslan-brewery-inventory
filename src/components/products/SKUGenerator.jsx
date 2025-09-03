// src/components/products/SKUGenerator.jsx
import React from 'react';


function slug(s = '') {
return s.toString().trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}


function code(str = '', len = 3) {
const clean = (str || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
return clean.slice(0, len).padEnd(len, 'X');
}


export default function SKUGenerator({ name, vendor, category, onGenerate }) {
const handle = () => {
const v = code(vendor, 3);
const c = code(category, 2);
const n = slug(name).slice(0, 12);
const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
const sku = [v, c, n, rand].filter(Boolean).join('-');
onGenerate?.(sku);
};


return (
<button type="button" onClick={handle} className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300">
Generate SKU
</button>
);
}