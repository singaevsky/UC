import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function PromosPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.from('promotions').select('*').eq('active', true);
  return (
    <div>
      <h1>Акции</h1>
      {(data ?? []).map(p => (
        <div key={p.id} className="card">
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          {p.promo_code ? <p>Промокод: <span className="badge">{p.promo_code}</span></p> : null}
        </div>
      ))}
    </div>
  );
}
