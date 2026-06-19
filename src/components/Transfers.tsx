import React, { useState, useEffect } from 'react';
import { ChevronLeft, QrCode, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StatusBar from './StatusBar';

interface TransfersProps {
  onBack: () => void;
  onScanQR: () => void;
  onShowReceipt?: () => void;
  currentUserId: string;
}

export default function Transfers({ onBack, onScanQR, onShowReceipt, currentUserId }: TransfersProps) {
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('biometric_enabled') === 'true') {
       setIsBiometricEnabled(true);
    }
  }, []);

  const handleSend = () => {
    if (isBiometricEnabled) {
       setShowBiometricPrompt(true);
    } else {
       if (onShowReceipt) onShowReceipt();
    }
  };

  const handleBiometricAuth = async () => {
    setShowBiometricPrompt(false);
    
    try {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'BIOMETRIC_AUTH_REQUEST' }));
        await new Promise(r => setTimeout(r, 1000));
      } else if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            rpId: window.location.hostname,
            userVerification: "preferred",
            timeout: 60000
          }
        });
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (onShowReceipt) onShowReceipt();
    } catch (err) {
      console.error('Biometric error:', err);
      alert('Biometric verification failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
                  className="absolute inset-0 z-50 bg-[#005977] flex flex-col font-sans"
    >
      <AnimatePresence>
        {showBiometricPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#003855]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-black p-8 rounded-[2rem] flex flex-col items-center shadow-2xl max-w-[85vw] w-full max-w-sm"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Fingerprint className="w-8 h-8 text-[#00bcd4]" />
              </div>
              <h2 className="text-xl font-bold mb-2 tracking-tight text-[#003855]">Biometric Transfer</h2>
              <p className="text-gray-500 font-medium text-sm text-center max-w-[200px] mb-8">
                Confirm your face or fingerprint to authorize payment
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowBiometricPrompt(false)}
                  className="flex-1 py-3.5 bg-gray-100 rounded-xl font-bold text-gray-600 text-sm active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBiometricAuth}
                  className="flex-1 py-3.5 bg-[#00bcd4] rounded-xl font-bold text-white text-sm active:bg-[#009aba] transition-colors"
                >
                  Scan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <StatusBar className="bg-[#005977]" />

      <header className="flex items-center p-4 pt-2 text-white relative">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors z-10">
          <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <h1 className="text-[19px] font-medium tracking-wide flex-1 text-center absolute inset-x-0 bottom-4 flex items-center justify-center font-sans">
           Transfer ABA
        </h1>
      </header>

      {/* Top Section */}
      <div className="flex flex-col items-center pt-6 pb-10">
        <div className="w-[100px] h-[100px] bg-[#22a87a] rounded-full flex items-center justify-center mb-4 shadow-lg">
          <div className="w-[60px] h-[34px] bg-white rounded flex items-center pr-1 pl-0.5 justify-between">
             <div className="text-[#22a87a] font-bold text-[24px] tracking-tighter italic leading-none ml-1">E</div>
             <div className="text-[#22a87a] font-bold text-[14px] leading-none italic uppercase tracking-tight">CASH</div>
          </div>
        </div>
        <h2 className="text-white text-[22px] font-medium font-sans">Cash to ATM</h2>
      </div>

      {/* Bottom Section */}
      <div className="flex-1 bg-white w-full rounded-t-snug overflow-hidden flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto">
             <h3 className="text-slate-800 text-[17px] font-medium mb-4 font-sans">Select withdrawal option</h3>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.button 
                  onClick={onScanQR}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-[8px] p-4 flex items-center justify-center gap-3 active:bg-slate-50 transition-colors shadow-sm"
                >
                   <QrCode className="w-6 h-6 text-[#005977]" strokeWidth={1.5} />
                   <span className="text-slate-800 font-medium text-[15px] font-sans">Scan QR</span>
                </motion.button>

                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="bg-white border border-slate-200 rounded-[8px] p-4 flex items-center justify-center gap-3 active:bg-slate-50 transition-colors shadow-sm"
                >
                   <div className="relative">
                      {/* Phone Outline */}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-7 text-[#005977]">
                         <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                         <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                      {/* PIN asterisks overlay */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-[40%] -translate-y-1/2 bg-white px-0.5 rounded-sm shadow-sm border border-slate-100">
                         <span className="text-[9px] tracking-widest text-[#005977] font-bold">***</span>
                      </div>
                   </div>
                   <span className="text-slate-800 font-medium text-[15px] font-sans">Cash to ATM</span>
                </motion.button>
             </div>

             <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white border border-slate-200 rounded-[8px] p-4 flex items-center gap-4 active:bg-slate-50 transition-colors shadow-sm"
             >
                <div className="flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-slate-800">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
                  </svg>
                </div>
                <span className="text-slate-800 font-medium text-[16px] font-sans">Choose your account</span>
             </motion.button>
          </div>

          <div className="p-5 pb-[40px]">
             <motion.button 
                onClick={handleSend}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#f1404b] text-white py-[16px] rounded-[8px] text-[18px] font-bold shadow-md active:scale-[0.98] transition-transform tracking-wide font-sans"
             >
                Send
             </motion.button>
          </div>
      </div>
      
      {/* OS Navigation Indicator */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-400 rounded-full z-20" />
    </motion.div>
  );
}
