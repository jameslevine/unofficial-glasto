import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consumeReturnTo, exchangeCodeForTokens } from '../../lib/auth';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errParam = params.get('error_description') ?? params.get('error');

    if (errParam) {
      setError(errParam);
      return;
    }
    if (!code) {
      setError('Missing authorization code');
      return;
    }

    exchangeCodeForTokens(code)
      .then(() => {
        const returnTo = consumeReturnTo();
        navigate(returnTo, { replace: true });
      })
      .catch((err: Error) => setError(err.message));
  }, [navigate]);

  if (error) {
    return (
      <div className="space-y-3">
        <h1 className="font-display text-xl font-semibold">Sign-in failed</h1>
        <p className="text-sm text-muted">{error}</p>
        <button type="button" className="chip" onClick={() => navigate('/', { replace: true })}>
          Back to lineup
        </button>
      </div>
    );
  }

  return <p className="text-muted">Signing you in…</p>;
};
