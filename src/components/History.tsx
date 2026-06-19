import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, Search, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import socket from '../lib/socket';
import Receipt from './Receipt';
import StatusBar from './StatusBar';

interface HistoryProps {
  type: 'receive' | 'send';
  onBack: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAccountNo: string;
  balances: Record<string, number>;
  activeCurrency: 'USD' | 'KHR';
}

interface Transaction {
  id: string;
  type: 'receive' | 'send';
  amount: number;
  currency: string;
  partyName: string;
  partyAccountNo: string;
  createdAt: string;
  note?: string;
  balanceAfter?: number;
}

interface GroupedTransactions {
  title: string;
  data: Transaction[];
}

/* ── Avatar with initials ────────────────────────────────────── */
function TxAvatar({ name, type }: { name: string; type: 'receive' | 'send' }) {
  const getInitials = (n: string) => {
    const clean = n.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const initials = getInitials(name);

  return (
    <div className="relative shrink-0">
      <div
        className="w-[46px] h-[46px] rounded-full flex items-center justify-center"
        style={{
          background:
            type === 'receive'
              ? 'linear-gradient(135deg, #3ac59f 0%, #0e9f6e 100%)'
              : 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        }}
      >
        <span className="text-white font-bold text-[14px] tracking-wide select-none">{initials}</span>
      </div>
      <div
        className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-[#011e29]"
        style={{ backgroundColor: type === 'receive' ? '#3ac59f' : '#e55f5c' }}
      >
        {type === 'receive' ? (
          <ArrowDownLeft className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        ) : (
          <ArrowUpRight className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        )}
      </div>
    </div>
  );
}

export default function History({
  onBack,
  currentUserId,
  currentUserName,
  currentUserAccountNo,
  balances,
  activeCurrency,
}: HistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'send' | 'receive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchTransactions = () => {
    fetch(`/api/user/${currentUserId}/transactions`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransactions();
    const onBalanceUpdate = () => fetchTransactions();
    socket.on('balance_update', onBalanceUpdate);
    return () => {
      socket.off('balance_update', onBalanceUpdate);
    };
  }, [currentUserId]);

  const formatAmount = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatBalance = (val: number) =>
    val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
    } catch {
      return '';
    }
  };

  const getCurrentFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  /* ── Filter + group ──────────────────────────────────────────── */
  const groupedTransactions = useMemo(() => {
    let filtered = transactions.filter(t => t.currency === activeCurrency);
    if (activeTab !== 'all') {
      filtered = filtered.filter(t => t.type === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.partyName.toLowerCase().includes(q) ||
          t.partyAccountNo.includes(q) ||
          t.note?.toLowerCase().includes(q)
      );
    }

    const groups: GroupedTransactions[] = [];
    const map: { [key: string]: number } = {};

    const getLocalDate = (d: Date) =>
      d.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

    filtered.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      const txDateStr = getLocalDate(txDate);
      const todayStr = getLocalDate(new Date());
      const yesterdayStr = getLocalDate(new Date(Date.now() - 86400000));

      let dateKey = '';
      if (txDateStr === todayStr) {
        dateKey = 'TODAY';
      } else if (txDateStr === yesterdayStr) {
        dateKey = 'YESTERDAY';
      } else {
        const day = txDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric' });
        const month = txDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'short' }).toUpperCase();
        const year = txDate.toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' });
        dateKey = `${day} ${month} ${year}`;
      }

      if (map[dateKey] !== undefined) {
        groups[map[dateKey]].data.push(tx);
      } else {
        map[dateKey] = groups.length;
        groups.push({ title: dateKey, data: [tx] });
      }
    });

    return groups;
  }, [transactions, activeCurrency, activeTab, searchQuery]);

  const totalSent = useMemo(
    () => transactions.filter(t => t.type === 'send' && t.currency === activeCurrency).reduce((s, t) => s + t.amount, 0),
    [transactions, activeCurrency]
  );
  const totalReceived = useMemo(
    () => transactions.filter(t => t.type === 'receive' && t.currency === activeCurrency).reduce((s, t) => s + t.amount, 0),
    [transactions, activeCurrency]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="absolute inset-0 z-50 flex flex-col font-sans overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #011e29 0%, #01141c 100%)' }}
    >
      <StatusBar className="bg-transparent" />

      {/* ── Receipt overlay ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedTx && (
          <Receipt
            amount={selectedTx.amount.toString()}
            currency={selectedTx.currency as 'USD' | 'KHR'}
            recipientName={selectedTx.type === 'receive' ? currentUserName : selectedTx.partyName}
            recipientAccount={selectedTx.type === 'receive' ? currentUserAccountNo : selectedTx.partyAccountNo}
            senderName={selectedTx.type === 'receive' ? selectedTx.partyName : currentUserName}
            senderAccount={selectedTx.type === 'receive' ? selectedTx.partyAccountNo : currentUserAccountNo}
            transactionId={selectedTx.id}
            transactionDate={selectedTx.createdAt}
            remainingBalance={selectedTx.balanceAfter}
            type={selectedTx.type as 'send' | 'receive'}
            note={selectedTx.note}
            onBack={() => setSelectedTx(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 pt-1 pb-3 text-white shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
          </button>
          <span className="text-[18px] font-bold tracking-tight">Transaction History</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(v => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <Search className="w-4.5 h-4.5 text-white/80" strokeWidth={2.2} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all">
            <SlidersHorizontal className="w-4.5 h-4.5 text-white/80" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3 overflow-hidden shrink-0"
          >
            <div className="flex items-center bg-white/8 border border-white/12 rounded-[12px] px-3 gap-2">
              <Search className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or account…"
                className="flex-1 bg-transparent text-white text-[13px] py-2.5 outline-none placeholder:text-white/35 font-sans"
                style={{ WebkitUserSelect: 'auto', userSelect: 'auto' } as any}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/50 text-lg leading-none">×</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Account Card ──────────────────────────────────────── */}
      <div className="px-4 pb-3 shrink-0">
        <div
          className="rounded-[20px] p-4 border border-white/8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #032e3d 0%, #021e28 100%)' }}
        >
          {/* BG decoration */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-5" style={{ background: '#00bcd4' }} />

          <div className="flex justify-between items-start mb-3 relative z-10">
            <div>
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-0.5">
                {activeCurrency} Savings
              </p>
              <p className="text-white/70 font-medium text-[12px]">{currentUserAccountNo}</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-full px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-white/80 font-bold text-[11px] tracking-tight">{getCurrentFormattedDate()}</span>
            </div>
          </div>

          <div className="text-[28px] font-bold text-white tracking-tight leading-none mb-3 relative z-10">
            {formatBalance(balances[activeCurrency] || 0)}
            <span className="text-[16px] font-semibold text-white/60 ml-2">{activeCurrency}</span>
          </div>

          {/* Mini stats */}
          <div className="flex gap-4 relative z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#3ac59f]/20 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-[#3ac59f]" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold">Received</p>
                <p className="text-[#3ac59f] text-[12px] font-bold leading-none">{formatAmount(totalReceived)}</p>
              </div>
            </div>
            <div className="w-px bg-white/10 self-stretch" />
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[#e55f5c]/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-[#e55f5c]" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold">Sent</p>
                <p className="text-[#e55f5c] text-[12px] font-bold leading-none">{formatAmount(totalSent)}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1 text-white/35 text-[11px]">
              <Info className="w-3 h-3" strokeWidth={2} />
              <span className="font-medium">{activeCurrency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <div className="px-4 pb-2 shrink-0">
        <div className="flex gap-2">
          {(['all', 'send', 'receive'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-[10px] text-[12px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                activeTab === tab
                  ? 'bg-[#00bcd4] text-white shadow-[0_4px_12px_rgba(0,188,212,0.35)]'
                  : 'bg-white/6 text-white/50 hover:bg-white/10'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'send' ? 'Sent' : 'Received'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction Feed ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-white/20 border-t-[#00bcd4] rounded-full"
            />
            <span className="text-white/40 text-sm font-medium">Loading transactions…</span>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 px-8">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-white/30">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-white/40 text-[13px] text-center font-medium">No transactions found</p>
          </div>
        ) : (
          groupedTransactions.map(group => (
            <div key={group.title} className="w-full">
              {/* Date group header */}
              <div className="px-4 py-2 flex items-center gap-2 sticky top-0 z-10" style={{ background: 'rgba(1, 20, 28, 0.9)', backdropFilter: 'blur(8px)' }}>
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[10.5px] text-white/45 font-bold tracking-[0.12em] uppercase px-2">{group.title}</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Rows */}
              <div className="px-3">
                {group.data.map((t, idx) => (
                  <motion.div
                    key={t.id + idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, ease: 'easeOut' }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 px-3 py-3.5 rounded-[14px] mb-1 cursor-pointer active:bg-white/5 hover:bg-white/4 transition-colors"
                    onClick={() => setSelectedTx(t)}
                  >
                    <TxAvatar name={t.partyName} type={t.type} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-white font-semibold text-[14.5px] truncate leading-snug">
                          {t.partyName}
                        </span>
                        <span
                          className={`font-bold text-[14.5px] shrink-0 ${
                            t.type === 'receive' ? 'text-[#3ac59f]' : 'text-[#f87171]'
                          }`}
                        >
                          {t.type === 'receive' ? '+' : '-'}{formatAmount(t.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-white/40 text-[11.5px] font-medium truncate max-w-[55%]">
                          {t.note
                            ? t.note
                            : t.type === 'receive'
                            ? `Received · ${t.partyAccountNo}`
                            : `Sent · ${t.partyAccountNo}`}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-white/35 text-[10.5px] font-medium">{formatTime(t.createdAt)}</span>
                          <span className="text-white/25 text-[10px] font-medium">{t.currency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronLeft className="w-4 h-4 text-white/25 rotate-180 shrink-0" strokeWidth={2.5} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </div>

      {/* OS home indicator */}
      <div className="flex justify-center pb-2 pt-1 shrink-0">
        <div className="w-28 h-[5px] rounded-full bg-white/15" />
      </div>
    </motion.div>
  );
}
