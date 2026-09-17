import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import {
  Board,
  Task,
  TaskComment,
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { BoardMemberManagement } from "./BoardMemberManagement";
import {
  Plus,
  Users,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  Trash2,
  ArrowLeft,
  Award,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  TrendingUp,
  AlertCircle,
  BarChart2,
} from "lucide-react";
import {
  formatISO,
  addDays,
  format,
  parseISO,
  isBefore,
  differenceInMinutes,
} from "date-fns";

export function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<CreateTaskRequest>({
    title: "",
    notes: "",
    startAt: "",
    endAt: "",
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const [submittingTask, setSubmittingTask] = useState(false);

  // Inline comment state
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

  useEffect(() => {
    if (boardId) loadBoard();
  }, [boardId]);

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
      showToast("error", "Failed to load board", error.message || "Please try again.");
      navigate("/boards");
    } finally {
      setLoading(false);
    }
  };

  // ---- Comment helpers ----
  const toggleComments = async (taskId: string) => {
    const isOpen = openComments[taskId];
    setOpenComments((prev) => ({ ...prev, [taskId]: !isOpen }));
    if (!isOpen && !taskComments[taskId]) {
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
    if (!text || !boardId) return;
    setSubmittingComment((prev) => ({ ...prev, [taskId]: true }));
    try {
      const added = await apiClient.addTaskComment(boardId, taskId, text);
      setTaskComments((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), added as TaskComment],
      }));
      setCommentTexts((prev) => ({ ...prev, [taskId]: "" }));
    } catch (err: any) {
      showToast("error", "Failed to add comment", err.message);
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleInlineDeleteComment = async (taskId: string, commentId: string) => {
    if (!boardId) return;
    try {
      await apiClient.deleteTaskComment(boardId, taskId, commentId);
      setTaskComments((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((c) => c.id !== commentId),
      }));
    } catch (err: any) {
      showToast("error", "Failed to delete comment", err.message);
    }
  };

  // ---- Task CRUD ----
  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskFormData({
      title: "",
      notes: "",
      startAt: formatISO(new Date()),
      endAt: formatISO(addDays(new Date(), 1)),
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
    });
    setTaskFormErrors({});
    setTaskModalOpen(true);
  };

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};
    if (!taskFormData.title.trim()) errors.title = "Title is required";
    if (!taskFormData.startAt) errors.startAt = "Start date is required";
    if (!taskFormData.endAt) errors.endAt = "End date is required";
    if (taskFormData.startAt && taskFormData.endAt) {
      if (new Date(taskFormData.startAt) >= new Date(taskFormData.endAt)) {
        errors.endAt = "End date must be after start date";
      }
    }
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
      if (!boardId) throw new Error("Board ID is missing");

      if (editingTask) {
        const updateData: UpdateTaskRequest = {
          title: taskFormData.title.trim(),
          notes: taskFormData.notes?.trim() || undefined,
          startAt: startAtISO,
          endAt: endAtISO,
        };
        const updatedTask = await apiClient.updateTask(boardId, editingTask.id, updateData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t))
        );
        showToast("success", "Task updated", "");
      } else {
        const createData: CreateTaskRequest = {
          title: taskFormData.title.trim(),
          notes: taskFormData.notes?.trim() || undefined,
          startAt: startAtISO,
          endAt: endAtISO,
        };
        const newTask = await apiClient.createTask(boardId, createData) as Task;
        setTasks((prev) => [newTask, ...prev]);
        showToast("success", "Task created", "");
        await createNotification(
          "TASK_CREATED",
          "New task created",
          `Task "${newTask.title}" was created in board "${board?.name}"`,
          { boardId, taskId: newTask.id }
        );
      }

      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      showToast("error", "Failed to save task", error.message || "Please try again.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!boardId) return;
    try {
      const updated = await apiClient.toggleTask(boardId, task.id) as Task;
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t))
      );
      showToast("success", task.isDone ? "Task reopened" : "Task completed! 🎉", "");
    } catch (error: any) {
      showToast("error", "Failed to update task", error.message || "Please try again.");
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await apiClient.deleteTask(boardId!, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      showToast("success", "Task deleted", "");
    } catch (error: any) {
      showToast("error", "Failed to delete task", error.message || "Please try again.");
    }
  };

  const handleMembersUpdate = (updatedMembers: any[]) => {
    if (board) setBoard({ ...board, members: updatedMembers });
  };

  // ---- Derived state ----
  const allPending = tasks.filter((t) => !t.isDone);
  const allCompleted = tasks.filter((t) => t.isDone);
  const overdueTasks = allPending.filter((t) => isBefore(parseISO(t.endAt), now));

  const filteredPending = allPending.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompleted = allCompleted.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completionPct = tasks.length === 0 ? 0 : Math.round((allCompleted.length / tasks.length) * 100);

  const getDueAlert = (endAt: string) => {
    const dueDate = parseISO(endAt);
    const diff = differenceInMinutes(dueDate, now);
    if (isBefore(dueDate, now)) return { label: "Overdue", cls: "bg-red-100 text-red-700" };
    if (diff <= 60) return { label: "Due < 1h", cls: "bg-orange-100 text-orange-700" };
    if (diff <= 1440) return { label: "Due today", cls: "bg-yellow-100 text-yellow-700" };
    return { label: "On track", cls: "bg-green-100 text-green-700" };
  };

  const ownerDisplay = () => {
    if (!board) return "—";
    if (board.ownerId === user?.id) return "You";
    const name = [board.ownerFirstName, board.ownerLastName].filter(Boolean).join(" ");
    return name || "—";
  };

  const taskAuthorDisplay = (task: Task) => {
    const cb = (task as any).createdBy;
    if (!cb) return null;
    if (task.createdById === user?.id) return "You";
    const name = [cb.firstName, cb.lastName].filter(Boolean).join(" ");
    return name || cb.email?.split("@")[0] || null;
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Board not found</h2>
        <Button onClick={() => navigate("/boards")} className="mt-4">Back to Boards</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/boards")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              <span className="text-xs text-gray-500">
                Owner: <span className="font-medium text-green-700">{ownerDisplay()}</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {tasks.length} tasks • {board.members?.length || 1} members
              {overdueTasks.length > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  • {overdueTasks.length} overdue
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm" onClick={() => setShowMemberManagement(!showMemberManagement)}>
            <Users className="w-4 h-4 mr-2" /> Members
          </Button>
          <Button size="sm" onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {tasks.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<BarChart2 className="w-5 h-5 text-blue-600" />} label="Total" value={tasks.length} color="blue" />
          <StatCard icon={<Clock className="w-5 h-5 text-orange-600" />} label="Pending" value={allPending.length} color="orange" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} label="Completed" value={allCompleted.length} color="green" />
          <StatCard icon={<AlertCircle className="w-5 h-5 text-red-600" />} label="Overdue" value={overdueTasks.length} color="red" />
        </div>
      )}

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Progress
            </span>
            <span className="font-semibold text-gray-700">{completionPct}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: completionPct === 100
                  ? "linear-gradient(to right, #22c55e, #16a34a)"
                  : "linear-gradient(to right, #3b82f6, #6366f1)",
              }}
            />
          </div>
        </div>
      )}

      {showMemberManagement && (
        <div className="mb-8">
          <BoardMemberManagement board={board} onMembersUpdate={handleMembersUpdate} />
        </div>
      )}

      {/* Search */}
      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks…"
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Task columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending
                {allPending.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({filteredPending.length})</span>
                )}
              </h2>
              {overdueTasks.length > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {overdueTasks.length} overdue
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredPending.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">
                {searchQuery ? "No tasks match your search." : "No pending tasks — all done! 🎉"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPending.map((task) => {
                  const alert = getDueAlert(task.endAt);
                  const isOpen = openComments[task.id];
                  const comments = taskComments[task.id] || [];
                  const author = taskAuthorDisplay(task);
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="p-4 group">
                        <div className="flex items-start gap-3">
                          {/* Complete button — visible circle */}
                          <button
                            onClick={() => handleToggleTask(task)}
                            title="Mark complete"
                            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 hover:border-green-500 hover:bg-green-50 transition-all"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 leading-snug">{task.title}</h3>
                                {task.notes && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.notes}</p>
                                )}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.cls}`}>
                                {alert.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                Due {format(parseISO(task.endAt), "MMM d, h:mm a")}
                              </span>
                              {author && (
                                <span className="text-xs text-gray-400">
                                  by <span className="text-gray-600 font-medium">{author}</span>
                                </span>
                              )}
                            </div>

                            {/* Comments toggle */}
                            <button
                              onClick={() => toggleComments(task.id)}
                              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {isOpen ? (
                                <><span>Hide comments</span> <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <><span>Comments{comments.length > 0 ? ` (${comments.length})` : ""}</span> <ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline comment panel */}
                      {isOpen && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50 rounded-b-xl">
                          {loadingComments[task.id] ? (
                            <p className="text-xs text-gray-400 py-2">Loading…</p>
                          ) : comments.length === 0 ? (
                            <p className="text-xs text-gray-400 pb-2">No comments yet.</p>
                          ) : (
                            <div className="space-y-2 mb-3">
                              {comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2 group/cmt">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                                    {(c.firstName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-gray-700">
                                        {c.authorId === user?.id ? "You" : `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email?.split("@")[0]}
                                      </span>
                                      <span className="text-xs text-gray-400">{format(parseISO(c.createdAt), "MMM d, h:mm a")}</span>
                                      {c.authorId === user?.id && (
                                        <button
                                          onClick={() => handleInlineDeleteComment(task.id, c.id)}
                                          className="opacity-0 group-hover/cmt:opacity-100 text-gray-300 hover:text-red-500 transition"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{c.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-end">
                            <textarea
                              value={commentTexts[task.id] || ""}
                              onChange={(e) => setCommentTexts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleInlineAddComment(task.id); }}
                              placeholder="Add comment… (Ctrl+Enter)"
                              rows={2}
                              className="flex-1 text-xs rounded-lg border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none bg-white"
                            />
                            <button
                              onClick={() => handleInlineAddComment(task.id)}
                              disabled={!commentTexts[task.id]?.trim() || submittingComment[task.id]}
                              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition"
                            >
                              <Send className="w-3.5 h-3.5" />
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
            <h2 className="text-lg font-semibold text-gray-900">
              Completed
              {allCompleted.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({filteredCompleted.length})</span>
              )}
            </h2>
          </CardHeader>
          <CardContent>
            {filteredCompleted.length === 0 ? (
              <p className="text-gray-400 text-center py-10 text-sm">
                {searchQuery ? "No tasks match your search." : "No completed tasks yet — keep going!"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredCompleted.map((task) => {
                  const author = taskAuthorDisplay(task);
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-green-100 bg-green-50 group flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/boards/${boardId}/tasks/${task.id}`}
                          className="font-medium text-green-800 hover:text-green-600 hover:underline inline-flex items-center gap-1"
                        >
                          {task.title}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        {task.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.notes}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            Completed {format(parseISO(task.updatedAt), "MMM d, yyyy")}
                          </p>
                          {author && (
                            <span className="text-xs text-gray-400">
                              by <span className="font-medium text-gray-600">{author}</span>
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/boards/${boardId}/tasks/${task.id}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                        >
                          <MessageSquare className="w-3 h-3" /> View notes &amp; comments
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleToggleTask(task)}
                          title="Reopen task"
                          className="p-1 text-gray-400 hover:text-orange-500"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          title="Delete"
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <form onSubmit={handleTaskSubmit} className="space-y-5">
          <Input
            label="Task title"
            value={taskFormData.title}
            onChange={(e) => setTaskFormData((prev) => ({ ...prev, title: e.target.value }))}
            error={taskFormErrors.title}
            placeholder="What needs to be done?"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={taskFormData.notes}
              onChange={(e) => setTaskFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Add context, links, or details…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date & time"
              type="datetime-local"
              value={taskFormData.startAt}
              onChange={(e) => setTaskFormData((prev) => ({ ...prev, startAt: e.target.value }))}
              error={taskFormErrors.startAt}
              required
            />
            <Input
              label="End date & time"
              type="datetime-local"
              value={taskFormData.endAt}
              onChange={(e) => setTaskFormData((prev) => ({ ...prev, endAt: e.target.value }))}
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

// ---- Small stat card ----
function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "orange" | "green" | "red";
}) {
  const bg = {
    blue: "bg-blue-50 border-blue-100",
    orange: "bg-orange-50 border-orange-100",
    green: "bg-green-50 border-green-100",
    red: "bg-red-50 border-red-100",
  }[color];

  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${bg}`}>
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
