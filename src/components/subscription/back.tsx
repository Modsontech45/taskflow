import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { apiClient } from '../../services/api';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreditCard, Users, Check, Star, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PRICING = {
  basicPrice: 1.0,
  memberPrice: 0.5,
};

export function SubscriptionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get(`/api/subscriptions/${user.id}`);
      setSubscription(data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading subscription:', error);
        showToast('error', 'Failed to load subscription', 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async (plan) => {
    if (!user) return;
    setUpdating(true);
    try {
      const { data } = await apiClient.post('/api/subscriptions', { plan });
      setSubscription(data);
      showToast('success', 'Subscription created', 'Your subscription is now active.');
    } catch (error) {
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
      const { data } = await apiClient.patch(`/api/subscriptions/${user.id}`, { status: 'CANCELLED' });
      setSubscription(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
      showToast('success', 'Subscription cancelled', 'Your subscription has been cancelled.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      showToast('error', 'Failed to cancel subscription', error.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const calculatePrice = (memberCount) => {
    return memberCount === 0 ? PRICING.basicPrice : memberCount * PRICING.memberPrice;
  };

  if (loading) {
    return <div>Loading subscription...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Subscription</h1>
      {subscription ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <h2>{subscription.plan} Plan</h2>
                <p>Status: {subscription.status}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <DollarSign /> Monthly Price: ${subscription.monthlyPrice.toFixed(2)}
              </div>
              <div>
                <Users /> Members: {subscription.memberCount}
              </div>
              <div>
                <Calendar /> Next Billing: {subscription.nextBillingDate ? format(parseISO(subscription.nextBillingDate), 'MMM d, yyyy') : 'N/A'}
              </div>
            </div>
            {subscription.status === 'ACTIVE' && (
              <Button onClick={handleCancelSubscription} loading={updating}>
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>Basic Plan</CardHeader>
            <CardContent>
              <p>Perfect for individual use</p>
              <p>${PRICING.basicPrice.toFixed(2)}/month</p>
              <Button onClick={() => handleCreateSubscription('BASIC')} loading={updating}>
                Start Basic
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>Team Plan</CardHeader>
            <CardContent>
              <p>Collaborate with your team</p>
              <p>${PRICING.memberPrice.toFixed(2)}/member/month</p>
              <Button onClick={() => handleCreateSubscription('TEAM')} loading={updating}>
                Start Team
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
