import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, KeyRound, MonitorSmartphone, MapPin, Search } from 'lucide-react';

interface ECashHubProps {
  onBack: () => void;
}

export default function ECashHub({ onBack }: ECashHubProps) {
  const [amount, setAmount] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 z-50 bg-[#f4f6f8] flex flex-col font-sans overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top,40px)] sticky top-0 bg-[#005c7a] z-20 shadow-md">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-all text-white">
          <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <h1 className="text-[18px] font-bold tracking-wide text-white absolute left-1/2 -translate-x-1/2">
          E-cash
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Top Header Background Extension */}
        <div className="bg-[#005c7a] px-4 pt-6 pb-16 rounded-b-[24px] shadow-sm relative">
           <p className="text-white/90 text-center font-medium text-[14px]">
             Withdraw cash without an ATM card at any ABA ATM.
           </p>
        </div>

        <div className="px-4 -mt-8 space-y-6">
          {/* Main Card */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
             <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-[#e6f7f9] flex items-center justify-center text-[#00bcd4]">
                    <MonitorSmartphone className="w-5 h-5" />
                 </div>
                 <div>
                    <h2 className="text-[15px] font-bold text-gray-800">Generate E-cash Code</h2>
                    <p className="text-[12px] text-gray-500">Valid for 30 minutes</p>
                 </div>
             </div>

             <div className="mb-6">
                <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-2 block">Amount to withdraw</label>
                <div className="flex items-center border-b-2 border-gray-200 focus-within:border-[#00bcd4] transition-colors pb-2">
                   <span className="text-[20px] font-bold text-gray-800 mr-2">$</span>
                   <input 
                     type="number" 
                     value={amount}
                     onChange={(e) => setAmount(e.target.value)}
                     placeholder="0.00"
                     className="w-full bg-transparent text-[24px] font-bold text-gray-800 outline-none placeholder:text-gray-300"
                   />
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Multiples of $10 or 10,000 KHR</p>
             </div>

             <button className="w-full bg-gradient-to-r from-[#005c7a] to-[#00bcd4] text-white py-3.5 rounded-xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
                 <KeyRound className="w-5 h-5" />
                 Get Code
             </button>
          </section>

          {/* ATM Locator */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#f4f6f8] flex items-center justify-center text-gray-500">
                    <MapPin className="w-5 h-5" />
                 </div>
                 <h3 className="text-[14px] font-bold text-gray-800">Find nearest ATM</h3>
             </div>
             <button className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                 <Search className="w-4 h-4 text-gray-500" />
             </button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
