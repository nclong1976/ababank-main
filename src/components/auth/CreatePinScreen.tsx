import React, { useState } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface CreatePinScreenProps {
  onBack: () => void;
  onNext: (pin: string) => void;
  language?: 'km' | 'en' | 'zh'; // Made optional to not break existing calls
  userId: string; // Add userId prop
}

export default function CreatePinScreen({ onBack, onNext, language = 'km', userId }: CreatePinScreenProps) {
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom numeric pad handler to maintain the circle input UI
  const handleKeypad = (num: string) => {
     if (pin.length < 4) {
        setPin(prev => prev + num);
     }
  };

  const handleDelete = () => {
     setPin(prev => prev.slice(0, -1));
  };
  
  const strings = {
     km: {
        title: 'គណនី ABA ភ្លាមៗ',
        subtitle: 'បង្កើតលេខកូដសម្ងាត់សុវត្ថិភាព',
        description: 'លេខកូដសម្ងាត់នេះនឹងត្រូវបានទាមទាររាល់ពេលដែល អ្នកចូលទៅកាន់ ABA Mobile ។',
        pinLabel: 'លេខកូដសម្ងាត់ ៤ ខ្ទង់',
        nextBtn: 'បន្ទាប់',
     },
     en: {
        title: 'ABA Instant Account',
        subtitle: 'Create Security PIN',
        description: 'This PIN will be required every time you log in to ABA Mobile.',
        pinLabel: 'Create 4-digit PIN',
        nextBtn: 'NEXT',
     },
     zh: {
        title: 'ABA  즉시 계정',
        subtitle: '보안 PIN 생성',
        description: '이 PIN은 ABA Mobile에 로그인할 때마다 필요합니다.',
        pinLabel: '4자리 PIN 생성',
        nextBtn: '다음',
     }
  };
  
  const t = strings[language as keyof typeof strings] || strings.km;

  const handleNext = async () => {
    if (pin.length !== 4) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/auth/setup-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pin }),
      });
      
      const data = await response.json();
      if (data.ok) {
        onNext(pin);
      } else {
        alert(data.error || 'Failed to set PIN');
      }
    } catch (error) {
      console.error(error);
      alert('Network error, please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '-100%' }}
      className="fixed inset-0 z-50 bg-[#003B4D] flex flex-col font-sans"
    >
       <header className="flex items-center p-4 pt-12 text-white relative">
         <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors z-10">
           <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
         </button>
         <h1 className="text-[20px] font-medium tracking-wide flex-1 text-center absolute inset-0 flex items-center justify-center pt-12 font-khmer">
           {t.title}
         </h1>
       </header>

       <div className="flex-1 flex flex-col items-center px-6 pt-10 relative z-10">
          <div className="w-[90px] h-[90px] bg-white/10 rounded-full flex flex-col items-center justify-center mb-8 shadow-sm relative overflow-hidden backdrop-blur-sm">
             <Lock className="w-7 h-7 text-white mb-2" strokeWidth={2} />
             <div className="flex gap-1 absolute bottom-[22px]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-white rounded-full"></div>
                ))}
             </div>
          </div>

          <h2 className="text-white text-[22px] font-medium mb-4 font-khmer">{t.subtitle}</h2>
          <p className="text-center text-[#A0C4C4] text-[15px] leading-relaxed mb-16 px-4 font-khmer max-w-[300px]">
             {t.description}
          </p>

          <div className="w-full flex flex-col gap-6 max-w-[320px] relative">
             <div className="flex flex-col gap-4 relative">
                <label className="text-white text-[15px] font-khmer font-medium">{t.pinLabel}</label>
                
                {/* Pin Circles Display */}
                <div className="flex items-center gap-[12px] mb-2 px-1 relative z-10 w-full" onClick={() => {
                   // This wrapper can intercept clicks to ensure the keypad is used
                }}>
                   {[...Array(4)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-[1.5px] ${i < pin.length ? 'bg-white border-white scale-110' : 'bg-transparent border-white/60'} transition-all duration-200`}
                      />
                   ))}
                   <div className="flex-1"></div>
                   <div className="w-6 h-6 rounded-full border border-white/60 flex items-center justify-center text-white/80 opacity-80 mb-1 pointer-events-none">
                      <span className="text-[12px] italic select-none">i</span>
                   </div>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40"></div>
             </div>
          </div>
       </div>
       
       {/* Custom Numpad */}
       <div className="w-full px-4 pb-4">
          <div className="w-full max-w-[320px] mx-auto grid grid-cols-3 gap-y-4 gap-x-6 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleKeypad(num.toString())}
                className="h-14 flex items-center justify-center text-[28px] font-normal text-white hover:bg-white/10 rounded-full transition-colors active:bg-white/20 select-none"
              >
                {num}
              </button>
            ))}
            <div />
            <button 
              onClick={() => handleKeypad('0')}
              className="h-14 flex items-center justify-center text-[28px] font-normal text-white hover:bg-white/10 rounded-full transition-colors active:bg-white/20 select-none"
            >
              0
            </button>
            <button 
              onClick={handleDelete}
              className="h-14 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors active:bg-white/20 select-none"
            >
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[28px] h-[28px]">
                 <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                 <line x1="18" y1="9" x2="12" y2="15" />
                 <line x1="12" y1="9" x2="18" y2="15" />
               </svg>
            </button>
          </div>
       
          <div className="w-full max-w-[320px] mx-auto pb-4">
             <button 
                onClick={handleNext}
                disabled={isProcessing}
                className={`w-full py-[16px] rounded-[10px] text-[18px] font-khmer font-bold shadow-md transition-all tracking-wide ${
                  pin.length === 4 
                  ? 'bg-[#FF3B30] text-white active:scale-[0.98]' 
                  : 'bg-[#FF3B30] text-white opacity-90'
                }`}
             >
                {isProcessing ? '...' : t.nextBtn}
             </button>
          </div>
       </div>
    </motion.div>
  )
}
