import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { apiClient } from '../../services/api';
import { Board, Task } from '../../types/board';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Folder,
  TrendingUp 
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const boardsData = await apiClient.getBoards();
      setBoards(boardsData);

      // Collect all upcoming tasks from all boards
      const allTasks: Task[] = [];
      for (const board of boardsData) {
        try {
          const tasksData = await apiClient.getBoardTasks(board.id);
          allTasks.push(...tasksData.filter((task: Task) => !task.isDone));
        } catch (error) {
          console.warn(`Failed to load tasks for board ${board.id}:`, error);
        }
      }

      // Sort by end date and take first 5
      const sortedTasks = allTasks
        .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
        .slice(0, 5);
      
      setUpcomingTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showToast('error', 'Failed to load dashboard', 'Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatTaskDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getStats = () => {
    const totalTasks = upcomingTasks.length;
    const completedTasks = boards.reduce((acc, board) => {
      return acc + (board.tasks?.filter(task => task.isDone).length || 0);
    }, 0);
    const totalMembers = boards.reduce((acc, board) => {
      return acc + (board.members?.length || 1);
    }, 0);

    return {
      totalBoards: boards.length,
      totalTasks,
      completedTasks,
      totalMembers,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Boards</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBoards}</p>
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
                <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
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
                <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Boards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Boards</h2>
              <Link to="/boards">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No boards yet</p>
                <Link to="/boards">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first board
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {boards.slice(0, 5).map((board) => (
                  <Link
                    key={board.id}
                    to={`/boards/${board.id}`}
                    className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{board.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {board.tasks?.filter(t => !t.isDone).length || 0} active tasks
                        </p>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">{board.members?.length || 1}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Tasks</h2>
              <Link to="/boards">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming tasks</p>
                <Link to="/boards">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create a task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.notes && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatTaskDate(task.endAt)}
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
    </div>
  );
}