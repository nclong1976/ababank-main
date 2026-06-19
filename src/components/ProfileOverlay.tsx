import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  Bell, 
  ChevronRight, 
  LogOut, 
  X,
  CreditCard,
  Settings,
  Award,
  Zap,
  Target,
  Fingerprint,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react';
import { auth, db } from '../lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { startRegistration } from '@simplewebauthn/browser';

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    name: string;
    role: string;
    email?: string;
  };
  onLogout: () => void;
  hideBalances?: boolean;
  onToggleHideBalances?: (val: boolean) => void;
  onViewProfile?: () => void;
  onViewAdmin?: () => void;
}

interface SecurityLog {
  id: string;
  action: string;
  status: 'success' | 'failed';
  timestamp: string;
}

export default function ProfileOverlay({ 
  isOpen, 
  onClose, 
  user, 
  onLogout,
  hideBalances = false,
  onToggleHideBalances,
  onViewProfile,
  onViewAdmin
}: ProfileOverlayProps) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  
  // Local states for security toggles
  const [localHideBalances, setLocalHideBalances] = useState(hideBalances);
  const [isPinRemembered, setIsPinRemembered] = useState(() => {
    return localStorage.getItem('remember_pin_enabled') === 'true';
  });
  const [appTimeout, setAppTimeout] = useState(() => {
    return localStorage.getItem('app_timeout') || '5min';
  });

  useEffect(() => {
    const checkFirestore = async () => {
      const biometricSaved = localStorage.getItem('biometric_enabled');
      if (biometricSaved === 'true') {
        setIsBiometricEnabled(true);
      }
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.biometricEnabled !== undefined) {
               setIsBiometricEnabled(data.biometricEnabled);
               localStorage.setItem('biometric_enabled', data.biometricEnabled.toString());
            }
          }
        } catch (err) {}
      }
    };
    checkFirestore();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      try {
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        setSecurityLogs(logs);
      } catch (err) {}
    }
  }, [isOpen]);

  useEffect(() => {
    setLocalHideBalances(hideBalances);
  }, [hideBalances]);

  const toggleBiometric = async () => {
    const logAction = (action: string, status: 'success' | 'failed') => {
      try {
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        const newLogs = [{
          id: Date.now().toString(),
          action,
          status,
          timestamp: new Date().toISOString()
        }, ...logs].slice(0, 50);
        localStorage.setItem('security_logs', JSON.stringify(newLogs));
        setSecurityLogs(newLogs);
      } catch (err) {}
    };

    if (isBiometricEnabled) {
      setIsBiometricEnabled(false);
      localStorage.setItem('biometric_enabled', 'false');
      logAction('Biometric Disabled', 'success');
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), { biometricEnabled: false }, { merge: true });
        } catch (err) {}
      }
    } else {
      try {
        if ((window as any).ReactNativeWebView) {
           (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'BIOMETRIC_ENROLL_REQUEST' }));
           setIsBiometricEnabled(true);
           localStorage.setItem('biometric_enabled', 'true');
           logAction('Biometric Enrollment', 'success');
        } else if (!window.PublicKeyCredential) {
          alert('WebAuthn is not supported on this device/browser.');
          return;
        } else {
          const resp = await fetch('/api/auth/webauthn/generate-registration-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          const data = await resp.json();
          if (!data.ok) throw new Error(data.error || 'Failed to generate options');

          const attResp = await startRegistration({ optionsJSON: data.options });

          const verificationResp = await fetch('/api/auth/webauthn/verify-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              response: attResp
            }),
          });
          
          const verificationJSON = await verificationResp.json();
          if (verificationJSON.verified) {
            setIsBiometricEnabled(true);
            localStorage.setItem('biometric_enabled', 'true');
            logAction('Biometric Enrollment', 'success');
            if (auth.currentUser) {
              try {
                await setDoc(doc(db, 'users', auth.currentUser.uid), { biometricEnabled: true }, { merge: true });
              } catch (err) {}
            }
          } else {
            throw new Error(verificationJSON.error || 'Verification failed');
          }
        }
      } catch (err) {
        console.error('Biometric registration failed:', err);
        logAction('Biometric Enrollment', 'failed');
        // Fallback for simulation if WebAuthn errors out (common in limited iframe environments)
        if (confirm('Biometric WebAuthn error. Enable pseudo-biometrics for testing?')) {
            setIsBiometricEnabled(true);
            localStorage.setItem('biometric_enabled', 'true');
            if (auth.currentUser) {
              setDoc(doc(db, 'users', auth.currentUser.uid), { biometricEnabled: true }, { merge: true }).catch(() => {});
            }
        }
      }
    }
  };

  const handleToggleHideBalances = () => {
    const newValue = !localHideBalances;
    setLocalHideBalances(newValue);
    localStorage.setItem('hide_balances_enabled', newValue.toString());
    if (onToggleHideBalances) {
      onToggleHideBalances(newValue);
    }
  };

  const toggleRememberPin = () => {
    const newValue = !isPinRemembered;
    setIsPinRemembered(newValue);
    localStorage.setItem('remember_pin_enabled', newValue.toString());
  };

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAppTimeout(val);
    localStorage.setItem('app_timeout', val);
  };

  const menuItems = [
    ...(user.role === 'admin' ? [{ 
      icon: <ShieldCheck className="w-5 h-5 text-red-500" />, 
      label: 'Admin Dashboard', 
      subLabel: 'Manage users and transactions',
      isAdminLink: true 
    }] : []),
    { icon: <User className="w-5 h-5" />, label: 'Personal Information', subLabel: 'Manage your profile data' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', subLabel: 'Alerts, updates and news' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Banking Settings', subLabel: 'Limits, statements, tags' },
    { icon: <Settings className="w-5 h-5" />, label: 'System Preferences', subLabel: 'Language, App Theme, Appearance' },
  ];

  const stats = [
    { icon: <Target className="w-5 h-5 text-[#D4AF37]" />, value: '12', label: 'Goals' },
    { icon: <Award className="w-5 h-5 text-[#D4AF37]" />, value: '2.4k', label: 'Points' },
    { icon: <Zap className="w-5 h-5 text-[#D4AF37]" />, value: 'Level 5', label: 'Tier' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overlay-fixed flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0e1724] border border-gray-800 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Confirmation Overlay (Nested) */}
            <AnimatePresence>
              {showConfirmLogout && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-[#0e1724]/98 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <LogOut className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-sans uppercase tracking-tight">Sure you want to log out?</h3>
                  <p className="text-gray-400 text-sm mb-8 font-sans">You will need to enter your PIN again to access your account.</p>
                  
                  <div className="w-full flex gap-3">
                    <button 
                      onClick={() => setShowConfirmLogout(false)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-xs tracking-widest uppercase transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={onLogout}
                      className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xs tracking-widest uppercase transition-all shadow-lg shadow-red-500/20"
                    >
                      Log Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            {/* Header / User Info */}
            <div className="pt-10 pb-6 px-8 text-center bg-gradient-to-b from-white/10 to-transparent shrink-0">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-[#00bcd4] blur-2xl opacity-25 rounded-full animate-pulse" />
                <div className="relative w-full h-full rounded-full border-2 border-[#D4AF37] p-1 shadow-[0_0_20px_rgba(212,175,55,0.35)]">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a1a1a&color=D4AF37&size=200`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-0.5 uppercase font-sans">
                {user.name.toUpperCase()}
              </h2>
              <p className="text-[#D4AF37] text-[11px] font-semibold tracking-widest uppercase opacity-90 italic font-sans animate-fade-in">
                {user.role === 'admin' ? 'System Administrator' : 'Senior Client Premium'}
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center gap-8 py-4 border-y border-white/5 mx-8 font-sans shrink-0">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex justify-center mb-1 opacity-80 scale-90">
                    {stat.icon}
                  </div>
                  <div className="text-base font-bold text-white leading-none mb-0.5">{stat.value}</div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Menu sections inside scrollable area for perfect mobile responsiveness */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-4 space-y-6">
              
              {/* Category: Security Settings */}
              <div>
                <h3 className="text-[11px] font-bold text-[#00bcd4] tracking-widest uppercase mb-3 pl-2 opacity-80">
                  Security & Access
                </h3>
                <div className="bg-white/5 rounded-2xl p-2 border border-white/5 space-y-1">
                  
                  {/* Toggle: Biometric Authentication */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#00bcd4]/10 flex items-center justify-center text-[#00bcd4]">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold text-gray-200">Biometric Login</div>
                          <div className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-widest ${isBiometricEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {isBiometricEnabled ? 'Active' : 'Off'}
                          </div>
                        </div>
                        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Use Fingerprint / FaceID</div>
                      </div>
                    </div>
                    {/* Switch */}
                    <button 
                      onClick={toggleBiometric}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex items-center p-0.5 ${isBiometricEnabled ? "bg-[#00bcd4]" : "bg-gray-700"}`}
                    >
                      <motion.div 
                        layout 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        style={{ x: isBiometricEnabled ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  {/* Toggle: Hide Account Balances */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#005c7a]/20 flex items-center justify-center text-[#00bcd4]">
                        {localHideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-200">Hide Balances</div>
                        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Mask on Home Screen</div>
                      </div>
                    </div>
                    {/* Switch */}
                    <button 
                      onClick={handleToggleHideBalances}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex items-center p-0.5 ${localHideBalances ? "bg-[#00bcd4]" : "bg-gray-700"}`}
                    >
                      <motion.div 
                        layout 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        style={{ x: localHideBalances ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  {/* Toggle: Remember PIN */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-200">Remember Login ID</div>
                        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Keep Device Registered</div>
                      </div>
                    </div>
                    {/* Switch */}
                    <button 
                      onClick={toggleRememberPin}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex items-center p-0.5 ${isPinRemembered ? "bg-[#00bcd4]" : "bg-gray-700"}`}
                    >
                      <motion.div 
                        layout 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md"
                        style={{ x: isPinRemembered ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  {/* Selector: Session Timeout */}
                  <div className="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-gray-200">Session Timeout</div>
                        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Auto logout lock</div>
                      </div>
                    </div>
                    <select 
                      value={appTimeout}
                      onChange={handleTimeoutChange}
                      className="bg-[#121212] border border-gray-800 text-[#00bcd4] text-xs font-bold rounded-lg p-1.5 outline-none"
                    >
                      <option value="immediate">Immediate</option>
                      <option value="1min">1 Min</option>
                      <option value="5min">5 Min</option>
                      <option value="15min">15 Min</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Category: Security Activity Logs */}
              {securityLogs.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold text-white/70 tracking-widest uppercase mb-3 pl-2 opacity-80">
                    Security Activity
                  </h3>
                  <div className="bg-white/5 rounded-2xl p-2 border border-white/5 overflow-hidden">
                    <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1">
                      {securityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 rounded-xl">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-gray-200">{log.action}</div>
                            <div className="text-[9px] text-gray-500 font-medium tracking-wider">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Category: General Preferences */}
              <div>
                <h3 className="text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase mb-3 pl-2 opacity-80">
                  App Preferences
                </h3>
                <div className="bg-white/5 rounded-2xl p-2 border border-white/5 space-y-1">
                  {menuItems.map((item, index) => (
                    <div 
                      key={index}
                      onClick={() => {
                        if ((item as any).isAdminLink) {
                          onClose();
                          if (onViewAdmin) onViewAdmin();
                        } else if (item.label === 'Personal Information' && onViewProfile) {
                          onViewProfile();
                        }
                      }}
                      className="group flex items-center p-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform">
                        {item.icon}
                      </div>
                      <div className="flex-1 ml-3 text-left">
                        <div className="text-xs font-bold text-gray-200">{item.label}</div>
                        <div className="text-[9px] text-gray-500 font-medium uppercase tracking-wider">{item.subLabel}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-750 group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer: Logout */}
            <div className="p-6 border-t border-white/5 bg-black/30 shrink-0">
              <button 
                onClick={() => setShowConfirmLogout(true)}
                className="w-full py-3.5 group bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all duration-500 flex justify-center items-center gap-3 hover:bg-red-500 hover:text-white shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95 font-sans"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                LOG OUT
              </button>
              <p className="text-center text-[9px] text-gray-650 font-medium mt-4 tracking-widest font-sans opacity-50 uppercase">
                ABA Mobile • Secure Session v4.2.1
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


