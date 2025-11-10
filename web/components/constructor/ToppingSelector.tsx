interface ToppingSelectorProps {
  selected: string;
  onChange: (topping: string) => void;
}

const toppings = [
  { id: 'fondant', name: 'Фондант', description: 'Гладкая поверхность' },
  { id: 'cream', name: 'Крем', description: 'Нежный крем' },
  { id: 'chocolate', name: 'Шоколад', description: 'Глянцевый шоколад' },
  { id: 'buttercream', name: 'Масляный крем', description: 'Классический крем' },
];

export default function ToppingSelector({ selected, onChange }: ToppingSelectorProps) {
  return (
    <div>
      <h3>Покрытие</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {toppings.map(topping => (
          <div
            key={topping.id}
            onClick={() => onChange(topping.id)}
            style={{
              border: selected === topping.id ? '2px solid var(--color-accent)' : '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              cursor: 'pointer'
            }}
          >
            <h4 style={{ margin: '0 0 4px 0' }}>{topping.name}</h4>
            <p style={{ margin: 0, color: '#666' }}>{topping.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
