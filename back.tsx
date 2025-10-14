import React, { useEffect, useRef, useState } from "react";
import { Search, MessageCircle, UserPlus } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { apiClient } from "../../services/api";

// ------------------ Types ------------------
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
}

interface Message {
  id: string;
  authorId: string;
  text: string;
  tags?: string[];
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
}

// ------------------ Component ------------------
export function Messages() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [composerText, setComposerText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ------------- Debounced User Search -------------
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const users = await apiClient.searchUsers(searchQuery);
        setSearchResults(users || []);
      } catch (err) {
        console.error("User search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ------------- Load First 10 Conversations -------------
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const convs: Conversation[] = await apiClient.getConversations({ limit: 10, offset: 0 });
        setConversations(convs || []);
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  // ------------- WebSocket Setup -------------
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const baseHost = window.location.host.replace(/:\d+$/, "");
    const wsUrl = `${protocol}://${baseHost}:4000/ws?userId=${user.id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket connected");
    ws.onclose = () => console.log("❌ WebSocket closed");
    ws.onerror = (err) => console.error("⚠️ WS error:", err);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          const incoming: Message = data.message;
          const convId: string = data.conversationId;

          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, lastMessage: incoming } : c))
          );

          if (selectedConv?.id === convId) {
            setMessages((m) => [...m, incoming]);
            scrollToBottom();
          }
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    return () => ws.close();
  }, [user, selectedConv?.id]);

  // ------------- Load Messages for Selected Conversation -------------
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const msgs = await apiClient.getMessages(selectedConv.id);
        if (!cancelled) {
          setMessages(msgs || []);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedConv]);

  // ------------- Helper Functions -------------
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const displayName = (u?: User) => {
    if (!u) return "Unknown";
    if (u.firstName || u.lastName) return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
    return u.email?.split("@")[0] || "User";
  };

  const convTitle = (conv: Conversation, myId?: string) => {
    const others = conv.participants.filter((p) => p.id !== myId);
    if (!others.length) return "You";
    return others.map(displayName).join(", ");
  };

  const startConversationWith = async (target: User) => {
    try {
      const existing = conversations.find(
        (c) =>
          c.participants.length === 2 &&
          c.participants.some((p) => p.id === target.id) &&
          c.participants.some((p) => p.id === user?.id)
      );

      if (existing) {
        setSelectedConv(existing);
        return;
      }

      const newConv = await apiClient.createConversation([target.id]);
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConv(newConv);
    } catch (err) {
      console.error("Start conversation error:", err);
    }
  };

  const handleSend = async () => {
    if (!selectedConv || !composerText.trim() || !user) return;
    setSending(true);

    const text = composerText.trim();
    const tags = Array.from(text.matchAll(/@([A-Za-z0-9._-]+)/g)).map((m) => m[1]);

    const optimisticMsg: Message = {
      id: `tmp-${Date.now()}`,
      authorId: user.id,
      text,
      tags,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setComposerText("");
    scrollToBottom();

    try {
      const saved = await apiClient.sendMessage(selectedConv.id, { text, tags });
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? saved : m)));
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConv.id ? { ...c, lastMessage: saved } : c))
      );
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  // ------------------ UI ------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Messages</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm w-64 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2">
              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-2 mb-3">
                  {isSearching ? (
                    <p className="text-sm text-gray-500 px-3 py-4">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-gray-500 px-3 py-4">No users found</p>
                  ) : (
                    searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{displayName(u)}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <Button onClick={() => startConversationWith(u)} variant="outline" size="sm">
                          <UserPlus className="w-4 h-4 mr-2" /> Message
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Conversations */}
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <p className="p-4 text-sm text-gray-500">Loading conversations...</p>
                ) : conversations.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedConv?.id === conv.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conv.participants
                              .filter((p) => p.id !== user?.id)
                              .map(displayName)
                              .join(", ") || "You"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {conv.lastMessage
                              ? `${conv.lastMessage.text.slice(0, 50)}${
                                  conv.lastMessage.text.length > 50 ? "…" : ""
                                }`
                              : "No messages"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">
                            {conv.lastMessage
                              ? formatDistanceToNow(parseISO(conv.lastMessage.createdAt), {
                                  addSuffix: true,
                                })
                              : ""}
                          </p>
                          {conv.unreadCount ? (
                            <span className="text-xs text-white bg-blue-600 rounded-full px-2 py-0.5 mt-1 inline-block">
                              {conv.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedConv ? convTitle(selectedConv, user?.id) : "Select a conversation"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedConv
                      ? `${selectedConv.participants.length} participant(s)`
                      : "No conversation selected"}
                  </p>
                </div>
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>

            <CardContent className="p-4 flex flex-col h-[60vh]">
              {!selectedConv ? (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to start messaging
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.authorId === user?.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-xl ${
                            m.authorId === user?.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="text-sm">{m.text}</div>
                          {m.tags?.length ? (
                            <div className="text-xs text-blue-100 mt-1">
                              {m.tags.map((t) => `@${t}`).join(", ")}
                            </div>
                          ) : null}
                          <p className="text-xs text-gray-300 mt-1 text-right">
                            {formatDistanceToNow(parseISO(m.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <div className="mt-auto">
                    <div className="flex items-center space-x-2">
                      <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder="Write a message — use @username to tag"
                        className="flex-1 min-h-[48px] max-h-36 resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500"
                      />
                      <Button onClick={handleSend} disabled={sending || !composerText.trim()}>
                        Send
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




import { API_CONFIG, ENABLE_API_LOGGING, API_ENDPOINTS } from '../config/api';
// src/types.ts

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

// ------------------- Messages -------------------
async searchUsers(query: string) {
  return this.request<User[]>(`${API_ENDPOINTS.USERS_SEARCH}?q=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}

async createConversation(participantIds: string[]) {
  return this.request<Conversation>(API_ENDPOINTS.CONVERSATIONS_CREATE, {
    method: 'POST',
    body: JSON.stringify({ participants: participantIds }),
  });
}

async getConversations() {
  return this.request<Conversation[]>(API_ENDPOINTS.CONVERSATIONS_ALL, {
    method: 'GET',
  });
}

async getMessages(conversationId: string) {
  return this.request<Message[]>(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
    method: 'GET',
  });
}

async sendMessage(conversationId: string, data: { text: string; tags?: string[] }) {
  return this.request<Message>(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

}

export const apiClient = new ApiClient();
