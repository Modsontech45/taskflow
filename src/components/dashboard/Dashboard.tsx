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
import { Footer } from '../layout/Footer';

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
        <Card className="bg-gradient-to-br from-white via-purple-50 to-pink-50 border-2 border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Folder className="w-6 h-6" />
                <h2 className="text-xl font-bold">My Boards</h2>
              </div>
              <Link to="/boards">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <EmptyState icon={<Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />} text="No boards yet" buttonText="Create your first board" buttonIcon={<Plus className="w-4 h-4 mr-2" />} link="/boards" />
            ) : (
              <div className="space-y-3">
                {boards.slice(0, 5).map(board => (
                  <Link key={board.id} to={`/boards/${board.id}`} className="block p-4 rounded-xl bg-white border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-purple-500 to-pink-500 opacity-10 rounded-bl-full"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">{board.name}</h3>
                        <div className="flex items-center mt-2">
                          <div className="bg-purple-100 px-2 py-1 rounded-full">
                            <p className="text-xs font-bold text-purple-700">{board.activeTasks} active tasks</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center bg-purple-50 px-3 py-2 rounded-full border border-purple-200">
                        <Users className="w-4 h-4 text-purple-600 mr-1" />
                        <span className="text-sm font-bold text-purple-700">{board.members?.length || 1}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-2 border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-6 h-6" />
                <h2 className="text-xl font-bold">Upcoming Tasks</h2>
              </div>
              {loadingTasks && <span className="text-sm text-gray-500">Loading tasks...</span>}
              <Link to="/boards">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState icon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />} text="No upcoming tasks" buttonText="Create a task" buttonIcon={<Plus className="w-4 h-4 mr-2" />} link="/boards" />
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-xl bg-white border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                    {/* Decorative accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500"></div>
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{task.title}</h3>
                        {task.notes && <p className="text-sm text-gray-700 mt-2 bg-emerald-50 p-2 rounded-lg line-clamp-2">{task.notes}</p>}
                      </div>
                      <div className="ml-4">
                        <div className="bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-emerald-600 mr-1" />
                            <span className="text-xs font-bold text-emerald-700">{formatTaskDate(task.endAt)}</span>
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
      
      <Footer />
    </div>
  );
}

// 🔹 Reusable Stat Card
function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center relative">
          <div className={`p-4 ${bg} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
          <div className="absolute top-0 right-0 w-6 h-6 bg-gray-100 rounded-full opacity-30"></div>
          <div className="ml-4">
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-black text-gray-900">{value}</p>
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
