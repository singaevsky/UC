import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ marginTop: 32, padding: 16, background: '#fafafa', borderTop: '1px solid #eee' }}>
      <div className="container">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div>
            <h4>О нас</h4>
            <Link href="/about">История и команда</Link><br/>
            <Link href="/certificates">Сертификаты</Link><br/>
            <Link href="/partners">Партнёры</Link>
          </div>
          <div>
            <h4>Покупателям</h4>
            <Link href="/delivery">Доставка и оплата</Link><br/>
            <Link href="/reviews">Отзывы</Link><br/>
            <Link href="/faq">FAQ</Link>
          </div>
          <div>
            <h4>Правовая информация</h4>
            <Link href="/privacy">Политика конфиденциальности</Link><br/>
            <Link href="/oferta">Публичная оферта</Link>
          </div>
        </div>
        <p style={{ marginTop: 12, color: '#777' }}>© {new Date().getFullYear()} Уездный кондитер</p>
      </div>
    </footer>
  );
}
