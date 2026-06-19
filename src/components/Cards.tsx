import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Plus } from 'lucide-react';

interface CardsProps {
  onBack: () => void;
}

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const VisaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-4 text-[#1a1f71]" fill="currentColor">
    <path d="M10.1 16.1l1.5-8.8h2.3l-1.5 8.8h-2.3zM18.7 7.4c-.5-.2-1.3-.4-2.2-.4-2.4 0-4.1 1.2-4.1 3.1 0 1.3 1.2 2 2.1 2.5.9.4 1.2.7 1.2 1.1 0 .6-.7.9-1.4.9-1.1 0-1.7-.2-2.7-.6l-.4-.2-.4 2.3c.7.3 1.9.6 3.1.6 2.6 0 4.2-1.2 4.3-3.2 0-1.1-.7-1.9-2.1-2.6-.9-.4-1.4-.7-1.4-1.2 0-.4.5-.8 1.4-.8.7 0 1.3.1 1.8.4l.2.1.4-2.4zM23.1 7.3h-1.8c-.5 0-.9.3-1.1.8l-3.3 7.9h2.4l.5-1.3h2.9l.3 1.3h2.1l-2-8.7zm-2.8 5l1-2.7.5 2.7h-1.5zM7.2 7.3L5 13.3l-.2-1.1c-.4-1.4-1.6-3-3-4L4.1 16h2.4l3.6-8.7H7.2z" />
  </svg>
);

const MastercardLogo = () => (
  <div className="flex -space-x-2">
    <div className="w-4 h-4 rounded-full bg-[#eb001b] opacity-80" />
    <div className="w-4 h-4 rounded-full bg-[#f79e1b] opacity-80" />
  </div>
);

const UnionPayLogo = () => (
  <div className="flex bg-[#008298] px-1 py-0.5 rounded-sm">
    <span className="text-[6px] text-white font-bold italic leading-none">UnionPay</span>
  </div>
);

export default function Cards({ onBack }: CardsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 z-50 bg-[#f8f9fa] flex flex-col font-sans"
    >
      {/* Teal Top Section */}
      <div className="bg-[#005c6a] pt-10 pb-12 px-4 flex flex-col items-center">
        <div className="w-full flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-white mr-8 font-sans">ABA Cards</h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/5">
              <CreditCardIcon className="w-10 h-10 text-white/90" />
              <div className="absolute bottom-4 right-4 bg-white rounded-full p-0.5">
                <Plus className="w-3 h-3 text-[#005c6a]" strokeWidth={4} />
              </div>
            </div>
          </div>
          <span className="text-white font-bold text-lg font-sans">New Card</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Debit Card Block */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
        >
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-[#e91e63]/10 flex items-center justify-center shrink-0">
               <div className="w-10 h-10 rounded-full bg-[#f06292] flex items-center justify-center border-2 border-white shadow-sm">
                  <CreditCardIcon className="w-6 h-6 text-white" />
               </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-[#003b4d] font-sans">Debit Card</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-sans">
                Order an ABA debit card easily and choose delivery, pickup at branch or via card machine.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <VisaLogo />
            <MastercardLogo />
            <UnionPayLogo />
            <div className="bg-[#5c6bc0] px-1.5 py-0.5 rounded-sm">
              <span className="text-[8px] text-white font-bold italic leading-none">CSS</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <button className="text-sm font-bold text-gray-400 font-sans">Order Branded Cards</button>
            <button className="text-[#0081a7] font-bold flex items-center gap-1 font-sans">
              Order Plastic Card <ChevronRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </motion.div>

        {/* Virtual Card Block */}
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
        >
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-[#00bcd4]/10 flex items-center justify-center shrink-0">
               <div className="w-10 h-10 rounded-full bg-[#00bcd4] flex items-center justify-center border-2 border-white shadow-sm">
                  <CreditCardIcon className="w-6 h-6 text-white" />
               </div>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-[#003b4d] font-sans">Virtual Debit Card</h2>
              <p className="text-sm text-gray-500 leading-relaxed font-sans">
                Create a virtual Visa, Mastercard or UnionPay International card instantly for free and start paying in-store and online.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <VisaLogo />
            <MastercardLogo />
            <UnionPayLogo />
          </div>

          <div className="flex justify-end pt-2 border-t border-gray-50">
            <button className="text-[#0081a7] font-bold flex items-center gap-1 font-sans">
              Create Virtual Card <ChevronRight className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
