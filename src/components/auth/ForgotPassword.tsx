import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { CheckSquare, Mail, ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await apiClient.requestPasswordReset(email);
      setSent(true);
      showToast('success', 'Reset link sent', 'Check your email for password reset instructions.');
    } catch (error: any) {
      console.error('Password reset request error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
      showToast('error', 'Failed to send reset email', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">TaskNest</span>
            </div>

            <div className="mb-6">
              <Mail className="w-16 h-16 text-green-500 mx-auto" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Check your email
            </h1>

            <p className="text-gray-600 mb-8">
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Try different email
              </Button>
              <Link
                to="/login"
                className="block text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              error={error}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              autoFocus
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Send reset link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}