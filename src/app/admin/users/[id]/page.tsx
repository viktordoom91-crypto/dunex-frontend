'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PlusCircle, MinusCircle, UserX, Bell, LogIn, X,
  Wallet, Activity, ShieldCheck, FileImage, ShieldAlert,
  Trash2, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift,
  Users, MapPin, Phone, Hash, RefreshCw, AlertTriangle,
  Coins, Settings2
} from 'lucide-react';
import { apiClient, API_URL } from '../../../../lib/apiClient';

const HOST_URL = API_URL.replace('/api/v1', '');

interface CryptoHolding {
  id: string; symbol: string; name: string;
  quantity: number; avg_buy_price: number; updated_at: string;
}
type CryptoAction = 'add' | 'subtract' | 'set';

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
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]"
      style={{ backgroundColor: coinColor(symbol) + '22', color: coinColor(symbol), border: `1px solid ${coinColor(symbol)}55` }}>
      {symbol.slice(0, 2)}
    </div>
  ) : (
    <img src={url} alt={symbol} className="w-8 h-8 rounded-full object-cover flex-shrink-0 shadow-lg"
      onError={() => setFailed(true)} />
  );
}

const COMMON_COINS = [
  { symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' }, { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'BNB', name: 'BNB' }, { symbol: 'SOL', name: 'Solana' },
  { symbol: 'XRP', name: 'XRP' }, { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' }, { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'AVAX', name: 'Avalanche' }, { symbol: 'MATIC', name: 'Polygon' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Crypto Sub-Wallet Panel
// ─────────────────────────────────────────────────────────────────────────────
function CryptoSubWalletPanel({ userId, userName }: { userId: string; userName: string }) {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [form, setForm] = useState({
    symbol: '', name: '', quantity: '', avg_buy_price: '',
    action: 'add' as CryptoAction, note: '',
    useCustomSymbol: false, customSymbol: '', customName: '',
  });
  const [formError, setFormError] = useState('');

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/users/${userId}/crypto-holdings`);
      setHoldings(res.data);
    } catch { setHoldings([]); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  const openModal = (prefill?: { symbol: string; name: string; action?: CryptoAction }) => {
    setForm({ symbol: prefill?.symbol ?? '', name: prefill?.name ?? '',
      quantity: '', avg_buy_price: '', action: prefill?.action ?? 'add',
      note: '', useCustomSymbol: false, customSymbol: '', customName: '' });
    setFormError('');
    setModalOpen(true);
  };

  const resolvedSymbol = form.useCustomSymbol ? form.customSymbol.toUpperCase().trim() : form.symbol;
  const resolvedName   = form.useCustomSymbol ? form.customName.trim() : form.name;

  const handleSubmit = async () => {
    setFormError('');
    const qty   = parseFloat(form.quantity);
    const price = parseFloat(form.avg_buy_price);
    if (!resolvedSymbol)          return setFormError('Select or enter a coin symbol.');
    if (!resolvedName)            return setFormError('Coin name is required.');
    if (isNaN(qty)   || qty   <= 0) return setFormError('Enter a valid quantity.');
    if (isNaN(price) || price <= 0) return setFormError('Enter a valid price per coin.');
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/users/${userId}/crypto-holdings`, {
        symbol: resolvedSymbol, name: resolvedName,
        quantity: qty, avg_buy_price: price,
        action: form.action, note: form.note || undefined,
      });
      setModalOpen(false);
      fetchHoldings();
    } catch (e: any) {
      setFormError(e.response?.data?.detail ?? 'Operation failed.');
    } finally { setIsProcessing(false); }
  };

  const handleDelete = async (symbol: string) => {
    setIsProcessing(true);
    try {
      await apiClient.delete(`/admin/users/${userId}/crypto-holdings/${symbol}`);
      setDeleteConfirm(null);
      fetchHoldings();
    } catch (e: any) { alert(e.response?.data?.detail ?? 'Failed to delete.'); }
    finally { setIsProcessing(false); }
  };

  const actionColors: Record<CryptoAction, string> = {
    add:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    subtract: 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    set:      'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  };

  const usdPreview = parseFloat(form.quantity) > 0 && parseFloat(form.avg_buy_price) > 0
    ? (parseFloat(form.quantity) * parseFloat(form.avg_buy_price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return (
    <div className="bg-[#12121A]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 shadow-2xl mb-8 transition-colors">
      {/* Panel header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Coins size={20} className="text-amber-400" />
          </div>
          Crypto Sub-Wallet
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={fetchHoldings} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5" title="Refresh">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-wide rounded-xl transition-all text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105">
            <PlusCircle size={15} /> Credit Coins
          </button>
        </div>
      </div>

      {/* Holdings table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        </div>
      ) : holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-2xl bg-[#05050A]">
          <Coins size={48} className="text-gray-700 mb-4 drop-shadow-xl" />
          <p className="text-gray-400 font-bold tracking-wide">NO CRYPTO HOLDINGS</p>
          <p className="text-gray-600 text-xs mt-2 text-center max-w-sm">Click "Credit Coins" to manually allocate liquidity to this user's sub-wallet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#05050A]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-gray-500 font-black border-b border-white/5">
              <tr>
                <th className="p-4 pl-5">Asset</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Avg Entry Price</th>
                <th className="p-4">Market Value</th>
                <th className="p-4">Last Sync</th>
                <th className="p-4 text-right pr-5">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdings.map(h => (
                <tr key={h.id} className="hover:bg-white/[0.03] transition-all group hover:scale-[1.01]">
                  <td className="p-4 pl-5">
                    <div className="flex items-center gap-3">
                      <CoinBadge symbol={h.symbol} />
                      <div>
                        <div className="font-black text-white text-sm tracking-wide">{h.symbol}</div>
                        <div className="text-gray-500 text-[10px] uppercase font-bold">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-white font-medium">{h.quantity.toFixed(8)}</td>
                  <td className="p-4 font-mono text-gray-400 text-xs">${h.avg_buy_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  <td className="p-4 font-mono text-amber-400 font-black text-sm drop-shadow-md">${(h.quantity * h.avg_buy_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="p-4 text-gray-600 text-[10px] uppercase font-bold tracking-wider">{h.updated_at ? new Date(h.updated_at).toLocaleString() : '—'}</td>
                  <td className="p-4 pr-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'add' })} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase tracking-wide font-black hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all">+ Add</button>
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'subtract' })} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase tracking-wide font-black hover:bg-rose-500/20 hover:border-rose-500/50 transition-all">− Sub</button>
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'set' })} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wide font-black hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"><Settings2 size={12} className="inline mr-1" /> Set</button>
                      <button onClick={() => setDeleteConfirm(h.symbol)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── HIGH-PRIORITY Z-INDEX MODALS ── */}
      
      {/* 1. CREDIT / ADJUST MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0A0A0F] border border-white/10 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[95dvh] sm:max-h-[90vh]">
            
            {/* Sticky Header */}
            <div className="flex items-center gap-4 p-6 border-b border-white/5 shrink-0 bg-[#0A0A0F] rounded-t-[2rem]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Coins size={24} className="text-amber-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-white uppercase tracking-wider">Adjust Ledger</h2>
                <p className="text-gray-400 text-xs tracking-wide">Target Vault: <span className="text-amber-400 font-bold">{userName}</span></p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-white bg-white/5 p-2.5 rounded-full transition-colors border border-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Operation */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Operation Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['add', 'subtract', 'set'] as CryptoAction[]).map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, action: a }))}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${form.action === a ? actionColors[a] : 'bg-[#12121A] text-gray-500 border-white/5 hover:bg-white/5'}`}>
                      {a === 'add' ? '+ Credit' : a === 'subtract' ? '− Deduct' : '✎ Force Set'}
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-[10px] mt-3 uppercase tracking-wider font-bold">
                  {form.action === 'add'      && 'Calculates new weighted average cost basis automatically.'}
                  {form.action === 'subtract' && 'Deducts strict quantity. Fails if insufficient liquidity.'}
                  {form.action === 'set'      && 'Absolute overwrite of existing database row.'}
                </p>
              </div>

              {/* Coin Selector */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Select Asset</label>
                {!form.useCustomSymbol ? (
                  <>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {COMMON_COINS.map(c => (
                        <button key={c.symbol} onClick={() => setForm(f => ({ ...f, symbol: c.symbol, name: c.name }))}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${form.symbol === c.symbol ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-white/5 bg-[#12121A] text-gray-500 hover:border-white/10 hover:text-gray-300'}`}>
                          <CoinBadge symbol={c.symbol} />
                          <span className="text-[10px] font-black">{c.symbol}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: true, symbol: '', name: '' }))} className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider">
                      + Enter Custom Contract
                    </button>
                  </>
                ) : (
                  <div className="space-y-4 bg-[#12121A] p-5 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Symbol</label>
                        <input type="text" placeholder="XMR" value={form.customSymbol}
                          onChange={e => setForm(f => ({ ...f, customSymbol: e.target.value.toUpperCase() }))}
                          className="w-full bg-[#05050A] border border-white/10 text-white rounded-xl p-3.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono font-bold transition-all placeholder:text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Network Name</label>
                        <input type="text" placeholder="Monero" value={form.customName}
                          onChange={e => setForm(f => ({ ...f, customName: e.target.value }))}
                          className="w-full bg-[#05050A] border border-white/10 text-white rounded-xl p-3.5 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-bold transition-all placeholder:text-gray-700" />
                      </div>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: false }))} className="text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider">← Return to presets</button>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Volume (Coins)</label>
                <input type="number" inputMode="decimal" placeholder="0.00000000" step="any"
                  value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-4 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-mono text-xl font-bold transition-all placeholder:text-gray-700" />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Execution Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xl select-none font-black">$</span>
                  <input type="number" inputMode="decimal" placeholder="0.00" step="any"
                    value={form.avg_buy_price} onChange={e => setForm(f => ({ ...f, avg_buy_price: e.target.value }))}
                    className="w-full bg-[#12121A] border-2 border-white/10 focus:border-amber-500 text-amber-400 rounded-xl p-4 pl-10 outline-none focus:ring-1 focus:ring-amber-500/50 font-mono text-xl font-black transition-all placeholder:text-gray-700" />
                </div>
              </div>

              {/* Preview */}
              {usdPreview && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-center justify-between shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                  <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Total Valuation</span>
                  <span className="text-amber-400 font-mono font-black text-2xl drop-shadow-md">${usdPreview}</span>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Ledger Note (Optional)</label>
                <input type="text" placeholder="Internal audit reference..."
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-4 outline-none focus:border-amber-500 font-medium transition-all placeholder:text-gray-700 text-sm" />
              </div>

              {formError && (
                <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-5 py-4 text-xs font-bold uppercase tracking-wide">
                  <AlertTriangle size={18} className="flex-shrink-0" /> {formError}
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-6 bg-[#0A0A0F] border-t border-white/5 shrink-0 rounded-b-[2rem]">
              <button onClick={handleSubmit} disabled={isProcessing}
                className={`w-full py-4.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 ${
                  form.action === 'add'      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02]' :
                  form.action === 'subtract' ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:scale-[1.02]' :
                                               'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02]'
                }`}>
                {isProcessing ? 'Encrypting Ledger...' : `Confirm ${form.action === 'add' ? 'Credit' : form.action === 'subtract' ? 'Deduction' : 'Overwrite'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0A0F] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Purge {deleteConfirm}?</h3>
            <p className="text-gray-500 text-xs font-medium mb-8 leading-relaxed">This action irrevocably destroys the database row for this asset. It cannot be recovered.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-xl bg-[#12121A] text-gray-400 font-black text-xs uppercase tracking-wider border border-white/10 hover:bg-white/5 transition-colors">Abort</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isProcessing} className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.4)] disabled:opacity-50 transition-all hover:scale-105">
                {isProcessing ? 'Purging…' : 'Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page — Now featuring z-[9999] on its modals too!
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
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [modalAction, setModalAction]   = useState<'add' | 'subtract'>('add');
  const [targetWallet, setTargetWallet] = useState<'main' | 'profit' | 'bonus' | 'referral'>('main');
  const [amountInput, setAmountInput]   = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { fetchUserDetails(); fetchUserTransactions(); }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      const u = res.data;
      if (!u.balances) u.balances = { main: 0, profit: 0, bonus: 0, referral: 0 };
      setUser(u);
      setFormData({
        full_name: u.full_name || '', email: u.email || '', dob: u.dob || '',
        ssn: u.ssn || '', gender: u.gender || '', phone: u.phone || '',
        address: u.address || '', country: u.country || '',
        idNumber: u.id_number || u.ssn || '', role: u.role || 'user',
        referred_by_code: u.referred_by_code || '',
        referred_by_email: u.referred_by_email || 'No Referrer'
      });
    } catch (e) { console.error("Failed to fetch user", e); }
    finally { setLoading(false); }
  };

  const fetchUserTransactions = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}/transactions`);
      setTransactions(res.data);
    } catch (e) { console.error("Failed to fetch transactions", e); }
  };

  const openModal = (action: 'add' | 'subtract') => { setModalAction(action); setAmountInput(''); setTargetWallet('main'); setIsModalOpen(true); };

  const handleBalanceAdjust = async () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return alert("Enter a valid amount");
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/users/${userId}/balance`, { amount: val, action: modalAction, wallet_type: targetWallet });
      setIsModalOpen(false);
      const b = { ...user.balances };
      b[targetWallet] = Math.max(0, b[targetWallet] + (modalAction === 'add' ? val : -val));
      setUser({ ...user, balances: b });
      fetchUserTransactions();
      alert(`Successfully ${modalAction === 'add' ? 'added' : 'subtracted'} $${val.toLocaleString()} to ${targetWallet} wallet.`);
    } catch (e: any) { alert(e.response?.data?.detail || "Failed to adjust balance"); }
    finally { setIsProcessing(false); }
  };

  const handleKycReview = async (status: 'verified' | 'rejected') => {
    if (!confirm(`Mark KYC as ${status.toUpperCase()}?`)) return;
    try { await apiClient.post(`/admin/users/${userId}/kyc-review`, { status, reason: "Admin review" }); setUser({ ...user, kyc_status: status }); }
    catch { alert("Failed to update KYC status."); }
  };

  const handleToggleSuspend = async () => {
    const action = user.is_active ? 'suspend' : 'reactivate';
    if (!confirm(`${action.toUpperCase()} this user?`)) return;
    try { await apiClient.post(`/admin/users/${userId}/${action}`); setUser({ ...user, is_active: !user.is_active }); }
    catch { alert(`Failed to ${action} user.`); }
  };

  const handleDeleteUser = async () => {
    if (!confirm("🚨 PERMANENTLY DELETE this user?")) return;
    try { await apiClient.delete(`/admin/users/${userId}`); router.push('/admin/users'); }
    catch { alert("Failed to delete user."); }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Generate session token for ${formData.email}?`)) return;
    try {
      const res = await apiClient.post(`/admin/users/${userId}/impersonate`);
      localStorage.setItem('temp_impersonation_token', res.data.access_token);
      window.open('/dashboard', '_blank');
    } catch (e: any) { alert(e.response?.data?.detail || "Impersonation failed"); }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try { await apiClient.patch(`/admin/users/${userId}`, formData); alert("Identity Matrix Updated Successfully."); }
    catch { alert("Failed to update profile."); }
    finally { setIsSaving(false); }
  };

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const getImageUrl = (url: string) => { if (!url) return null; return url.startsWith('http') ? url : `${HOST_URL}${url}`; };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(6,182,212,0.4)]" />
        <p className="text-cyan-400 font-mono text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Decrypting User Matrix...</p>
      </div>
    </div>
  );
  if (!user) return <div className="p-8 text-rose-500 font-black tracking-widest uppercase">User Matrix Not Found.</div>;

  const totalEquity = (user.balances?.main||0)+(user.balances?.profit||0)+(user.balances?.bonus||0)+(user.balances?.referral||0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto relative pb-20 selection:bg-cyan-500/30">
      <div className="hidden dark:block absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">ID: {user.id}</div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">{formData.full_name || 'Anonymous Client'}</h1>
          <div className="flex items-center gap-3 mt-4">
            <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'}`}>{user.is_active ? 'System Active' : 'System Suspended'}</span>
            <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border ${user.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : user.kyc_status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'}`}>KYC: {user.kyc_status}</span>
          </div>
        </div>
        <button onClick={handleImpersonate} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-7 py-3.5 rounded-2xl transition-all flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105 border border-cyan-400/30">
          <LogIn size={16} /> Impersonate Core
        </button>
      </div>

      {/* 4-BALANCE VAULT */}
      <div className="bg-[#12121A]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Fiat Liquidity (AUM)</h2>
          <span className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-xl">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { key: 'main',     label: 'Main',     icon: <Wallet size={16} />,    color: 'text-blue-400',    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]' },
            { key: 'profit',   label: 'Profit',   icon: <TrendingUp size={16} />,color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' },
            { key: 'bonus',    label: 'Bonus',    icon: <Gift size={16} />,      color: 'text-amber-400',   glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' },
            { key: 'referral', label: 'Referral', icon: <Users size={16} />,     color: 'text-purple-400',  glow: 'shadow-[0_0_20px_rgba(168,85,247,0.1)]'},
          ].map(b => (
            <div key={b.key} className={`bg-[#05050A] p-5 rounded-2xl border border-white/5 ${b.glow}`}>
              <div className={`flex items-center gap-2.5 mb-3 ${b.color}`}>{b.icon}<span className="text-[10px] font-black uppercase tracking-widest">{b.label}</span></div>
              <div className="text-2xl font-black text-white tracking-tight">${(user.balances?.[b.key]||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
        <ActionButton icon={<PlusCircle size={20}/>} label="Credit"  color="emerald" onClick={()=>openModal('add')}/>
        <ActionButton icon={<MinusCircle size={20}/>} label="Debit" color="rose"    onClick={()=>openModal('subtract')}/>
        <ActionButton icon={<Bell size={20}/>}        label="Ping"     color="blue"    onClick={()=>router.push('/admin/support')}/>
        <ActionButton icon={<UserX size={20}/>}       label={user.is_active?"Suspend":"Restore"} color={user.is_active?"amber":"emerald"} onClick={handleToggleSuspend}/>
        <ActionButton icon={<Trash2 size={20}/>}      label="Purge"     color="rose"    onClick={handleDeleteUser}/>
      </div>

      <CryptoSubWalletPanel userId={userId} userName={formData.full_name || 'this user'} />

      {/* IDENTITY MATRIX + KYC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-[#12121A]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]"><ShieldCheck size={20} className="text-blue-400"/></div>
            Identity Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <InputField label="Full Legal Name"       name="full_name" value={formData.full_name} onChange={handleInputChange}/>
            <InputField label="Email Address"         name="email"     value={formData.email}     onChange={handleInputChange} type="email"/>
            <InputField label="Date of Birth"         name="dob"       value={formData.dob}       onChange={handleInputChange} placeholder="YYYY-MM-DD"/>
            <InputField label="Gender"                name="gender"    value={formData.gender}    onChange={handleInputChange}/>
            <InputField label="Phone Number"          name="phone"     value={formData.phone}     onChange={handleInputChange} icon={<Phone size={16}/>}/>
            <InputField label="Country of Residence"  name="country"   value={formData.country}   onChange={handleInputChange} icon={<MapPin size={16}/>}/>
            <div className="md:col-span-2"><InputField label="Residential Address" name="address" value={formData.address} onChange={handleInputChange}/></div>
            <div className="md:col-span-2 p-5 bg-[#05050A] rounded-2xl border border-white/5 shadow-inner">
              <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Regulatory ID (SSN, BVN, NIN…)</label>
              <div className="flex items-center gap-4"><Hash size={20} className="text-gray-500"/>
                <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} className="w-full bg-transparent text-white font-mono font-black text-xl outline-none placeholder:text-gray-700" placeholder="NULL"/>
              </div>
            </div>
            <div className="md:col-span-2 p-6 bg-purple-900/10 rounded-2xl border border-purple-500/20 shadow-[inset_0_0_30px_rgba(168,85,247,0.05)]">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Referral Code</label>
                  <div className="text-white font-mono font-black text-2xl ml-1 tracking-wider">{user.referral_code||'NULL'}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Referrer Override</label>
                  <input type="text" name="referred_by_code" value={formData.referred_by_code} onChange={handleInputChange} className="w-full bg-[#05050A] border border-purple-500/30 text-white rounded-xl p-3.5 outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 font-mono text-sm tracking-wider placeholder:text-gray-700 transition-all" placeholder="ENTER_CODE"/>
                  <p className="text-[10px] text-gray-500 mt-3 ml-1 uppercase tracking-widest font-bold">Uplink: <span className="text-gray-300">{formData.referred_by_email}</span></p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleUpdateProfile} disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-50 hover:scale-[1.01]">
            {isSaving ? 'Encrypting...' : 'Update Matrix Settings'}
          </button>
        </div>

        <div className="bg-[#12121A]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl h-fit">
          <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]"><ShieldAlert size={20} className="text-amber-400"/></div>
            KYC Vault
          </h2>
          <div className="space-y-6">
            {['govt_id_url','id_card_url'].map((field,i)=>(
              <div key={field}>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{i===0?'Government ID (Passport/License)':'Standard ID Card (Front)'}</p>
                {user[field] ? (
                  <a href={getImageUrl(user[field])||'#'} target="_blank" rel="noopener noreferrer" className="relative group rounded-2xl overflow-hidden border border-white/10 bg-[#05050A] aspect-video flex items-center justify-center block">
                    <FileImage className="text-gray-600 absolute group-hover:scale-110 transition-transform" size={40}/>
                    <img src={getImageUrl(user[field])||''} alt="ID" className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity relative z-10"/>
                  </a>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-[#05050A] p-8 text-center text-xs font-black uppercase tracking-widest text-gray-600">NULL RECORD</div>
                )}
              </div>
            ))}
            {user.kyc_status==='pending'&&(
              <div className="flex gap-4 pt-6 border-t border-white/5 mt-8">
                <button onClick={()=>handleKycReview('verified')} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Verify</button>
                <button onClick={()=>handleKycReview('rejected')} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Reject</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEDGER */}
      <div className="bg-[#12121A]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl overflow-hidden">
        <h2 className="text-xl font-black text-white mb-8 flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]"><Activity size={20} className="text-blue-400"/></div>
          Ledger Terminal
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-gray-500 font-black border-b border-white/5">
              <tr>
                <th className="p-5 pl-6">Operation</th><th className="p-5">Routing</th>
                <th className="p-5">Hash</th><th className="p-5">Value</th>
                <th className="p-5">Status</th><th className="p-5 text-right pr-6">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length===0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-gray-600 font-black tracking-widest uppercase text-xs">Ledger Empty</td></tr>
              ) : transactions.map((tx:any)=>{
                const isCredit = tx.transaction_type==='deposit'||tx.transaction_type==='crypto_buy';
                return (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl border ${isCredit?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {isCredit?<ArrowDownToLine size={16}/>:<ArrowUpFromLine size={16}/>}
                        </div>
                        <div>
                          <span className="text-white font-black text-sm uppercase tracking-wide">{tx.transaction_type?.replace(/_/g,' ')}</span>
                          {tx.destination_details&&<p className="text-gray-500 text-[10px] max-w-[250px] truncate mt-1 font-bold">{tx.destination_details}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${tx.wallet_type==='profit'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':tx.wallet_type==='bonus'?'bg-amber-500/10 text-amber-400 border-amber-500/20':tx.wallet_type==='referral'?'bg-purple-500/10 text-purple-400 border-purple-500/20':'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{tx.wallet_type||'main'}</span>
                    </td>
                    <td className="p-5 text-gray-500 text-xs font-mono font-medium">{tx.reference}</td>
                    <td className="p-5 text-white font-mono text-sm font-black tracking-wide">{isCredit?'+':'-'}${Math.abs(parseFloat(tx.amount)).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black border ${tx.status==='completed'||tx.status==='approved'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':tx.status==='pending'?'bg-amber-500/10 text-amber-400 border-amber-500/30':'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>{tx.status}</span>
                    </td>
                    <td className="p-5 pr-6 text-right text-gray-500 text-[10px] font-mono font-bold uppercase tracking-wider">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Z-[9999] FIAT FUNDS MODAL */}
      {isModalOpen&&(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0A0A0F] border border-white/10 p-8 rounded-t-3xl sm:rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
            <button onClick={()=>setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2.5 rounded-full border border-white/5 transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">{modalAction} Liquidity</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">Target: <span className="text-white">{formData.full_name}'s Vault</span></p>
            
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Routing Sub-Vault</label>
              <select value={targetWallet} onChange={e=>setTargetWallet(e.target.value as any)} className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-black uppercase tracking-wider appearance-none transition-all">
                <option value="main">Main Core</option><option value="profit">Profit Yield</option>
                <option value="bonus">Bonus Stash</option><option value="referral">Referral Node</option>
              </select>
            </div>
            
            <div className="mb-10">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Volume (USD)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 text-2xl font-mono font-black">$</span>
                <input type="number" className="w-full bg-[#12121A] border border-white/10 text-white text-3xl font-black rounded-2xl py-5 pl-12 pr-6 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none font-mono transition-all placeholder:text-gray-700" placeholder="0.00" value={amountInput} onChange={e=>setAmountInput(e.target.value)}/>
              </div>
            </div>
            
            <button onClick={handleBalanceAdjust} disabled={isProcessing||!amountInput} className={`w-full py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] text-white transition-all ${modalAction==='add'?'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)]':'bg-rose-600 hover:bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)]'} disabled:opacity-50 hover:scale-[1.02]`}>
              {isProcessing?'Encrypting...':`Execute ${modalAction==='add'?'Credit':'Debit'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({icon,label,color,onClick}:{icon:React.ReactNode;label:string;color:'emerald'|'rose'|'blue'|'amber';onClick:()=>void}) {
  const m={
    emerald:'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
    rose:'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]',
    blue:'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    amber:'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
  };
  return <button onClick={onClick} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[1.5rem] border transition-all hover:-translate-y-1 ${m[color]}`}>{icon}<span className="text-[10px] font-black uppercase tracking-[0.1em] text-center">{label}</span></button>;
}

function InputField({label,name,value,onChange,type='text',placeholder,icon}:any) {
  return (
    <div>
      <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">{label}</label>
      <div className="relative">
        {icon&&<div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>}
        <input type={type} name={name} value={value} onChange={onChange} className={`w-full bg-[#05050A] border border-white/5 text-white rounded-xl p-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none font-medium transition-all placeholder:text-gray-700 ${icon?'pl-11':''}`} placeholder={placeholder}/>
      </div>
    </div>
  );
}