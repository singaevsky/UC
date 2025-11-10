import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';

export default async function ReviewsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.from('reviews').select('*, products(name)').eq('status','published').order('created_at', { ascending: false });
  return (
    <div>
      <h1>Отзывы</h1>
      {(data ?? []).map(r => (
        <div key={r.id} className="card">
          <b>{r.products?.name}</b> — {r.rating} / 5
          <p>{r.text}</p>
          {r.image_url ? <Image src={r.image_url} alt="review" width={300} height={200} /> : null}
        </div>
      ))}
    </div>
  );
}
