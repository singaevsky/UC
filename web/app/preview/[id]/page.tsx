// file: app/preview/[id]/page.tsx
import { unstable_noStore as noStore, revalidateTag } from 'next/cache';

export default async function PreviewPage({ params }: { params: { id: string } }) {
  noStore(); // отключаем кеш для актуальности

  const draft = await getDraft(params.id);
  //...
}

// Где getDraft — кешируемая функция
export const getDraft = async (id: string) => {
  // кеш по тегам
  return await fetch(`https://api.example.com/draft/${id}`, { next: { revalidate: 300, tags: ['draft'] } });
};
