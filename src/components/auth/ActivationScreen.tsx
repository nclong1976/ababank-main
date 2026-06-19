import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface ActivationScreenProps {
  onBack: () => void;
  onActivate: () => void;
  onOpenAccount: () => void;
}

export default function ActivationScreen({ onBack, onActivate, onOpenAccount }: ActivationScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-100%' }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#004d66] to-[#011a24] flex flex-col font-sans px-4 pb-8"
    >
       <header className="pt-12 pb-4">
         <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white">
           <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
         </button>
       </header>

       <div className="flex-1 flex items-center justify-center -mt-20">
          <div className="text-[32px] font-medium text-white tracking-wide flex items-center gap-1.5">
             <span className="font-bold tracking-widest text-[#f5f5f5]">ABA</span>
             <span className="text-[#f15e5b] -ml-1 text-[28px] leading-none mb-4">'</span>
             <span className="font-normal text-[#f5f5f5]">Mobile</span>
          </div>
       </div>

       <div className="flex flex-col gap-6 w-[92%] max-w-sm mx-auto mb-10">
          <button 
             onClick={onActivate}
             className="w-full bg-[#da4748] text-white p-5 rounded-[12px] flex items-center justify-between active:scale-[0.98] transition-all shadow-xl shadow-red-900/10 text-left"
          >
             <div className="flex items-center gap-4">
                <div className="w-[22px] h-[36px] border-[2px] border-white rounded-[6px] flex flex-col justify-end items-center pb-1">
                   <div className="w-[3px] h-[3px] rounded-full bg-white"></div>
                </div>
                <div className="flex flex-col">
                   <span className="font-bold text-[16px] tracking-wide mb-0.5">Activate ABA Mobile</span>
                   <span className="text-[12.5px] text-white/90 font-medium">For existing ABA account holders</span>
                </div>
             </div>
             <ChevronLeft className="w-5 h-5 opacity-80 rotate-180" />
          </button>
          
          <div className="relative flex items-center justify-center -my-1">
             <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
             </div>
             <span className="relative bg-[#002b3a] px-3 text-[#799baf] text-[13px]">Don't have ABA account yet?</span>
          </div>

          <button 
             onClick={onOpenAccount}
             className="w-full bg-transparent border border-white/20 text-white p-5 rounded-[12px] flex items-center justify-between active:bg-white/5 transition-colors text-left"
          >
             <div className="flex items-center gap-4">
                <div className="w-7 h-5 border-[2px] border-white rounded-[4px] relative flex justify-end items-center pr-1">
                    <div className="absolute -top-[2px] left-[4px] w-3 border-t-[2px] border-white"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                </div>
                <div className="flex flex-col">
                   <span className="font-bold text-[16px] tracking-wide mb-0.5 text-white">Open ABA Instant Account</span>
                   <span className="text-[12.5px] text-[#799baf] font-medium leading-tight">Open your first ABA account in a few minutes</span>
                </div>
             </div>
             <ChevronLeft className="w-5 h-5 opacity-80 rotate-180" />
          </button>
       </div>
    </motion.div>
  )
}
