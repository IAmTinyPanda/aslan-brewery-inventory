// src/services/productService.js
// LocalStorage-backed service for now. Swap with real API later.


const KEY = 'aslan_products_v1';


function read() {
try { return JSON.parse(localStorage.getItem(KEY)) || []; }
catch { return []; }
}
function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }


export async function fetchAll() {
return read();
}


export async function create(data) {
const now = new Date().toISOString();
const id = crypto.randomUUID?.() || String(Date.now());
const item = { ...data, id, createdAt: now, updatedAt: now };
const items = read();
items.push(item); write(items);
return item;
}


export async function update(data) {
const items = read();
const i = items.findIndex(p => p.id === data.id);
if (i < 0) throw new Error('Product not found');
const now = new Date().toISOString();
items[i] = { ...items[i], ...data, updatedAt: now };
write(items);
return items[i];
}


export async function remove(id) {
const items = read().filter(p => p.id !== id);
write(items);
return { id };
}


export async function setActive(id, isActive) {
const items = read();
const i = items.findIndex(p => p.id === id);
if (i < 0) throw new Error('Product not found');
const now = new Date().toISOString();
items[i] = { ...items[i], isActive: !!isActive, updatedAt: now };
write(items);
return items[i];
}