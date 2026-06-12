import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { decodeJwt } from "../utils/authToken";

function StatCard({ label, value, icon, accent, subtitle }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {value}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Broadcast form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Search/filter
  const [search, setSearch] = useState("");

  // Verify admin access
  useEffect(() => {
    const jwt = decodeJwt();
    if (!jwt || jwt.role !== "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, usersRes, notifsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/notifications"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setNotifications(notifsRes.data);
    } catch (e) {
      setError(
        e?.response?.data?.message || "Failed to load admin data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await API.post("/admin/notifications", { title, body });
      setSendResult({
        success: true,
        message: res.data.message,
      });
      setTitle("");
      setBody("");
      fetchData(); // Refresh stats and notification history
    } catch (e) {
      setSendResult({
        success: false,
        message:
          e?.response?.data?.message || "Failed to send notification.",
      });
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="font-bold">Error</div>
        <div className="mt-1 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current">
            <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" />
          </svg>
          Admin Portal
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor SpendWise analytics and manage users.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon="👥"
          accent="#6366F1"
          subtitle="Registered accounts"
        />
        <StatCard
          label="Active Users"
          value={stats?.activeUsers ?? 0}
          icon="⚡"
          accent="#10B981"
          subtitle="Last 30 days"
        />
        <StatCard
          label="Downloads"
          value={stats?.totalDownloads ?? 0}
          icon="📥"
          accent="#8B5CF6"
          subtitle="APK downloads"
        />
        <StatCard
          label="Installs"
          value={stats?.totalInstalls ?? 0}
          icon="📱"
          accent="#F59E0B"
          subtitle="App installs"
        />
        <StatCard
          label="Notifications"
          value={stats?.totalNotifications ?? 0}
          icon="🔔"
          accent="#EF4444"
          subtitle="Sent total"
        />
        <StatCard
          label="Push Enabled"
          value={stats?.usersWithPush ?? 0}
          icon="📡"
          accent="#06B6D4"
          subtitle="Devices registered"
        />
      </div>

      {/* Two-column layout: Broadcast + History */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast Panel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            📢 Broadcast Notification
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Send a push notification to all users with registered devices.
          </p>
          <form className="mt-5 space-y-4" onSubmit={handleSend}>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Feature Available!"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Message Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your notification message..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            {sendResult && (
              <div
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                  sendResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {sendResult.message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title.trim() || !body.trim()}
              className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending…
                </span>
              ) : (
                `Send to ${stats?.usersWithPush ?? 0} device(s)`
              )}
            </button>
          </form>
        </div>

        {/* Notification History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">
            📋 Notification History
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Previously sent broadcast notifications.
          </p>
          <div className="mt-5 max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No notifications sent yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-900">
                        {n.title}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                        {n.body}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-[10px] font-semibold text-slate-400">
                        {timeAgo(n.createdAt)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {n.recipientCount ?? 0} sent
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              👤 Registered Users
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {users.length} total user{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Provider</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Last Active</th>
                <th className="px-6 py-3">Push</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-slate-50 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        {u.photoUrl ? (
                          <img
                            src={u.photoUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">
                            {u.name || "—"}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          u.provider === "google"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.provider || "local"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.role || "user"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500">
                      {timeAgo(u.lastSeenAt)}
                    </td>
                    <td className="px-6 py-3">
                      {u.pushTokens && u.pushTokens.length > 0 ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">
                          ✓
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
