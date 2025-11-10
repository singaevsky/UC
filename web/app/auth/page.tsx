'use client';

import { getClient } from '@/lib/supabase/client';
import { useState } from 'react';
import FadeIn from '@/components/animations/FadeIn';
import { Analytics } from '@/lib/analytics';

export default function AuthPage() {
  const supabase = getClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Ссылка отправлена на почту');
      Analytics.trackLogin('email');
    }
  }

  async function signIn(provider: 'google' | 'github') {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
    Analytics.trackLogin(provider);
  }

  return (
    <FadeIn>
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1>Войти</h1>
          <form onSubmit={signInEmail} className="mt-3">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              className="btn"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: '12px' }}
            >
              {loading ? 'Отправляем...' : 'Войти по ссылке'}
            </button>
          </form>

          <div className="mt-3">
            <p style={{ textAlign: 'center', color: '#666' }}>или</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn--outline"
                onClick={() => signIn('google')}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Google
              </button>
              <button
                className="btn--outline"
                onClick={() => signIn('github')}
                disabled={loading}
                style={{ flex: 1 }}
              >
                GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
