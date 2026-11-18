import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import type { User } from '../types/user';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const location = useLocation();
  const registeredEmail = typeof location.state?.registeredEmail === 'string' ? location.state.registeredEmail : '';
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const { user } = await api.login(email, password);
      onLogin(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-container">
      <form className="login-card" onSubmit={handleLogin} aria-busy={pending}>
        <h1>Skill Forge</h1>
        <p>Connect. Collaborate. Grow.</p>
        <h2>Sign In</h2>
        {registeredEmail && <p role="status">Account created. Sign in with your new password.</p>}
        <label htmlFor="email">Email Address</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign In'}</button>
        <p><Link to="/register">Create an account</Link></p>
        <p className="demo-hint">Local demo: alex@skillforge.demo / demo123</p>
      </form>
    </main>
  );
}
