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
  Calendar,
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

  // Inline comment state for pending tasks
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [taskComments, setTaskComments] = useState<Record<string, TaskComment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Re-render every minute for due alerts
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

  // ---- Inline comment helpers ----
  const toggleComments = async (taskId: string) => {
    const isOpen = openComments[taskId];
    if (isOpen) {
      setOpenComments((prev) => ({ ...prev, [taskId]: false }));
      return;
    }

    setOpenComments((prev) => ({ ...prev, [taskId]: true }));

    if (!taskComments[taskId]) {
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
        showToast("success", "Task updated", "The task has been updated successfully.");
      } else {
        const createData: CreateTaskRequest = {
          title: taskFormData.title.trim(),
          notes: taskFormData.notes?.trim() || undefined,
          startAt: startAtISO,
          endAt: endAtISO,
        };
        const newTask = await apiClient.createTask(boardId, createData) as Task;
        setTasks((prev) => [newTask, ...prev]);
        showToast("success", "Task created", "The task has been created successfully.");
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
      await apiClient.toggleTask(boardId, task.id);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isDone: !t.isDone } : t))
      );
      showToast("success", task.isDone ? "Task reopened" : "Task completed", "");
    } catch (error: any) {
      showToast("error", "Failed to update task", error.message || "Please try again.");
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    try {
      await apiClient.deleteTask(boardId!, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      showToast("success", "Task deleted", "The task has been deleted successfully.");
    } catch (error: any) {
      showToast("error", "Failed to delete task", error.message || "Please try again.");
    }
  };

  const handleMembersUpdate = (updatedMembers: any[]) => {
    if (board) setBoard({ ...board, members: updatedMembers });
  };

  const completedTasks = tasks.filter((t) => t.isDone);
  const pendingTasks = tasks.filter((t) => !t.isDone);

  const getDueAlert = (endAt: string) => {
    const dueDate = parseISO(endAt);
    const diff = differenceInMinutes(dueDate, now);
    if (isBefore(dueDate, now)) return { message: "Overdue", color: "text-red-600 font-semibold" };
    if (diff <= 60) return { message: "Due soon (within 1h)", color: "text-orange-500 font-semibold" };
    if (diff <= 1440) return { message: "Due today", color: "text-yellow-600 font-semibold" };
    return { message: "On track", color: "text-green-600 font-semibold" };
  };

  const ownerDisplay = () => {
    if (!board) return "Unknown";
    if (board.ownerId === user?.id) return "You";
    const name = [board.ownerFirstName, board.ownerLastName].filter(Boolean).join(" ");
    return name || "Unknown";
  };

  const commentCount = (taskId: string) => taskComments[taskId]?.length ?? null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="text-gray-600 text-lg">Loading board...</span>
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
      <div className="flex flex-col sm:flex-row justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/boards")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">{board.name}</h1>
              <p className="text-xs text-gray-500">
                Owner:
                <span className="text-sm text-green-700 font-medium ml-1">{ownerDisplay()}</span>
              </p>
            </div>
            <p className="text-sm text-gray-500">
              {tasks.length} tasks • {board.members?.length || 1} members
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setShowMemberManagement(!showMemberManagement)}>
            <Users className="w-4 h-4 mr-2" /> Manage Members
          </Button>
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </div>
      </div>

      {showMemberManagement && (
        <div className="mb-8">
          <BoardMemberManagement board={board} onMembersUpdate={handleMembersUpdate} />
        </div>
      )}

      {/* Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Pending Tasks
              {pendingTasks.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({pendingTasks.length})</span>
              )}
            </h2>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => {
                  const alert = getDueAlert(task.endAt);
                  const isCommentsOpen = openComments[task.id];
                  const comments = taskComments[task.id] || [];
                  const count = commentCount(task.id);
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="p-4 group">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="mt-0.5 text-gray-300 hover:text-green-500"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">{task.title}</h3>
                                {task.notes && (
                                  <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                                )}
                                <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-3">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(parseISO(task.endAt), "MMM d, yyyy, h:mm a")}
                                  </span>
                                  <span className={alert.color}>{alert.message}</span>
                                </div>
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Comment toggle button */}
                            <button
                              onClick={() => toggleComments(task.id)}
                              className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {isCommentsOpen ? (
                                <>
                                  Hide comments <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  Comments{count !== null ? ` (${count})` : ""}{" "}
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline comment panel */}
                      {isCommentsOpen && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50 rounded-b-xl">
                          {loadingComments[task.id] ? (
                            <p className="text-xs text-gray-400 py-2">Loading comments…</p>
                          ) : comments.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2">No comments yet.</p>
                          ) : (
                            <div className="space-y-2 mb-3">
                              {comments.map((c) => (
                                <div key={c.id} className="flex items-start gap-2 group/comment">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                                    {(c.firstName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-700">
                                        {c.authorId === user?.id
                                          ? "You"
                                          : `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email?.split("@")[0]}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {format(parseISO(c.createdAt), "MMM d, h:mm a")}
                                      </span>
                                      {c.authorId === user?.id && (
                                        <button
                                          onClick={() => handleInlineDeleteComment(task.id, c.id)}
                                          className="opacity-0 group-hover/comment:opacity-100 text-gray-300 hover:text-red-500 transition"
                                        >
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

                          {/* Add comment input */}
                          <div className="flex gap-2 items-end mt-1">
                            <textarea
                              value={commentTexts[task.id] || ""}
                              onChange={(e) =>
                                setCommentTexts((prev) => ({ ...prev, [task.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                                  handleInlineAddComment(task.id);
                              }}
                              placeholder="Add a comment… (Ctrl+Enter)"
                              rows={2}
                              className="flex-1 text-xs rounded-lg border border-gray-300 px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                            />
                            <button
                              onClick={() => handleInlineAddComment(task.id)}
                              disabled={!commentTexts[task.id]?.trim() || submittingComment[task.id]}
                              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
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

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Completed Tasks
              {completedTasks.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({completedTasks.length})</span>
              )}
            </h2>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 bg-green-50 group flex items-start space-x-3 relative"
                  >
                    <Award className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/boards/${boardId}/tasks/${task.id}`}
                        className="font-medium text-green-700 hover:text-green-900 hover:underline flex items-center gap-1"
                      >
                        {task.title}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                      {task.notes && (
                        <p className="text-sm text-gray-600 mt-1 truncate">{task.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Completed: {format(parseISO(task.updatedAt), "MMM d, yyyy h:mm a")}
                      </p>
                      <Link
                        to={`/boards/${boardId}/tasks/${task.id}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                      >
                        <MessageSquare className="w-3 h-3" /> View comments &amp; notes
                      </Link>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="p-1 text-gray-400 hover:text-orange-500"
                        title="Reopen task"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
        <form onSubmit={handleTaskSubmit} className="space-y-6">
          <Input
            label="Task title"
            value={taskFormData.title}
            onChange={(e) => setTaskFormData((prev) => ({ ...prev, title: e.target.value }))}
            error={taskFormErrors.title}
            placeholder="Enter task title..."
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={taskFormData.notes}
              onChange={(e) => setTaskFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Add additional notes..."
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
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setTaskModalOpen(false); setEditingTask(null); }}
            >
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
