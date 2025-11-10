'use client';

import { useState, useEffect } from 'react';
import { productSchema, ProductInput } from '@/lib/validation';

interface ProductFormProps {
  initialData?: any;
  onSave: (data: ProductInput) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    category_id: initialData?.category_id || 0,
    description: initialData?.description || '',
    price: initialData?.price || 0,
    base_weight: initialData?.base_weight || 1,
    event_types: initialData?.event_types || [],
    filling_ids: initialData?.filling_ids || [],
    images: initialData?.images || [],
    active: initialData?.active ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [fillings, setFillings] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await fetch('/api/categories').then(r => r.json());
      const { data: fills } = await fetch('/api/fillings').then(r => r.json());
      setCategories(cats || []);
      setFillings(fills || []);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = productSchema.parse(form);
      await onSave(validated);
    } catch (error: any) {
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      }
    }
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      event_types: prev.event_types.includes(event)
        ? prev.event_types.filter(e => e !== event)
        : [...prev.event_types, event]
    }));
  };

  const toggleFilling = (id: number) => {
    setForm(prev => ({
      ...prev,
      filling_ids: prev.filling_ids.includes(id)
        ? prev.filling_ids.filter(f => f !== id)
        : [...prev.filling_ids, id]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div>
          <label>Название</label>
          <input
            className="input"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
        </div>

        <div>
          <label>Slug</label>
          <input
            className="input"
            value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
          />
          {errors.slug && <span style={{ color: 'red' }}>{errors.slug}</span>}
        </div>

        <div>
          <label>Категория</label>
          <select
            value={form.category_id}
            onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}
          >
            <option value={0}>Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.category_id && <span style={{ color: 'red' }}>{errors.category_id}</span>}
        </div>

        <div>
          <label>Цена (₽)</label>
          <input
            className="input"
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
          />
          {errors.price && <span style={{ color: 'red' }}>{errors.price}</span>}
        </div>

        <div>
          <label>Вес (кг)</label>
          <input
            className="input"
            type="number"
            step="0.1"
            value={form.base_weight}
            onChange={e => setForm({ ...form, base_weight: Number(e.target.value) })}
          />
        </div>

        <div>
          <label>Статус</label>
          <select
            value={form.active ? '1' : '0'}
            onChange={e => setForm({ ...form, active: e.target.value === '1' })}
          >
            <option value="1">Активен</option>
            <option value="0">Скрыт</option>
          </select>
        </div>
      </div>

      <div>
        <label>Описание</label>
        <textarea
          className="input"
          rows={4}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label>События</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['wedding','birthday','corporate','anniversary','kids','other'].map(event => (
            <label key={event} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={form.event_types.includes(event)}
                onChange={() => toggleEvent(event)}
              />
              {event}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label>Начинки</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fillings.map(filling => (
            <label key={filling.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={form.filling_ids.includes(filling.id)}
                onChange={() => toggleFilling(filling.id)}
              />
              {filling.name}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button className="btn" type="submit">Сохранить</button>
        <button className="btn--outline" type="button" onClick={onCancel}>Отмена</button>
      </div>
    </form>
  );
}
