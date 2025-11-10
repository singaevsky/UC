import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';

export default async function GalleryPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
  return (
    <div>
      <h1>Галерея работ</h1>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {(data ?? []).map(g => (
          <div key={g.id} className="card">
            <Image src={g.image_url} alt={g.title || ''} width={300} height={200} />
            {g.title ? <div>{g.title}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
