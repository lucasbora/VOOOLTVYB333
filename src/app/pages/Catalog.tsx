import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { trackPreferredCategory } from '../utils/cookieTracker';
import { ClothingItem, Category } from '../data/items';
import {
  Plus, Search, Trash2, Edit3,
  Filter, Star, X, Check, Package, Loader2,
} from 'lucide-react';

const BATCH = 10;
const CATEGORIES: Category[] = ['tee', 'pants', 'cap', 'hoodie', 'jacket', 'shorts', 'bag', 'shoes', 'socks', 'accessories'];

// ─── Validation ───────────────────────────────────────────────────────────────
interface FormErrors {
  name?: string; price?: string; rating?: string; stock?: string;
  colorName?: string; material?: string; imageUrl?: string; description?: string;
}

function validateForm(form: Omit<ClothingItem, 'id'>): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  else if (form.name.trim().length < 3) errors.name = 'Name must be at least 3 characters.';
  else if (form.name.trim().length > 60) errors.name = 'Name must be under 60 characters.';
  if (form.price <= 0) errors.price = 'Price must be greater than 0.';
  else if (form.price > 10000) errors.price = 'Price seems unrealistic (max $10,000).';
  if (form.rating < 0 || form.rating > 5) errors.rating = 'Rating must be between 0 and 5.';
  if (form.stock < 0) errors.stock = 'Stock cannot be negative.';
  else if (!Number.isInteger(form.stock)) errors.stock = 'Stock must be a whole number.';
  if (!form.colorName.trim()) errors.colorName = 'Color name is required.';
  if (!form.material.trim()) errors.material = 'Material is required.';
  if (!form.imageUrl.trim()) errors.imageUrl = 'Image URL is required.';
  else if (!/^https?:\/\/.+/.test(form.imageUrl.trim())) errors.imageUrl = 'Image URL must start with http:// or https://';
  if (!form.description.trim()) errors.description = 'Description is required.';
  else if (form.description.length > 500) errors.description = 'Description must be under 500 characters.';
  return errors;
}

const emptyForm = (): Omit<ClothingItem, 'id'> => ({
  name: '', category: 'tee', price: 0,
  colorHex: '#FFE500', colorName: '', colorGroup: 'vibrant',
  styleTags: ['streetwear'], rating: 4.0, description: '',
  material: '', sizes: ['S', 'M', 'L'], inStock: true,
  imageUrl: '', featured: false, stock: 10,
});

