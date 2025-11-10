'use client';

interface FormSelectorProps {
  selected: string;
  onChange: (form: string) => void;
}

const forms = [
  { id: 'round', name: 'Круглый', image: '/images/forms/round.jpg' },
  { id: 'square', name: 'Квадратный', image: '/images/forms/square.jpg' },
  { id: 'heart', name: 'Сердце', image: '/images/forms/heart.jpg' },
  { id: 'rectangle', name: 'Прямоугольный', image: '/images/forms/rectangle.jpg' },
];

export default function FormSelector({ selected, onChange }: FormSelectorProps) {
  return (
    <div>
      <h3>Форма торта</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {forms.map(form => (
          <div
            key={form.id}
            onClick={() => onChange(form.id)}
            style={{
              border: selected === form.id ? '3px solid var(--color-gold)' : '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ width: '100%', height: 80, backgroundColor: '#f0f0f0', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ fontWeight: 600 }}>{form.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
