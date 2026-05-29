'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PlusCircle, MinusCircle, UserX, Bell, LogIn, X,
  Wallet, Activity, ShieldCheck, FileImage, ShieldAlert,
  Trash2, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift,
  Users, MapPin, Phone, Hash, Bitcoin, RefreshCw, AlertTriangle,
  ChevronDown, Coins, Settings2
} from 'lucide-react';
import { apiClient, API_URL } from '../../../../lib/apiClient';

const HOST_URL = API_URL.replace('/api/v1', '');

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_buy_price: number;
  updated_at: string;
}

type CryptoAction = 'add' | 'subtract' | 'set';

// ─────────────────────────────────────────────────────────────────────────────
// Coin icon helper (same CDN as mobile)
// ─────────────────────────────────────────────────────────────────────────────
const COIN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', BNB: '#f3ba2f',
  XRP: '#00aae4', ADA: '#0033ad', USDT: '#26a17b', USDC: '#2775ca',
  DOGE: '#c3a634', LTC: '#bfbbbb', AVAX: '#e84142', MATIC: '#8247e5',
};
const coinColor = (s: string) => COIN_COLORS[s] ?? '#64748b';

function CoinBadge({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const url = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
  return failed ? (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
      style={{ backgroundColor: coinColor(symbol) + '22', color: coinColor(symbol) }}>
      {symbol.slice(0, 2)}
    </div>
  ) : (
    <img src={url} alt={symbol} className="w-8 h-8 rounded-full object-cover"
      onError={() => setFailed(true)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Common coin list for quick-select
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_COINS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'MATIC', name: 'Polygon' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Crypto Sub-Wallet Panel
// ─────────────────────────────────────────────────────────────────────────────
function CryptoSubWalletPanel({ userId, userName }: { userId: string; userName: string }) {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // symbol to delete
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal form state
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    quantity: '',
    avg_buy_price: '',
    action: 'add' as CryptoAction,
    note: '',
    useCustomSymbol: false,
    customSymbol: '',
    customName: '',
  });
  const [formError, setFormError] = useState('');

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/users/${userId}/crypto-holdings`);
      setHoldings(res.data);
    } catch {
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const openModal = (prefill?: { symbol: string; name: string; action?: CryptoAction }) => {
    setForm({
      symbol: prefill?.symbol ?? '',
      name: prefill?.name ?? '',
      quantity: '',
      avg_buy_price: '',
      action: prefill?.action ?? 'add',
      note: '',
      useCustomSymbol: false,
      customSymbol: '',
      customName: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const resolvedSymbol = form.useCustomSymbol ? form.customSymbol.toUpperCase().trim() : form.symbol;
  const resolvedName = form.useCustomSymbol ? form.customName.trim() : form.name;

  const handleSubmit = async () => {
    setFormError('');
    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.avg_buy_price);

    if (!resolvedSymbol) return setFormError('Select or enter a coin symbol.');
    if (!resolvedName) return setFormError('Coin name is required.');
    if (isNaN(qty) || qty <= 0) return setFormError('Enter a valid quantity.');
    if (isNaN(price) || price <= 0) return setFormError('Enter a valid price per coin.');

    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/users/${userId}/crypto-holdings`, {
        symbol: resolvedSymbol,
        name: resolvedName,
        quantity: qty,
        avg_buy_price: price,
        action: form.action,
        note: form.note || undefined,
      });
      setModalOpen(false);
      fetchHoldings();
    } catch (e: any) {
      setFormError(e.response?.data?.detail ?? 'Operation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (symbol: string) => {
    setIsProcessing(true);
    try {
      await apiClient.delete(`/admin/users/${userId}/crypto-holdings/${symbol}`);
      setDeleteConfirm(null);
      fetchHoldings();
    } catch (e: any) {
      alert(e.response?.data?.detail ?? 'Failed to delete holding.');
    } finally {
      setIsProcessing(false);
    }
  };

  const actionColors: Record<CryptoAction, string> = {
    add: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    subtract: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
    set: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl mb-8 transition-colors">
      {/* Panel header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
            <Coins size={16} className="text-amber-600 dark:text-amber-400" />
          </div>
          Crypto Sub-Wallet
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchHoldings}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh holdings"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <PlusCircle size={15} /> Credit Coins
          </button>
        </div>
      </div>

      {/* Holdings table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
          <Coins size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No crypto holdings</p>
          <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">
            Click "Credit Coins" to add a coin when approving a crypto deposit.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-[11px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-200 dark:border-white/5">
              <tr>
                <th className="p-3 pl-4">Coin</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Avg Buy Price</th>
                <th className="p-3">USD Value (est.)</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {holdings.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-3">
                      <CoinBadge symbol={h.symbol} />
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{h.symbol}</div>
                        <div className="text-gray-500 text-xs">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-gray-900 dark:text-white text-sm font-semibold">
                    {h.quantity.toFixed(8)}
                  </td>
                  <td className="p-3 font-mono text-gray-600 dark:text-gray-300 text-sm">
                    ${h.avg_buy_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">
                    ${(h.quantity * h.avg_buy_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {h.updated_at ? new Date(h.updated_at).toLocaleString() : '—'}
                  </td>
                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'add' })}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                        title="Add more coins"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'subtract' })}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                        title="Deduct coins"
                      >
                        − Sub
                      </button>
                      <button
                        onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'set' })}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        title="Overwrite quantity"
                      >
                        <Settings2 size={12} className="inline" /> Set
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(h.symbol)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 text-[11px] font-bold hover:bg-red-50 dark:hover:bg-rose-500/10 hover:text-red-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete holding"
                      >
                        <Trash2 size={12} className="inline" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Credit / Adjust Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 p-2 rounded-full transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                <Coins size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Adjust Crypto Holding</h2>
                <p className="text-gray-500 text-xs">Target: <span className="text-gray-900 dark:text-white font-semibold">{userName}</span></p>
              </div>
            </div>

            <div className="mt-6 space-y-5">

              {/* Action selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Operation</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['add', 'subtract', 'set'] as CryptoAction[]).map(a => (
                    <button
                      key={a}
                      onClick={() => setForm(f => ({ ...f, action: a }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all capitalize ${form.action === a ? actionColors[a] : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10'}`}
                    >
                      {a === 'add' ? '+ Add / Credit' : a === 'subtract' ? '− Deduct' : '✎ Overwrite'}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-[11px] mt-2 ml-1">
                  {form.action === 'add' && 'Adds quantity to existing balance. Uses weighted average for cost basis.'}
                  {form.action === 'subtract' && 'Deducts quantity. Will fail if user has insufficient coins.'}
                  {form.action === 'set' && 'Overwrites the holding to an exact quantity and price. Use for corrections.'}
                </p>
              </div>

              {/* Coin selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Coin</label>

                {!form.useCustomSymbol ? (
                  <>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {COMMON_COINS.map(c => (
                        <button
                          key={c.symbol}
                          onClick={() => setForm(f => ({ ...f, symbol: c.symbol, name: c.name }))}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${form.symbol === c.symbol ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'}`}
                        >
                          <CoinBadge symbol={c.symbol} />
                          {c.symbol}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: true, symbol: '', name: '' }))} className="text-xs text-blue-500 hover:text-blue-600 font-semibold mt-1">
                      + Enter custom coin symbol
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Symbol (e.g. XMR)</label>
                        <input
                          type="text"
                          placeholder="BTC"
                          value={form.customSymbol}
                          onChange={e => setForm(f => ({ ...f, customSymbol: e.target.value.toUpperCase() }))}
                          className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-amber-400 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Full Name</label>
                        <input
                          type="text"
                          placeholder="Monero"
                          value={form.customName}
                          onChange={e => setForm(f => ({ ...f, customName: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: false }))} className="text-xs text-gray-400 hover:text-gray-600 font-semibold">
                      ← Back to quick select
                    </button>
                  </div>
                )}
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity (Coins)</label>
                  <input
                    type="number"
                    placeholder="e.g. 0.00152300"
                    step="any"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price per Coin (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">$</span>
                    <input
                      type="number"
                      placeholder="e.g. 67500.00"
                      step="any"
                      value={form.avg_buy_price}
                      onChange={e => setForm(f => ({ ...f, avg_buy_price: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 pl-7 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* USD preview */}
              {form.quantity && form.avg_buy_price && parseFloat(form.quantity) > 0 && parseFloat(form.avg_buy_price) > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wide">USD Equivalent</span>
                  <span className="text-amber-700 dark:text-amber-300 font-mono font-black text-lg">
                    ${(parseFloat(form.quantity) * parseFloat(form.avg_buy_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Admin note */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BTC deposit credited — TxHash: 0xabc..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-amber-400 text-sm"
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3 text-sm font-semibold">
                  <AlertTriangle size={15} /> {formError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                  form.action === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' :
                  form.action === 'subtract' ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                  'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                }`}
              >
                {isProcessing ? 'Processing…' : `Execute ${form.action === 'add' ? 'Credit' : form.action === 'subtract' ? 'Deduction' : 'Override'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Delete {deleteConfirm} Holding?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove the {deleteConfirm} entry from this user's sub-wallet. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-sm border border-gray-200 dark:border-white/10">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', email: '', dob: '', ssn: '', role: '',
    gender: '', phone: '', address: '', country: '', idNumber: '',
    referred_by_code: '', referred_by_email: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'add' | 'subtract'>('add');
  const [targetWallet, setTargetWallet] = useState<'main' | 'profit' | 'bonus' | 'referral'>('main');
  const [amountInput, setAmountInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    fetchUserTransactions();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      const u = res.data;
      if (!u.balances) u.balances = { main: 0, profit: 0, bonus: 0, referral: 0 };
      setUser(u);
      setFormData({
        full_name: u.full_name || '',
        email: u.email || '',
        dob: u.dob || '',
        ssn: u.ssn || '',
        gender: u.gender || '',
        phone: u.phone || '',
        address: u.address || '',
        country: u.country || '',
        idNumber: u.id_number || u.ssn || '',
        role: u.role || 'user',
        referred_by_code: u.referred_by_code || '',
        referred_by_email: u.referred_by_email || 'No Referrer'
      });
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTransactions = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}/transactions`);
      setTransactions(res.data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  };

  const openModal = (action: 'add' | 'subtract') => {
    setModalAction(action); setAmountInput(''); setTargetWallet('main'); setIsModalOpen(true);
  };

  const handleBalanceAdjust = async () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return alert("Enter a valid amount");
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/users/${userId}/balance`, {
        amount: val, action: modalAction, wallet_type: targetWallet
      });
      setIsModalOpen(false);
      const updatedBalances = { ...user.balances };
      updatedBalances[targetWallet] = Math.max(0, updatedBalances[targetWallet] + (modalAction === 'add' ? val : -val));
      setUser({ ...user, balances: updatedBalances });
      fetchUserTransactions();
      alert(`Successfully ${modalAction === 'add' ? 'added' : 'subtracted'} $${val.toLocaleString()} to ${targetWallet} wallet.`);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to adjust balance");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKycReview = async (status: 'verified' | 'rejected') => {
    if (!confirm(`Are you sure you want to mark this KYC as ${status.toUpperCase()}?`)) return;
    try {
      await apiClient.post(`/admin/users/${userId}/kyc-review`, { status, reason: "Admin review" });
      setUser({ ...user, kyc_status: status });
    } catch { alert("Failed to update KYC status."); }
  };

  const handleToggleSuspend = async () => {
    const action = user.is_active ? 'suspend' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this user?`)) return;
    try {
      await apiClient.post(`/admin/users/${userId}/${action}`);
      setUser({ ...user, is_active: !user.is_active });
    } catch { alert(`Failed to ${action} user.`); }
  };

  const handleDeleteUser = async () => {
    if (!confirm("🚨 WARNING: Are you sure you want to PERMANENTLY DELETE this user?")) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      router.push('/admin/users');
    } catch { alert("Failed to delete user."); }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Generate a temporary session token for ${formData.email}?`)) return;
    try {
      const res = await apiClient.post(`/admin/users/${userId}/impersonate`);
      localStorage.setItem('temp_impersonation_token', res.data.access_token);
      window.open('/dashboard', '_blank');
    } catch (error: any) {
      alert(error.response?.data?.detail || "Impersonation failed");
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await apiClient.patch(`/admin/users/${userId}`, formData);
      alert("Identity Matrix Updated Successfully.");
    } catch { alert("Failed to update profile."); }
    finally { setIsSaving(false); }
  };

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const getImageUrl = (url: string) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${HOST_URL}${url}`;
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-blue-400 font-mono text-sm uppercase tracking-widest animate-pulse">Decrypting User Matrix...</p>
      </div>
    </div>
  );

  if (!user) return <div className="p-8 text-red-500 font-bold">User Matrix Not Found.</div>;

  const totalEquity = (user.balances?.main || 0) + (user.balances?.profit || 0) + (user.balances?.bonus || 0) + (user.balances?.referral || 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto relative pb-20">
      <div className="hidden dark:block absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-4 shadow-sm dark:shadow-none">
            User ID: {user.id}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{formData.full_name || 'Anonymous Client'}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${user.is_active ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'}`}>
              {user.is_active ? 'Account Active' : 'Account Suspended'}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${user.kyc_status === 'verified' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : user.kyc_status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
              KYC: {user.kyc_status}
            </span>
          </div>
        </div>
        <button onClick={handleImpersonate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-all flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105">
          <LogIn size={18} /> Impersonate View
        </button>
      </div>

      {/* 4-BALANCE VAULT GRID */}
      <div className="bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl mb-6 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Fiat Equity (AUM)</h2>
          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'main', label: 'Main', icon: <Wallet size={16} />, color: 'text-blue-600 dark:text-blue-400' },
            { key: 'profit', label: 'Profit', icon: <TrendingUp size={16} />, color: 'text-emerald-600 dark:text-emerald-400' },
            { key: 'bonus', label: 'Bonus', icon: <Gift size={16} />, color: 'text-amber-600 dark:text-amber-400' },
            { key: 'referral', label: 'Referral', icon: <Users size={16} />, color: 'text-purple-600 dark:text-purple-400' },
          ].map(b => (
            <div key={b.key} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className={`flex items-center gap-2 mb-2 ${b.color}`}>{b.icon}<span className="text-xs font-bold uppercase tracking-wider">{b.label}</span></div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">${(user.balances?.[b.key] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <ActionButton icon={<PlusCircle size={18} />} label="Add Funds" color="emerald" onClick={() => openModal('add')} />
        <ActionButton icon={<MinusCircle size={18} />} label="Sub Funds" color="rose" onClick={() => openModal('subtract')} />
        <ActionButton icon={<Bell size={18} />} label="Notify User" color="blue" onClick={() => router.push('/admin/support')} />
        <ActionButton icon={<UserX size={18} />} label={user.is_active ? "Suspend User" : "Reactivate"} color={user.is_active ? "amber" : "emerald"} onClick={handleToggleSuspend} />
        <ActionButton icon={<Trash2 size={18} />} label="Delete User" color="rose" onClick={handleDeleteUser} />
      </div>

      {/* ── NEW: CRYPTO SUB-WALLET PANEL ── */}
      <CryptoSubWalletPanel userId={userId} userName={formData.full_name || 'this user'} />

      {/* IDENTITY MATRIX + KYC VAULT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
              <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            Comprehensive Identity Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InputField label="Full Legal Name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
            <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email" />
            <InputField label="Date of Birth" name="dob" value={formData.dob} onChange={handleInputChange} placeholder="YYYY-MM-DD" />
            <InputField label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} />
            <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} icon={<Phone size={14} />} />
            <InputField label="Country of Residence" name="country" value={formData.country} onChange={handleInputChange} icon={<MapPin size={14} />} />
            <div className="md:col-span-2">
              <InputField label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
              <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Regulatory ID Number (SSN, BVN, NIN, etc.)</label>
              <div className="flex items-center gap-3">
                <Hash size={18} className="text-gray-400" />
                <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange}
                  className="w-full bg-transparent text-gray-900 dark:text-white font-mono font-bold text-lg outline-none"
                  placeholder="Not provided" />
              </div>
            </div>
            <div className="md:col-span-2 p-4 bg-purple-50 dark:bg-purple-500/5 rounded-xl border border-purple-200 dark:border-purple-500/10 mt-2">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Client's Personal Referral Code</label>
                  <div className="text-gray-900 dark:text-white font-mono font-bold text-lg ml-1">{user.referral_code || 'N/A'}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Referred By (Code Override)</label>
                  <input type="text" name="referred_by_code" value={formData.referred_by_code} onChange={handleInputChange}
                    className="w-full bg-white dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-purple-500 font-mono text-sm"
                    placeholder="Enter Referrer Code" />
                  <p className="text-xs text-gray-500 mt-2 ml-1">Current Referrer: <span className="font-bold">{formData.referred_by_email}</span></p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleUpdateProfile} disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
            {isSaving ? 'Encrypting Changes...' : 'Update Identity Profile'}
          </button>
        </div>

        {/* KYC VAULT */}
        <div className="bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-2xl h-fit">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
              <ShieldAlert size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            KYC Vault
          </h2>
          <div className="space-y-6">
            {['govt_id_url', 'id_card_url'].map((field, i) => (
              <div key={field}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {i === 0 ? 'Government ID (Passport/License)' : 'Standard ID Card (Front)'}
                </p>
                {user[field] ? (
                  <a href={getImageUrl(user[field]) || '#'} target="_blank" rel="noopener noreferrer"
                    className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#05050a] aspect-video flex items-center justify-center block">
                    <FileImage className="text-gray-400 dark:text-gray-600 absolute" size={32} />
                    <img src={getImageUrl(user[field]) || ''} alt="ID" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity relative z-10" />
                  </a>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#05050a] p-6 text-center text-sm text-gray-500 dark:text-gray-600 italic">No document uploaded</div>
                )}
              </div>
            ))}
            {user.kyc_status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/5 mt-6">
                <button onClick={() => handleKycReview('verified')} className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 py-3 rounded-xl font-bold text-sm transition-all">Approve</button>
                <button onClick={() => handleKycReview('rejected')} className="flex-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 py-3 rounded-xl font-bold text-sm transition-all">Reject</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEDGER HISTORY */}
      <div className="bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-2xl overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
            <Activity size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          Ledger & Transaction History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-white/[0.02] text-[11px] uppercase tracking-widest text-gray-500 font-bold border-b border-gray-200 dark:border-transparent">
              <tr>
                <th className="p-4 pl-6">Type</th>
                <th className="p-4">Wallet</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic">No ledger activity found.</td></tr>
              ) : (
                transactions.map((tx: any) => {
                  const isCredit = tx.transaction_type === 'deposit' || tx.transaction_type === 'crypto_buy';
                  const isCrypto = tx.transaction_type?.startsWith('crypto');
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCredit ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                            {isCredit ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                          </div>
                          <div>
                            <span className="text-gray-900 dark:text-white font-bold text-sm capitalize">{tx.transaction_type?.replace(/_/g, ' ')}</span>
                            {tx.destination_details && <p className="text-gray-400 text-[10px] max-w-[200px] truncate mt-0.5">{tx.destination_details}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                          tx.wallet_type === 'profit' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                          tx.wallet_type === 'bonus' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                          tx.wallet_type === 'referral' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' :
                          'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                        }`}>
                          {tx.wallet_type || 'main'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 text-xs font-mono">{tx.reference}</td>
                      <td className="p-4 text-gray-900 dark:text-white font-mono text-sm">
                        {isCredit ? '+' : '-'}${Math.abs(parseFloat(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${
                          tx.status === 'completed' || tx.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                          tx.status === 'pending' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right text-gray-500 text-xs font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FUNDS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 transition-colors">
          <div className="bg-white dark:bg-[#0a0a0f] border border-gray-200 dark:border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative transition-colors">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/5 p-2 rounded-full">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 capitalize tracking-tight">{modalAction} Liquidity</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Target: <span className="text-gray-900 dark:text-white font-medium">{formData.full_name}'s Vault</span></p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Target Wallet</label>
              <select value={targetWallet} onChange={(e) => setTargetWallet(e.target.value as any)}
                className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl p-3 outline-none focus:border-blue-500 transition-all font-bold appearance-none">
                <option value="main">Main Balance</option>
                <option value="profit">Total Profit</option>
                <option value="bonus">Bonus Wallet</option>
                <option value="referral">Referral Wallet</option>
              </select>
            </div>
            <div className="mb-8 relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-mono">$</span>
                <input type="number"
                  className="w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-2xl rounded-2xl py-4 pl-10 pr-5 focus:border-blue-500 outline-none transition-all font-mono"
                  placeholder="0.00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
              </div>
            </div>
            <button onClick={handleBalanceAdjust} disabled={isProcessing || !amountInput}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${modalAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'} disabled:opacity-50`}>
              {isProcessing ? 'Executing...' : `Execute ${modalAction === 'add' ? 'Deposit' : 'Withdrawal'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Atoms
// ─────────────────────────────────────────────────────────────────────────────
function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: 'emerald' | 'rose' | 'blue' | 'amber'; onClick: () => void }) {
  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${colorMap[color]}`}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wide text-center">{label}</span>
    </button>
  );
}

function InputField({ label, name, value, onChange, type = 'text', placeholder, icon }: any) {
  return (
    <div>
      <label className="block text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input type={type} name={name} value={value} onChange={onChange}
          className={`w-full bg-gray-50 dark:bg-[#05050a] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-xl p-3.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 ${icon ? 'pl-9' : ''}`}
          placeholder={placeholder} />
      </div>
    </div>
  );
}