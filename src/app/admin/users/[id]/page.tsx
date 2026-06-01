'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PlusCircle, MinusCircle, UserX, Bell, LogIn, X,
  Wallet, Activity, ShieldCheck, FileImage, ShieldAlert,
  Trash2, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift,
  Users, MapPin, Phone, Hash, RefreshCw, AlertTriangle,
  Coins, Settings2, Replace
} from 'lucide-react';
import { apiClient, API_URL } from '../../../../lib/apiClient';

const HOST_URL = API_URL.replace('/api/v1', '');

interface CryptoHolding {
  id: string; symbol: string; name: string;
  quantity: number; avg_buy_price: number; updated_at: string;
}
type CryptoAction = 'add' | 'subtract' | 'set';

// Fallback colors for coins if images fail
const COIN_COLORS: Record<string, string> = {
  BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', BNB: '#f3ba2f',
  XRP: '#00aae4', ADA: '#0033ad', USDT: '#26a17b', USDC: '#2775ca',
  DOGE: '#c3a634', LTC: '#bfbbbb', AVAX: '#e84142', MATIC: '#8247e5',
};
const coinColor = (s: string) => COIN_COLORS[s] ?? '#64748b';

function CoinBadge({ symbol, image }: { symbol: string, image?: string }) {
  const [failed, setFailed] = useState(false);
  const url = image || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
  
  return failed ? (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
      style={{ backgroundColor: coinColor(symbol) + '22', color: coinColor(symbol), border: `1px solid ${coinColor(symbol)}55` }}>
      {symbol.slice(0, 2)}
    </div>
  ) : (
    <img src={url} alt={symbol} className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      onError={() => setFailed(true)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Crypto Wallet Panel
// ─────────────────────────────────────────────────────────────────────────────
function CryptoSubWalletPanel({ userId, userName }: { userId: string; userName: string }) {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🚨 Live Market Data for Admin Panel
  const [marketCoins, setMarketCoins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    symbol: '', name: '', quantity: '', avg_buy_price: '',
    action: 'add' as CryptoAction, note: '',
    useCustomSymbol: false, customSymbol: '', customName: '',
  });
  const [formError, setFormError] = useState('');

  // Fetch top 200 coins directly from CoinGecko so Admin can add anything
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMarketCoins(data.map((c: any) => ({
            symbol: c.symbol.toUpperCase(),
            name: c.name,
            price: c.current_price,
            image: c.image
          })));
        }
      })
      .catch(() => console.error("Could not fetch live market data"));
  }, []);

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
    setSearchQuery('');
    setModalOpen(true);
  };

  const resolvedSymbol = form.useCustomSymbol ? form.customSymbol.toUpperCase().trim() : form.symbol;
  const resolvedName   = form.useCustomSymbol ? form.customName.trim() : form.name;

  const handleSubmit = async () => {
    setFormError('');
    const qty   = parseFloat(form.quantity);
    const price = parseFloat(form.avg_buy_price);
    if (!resolvedSymbol)          return setFormError('Please select a coin.');
    if (!resolvedName)            return setFormError('Coin name is missing.');
    if (isNaN(qty)   || qty   <= 0) return setFormError('Please enter a valid amount.');
    if (isNaN(price) || price <= 0) return setFormError('Please enter the current price.');
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
      setFormError(e.response?.data?.detail ?? 'Failed to save.');
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
    add:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/50',
    subtract: 'bg-rose-500/10 text-rose-400 border-rose-500/50',
    set:      'bg-blue-500/10 text-blue-400 border-blue-500/50',
  };

  const displayedCoins = marketCoins.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8); // Show top 8 matches to save space on mobile

  return (
    <div className="bg-[#12121A] border border-white/10 rounded-2xl md:rounded-[2rem] p-4 md:p-6 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Coins size={20} className="text-amber-400" />
          </div>
          User Crypto Wallet
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={fetchHoldings} className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white border border-white/5">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all">
            <PlusCircle size={16} /> Add Coin
          </button>
        </div>
      </div>

      {/* Holdings List */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-xl bg-[#05050A]">
          <Coins size={40} className="text-gray-600 mb-3" />
          <p className="text-gray-400 font-bold">Wallet is Empty</p>
          <p className="text-gray-500 text-xs mt-1 text-center px-4">Click "Add Coin" to give this user cryptocurrency.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#05050A]">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
            <thead className="bg-white/5 text-xs text-gray-400 border-b border-white/5">
              <tr>
                <th className="p-3 pl-4">Coin</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Entry Price</th>
                <th className="p-3">Value</th>
                <th className="p-3 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdings.map(h => (
                <tr key={h.id} className="hover:bg-white/5 transition-all">
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-3">
                      <CoinBadge symbol={h.symbol} />
                      <div>
                        <div className="font-bold text-white text-sm">{h.symbol}</div>
                        <div className="text-gray-500 text-xs">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-white text-sm">{h.quantity.toFixed(6)}</td>
                  <td className="p-3 text-gray-400 text-sm">${h.avg_buy_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-amber-400 font-bold text-sm">${(h.quantity * h.avg_buy_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'add' })} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">+ Add</button>
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'subtract' })} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">− Sub</button>
                      <button onClick={() => openModal({ symbol: h.symbol, name: h.name, action: 'set' })} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">Set</button>
                      <button onClick={() => setDeleteConfirm(h.symbol)} className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-rose-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ADD / EDIT COIN MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0A0A0F] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Update Coin Balance</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              {/* Action Buttons */}
              <div className="flex gap-2">
                {(['add', 'subtract', 'set'] as CryptoAction[]).map(a => (
                  <button key={a} onClick={() => setForm(f => ({ ...f, action: a }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${form.action === a ? actionColors[a] : 'bg-[#12121A] text-gray-400 border border-white/10'}`}>
                    {a === 'add' ? 'Add' : a === 'subtract' ? 'Remove' : 'Set Exact'}
                  </button>
                ))}
              </div>

              {/* Live Coin Search */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Search & Select Coin</label>
                {!form.useCustomSymbol ? (
                  <>
                    <input type="text" placeholder="Search BTC, ETH, SOL..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-3 mb-3 outline-none focus:border-amber-500 text-sm" />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {displayedCoins.map(c => (
                        <button key={c.symbol} onClick={() => setForm(f => ({ ...f, symbol: c.symbol, name: c.name, avg_buy_price: String(c.price || ''), useCustomSymbol: false }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${form.symbol === c.symbol ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/10 bg-[#12121A] text-gray-400'}`}>
                          <CoinBadge symbol={c.symbol} image={c.image} />
                          <span className="text-xs font-bold">{c.symbol}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: true, symbol: '', name: '' }))} className="text-xs text-amber-500 font-bold w-full text-left">
                      + Or type custom coin details
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Symbol (BTC)" value={form.customSymbol} onChange={e => setForm(f => ({ ...f, customSymbol: e.target.value.toUpperCase() }))} className="flex-1 bg-[#12121A] border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-amber-500" />
                    <input type="text" placeholder="Name (Bitcoin)" value={form.customName} onChange={e => setForm(f => ({ ...f, customName: e.target.value }))} className="flex-[2] bg-[#12121A] border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-amber-500" />
                    <button onClick={() => setForm(f => ({ ...f, useCustomSymbol: false }))} className="p-3 text-gray-400 hover:text-white"><X size={16} /></button>
                  </div>
                )}
              </div>

              {/* Number Inputs */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Amount</label>
                  <input type="number" placeholder="0.00" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-amber-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 mb-2">Price (USD)</label>
                  <input type="number" placeholder="0.00" value={form.avg_buy_price} onChange={e => setForm(f => ({ ...f, avg_buy_price: e.target.value }))}
                    className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-3 text-sm outline-none focus:border-amber-500" />
                </div>
              </div>

              {formError && <div className="text-rose-400 text-xs font-bold bg-rose-500/10 p-3 rounded-lg">{formError}</div>}
            </div>

            <div className="p-4 border-t border-white/10">
              <button onClick={handleSubmit} disabled={isProcessing} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-sm">
                {isProcessing ? 'Processing...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0A0A0F] border border-white/10 p-6 rounded-2xl w-full max-w-sm text-center">
            <h3 className="text-lg font-bold text-white mb-2">Delete {deleteConfirm}?</h3>
            <p className="text-gray-400 text-sm mb-6">This will remove the coin from the user's wallet entirely.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={isProcessing} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm">{isProcessing ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main User Details Page
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
    full_name: '', email: '', dob: '', gender: '', phone: '', 
    address: '', country: '', idNumber: '', referred_by_code: '', referred_by_email: ''
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
        gender: u.gender || '', phone: u.phone || '', address: u.address || '', 
        country: u.country || '', idNumber: u.id_number || u.ssn || '', 
        referred_by_code: u.referred_by_code || '', referred_by_email: u.referred_by_email || 'None'
      });
    } catch (e) { console.error("Failed to load user"); }
    finally { setLoading(false); }
  };

  const fetchUserTransactions = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}/transactions`);
      setTransactions(res.data);
    } catch (e) {}
  };

  const openModal = (action: 'add' | 'subtract') => { setModalAction(action); setAmountInput(''); setTargetWallet('main'); setIsModalOpen(true); };

  const handleBalanceAdjust = async () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return alert("Enter a valid amount");
    setIsProcessing(true);
    try {
      await apiClient.post(`/admin/users/${userId}/crypto-holdings`, { 
        symbol: "USDT", name: "Tether", quantity: val, avg_buy_price: 1.0, 
        action: modalAction, note: `Admin ${modalAction === 'add' ? 'Added' : 'Removed'} (${targetWallet.toUpperCase()})` 
      });
      setIsModalOpen(false);
      fetchUserDetails(); fetchUserTransactions();
      alert(`Successfully processed ${val} USDT for ${targetWallet}.`);
    } catch (e: any) { alert("Failed to adjust balance"); }
    finally { setIsProcessing(false); }
  };

  const handleMigrateToCrypto = async () => {
    if (!confirm("Convert old dollar balances into USDT Crypto? This cannot be undone.")) return;
    setIsProcessing(true);
    try {
      const totalFiat = (user.balances.main + user.balances.profit + user.balances.bonus + user.balances.referral);
      if (totalFiat <= 0) { alert("No old balance to convert."); return; }
      
      await apiClient.post(`/admin/users/${userId}/crypto-holdings`, { symbol: "USDT", name: "Tether", quantity: totalFiat, avg_buy_price: 1.0, action: "add", note: "Converted old balance to USDT" });
      if (user.balances.main > 0) await apiClient.post(`/admin/users/${userId}/balance`, { amount: user.balances.main, action: "subtract", wallet_type: "main" });
      if (user.balances.profit > 0) await apiClient.post(`/admin/users/${userId}/balance`, { amount: user.balances.profit, action: "subtract", wallet_type: "profit" });
      if (user.balances.bonus > 0) await apiClient.post(`/admin/users/${userId}/balance`, { amount: user.balances.bonus, action: "subtract", wallet_type: "bonus" });
      if (user.balances.referral > 0) await apiClient.post(`/admin/users/${userId}/balance`, { amount: user.balances.referral, action: "subtract", wallet_type: "referral" });
      
      fetchUserDetails(); fetchUserTransactions();
      alert("Converted successfully.");
    } catch (e) { alert("Conversion failed."); }
    finally { setIsProcessing(false); }
  };

  const handleKycReview = async (status: 'verified' | 'rejected') => {
    if (!confirm(`Mark ID Verification as ${status.toUpperCase()}?`)) return;
    try { await apiClient.post(`/admin/users/${userId}/kyc-review`, { status, reason: "Admin review" }); setUser({ ...user, kyc_status: status }); }
    catch { alert("Failed to update status."); }
  };

  const handleToggleSuspend = async () => {
    const action = user.is_active ? 'suspend' : 'reactivate';
    if (!confirm(`${action.toUpperCase()} this user?`)) return;
    try { await apiClient.post(`/admin/users/${userId}/${action}`); setUser({ ...user, is_active: !user.is_active }); }
    catch { alert(`Failed to ${action} user.`); }
  };

  const handleDeleteUser = async () => {
    if (!confirm("🚨 Delete user permanently?")) return;
    try { await apiClient.delete(`/admin/users/${userId}`); router.push('/admin/users'); }
    catch { alert("Failed to delete user."); }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Login to app as ${formData.email}?`)) return;
    try {
      const res = await apiClient.post(`/admin/users/${userId}/impersonate`);
      localStorage.setItem('temp_impersonation_token', res.data.access_token);
      window.open('/dashboard', '_blank');
    } catch (e: any) { alert("Login failed"); }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try { await apiClient.patch(`/admin/users/${userId}`, formData); alert("Profile saved."); }
    catch { alert("Failed to save."); }
    finally { setIsSaving(false); }
  };

  const handleInputChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const getImageUrl = (url: string) => { if (!url) return null; return url.startsWith('http') ? url : `${HOST_URL}${url}`; };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#05050A]">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <div className="p-8 text-white font-bold text-center">User Not Found.</div>;

  const totalLegacyEquity = (user.balances?.main||0)+(user.balances?.profit||0)+(user.balances?.bonus||0)+(user.balances?.referral||0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="inline-block px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-lg mb-2">ID: {user.id}</div>
          <h1 className="text-2xl md:text-4xl font-bold text-white">{formData.full_name || 'No Name'}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`px-3 py-1 rounded-md text-xs font-bold border ${user.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>{user.is_active ? 'Account Active' : 'Blocked'}</span>
            <span className={`px-3 py-1 rounded-md text-xs font-bold border ${user.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : user.kyc_status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>ID: {user.kyc_status}</span>
          </div>
        </div>
        <button onClick={handleImpersonate} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm w-full sm:w-auto">
          Login as User
        </button>
      </div>

      {/* Legacy Balances (To be deleted later) */}
      <div className="bg-[#12121A] border border-rose-500/20 rounded-2xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-rose-400">Old Dollar Balances (Convert to Crypto)</h2>
          <span className="text-2xl font-bold text-white">${totalLegacyEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'main', label: 'Main', icon: <Wallet size={16} /> },
            { key: 'profit', label: 'Profits', icon: <TrendingUp size={16} /> },
            { key: 'bonus', label: 'Bonuses', icon: <Gift size={16} /> },
            { key: 'referral', label: 'Referrals', icon: <Users size={16} /> },
          ].map(b => (
            <div key={b.key} className="bg-[#05050A] p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-400 mb-2">{b.icon}<span className="text-xs font-bold">{b.label}</span></div>
              <div className="text-lg font-bold text-white">${(user.balances?.[b.key]||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <ActionButton icon={<Gift size={18}/>} label="Add USDT" color="emerald" onClick={()=>openModal('add')}/>
        <ActionButton icon={<MinusCircle size={18}/>} label="Remove USDT" color="rose" onClick={()=>openModal('subtract')}/>
        <ActionButton icon={<Replace size={18}/>} label="Convert to Crypto" color="blue" onClick={handleMigrateToCrypto}/>
        <ActionButton icon={<Bell size={18}/>} label="Message" color="amber" onClick={()=>router.push('/admin/support')}/>
        <ActionButton icon={<UserX size={18}/>} label={user.is_active?"Block":"Unblock"} color={user.is_active?"amber":"emerald"} onClick={handleToggleSuspend}/>
        <ActionButton icon={<Trash2 size={18}/>} label="Delete User" color="rose" onClick={handleDeleteUser}/>
      </div>

      <CryptoSubWalletPanel userId={userId} userName={formData.full_name || 'this user'} />

      {/* User Details & ID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-[#12121A] border border-white/5 rounded-2xl p-5 md:p-6">
          <h2 className="text-lg font-bold text-white mb-6">User Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InputField label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange}/>
            <InputField label="Email Address" name="email" value={formData.email} onChange={handleInputChange} type="email"/>
            <InputField label="Date of Birth" name="dob" value={formData.dob} onChange={handleInputChange} placeholder="YYYY-MM-DD"/>
            <InputField label="Gender" name="gender" value={formData.gender} onChange={handleInputChange}/>
            <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} icon={<Phone size={14}/>}/>
            <InputField label="Country" name="country" value={formData.country} onChange={handleInputChange} icon={<MapPin size={14}/>}/>
            <div className="sm:col-span-2"><InputField label="Home Address" name="address" value={formData.address} onChange={handleInputChange}/></div>
            
            <div className="sm:col-span-2 p-4 bg-[#05050A] rounded-xl border border-white/5">
              <label className="block text-gray-500 text-xs font-bold mb-2">ID Number (SSN, NIN, etc.)</label>
              <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} className="w-full bg-transparent text-white font-bold text-lg outline-none" placeholder="Not provided"/>
            </div>
            
            <div className="sm:col-span-2 p-4 bg-purple-900/20 rounded-xl border border-purple-500/20">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-purple-400 text-xs font-bold mb-2">Their Invite Code</label>
                  <div className="text-white font-bold text-lg">{user.referral_code||'None'}</div>
                </div>
                <div className="flex-1">
                  <label className="block text-purple-400 text-xs font-bold mb-2">Referred By</label>
                  <input type="text" name="referred_by_code" value={formData.referred_by_code} onChange={handleInputChange} className="w-full bg-[#05050A] border border-purple-500/30 text-white rounded-lg p-2 text-sm outline-none" placeholder="Code"/>
                  <p className="text-xs text-gray-500 mt-2">Person: {formData.referred_by_email}</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleUpdateProfile} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">
            {isSaving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

        <div className="bg-[#12121A] border border-white/5 rounded-2xl p-5 md:p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-6">ID Verification</h2>
          <div className="space-y-6">
            {['govt_id_url','id_card_url'].map((field,i)=>(
              <div key={field}>
                <p className="text-xs font-bold text-gray-500 mb-2">{i===0?'Government ID':'Selfie / Other ID'}</p>
                {user[field] ? (
                  <a href={getImageUrl(user[field])||'#'} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-white/10 bg-[#05050A] aspect-video relative">
                    <img src={getImageUrl(user[field])||''} alt="ID" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#05050A] p-6 text-center text-xs font-bold text-gray-600">No file uploaded</div>
                )}
              </div>
            ))}
            {user.kyc_status==='pending' && (
              <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                <button onClick={()=>handleKycReview('verified')} className="flex-1 bg-emerald-600/20 text-emerald-400 py-3 rounded-xl text-xs font-bold">Approve</button>
                <button onClick={()=>handleKycReview('rejected')} className="flex-1 bg-rose-600/20 text-rose-400 py-3 rounded-xl text-xs font-bold">Reject</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="bg-[#12121A] border border-white/5 rounded-2xl p-5 md:p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-6">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[600px]">
            <thead className="bg-white/5 text-xs text-gray-400 border-b border-white/5">
              <tr>
                <th className="p-3 pl-4">Type</th>
                <th className="p-3">Wallet</th>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right pr-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-sm">No transactions yet.</td></tr>
              ) : transactions.map((tx:any)=>{
                const isCredit = tx.transaction_type==='deposit'||tx.transaction_type==='crypto_buy'||tx.transaction_type==='bonus'||tx.transaction_type==='profit';
                return (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isCredit?'bg-emerald-500/20 text-emerald-400':'bg-rose-500/20 text-rose-400'}`}>
                          {isCredit?<ArrowDownToLine size={14}/>:<ArrowUpFromLine size={14}/>}
                        </div>
                        <div>
                          <span className="text-white font-bold text-sm capitalize">{tx.transaction_type?.replace(/_/g,' ')}</span>
                          {tx.destination_details&&<p className="text-gray-500 text-xs max-w-[200px] truncate">{tx.destination_details}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs font-bold text-gray-400 uppercase">{tx.wallet_type||'main'}</td>
                    <td className="p-3 text-gray-500 text-xs">{tx.reference}</td>
                    <td className="p-3 text-white text-sm font-bold">{isCredit?'+':'-'}{Math.abs(parseFloat(tx.amount))}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status==='completed'||tx.status==='approved'?'bg-emerald-500/20 text-emerald-400':tx.status==='pending'?'bg-amber-500/20 text-amber-400':'bg-rose-500/20 text-rose-400'}`}>{tx.status}</span>
                    </td>
                    <td className="p-3 pr-4 text-right text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rewards USDT Modal */}
      {isModalOpen&&(
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0A0A0F] border border-white/10 p-6 rounded-t-2xl sm:rounded-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white capitalize">{modalAction === 'add' ? 'Add USDT Reward' : 'Remove USDT'}</h2>
              <button onClick={()=>setIsModalOpen(false)} className="text-gray-500 bg-white/5 p-2 rounded-full"><X size={16}/></button>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-400 mb-2">Category</label>
              <select value={targetWallet} onChange={e=>setTargetWallet(e.target.value as any)} className="w-full bg-[#12121A] border border-white/10 text-white rounded-xl p-3 outline-none text-sm">
                <option value="main">Standard Deposit</option>
                <option value="profit">Trading Profits</option>
                <option value="bonus">Sign-up / Promo Bonus</option>
                <option value="referral">Referral Earnings</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 mb-2">Amount (USDT)</label>
              <input type="number" className="w-full bg-[#12121A] border border-white/10 text-white text-lg font-bold rounded-xl p-3 outline-none focus:border-emerald-500" placeholder="0.00" value={amountInput} onChange={e=>setAmountInput(e.target.value)}/>
            </div>
            
            <button onClick={handleBalanceAdjust} disabled={isProcessing||!amountInput} className={`w-full py-3 rounded-xl font-bold text-sm text-white ${modalAction==='add'?'bg-emerald-600':'bg-rose-600'} disabled:opacity-50`}>
              {isProcessing?'Processing...':`Confirm`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({icon,label,color,onClick}:{icon:React.ReactNode;label:string;color:'emerald'|'rose'|'blue'|'amber';onClick:()=>void}) {
  const m={
    emerald:'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30',
    rose:'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/30',
    blue:'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/30',
    amber:'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30'
  };
  return <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border transition-all ${m[color]}`}>{icon}<span className="text-xs font-bold text-center">{label}</span></button>;
}

function InputField({label,name,value,onChange,type='text',placeholder,icon}:any) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-bold mb-2">{label}</label>
      <div className="relative">
        {icon&&<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>}
        <input type={type} name={name} value={value} onChange={onChange} className={`w-full bg-[#05050A] border border-white/5 text-white rounded-lg p-3 text-sm focus:border-blue-500 outline-none ${icon?'pl-9':''}`} placeholder={placeholder}/>
      </div>
    </div>
  );
}