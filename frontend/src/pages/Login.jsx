import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function Login({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const authenticate = isRegistering ? api.register : api.login;
      const response = await authenticate({ email, password });
      onAuthenticated(response.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b132b] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0f172a] p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600">
            <ShieldAlert className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">CivicVision</h1>
            <p className="text-xs text-slate-400">Secure Smart City Operations</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold">{isRegistering ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-2 text-sm text-slate-400">
          {isRegistering ? 'Register to access the CivicVision dashboard.' : 'Sign in to continue to CivicVision.'}
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300">
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b132b] px-3 py-2.5 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              required
              minLength={isRegistering ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-[#0b132b] px-3 py-2.5 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              placeholder={isRegistering ? 'At least 8 characters' : 'Enter your password'}
            />
          </label>

          {error && <p role="alert" className="rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-teal-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isRegistering ? 'Already registered?' : 'New to CivicVision?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            {isRegistering ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </section>
    </main>
  );
}
