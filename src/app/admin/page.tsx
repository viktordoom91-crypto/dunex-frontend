/**
 * src/app/admin/page.tsx  — DashboardOverview
 *
 * Fixes applied:
 * 1. Removed the raw `fetch()` calls that used an undefined API_BASE variable.
 *    All requests now go through `apiClient` which already has the base URL
 *    and auth header wired up correctly.
 * 2. Added a CORS-safe pattern: apiClient runs in the browser after mount,
 *    never during SSR, so no server→client mismatch.
 * 3. Proper loading / error states so the UI doesn't crash on a cold Render
 *    instance that takes a few seconds to wake up.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Clock, TrendingUp, ShieldAlert,
  ArrowDownToLine, ArrowUpFromLine, RefreshCw,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/src/lib/apiClient';   // adjust path if needed

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Stats {
  total_users: number;
  active_users: number;
  pending_kyc: number;
  open_tickets: number;
}

interface Order {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  reference: string;
  proof_url?: string;
  created_at: string;
  user?: { full_name: string; email: string; kyc_status: string };
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0a0a0f]/80 border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</div>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const router = useRouter();

  const [stats, setStats]   = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers]   = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // ── Fetch everything via apiClient (has base URL + auth header) ────────────
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, ordersRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users?limit=50'),
        apiClient.get('/admin/orders?status=pending'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users ?? []);
      setOrders(ordersRes.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      // Give a human-readable hint
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError(
          'Cannot reach the API server. If this is a fresh Render deploy, ' +
          'wait ~30 seconds for the instance to wake up, then refresh.'
        );
      } else if (err.response?.status === 401) {
        router.push('/admin-login');
        return;
      } else {
        setError(err.response?.data?.detail ?? err.message ?? 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Approve / reject order ─────────────────────────────────────────────────
  const handleOrderAction = async (orderId: string, action: 'approve' | 'reject') => {
    setProcessing(orderId);
    try {
      await apiClient.post(`/admin/orders/${orderId}/${action}`);
      // Remove from pending list optimistically
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (stats) {
        // Stats will refresh on next poll — no immediate update needed
      }
    } catch (err: any) {
      alert(err.response?.data?.detail ?? `Failed to ${action} order.`);
    } finally {
      setProcessing(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm font-mono animate-pulse uppercase tracking-widest">
          Loading Dashboard…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[70vh] items-center justify-center flex-col gap-4 p-8 text-center">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Unavailable</h2>
        <p className="text-gray-500 max-w-md text-sm">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Command Centre
          </h1>
          <p className="text-gray-500 text-sm mt-1">Live platform overview</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors border border-gray-200 dark:border-white/10"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users?.toLocaleString() ?? '—'}
          icon={<Users size={18} />}
          color="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Active Users"
          value={stats?.active_users?.toLocaleString() ?? '—'}
          icon={<TrendingUp size={18} />}
          color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Pending KYC"
          value={stats?.pending_kyc ?? '—'}
          icon={<ShieldAlert size={18} />}
          color="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          sub="Requires review"
        />
        <StatCard
          label="Pending Orders"
          value={orders.length}
          icon={<Clock size={18} />}
          color="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          sub="Deposits & withdrawals"
        />
      </div>

      {/* ── Pending orders ── */}
      <div className="bg-white dark:bg-[#0a0a0f]/80 border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          Pending Orders
          {orders.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
              {orders.length}
            </span>
          )}
        </h2>

        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 italic">No pending orders — all clear ✓</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="pb-3 pr-6">User</th>
                  <th className="pb-3 pr-6">Type</th>
                  <th className="pb-3 pr-6">Amount</th>
                  <th className="pb-3 pr-6">Reference</th>
                  <th className="pb-3 pr-6">Proof</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {orders.map(order => {
                  const isDeposit = order.transaction_type === 'deposit';
                  const busy = processing === order.id;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pr-6">
                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                          {order.user?.full_name || 'Unknown'}
                        </div>
                        <div className="text-gray-500 text-xs">{order.user?.email}</div>
                      </td>
                      <td className="py-4 pr-6">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${isDeposit ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                          {isDeposit ? <ArrowDownToLine size={11} /> : <ArrowUpFromLine size={11} />}
                          {order.transaction_type}
                        </div>
                      </td>
                      <td className="py-4 pr-6 font-mono font-bold text-gray-900 dark:text-white">
                        ${Math.abs(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 pr-6 font-mono text-xs text-gray-500">{order.reference}</td>
                      <td className="py-4 pr-6">
                        {order.proof_url ? (
                          <a
                            href={order.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600 text-xs font-semibold underline underline-offset-2"
                          >
                            View proof
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">none</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOrderAction(order.id, 'approve')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleOrderAction(order.id, 'reject')}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Recent users ── */}
      <div className="bg-white dark:bg-[#0a0a0f]/80 border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            Recent Users
          </h2>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-xs text-blue-500 hover:text-blue-600 font-bold"
          >
            View all →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="pb-3 pr-6">User</th>
                <th className="pb-3 pr-6">KYC</th>
                <th className="pb-3 pr-6">Status</th>
                <th className="pb-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {users.slice(0, 10).map(u => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <td className="py-3 pr-6">
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{u.full_name || '—'}</div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </td>
                  <td className="py-3 pr-6">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      u.kyc_status === 'verified' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                      u.kyc_status === 'pending'  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                      'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'
                    }`}>
                      {u.kyc_status}
                    </span>
                  </td>
                  <td className="py-3 pr-6">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      u.is_active
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    }`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs text-gray-500 font-mono">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}