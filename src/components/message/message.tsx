import React, { useEffect, useRef, useState } from "react";
import { Search, MessageCircle, UserPlus, Check, X } from "lucide-react";
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
  friendStatus?: "none" | "pending" | "requested" | "friends";
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

  // ---------------- Search Users ----------------
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
        const withStatus = await Promise.all(
          users.map(async (u: User) => {
            const status = await apiClient.getFriendStatus(u.id);
            return { ...u, friendStatus: status };
          })
        );
        setSearchResults(withStatus);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // ---------------- Load Conversations ----------------
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const convs = await apiClient.getConversations();
        setConversations(convs || []);
      } catch (err) {
        console.error("Load conversations error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, []);

  // ---------------- WebSocket Setup ----------------
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const baseHost = window.location.host.replace(/:\d+$/, "");
    const wsUrl = `${protocol}://${baseHost}:4000/ws?userId=${user.id}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        const msg = data.message;
        const convId = data.conversationId;

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, lastMessage: msg } : c
          )
        );

        if (selectedConv?.id === convId) {
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
        }
      }
    };

    return () => ws.close();
  }, [user, selectedConv]);

  // ---------------- Load Messages ----------------
  useEffect(() => {
    if (!selectedConv) return;
    (async () => {
      const msgs = await apiClient.getMessages(selectedConv.id);
      setMessages(msgs || []);
      scrollToBottom();
    })();
  }, [selectedConv]);

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

  const displayName = (u: User) =>
    u.firstName || u.lastName
      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
      : u.email?.split("@")[0] || "User";

  // ---------------- Friend Requests ----------------
  const sendFriendRequest = async (targetId: string) => {
    try {
      await apiClient.sendFriendRequest(targetId);
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, friendStatus: "requested" } : u))
      );
    } catch (err) {
      console.error("Send friend request error:", err);
    }
  };

  const respondToRequest = async (requestId: string, accept: boolean) => {
    try {
      await apiClient.respondToFriendRequest(requestId, accept);
      setSearchResults((prev) =>
        prev.map((u) => (u.id === requestId ? { ...u, friendStatus: "friends" } : u))
      );
    } catch (err) {
      console.error("Respond to request error:", err);
    }
  };

  // ---------------- Messaging ----------------
  const startConversationWith = async (target: User) => {
    if (target.friendStatus !== "friends") return alert("You must be friends first!");
    const newConv = await apiClient.createConversation([target.id]);
    setConversations((prev) => [newConv, ...prev]);
    setSelectedConv(newConv);
  };

  const handleSend = async () => {
    if (!selectedConv || !composerText.trim()) return;
    setSending(true);
    const text = composerText.trim();
    const tags = Array.from(text.matchAll(/@(\w+)/g)).map((m) => m[1]);

    const tempMsg: Message = {
      id: `tmp-${Date.now()}`,
      authorId: user.id,
      text,
      tags,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setComposerText("");
    scrollToBottom();

    try {
      const saved = await apiClient.sendMessage(selectedConv.id, { text, tags });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? saved : m))
      );
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  // ---------------- UI ----------------
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

                        {u.friendStatus === "none" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendFriendRequest(u.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" /> Add
                          </Button>
                        )}

                        {u.friendStatus === "requested" && (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}

                        {u.friendStatus === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToRequest(u.id, true)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToRequest(u.id, false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {u.friendStatus === "friends" && (
                          <Button
                            onClick={() => startConversationWith(u)}
                            variant="outline"
                            size="sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" /> Message
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Conversations */}
              {!searchQuery && (
                <div className="divide-y divide-gray-100">
                  {loading ? (
                    <p className="p-4 text-sm text-gray-500">Loading...</p>
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
                        <p className="text-sm font-medium">
                          {conv.participants
                            .filter((p) => p.id !== user?.id)
                            .map(displayName)
                            .join(", ") || "You"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.lastMessage
                            ? conv.lastMessage.text.slice(0, 50)
                            : "No messages yet"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {selectedConv ? "Conversation" : "Select a conversation"}
              </h3>
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
                        className={`flex ${
                          m.authorId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-xl ${
                            m.authorId === user?.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="text-sm">{m.text}</div>
                          <p className="text-xs mt-1 text-right opacity-60">
                            {formatDistanceToNow(parseISO(m.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="mt-auto flex items-center space-x-2">
                    <textarea
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder="Write a message..."
                      className="flex-1 min-h-[48px] resize-none rounded-lg border border-gray-200 p-3 focus:ring-1 focus:ring-blue-500"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !composerText.trim()}
                    >
                      Send
                    </Button>
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
