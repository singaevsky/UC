import nodemailer from 'nodemailer';

export class Mailer {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  }

  async sendOrderConfirmation(orderData: any) {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: orderData.email,
      subject: `Заказ №${orderData.id} - Подтверждение`,
      html: this.getOrderConfirmationTemplate(orderData)
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Order confirmation email sent');
    } catch (error) {
      console.error('Error sending order confirmation:', error);
    }
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Сброс пароля - Уездный кондитер',
      html: `
        <h2>Сброс пароля</h2>
        <p>Вы запросили сброс пароля для аккаунта на сайте "Уездный кондитер".</p>
        <p>Нажмите на ссылку ниже для сброса пароля:</p>
        <a href="${resetUrl}" style="background: #7b5a3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Сбросить пароль
        </a>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset:', error);
    }
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
        </div>

        <p>Мы свяжемся с вами в ближайшее время для уточнения деталей.</p>
        <p>Если у вас есть вопросы, напишите нам: hello@konditer.ru</p>
      </div>
    `;
  }
}

export const mailer = new Mailer();
