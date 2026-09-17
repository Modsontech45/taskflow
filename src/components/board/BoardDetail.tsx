import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import {
  Board, Task, TaskComment, TaskPriority, TaskRecurring,
  CreateTaskRequest, UpdateTaskRequest,
} from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { BoardMemberManagement } from "./BoardMemberManagement";
import {
  Plus, Users, CheckCircle2, Circle, Clock, Edit, Trash2,
  ArrowLeft, MessageSquare, Send, ChevronDown, ChevronUp,
  ExternalLink, Search, TrendingUp, AlertCircle, BarChart2, Mic,
  MicOff, Activity, Copy, RefreshCw, Loader2, Ban,
} from "lucide-react";
import {
  addDays, format, parseISO, isBefore, differenceInMinutes, addMinutes,
  isAfter, startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval,
} from "date-fns";
import { useVoiceInput } from "../../hooks/useVoiceInput";

// ---- Priority config ----
const PRIORITY_CFG: Record<TaskPriority, { label: string; cls: string; dot: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-100 text-red-700 border-red-200",    dot: "bg-red-500"    },
  HIGH:   { label: "High",   cls: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  MEDIUM: { label: "Medium", cls: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500"   },
  LOW:    { label: "Low",    cls: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400"   },
};

type TaskTimeState = "upcoming" | "active" | "grace" | "overdue";

export function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const voice = useVoiceInput();

  const [board, setBoard]   = useState<Board | null>(null);
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActivity, setShowActivity] = useState(false);

  // Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<CreateTaskRequest & { priority: TaskPriority; assigneeId: string; recurringType: TaskRecurring }>({
    title: "", notes: "", startAt: "", endAt: "", priority: "MEDIUM", assigneeId: "", recurringType: "NONE",
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>({});
  const [submittingTask, setSubmittingTask]   = useState(false);
  const [togglingTask, setTogglingTask]       = useState<Record<string, boolean>>({});

  // Inline comments
  const [openComments, setOpenComments]         = useState<Record<string, boolean>>({});
  const [taskComments, setTaskComments]         = useState<Record<string, TaskComment[]>>({});
  const [commentTexts, setCommentTexts]         = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments]   = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Date filter
  type DateFilter = "today" | "week" | "custom" | "all";
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customFrom, setCustomFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customTo,   setCustomTo]   = useState(format(new Date(), "yyyy-MM-dd"));

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
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
    handleCreateTask();
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
  const toggleComments = async (taskId: string, prefill?: string) => {
    const willOpen = !openComments[taskId];
    setOpenComments((prev) => ({ ...prev, [taskId]: willOpen }));
    if (prefill && willOpen) {
      setCommentTexts((p) => ({ ...p, [taskId]: p[taskId] || prefill }));
    }
    if (willOpen && !taskComments[taskId]) {
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
      priority: "MEDIUM", assigneeId: "", recurringType: "NONE",
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
      endAt:   format(parseISO(task.endAt),   "yyyy-MM-dd'T'HH:mm"),
      priority: task.priority || "MEDIUM",
      assigneeId: task.assigneeId || "",
      recurringType: task.recurringType || "NONE",
    });
    setTaskFormErrors({});
    setTaskModalOpen(true);
  };

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};
    if (!taskFormData.title.trim()) errors.title = "Title is required";
    if (!taskFormData.startAt) errors.startAt = "Start date is required";
    if (!taskFormData.endAt)   errors.endAt   = "End date is required";
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
      const payload = {
        title: taskFormData.title.trim(),
        notes: taskFormData.notes?.trim() || undefined,
        startAt: new Date(taskFormData.startAt).toISOString(),
        endAt:   new Date(taskFormData.endAt).toISOString(),
        priority: taskFormData.priority,
        assigneeId: taskFormData.assigneeId || null,
        recurringType: taskFormData.recurringType || "NONE",
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
    setTogglingTask((p) => ({ ...p, [task.id]: true }));
    try {
      const result = await apiClient.toggleTask(boardId!, task.id) as { task: Task; nextTask: Task | null };
      setTasks((prev) => {
        const mapped = prev.map((t) => t.id === task.id ? { ...t, ...result.task } : t);
        return result.nextTask ? [result.nextTask, ...mapped] : mapped;
      });
      if (!task.isDone) {
        if (result.nextTask) {
          const label = task.recurringType === "DAILY" ? "daily" : task.recurringType === "WEEKLY" ? "weekly" : "monthly";
          showToast("success", `🎉 Done! 🔄 Next ${label} occurrence created for ${format(parseISO(result.nextTask.endAt), "MMM d")}`, "");
        } else {
          showToast("success", "Task completed! 🎉", "");
        }
      }
    } catch (error: any) {
      showToast("error", "Failed to update task", error.message);
    } finally {
      setTogglingTask((p) => ({ ...p, [task.id]: false }));
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    try {
      const duped = await apiClient.duplicateTask(boardId!, task.id) as Task;
      setTasks((prev) => [duped, ...prev]);
      showToast("success", "Task duplicated", `"${duped.title}" added`);
    } catch (error: any) {
      showToast("error", "Failed to duplicate task", error.message);
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

  // ---- Time state ----
  const getTaskTimeState = (task: Task): TaskTimeState => {
    const start = parseISO(task.startAt);
    const end   = parseISO(task.endAt);
    if (isBefore(now, start)) return "upcoming";
    if (isAfter(now, addMinutes(end, 30))) return "overdue";
    if (isAfter(now, end)) return "grace";
    return "active";
  };

  const getTimeWindow = (task: Task) => {
    const start = parseISO(task.startAt);
    const end   = parseISO(task.endAt);
    const mins  = differenceInMinutes(end, start);
    const dur   = mins >= 60
      ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`
      : `${mins}min`;
    return `${format(start, "H:mm")} – ${format(end, "H:mm")} · ${dur}`;
  };

  // ---- Date filter ----
  const matchesDateFilter = (task: Task) => {
    const d = parseISO(task.startAt);
    if (dateFilter === "all") return true;
    if (dateFilter === "today") return isWithinInterval(d, { start: startOfDay(now), end: endOfDay(now) });
    if (dateFilter === "week")  return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    if (dateFilter === "custom" && customFrom && customTo)
      return isWithinInterval(d, { start: startOfDay(parseISO(customFrom)), end: endOfDay(parseISO(customTo)) });
    return true;
  };

  // ---- Derived ----
  const dateTasks    = tasks.filter(matchesDateFilter);
  const allPending   = dateTasks.filter((t) => !t.isDone);
  const allCompleted = dateTasks.filter((t) => t.isDone);
  const overdueTasks = allPending.filter((t) => isAfter(now, addMinutes(parseISO(t.endAt), 30)));

  // The single next-up task: earliest upcoming (startAt > now) among pending
  const nextUpTask = allPending
    .filter((t) => isAfter(parseISO(t.startAt), now))
    .sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())[0];
  const nextUpTaskId = nextUpTask?.id ?? null;
  const completionPct = dateTasks.length === 0 ? 0 : Math.round((allCompleted.length / dateTasks.length) * 100);

  const filteredPending = allPending.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCompleted = allCompleted.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const recentActivity = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      text: t.isDone ? `✅ Completed: ${t.title}` : `📝 Task: ${t.title}`,
      time: t.updatedAt,
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
                {overdueTasks.length > 0 && (
                  <span className="text-red-600 font-medium ml-2">• {overdueTasks.length} missed</span>
                )}
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
          {voice.isSupported && (
            <Button
              variant={voice.state === "listening" ? "danger" : "outline"}
              size="sm"
              onClick={handleVoice}
              title="Create task by speaking"
            >
              {voice.state === "listening"
                ? <><MicOff className="w-4 h-4 mr-1 animate-pulse" /> Stop</>
                : <><Mic className="w-4 h-4 mr-1" /> Voice</>}
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
          voice.state === "error"     ? "bg-red-50 text-red-700" :
          "bg-blue-50 border border-blue-200 text-blue-700"
        }`}>
          <Mic className="w-4 h-4 flex-shrink-0" />
          {voice.state === "listening"  && <span className="animate-pulse">Listening… speak your task now</span>}
          {voice.state === "processing" && <span>Processing…</span>}
          {voice.state === "error"      && <span>{voice.error}</span>}
        </div>
      )}

      {/* Activity feed */}
      {showActivity && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Recent Activity
            </h3>
          </CardHeader>
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
      {dateTasks.length > 0 && (
        <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<BarChart2 className="w-4 h-4 text-blue-600" />}    label="Total"   value={dateTasks.length}    color="blue"   />
          <StatCard icon={<Clock className="w-4 h-4 text-orange-500" />}      label="Pending" value={allPending.length}   color="orange" />
          <StatCard icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} label="Done"   value={allCompleted.length} color="green"  />
          <StatCard icon={<AlertCircle className="w-4 h-4 text-red-500" />}   label="Missed"  value={overdueTasks.length} color="red"    />
        </div>
      )}

      {/* Progress */}
      {dateTasks.length > 0 && (
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

      {/* Date filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["today", "week", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setDateFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              dateFilter === f
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {f === "today" ? `Today · ${format(now, "MMM d")}` : f === "week" ? "This Week" : "All Time"}
          </button>
        ))}
        <button
          onClick={() => setDateFilter("custom")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            dateFilter === "custom"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          Custom Range
        </button>
        {dateFilter === "custom" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
        )}
        {dateFilter !== "all" && (
          <span className="text-xs text-gray-400 ml-1">
            {dateTasks.length} task{dateTasks.length !== 1 ? "s" : ""} in view
          </span>
        )}
      </div>

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
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {overdueTasks.length} missed
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredPending.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">
                  {searchQuery ? "No matches." : dateFilter === "today" ? "No pending tasks for today 🎉" : "No pending tasks in this range."}
                </p>
                {!searchQuery && (
                  <button onClick={handleCreateTask} className="mt-3 text-sm text-blue-600 hover:underline">
                    + Add a task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPending.map((task) => {
                  const timeState  = getTaskTimeState(task);
                  const priority   = PRIORITY_CFG[task.priority || "MEDIUM"];
                  const isOpen     = openComments[task.id];
                  const comments   = taskComments[task.id] || [];
                  const author     = taskAuthorDisplay(task);
                  const toggling   = togglingTask[task.id];
                  const timeWindow = getTimeWindow(task);
                  const isNextUp   = task.id === nextUpTaskId;

                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border bg-white hover:shadow-sm transition-all ${
                        timeState === "overdue"  ? "border-red-200 bg-red-50/30" :
                        timeState === "active"   ? "border-green-200 ring-2 ring-green-100" :
                        timeState === "grace"    ? "border-orange-200" :
                        isNextUp                 ? "border-blue-400 ring-2 ring-blue-100 shadow-md" :
                        "border-gray-200"
                      }`}
                    >
                      <div className="p-3 group">
                        <div className="flex items-start gap-2.5">

                          {/* Complete button column */}
                          <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                            {timeState === "upcoming" ? (
                              <div
                                className="w-5 h-5 rounded-full border-2 border-gray-200 bg-gray-50"
                                title={`Starts at ${format(parseISO(task.startAt), "H:mm")}`}
                              />
                            ) : timeState === "overdue" ? (
                              <Ban className="w-5 h-5 text-red-400" title="Time window passed — negotiate below" />
                            ) : (
                              <button
                                onClick={() => handleToggleTask(task)}
                                disabled={toggling}
                                title={timeState === "grace" ? "Complete (late — within grace period)" : "Mark complete"}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  toggling
                                    ? "border-gray-300 cursor-not-allowed"
                                    : timeState === "grace"
                                    ? "border-orange-400 hover:bg-orange-50 hover:border-orange-500"
                                    : "border-gray-400 hover:border-green-500 hover:bg-green-50"
                                }`}
                              >
                                {toggling && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                              </button>
                            )}
                            <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} title={priority.label} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {isNextUp && (
                              <div className="inline-flex items-center gap-1 mb-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                                Next up
                              </div>
                            )}
                          <div className="flex items-start justify-between gap-1">
                              <h3 className="font-medium text-gray-900 text-sm leading-snug">{task.title}</h3>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                <button onClick={() => handleDuplicateTask(task)} title="Duplicate" className="p-1 text-gray-400 hover:text-indigo-600">
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleEditTask(task)} className="p-1 text-gray-400 hover:text-blue-600">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteTask(task)} className="p-1 text-gray-400 hover:text-red-600">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Time window */}
                            <div className={`text-xs font-mono font-bold mt-0.5 flex items-center gap-1 ${
                              timeState === "active"   ? "text-green-600" :
                              timeState === "grace"    ? "text-orange-500" :
                              timeState === "overdue"  ? "text-red-500" :
                              isNextUp                 ? "text-blue-600" :
                              "text-gray-500"
                            }`}>
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {timeWindow}
                              {timeState === "upcoming" && (
                                <span className="ml-1 text-gray-400 font-normal font-sans">upcoming</span>
                              )}
                              {timeState === "active" && (
                                <span className="ml-1 text-green-600 font-normal font-sans animate-pulse">● now</span>
                              )}
                              {timeState === "grace" && (
                                <span className="ml-1 text-orange-500 font-normal font-sans">late — {differenceInMinutes(now, parseISO(task.endAt))}m over</span>
                              )}
                              {timeState === "overdue" && (
                                <span className="ml-1 font-normal font-sans">missed</span>
                              )}
                            </div>

                            {task.notes && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.notes}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priority.cls}`}>
                                {priority.label}
                              </span>
                              {task.recurringType && task.recurringType !== "NONE" && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200 font-medium flex items-center gap-0.5">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  {task.recurringType.charAt(0) + task.recurringType.slice(1).toLowerCase()}
                                </span>
                              )}
                              {task.assignee && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-medium">
                                  → {task.assignee.id === user?.id ? "You" : `${task.assignee.firstName} ${task.assignee.lastName}`.trim()}
                                </span>
                              )}
                              {author && <span className="text-xs text-gray-400">by {author}</span>}
                            </div>

                            {/* Bottom actions */}
                            <div className="mt-1.5 flex items-center gap-3">
                              <button
                                onClick={() => toggleComments(task.id)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                              >
                                <MessageSquare className="w-3 h-3" />
                                {isOpen
                                  ? <><span>Hide</span><ChevronUp className="w-3 h-3" /></>
                                  : <><span>Comments{comments.length > 0 ? ` (${comments.length})` : ""}</span><ChevronDown className="w-3 h-3" /></>}
                              </button>
                              {timeState === "overdue" && (
                                <button
                                  onClick={() => toggleComments(task.id, "Missed this task because: ")}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition"
                                >
                                  <MessageSquare className="w-3 h-3" /> Negotiate
                                </button>
                              )}
                            </div>
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
                  const author   = taskAuthorDisplay(task);
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
                        <div className="text-xs text-green-600 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getTimeWindow(task)}
                        </div>
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
                {user && <option value={user.id}>You ({user.firstName})</option>}
                {boardMembers.filter((m) => m.userId !== user?.id).map((m) => (
                  <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
            <select
              value={taskFormData.recurringType}
              onChange={(e) => setTaskFormData((p) => ({ ...p, recurringType: e.target.value as TaskRecurring }))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="NONE">⬜ None (one-time)</option>
              <option value="DAILY">🔄 Daily</option>
              <option value="WEEKLY">📅 Weekly</option>
              <option value="MONTHLY">🗓️ Monthly</option>
            </select>
            {taskFormData.recurringType !== "NONE" && (
              <p className="text-xs text-indigo-600 mt-1">
                Completing this task will auto-create the next occurrence.
              </p>
            )}
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
