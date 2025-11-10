export class Mailer {
  async sendOrderConfirmation(orderData: any) {
    const subject = `Заказ №${orderData.id} - Подтверждение`;
    const html = this.getOrderConfirmationTemplate(orderData);

    // В реальном проекте используйте nodemailer или сервис типа SendGrid
    console.log('Sending order confirmation email:', { to: orderData.email, subject, html });

    return { success: true };
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`;
    const subject = 'Сброс пароля - Уездный кондитер';
    const html = `
      <h2>Сброс пароля</h2>
      <p>Вы запросили сброс пароля для аккаунта на сайте "Уездный кондитер".</p>
      <p>Нажмите на ссылку ниже для сброса пароля:</p>
      <a href="${resetUrl}" style="background: #7b5a3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Сбросить пароль
      </a>
      <p>Ссылка действительна в течение 1 часа.</p>
      <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
    `;

    console.log('Sending password reset email:', { to: email, subject, html });

    return { success: true };
  }

  async sendWelcomeEmail(email: string, name: string) {
    const subject = 'Добро пожаловать в Уездный кондитер!';
    const html = `
      <h2>Привет, ${name}!</h2>
      <p>Добро пожаловать в кондитерскую "Уездный кондитер"!</p>
      <p>Теперь вы можете:</p>
      <ul>
        <li>Заказывать наши торты и десерты</li>
        <li>Создавать уникальные торты в конструкторе</li>
        <li>Отслеживать свои заказы</li>
        <li>Копить бонусы и получать скидки</li>
      </ul>
      <p>Спасибо, что выбрали нас!</p>
    `;

    console.log('Sending welcome email:', { to: email, subject, html });

    return { success: true };
  }

  private getOrderConfirmationTemplate(orderData: any): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #7b5a3c;">Заказ №${orderData.id} подтвержден!</h2>
        <p>Спасибо за заказ в кондитерской "Уездный кондитер"!</p>

        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Детали заказа:</h3>
          ${orderData.items.map((item: any) => `
            <p><strong>${item.name}</strong> - ${item.quantity} шт. = ${item.price * item.quantity} ₽</p>
          `).join('')}
          <p><strong>Итого:</strong> ${orderData.total} ₽</p>
          <p><strong>Способ доставки:</strong> ${orderData.delivery_method}</p>
          ${orderData.delivery_address ? `<p><strong>Адрес доставки:</strong> ${orderData.delivery_address}</p>` : ''}
        </div>

        <p>Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
        <p>Если у вас есть вопросы, напишите нам: hello@konditer.ru</p>

        <div style="margin-top: 30px; padding: 20px; background: #fff5e6; border-radius: 8px;">
          <h3>Следите за нами в соцсетях</h3>
          <p>Instagram: @yezdnyy_konditer | VK: vk.com/yezdnyy_konditer</p>
        </div>
      </div>
    `;
  }
}

export const mailer = new Mailer();
