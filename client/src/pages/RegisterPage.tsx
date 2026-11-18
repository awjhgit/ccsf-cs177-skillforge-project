import { useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function register(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get('email')).trim();
    const password = String(fields.get('password'));
    if (password !== fields.get('confirmation')) {
      setError('The passwords do not match.');
      return;
    }
    setError('');
    setPending(true);
    try {
      await api.register({
        email,
        password,
        name: String(fields.get('name')),
        department: String(fields.get('department')),
      });
      navigate('/login', { replace: true, state: { registeredEmail: email } });
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'Could not create your account. Please try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-container">
      <form className="login-card" onSubmit={register} aria-busy={pending}>
        <h1>Create a Skill Forge account</h1>
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" autoComplete="name" required maxLength={100} />
        <label htmlFor="department">Department</label>
        <input id="department" name="department" required maxLength={100} />
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={128} aria-describedby="password-hint" />
        <p id="password-hint">Use at least 15 characters.</p>
        <label htmlFor="confirmation">Confirm password</label>
        <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required maxLength={128} />
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? 'Creating account…' : 'Create account'}</button>
        <p><Link to="/login">Back to sign in</Link></p>
      </form>
    </main>
  );
}
