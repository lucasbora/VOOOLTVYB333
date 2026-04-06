import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Star, ArrowLeft, Edit3, Trash2, Check, X, Package, Zap } from 'lucide-react';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const { getItem, updateItem, deleteItem, items } = useApp();
  const navigate = useNavigate();
  const item = getItem(id!);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item ? { ...item } : null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item || !form) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: '#0A0A0A', color: '#FFFFFF' }}>
        <Package size={48} style={{ color: 'rgba(255,229,0,0.3)' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Item not found</p>
        <Link to="/catalog">
          <button style={{ color: '#FFE500', fontSize: '12px', letterSpacing: '0.1em' }}>← BACK TO CATALOG</button>
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    updateItem(item.id, form);
    setEditing(false);
  };

  const handleDelete = () => {
    deleteItem(item.id);
    navigate('/catalog');
  };

  const related = items.filter(i => i.category === item.category && i.id !== item.id).slice(0, 3);

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Back nav */}
      <div className="px-6 lg:px-10 pt-6">
        <Link to="/catalog">
          <motion.button whileHover={{ x: -4 }} className="flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.1em' }}>
            <ArrowLeft size={14} /> BACK TO CATALOG
          </motion.button>
        </Link>
      </div>

      <div className="px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl">
        {/* Image */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <div className="relative overflow-hidden rounded" style={{ aspectRatio: '4/5', border: '1px solid rgba(255,229,0,0.15)' }}>
            <img src={editing ? form.imageUrl || item.imageUrl : item.imageUrl}
              alt={item.name} className="w-full h-full object-cover" />
            {item.featured && (
              <div className="absolute top-4 left-4">
                <span style={{ background: '#FFE500', color: '#0A0A0A', fontSize: '10px', fontWeight: 700, padding: '4px 12px', letterSpacing: '0.1em', fontFamily: "'Orbitron', sans-serif" }}>
                  FEATURED
                </span>
              </div>
            )}
            {!item.inStock && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span style={{ color: '#FF4444', fontFamily: "'Orbitron', sans-serif", fontSize: '24px', fontWeight: 900, letterSpacing: '0.1em', border: '2px solid #FF4444', padding: '8px 24px' }}>
                  SOLD OUT
                </span>
              </div>
            )}
            {/* Color swatch */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.colorHex, border: '2px solid rgba(255,255,255,0.3)' }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>{item.colorName}</span>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div style={{ color: '#FFE500', fontSize: '10px', letterSpacing: '0.3em' }}>
              {item.category.toUpperCase()} / {item.styleTags.join(' · ').toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setEditing(true)}
                    className="p-2 rounded" style={{ background: 'rgba(255,229,0,0.1)', color: '#FFE500', border: '1px solid rgba(255,229,0,0.2)' }}>
                    <Edit3 size={16} />
                  </motion.button>
                  {confirmDelete ? (
                    <div className="flex items-center gap-1">
                      <button onClick={handleDelete} className="p-2 rounded" style={{ background: 'rgba(255,68,68,0.1)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.3)' }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(false)} className="p-2 rounded" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.1 }} onClick={() => setConfirmDelete(true)}
                      className="p-2 rounded" style={{ background: 'rgba(255,68,68,0.08)', color: '#FF4444', border: '1px solid rgba(255,68,68,0.2)' }}>
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={handleSave}
                    className="p-2 rounded" style={{ background: '#FFE500', color: '#0A0A0A' }}>
                    <Check size={16} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => { setEditing(false); setForm({ ...item }); }}
                    className="p-2 rounded" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <X size={16} />
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Name */}
          {editing ? (
            <input value={form.name} onChange={e => setForm(prev => ({ ...prev!, name: e.target.value }))}
              className="mb-3 px-3 py-2 rounded outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #FFE500', color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '24px', fontWeight: 700 }} />
          ) : (
            <h1 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '12px' }}>
              {item.name}
            </h1>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(item.rating) ? '#FFE500' : 'transparent'} color="#FFE500" />
              ))}
            </div>
            {editing ? (
              <input type="number" min="0" max="5" step="0.1" value={form.rating}
                onChange={e => setForm(prev => ({ ...prev!, rating: parseFloat(e.target.value) || 0 }))}
                className="w-16 px-2 py-1 rounded outline-none text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.3)', color: '#FFFFFF', fontSize: '13px' }} />
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{item.rating} / 5.0</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-4 mb-6">
            {editing ? (
              <input type="number" value={form.price}
                onChange={e => setForm(prev => ({ ...prev!, price: parseFloat(e.target.value) || 0 }))}
                className="px-3 py-2 rounded outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.3)', color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '32px', fontWeight: 700, width: '120px' }} />
            ) : (
              <span style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '40px', fontWeight: 700 }}>
                ${item.price}
              </span>
            )}
            <span style={{ color: item.inStock ? '#00E5FF' : '#FF4444', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>
              {item.inStock ? `IN STOCK (${item.stock})` : 'SOLD OUT'}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>DESCRIPTION</div>
            {editing ? (
              <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev!, description: e.target.value }))}
                rows={4} className="w-full px-3 py-2 rounded outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,229,0,0.15)', color: '#FFFFFF', fontSize: '14px', lineHeight: 1.6 }} />
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.7 }}>{item.description}</p>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'MATERIAL', value: item.material },
              { label: 'COLOR', value: item.colorName },
              { label: 'STOCK', value: item.stock.toString() },
              { label: 'STYLE', value: item.styleTags.join(', ') },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', letterSpacing: '0.25em', marginBottom: '4px' }}>{label}</div>
                <div style={{ color: '#FFFFFF', fontSize: '13px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '0.2em', marginBottom: '8px' }}>AVAILABLE SIZES</div>
            <div className="flex flex-wrap gap-2">
              {item.sizes.map(size => (
                <motion.button key={size} whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 rounded"
                  style={{ border: '1px solid rgba(255,229,0,0.3)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em' }}>
                  {size}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {!editing && (
            <div className="flex gap-3 mt-auto">
              <Link to="/style-matcher" className="flex-1">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded"
                  style={{ border: '1px solid rgba(0,229,255,0.4)', color: '#00E5FF', fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <Zap size={16} /> VYBE CHECK
                </motion.button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Related items */}
      {related.length > 0 && (
        <div className="px-6 lg:px-10 py-10 border-t" style={{ borderColor: 'rgba(255,229,0,0.1)' }}>
          <h3 style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
            MORE {item.category.toUpperCase()}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {related.map(rel => (
              <Link key={rel.id} to={`/catalog/${rel.id}`}>
                <motion.div whileHover={{ y: -4 }} className="rounded overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#111111' }}>
                  <img src={rel.imageUrl} alt={rel.name} className="w-full object-cover" style={{ height: 160 }} />
                  <div className="p-3">
                    <div style={{ color: '#FFFFFF', fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 600 }}>{rel.name}</div>
                    <div style={{ color: '#FFE500', fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>${rel.price}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
