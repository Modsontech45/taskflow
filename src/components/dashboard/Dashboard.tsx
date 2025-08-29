import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { apiClient } from "../../services/api";
import { Board, Task } from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Plus, Users, Calendar, CheckCircle2, Clock, Folder } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

const loadDashboardData = async () => {
  setLoading(true);

  try {
    const boardsData: Board[] = await apiClient.getBoards();
    console.log("📋 Boards fetched from backend:", boardsData);

    setLoadingTasks(true);
    const allBoards: Board[] = [];

    for (const board of boardsData) {
      try {
        const tasksData: Task[] = await apiClient.getBoardTasks(board.id);
        console.log(`Tasks for board "${board.name}":`, tasksData);

        // Compute activeTasks based on pending status
        const activeTasks = tasksData.filter(t => t.status === "pending").length;
        console.log(`Active tasks for "${board.name}":`, activeTasks);

        allBoards.push({
          ...board,
          tasks: tasksData, // include full tasks
          activeTasks,
        });
      } catch (err) {
        console.warn(`⚠️ Failed to load tasks for board ${board.id}:`, err);
        allBoards.push({ ...board, activeTasks: 0 });
      }
    }

    setBoards(allBoards);

    // Upcoming tasks: take all pending tasks across boards
    const upcomingTasks = allBoards
      .flatMap(board => board.tasks ?? [])
      .filter(task => task.status === "pending")
      .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
      .slice(0, 5);

    console.log("📌 Upcoming tasks (next 5):", upcomingTasks);
    setUpcomingTasks(upcomingTasks);

  } catch (err) {
    console.error("❌ Error loading dashboard:", err);
    showToast("error", "Failed to load dashboard", "Please try refreshing the page.");
  } finally {
    setLoadingTasks(false);
    setLoading(false);
  }
};



  const formatTaskDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d, yyyy");
  };

const stats = {
  totalBoards: boards.length,
  totalTasks: upcomingTasks.length,
  completedTasks: boards.reduce(
    (acc, board) => acc + (board.tasks?.filter(t => t.isDone || t.status === "expired").length || 0),
    0
  ),
  totalMembers: boards.reduce((acc, board) => acc + (board.members?.length || 1), 0),
};


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
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your tasks today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Folder className="w-6 h-6 text-blue-600" />} bg="bg-blue-100" label="Total Boards" value={stats.totalBoards} />
        <StatCard icon={<CheckCircle2 className="w-6 h-6 text-green-600" />} bg="bg-green-100" label="Completed Tasks" value={stats.completedTasks} />
        <StatCard icon={<Clock className="w-6 h-6 text-amber-600" />} bg="bg-amber-100" label="Pending Tasks" value={stats.totalTasks} />
        <StatCard icon={<Users className="w-6 h-6 text-purple-600" />} bg="bg-purple-100" label="Team Members" value={stats.totalMembers} />
      </div>

      {/* Boards + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Boards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">My Boards</h2>
              <Link to="/boards">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <EmptyState icon={<Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />} text="No boards yet" buttonText="Create your first board" buttonIcon={<Plus className="w-4 h-4 mr-2" />} link="/boards" />
            ) : (
              <div className="space-y-3">
                {boards.slice(0, 5).map(board => (
                  <Link key={board.id} to={`/boards/${board.id}`} className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{board.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{board.activeTasks} active tasks</p>
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
              {loadingTasks && <span className="text-sm text-gray-500">Loading tasks...</span>}
              <Link to="/boards">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState icon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />} text="No upcoming tasks" buttonText="Create a task" buttonIcon={<Plus className="w-4 h-4 mr-2" />} link="/boards" />
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.notes && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.notes}</p>}
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

// 🔹 Reusable Stat Card
function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 ${bg} rounded-xl`}>{icon}</div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 🔹 Reusable Empty State
function EmptyState({ icon, text, buttonText, buttonIcon, link }: any) {
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-gray-500 mb-4">{text}</p>
      <Link to={link}>
        <Button>{buttonIcon}{buttonText}</Button>
      </Link>
    </div>
  );
}
