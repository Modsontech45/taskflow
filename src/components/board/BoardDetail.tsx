import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import {
  Board,
  Task,
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
} from "lucide-react";
import { formatISO, addDays, format, parseISO, isBefore, differenceInMinutes } from "date-fns";

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
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>(
    {}
  );
  const [submittingTask, setSubmittingTask] = useState(false);

  // State to trigger time-based re-renders every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // update every minute
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

      setBoard(boardData);
      setTasks(tasksData);
    } catch (error: any) {
      console.error("Error loading board:", error);
      showToast("error", "Failed to load board", error.message || "Please try again.");
      navigate("/boards");
    } finally {
      setLoading(false);
    }
  };

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
    if (Object.keys(errors).length > 0) {
      setTaskFormErrors(errors);
      return;
    }

    setSubmittingTask(true);

    try {
      const startAtISO = new Date(taskFormData.startAt).toISOString();
      const endAtISO = new Date(taskFormData.endAt).toISOString();
      if (!boardId) throw new Error("Board ID is missing");

      if (editingTask) {
        const updateData: UpdateTaskRequest = {
          title: taskFormData.title.trim(),
          notes: taskFormData.notes.trim() || undefined,
          startAt: startAtISO,
          endAt: endAtISO,
        };

        const updatedTask = await apiClient.updateTask(boardId, editingTask.id, updateData);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t)));
        showToast("success", "Task updated", "The task has been updated successfully.");
      } else {
        const createData: CreateTaskRequest = {
          title: taskFormData.title.trim(),
          notes: taskFormData.notes.trim() || undefined,
          startAt: startAtISO,
          endAt: endAtISO,
        };

        const newTask = await apiClient.createTask(boardId, createData);
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
      console.error("Error saving task:", error);
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
      console.error("Error toggling task:", error);
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
      console.error("Error deleting task:", error);
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

    if (isBefore(dueDate, now))
      return { message: "Overdue", color: "text-red-600 font-semibold" };
    if (diff <= 60)
      return { message: "Due soon (within 1h)", color: "text-orange-500 font-semibold" };
    if (diff <= 1440)
      return { message: "Due today", color: "text-yellow-600 font-semibold" };
    return { message: "On track", color: "text-green-600 font-semibold" };
  };

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
        <Button onClick={() => navigate("/boards")} className="mt-4">
          Back to Boards
        </Button>
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
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <p className="text-sm text-gray-500">
              {tasks.length} tasks • {board.members?.length || 1} members
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowMemberManagement(!showMemberManagement)}
          >
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
            <h2 className="text-xl font-semibold">Pending Tasks</h2>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => {
                  const alert = getDueAlert(task.endAt);
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
                    >
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
                              <div className="flex items-center text-xs text-gray-800 mt-2 space-x-4">
                                <span>
                                  Due: {format(parseISO(task.endAt), "MMM d, yyyy, h:mm a")}
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
                        </div>
                      </div>
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
            <h2 className="text-xl font-semibold">Completed Tasks</h2>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 bg-green-50 group flex items-start space-x-3"
                  >
                    <Award className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-green-700">{task.title}</h3>
                      {task.notes && (
                        <p className="text-gray-900 mt-1">{task.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Completed: {format(parseISO(task.updatedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="lg"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-6">
          <Input
            label="Task title"
            value={taskFormData.title}
            onChange={(e) =>
              setTaskFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            error={taskFormErrors.title}
            placeholder="Enter task title..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={taskFormData.notes}
              onChange={(e) =>
                setTaskFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
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
              onChange={(e) =>
                setTaskFormData((prev) => ({ ...prev, startAt: e.target.value }))
              }
              error={taskFormErrors.startAt}
              required
            />
            <Input
              label="End date & time"
              type="datetime-local"
              value={taskFormData.endAt}
              onChange={(e) =>
                setTaskFormData((prev) => ({ ...prev, endAt: e.target.value }))
              }
              error={taskFormErrors.endAt}
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTaskModalOpen(false);
                setEditingTask(null);
              }}
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
