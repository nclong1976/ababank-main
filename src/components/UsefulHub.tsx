import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, FileText, Calculator, Landmark, ShieldAlert, BadgePercent, GraduationCap, Link2, MapPin } from 'lucide-react';

interface UsefulHubProps {
  onBack: () => void;
}

const ITEMS = [
  { icon: FileText, label: 'Templates', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Landmark, label: 'Exchange Rates', color: 'text-green-500', bg: 'bg-green-50' },
  { icon: Calculator, label: 'Loans Calculator', color: 'text-orange-500', bg: 'bg-orange-50' },
  { icon: MapPin, label: 'Branch & ATM', color: 'text-red-500', bg: 'bg-red-50' },
  { icon: ShieldAlert, label: 'Security Tips', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: BadgePercent, label: 'Promotions', color: 'text-pink-500', bg: 'bg-pink-50' },
  { icon: GraduationCap, label: 'ABA Tutorials', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { icon: Link2, label: 'Quick Links', color: 'text-cyan-500', bg: 'bg-cyan-50' },
];

export default function UsefulHub({ onBack }: UsefulHubProps) {
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
          Useful Services
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Top Header Background Extension */}
        <div className="bg-[#005c7a] px-4 pt-4 pb-12 rounded-b-[24px] shadow-sm" />

        <div className="px-4 -mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
             {ITEMS.map((item, idx) => (
                 <motion.button
                    key={idx}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center gap-3 active:bg-gray-50 transition-colors"
                 >
                    <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                       <item.icon className={`w-6 h-6 ${item.color}`} strokeWidth={2} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-800 text-center leading-tight">
                       {item.label}
                    </span>
                 </motion.button>
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