export function Catalog() {
  const { items, addItem, deleteItem, updateItem, isOnline } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'price' | 'rating' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [stockInput, setStockInput] = useState('10');

  // ── Infinite scroll state ──────────────────────────────────────────────────
  const [displayCount, setDisplayCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prefetchedRef = useRef<number>(BATCH * 2); // prefetch 2 batches ahead

  const catFilter = searchParams.get('category') || '';

  const filtered = useMemo(() => {
    let list = [...items];
    if (catFilter) list = list.filter(i => i.category === catFilter);
    if (search) list = list.filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, catFilter, search, sortField, sortDir]);

  // Reset display when filters change
  useEffect(() => {
    setDisplayCount(BATCH);
    prefetchedRef.current = BATCH * 2;
  }, [catFilter, search, sortField, sortDir]);

  // IntersectionObserver — load next batch + prefetch next-next batch
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && displayCount < filtered.length) {
        // Reveal next batch (data already in memory — backend pagination was used on load)
        setDisplayCount(prev => Math.min(prev + BATCH, filtered.length));
        // Prefetch one more batch so it's ready before user scrolls again
        prefetchedRef.current = Math.min(displayCount + BATCH * 2, filtered.length);
      }
    }, { rootMargin: '200px', threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [displayCount, filtered.length]);

  const paged = filtered.slice(0, displayCount);
  const hasMore = displayCount < filtered.length;

  const openAdd = () => {
    const next = emptyForm();
    setForm(next);
    setStockInput(String(next.stock));
    setEditingItem(null);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item: ClothingItem) => {
    setForm({ ...item });
    setStockInput(String(item.stock));
    setEditingItem(item);
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = () => {
    const parsedStock = stockInput === '' ? 0 : Number(stockInput);
    const normalized = {
      ...form,
      stock: Number.isFinite(parsedStock) ? parsedStock : 0,
      inStock: (Number.isFinite(parsedStock) ? parsedStock : 0) > 0,
    };

    const errors = validateForm(normalized);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (editingItem) updateItem(editingItem.id, normalized);
    else addItem(normalized);
    setShowModal(false);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span style={{ color: sortField === field ? '#FFE500' : 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
      {sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
    </span>
  );

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }} className="p-6 lg:p-10">

      {/* Offline banner */}
      {!isOnline && (
        <div className="mb-4 px-4 py-2 rounded flex items-center gap-2"
          style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444', fontSize: '12px', letterSpacing: '0.1em' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF4444', display: 'inline-block' }} />
          OFFLINE — changes will sync when connection is restored
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.4em', marginBottom: '4px' }}>// MASTER CATALOG</div>
          <h1 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
            ALL ITEMS
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginTop: '4px' }}>
            {paged.length} / {filtered.length} items shown {catFilter && `in ${catFilter.toUpperCase()}`}
          </p>
        </div>
        <motion.button onClick={openAdd} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 rounded"
          style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>
          <Plus size={14} /> ADD ITEM
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2.5 rounded outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.15)', color: '#FFFFFF', fontSize: '13px' }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setSearchParams({}); trackPreferredCategory('all'); }}
            className="px-3 py-2 rounded text-xs"
            style={{ background: !catFilter ? '#FFE500' : 'transparent', color: !catFilter ? '#0A0A0A' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,229,0,0.2)', fontWeight: 600, letterSpacing: '0.1em' }}>
            ALL
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setSearchParams({ category: cat }); trackPreferredCategory(cat); }}
              className="px-3 py-2 rounded text-xs"
              style={{ background: catFilter === cat ? '#FFE500' : 'transparent', color: catFilter === cat ? '#0A0A0A' : 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,229,0,0.2)', fontWeight: 600, letterSpacing: '0.08em' }}>
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(255,229,0,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,229,0,0.08)', borderBottom: '1px solid rgba(255,229,0,0.2)' }}>
                <th className="text-left px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>IMAGE</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleSort('name')}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>
                  NAME <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>CATEGORY</th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleSort('price')}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>
                  PRICE <SortIcon field="price" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleSort('rating')}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>
                  RATING <SortIcon field="rating" />
                </th>
                <th className="text-left px-4 py-3 cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => handleSort('stock')}
                  style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>
                  STOCK <SortIcon field="stock" />
                </th>
                <th className="text-left px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>STATUS</th>
                <th className="text-left px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paged.map((item, i) => (
                  <motion.tr key={item.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="group"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td className="px-4 py-3">
                      <img src={item.imageUrl} alt={item.name} className="rounded object-cover" style={{ width: 40, height: 40 }} />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/catalog/${item.id}`}>
                        <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.03em' }}
                          className="hover:text-yellow-400 transition-colors cursor-pointer">
                          {item.name}
                        </span>
                        {item.featured && (
                          <span className="ml-2" style={{ background: '#FFE500', color: '#0A0A0A', fontSize: '8px', fontWeight: 700, padding: '1px 5px', letterSpacing: '0.1em' }}>HOT</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', letterSpacing: '0.1em' }}>{item.category.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 700 }}>${item.price}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star size={11} fill="#FFE500" color="#FFE500" />
                        <span style={{ color: '#FFFFFF', fontSize: '13px' }}>{item.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: item.stock > 20 ? '#00E5FF' : item.stock > 5 ? '#FFE500' : '#FF4444', fontSize: '13px', fontWeight: 600 }}>{item.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', padding: '3px 8px',
                        background: item.inStock ? 'rgba(0,229,255,0.1)' : 'rgba(255,68,68,0.1)',
                        color: item.inStock ? '#00E5FF' : '#FF4444',
                        border: `1px solid ${item.inStock ? 'rgba(0,229,255,0.3)' : 'rgba(255,68,68,0.3)'}`,
                        borderRadius: '3px',
                      }}>
                        {item.inStock ? 'IN STOCK' : 'SOLD OUT'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-yellow-400/10 transition-colors" style={{ color: '#FFE500' }}>
                          <Edit3 size={14} />
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { deleteItem(item.id); setDeleteConfirm(null); }} className="p-1.5 rounded" style={{ color: '#FF4444', background: 'rgba(255,68,68,0.1)' }}>
                              <Check size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" style={{ color: 'rgba(255,100,100,0.6)' }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Package size={40} style={{ color: 'rgba(255,229,0,0.3)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No items found</p>
          </div>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-6">
        {hasMore ? (
          <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>
            <Loader2 size={14} className="animate-spin" />
            LOADING MORE...
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', letterSpacing: '0.2em' }}>
            — ALL {filtered.length} ITEMS LOADED —
          </div>
        ) : null}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl rounded-lg overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(255,229,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,229,0,0.15)' }}>
                <h2 style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                  {editingItem ? 'EDIT ITEM' : 'ADD NEW ITEM'}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={20} /></button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { label: 'NAME *', key: 'name', type: 'text', placeholder: 'VOLT TEE' },
                  { label: 'PRICE ($)', key: 'price', type: 'number', placeholder: '45' },
                  { label: 'COLOR NAME', key: 'colorName', type: 'text', placeholder: 'Electric Yellow' },
                  { label: 'MATERIAL', key: 'material', type: 'text', placeholder: '100% Cotton' },
                  { label: 'STOCK', key: 'stock', type: 'number', placeholder: '20' },
                  { label: 'RATING (0-5)', key: 'rating', type: 'number', placeholder: '4.5' },
                  { label: 'IMAGE URL', key: 'imageUrl', type: 'text', placeholder: 'https://...' },
                  { label: 'COLOR HEX', key: 'colorHex', type: 'color', placeholder: '' },
                ] as const).map(({ label, key, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '4px' }}>{label}</label>
                    <input type={key === 'stock' ? 'text' : type} placeholder={placeholder}
                      inputMode={key === 'stock' ? 'numeric' : undefined}
                      value={key === 'stock' ? stockInput : ((form as any)[key] ?? '')}
                      onChange={e => {
                        if (key === 'stock') {
                          const raw = e.target.value;
                          if (!/^\d*$/.test(raw)) return;
                          setStockInput(raw);
                          setForm(prev => ({ ...prev, stock: raw === '' ? 0 : parseInt(raw, 10) }));
                          return;
                        }

                        setForm(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }));
                      }}
                      className="w-full px-3 py-2.5 rounded outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${formErrors[key as keyof FormErrors] ? '#FF4444' : 'rgba(255,229,0,0.15)'}`, color: '#FFFFFF', fontSize: '13px' }} />
                    {formErrors[key as keyof FormErrors] && <p style={{ color: '#FF4444', fontSize: '10px', marginTop: '2px' }}>{formErrors[key as keyof FormErrors]}</p>}
                  </div>
                ))}

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '4px' }}>CATEGORY</label>
                  <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value as Category }))}
                    className="w-full px-3 py-2.5 rounded outline-none"
                    style={{ background: '#1A1A1A', border: '1px solid rgba(255,229,0,0.15)', color: '#FFFFFF', fontSize: '13px' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '4px' }}>COLOR GROUP</label>
                  <select value={form.colorGroup} onChange={e => setForm(prev => ({ ...prev, colorGroup: e.target.value as any }))}
                    className="w-full px-3 py-2.5 rounded outline-none"
                    style={{ background: '#1A1A1A', border: '1px solid rgba(255,229,0,0.15)', color: '#FFFFFF', fontSize: '13px' }}>
                    {['warm', 'cool', 'neutral', 'vibrant', 'dark'].map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', display: 'block', marginBottom: '4px' }}>DESCRIPTION</label>
                  <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3} placeholder="Item description..."
                    className="w-full px-3 py-2.5 rounded outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${formErrors.description ? '#FF4444' : 'rgba(255,229,0,0.15)'}`, color: '#FFFFFF', fontSize: '13px' }} />
                  {formErrors.description && <p style={{ color: '#FF4444', fontSize: '10px', marginTop: '2px' }}>{formErrors.description}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.inStock} onChange={e => setForm(prev => ({ ...prev, inStock: e.target.checked }))} />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em' }}>IN STOCK</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))} />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em' }}>FEATURED</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 pt-0">
                <button onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '0.1em' }}>
                  CANCEL
                </button>
                <button onClick={handleSubmit}
                  className="px-6 py-2.5 rounded flex items-center gap-2"
                  style={{ background: '#FFE500', color: '#0A0A0A', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <Check size={14} />
                  {editingItem ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
