import React from 'react';
import { motion } from 'motion/react';

interface LanguageScreenProps {
  onSelectLanguage: (lang: string) => void;
}

export default function LanguageScreen({ onSelectLanguage }: LanguageScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#004d66] to-[#011a24] flex flex-col font-sans px-6 pb-12"
    >
       <div className="flex-1 flex items-center justify-center">
          <div className="text-[32px] font-medium text-white tracking-wide flex items-center gap-1.5">
             <span className="font-bold tracking-widest text-[#f5f5f5]">ABA</span>
             <span className="text-[#f15e5b] -ml-1 text-[28px] leading-none mb-4">'</span>
             <span className="font-normal text-[#f5f5f5]">Mobile</span>
          </div>
       </div>
       <div className="flex flex-col gap-4 w-[85%] max-w-sm mx-auto mb-10">
          <button 
             onClick={() => onSelectLanguage('km')}
             className="w-full bg-[#da4748] text-white py-[14px] rounded-[10px] text-[15px] font-medium active:bg-[#c43f40] transition-colors shadow-lg"
          >
             ភាសាខ្មែរ
          </button>
          <button 
             onClick={() => onSelectLanguage('en')}
             className="w-full bg-[#da4748] text-white py-[14px] rounded-[10px] text-[15px] font-bold active:bg-[#c43f40] transition-colors uppercase shadow-lg tracking-wider"
          >
             ENGLISH
          </button>
          <button 
             onClick={() => onSelectLanguage('zh')}
             className="w-full bg-[#da4748] text-white py-[14px] rounded-[10px] text-[15px] font-medium active:bg-[#c43f40] transition-colors shadow-lg tracking-widest"
          >
             中文
          </button>
       </div>
    </motion.div>
  )
}
