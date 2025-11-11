// file: app/preview/[id]/page.tsx
import { unstable_noStore as noStore, revalidateTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { getPublicImageUrl } from '@/shared/utils/images';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function PreviewPage({ params }: { params: { id: string } }) {
  // Отключаем статический кеш, но помечаем тег – для последующего revalidate
  noStore();
  revalidateTag('draft');

  const { data: draft, error } = await supabase
    .from('draft_cakes')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !draft) notFound();

  const { config } = draft;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Предпросмотр торта</h1>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold">Визуальная модель</h2>
          <div className="space-y-4">
            {config.layers?.map((layer: any, idx: number) => (
              <Image
                key={idx}
                src={getPublicImageUrl(layer.imageUrl)}
                alt={`Layer ${idx}`}
                width={400}
                height={300}
                className="rounded shadow-md"
                placeholder="blur"
                blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Параметры</h2>
          <ul className="list-disc list-inside">
            <li>Форма: {config.shape}</li>
            <li>Размер: {config.size} см</li>
            <li>Вкусы: {config.flavors?.join(', ')}</li>
          </ul>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-xl font-semibold">Цена: {config.price} ₽</p>
            <p className="text-sm text-gray-500">Оплата недоступна в предпросмотре</p>
          </div>
        </div>
      </div>
    </div>
  );
}
