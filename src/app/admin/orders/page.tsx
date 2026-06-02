'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowDownToLine, ArrowUpFromLine, CheckCircle2, 
  XCircle, Clock, FileImage, ShieldCheck, ExternalLink,
  User, Mail, Landmark
} from 'lucide-react';
// 🚨 Import the centralized client and the dynamic URL
import { apiClient, API_URL } from '@/src/lib/apiClient';

// 🚨 Use the imported API_URL to generate the HOST_URL for legacy images
const HOST_URL = API_URL.replace('/api/v1', '');

interface Order {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: string;
  wallet_type: string; // 🚨 Added to interface
  status: string;
  reference: string;
  proof_url: string | null;
  destination_details: string | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    kyc_status: string;
  };
}

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  // 🚨 NEW HELPER: Safely handles Cloudinary Links vs Legacy Links
  const getImageUrl = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // It's Cloudinary, return exactly as is!
    }
    return `${HOST_URL}${url}`; // It's legacy, prepend the backend host.
  };

  // 🚨 NEW HELPER: Smartly extracts the exact coin/currency from the Web3 Ledger
  const getCurrency = (order: Order) => {
    if (!order) return 'USD';
    const wt = (order.wallet_type || '').toUpperCase();
    
    // Check if the backend explicitly passed the coin symbol
    const knownCoins = ['USDT', 'BTC', 'ETH', 'USDC', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'LTC'];
    if (knownCoins.includes(wt)) return wt;

    // Check if it's logged in the destination details (Fallback for withdrawals)
    if (order.destination_details) {
      const dest = order.destination_details.toUpperCase();
      const debitMatch = dest.match(/NATIVE DEBIT: [\d\.]+ ([A-Z]+)/);
      if (debitMatch && debitMatch[1]) return debitMatch[1];
      
      const depositMatch = dest.match(/NATIVE ([A-Z]+) DEPOSIT/);
      if (depositMatch && depositMatch[1]) return depositMatch[1];
    }

    return wt === 'MAIN' ? 'USD' : wt || 'USD';
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/orders', {
        params: { status: filter }
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this transaction?`)) return;
    
    try {
      await apiClient.post(`/admin/orders/${orderId}/${action}`);
      alert(`Transaction ${action.toUpperCase()}D successfully!`);
      fetchOrders(); 
    } catch (error: any) {
      console.error(`Failed to ${action} order`, error);
      alert(error.response?.data?.detail || `Failed to ${action}`);
    }
  };

  return (
    <div className="relative min-h-full pb-20">
      {/* AMBIENT GLOWS */}
      <div className="hidden dark:block absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1 flex items-center gap-3">
            <ShieldCheck size={28} className="text-blue-500" />
            Liquidity Clearinghouse
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Review deposits, verify identity, and authorize settlement destinations.</p>
        </div>
        
        {/* SEGMENTED FILTER TABS */}
        <div className="flex items-center bg-gray-100 dark:bg-[#05050a] p-1.5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none w-full md:w-auto">
          {['pending', 'completed', 'rejected'].map((status) => {
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg capitalize font-bold text-xs tracking-wider transition-all ${
                  isActive 
                  ? 'bg-white dark:bg-[#1a1a24] text-blue-600 dark:text-blue-400 shadow-md border border-gray-200 dark:border-white/10' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-blue-600 dark:text-blue-400 font-mono text-sm uppercase tracking-widest animate-pulse">Scanning Ledger...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 border border-dashed border-gray-300 dark:border-white/10 rounded-3xl bg-gray-50 dark:bg-[#0a0a0f]/50">
              <CheckCircle2 size={48} className="text-gray-400 dark:text-gray-600 mb-4 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">Clearance Queue Empty</p>
              <p className="text-gray-500 text-sm mt-1">No {filter} orders requiring your attention.</p>
            </div>
          ) : (
            orders.map((order) => {
              const isDeposit = order.transaction_type.toLowerCase() === 'deposit';
              
              const safeImageUrl = getImageUrl(order.proof_url);
              
              // 🚨 Calculate the exact currency formatting
              const currency = getCurrency(order);
              const isFiat = currency === 'USD';
              const displayPrefix = isFiat ? '$' : '';
              
              return (
                <div key={order.id} className="bg-white dark:bg-[#0a0a0f]/80 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl flex flex-col md:flex-row gap-6 transition-all hover:border-blue-200 dark:hover:border-white/10 group">
                  
                  {/* LEFT SIDE: Order Details & Dossier */}
                  <div className="flex-1 flex flex-col">
                    
                    {/* TOP ROW: Type & Date */}
                    <div className="flex justify-between items-center mb-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        isDeposit ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                                  : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                      }`}>
                        {isDeposit ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                        {order.transaction_type} • {currency}
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* AMOUNT & REF */}
                    <div className="mb-4">
                      <h3 className="text-4xl font-black text-gray-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                        {displayPrefix}{Math.abs(order.amount).toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: isFiat ? 2 : 6 
                        })}
                        <span className="text-xl text-gray-500 font-bold">{currency}</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-2 flex items-center gap-2">
                        <span className="uppercase tracking-widest font-bold">REF:</span> {order.reference}
                      </p>
                    </div>

                    {/* CLIENT DOSSIER & DESTINATION */}
                    <div className="mb-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={14} className="text-blue-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {order.user?.full_name || 'System Auto-Generated'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">
                          {order.user?.email || 'N/A'}
                        </span>
                      </div>

                      {/* WITHDRAWAL DESTINATION BOX */}
                      {!isDeposit && (
                        <div className="pt-3 border-t border-gray-200 dark:border-white/5 mt-3">
                          <div className="flex items-start gap-3">
                            <Landmark size={14} className="text-rose-500 mt-1" />
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">
                                Settlement Destination
                              </p>
                              <p className={`text-xs font-mono leading-relaxed p-3 rounded-xl border break-words ${
                                order.destination_details 
                                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' 
                                  : 'text-gray-500 bg-gray-50 dark:bg-[#05050a] border-dashed border-gray-300 dark:border-white/10 italic'
                              }`}>
                                {order.destination_details || 'No settlement details provided (Legacy Order).'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM: Action Buttons / Status */}
                    <div className="mt-auto">
                      {order.status === 'pending' ? (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleAction(order.id, 'approve')}
                            className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Authorize
                          </button>
                          <button 
                            onClick={() => handleAction(order.id, 'reject')}
                            className="flex-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm dark:shadow-[0_0_15px_rgba(244,63,94,0.1)] flex items-center justify-center gap-2"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-widest ${
                          order.status === 'completed' 
                            ? 'bg-emerald-50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/10' 
                            : 'bg-rose-50 dark:bg-rose-500/5 text-rose-600 dark:text-rose-500 border border-rose-100 dark:border-rose-500/10'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          {order.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: DOCUMENT VAULT (Image Preview for Deposits) */}
                  {isDeposit && (
                    <div className="w-full md:w-48 flex flex-col mt-6 md:mt-0">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Payment Proof</p>
                      {order.proof_url ? (
                        <div 
                          onClick={() => window.open(safeImageUrl, '_blank')}
                          className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-[#05050a] flex-1 min-h-[200px] flex items-center justify-center cursor-pointer group/img transition-colors"
                        >
                          <FileImage className="text-gray-400 dark:text-gray-600 absolute" size={32} />
                          <img 
                            src={safeImageUrl} 
                            alt="Payment Proof" 
                            className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 group-hover/img:scale-105 transition-all duration-500 relative z-10"
                          />
                          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity z-20 flex items-center justify-center">
                            <span className="text-white font-bold text-xs flex items-center gap-2 drop-shadow-md bg-black/50 px-3 py-1.5 rounded-full border border-white/20">
                              <ExternalLink size={14} /> View File
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-[#05050a] flex-1 min-h-[200px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-600 transition-colors">
                          <FileImage size={24} className="mb-2 opacity-50" />
                          <span className="text-xs font-medium italic">No document attached</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}