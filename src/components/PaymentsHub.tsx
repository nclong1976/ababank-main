import React from 'react';
import { 
  ChevronLeft, 
  Search, 
  Smartphone, 
  Zap, 
  Wifi, 
  GraduationCap, 
  Heart, 
  ShieldCheck, 
  Home, 
  Play, 
  CreditCard, 
  Building2, 
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'motion/react';
import edcLogo from '../assets/images/regenerated_image_1781076270907.png';
import ppwsaLogo from '../assets/images/regenerated_image_1781076349758.png';
import nssfLogo from '../assets/images/regenerated_image_1781076351185.png';
import metfoneLogo from '../assets/images/regenerated_image_1781076471454.png';
import smartLogo from '../assets/images/regenerated_image_1781076472059.png';

interface PaymentsHubProps {
  onBack: () => void;
  userId: string;
}

const CATEGORIES = [
  { id: 'mobile', icon: Smartphone, label: 'Mobile Top-up' },
  { id: 'utilities', icon: Zap, label: 'Utilities' },
  { id: 'internet', icon: Wifi, label: 'Internet & TV' },
  { id: 'education', icon: GraduationCap, label: 'Education' },
  { id: 'finance', icon: CreditCard, label: 'Finance & Insurance' },
  { id: 'public-service', icon: Building2, label: 'Public Services' },
  { id: 'real-estate', icon: Home, label: 'Real Estate' },
  { id: 'entertainment', icon: Play, label: 'Entertainment' },
  { id: 'charity', icon: Heart, label: 'Charity' },
];

const BILLERS = [
  { name: 'EDC', logo: edcLogo },
  { name: 'PPWSA', logo: ppwsaLogo },
  { name: 'NSSF', logo: nssfLogo },
  { name: 'Metfone', logo: metfoneLogo },
  { name: 'Smart', logo: smartLogo },
];

export default function PaymentsHub({ onBack, userId }: PaymentsHubProps) {
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
          Payments
        </h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom,20px)]">
        
        {/* Top Header Background Extension */}
        <div className="bg-[#005c7a] px-4 pt-4 pb-12 rounded-b-[24px] shadow-sm relative">
           {/* Search Bar */}
           <div className="relative group">
              <div className="relative flex items-center bg-white rounded-xl p-1 shadow-md">
                <div className="pl-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search biller..."
                  className="w-full bg-transparent py-3 pl-3 pr-4 text-[14px] font-medium text-gray-800 outline-none placeholder:text-gray-400"
                />
              </div>
           </div>
        </div>

        <div className="px-4 -mt-6 space-y-6">
          
          {/* Recent Billers */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">Recent Payments</h2>
               <button className="text-[12px] font-bold text-[#00bcd4]">See All</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
              {BILLERS.map((biller, idx) => (
                <motion.button 
                  key={idx} 
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden p-2 shadow-sm relative">
                    <img src={biller.logo} alt={biller.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium tracking-tight w-16 text-center truncate">{biller.name}</span>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Categories Grid */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
               <h2 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">All Categories</h2>
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-6">
              {CATEGORIES.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#e6f7f9] flex items-center justify-center mb-1">
                    <cat.icon className="text-[#00bcd4] w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight tracking-tight px-1">
                    {cat.label}
                  </span>
                </motion.button>
              ))}
              <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2"
              >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                    <MoreHorizontal className="text-gray-500 w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 text-center leading-tight tracking-tight px-1">
                    More
                  </span>
              </motion.button>
            </div>
          </section>

          {/* Bottom Ad / Quick Action */}
          <section className="pb-8">
             <motion.button 
               whileTap={{ scale: 0.98 }}
               className="w-full bg-gradient-to-r from-[#005c7a] to-[#00bcd4] p-5 rounded-2xl relative overflow-hidden shadow-md flex items-center gap-4 text-left"
             >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                   <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1">
                   <h3 className="text-[15px] font-bold text-white mb-0.5">ABA KHQR Pay</h3>
                   <p className="text-[11px] text-white/80 font-medium">Scan any KHQR to pay instantly.</p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white">
                   <ChevronRight className="w-5 h-5" />
                </div>
             </motion.button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

