'use client';

import { getClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function AuthPage() {
  const supabase = getClient();
  const [email, setEmail] = useState('');

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) alert(error.message); else alert('Ссылка отправлена на почту');
  }

  async function signIn(provider: 'google' | 'github') {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h1>Войти</h1>
      <form onSubmit={signInEmail}>
        <label>Email</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn" type="submit">Войти по ссылке</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <button className="btn--outline" onClick={() => signIn('google')}>Войти через Google</button>
      </div>
    </div>
  );
}
