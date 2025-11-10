interface PreviewProps {
  form: string;
  layers: number;
  topping: string;
  colors: string[];
  fillings: string[];
}

const colorMap: Record<string, string> = {
  white: '#FFFFFF',
  pink: '#FFC0CB',
  mint: '#98FB98',
  brown: '#8B4513',
  gold: '#FFD700',
  lavender: '#E6E6FA'
};

export default function Preview({ form, layers, topping, colors, fillings }: PreviewProps) {
  const getBorderRadius = () => {
    switch (form) {
      case 'round': return '50%';
      case 'heart': return '10px 10px 30px 30px';
      default: return '8px';
    }
  };

  const getFormSize = () => {
    switch (form) {
      case 'square': return { width: 200, height: 200 };
      case 'rectangle': return { width: 250, height: 150 };
      default: return { width: 180, height: 180 };
    }
  };

  const size = getFormSize();

  return (
    <div style={{
      border: '2px dashed #ddd',
      borderRadius: 12,
      padding: 20,
      textAlign: 'center',
      minHeight: 300
    }}>
      <h3>Предпросмотр торта</h3>
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            ...size,
            borderRadius: getBorderRadius(),
            background: colors.length > 0 ? colorMap[colors[0]] || '#FFFFFF' : '#FFFFFF',
            border: '2px solid #ddd',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {Array.from({ length: Math.min(layers, 3) }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: i * 15,
                left: i * 8,
                right: i * 8,
                height: size.height - i * 20,
                borderRadius: getBorderRadius(),
                background: colors.length > 1 ? colorMap[colors[1]] || '#FFFFFF' : colorMap[colors[0]] || '#FFFFFF',
                border: '2px solid #ccc',
                opacity: 0.9
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        <p>Форма: {form}</p>
        <p>Ярусы: {layers}</p>
        <p>Покрытие: {topping}</p>
        {fillings.length > 0 && <p>Начинки: {fillings.join(', ')}</p>}
      </div>
    </div>
  );
}
