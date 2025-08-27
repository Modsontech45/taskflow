export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    status: string;
    plan: string;
    monthlyPrice: number;
    memberCount: number;
    nextBillingDate: string;
  };
  stats?: {
    totalBoards: number;
    totalTasks: number;
    completedTasks: number;
    totalMembers: number;
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  country?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}