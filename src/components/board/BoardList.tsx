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
  const [newBoardColor, setNewBoardColor] = useState("#3b82f6");
  const [newBoardEmoji, setNewBoardEmoji] = useState("📋");
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
 const { user } = useAuth();
  useEffect(() => {
    loadBoards();
  }, []);
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
        color: newBoardColor,
        emoji: newBoardEmoji,
      });
      setBoards((prev) => [newBoard as Board, ...prev]);
      setNewBoardName(""); setNewBoardColor("#3b82f6"); setNewBoardEmoji("📋");
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
              <Card key={board.id} hover className="group overflow-hidden">
                {/* Color accent bar */}
                <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: board.color || "#3b82f6" }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: board.color || "#3b82f6" }}
                      >
                        {board.emoji || "📋"}
                      </div>
                      <div className="flex-1">
                        <Link to={`/boards/${board.id}`} className="block hover:text-blue-600 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 leading-tight">
                            {board.name}
                          </h3>
                        </Link>
                        <span className="flex items-center text-xs text-gray-500 mt-0.5 gap-1">
                          <Crown className="w-3 h-3 text-yellow-500" />
                          {board.ownerId === user?.id ? "You" : `${board.ownerFirstName ?? ""} ${board.ownerLastName ?? ""}`.trim() || "—"} (Owner)
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Created {new Date(board.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setDeletingBoard(board); setDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-50 transition-colors"
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
        <form onSubmit={handleCreateBoard} className="space-y-5">
          <Input
            label="Board name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="e.g. Q4 Goals, Daily Habits…"
            required
            autoFocus
          />

          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pick an emoji</label>
            <div className="flex flex-wrap gap-2">
              {["📋","🚀","💡","🎯","📚","🏋️","💼","🌟","🔥","🎨","🏠","⚡"].map((em) => (
                <button
                  key={em} type="button"
                  onClick={() => setNewBoardEmoji(em)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border-2 transition-all ${
                    newBoardEmoji === em ? "border-blue-500 bg-blue-50" : "border-transparent hover:border-gray-300"
                  }`}
                >{em}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Board color</label>
            <div className="flex gap-2 flex-wrap">
              {["#3b82f6","#8b5cf6","#ec4899","#f97316","#22c55e","#06b6d4","#f59e0b","#64748b"].map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setNewBoardColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${newBoardColor === c ? "ring-2 ring-offset-2 ring-gray-500 scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: newBoardColor }}>
              {newBoardEmoji}
            </div>
            <span className="font-medium text-gray-700">{newBoardName || "Board name"}</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setCreateModalOpen(false); setNewBoardName(""); }}>
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
