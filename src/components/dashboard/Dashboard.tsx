import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { apiClient } from "../../services/api";
import { Board, Task } from "../../types/board";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Plus, Users, Calendar, CheckCircle2, Clock, Folder, TrendingUp, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, parseISO, subDays, startOfDay, addDays } from "date-fns";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  RadialBarChart, RadialBar,
} from "recharts";

const COLORS = {
  done:    "#22c55e",
  pending: "#3b82f6",
  overdue: "#ef4444",
  LOW:     "#94a3b8",
  MEDIUM:  "#3b82f6",
  HIGH:    "#f97316",
  URGENT:  "#ef4444",
};

export function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [boards, setBoards]           = useState<Board[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const boardsData: Board[] = await apiClient.getBoards();
      const allBoards: Board[]  = [];

      for (const board of boardsData) {
        try {
          const tasksData: Task[] = await apiClient.getBoardTasks(board.id);
          allBoards.push({
            ...board,
            tasks: tasksData,
            activeTasks: tasksData.filter(t => t.status === "pending").length,
          });
        } catch {
          allBoards.push({ ...board, activeTasks: 0 });
        }
      }

      setBoards(allBoards);
      const upcomingCutoff = new Date().getHours() >= 22
        ? startOfDay(addDays(new Date(), 1))
        : startOfDay(new Date());
      setUpcomingTasks(
        allBoards.flatMap(b => b.tasks ?? [])
          .filter(t => !t.isDone && startOfDay(parseISO(t.startAt)) <= upcomingCutoff)
          .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
          .slice(0, 5)
      );
    } catch {
      showToast("error", "Failed to load dashboard", "Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Derived data for charts ----
  const now = new Date();

  // Tasks for tomorrow are hidden until 10pm today (so you don't see tomorrow's recurring tasks bloating stats)
  const taskCutoff = now.getHours() >= 22
    ? startOfDay(addDays(now, 1))   // after 10pm: reveal tomorrow
    : startOfDay(now);              // before 10pm: today and earlier only

  const allTasks = boards
    .flatMap(b => b.tasks ?? [])
    .filter(t => startOfDay(parseISO(t.startAt)) <= taskCutoff);

  const doneTasks    = allTasks.filter(t => t.isDone);
  const pendingTasks = allTasks.filter(t => !t.isDone && parseISO(t.endAt) >= now);
  const overdueTasks = allTasks.filter(t => !t.isDone && parseISO(t.endAt) < now);

  // Pie: completion status
  const completionData = [
    { name: "Done",    value: doneTasks.length,    color: COLORS.done    },
    { name: "Pending", value: pendingTasks.length,  color: COLORS.pending },
    { name: "Overdue", value: overdueTasks.length,  color: COLORS.overdue },
  ].filter(d => d.value > 0);

  // Bar: priority distribution
  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
  allTasks.forEach(t => { if (t.priority in priorityCounts) priorityCounts[t.priority as keyof typeof priorityCounts]++; });
  const priorityData = Object.entries(priorityCounts).map(([name, count]) => ({ name, count, color: COLORS[name as keyof typeof COLORS] }));

  // Bar: board completion %
  const boardCompletionData = boards
    .filter(b => (b.tasks?.length ?? 0) > 0)
    .map(b => ({
      name: b.name.length > 16 ? b.name.slice(0, 16) + "…" : b.name,
      pct: Math.round(((b.tasks?.filter(t => t.isDone).length ?? 0) / (b.tasks?.length ?? 1)) * 100),
      total: b.tasks?.length ?? 0,
    }))
    .slice(0, 6);

  // Line: tasks completed per day (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = startOfDay(subDays(now, 6 - i));
    const label = format(d, "EEE");
    const count = doneTasks.filter(t => {
      const u = startOfDay(parseISO(t.updatedAt));
      return u.getTime() === d.getTime();
    }).length;
    return { day: label, completed: count };
  });

  // Radial: overall productivity score (0-100)
  const productivityScore = allTasks.length === 0 ? 0
    : Math.round((doneTasks.length / allTasks.length) * 100);
  const radialData = [{ name: "Score", value: productivityScore, fill: "#6366f1" }];

  const stats = {
    totalBoards:    boards.length,
    completedTasks: doneTasks.length,
    pendingTasks:   pendingTasks.length + overdueTasks.length,
    totalMembers:   boards.reduce((a, b) => a + (b.members?.length || 1), 0),
  };

  const formatTaskDate = (d: string) => {
    const date = parseISO(d);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-6" />
      <div className="animate-pulse space-y-8 w-full">
        <div className="h-8 bg-gray-200 rounded w-64 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}! 👋</h1>
        <p className="text-gray-600 mt-1">Here's your productivity overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Folder className="w-5 h-5 text-blue-600" />}       bg="bg-blue-100"   label="Boards"     value={stats.totalBoards}    />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} bg="bg-green-100"  label="Completed"  value={stats.completedTasks} />
        <StatCard icon={<Clock className="w-5 h-5 text-amber-600" />}        bg="bg-amber-100"  label="Pending"    value={stats.pendingTasks}   />
        <StatCard icon={<Users className="w-5 h-5 text-purple-600" />}       bg="bg-purple-100" label="Members"    value={stats.totalMembers}   />
      </div>

      {/* Row 1: Completion pie + Productivity radial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pie: task status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Task Status Breakdown
            </h2>
          </CardHeader>
          <CardContent>
            {allTasks.length === 0 ? (
              <EmptyChart text="No tasks yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={completionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {completionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} tasks`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Radial: productivity score */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Productivity Score</h2>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {allTasks.length === 0 ? (
              <EmptyChart text="No data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f1f5f9" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-6">
                  <p className="text-3xl font-bold text-indigo-600">{productivityScore}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">of all tasks completed</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Priority bar + daily line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar: priority distribution */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" /> Tasks by Priority
            </h2>
          </CardHeader>
          <CardContent>
            {allTasks.length === 0 ? (
              <EmptyChart text="No tasks yet" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: any) => [`${v} tasks`]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line: completions last 7 days */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Completions — Last 7 Days</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: any) => [`${v} completed`]} />
                <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Board completion horizontal bar */}
      {boardCompletionData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Board Completion Rate</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {boardCompletionData.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="font-medium truncate max-w-[60%]">{b.name}</span>
                    <span className="font-bold text-gray-800">{b.pct}% <span className="text-gray-400 font-normal">({b.total} tasks)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${b.pct}%`,
                        background: b.pct === 100
                          ? "linear-gradient(to right,#22c55e,#16a34a)"
                          : b.pct >= 50
                          ? "linear-gradient(to right,#3b82f6,#6366f1)"
                          : "linear-gradient(to right,#f97316,#ef4444)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Row 4: My boards + upcoming tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">My Boards</h2>
              <Link to="/boards"><Button variant="outline" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {boards.length === 0 ? (
              <EmptyState icon={<Folder className="w-10 h-10 text-gray-300 mx-auto mb-3" />} text="No boards yet" buttonText="Create a board" link="/boards" />
            ) : (
              <div className="space-y-2">
                {boards.slice(0, 5).map(board => (
                  <Link key={board.id} to={`/boards/${board.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: board.color || "#3b82f6" }}>
                        {board.emoji || "📋"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{board.name}</p>
                        <p className="text-xs text-gray-500">{board.activeTasks} active</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Users className="w-3.5 h-3.5" />{board.members?.length || 1}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Upcoming Tasks</h2>
              <Link to="/boards"><Button variant="outline" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <EmptyState icon={<Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />} text="No upcoming tasks" buttonText="Create a task" link="/boards" />
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map(task => {
                  const pri = task.priority || "MEDIUM";
                  const priColor: Record<string, string> = {
                    URGENT: "text-red-600 bg-red-50 border-red-200",
                    HIGH:   "text-orange-600 bg-orange-50 border-orange-200",
                    MEDIUM: "text-blue-600 bg-blue-50 border-blue-200",
                    LOW:    "text-gray-500 bg-gray-50 border-gray-200",
                  };
                  return (
                    <div key={task.id} className="flex items-start justify-between p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${priColor[pri]}`}>{pri}</span>
                        </div>
                      </div>
                      <div className="ml-3 text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />{formatTaskDate(task.endAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value }: { icon: React.ReactNode; bg: string; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 ${bg} rounded-xl flex-shrink-0`}>{icon}</div>
          <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">{text}</div>;
}

function EmptyState({ icon, text, buttonText, link }: any) {
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-gray-500 text-sm mb-3">{text}</p>
      <Link to={link}><Button size="sm"><Plus className="w-3.5 h-3.5 mr-1" />{buttonText}</Button></Link>
    </div>
  );
}
