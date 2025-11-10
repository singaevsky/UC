interface ColorSelectorProps {
  selected: string[];
  onChange: (colors: string[]) => void;
}

const colors = [
  { id: 'white', name: 'Белый', hex: '#FFFFFF' },
  { id: 'pink', name: 'Розовый', hex: '#FFC0CB' },
  { id: 'mint', name: 'Мятный', hex: '#98FB98' },
  { id: 'brown', name: 'Коричневый', hex: '#8B4513' },
  { id: 'gold', name: 'Золотой', hex: '#FFD700' },
  { id: 'lavender', name: 'Лаванда', hex: '#E6E6FA' },
];

export default function ColorSelector({ selected, onChange }: ColorSelectorProps) {
  const toggleColor = (color: string) => {
    if (selected.includes(color)) {
      onChange(selected.filter(c => c !== color));
    } else if (selected.length < 2) {
      onChange([...selected, color]);
    }
  };

  return (
    <div>
      <h3>Цвета (до 2-х)</h3>
      <p style={{ color: '#666', marginBottom: 12 }}>
        Выбрано: {selected.length}/2 {selected.length === 2 ? '(максимум)' : ''}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {colors.map(color => {
          const isSelected = selected.includes(color.id);
          return (
            <div
              key={color.id}
              onClick={() => toggleColor(color.id)}
              style={{
                border: isSelected ? '3px solid var(--color-gold)' : '2px solid #ddd',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                textAlign: 'center',
                background: color.hex
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{color.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
