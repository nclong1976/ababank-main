import React from 'react';
import { motion } from 'motion/react';
import { X, Download, Check } from 'lucide-react';

interface AccountCreationSuccessProps {
  userName: string;
  khrAccount: string;
  usdAccount: string;
  onStartBanking: () => void;
  onClose?: () => void;
}

export default function AccountCreationSuccess({
  userName,
  khrAccount,
  usdAccount,
  onStartBanking,
  onClose,
}: AccountCreationSuccessProps) {
  const formatAccount = (acc: string) =>
    acc.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');

  const handleSave = () => {
    const text = `ABA Account Numbers\nKHR: ${formatAccount(khrAccount)}\nUSD: ${formatAccount(usdAccount)}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aba-accounts.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col bg-[#003d5b] overflow-hidden"
      style={{ maxWidth: '430px', margin: '0 auto' }}
    >
      {/* Close button */}
      <header className="flex justify-end p-4 flex-shrink-0">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Main scrollable content */}
      <div className="flex-1 flex flex-col items-center px-6 pt-2 pb-6 overflow-y-auto no-scrollbar">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="w-20 h-20 bg-[#65c400] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/25"
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>

        {/* Welcome text */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium text-white/80 mb-1">Welcome to ABA,</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{userName}!</h1>
        </div>

        {/* Account card */}
        <div className="w-full bg-[#ced7db] rounded-2xl p-5 mb-8 shadow-lg">
          {/* KHR row */}
          <div className="pb-4 border-b border-gray-400/30">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Your KHR account:
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-gray-800 tracking-wide font-mono">
                {formatAccount(khrAccount)}
              </p>
              <button className="flex-shrink-0 bg-[#b5c7ce]/60 hover:bg-[#b5c7ce]/80 text-[#003d5b] text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors">
                Deposit Money Now
                <span className="text-[10px]">&rsaquo;</span>
              </button>
            </div>
          </div>

          {/* USD row */}
          <div className="pt-4 pb-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Your USD account:
            </p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-bold text-gray-800 tracking-wide font-mono">
                {formatAccount(usdAccount)}
              </p>
              <button className="flex-shrink-0 bg-[#b5c7ce]/60 hover:bg-[#b5c7ce]/80 text-[#003d5b] text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors">
                Deposit Money Now
                <span className="text-[10px]">&rsaquo;</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
            Please save your ABA account numbers for your future reference.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-2 text-[#88d1f9] hover:text-white transition-colors group mb-4"
        >
          <div className="w-12 h-12 rounded-full border border-[#88d1f9]/40 flex items-center justify-center group-hover:bg-white/10 group-hover:border-[#88d1f9] transition-all">
            <Download className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold">Save</span>
        </button>
      </div>

      {/* Bottom sticky CTA */}
      <div className="px-6 pb-8 pt-3 bg-[#003d5b]/95 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onStartBanking}
          className="w-full bg-[#eb4646] hover:bg-[#d63f40] active:scale-[0.98] text-white font-extrabold py-4 rounded-xl shadow-lg shadow-red-950/30 transition-all tracking-wider text-sm"
        >
          START BANKING
        </button>
        <div className="w-1/3 h-1 bg-white/20 rounded-full mx-auto mt-5" />
      </div>
    </motion.div>
  );
}
