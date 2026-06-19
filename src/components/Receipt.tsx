import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StatusBar from './StatusBar';

interface ReceiptProps {
  onBack: () => void;
  amount?: string | number;
  currency?: string;
  recipientName?: string;
  recipientAccount?: string;
  senderName?: string;
  senderAccount?: string;
  transactionId?: string;
  transactionDate?: string | Date;
  remainingBalance?: string | number;
  type?: string;
  note?: string;
  txData?: {
    id?: string;
    createdAt?: string | Date;
  };
  transactionDetails?: {
    amount: string;
    date: string;
    id: string;
    senderName: string;
    senderAccount: string;
    receiverName: string;
    receiverAccount: string;
    bankName: string;
    fee: string;
    note?: string;
  };
}

export default function Receipt({
  onBack,
  transactionDetails,
  amount,
  currency,
  recipientName,
  recipientAccount,
  senderName,
  senderAccount,
  transactionId,
  transactionDate,
  type,
  note,
  txData,
}: ReceiptProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowNotification(true), 1500);
    const hideTimer = setTimeout(() => setShowNotification(false), 5000);
    const confettiTimer = setTimeout(() => setConfetti(false), 2500);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
      clearTimeout(confettiTimer);
    };
  }, []);

  /* ── Helpers ─────────────────────────────────────────────── */
  const getInitials = (name: string): string => {
    if (!name) return 'SS';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'SS';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatCleanAmount = (amt: string | number | undefined) => {
    if (amt === undefined || amt === null || amt === '') return '1.00';
    let amtStr = String(amt).trim();
    amtStr = amtStr.replace(/[A-Za-z]/g, '').replace(/[$៛,+-]/g, '').trim();
    const parsed = parseFloat(amtStr);
    return Number.isNaN(parsed)
      ? '1.00'
      : parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateTime = (dateInput: string | Date | undefined) => {
    const build = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const d = date.getDate();
      const h = date.getHours();
      const m = date.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      const dd = d < 10 ? `0${d}` : `${d}`;
      const mm = m < 10 ? `0${m}` : `${m}`;
      const timeOnly24 = `${h < 10 ? '0' + h : h}:${mm}`;
      return {
        displayDate: `${months[date.getMonth()]} ${dd}, ${date.getFullYear()} | ${h12}:${mm}${ampm}`,
        timeOnly: timeOnly24,
      };
    };
    const fallback = build(new Date());
    if (!dateInput) return fallback;
    try {
      const date = new Date(dateInput);
      if (Number.isNaN(date.getTime())) return fallback;
      return build(date);
    } catch {
      return fallback;
    }
  };

  /* ── Resolved values ───────────────────────────────────────── */
  const isReceive = type === 'receive';
  const resolvedCurrency = (currency || (transactionDetails?.amount?.includes('៛') ? 'KHR' : 'USD')).toUpperCase();
  const rawAmount = transactionDetails ? transactionDetails.amount : amount;
  const formattedAmountVal = formatCleanAmount(rawAmount);
  const resolvedTransactionDate = transactionDetails?.date ?? transactionDate ?? txData?.createdAt;
  const { displayDate, timeOnly } = formatDateTime(resolvedTransactionDate);

  const resolvedRecipientName =
    (isReceive
      ? senderName || transactionDetails?.senderName
      : recipientName || transactionDetails?.receiverName) || 'Sovann SEUNG';

  const resolvedRecipientAccount =
    (isReceive
      ? senderAccount || transactionDetails?.senderAccount
      : recipientAccount || transactionDetails?.receiverAccount) || '000 282 862';

  const resolvedSenderAccount =
    (isReceive
      ? recipientAccount || transactionDetails?.receiverAccount
      : senderAccount || transactionDetails?.senderAccount) ||
    'Savings Account with ATM facility (000 282 862)';

  const initials = getInitials(resolvedRecipientName);

  const trxId = useMemo(() => {
    const rawId =
      (transactionDetails ? transactionDetails.id : transactionId) ||
      txData?.id ||
      '9841385178';
    if (/^\d{10}$/.test(rawId)) return rawId;
    let h1 = 0xdeadbeef ^ 0;
    let h2 = 0x41c6ce57 ^ 0;
    for (let i = 0; i < rawId.length; i++) {
      const ch = rawId.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const s1 = Math.abs(h1).toString().padStart(10, '0');
    const s2 = Math.abs(h2).toString().padStart(10, '0');
    return s1.substring(0, 5) + s2.substring(0, 5);
  }, [transactionDetails, transactionId, txData]);

  /* ── Confetti particles ───────────────────────────────────── */
  const particles = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      color: ['#5cb85c', '#00bcd4', '#ffd700', '#ff6b6b', '#a78bfa'][i % 5],
      size: 5 + Math.random() * 6,
    })), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 200 }}
      className="absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #003b5c 0%, #002540 100%)' }}
    >
      {/* ── iOS-style Push Notification ───────────────────── */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.9 }}
            animate={{ y: 8, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="absolute top-0 left-3 right-3 z-[200]"
          >
            <div
              className="rounded-[20px] p-3.5 flex items-center gap-3 border border-white/10"
              style={{
                background: 'rgba(30, 30, 34, 0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
              }}
            >
              {/* App Icon */}
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(145deg, #005c7a, #002f47)' }}
              >
                <span className="text-white text-[12px] font-black tracking-widest">ABA</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-[2px]">
                  <span className="text-white text-[13px] font-semibold tracking-wide">ABA Mobile</span>
                  <span className="text-white/50 text-[11px]">now</span>
                </div>
                <p className="text-white/85 text-[12.5px] leading-snug font-normal truncate">
                  {isReceive ? 'Received' : 'Sent'} {formattedAmountVal} {resolvedCurrency}
                  {isReceive ? ' from ' : ' to '}{resolvedRecipientName}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confetti ──────────────────────────────────────── */}
      <AnimatePresence>
        {confetti && particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute top-0 pointer-events-none rounded-sm"
            style={{ left: `${p.x}%`, width: p.size, height: p.size, backgroundColor: p.color, zIndex: 5 }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: 400, opacity: 0, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration: 1.8 + p.delay, delay: p.delay, ease: 'easeIn' }}
          />
        ))}
      </AnimatePresence>

      <StatusBar className="bg-transparent relative z-10" customTime={timeOnly} />

      {/* ── Scrollable content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="flex flex-col items-center px-5 pt-3 pb-6 w-full max-w-[440px] mx-auto">

          {/* Success badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 250, delay: 0.1 }}
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4 shadow-[0_8px_24px_rgba(92,184,92,0.45)]"
            style={{ background: 'linear-gradient(135deg, #6dd76d 0%, #3a9e3a 100%)' }}
          >
            <motion.svg
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-[26px] font-semibold mb-5 tracking-wide"
          >
            Success
          </motion.h2>

          {/* ── Ticket Card ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', damping: 22, stiffness: 200 }}
            className="w-full bg-white rounded-[22px] shadow-[0_16px_48px_rgba(0,0,0,0.28)] relative overflow-visible"
          >
            {/* Top section */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-[54px] h-[54px] rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)' }}
                  >
                    <span className="text-white font-bold text-[17px] tracking-wide select-none">
                      {initials}
                    </span>
                  </div>
                  {/* Direction badge */}
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center border-[2.5px] border-white shadow-sm"
                    style={{ backgroundColor: isReceive ? '#3ac59f' : '#e55f5c' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      {isReceive
                        ? <path d="M12 19V5M5 12l7 7 7-7" />
                        : <path d="M12 5v14M5 12l7-7 7 7" />
                      }
                    </svg>
                  </div>
                </div>

                {/* Name + Amount */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 leading-tight">
                    <span className="text-[#111] font-bold text-[22px] tracking-tight leading-none">
                      {isReceive ? '+' : '-'}{formattedAmountVal}
                    </span>
                    <span className="text-gray-400 font-semibold text-[14px]">{resolvedCurrency}</span>
                  </div>
                  <span className="text-gray-500 text-[13px] font-semibold tracking-wide mt-1 truncate">
                    {resolvedRecipientName}
                  </span>
                </div>
              </div>
            </div>

            {/* Notched dashed divider */}
            <div className="relative flex items-center h-[1px] mx-0">
              {/* Left notch cutout */}
              <div
                className="absolute -left-[14px] w-[28px] h-[28px] rounded-full shrink-0 z-10"
                style={{ background: 'linear-gradient(180deg, #003b5c 0%, #002540 100%)' }}
              />
              {/* Right notch cutout */}
              <div
                className="absolute -right-[14px] w-[28px] h-[28px] rounded-full shrink-0 z-10"
                style={{ background: 'linear-gradient(180deg, #003b5c 0%, #002540 100%)' }}
              />
              {/* Dashed line */}
              <div className="w-full mx-3 border-t-2 border-dashed border-gray-200" />
            </div>

            {/* Details rows */}
            <div className="px-5 pt-5 pb-5 space-y-3.5">
              <DetailRow label="Trx. ID" value={trxId} mono />
              <DetailRow label="Transaction date" value={displayDate} />
              <DetailRow label="From account" value={resolvedSenderAccount} />
              <DetailRow label="To account" value={resolvedRecipientAccount} />
              {note ? <DetailRow label="Note" value={note} /> : null}
              <div className="pt-1 border-t border-gray-100">
                <DetailRow label="Amount" value={`${formattedAmountVal} ${resolvedCurrency}`} bold />
              </div>
            </div>
          </motion.div>

          {/* ── Action buttons ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center gap-12 mt-8 mb-4"
          >
            <ActionBtn
              label="Screenshot"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </ActionBtn>

            <ActionBtn
              label="Download"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </ActionBtn>

            <ActionBtn
              label="Share"
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                if (navigator.share) {
                  navigator.share({
                    title: 'ABA Transfer Receipt',
                    text: `Transfer ${formattedAmountVal} ${resolvedCurrency} to ${resolvedRecipientName} — Ref: ${trxId}`,
                  }).catch(() => {});
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </ActionBtn>
          </motion.div>

        </div>
      </div>

      {/* ── DONE button ───────────────────────────────────── */}
      <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2 shrink-0">
        <motion.button
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(40);
            onBack();
          }}
          whileTap={{ scale: 0.97 }}
          className="w-full max-w-[440px] mx-auto block text-white font-bold tracking-[0.15em] uppercase text-[15px] rounded-[16px] active:opacity-90 transition-opacity"
          style={{
            height: 56,
            background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
            boxShadow: '0 6px 20px rgba(244, 67, 54, 0.4)',
          }}
        >
          DONE
        </motion.button>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pb-2 shrink-0">
        <div className="w-28 h-[5px] rounded-full bg-white/20" />
      </div>
    </motion.div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function DetailRow({
  label,
  value,
  bold = false,
  mono = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 min-h-[20px]">
      <span className="text-[12.5px] text-gray-400 font-medium shrink-0 pt-px">{label}:</span>
      <span
        className={`text-right leading-relaxed break-words max-w-[60%] ${
          bold
            ? 'text-[13px] text-gray-900 font-bold'
            : mono
            ? 'text-[12.5px] text-gray-800 font-mono font-semibold tracking-wider'
            : 'text-[12.5px] text-gray-800 font-semibold'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
    >
      <div
        className="w-[52px] h-[52px] rounded-full flex items-center justify-center border border-white/15 group-hover:border-white/30 transition-all"
        style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
      >
        {children}
      </div>
      <span className="text-[11px] text-white/75 font-medium tracking-wide">{label}</span>
    </button>
  );
}
