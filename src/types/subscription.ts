export interface Subscription {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  plan: 'BASIC' | 'TEAM';
  monthlyPrice: number;
  memberCount: number;
  nextBillingDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPricing {
  basicPrice: number; // $2 per month for no members
  memberPrice: number; // $0.5 per member per month
}

export interface CreateSubscriptionRequest {
  plan: 'BASIC' | 'TEAM';
}

export interface UpdateSubscriptionRequest {
  memberCount?: number;
  status?: Subscription['status'];
}