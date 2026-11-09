import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, inputCls } from '../../components/ui';
import { authMessage, resetPassword, signIn, signUp } from '../api';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNote(null);
    if (mode === 'signup' && password.length < 8) return setError('Use a password of at least 8 characters.');
    setBusy(true);
    try {
      if (mode === 'signin') await signIn(email, password);
      else if (mode === 'signup') await signUp(email, password);
      else {
        await resetPassword(email);
        setNote('If there’s an account for that email, a reset link is on its way.');
      }
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <a href="#/" className="text-[18px] font-semibold">
        Quote<span className="text-accent">Desk</span>
      </a>
      <h1 className="mt-6 text-[24px] font-semibold">{mode === 'signup' ? 'Start your free pilot' : mode === 'signin' ? 'Sign in' : 'Reset your password'}</h1>
      <p className="mt-1 text-[14px] text-ink-2">
        {mode === 'signup' ? 'Free while we’re in pilot. Takes about 3 minutes to set up.' : mode === 'signin' ? 'Welcome back.' : 'We’ll email you a link.'}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email">
          <input className={inputCls} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {mode !== 'reset' && (
          <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
            <input className={inputCls} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        )}
        {error && (
          <p role="alert" className="text-[13px] text-bad">
            {error}
          </p>
        )}
        {note && <p className="text-[13px] text-good">{note}</p>}
        <Button type="submit" variant="primary" className="h-11 w-full" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Send reset link'}
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-[13px]">
        <button className="font-medium text-navy hover:underline" onClick={() => (setMode(mode === 'signup' ? 'signin' : 'signup'), setError(null))}>
          {mode === 'signup' ? 'I already have an account' : 'Create an account'}
        </button>
        {mode === 'signin' && (
          <button className="text-ink-3 hover:underline" onClick={() => setMode('reset')}>
            Forgot password?
          </button>
        )}
      </div>
      {mode === 'signup' && (
        <p className="mt-6 text-[12px] leading-relaxed text-ink-3">
          By creating an account you agree to the{' '}
          <a href="#/terms" className="underline">
            terms
          </a>{' '}
          and{' '}
          <a href="#/privacy" className="underline">
            privacy policy
          </a>
          .
        </p>
      )}
    </main>
  );
}
