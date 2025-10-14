import { API_CONFIG, ENABLE_API_LOGGING, API_ENDPOINTS } from "../config/api";

// ------------------- Types -------------------
export type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
};

export type Message = {
  id: string;
  authorId: string;
  text: string;
  tags?: string[];
  createdAt: string;
};

export type Conversation = {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SubscriptionResponse {
  subscription: any;
  paymentUrl?: string;
}

// ------------------- API CLIENT -------------------
export class ApiClient {
  private token: string | null = null;
  private requestId = 0;

  setToken(token: string | null) {
    this.token = token;
  }

  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  private log(level: "info" | "error", message: string, data?: any) {
    if (ENABLE_API_LOGGING) {
      console[level](`[ApiClient] ${message}`, data || "");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const requestId = this.generateRequestId();

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const requestConfig: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    };

    this.log("info", `${requestId} ${options.method || "GET"} ${endpoint}`, {
      url,
      headers: { ...Object.fromEntries(headers.entries()), Authorization: this.token ? "[REDACTED]" : undefined },
      body: options.body ? JSON.parse(options.body as string) : undefined,
    });

    try {
      const response = await fetch(url, requestConfig);
      this.log("info", `${requestId} Response ${response.status}`, { status: response.status });

      if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || parsed.error || text;
        } catch {}
        throw new ApiError(response.status, message || "An error occurred");
      }

      if (response.status === 204) return null;

      const data = await response.json();
      this.log("info", `${requestId} Success`, data);
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      this.log("error", `${requestId} Network Error`, err);
      throw new ApiError(0, "Network error. Please check your connection.");
    }
  }

  // ------------------- Auth -------------------
  async login(credentials: { email: string; password: string }) {
    return this.request(API_ENDPOINTS.AUTH_LOGIN, { method: "POST", body: JSON.stringify(credentials) });
  }

  async register(data: { firstName: string; lastName: string; email: string; password: string; country?: string; phone?: string }) {
    return this.request(API_ENDPOINTS.AUTH_REGISTER, { method: "POST", body: JSON.stringify(data) });
  }

  async verifyEmail(token: string) {
    return this.request(`${API_ENDPOINTS.AUTH_VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, { method: "GET" });
  }

  async requestPasswordReset(email: string) {
    return this.request(API_ENDPOINTS.AUTH_REQUEST_PASSWORD_RESET, { method: "POST", body: JSON.stringify({ email }) });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request(API_ENDPOINTS.AUTH_RESET_PASSWORD, { method: "POST", body: JSON.stringify({ token, newPassword }) });
  }

  // ------------------- Boards -------------------
  async getBoards() {
    return this.request(API_ENDPOINTS.BOARDS_ALL, { method: "GET" });
  }

  async createBoard(data: { name: string }) {
    return this.request(API_ENDPOINTS.BOARDS_CREATE, { method: "POST", body: JSON.stringify(data) });
  }

  async getBoard(boardId: string) {
    return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), { method: "GET" });
  }

  async updateBoard(boardId: string, data: { name: string }) {
    return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), { method: "PATCH", body: JSON.stringify(data) });
  }

  async deleteBoard(boardId: string) {
    return this.request(API_ENDPOINTS.BOARD_DETAIL(boardId), { method: "DELETE" });
  }

  // ------------------- Members -------------------
  async getMembers(boardId: string) {
    return this.request(API_ENDPOINTS.MEMBERS(boardId));
  }

  async addMember({ boardId, userId, role }: { boardId: string; userId: string; role: string }) {
    return this.request(`/members/${boardId}`, { method: "POST", body: JSON.stringify({ userId, role }) });
  }

  async updateMember(data: { boardId: string; userId: string; role: string }) {
    return this.request(`/members/${data.userId}`, { method: "PUT", body: JSON.stringify({ boardId: data.boardId, role: data.role }) });
  }

  async removeMember(data: { boardId: string; userId: string }) {
    return this.request(`/members/${data.userId}?boardId=${data.boardId}`, { method: "DELETE" });
  }

  // ------------------- Tasks -------------------
  async getBoardTasks(boardId: string) {
    return this.request(API_ENDPOINTS.BOARD_TASKS(boardId));
  }

  async createTask(boardId: string, data: { title: string; notes?: string; startAt: string; endAt: string }) {
    return this.request(API_ENDPOINTS.BOARD_TASKS(boardId), { method: "POST", body: JSON.stringify(data) });
  }

  async getTask(boardId: string, taskId: string) {
    return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId));
  }

  async updateTask(boardId: string, taskId: string, data: any) {
    return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), { method: "PUT", body: JSON.stringify(data) });
  }

  async toggleTask(boardId: string, taskId: string) {
    return this.request(API_ENDPOINTS.TASK_TOGGLE(boardId, taskId), { method: "PATCH" });
  }

  async deleteTask(boardId: string, taskId: string) {
    return this.request(API_ENDPOINTS.TASK_DETAIL(boardId, taskId), { method: "DELETE" });
  }

  // ------------------- Notifications -------------------
  async getNotifications() {
    return this.request(API_ENDPOINTS.NOTIFICATIONS);
  }

  async createNotification(data: { type: string; title: string; message: string; metadata?: any }) {
    return this.request(API_ENDPOINTS.NOTIFICATIONS, { method: "POST", body: JSON.stringify(data) });
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(API_ENDPOINTS.NOTIFICATION_READ(notificationId), { method: "PATCH" });
  }

  // ------------------- Subscriptions -------------------
  async getSubscription(userId: string) {
    return this.request(API_ENDPOINTS.SUBSCRIPTIONS(userId));
  }

  async createSubscription(data: { plan: string }): Promise<SubscriptionResponse> {
    const response = (await this.request(API_ENDPOINTS.SUBSCRIPTIONS_CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    })) as any;
    return { subscription: response.subscription, paymentUrl: response.paymentLink?.url };
  }

  async updateSubscription(userId: string, data: { memberCount?: number; status?: string }) {
    return this.request(API_ENDPOINTS.SUBSCRIPTIONS(userId), { method: "PATCH", body: JSON.stringify(data) });
  }

  // ------------------- Profile -------------------
  async getProfile(userId: string) {
    return this.request(API_ENDPOINTS.PROFILE(userId));
  }

  async updateProfile(userId: string, data: any) {
    return this.request(API_ENDPOINTS.PROFILE(userId), { method: "PATCH", body: JSON.stringify(data) });
  }

  // ------------------- Messages -------------------
  async searchUsers(query: string) {
    return this.request<User[]>(`${API_ENDPOINTS.USERS_SEARCH}?q=${encodeURIComponent(query)}`, { method: "GET" });
  }

  async createConversation(participantIds: string[]) {
    return this.request<Conversation>(API_ENDPOINTS.CONVERSATIONS_CREATE, {
      method: "POST",
      body: JSON.stringify({ participants: participantIds }),
    });
  }

  async getConversations() {
    return this.request<Conversation[]>(API_ENDPOINTS.CONVERSATIONS_ALL, { method: "GET" });
  }

  async getMessages(conversationId: string) {
    return this.request<Message[]>(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), { method: "GET" });
  }

  async sendMessage(conversationId: string, data: { text: string; tags?: string[] }) {
    return this.request<Message>(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ------------------- Friends -------------------
  /**
   * Send a friend request to another user.
   */
  async sendFriendRequest(receiverId: string) {
    return this.request(API_ENDPOINTS.FRIEND_REQUESTS, {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    });
  }

  /**
   * Get all incoming and outgoing friend requests for the authenticated user.
   */
  async getFriendRequests() {
    return this.request(API_ENDPOINTS.FRIEND_REQUESTS, { method: "GET" });
  }

  /**
   * Accept or reject a specific friend request.
   */
  async respondToFriendRequest(requestId: string, action: "accept" | "reject") {
    return this.request(API_ENDPOINTS.FRIEND_REQUEST_DETAIL(requestId), {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
  }

  /**
   * Get all confirmed friends for a given user.
   */
  async getFriends(userId: string) {
    return this.request(API_ENDPOINTS.USER_FRIENDS(userId), { method: "GET" });
  }

  /**
   * Get the friendship status between the authenticated user and another user.
   * Possible statuses: 'none' | 'pending' | 'requested' | 'friends'
   */
  async getFriendStatus(targetId: string): Promise<"none" | "pending" | "requested" | "friends"> {
    try {
      const res = await this.request<{ status: string }>(API_ENDPOINTS.FRIEND_STATUS(targetId));
      return (res?.status as any) || "none";
    } catch (error) {
      console.error("Error fetching friend status:", error);
      return "none";
    }
  }

}

export const apiClient = new ApiClient();
