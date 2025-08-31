import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../ui/Toast';
import { Board, Task } from '../../types/board';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { 
  Plus, Users, Calendar, CheckCircle2, Folder, Trash2, ArrowRight 
} from 'lucide-react';
import { Footer } from '../layout/Footer';

export function BoardList() {
  const { createNotification } = useNotifications();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);

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

      console.log('Boards with tasks:', boardsWithTasks);
      setBoards(boardsWithTasks);
    } catch (err) {
      console.error('Error loading boards:', err);
      showToast('error', 'Failed to load boards', 'Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreating(true);
    try {
      const newBoard = await apiClient.createBoard({ name: newBoardName.trim() });
      setBoards(prev => [newBoard, ...prev]);
      setNewBoardName('');
      setCreateModalOpen(false);
      showToast('success', 'Board created', 'Your new board has been created successfully.');

      await createNotification(
        'BOARD_CREATED',
        'New board created',
        `Board "${newBoard.name}" was created successfully`,
        { boardId: newBoard.id }
      );
    } catch (error: any) {
      console.error('Error creating board:', error);
      showToast('error', 'Failed to create board', error.message || 'Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;

    try {
      await apiClient.deleteBoard(deletingBoard.id);
      setBoards(prev => prev.filter(b => b.id !== deletingBoard.id));
      setDeleteModalOpen(false);
      setDeletingBoard(null);
      showToast('success', 'Board deleted', 'The board has been deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting board:', error);
      showToast('error', 'Failed to delete board', error.message || 'Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first board to start organizing your tasks and collaborating with your team.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" /> Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => {
            const completedTasks = board.tasks?.filter(t => t.isDone || t.status === 'expired').length || 0;
            const pendingTasks = board.tasks?.filter(t => !t.isDone && t.status === 'pending').length || 0;
            const totalTasks = board.tasks?.length || 0;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return (
              <Card key={board.id} hover className="group relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-purple-50 border-2 border-transparent hover:border-purple-200 transition-all duration-300">
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500 to-pink-500 opacity-10 rounded-bl-full"></div>
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link to={`/boards/${board.id}`} className="block hover:text-purple-600 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 mb-2">{board.name}</h3>
                      </Link>
                      <p className="text-sm text-gray-600 font-medium">
                        Created {new Date(board.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                      <button
                        onClick={() => { setDeletingBoard(board); setDeleteModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 hover:scale-110"
                        title="Delete board"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-bold text-purple-600">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-700">{completedTasks}</p>
                      <p className="text-xs text-green-600 font-medium">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">{pendingTasks}</p>
                      <p className="text-xs text-blue-600 font-medium">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                      <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-purple-700">{board.members?.length || 1}</p>
                      <p className="text-xs text-purple-600 font-medium">Members</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Link to={`/boards/${board.id}`} className="inline-flex items-center justify-center w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 hover:shadow-lg">
                      View Board
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={createModalOpen} onClose={() => { setCreateModalOpen(false); setNewBoardName(''); }} title="Create New Board">
        <form onSubmit={handleCreateBoard} className="space-y-6">
          <Input label="Board name" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} placeholder="Enter board name..." required autoFocus />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => { setCreateModalOpen(false); setNewBoardName(''); }}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Board</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeletingBoard(null); }} title="Delete Board">
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>"{deletingBoard?.name}"</strong>? 
            This action cannot be undone and will permanently delete all tasks and data in this board.
          </p>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => { setDeleteModalOpen(false); setDeletingBoard(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteBoard}>Delete Board</Button>
          </div>
        </div>
      </Modal>
      
      <Footer />
    </div>
  );
}