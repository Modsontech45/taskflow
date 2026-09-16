import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { Task, TaskComment } from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import {
  ArrowLeft,
  Award,
  MessageSquare,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

export function TaskDetailPage() {
  const { boardId, taskId } = useParams<{ boardId: string; taskId: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (boardId && taskId) load();
  }, [boardId, taskId]);

  const load = async () => {
    try {
      const [tasks, commentsData] = await Promise.all([
        apiClient.getBoardTasks(boardId!),
        apiClient.getTaskComments(boardId!, taskId!),
      ]);
      const found = (tasks as Task[]).find((t) => t.id === taskId);
      if (!found) { navigate(`/boards/${boardId}`); return; }
      setTask(found);
      setComments((commentsData as TaskComment[]) || []);
    } catch (err: any) {
      showToast("error", "Failed to load task", err.message);
      navigate(`/boards/${boardId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !boardId || !taskId) return;
    setSubmitting(true);
    try {
      const newComment = await apiClient.addTaskComment(boardId, taskId, commentText.trim());
      setComments((prev) => [...prev, newComment as TaskComment]);
      setCommentText("");
      textareaRef.current?.focus();
    } catch (err: any) {
      showToast("error", "Failed to add comment", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!boardId || !taskId) return;
    try {
      await apiClient.deleteTaskComment(boardId, taskId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      showToast("error", "Failed to delete comment", err.message);
    }
  };

  const authorName = (c: TaskComment) =>
    c.firstName || c.lastName
      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
      : c.email?.split("@")[0] ?? "User";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          to={`/boards/${boardId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to board
        </Link>
      </div>

      {/* Task card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              {task.isDone ? (
                <Award className="w-8 h-8 text-green-500" />
              ) : (
                <Clock className="w-8 h-8 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    task.isDone
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {task.isDone ? "Completed" : "Pending"}
                </span>
              </div>

              {task.notes && (
                <p className="text-gray-600 mt-2 leading-relaxed">{task.notes}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Due: {format(parseISO(task.endAt), "MMM d, yyyy, h:mm a")}
                </span>
                {task.isDone && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed: {format(parseISO(task.updatedAt), "MMM d, yyyy, h:mm a")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">
              Comments &amp; Notes
              {comments.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({comments.length})
                </span>
              )}
            </h2>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              No comments yet. Be the first to add a note!
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start space-x-3 group">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                    {(c.firstName?.[0] ?? c.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {c.authorId === user?.id ? "You" : authorName(c)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {format(parseISO(c.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                        {c.authorId === user?.id && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a comment or note
            </label>
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
              }}
              placeholder="Write your note here... (Ctrl+Enter to submit)"
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleAddComment}
                loading={submitting}
                disabled={!commentText.trim()}
              >
                <Send className="w-4 h-4 mr-2" /> Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
