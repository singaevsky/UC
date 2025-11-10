import Head from 'next/head';

interface SeoHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;
}

export default function SeoHead({
  title = "Уездный кондитер - свежие торты и десерты",
  description = "Интернет-магазин кондитерской 'Уездный кондитер'. Свежие торты, десерты и индивидуальные заказы. Конструктор тортов онлайн.",
  image = "/images/og-image.jpg",
  url = "https://yoursite.ru",
  type = "website",
  siteName = "Уездный кондитер",
  locale = "ru_RU"
}: SeoHeadProps) {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="торты, десерты, кондитерская, свадебный торт, детский торт, конструктор тортов" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Bakery",
            "name": "Уездный кондитер",
            "description": description,
            "url": url,
            "logo": `${url}/images/logo.png`,
            "image": image,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "ул. Кондитерская, 5",
              "addressLocality": "г. Уездный",
              "addressCountry": "RU"
            },
            "telephone": "+7 (999) 000-00-00",
            "priceRange": "₽₽",
            "servesCuisine": "Dessert",
            "openingHours": "Mo-Su 09:00-21:00"
          })
        }}
      />
    </Head>
  );
}
