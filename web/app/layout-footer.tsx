import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ marginTop: '32px', padding: '32px 16px', background: '#fafafa', borderTop: '1px solid #eee' }}>
      <div className="container">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div>
            <h4>О нас</h4>
            <div className="mt-2">
              <Link href="/about">История и команда</Link><br/>
              <Link href="/certificates">Сертификаты</Link><br/>
              <Link href="/partners">Партнёры</Link>
            </div>
          </div>
          <div>
            <h4>Покупателям</h4>
            <div className="mt-2">
              <Link href="/delivery">Доставка и оплата</Link><br/>
              <Link href="/reviews">Отзывы</Link><br/>
              <Link href="/faq">FAQ</Link>
            </div>
          </div>
          <div>
            <h4>Правовая информация</h4>
            <div className="mt-2">
              <Link href="/privacy">Политика конфиденциальности</Link><br/>
              <Link href="/oferta">Публичная оферта</Link>
            </div>
          </div>
        </div>
        <div className="text-center mt-3" style={{ color: '#777' }}>
          <p>© {new Date().getFullYear()} Уездный кондитер. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
