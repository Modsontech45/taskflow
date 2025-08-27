import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
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
  Settings,
} from "lucide-react";
import { formatISO, addDays, format, parseISO } from "date-fns";

export function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const { user } = useAuth();
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

  useEffect(() => {
    if (boardId) {
      loadBoard();
    }
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
      showToast(
        "error",
        "Failed to load board",
        error.message || "Please try again."
      );
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
      startAt: formatISO(new Date()), // full ISO string
      endAt: formatISO(addDays(new Date(), 1)), // +1 day
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

    if (!taskFormData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!taskFormData.startAt) {
      errors.startAt = "Start date is required";
    }

    if (!taskFormData.endAt) {
      errors.endAt = "End date is required";
    }

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

      // Pass both boardId and taskId correctly
      const updatedTask = await apiClient.updateTask(boardId, editingTask.id, updateData);

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...updatedTask } : t))
      );

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
  if (!boardId) {
    console.error("No boardId found for toggling task");
    return;
  }

  try {
    const updatedTask = await apiClient.toggleTask(boardId, task.id);

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isDone: !t.isDone } : t))
    );

    showToast(
      "success",
      task.isDone ? "Task reopened" : "Task completed",
      ""
    );
  } catch (error: any) {
    console.error("Error toggling task:", error);
    showToast(
      "error",
      "Failed to update task",
      error.message || "Please try again."
    );
  }
};

 const handleDeleteTask = async (task: Task) => {
  if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;

  try {
    await apiClient.deleteTask(boardId!, task.id); // pass boardId here
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    showToast("success", "Task deleted", "The task has been deleted successfully.");
  } catch (error: any) {
    console.error("Error deleting task:", error);
    showToast("error", "Failed to delete task", error.message || "Please try again.");
  }
};

  const handleMembersUpdate = (updatedMembers: any[]) => {
    if (board) {
      setBoard({ ...board, members: updatedMembers });
    }
  };

  const isOwner = board?.ownerId === user?.id;
  const completedTasks = tasks.filter((t) => t.isDone);
  const pendingTasks = tasks.filter((t) => !t.isDone);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Board not found</h2>
          <p className="text-gray-600 mt-2">
            The board you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/boards")} className="mt-4">
            Back to Boards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/boards")}
            className="text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Boards
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{board.members?.length || 1} members</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{tasks.length} tasks</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowMemberManagement(!showMemberManagement)}
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Members
          </Button>
          <Button onClick={handleCreateTask}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Member Management */}
      {showMemberManagement && (
        <div className="mb-8">
          <BoardMemberManagement
            board={board}
            onMembersUpdate={handleMembersUpdate}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedTasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingTasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Tasks
            </h2>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Circle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No pending tasks</p>
                <Button onClick={handleCreateTask} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors group"
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="mt-0.5 text-gray-300 hover:text-green-500 transition-colors"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {task.title}
                            </h3>
                            {task.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.notes}
                              </p>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                              <span>
                                Due:{" "}
                                {format(parseISO(task.endAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              Completed Tasks
            </h2>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No completed tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50 group"
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="mt-0.5 text-green-500 hover:text-gray-400 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-600 line-through">
                              {task.title}
                            </h3>
                            {task.notes && (
                              <p className="text-sm text-gray-500 mt-1 line-through">
                                {task.notes}
                              </p>
                            )}
                            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                              <span>
                                Completed:{" "}
                                {format(
                                  parseISO(task.updatedAt),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
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
            autoFocus
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={taskFormData.notes}
              onChange={(e) =>
                setTaskFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Add any additional notes or description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start date & time"
              type="datetime-local"
              value={taskFormData.startAt}
              onChange={(e) =>
                setTaskFormData((prev) => ({
                  ...prev,
                  startAt: e.target.value,
                }))
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
