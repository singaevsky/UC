import FadeIn from '@/components/animations/FadeIn';

export const metadata = {
  title: 'Партнерская программа - Уездный кондитер',
  description: 'Партнерская программа интернет-магазина Уездный кондитер'
};

export default function PartnersPage() {
  return (
    <FadeIn>
      <div className="max-w-4xl mx-auto">
        <h1>Партнерская программа</h1>
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Станьте нашим партнером</h2>
          <p>Приглашаем к сотрудничеству блогеров, SMM-специалистов и всех, кто хочет зарабатывать на продвижении наших тортов.</p>

          <h2>Условия сотрудничества</h2>
          <ul>
            <li>Вознаграждение до 10% с каждого заказа</li>
            <li>Выплаты каждую неделю</li>
            <li>Бесплатные образцы для обзора</li>
            <li>Персональный менеджер</li>
            <li>Промокоды со скидками для ваших подписчиков</li>
          </ul>

          <h2>Как стать партнером</h2>
          <ol>
            <li>Заполните заявку на участие</li>
            <li>Пройдите модерацию (1-2 дня)</li>
            <li>Получите промокод и рекламные материалы</li>
            <li>Размещайте контент с вашей партнерской ссылкой</li>
            <li>Получайте вознаграждение с заказов</li>
          </ol>

          <div style={{ marginTop: 24 }}>
            <h3>Подать заявку</h3>
            <form className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label>Имя</label>
                  <input className="input" required />
                </div>
                <div>
                  <label>Email</label>
                  <input className="input" type="email" required />
                </div>
              </div>
              <div>
                <label>Ссылка на профиль/канал</label>
                <input className="input" required />
              </div>
              <div>
                <label>Количество подписчиков</label>
                <select className="input">
                  <option value="0-1k">0 - 1,000</option>
                  <option value="1k-10k">1,000 - 10,000</option>
                  <option value="10k-50k">10,000 - 50,000</option>
                  <option value="50k+">50,000+</option>
                </select>
              </div>
              <div>
                <label>Расскажите о себе</label>
                <textarea className="input" rows={4} placeholder="Опыт работы, целевая аудитория, примеры работ..."></textarea>
              </div>
              <button className="btn" type="submit">Подать заявку</button>
            </form>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
