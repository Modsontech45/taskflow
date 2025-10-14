import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useNotifications } from "../../contexts/NotificationContext";
import { useToast } from "../ui/Toast";
import { Board, Task } from "../../types/board";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import {
  Plus,
  Users,
  Calendar,
  CheckCircle2,
  Folder,
  Trash2,
  Crown,
} from "lucide-react";
  import { useAuth } from "../../contexts/AuthContext";
export function BoardList() {
  const { createNotification } = useNotifications();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
 const { user } = useAuth();
  useEffect(() => {
    loadBoards();
  }, []);
  const boardAUTHOR = boards[0]?.author || "Unknown"; // Placeholder for the current user's name
  const loadBoards = async () => {
    setLoading(true);
    try {
      const data: Board[] = await apiClient.getBoards();

      // Fetch tasks for each board
      const boardsWithTasks = await Promise.all(
        data.map(async (board) => {
          try {
            const tasks: Task[] = await apiClient.getBoardTasks(board.id);
            return { ...board, tasks };
          } catch (err) {
            console.warn(`⚠️ Failed to load tasks for board ${board.id}`, err);
            return { ...board, tasks: [] };
          }
        })
      );

      console.log("Boards with tasks:", boardsWithTasks);
      setBoards(boardsWithTasks);
    } catch (err) {
      console.error("Error loading boards:", err);
      showToast(
        "error",
        "Failed to load boards",
        "Please try refreshing the page."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const newBoard = await apiClient.createBoard({
        name: newBoardName.trim(),
      });
      setBoards((prev) => [newBoard, ...prev]);
      setNewBoardName("");
      setCreateModalOpen(false);
      showToast(
        "success",
        "Board created",
        "Your new board has been created successfully."
      );

      await createNotification(
        "BOARD_CREATED",
        "New board created",
        `Board "${newBoard.name}" was created successfully`,
        { boardId: newBoard.id }
      );
    } catch (error: any) {
      console.error("Error creating board:", error);
      showToast(
        "error",
        "Failed to create board",
        error.message || "Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;

    try {
      await apiClient.deleteBoard(deletingBoard.id);
      setBoards((prev) => prev.filter((b) => b.id !== deletingBoard.id));
      setDeleteModalOpen(false);
      setDeletingBoard(null);
      showToast(
        "success",
        "Board deleted",
        "The board has been deleted successfully."
      );
    } catch (error: any) {
      console.error("Error deleting board:", error);
      showToast(
        "error",
        "Failed to delete board",
        error.message || "Please try again."
      );
    }
  };
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        {/* Spinner */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span className="text-lg font-medium text-gray-700">Loading...</span>
        </div>

        {/* Skeleton blocks */}
        <div className="animate-pulse space-y-8 w-full">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Boards</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Board
        </Button>
      </div>

      {/* Boards Grid */}
      {boards.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No boards yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first board to start organizing your tasks and
            collaborating with your team.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" /> Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => {
            const completedTasks =
              board.tasks?.filter((t) => t.isDone || t.status === "expired")
                .length || 0;
            const pendingTasks =
              board.tasks?.filter((t) => !t.isDone && t.status === "pending")
                .length || 0;
            return (
              <Card key={board.id} hover className="group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        to={`/boards/${board.id}`}
                        className="block hover:text-blue-600 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                            {board.name}
                          </h3>

                          <span className="flex items-center text-sm text-gray-500 space-x-1">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <span>
                              {board.author
                                ? board.author.split("@")[0] ===
                                  user?.email?.split("@")[0]
                                  ? "You"
                                  : board.author.split("@")[0]
                                : "Unknown"}{" "}
                              (Owner)
                            </span>
                          </span>
                        </div>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(board.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setDeletingBoard(board);
                          setDeleteModalOpen(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
                        title="Delete board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      <span>{completedTasks} completed tasks</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      <span>{pendingTasks} pending tasks</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      <span>{board.members?.length || 1} members</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Link
                      to={`/boards/${board.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      View board →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setNewBoardName("");
        }}
        title="Create New Board"
      >
        <form onSubmit={handleCreateBoard} className="space-y-6">
          <Input
            label="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Enter board name..."
            required
            autoFocus
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setNewBoardName("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Board
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingBoard(null);
        }}
        title="Delete Board"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <strong>"{deletingBoard?.name}"</strong>? This action cannot be
            undone and will permanently delete all tasks and data in this board.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingBoard(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteBoard}>
              Delete Board
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
