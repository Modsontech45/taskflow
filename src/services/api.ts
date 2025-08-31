import { API_CONFIG, ENABLE_API_LOGGING, API_ENDPOINTS } from '../config/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface SubscriptionResponse {
  subscription: any; // or proper Subscription type
  paymentUrl?: string; // optional Paystack checkout URL
}

export class ApiClient {
  private token: string | null = null;
  private requestId = 0;

  setToken(token: string | null) {
    this.token = token;
  }

  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  private log(level: 'info' | 'error', message: string, data?: any) {
    if (ENABLE_API_LOGGING) {
      console[level](`[ApiClient] ${message}`, data || '');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const requestId = this.generateRequestId();

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (this.token) headers.set('Authorization', `Bearer ${this.token}`);

    const requestConfig: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    };

    this.log('info', `${requestId} ${options.method || 'GET'} ${endpoint}`, {
      url,
      headers: { ...Object.fromEntries(headers.entries()), Authorization: this.token ? '[REDACTED]' : undefined },
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });

    try {
      const response = await fetch(url, requestConfig);

      this.log('info', `${requestId} Response ${response.status}`, { status: response.status });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = text;
        try {
          const parsed = JSON.parse(text);
          errorMessage = parsed.message || parsed.error || text;
        } catch {}
        this.log('error', `${requestId} Error ${response.status}`, { status: response.status, error: errorMessage });
        throw new ApiError(response.status, errorMessage || 'An error occurred');
      }

      // Handle 204 No Content
      if (response.status === 204) {
        this.log('info', `${requestId} Success - No Content`);
        return null;
      }

      const data = await response.json();
      this.log('info', `${requestId} Success`, data);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      this.log('error', `${requestId} Network Error`, err);
      throw new ApiError(0, 'Network error. Please check your connection.');
    }
  }

  // ------------------- Auth -------------------
  async login(credentials: { email: string; password: string }) {
    return this.request(API_ENDPOINTS.AUTH_LOGIN, { method: 'POST', body: JSON.stringify(credentials) });
  }
  async register(data: { firstName: string; lastName: string; email: string; password: string; country?: string; phone?: string }) {
    return this.request(API_ENDPOINTS.AUTH_REGISTER, { method: 'POST', body: JSON.stringify(data) });
  }
  async verifyEmail(token: string) {
    return this.request(`${API_ENDPOINTS.AUTH_VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, { method: 'GET' });
  }
  async requestPasswordReset(email: string) {
    return this.request(API_ENDPOINTS.AUTH_REQUEST_PASSWORD_RESET, { method: 'POST', body: JSON.stringify({ email }) });
  }
  async resetPassword(token: string, newPassword: string) {
    return this.request(API_ENDPOINTS.AUTH_RESET_PASSWORD, { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  }

  // ------------------- Boards -------------------
async getBoards() {
  return this.request(API_ENDPOINTS.BOARDS_ALL, {
    method: 'GET',
  });
}

async createBoard(data: { name: string }) {
  return this.request(API_ENDPOINTS.BOARDS_CREATE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async getBoard(boardId: string) {
  return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), {
    method: 'GET',
  });
}

async updateBoard(boardId: string, data: { name: string }) {
  return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), {
    method: 'PATCH', // your backend uses PATCH not PUT
    body: JSON.stringify(data),
  });
}

async deleteBoard(boardId: string) {
  return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), {
    method: 'DELETE',
  });
}

  // ------------------- Board Members -------------------
// Members endpoints
async getMembers(boardId: string) {
  // Fetch all members for a board
  return this.request(API_ENDPOINTS.MEMBERS(boardId));
}

// services/api.ts
async addMember({ boardId, userId, role }: { boardId: string; userId: string; role: string }) {
  return this.request(`/members/${boardId}`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }), // boardId removed from body
  });
}

async updateMember(data: { boardId: string; userId: string; role: string }) {
  return this.request(`/members/${data.userId}`, {
    method: 'PUT',
    body: JSON.stringify({ boardId: data.boardId, role: data.role }),
    headers: { 'Content-Type': 'application/json' },
  });
}

async removeMember(data: { boardId: string; userId: string }) {
  return this.request(`/members/${data.userId}?boardId=${data.boardId}`, {
    method: 'DELETE',
  });
}



  // ------------------- Tasks -------------------
  async getBoardTasks(boardId: string) { return this.request(API_ENDPOINTS.BOARD_TASKS(boardId)); }
  async createTask(boardId: string, data: { title: string; notes?: string; startAt: string; endAt: string }) {
    return this.request(API_ENDPOINTS.BOARD_TASKS(boardId), { method: 'POST', body: JSON.stringify(data) });
  }
  async getTask(boardId: string, taskId: string) {
    this.log('info', 'Fetching task', { boardId, taskId });
    return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId));
  }


  async updateTask(boardId: string, taskId: string, data: any) {
  this.log('info', 'Updating task', { boardId, taskId, data });
  return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async toggleTask(boardId: string, taskId: string) {
  this.log('info', 'Toggling task', { boardId, taskId });
  return this.request(API_ENDPOINTS.TASK_TOGGLE(boardId, taskId), { method: 'PATCH' });
}

async deleteTask(boardId: string, taskId: string) {
  this.log('info', 'Deleting task', { boardId, taskId });
  return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), { method: 'DELETE' });
}

  // ------------------- Notifications -------------------
  async getNotifications() {
    return this.request(API_ENDPOINTS.NOTIFICATIONS);
  }

  async createNotification(data: { type: string; title: string; message: string; metadata?: any }) {
    return this.request(API_ENDPOINTS.NOTIFICATIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(API_ENDPOINTS.NOTIFICATION_READ(notificationId), {
      method: 'PATCH',
    });
  }

  // ------------------- Subscriptions -------------------
  async getSubscription(userId: string) {
    return this.request(API_ENDPOINTS.SUBSCRIPTIONS(userId));
  }


async createSubscription(data: { plan: string }): Promise<SubscriptionResponse> {
  const response = (await this.request(
    API_ENDPOINTS.SUBSCRIPTIONS_CREATE,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )) as any; // response from backend

  return {
    subscription: response.subscription,
    paymentUrl: response.paymentLink?.url, // map to `paymentUrl` here
  };
}


  async updateSubscription(userId: string, data: { memberCount?: number; status?: string }) {
    return this.request(API_ENDPOINTS.SUBSCRIPTIONS(userId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ------------------- Profile -------------------
  async getProfile(userId: string) {
    return this.request(API_ENDPOINTS.PROFILE(userId));
  }

  async updateProfile(userId: string, data: any) {
    return this.request(API_ENDPOINTS.PROFILE(userId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // async updateTask(boardId: string, taskId: string, data: any) {
  //   this.log('info', 'Updating task', { boardId, taskId, data });
  //   return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), { method: 'PUT', body: JSON.stringify(data) });
  // }
  // async toggleTask(boardId: string, taskId: string) {
  //   this.log('info', 'Toggling task', { boardId, taskId });
  //   return this.request(API_ENDPOINTS.BOARD_TASK_TOGGLE(boardId, taskId), { method: 'PATCH' });
  // }
  // async deleteTask(boardId: string, taskId: string) {
  //   this.log('info', 'Deleting task', { boardId, taskId });
  //   return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), { method: 'DELETE' });
  // }
}

export const apiClient = new ApiClient();
