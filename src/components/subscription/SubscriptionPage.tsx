import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { apiClient } from '../../services/api';
import { Subscription, SubscriptionPricing } from '../../types/subscription';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  CreditCard, 
  Users, 
  Check, 
  Star,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PRICING: SubscriptionPricing = {
  basicPrice: 2.00,
  memberPrice: 0.50,
};

export function SubscriptionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const data = await apiClient.getSubscription(user.id);
      setSubscription(data);
    } catch (error: any) {
      if (error.status !== 404) {
        console.error('Error loading subscription:', error);
        showToast('error', 'Failed to load subscription', 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (plan: 'BASIC' | 'TEAM') => {
    setUpdating(true);
    try {
      const newSubscription = await apiClient.createSubscription({ plan });
      setSubscription(newSubscription);
      showToast('success', 'Subscription created', 'Your subscription has been activated.');
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      showToast('error', 'Failed to create subscription', error.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || !user) return;
    
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;

    setUpdating(true);
    try {
      await apiClient.updateSubscription(user.id, { status: 'CANCELLED' });
      setSubscription(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      showToast('success', 'Subscription cancelled', 'Your subscription has been cancelled.');
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      showToast('error', 'Failed to cancel subscription', error.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const calculatePrice = (memberCount: number) => {
    if (memberCount === 0) {
      return PRICING.basicPrice;
    }
    return memberCount * PRICING.memberPrice;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Manage your TaskNest subscription and billing
        </p>
      </div>

      {subscription ? (
        /* Current Subscription */
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                    <p className="text-sm text-gray-600">
                      {subscription.plan === 'BASIC' ? 'Basic Plan' : 'Team Plan'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'CANCELLED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscription.status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Price</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${subscription.monthlyPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Team Members</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {subscription.memberCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Next Billing</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(parseISO(subscription.nextBillingDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
              
              {subscription.status === 'ACTIVE' && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    loading={updating}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Pricing Information</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Basic Plan (No Members)</p>
                    <p className="text-sm text-gray-600">Perfect for individual use</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    ${PRICING.basicPrice.toFixed(2)}/month
                  </p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Team Plan (Per Member)</p>
                    <p className="text-sm text-gray-600">Collaborate with your team</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    ${PRICING.memberPrice.toFixed(2)}/member/month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* No Subscription - Pricing Plans */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Basic Plan</h3>
                <p className="text-gray-600 mt-2">Perfect for individual use</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${PRICING.basicPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited personal boards</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited tasks</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Basic notifications</span>
                </li>
                <li className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-500">No team collaboration</span>
                </li>
              </ul>
              <Button
                onClick={() => handleCreateSubscription('BASIC')}
                loading={updating}
                className="w-full"
              >
                Start Basic Plan
              </Button>
            </CardContent>
          </Card>

          {/* Team Plan */}
          <Card className="relative border-blue-200 bg-blue-50/30">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>
            <CardHeader>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">Team Plan</h3>
                <p className="text-gray-600 mt-2">Collaborate with your team</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${PRICING.memberPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-600">/member/month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Everything in Basic</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Member management</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Advanced notifications</span>
                </li>
              </ul>
              <Button
                onClick={() => handleCreateSubscription('TEAM')}
                loading={updating}
                className="w-full"
              >
                Start Team Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Examples */}
      <Card className="mt-8">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Pricing Examples</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Solo User</p>
              <p className="text-lg font-semibold text-gray-900">
                ${calculatePrice(0).toFixed(2)}/month
              </p>
              <p className="text-xs text-gray-500">0 team members</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Small Team</p>
              <p className="text-lg font-semibold text-gray-900">
                ${calculatePrice(5).toFixed(2)}/month
              </p>
              <p className="text-xs text-gray-500">5 team members</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">Large Team</p>
              <p className="text-lg font-semibold text-gray-900">
                ${calculatePrice(20).toFixed(2)}/month
              </p>
              <p className="text-xs text-gray-500">20 team members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}