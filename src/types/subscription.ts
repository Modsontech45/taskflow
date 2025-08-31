export interface Subscription {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'PENDING' | 'CANCELED'; // aligned with backend
  plan: 'BASIC' | 'TEAM';
  monthlyPrice: number;
  memberCount: number;
  nextBillingDate: string;
  createdAt: string;
  updatedAt: string;
  paystackCustomerId?: string; // optional, from backend
}

export interface SubscriptionPricing {
  basicPrice: number;  // e.g., $2 per month for individual
  memberPrice: number; // e.g., $0.5 per member/month
}

export interface CreateSubscriptionRequest {
  plan: 'BASIC' | 'TEAM';
}

export interface UpdateSubscriptionRequest {
  memberCount?: number;
  status?: Subscription['status'];
}

export interface SubscriptionResponse {
  subscription: Subscription;
  paymentUrl?: string; // Paystack checkout URL if subscription is PENDING
}
