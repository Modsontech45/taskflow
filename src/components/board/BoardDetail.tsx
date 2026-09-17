import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import {
  Board, Task, TaskComment, TaskPriority,
  CreateTaskRequest, UpdateTaskRequest,
} from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { BoardMemberManagement } from "./BoardMemberManagement";
import {
  Plus, Users, CheckCircle2, Circle, Clock, Edit, Trash2,
  ArrowLeft, Award, MessageSquare, Send, ChevronDown, ChevronUp,
  ExternalLink, Search, TrendingUp, AlertCircle, BarChart2, Mic,
  MicOff, Activity,
} from "lucide-react";
import {
  formatISO, addDays, format, parseISO, isBefore, differenceInMinutes,
} from "date-fns";
import { useVoiceInput } from "../../hooks/useVoiceInput";

// ---- Priority config ----
const PRIORITY_CFG: Record<TaskPriority, { label: string; cls: string; dot: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  HIGH:   { label: "High",   cls: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  MEDIUM: { label: "Medium", cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  LOW:    { label: "Low",    cls: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

export function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const voice = useVoiceInput();

  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActivity, setShowActivity] = useState(false);

  // Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<CreateTaskRequest & { priority: TaskPriority; assigneeId: string }>({
    title: "", notes: "", startAt: "", endAt: "", priority: "MEDIUM", assigneeId: "",
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const [submittingTask, setSubmittingTask] = useState(false);

  // Inline comments
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (boardId) loadBoard(); }, [boardId]);

  const loadBoard = async () => {
    if (!boardId) return;
    try {
      const [boardData, tasksData] = await Promise.all([
        apiClient.getBoard(boardId),
        apiClient.getBoardTasks(boardId),
      ]);
      setBoard(boardData as Board);
      setTasks((tasksData as Task[]) || []);
    } catch (error: any) {
      showToast("error", "Failed to load board", error.message);
      navigate("/boards");
    } finally {
      setLoading(false);
    }
  };

  // ---- Voice ----
  const handleVoice = () => {
    if (voice.state === "listening") { voice.stopListening(); return; }

    handleCreateTask(); // open modal first
    setTimeout(() => {
      voice.startListening((parsed, raw) => {
        setTaskFormData((prev) => ({
          ...prev,
          title: parsed.title,
          notes: raw !== parsed.title ? `Voice: "${raw}"` : "",
          priority: parsed.priority,
          endAt: format(parseISO(parsed.endAt), "yyyy-MM-dd'T'HH:mm"),
        }));
        showToast("success", "Voice captured", `"${parsed.title}" · ${parsed.priority}`);
      });
    }, 300);
  };

  // ---- Comments ----
  const toggleComments = async (taskId: string) => {
    setOpenComments((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
    if (!openComments[taskId] && !taskComments[taskId]) {
      setLoadingComments((prev) => ({ ...prev, [taskId]: true }));
      try {
        const data = await apiClient.getTaskComments(boardId!, taskId);
        setTaskComments((prev) => ({ ...prev, [taskId]: (data as TaskComment[]) || [] }));
      } catch {
        setTaskComments((prev) => ({ ...prev, [taskId]: [] }));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [taskId]: false }));
      }
    }
  };

  const handleInlineAddComment = async (taskId: string) => {
    const text = commentTexts[taskId]?.trim();
    if (!text) return;
    setSubmittingComment((prev) => ({ ...prev, [taskId]: true }));
    try {
      const added = await apiClient.addTaskComment(boardId!, taskId, text);
      setTaskComments((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), added as TaskComment] }));
      setCommentTexts((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err: any) {
      showToast("error", "Failed to add comment", err.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleInlineDeleteComment = async (taskId: string, commentId: string) => {
    try {
      await apiClient.deleteTaskComment(boardId!, taskId, commentId);
      setTaskComments((prev) => ({ ...prev, [taskId]: (prev[taskId] || []).filter((c) => c.id !== commentId) }));
    } catch (err: any) {
      showToast("error", "Failed to delete comment", err.message);
    }
  };

  // ---- Task CRUD ----
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormData({
      title: "", notes: "",
      startAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      priority: "MEDIUM", assigneeId: "",
    });
    setTaskFormErrors({});
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      notes: task.notes || "",
      startAt: format(parseISO(task.startAt), "yyyy-MM-dd'T'HH:mm"),
      endAt: format(parseISO(task.endAt), "yyyy-MM-dd'T'HH:mm"),
      priority: task.priority || "MEDIUM",
      assigneeId: task.assigneeId || "",
    });
    setTaskFormErrors({});
    setTaskModalOpen(true);
  };

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};
    if (!taskFormData.title.trim()) errors.title = "Title is required";
    if (!taskFormData.startAt) errors.startAt = "Start date is required";
    if (!taskFormData.endAt) errors.endAt = "End date is required";
    if (taskFormData.startAt && taskFormData.endAt &&
        new Date(taskFormData.startAt) >= new Date(taskFormData.endAt))
      errors.endAt = "End date must be after start date";
    return errors;
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateTaskForm();
    if (Object.keys(errors).length > 0) { setTaskFormErrors(errors); return; }
    setSubmittingTask(true);
    try {
      const startAtISO = new Date(taskFormData.startAt).toISOString();
      const endAtISO = new Date(taskFormData.endAt).toISOString();

      const payload = {
        title: taskFormData.title.trim(),
        notes: taskFormData.notes?.trim() || undefined,
        startAt: startAtISO,
        endAt: endAtISO,
        priority: taskFormData.priority,
        assigneeId: taskFormData.assigneeId || null,
      };

      if (editingTask) {
        const updated = await apiClient.updateTask(boardId!, editingTask.id, payload);
        setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, ...updated } : t));
        showToast("success", "Task updated", "");
      } else {
        const newTask = await apiClient.createTask(boardId!, payload) as Task;
        setTasks((prev) => [newTask, ...prev]);
        showToast("success", "Task created", "");
        await createNotification("TASK_CREATED", "New task created",
          `"${newTask.title}" created in "${board?.name}"`, { boardId, taskId: newTask.id });
      }
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      showToast("error", "Failed to save task", error.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const updated = await apiClient.toggleTask(boardId!, task.id) as Task;
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...updated } : t));
      if (!task.isDone) showToast("success", "Task completed! 🎉", "");
    } catch (error: any) {
      showToast("error", "Failed to update task", error.message);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await apiClient.deleteTask(boardId!, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error: any) {
      showToast("error", "Failed to delete task", error.message);
    }
  };

  const handleMembersUpdate = (updatedMembers: any[]) => {
    if (board) setBoard({ ...board, members: updatedMembers });
  };

  // ---- Derived ----
  const allPending = tasks.filter((t) => !t.isDone);
  const allCompleted = tasks.filter((t) => t.isDone);
  const overdueTasks = allPending.filter((t) => isBefore(parseISO(t.endAt), now));
  const completionPct = tasks.length === 0 ? 0 : Math.round((allCompleted.length / tasks.length) * 100);

  const filteredPending = allPending.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompleted = allCompleted.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDueAlert = (endAt: string) => {
    const diff = differenceInMinutes(parseISO(endAt), now);
    if (isBefore(parseISO(endAt), now)) return { label: "Overdue", cls: "bg-red-100 text-red-700" };
    if (diff <= 60) return { label: "Due < 1h", cls: "bg-orange-100 text-orange-700" };
    if (diff <= 1440) return { label: "Due today", cls: "bg-yellow-100 text-yellow-700" };
    return null;
  };

  const ownerDisplay = () => {
    if (!board) return "—";
    if (board.ownerId === user?.id) return "You";
    return [board.ownerFirstName, board.ownerLastName].filter(Boolean).join(" ") || "—";
  };

  const taskAuthorDisplay = (task: Task) => {
    const cb = task.createdBy;
    if (!cb) return null;
    if (task.createdById === user?.id) return "You";
    return [cb.firstName, cb.lastName].filter(Boolean).join(" ") || cb.email?.split("@")[0] || null;
  };

  const boardMembers = board?.members || [];

  // ---- Activity feed from existing data ----
  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      text: t.isDone ? `✅ Completed: ${t.title}` : `📝 Task: ${t.title}`,
      time: t.updatedAt,
      isDone: t.isDone,
    }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="max-w-7xl mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold">Board not found</h2>
        <Button onClick={() => navigate("/boards")} className="mt-4">Back to Boards</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/boards")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            {/* Board emoji/color badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
              style={{ backgroundColor: board.color || "#3b82f6" }}
            >
              {board.emoji || "📋"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
                <span className="text-xs text-gray-500">
                  Owner: <span className="font-semibold text-green-700">{ownerDisplay()}</span>
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {tasks.length} tasks • {board.members?.length || 1} members
                {overdueTasks.length > 0 && <span className="text-red-600 font-medium ml-2">• {overdueTasks.length} overdue</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setShowActivity(!showActivity)}>
            <Activity className="w-4 h-4 mr-1" /> Activity
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowMemberManagement(!showMemberManagement)}>
            <Users className="w-4 h-4 mr-1" /> Members
          </Button>
          {/* Voice button */}
          {voice.isSupported && (
            <Button
              variant={voice.state === "listening" ? "danger" : "outline"}
              size="sm"
              onClick={handleVoice}
              title="Create task by speaking"
            >
              {voice.state === "listening" ? (
                <><MicOff className="w-4 h-4 mr-1 animate-pulse" /> Stop</>
              ) : (
                <><Mic className="w-4 h-4 mr-1" /> Voice</>
              )}
            </Button>
          )}
          <Button size="sm" onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-1" /> Add Task
          </Button>
        </div>
      </div>

      {/* Voice feedback */}
      {voice.state !== "idle" && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
          voice.state === "listening" ? "bg-red-50 border border-red-200 text-red-700" :
          voice.state === "error" ? "bg-red-50 text-red-700" :
          "bg-blue-50 border border-blue-200 text-blue-700"
        }`}>
          <Mic className="w-4 h-4 flex-shrink-0" />
          {voice.state === "listening" && <span className="animate-pulse">Listening… speak your task now</span>}
          {voice.state === "processing" && <span>Processing…</span>}
          {voice.state === "error" && <span>{voice.error}</span>}
        </div>
      )}

      {/* Activity feed */}
      {showActivity && (
        <Card className="mb-6">
          <CardHeader><h3 className="font-semibold text-gray-800 flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Activity</h3></CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{a.text}</span>
                    <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                      {format(parseISO(a.time), "MMM d, h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {showMemberManagement && (
        <div className="mb-6">
          <BoardMemberManagement board={board} onMembersUpdate={handleMembersUpdate} />
        </div>
      )}

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<BarChart2 className="w-4 h-4 text-blue-600" />} label="Total" value={tasks.length} color="blue" />
          <StatCard icon={<Clock className="w-4 h-4 text-orange-500" />} label="Pending" value={allPending.length} color="orange" />
          <StatCard icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} label="Done" value={allCompleted.length} color="green" />
          <StatCard icon={<AlertCircle className="w-4 h-4 text-red-500" />} label="Overdue" value={overdueTasks.length} color="red" />
        </div>
      )}

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-sm text-gray-500 mb-1.5">
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Progress</span>
            <span className="font-bold text-gray-800">{completionPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPct}%`,
                background: completionPct === 100
                  ? "linear-gradient(to right,#22c55e,#16a34a)"
                  : "linear-gradient(to right,#3b82f6,#8b5cf6)",
              }}
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Pending <span className="text-gray-400 font-normal text-sm">({filteredPending.length})</span>
              </h2>
              {overdueTasks.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{overdueTasks.length} overdue</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredPending.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">{searchQuery ? "No matches." : "No pending tasks — all done! 🎉"}</p>
                {!searchQuery && (
                  <button onClick={handleCreateTask} className="mt-3 text-sm text-blue-600 hover:underline">
                    + Add your first task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPending.map((task) => {
                  const alert = getDueAlert(task.endAt);
                  const priority = PRIORITY_CFG[task.priority || "MEDIUM"];
                  const isOpen = openComments[task.id];
                  const comments = taskComments[task.id] || [];
                  const author = taskAuthorDisplay(task);
                  return (
                    <div key={task.id} className="rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all">
                      <div className="p-3 group">
                        <div className="flex items-start gap-2.5">
                          {/* Priority dot + complete button */}
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            <button
                              onClick={() => handleToggleTask(task)}
                              title="Mark complete"
                              className="w-5 h-5 rounded-full border-2 border-gray-400 hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0"
                            />
                            <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} title={priority.label} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-medium text-gray-900 text-sm leading-snug">{task.title}</h3>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button onClick={() => handleEditTask(task)} className="p-1 text-gray-400 hover:text-blue-600">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteTask(task)} className="p-1 text-gray-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {task.notes && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.notes}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priority.cls}`}>
                                {priority.label}
                              </span>
                              {alert && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${alert.cls}`}>
                                  {alert.label}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                {format(parseISO(task.endAt), "MMM d, h:mm a")}
                              </span>
                              {task.assignee && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
                                  → {task.assignee.id === user?.id ? "You" : `${task.assignee.firstName} ${task.assignee.lastName}`.trim()}
                                </span>
                              )}
                              {author && (
                                <span className="text-xs text-gray-400">by {author}</span>
                              )}
                            </div>

                            <button
                              onClick={() => toggleComments(task.id)}
                              className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {isOpen ? <><span>Hide</span><ChevronUp className="w-3 h-3" /></> : <><span>Comments{comments.length > 0 ? ` (${comments.length})` : ""}</span><ChevronDown className="w-3 h-3" /></>}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline comments */}
                      {isOpen && (
                        <div className="border-t border-gray-100 px-3 pb-3 pt-2 bg-gray-50 rounded-b-xl">
                          {loadingComments[task.id] ? (
                            <p className="text-xs text-gray-400 py-1">Loading…</p>
                          ) : comments.length === 0 ? (
                            <p className="text-xs text-gray-400 pb-2">No comments yet.</p>
                          ) : (
                            <div className="space-y-2 mb-2">
                              {comments.map((c) => (
                                <div key={c.id} className="flex gap-2 group/cmt">
                                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {(c.firstName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-gray-700">
                                        {c.authorId === user?.id ? "You" : `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email?.split("@")[0]}
                                      </span>
                                      <span className="text-xs text-gray-400">{format(parseISO(c.createdAt), "MMM d, h:mm a")}</span>
                                      {c.authorId === user?.id && (
                                        <button onClick={() => handleInlineDeleteComment(task.id, c.id)}
                                          className="opacity-0 group-hover/cmt:opacity-100 text-gray-300 hover:text-red-500 transition">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-end">
                            <textarea
                              value={commentTexts[task.id] || ""}
                              onChange={(e) => setCommentTexts((p) => ({ ...p, [task.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleInlineAddComment(task.id); }}
                              placeholder="Comment… (Ctrl+Enter)"
                              rows={2}
                              className="flex-1 text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-white"
                            />
                            <button
                              onClick={() => handleInlineAddComment(task.id)}
                              disabled={!commentTexts[task.id]?.trim() || submittingComment[task.id]}
                              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">
              Completed <span className="text-gray-400 font-normal text-sm">({filteredCompleted.length})</span>
            </h2>
          </CardHeader>
          <CardContent>
            {filteredCompleted.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">
                {searchQuery ? "No matches." : "Complete a task to see it here 💪"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredCompleted.map((task) => {
                  const priority = PRIORITY_CFG[task.priority || "MEDIUM"];
                  const author = taskAuthorDisplay(task);
                  return (
                    <div key={task.id} className="p-3 rounded-xl border border-green-100 bg-green-50 group flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/boards/${boardId}/tasks/${task.id}`}
                          className="text-sm font-medium text-green-800 hover:underline inline-flex items-center gap-1"
                        >
                          {task.title} <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priority.cls}`}>
                            {priority.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(parseISO(task.updatedAt), "MMM d, yyyy")}
                          </span>
                          {author && <span className="text-xs text-gray-400">by {author}</span>}
                        </div>
                        <Link to={`/boards/${boardId}/tasks/${task.id}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                          <MessageSquare className="w-3 h-3" /> Notes &amp; comments
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => handleToggleTask(task)} title="Reopen" className="p-1 text-gray-400 hover:text-orange-500">
                          <Circle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTask(task)} title="Delete" className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="lg"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          {/* Voice hint */}
          {voice.isSupported && !editingTask && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 rounded-xl px-3 py-2">
              <Mic className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span>Tip: Close this modal and click <strong>Voice</strong> to speak your task</span>
            </div>
          )}

          <Input
            label="Task title"
            value={taskFormData.title}
            onChange={(e) => setTaskFormData((p) => ({ ...p, title: e.target.value }))}
            error={taskFormErrors.title}
            placeholder="What needs to be done?"
            required
          />

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={taskFormData.priority}
                onChange={(e) => setTaskFormData((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="URGENT">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select
                value={taskFormData.assigneeId}
                onChange={(e) => setTaskFormData((p) => ({ ...p, assigneeId: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {user && (
                  <option value={user.id}>You ({user.firstName})</option>
                )}
                {boardMembers
                  .filter((m) => m.userId !== user?.id)
                  .map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={taskFormData.notes}
              onChange={(e) => setTaskFormData((p) => ({ ...p, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Add context, links, or details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date & time"
              type="datetime-local"
              value={taskFormData.startAt}
              onChange={(e) => setTaskFormData((p) => ({ ...p, startAt: e.target.value }))}
              error={taskFormErrors.startAt}
              required
            />
            <Input
              label="End date & time"
              type="datetime-local"
              value={taskFormData.endAt}
              onChange={(e) => setTaskFormData((p) => ({ ...p, endAt: e.target.value }))}
              error={taskFormErrors.endAt}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => { setTaskModalOpen(false); setEditingTask(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingTask}>
              {editingTask ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 border-blue-100", orange: "bg-orange-50 border-orange-100",
    green: "bg-green-50 border-green-100", red: "bg-red-50 border-red-100",
  };
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-2.5 ${bg[color] || bg.blue}`}>
      {icon}
      <div>
        <p className="text-xs text-gray-500 leading-none">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
