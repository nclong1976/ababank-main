import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  PlusSquare,
  Minus, 
  ChevronLeft, 
  Search, 
  X,
  ShieldCheck,
  RefreshCcw,
  History as HistoryIcon,
  Trash2,
  Ghost,
  ArrowRightLeft,
  Eye,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import socket from '../lib/socket';


interface AdminDashboardProps {
  onBack: () => void;
  onSelectUser: (user: { id: string, name: string }) => void;
  adminId: string;
  onShowProfile: () => void;
}

export default function AdminDashboard({ onBack, onSelectUser, adminId, onShowProfile }: AdminDashboardProps) {
  const [activeTab, setActiveTab ] = useState<'adjustment' | 'master-log' | 'users'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [masterLog, setMasterLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Adjustment Form
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'plus' | 'minus'>('plus');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KHR'>('USD');
  const [reason, setReason] = useState('Admin adjustment (plus)');
  const [senderName, setSenderName] = useState('Sok Samnang');
  const [senderAccount, setSenderAccount] = useState('123 456 789');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper: Generate random Cambodian name and account number
  const cambodianNames = [
    "Sok Samnang", "Chea Vanna", "Meas Sophea", "Chan Rithy", "Keo Srey", 
    "Phan Sothea", "Ratha Lim", "Sovannara Chea", "Vireak Bun", "Dara Noun", 
    "Sopheap Ouk", "Piseth Chhorn", "Bopha Khem", "Chanthou Prak", "Kosal Yim", 
    "Sokha Seng", "Nareth Nguon", "Thida Mao", "Sophea Yin", "Rithy Heng", 
    "Vannak Seng", "Panha Heng", "Socheata Oum", "Nita Lim", "Samnang Chea",
    "Sreymao Sok", "Chhay Yim", "Chhun Pheng", "Dararith Sok", "Khemera Meas"
  ];
  
  const generateRandomSender = () => {
    const name = cambodianNames[Math.floor(Math.random() * cambodianNames.length)];
    const acc = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    return { name, acc };
  };

  // Filters
  const [filterAccount, setFilterAccount] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-id': adminId }
      });
      const data = await res.json();
      if (data.ok) setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMasterLog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/master-log?account=${filterAccount}`, {
        headers: { 'x-admin-id': adminId }
      });
      const data = await res.json();
      if (data.ok) setMasterLog(data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', pin: '', role: 'user' });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({ 
    phone: '', 
    pin: ''
  });

  const toggleUserLock = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-lock`, {
        method: 'POST',
        headers: { 'x-admin-id': adminId }
      });
      const data = await res.json();
      if (data.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTopupLock = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-topup-lock`, {
        method: 'POST',
        headers: { 'x-admin-id': adminId }
      });
      const data = await res.json();
      if (data.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditFormData({ name: user.name, email: user.email, pin: user.pin, role: user.role });
  };

  const saveUserChanges = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will remove all their accounts and transactions.')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { 
        method: 'DELETE',
        headers: { 'x-admin-id': adminId }
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async () => {
    if (!createFormData.phone || !createFormData.pin) {
      alert('Phone number and PIN are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify(createFormData)
      });
      if (res.ok) {
        setShowCreateUserModal(false);
        setCreateFormData({ 
          phone: '', 
          pin: ''
        });
        fetchUsers();
      } else {
        const errorData = await res.json();
        alert('Error: ' + errorData.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'adjustment') {
      fetchUsers();
    } else if (activeTab === 'master-log') {
      fetchMasterLog();
    }
    
    const handleAdminRefresh = () => {
      fetchUsers();
      fetchMasterLog();
    };

    socket.on('user_balance_updated', handleAdminRefresh);
    socket.on('balance_update', handleAdminRefresh);
    socket.on('new_user_registered', handleAdminRefresh);

    // Polling fallback every 4 seconds for serverless real-time sync
    const interval = setInterval(() => {
      if (activeTab === 'users' || activeTab === 'adjustment') {
        fetchUsers();
      } else if (activeTab === 'master-log') {
        fetchMasterLog();
      }
    }, 4000);

    return () => {
      socket.off('user_balance_updated', handleAdminRefresh);
      socket.off('balance_update', handleAdminRefresh);
      socket.off('new_user_registered', handleAdminRefresh);
      clearInterval(interval);
    };
  }, [activeTab, filterAccount]);


  const handleAdjustment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUser || !amount) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/adjust', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-id': adminId
        },
        body: JSON.stringify({
          userId: targetUser.id,
          amount,
          type: adjustType,
          adminId,
          note: reason,
          currency: selectedCurrency,
          partyName: adjustType === 'plus' ? senderName : undefined,
          partyAccountNo: adjustType === 'plus' ? senderAccount : undefined
        })
      });

      const data = await res.json();
      if (data.ok) {
        setIsAdjustModalOpen(false);
        setAmount('');
        fetchUsers();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#011a24] text-white flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <header className="p-4 bg-[#003b4d] shadow-lg sticky top-0 z-10 safe-padding-top">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#00bcd4]" /> 
              Admin
            </h1>
          </div>
          
          <div 
            onClick={onShowProfile}
            className="w-10 h-10 rounded-full border-2 border-[#00bcd4] cursor-pointer hover:scale-105 transition-transform overflow-hidden shadow-lg"
          >
             <img 
              src={`https://ui-avatars.com/api/?name=Admin&background=00bcd4&color=fff`} 
              alt="Admin Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex p-1 bg-black/20 rounded-xl">
          <button 
            onClick={() => setActiveTab('adjustment')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'adjustment' ? 'bg-[#00bcd4] text-[#011a24]' : 'text-gray-400'}`}
          >
            <PlusSquare className="w-4 h-4" /> Adjustment
          </button>
          <button 
            onClick={() => setActiveTab('master-log')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'master-log' ? 'bg-[#00bcd4] text-[#011a24]' : 'text-gray-400'}`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Ledger
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-[#00bcd4] text-[#011a24]' : 'text-gray-400'}`}
          >
            <Users className="w-4 h-4" /> Members
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-[#D4AF37] transition-all"
                />
              </div>
              <button 
                onClick={() => setShowCreateUserModal(true)}
                className="w-12 h-12 bg-[#D4AF37] text-black rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {loadingUsers ? (
              <>
                <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 h-[212px] w-full animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-black/30 rounded-xl p-3 border border-gray-800" />
                    <div className="bg-black/30 rounded-xl p-3 border border-gray-800" />
                  </div>
                </div>
                <div className="bg-[#121212] border border-gray-800 rounded-2xl p-5 h-[212px] w-full animate-pulse flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-white/5 rounded w-1/3" />
                      <div className="h-3 bg-white/5 rounded w-1/4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-black/30 rounded-xl p-3 border border-gray-800" />
                    <div className="bg-black/30 rounded-xl p-3 border border-gray-800" />
                  </div>
                </div>
              </>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                 <Ghost className="w-8 h-8 text-[#D4AF37] animate-bounce" />
                 <span className="text-xs uppercase tracking-widest font-black">Empty Members</span>
              </div>
            ) : filteredUsers.map(u => (
              <motion.div 
                key={u.id}
                layout
                className={`group relative overflow-hidden bg-[#121212] border border-gray-800 rounded-2xl p-5 shadow-2xl transition-all hover:border-[#D4AF37]/30 will-change-transform ${u.is_locked ? 'opacity-80' : ''}`}
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 w-1 h-full ${u.is_locked ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`} />
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`absolute inset-0 blur-md opacity-20 rounded-full ${u.is_locked ? 'bg-red-500' : 'bg-[#D4AF37]'}`} />
                      <div className={`relative w-12 h-12 rounded-full border-2 p-0.5 ${u.is_locked ? 'border-red-500/50' : 'border-[#D4AF37]/50'}`}>
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=${u.is_locked ? '330000' : '1a1a1a'}&color=${u.is_locked ? 'ff0000' : 'D4AF37'}`} 
                          className="w-full h-full rounded-full object-cover"
                          alt="User"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-100 flex items-center gap-2">
                        {u.name.toUpperCase()}
                        {u.role === 'admin' && <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.is_locked ? 'bg-red-500 animate-pulse' : 'bg-blue-400'}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${u.is_locked ? 'text-red-400' : 'text-gray-500'}`}>
                          {u.is_locked ? 'Account Locked' : 'Active Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                    <button 
                      onClick={() => toggleTopupLock(u.id)}
                      className={`p-2 rounded-full transition-all ${u.is_topup_locked ? 'bg-amber-500 text-black' : 'hover:bg-white/10 text-gray-500'}`}
                      title={u.is_topup_locked ? 'Unlock Top-up' : 'Lock Top-up'}
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleUserLock(u.id)}
                      className={`p-2 rounded-full transition-all ${u.is_locked ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'hover:bg-white/10 text-gray-500'}`}
                      title={u.is_locked ? 'Unlock Account' : 'Lock Account'}
                    >
                      {u.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="p-2 hover:bg-red-500/10 rounded-full text-gray-500 hover:text-red-500 transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onSelectUser({ id: u.id, name: u.name })}
                      className="p-2 hover:bg-white/10 rounded-full text-gray-500 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Account Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                   <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
                      <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">USD Account (9 digits)</div>
                      <div className="text-xs text-white font-mono mb-1">{u.accountNumbers?.USD || '--- --- ---'}</div>
                      <div className="text-sm font-black text-[#D4AF37]">
                        ${Number(u.balances?.USD || 0).toLocaleString()}
                      </div>
                   </div>
                   <div className="bg-black/30 rounded-xl p-3 border border-gray-800">
                      <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">KHR Account (9 digits)</div>
                      <div className="text-xs text-white font-mono mb-1">{u.accountNumbers?.KHR || '--- --- ---'}</div>
                      <div className="text-sm font-black text-[#D4AF37]">
                        {Number(u.balances?.KHR || 0).toLocaleString()} ៛
                      </div>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button 
                    disabled={u.is_topup_locked}
                    onClick={() => {
                      const randomSender = generateRandomSender();
                      setTargetUser(u);
                      setAdjustType('plus');
                      setReason('Transfer to ' + (u.accountNumbers?.USD || '...'));
                      setSenderName(randomSender.name);
                      setSenderAccount(randomSender.acc);
                      setIsAdjustModalOpen(true);
                      setAmount('');
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-[10px] tracking-widest uppercase transition-all ${u.is_topup_locked ? 'bg-gray-800 text-gray-600 border border-white/5 cursor-not-allowed' : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-lg shadow-[#D4AF37]/20 active:scale-95'}`}
                   >
                     {u.is_topup_locked ? 'Lock Deposit' : 'Deposit (Plus)'}
                   </button>
                   <button 
                    onClick={() => {
                      setTargetUser(u);
                      setAdjustType('minus');
                      setReason('Admin adjustment (minus)');
                      setIsAdjustModalOpen(true);
                      setAmount('');
                    }}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-xl font-bold text-[10px] tracking-widest uppercase active:scale-95 transition-all shadow-lg shadow-red-500/20"
                   >
                     Deduct
                   </button>
                   <button 
                    onClick={() => handleEditUser(u)}
                    className="px-4 py-2.5 bg-white/5 text-gray-400 border border-white/5 rounded-xl font-bold text-[10px] tracking-widest uppercase hover:bg-white/10 active:scale-95 transition-all"
                   >
                     Settings
                   </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'master-log' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Filter by ID or Email..."
                value={filterAccount}
                onChange={e => setFilterAccount(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none"
              />
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="text-center py-10 opacity-50">Loading...</p>
              ) : masterLog.length === 0 ? (
                <p className="text-center py-10 opacity-50">No transactions found</p>
              ) : (
                masterLog.map(t => (
                  <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{t.createdAt ? new Date(t.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }) : '...'}</span>
                        <span className="font-bold text-[#00bcd4]">User: {t.userId}</span>
                        <span className="text-[10px] text-gray-500 font-mono italic">{t.id}</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className={`font-bold text-lg ${t.type === 'receive' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.type === 'receive' ? '+' : '-'}{t.amount} {t.currency}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                       <span className="text-[11px] text-gray-400 italic">To/From: {t.counterparty}</span>
                       <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded uppercase font-bold text-gray-400">{t.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Secondary users view removed as it was redundant */}
      </main>

      <AnimatePresence>
        {/* ADJUSTMENT MODAL */}
        {isAdjustModalOpen && targetUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/90 backdrop-blur-md"
               onClick={() => setIsAdjustModalOpen(false)}
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 30 }}
               className={`relative w-full max-w-sm bg-[#121212] rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] border overflow-hidden ${adjustType === 'minus' ? 'shadow-[0_0_50px_rgba(220,38,38,0.15)] border-red-900' : 'border-gray-800'}`}
             >
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-10 -mr-16 -mt-16 ${adjustType === 'minus' ? 'bg-red-500' : 'bg-[#D4AF37]'}`} />
                
                <header className="text-center mb-8">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner ${adjustType === 'minus' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]'}`}>
                      {adjustType === 'minus' ? <Minus className="w-8 h-8" strokeWidth={2.5} /> : <Plus className="w-8 h-8" strokeWidth={2.5} />}
                   </div>
                   <h3 className="text-xl font-black text-white font-sans tracking-tight mb-1">BALANCE ADJUSTMENT</h3>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{adjustType === 'minus' ? 'Deduct funds from' : 'Add balance to'} {targetUser.name}</p>
                </header>

                <div className="space-y-6">
                   <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => setSelectedCurrency('USD')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${selectedCurrency === 'USD' ? (adjustType === 'minus' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20') : 'text-gray-500'}`}
                      >USD</button>
                      <button 
                        onClick={() => setSelectedCurrency('KHR')}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${selectedCurrency === 'KHR' ? (adjustType === 'minus' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20') : 'text-gray-500'}`}
                      >KHR</button>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">{adjustType === 'minus' ? 'Amount to deduct' : 'Amount to add'}</label>
                      <div className="relative">
                         <div className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-xl ${adjustType === 'minus' ? 'text-red-500' : 'text-[#D4AF37]'}`}>
                            {selectedCurrency === 'USD' ? '$' : '៛'}
                         </div>
                         <input 
                           type="number"
                           autoFocus
                           placeholder="0.00"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                           className={`w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-2xl font-black text-white outline-none transition-all shadow-inner ${adjustType === 'minus' ? 'focus:border-red-500' : 'focus:border-[#D4AF37]'}`}
                         />
                      </div>
                   </div>

                   {adjustType === 'plus' && (
                     <>
                       <div className="space-y-2 relative">
                          <div className="flex justify-between items-center pr-1">
                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Sender Name (Mock)</label>
                             <button 
                               onClick={() => {
                                  const r = generateRandomSender();
                                  setSenderName(r.name);
                                  setSenderAccount(r.acc);
                               }}
                               className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest hover:underline"
                             >
                                CHANGE SENDER
                             </button>
                          </div>
                          <input 
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                            placeholder="Example: Sok Samnang"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-gray-300 outline-none transition-all focus:border-[#D4AF37]"
                          />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Sender Account No (Mock)</label>
                           <input 
                             value={senderAccount}
                             onChange={e => setSenderAccount(e.target.value)}
                             placeholder="Example: 123 456 789"
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-gray-300 outline-none transition-all focus:border-[#D4AF37]"
                           />
                        </div>
                     </>
                   )}
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Note (Transaction Note)</label>
                      <input 
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-gray-300 outline-none transition-all ${adjustType === 'minus' ? 'focus:border-red-500' : 'focus:border-[#D4AF37]'}`}
                      />
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => setIsAdjustModalOpen(false)}
                        className="flex-1 py-4 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-white transition-colors"
                      >CANCEL</button>
                      <button 
                        disabled={isProcessing || !amount}
                        onClick={() => handleAdjustment()}
                        className={`flex-[2] py-4 rounded-2xl font-black text-xs tracking-widest uppercase active:scale-95 disabled:opacity-50 transition-all ${adjustType === 'minus' ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-xl shadow-red-500/30' : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-xl shadow-[#D4AF37]/30'}`}
                      >
                        {isProcessing ? 'PROCESSING...' : (adjustType === 'minus' ? 'CONFIRM DEDUCT' : 'CONFIRM ADD')}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}

        {/* CREATE MEMBER MODAL */}
        {showCreateUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setShowCreateUserModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-sm bg-[#121212] rounded-[3rem] p-8 shadow-2xl border border-gray-800"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-2xl font-black text-white tracking-tight uppercase">Add New</h3>
                   <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Premium Membership</p>
                </div>
                <button onClick={() => setShowCreateUserModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="text-gray-500" /></button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="example: 0987654321"
                    value={createFormData.phone}
                    onChange={e => setCreateFormData({...createFormData, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#D4AF37] transition-all text-white font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Login PIN (4 digits)</label>
                  <input 
                    maxLength={4}
                    placeholder="****"
                    type="password"
                    value={createFormData.pin}
                    onChange={e => setCreateFormData({...createFormData, pin: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#D4AF37] transition-all text-[#D4AF37] font-black text-xl tracking-[1em] text-center"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleCreateUser}
                    className="w-full py-5 rounded-[1.5rem] font-black tracking-[0.2em] bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-[0_15px_30px_rgba(212,175,55,0.15)] active:scale-95 transition-all text-xs"
                  >
                    CREATE ACCOUNT NOW
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setEditingUser(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#121212] rounded-[2.5rem] p-8 shadow-2xl border border-gray-800"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-white">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X className="text-gray-500" /></button>
              </div>
 
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                  <input 
                    value={editFormData.name}
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#D4AF37] text-white font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">PIN</label>
                   <input 
                     maxLength={4}
                     value={editFormData.pin}
                     onChange={e => setEditFormData({...editFormData, pin: e.target.value.replace(/\D/g, '')})}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#D4AF37] text-[#D4AF37] font-bold font-mono tracking-widest text-center text-xl"
                   />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1">Role</label>
                  <select 
                    value={editFormData.role}
                    onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#D4AF37] text-white font-bold appearance-none"
                  >
                    <option value="user">USER</option>
                    <option value="admin">ADMIN</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={saveUserChanges}
                    className="flex-1 py-4 bg-[#D4AF37] text-black rounded-[1.2rem] font-black text-[10px] tracking-widest active:scale-95 transition-all shadow-lg shadow-[#D4AF37]/20"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

