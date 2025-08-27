import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { CheckSquare, Eye, EyeOff, CheckCircle } from 'lucide-react';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      showToast('error', 'Invalid reset link', 'Please check your email for the correct link.');
      navigate('/forgot-password');
    }
  }, [searchParams, navigate, showToast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await apiClient.resetPassword(token, formData.newPassword);
      setSuccess(true);
      showToast('success', 'Password reset successful', 'You can now log in with your new password.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'Failed to reset password. The link may be expired.';
      setErrors({ submit: errorMessage });
      showToast('error', 'Password reset failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-6">
              <CheckSquare className="w-10 h-10 text-blue-600 mr-3" />
              <span className="font-bold text-xl text-gray-900">TaskFlow</span>
            </div>

            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Password reset successful!
            </h1>

            <p className="text-gray-600 mb-8">
              Your password has been successfully updated. You can now log in with your new password.
            </p>

            <Button
              onClick={() => navigate('/login')}
              className="w-full"
              size="lg"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <CheckSquare className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
            <p className="text-gray-600 mt-2">
              Enter your new password below to complete the reset process.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                error={errors.newPassword}
                placeholder="Enter your new password"
                required
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Input
              label="Confirm new password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              required
              autoComplete="new-password"
            />

            {errors.submit && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Reset Password
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}