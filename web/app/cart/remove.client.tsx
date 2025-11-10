'use client';
import { getClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RemoveFromCart({ id }: { id: number }) {
  const supabase = getClient();
  const router = useRouter();
  return <button className="btn--outline" onClick={async () => { await supabase.from('cart_items').delete().eq('id', id); router.refresh(); }}>Удалить</button>;
}
