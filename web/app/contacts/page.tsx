export default function ContactsPage() {
  return (
    <div>
      <h1>Контакты</h1>
      <p>Адрес: г. Уездный, ул. Кондитерская, 5</p>
      <p>Телефон: +7 (999) 000-00-00</p>
      <p>Email: hello@konditer.ru</p>
      <div>
        <iframe
          width="100%"
          height="360"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=Уездный+Кондитерская+5`}
        />
      </div>
    </div>
  );
}
