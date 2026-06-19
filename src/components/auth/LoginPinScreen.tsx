import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, ChevronLeft, Lock } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';
import StatusBar from '../StatusBar';
import AccountCreationSuccess from './AccountCreationSuccess';

interface LoginPinScreenProps {
  onSuccess: (user: any) => void;
  userName: string;
}

export default function LoginPinScreen({ onSuccess, userName }: LoginPinScreenProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [authMode, setAuthMode] = useState<'welcome' | 'pin' | 'registerPhone' | 'registerPin' | 'loginPhone' | 'loginPinMode' | 'registerSuccess'>(() => {
    const savedPhone = localStorage.getItem('savedUserPhone');
    // Always require both phone + PIN - go to loginPhone screen
    // Pre-fill with saved phone if available
    return savedPhone ? 'loginPhone' : 'welcome';
  });
  
  // Registration and Login states
  const [phoneInput, setPhoneInput] = useState(() => localStorage.getItem('savedUserPhone') || '');
  const [createdUserAccounts, setCreatedUserAccounts] = useState<{ name: string; KHR: string; USD: string } | null>(null);
  const [tempUser, setTempUser] = useState<any>(null);

  useEffect(() => {
    // Check if biometric is enabled for this user device
    const biometricSaved = localStorage.getItem('biometric_enabled');
    if (biometricSaved === 'true') {
      setIsBiometricEnabled(true);
      // Auto prompt on load if it's enabled
      setTimeout(() => setShowBiometricPrompt(true), 500);
    }
  }, []);

  const logSecurityActivity = (action: string, status: 'success' | 'failed') => {
    try {
      const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
      logs.unshift({
        id: Date.now().toString(),
        action,
        status,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('security_logs', JSON.stringify(logs.slice(0, 50)));
    } catch (err) {}
  };

  const handleBiometricAuth = async () => {
    setIsProcessing(true);
    setShowBiometricPrompt(false);
    
    try {
      const phone = localStorage.getItem('savedUserPhone');
      if (!phone) {
        throw new Error("Please login with Phone & PIN first.");
      }

      if ((window as any).ReactNativeWebView) {
        // Native app bridge fallback
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'BIOMETRIC_AUTH_REQUEST' }));
        await new Promise(r => setTimeout(r, 1000));
        
        const res = await fetch('/api/auth/biometric', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName })
        });
        const data = await res.json();
        if (data.ok) {
          logSecurityActivity('Biometric Login', 'success');
          onSuccess(data.user);
        } else {
          throw new Error("Biometric auth failed");
        }
      } else {
        const resp = await fetch('/api/auth/webauthn/generate-authentication-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || 'Failed to generate options');

        const asseResp = await startAuthentication({ optionsJSON: data.options });

        const verificationResp = await fetch('/api/auth/webauthn/verify-authentication', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            response: asseResp
          }),
        });
        
        const verificationJSON = await verificationResp.json();
        if (verificationJSON.ok && verificationJSON.user) {
          logSecurityActivity('Biometric Login', 'success');
          onSuccess(verificationJSON.user);
        } else {
          throw new Error(verificationJSON.error || "Biometric auth failed");
        }
      }
    } catch (err: any) {
      console.error('Biometric error:', err);
      logSecurityActivity('Biometric Login', 'failed');
      setIsError(true);
      setErrorMessage(err.message || 'Biometric verification failed');
      setPin('');
      setIsProcessing(false);
    }
  };

  const handleRegister = async (phone: string, pinCode: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/auth/register-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: pinCode })
      });
      const data = await res.json();
      if (data.ok) {
        setCreatedUserAccounts({
          name: data.user.name,
          USD: data.accounts.USD,
          KHR: data.accounts.KHR
        });
        setTempUser(data.user);
        setAuthMode('registerSuccess');
      } else {
        setErrorMessage(data.error || 'Registration failed');
        setIsError(true);
        setPin('');
        setConfirmPin('');
      }
    } catch (err) {
      setErrorMessage('Server error');
      setIsError(true);
      setPin('');
      setConfirmPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginPhone = async (phone: string, pinCode: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/auth/login-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: pinCode })
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess(data.user);
      } else {
        setErrorMessage(data.error || 'Invalid credential');
        setIsError(true);
        setPin('');
      }
    } catch (err) {
      setErrorMessage('Server error');
      setIsError(true);
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginPin = async (p: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p, name: userName })
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess(data.user);
      } else {
        setIsError(true);
        setErrorMessage('Invalid PIN');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setErrorMessage('Server error');
      setPin('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (isProcessing) return;
    
    if (key === 'biometric') {
      setShowBiometricPrompt(true);
      return;
    }

    if (key === 'back') {
      setPin(prev => prev.slice(0, -1));
      setIsError(false);
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      
      if (newPin.length === 4) {
        if (authMode === 'registerPin') {
           handleRegister(phoneInput, newPin);
        } else if (authMode === 'loginPinMode') {
           handleLoginPhone(phoneInput, newPin);
        } else {
           handleLoginPin(newPin);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#003B4D] flex flex-col items-center px-0 pt-0 pb-6 font-sans text-white relative w-full overflow-hidden">
      <StatusBar className="bg-transparent" />
      <div className="w-full max-w-sm px-6 flex flex-col items-center flex-1">
        
        <AnimatePresence>
          {showBiometricPrompt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-[#003855]/90 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white text-black p-8 rounded-[2rem] flex flex-col items-center shadow-2xl max-w-[85vw] w-full max-w-sm"
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Fingerprint className="w-8 h-8 text-[#00bcd4]" />
                </div>
                <h2 className="text-xl font-bold mb-2 tracking-tight text-[#003855]">Biometric Login</h2>
                <p className="text-gray-500 font-medium text-sm text-center max-w-[200px] mb-8">
                  Confirm your face or fingerprint to continue
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

        {/* 1. WELCOME SCREEN */}
        {authMode === 'welcome' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="pt-12 pb-4 flex justify-between items-center w-full">
              {localStorage.getItem('savedUserPhone') ? (
                <button 
                  onClick={() => setAuthMode('pin')} 
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
                >
                  <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="w-8 h-8" />
              )}
              
              <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
                <span className="text-white opacity-50">EN</span>
                <span className="w-px h-3 bg-white/30" />
                <span className="text-white">KH</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center -mt-10 select-none">
              <div className="text-[34px] tracking-wide flex items-center font-medium">
                <span className="font-extrabold text-[#f5f5f5] tracking-widest">ABA</span>
                <span className="text-[#e24a4b] font-bold text-[32px] mx-[2px] mb-4">'</span>
                <span className="font-normal text-[#f5f5f5]">Mobile</span>
              </div>
            </div>

            <div className="flex flex-col gap-5 w-full mb-10">
              <button 
                onClick={() => {
                  setErrorMessage('');
                  setPhoneInput('');
                  setAuthMode('loginPhone');
                }}
                className="w-full bg-[#e24a4b] hover:bg-[#d63f40] text-white p-4.5 rounded-[16px] flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-red-950/20 text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-[24px] h-[38px] border-[2px] border-white rounded-[7px] flex flex-col justify-between items-center py-[4px] px-[3px]">
                    <div className="w-[8px] h-[1.5px] bg-white rounded-full"></div>
                    <div className="w-[4px] h-[4px] bg-white rounded-full"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[16px] tracking-wide">Activate ABA Mobile</span>
                    <span className="text-[12px] text-white/80 font-medium">For existing ABA account holders</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 opacity-80 rotate-180" />
              </button>
              
              <div className="relative flex items-center justify-center my-2 select-none">
                <div className="w-full border-t border-white/15"></div>
                <span className="absolute bg-[#003B4D] px-4 text-[#799baf] text-[12.5px] font-medium tracking-wide">Don't have ABA account yet?</span>
              </div>

              <button 
                onClick={() => {
                  setErrorMessage('');
                  setPhoneInput('');
                  setAuthMode('registerPhone');
                }}
                className="w-full bg-[#002836]/60 border border-white/15 text-white p-4.5 rounded-[16px] flex items-center justify-between active:bg-[#002836]/90 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-7 h-5 border-[2px] border-white rounded-[4px] relative flex justify-end items-center pr-1">
                    <div className="absolute -top-[2px] left-[4px] w-3 border-t-[2px] border-white"></div>
                    <div className="w-1.5 h-1.5 bg-[#e24a4b] rounded-xs"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[16px] tracking-wide text-white">Open ABA Instant Account</span>
                    <span className="text-[12px] text-[#799baf] font-medium leading-tight">Open your first ABA account in a few minutes</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 opacity-80 rotate-180 text-white/60" />
              </button>
            </div>
          </div>
        )}

        {/* 2. REGISTRATION PHONE INPUT SCREEN */}
        {authMode === 'registerPhone' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="w-full flex items-center justify-between pt-12 pb-4">
              <button 
                onClick={() => setAuthMode('welcome')} 
                className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
              >
                <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
              </button>
              <div className="text-[18px] font-bold tracking-wide flex items-center justify-center flex-1 mr-8 select-none">
                <span className="font-extrabold text-[#f5f5f5]">ABA</span>
                <span className="text-[#e24a4b] font-bold text-[16px] mx-[1px] mb-2">'</span>
                <span className="font-normal text-[#f5f5f5]">Instant Account</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center px-4 pt-8">
              <div className="w-24 h-24 rounded-full bg-[#1b4e60] flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  <path d="M14.05 2a9 9 0 0 1 8 8" strokeDasharray="2 2"></path>
                  <path d="M18.05 2a5 5 0 0 1 4 4"></path>
                </svg>
              </div>

              <h2 className="text-white text-xl font-bold mb-1 tracking-wide">Enter your Phone Number</h2>
              <p className="text-center text-white/60 text-[13px] leading-relaxed mb-12 px-4 max-w-[290px]">
                The SIM with this phone number must be yours and inside this device.
              </p>

              <div className="grid grid-cols-[80px_1fr] gap-6 w-full max-w-[300px]">
                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 select-none">
                  <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider">Country Code</span>
                  <span className="text-lg font-bold text-white pt-1">+855</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 focus-within:border-[#00bcd4] transition-all">
                  <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider">Phone Number</span>
                  <input
                    type="tel"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="81272733"
                    className="w-full bg-transparent text-lg font-bold text-white outline-none pt-1"
                  />
                </div>
              </div>
            </div>

            <div className="w-full px-4 pb-6 mt-auto">
              <button
                onClick={() => {
                  if (phoneInput.length >= 8) {
                    setAuthMode('registerPin');
                  }
                }}
                disabled={phoneInput.length < 8}
                className={`w-full py-4 rounded-[12px] font-extrabold text-white tracking-wider transition-all select-none ${
                  phoneInput.length >= 8 
                    ? 'bg-[#e24a4b] active:scale-[0.98] cursor-pointer' 
                    : 'bg-[#e24a4b]/50 text-white/50 cursor-not-allowed'
                }`}
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* 3. LOGIN PHONE INPUT SCREEN */}
        {authMode === 'loginPhone' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="w-full flex items-center justify-between pt-12 pb-4">
              <button 
                onClick={() => setAuthMode('welcome')} 
                className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
              >
                <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
              </button>
              <div className="text-[18px] font-bold tracking-wide flex items-center justify-center flex-1 mr-8 select-none">
                <span className="font-extrabold text-[#f5f5f5]">Activate</span>
                <span className="text-[#e24a4b] font-bold text-[16px] mx-[1px] mb-2">'</span>
                <span className="font-normal text-[#f5f5f5]">ABA Mobile</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center px-4 pt-8">
              <div className="w-24 h-24 rounded-full bg-[#1b4e60] flex items-center justify-center mb-6">
                <div className="w-[24px] h-[38px] border-[2px] border-white rounded-[7px] flex flex-col justify-between items-center py-[4px] px-[3px]">
                  <div className="w-[8px] h-[1.5px] bg-white rounded-full"></div>
                  <div className="w-[4px] h-[4px] bg-white rounded-full"></div>
                </div>
              </div>

              <h2 className="text-white text-xl font-bold mb-1 tracking-wide">Enter your Phone Number</h2>
              <p className="text-center text-white/60 text-[13px] leading-relaxed mb-12 px-4 max-w-[290px]">
                Enter the phone number registered with your ABA account.
              </p>

              <div className="grid grid-cols-[80px_1fr] gap-6 w-full max-w-[300px]">
                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 select-none">
                  <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider">Country Code</span>
                  <span className="text-lg font-bold text-white pt-1">+855</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 focus-within:border-[#00bcd4] transition-all">
                  <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider">Phone Number</span>
                  <input
                    type="tel"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="81272733"
                    className="w-full bg-transparent text-lg font-bold text-white outline-none pt-1"
                  />
                </div>
              </div>
            </div>

            <div className="w-full px-4 pb-6 mt-auto">
              <button
                onClick={() => {
                  if (phoneInput.length >= 4) {
                    setAuthMode('loginPinMode');
                  }
                }}
                disabled={phoneInput.length < 4}
                className={`w-full py-4 rounded-[12px] font-extrabold text-white tracking-wider transition-all select-none ${
                  phoneInput.length >= 4 
                    ? 'bg-[#e24a4b] active:scale-[0.98] cursor-pointer' 
                    : 'bg-[#e24a4b]/50 text-white/50 cursor-not-allowed'
                }`}
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* 4. REGISTRATION CREATE SECURITY PIN SCREEN */}
        {authMode === 'registerPin' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="w-full flex items-center justify-between pt-12 pb-4">
              <button 
                onClick={() => setAuthMode('registerPhone')} 
                className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
              >
                <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
              </button>
              <div className="text-[18px] font-bold tracking-wide flex items-center justify-center flex-1 mr-8 select-none">
                <span className="font-extrabold text-[#f5f5f5]">ABA</span>
                <span className="text-[#e24a4b] font-bold text-[16px] mx-[1px] mb-2">'</span>
                <span className="font-normal text-[#f5f5f5]">Instant Account</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center px-4 pt-8">
              <div className="w-24 h-24 rounded-full bg-[#1b4e60] flex flex-col items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-white mb-1" strokeWidth={2} />
                <div className="flex gap-0.5 mt-0.5 select-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-white rounded-full scale-75 opacity-90" />
                  ))}
                </div>
              </div>

              <h2 className="text-white text-xl font-bold mb-1 tracking-wide">Create Security PIN</h2>
              <p className="text-center text-white/60 text-[13px] leading-relaxed mb-10 px-4 max-w-[280px]">
                This PIN will be required every time you log in to ABA Mobile.
              </p>

              <div className="flex flex-col gap-6 w-full max-w-[300px]">
                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 focus-within:border-[#00bcd4] transition-all">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider">Create 4-digit PIN</span>
                    <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-[10px] italic text-white/60">i</div>
                  </div>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-transparent text-xl font-bold text-white outline-none pt-1 text-center tracking-[1em]"
                  />
                </div>

                <div className="flex flex-col gap-1 border-b border-white/30 pb-1.5 focus-within:border-[#00bcd4] transition-all">
                  <span className="text-[10px] text-[#799baf] font-semibold uppercase tracking-wider select-none">Re-enter 4-digit PIN</span>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-transparent text-xl font-bold text-white outline-none pt-1 text-center tracking-[1em]"
                  />
                </div>
              </div>

              {isError && errorMessage && (
                <p className="text-red-300 font-bold text-sm mt-4 text-center">{errorMessage}</p>
              )}
            </div>

            <div className="w-full px-4 pb-6 mt-auto">
              <button
                onClick={() => {
                  if (pin.length === 4 && confirmPin.length === 4 && pin === confirmPin) {
                    handleRegister(phoneInput, pin);
                  } else if (pin !== confirmPin) {
                    setErrorMessage("PINs do not match");
                    setIsError(true);
                  }
                }}
                disabled={pin.length !== 4 || confirmPin.length !== 4 || isProcessing}
                className={`w-full py-4 rounded-[12px] font-extrabold text-white tracking-wider transition-all select-none ${
                  pin.length === 4 && confirmPin.length === 4 && !isProcessing
                    ? 'bg-[#e24a4b] active:scale-[0.98] cursor-pointer' 
                    : 'bg-[#e24a4b]/50 text-white/50 cursor-not-allowed'
                }`}
              >
                {isProcessing ? 'PROCESSING...' : 'NEXT'}
              </button>
            </div>
          </div>
        )}

        {/* 5. QUICK USER PIN LOGIN SCREEN */}
        {authMode === 'pin' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="w-full flex justify-end mb-8 pt-4">
              <div className="bg-white/10 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10 select-none">
                <span className="text-white opacity-50">EN</span>
                <span className="w-px h-3 bg-white/30" />
                <span className="text-white">KH</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mt-4">
              <div 
                className="relative mb-6 flex flex-col items-center group cursor-pointer" 
                onClick={() => { if(isBiometricEnabled) setShowBiometricPrompt(true) }}
              >
                <div className="absolute inset-0 bg-[#00bcd4]/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-28 h-28 rounded-full border-[3px] border-white overflow-hidden shadow-2xl bg-[#003855] mb-6">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=00bcd4&color=fff&size=150`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-2xl font-bold mb-2 font-sans tracking-tight text-center">Hello! {userName}</h1>
                <p className="text-white/60 mb-6 uppercase tracking-widest text-xs font-bold font-sans">ENTER PIN</p>
              </div>

              {/* Dynamic dots for PIN */}
              <div className="flex gap-4 mb-8 h-4 items-center justify-center">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={isError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-white scale-125 shadow-[0_0_12px_rgba(255,255,255,1)] border-transparent' 
                        : 'bg-transparent border-2 border-white/30'
                    } ${isError ? 'border-red-400 bg-red-400 !shadow-[0_0_12px_rgba(248,113,113,0.8)]' : ''}`}
                  />
                ))}
              </div>

              {isError && errorMessage && (
                <p className="text-red-300 font-bold text-sm mb-4 font-sans text-center">{errorMessage}</p>
              )}

              {isProcessing && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full mb-4"
                />
              )}
            </div>

            <div className="w-full max-w-xs grid grid-cols-3 gap-x-6 gap-y-7 mb-8 px-4 mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'back'].map((key, i) => {
                if (key === 'biometric' && (!isBiometricEnabled || authMode !== 'pin')) {
                  return <div key={i} />;
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={key && key !== 'biometric' ? { scale: 0.85, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                    onClick={() => key && handleKeyPress(key)}
                    className="h-[72px] flex items-center justify-center text-[34px] font-medium rounded-full transition-colors font-sans w-[72px] mx-auto select-none"
                  >
                    {key === 'back' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
                        <path d="M21 12H3m0 0l7-7m-7 7l7 7" />
                      </svg>
                    ) : key === 'biometric' ? (
                      <Fingerprint className="w-[34px] h-[34px] text-[#00bcd4] drop-shadow-[0_0_10px_rgba(0,188,212,0.5)]" strokeWidth={1.5} />
                    ) : (
                      key
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-4 mb-6">
              <button className="text-white/60 text-[13px] font-medium tracking-wide hover:text-white transition-colors active:text-white/40">
                Forgot PIN?
              </button>
              
              <button 
                onClick={() => {
                  setErrorMessage('');
                  setPhoneInput('');
                  setAuthMode('welcome');
                }} 
                className="text-[#00bcd4] font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Switch Account / Register
              </button>
            </div>
          </div>
        )}

        {/* 6. LOGIN ENTER PIN SCREEN (EXISTING USER VIA PHONE) */}
        {authMode === 'loginPinMode' && (
          <div className="flex-1 flex flex-col w-full">
            <header className="w-full flex items-center justify-between pt-12 pb-4">
              <button 
                onClick={() => setAuthMode('loginPhone')} 
                className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors text-white"
              >
                <ChevronLeft className="w-8 h-8" strokeWidth={2.5} />
              </button>
              <div className="text-[18px] font-bold tracking-wide flex items-center justify-center flex-1 mr-8 select-none">
                <span className="font-extrabold text-[#f5f5f5]">Activate</span>
                <span className="text-[#e24a4b] font-bold text-[16px] mx-[1px] mb-2">'</span>
                <span className="font-normal text-[#f5f5f5]">ABA Mobile</span>
              </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mt-4">
              <div className="flex flex-col items-center mb-8">
                <h1 className="text-2xl font-bold mb-2 font-sans tracking-tight">Enter PIN</h1>
                <p className="text-white/60 uppercase tracking-widest text-xs font-bold font-sans">For {phoneInput}</p>
              </div>

              {/* Dynamic dots for PIN */}
              <div className="flex gap-4 mb-8 h-4 items-center justify-center">
                {[...Array(4)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={isError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-white scale-125 shadow-[0_0_12px_rgba(255,255,255,1)] border-transparent' 
                        : 'bg-transparent border-2 border-white/30'
                    } ${isError ? 'border-red-400 bg-red-400 !shadow-[0_0_12px_rgba(248,113,113,0.8)]' : ''}`}
                  />
                ))}
              </div>

              {isError && errorMessage && (
                <p className="text-red-300 font-bold text-sm mb-4 font-sans text-center">{errorMessage}</p>
              )}

              {isProcessing && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full mb-4"
                />
              )}
            </div>

            <div className="w-full max-w-xs grid grid-cols-3 gap-x-6 gap-y-7 mb-10 px-4 mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'biometric', '0', 'back'].map((key, i) => {
                if (key === 'biometric') {
                  return <div key={i} />;
                }

                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.85, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={() => handleKeyPress(key)}
                    className="h-[72px] flex items-center justify-center text-[34px] font-medium rounded-full transition-colors font-sans w-[72px] mx-auto select-none"
                  >
                    {key === 'back' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[30px] h-[30px]">
                        <path d="M21 12H3m0 0l7-7m-7 7l7 7" />
                      </svg>
                    ) : (
                      key
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. REGISTRATION SUCCESS SCREEN */}
        {authMode === 'registerSuccess' && createdUserAccounts && (
          <AccountCreationSuccess
            userName={createdUserAccounts.name}
            khrAccount={createdUserAccounts.KHR}
            usdAccount={createdUserAccounts.USD}
            onStartBanking={() => { if (tempUser) { onSuccess(tempUser); } }}
            onClose={() => setAuthMode('welcome')}
          />
        )}

      </div>
      <div className="w-32 h-1.5 bg-white/20 rounded-full mb-1 select-none" />
    </div>
  );
}
