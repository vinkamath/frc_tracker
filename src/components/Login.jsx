import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
};

function getErrorMessage(code) {
  return AUTH_ERROR_MESSAGES[code] || 'Sign in failed. Please try again.';
}

export default function Login({ redirectTo = '/' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo === '/login' ? '/' : redirectTo, { replace: true });
    }
  }, [loading, user, navigate, redirectTo]);

  if (!loading && user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(redirectTo === '/login' ? '/' : redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err?.code || ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <Card>
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to access the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
