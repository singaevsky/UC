'use client';

import { useState, useEffect } from 'react';
import { getClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { FaqItem, CreateFaqData } from '@/types/blog';

export default function FAQManagement() {
  const supabase = getClient();
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [formData, setFormData] = useState<CreateFaqData>({
    category: 'general',
    question: '',
    answer: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadFaqItems();
  }, []);

  const loadFaqItems = async () => {
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    setFaqItems(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('faq_items')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        alert('FAQ обновлено');
      } else {
        const { error } = await supabase
          .from('faq_items')
          .insert([formData]);

        if (error) throw error;
        alert('FAQ создано');
      }

      setShowCreateForm(false);
      setEditingItem(null);
      setFormData({
        category: 'general',
        question: '',
        answer: '',
        order_index: 0,
        is_active: true
      });
      loadFaqItems();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const editItem = (item: FaqItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      question: item.question,
      answer: item.answer,
      order_index: item.order_index,
      is_active: item.is_active
    });
    setShowCreateForm(true);
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот FAQ?')) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('FAQ удалено');
      loadFaqItems();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ is_active: !current })
        .eq('id', id);

      if (error) throw error;
      loadFaqItems();
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'general': return 'Общие вопросы';
      case 'delivery': return 'Доставка';
      case 'products': return 'Товары и услуги';
      case 'payment': return 'Оплата';
      case 'custom': return 'Индивидуальные заказы';
      default: return category;
    }
  };

  const groupedFaq = faqItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Управление FAQ</h1>
        <Button onClick={() => {
          setShowCreateForm(true);
          setEditingItem(null);
          setFormData({
            category: 'general',
            question: '',
            answer: '',
            order_index: faqItems.length,
            is_active: true
          });
        }}>
          Добавить FAQ
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Всего FAQ</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {faqItems.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активных</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
              {faqItems.filter(item => item.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Категорий</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {Object.keys(groupedFaq).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ по категориям */}
      <div className="space-y-6">
        {Object.entries(groupedFaq).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{getCategoryTitle(category)} ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border-b pb-3" style={{ borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong>{item.question}</strong>
                          <span className={`badge status-${item.is_active ? 'published' : 'rejected'}`}>
                            {item.is_active ? 'Активен' : 'Неактивен'}
                          </span>
                        </div>
                        <p style={{ color: '#666', marginBottom: '4px' }}>
                          {item.answer.substring(0, 100)}...
                        </p>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          Порядок: {item.order_index} • Создано: {formatDate(item.created_at)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          size="sm"
                          onClick={() => toggleActive(item.id, item.is_active)}
                        >
                          {item.is_active ? 'Скрыть' : 'Показать'}
                        </Button>
                        <Button size="sm" onClick={() => editItem(item)}>
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          style={{ background: '#f44336' }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Модальное окно создания/редактирования */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3>
              {editingItem ? 'Редактировать FAQ' : 'Добавить FAQ'}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label>Категория:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="general">Общие вопросы</option>
                    <option value="delivery">Доставка</option>
                    <option value="products">Товары и услуги</option>
                    <option value="payment">Оплата</option>
                    <option value="custom">Индивидуальные заказы</option>
                  </select>
                </div>

                <div>
                  <label>Порядок:</label>
                  <Input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label>Вопрос:</label>
                <Input
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="mt-3">
                <label>Ответ:</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="input"
                  rows={4}
                  required
                />
              </div>

              <div className="mt-3">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Активный
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'end', marginTop: '16px' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingItem(null);
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit">
                  {editingItem ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
