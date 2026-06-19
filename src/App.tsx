/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Eye, 
  EyeOff,
  ChevronRight,
  UserPlus,
  PlusSquare,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import socket from './lib/socket';
import { AppProvider } from './context/AppContext';
import { auth, db } from './lib/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import StatusBar from './components/StatusBar';

// Custom icons to match ABA design more closely
const CardsIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Check_Balance.png" alt="Cards" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const ScanIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/Announcements/News/aba_analytics/icons/Via_QR.png" alt="ABA Scan" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const PaymentsIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Pay_Your_Bills.png" alt="Payments" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const TransfersIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Send_Money_to_Anyone.png" alt="Transfers" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const ECashIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Cardless_Cash.png" alt="E-Cash" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const ServicesIcon = () => (
  <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Useful_Templates.png" alt="Useful" className="w-[52px] h-[52px] -mt-[5px] object-contain" />
);

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#003b4d] flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center p-4 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
           <img 
             src="https://play-lh.googleusercontent.com/WU6sZMD1UspzwqYnlACtmN60rckp8hoINSgsR21mKLJBbsHPwXtzwvOocpjC7FcO1g=s180-rw" 
             alt="ABA Logo" 
             className="w-full h-full object-contain"
           />
        </div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border-2 border-dashed border-white/20 rounded-full"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <h1 className="text-white font-black text-2xl tracking-[0.2em] italic mb-1">ABA MOBILE</h1>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-8 max-w-[280px]">Partnership for better service</p>
      </motion.div>
      <div className="mt-20 flex gap-1 h-9 items-center justify-center">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scaleY: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-6 bg-[#00bcd4] rounded-full origin-center"
          />
        ))}
      </div>
    </div>
  );
};

import Scanner from './components/Scanner';
import Payment from './components/Payment';
import Transfers from './components/Transfers';
import History from './components/History';
import LanguageScreen from './components/auth/LanguageScreen';
import ActivationScreen from './components/auth/ActivationScreen';
import CreatePinScreen from './components/auth/CreatePinScreen';
import LoginPinScreen from './components/auth/LoginPinScreen';
import AdminDashboard from './components/AdminDashboard';
import Cards from './components/Cards';
import ReceiveMoney from './components/ReceiveMoney';
import AddMoney from './components/AddMoney';
import GovServices from './components/GovServices';
import ProfileOverlay from './components/ProfileOverlay';
import PaymentsHub from './components/PaymentsHub';
import ECashHub from './components/ECashHub';
import UsefulHub from './components/UsefulHub';
import Receipt from './components/Receipt';
import ProfileDetailScreen from './components/ProfileDetailScreen';
import { BLOB_IMAGES } from './lib/blob-images';

const HapticButton = ({ children, onClick, className, ...props }: any) => {
  const [ripples, setRipples] = useState<{x: number, y: number, id: number}[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (navigator.vibrate) navigator.vibrate(40);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
    
    if (onClick) onClick(e);
  };

  return (
    <motion.button 
      onClick={handleClick} 
      className={`relative overflow-hidden ${className || ''}`} 
      {...props}
    >
      {children}
      {ripples.map(r => (
        <span 
          key={r.id}
          className="absolute bg-black/10 rounded-full animate-ripple pointer-events-none z-10"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%)',
            width: '200%',
            aspectRatio: '1/1',
          }}
        />
      ))}
    </motion.button>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 10) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return;
    const y = e.touches[0].clientY;
    const distance = y - startY;
    
    if (distance > 0) {
      const dampedDistance = Math.min(distance * 0.4, 80);
      setPullDistance(dampedDistance);
    }
  };

  const handleTouchEnd = () => {
    if (startY === 0 || isRefreshing) return;
    
    if (pullDistance > 60) {
      setIsRefreshing(true);
      if (navigator.vibrate) navigator.vibrate(40);
      fetchBalance();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  };

  useEffect(() => {
    // Basic anonymous sign in for Firestore access
    // If this fails with auth/admin-restricted-operation, you need to enable
    // Anonymous Auth in the Firebase Console (Authentication > Sign-in method)
    const performAuth = async () => {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err: any) {
          if (err.code === 'auth/admin-restricted-operation') {
            console.warn(
              "[Firebase] Anonymous sign-in is disabled. Please enable it in the Firebase Console " +
              "(Authentication > Sign-in method) to allow secure Firestore access."
            );
          } else {
            console.warn("Firebase Auth is temporarily offline or restricted by ad-blocker. Local SQLite banking features remain fully active.", err);
          }
        }
      }
    };
    performAuth();
  }, []);
  const [showProfile, setShowProfile] = useState(false);
  const [screen, setScreen] = useState<'loginPin' | 'home' | 'scanner' | 'payment' | 'transfers' | 'history' | 'admin' | 'receiveMoney' | 'cards' | 'addMoney' | 'govServices' | 'paymentsHub' | 'ecash' | 'useful' | 'receipt' | 'profile'>('loginPin');
  const [historyType, setHistoryType] = useState<'receive' | 'send'>('receive');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'km' | 'en' | 'zh'>('en');
  const [balances, setBalances] = useState<Record<string, number>>({ KHR: 1500000, USD: 2500 });
  const [accountNumbers, setAccountNumbers] = useState<Record<string, string>>({ KHR: '000000000', USD: '000000000' });
  const [hideBalances, setHideBalances] = useState(() => {
    return localStorage.getItem('hide_balances_enabled') === 'true';
  });

  const fetchBalance = () => {
    if (!currentUser) return;
    const targetUserId = currentUser.viewingId || currentUser.id;
    fetch(`/api/balance/${targetUserId}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.balances) {
          setBalances(data.balances);
        }
        if (data.ok && data.accountNumbers) {
          setAccountNumbers(data.accountNumbers);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchBalance();

    const onBalanceUpdate = (data: any) => {
      if (!data || data.userId === (currentUser.viewingId || currentUser.id)) {
        fetchBalance();
      }
    };

    socket.on('balance_update', onBalanceUpdate);

    // Polling fallback every 5 seconds for serverless real-time sync
    const interval = setInterval(() => {
      fetchBalance();
    }, 5000);

    return () => {
      socket.off('balance_update', onBalanceUpdate);
      clearInterval(interval);
    };
  }, [currentUser]);

  const onLoginSuccess = async (user: any) => {
    setCurrentUser(user);
    if (user.name) {
      setSavedUserName(user.name);
      localStorage.setItem('savedUserName', user.name);
    }
    if (user.phone) {
      localStorage.setItem('savedUserPhone', user.phone);
    }
    // Register with socket
    socket.emit('register', { userId: user.id, role: user.role });
    
    // Sync to Firestore for rules verification
    if (auth.currentUser) {
       try {
         await setDoc(doc(db, 'users', auth.currentUser.uid), {
             uid: auth.currentUser.uid,
             sqlId: user.id,
             role: user.role,
             name: user.name,
             email: user.email,
             updatedAt: new Date()
         }, { merge: true });
       } catch (err) {
         console.error("Firestore sync error:", err);
       }
    }

    if (user.role === 'admin') {
      setScreen('admin');
    } else {
      setScreen('home');
    }
  };

  const handleLogout = () => {
    setShowProfile(false);
    setCurrentUser(null);
    setScreen('loginPin');
    // Clear last session if needed
  };

  const handleSelectUser = (user: { id: string, name: string }) => {
    setCurrentUser(prev => ({ ...prev, viewingId: user.id, viewingName: user.name }));
    setScreen('home');
  };

  const currentUserId = currentUser?.viewingId || currentUser?.id;
  const [savedUserName, setSavedUserName] = useState(() => localStorage.getItem('savedUserName') || 'So Dawin!');
  const currentUserName = currentUser?.viewingName || currentUser?.name || savedUserName;
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'KHR'>('USD');
  const currentUserAccountNo = accountNumbers[activeCurrency] || (activeCurrency === 'USD' ? '000000000' : '000000000');
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    const target = balances[activeCurrency] || 0;
    const start = displayBalance;
    const duration = 600;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (target - start) * easeOutQuart;
      setDisplayBalance(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [balances, activeCurrency]);

  const formatBalanceValue = (amount: number, cur: string) => {
    if (cur === 'USD') {
      return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return Math.floor(amount).toLocaleString('en-US', { minimumFractionDigits: 0 }).replace(/,/g, '.') + ' ៛';
  };

  const currentBalance = balances[activeCurrency] !== undefined 
    ? (hideBalances ? (activeCurrency === 'USD' ? '$ ••••••' : '•••••• ៛') : formatBalanceValue(displayBalance, activeCurrency)) 
    : (activeCurrency === 'USD' ? '$0.00' : '0 ៛');

  const mainGrid = [
    { icon: CardsIcon, label: selectedLanguage === 'km' ? 'កាត' : 'Cards', onClick: () => setScreen('cards') },
    { icon: ScanIcon, label: selectedLanguage === 'km' ? 'ស្កេន' : 'ABA Scan', onClick: () => setScreen('scanner') },
    { icon: PaymentsIcon, label: selectedLanguage === 'km' ? 'ទូទាត់' : 'Payments', onClick: () => setScreen('paymentsHub') },
    { icon: TransfersIcon, label: selectedLanguage === 'km' ? 'ផ្ទេរប្រាក់' : 'Transfers', onClick: () => setScreen('transfers') },
    { icon: ECashIcon, label: 'E-cash', onClick: () => setScreen('ecash') },
    { icon: ServicesIcon, label: selectedLanguage === 'km' ? 'ងាយស្រួល' : 'Useful', onClick: () => setScreen('useful') },
  ];
  
  const translations = {
    en: {
      hello: `Hello, ${currentUserName}!`,
      viewProfile: 'View Profile',
      receiveMoney: 'Receive Money',
      sendMoney: 'Send Money',
      govServices: 'Government Services',
      viewAll: 'VIEW ALL',
      inviteFriend: 'Invite Friend',
      newAccount: 'New Account',
      schedule: 'Schedule',
    },
    km: {
      hello: `សួស្តី, ${currentUserName}!`,
      viewProfile: 'មើលព័ត៌មានផ្ទាល់ខ្លួន',
      receiveMoney: 'ទទួលប្រាក់',
      sendMoney: 'ផ្ញើប្រាក់',
      govServices: 'សេវាសាធារណៈ',
      viewAll: 'មើលទាំងអស់',
      inviteFriend: 'ណែនាំមិត្តភក្តិ',
      newAccount: 'បើកគណនីថ្មី',
      schedule: 'កំណត់ពេល',
    }
  };

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en;

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <LoginPinScreen onSuccess={onLoginSuccess} userName={currentUserName} />;
  }

  const renderScreen = () => {
    if (screen === 'admin') {
      return (
        <motion.div
           key="admin"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           className="min-h-screen"
        >
          <AdminDashboard 
            onBack={() => setScreen('home')} 
            onSelectUser={handleSelectUser}
            adminId={currentUser?.id}
            onShowProfile={() => setShowProfile(true)}
          />
        </motion.div>
      );
    }

    if (screen === 'govServices') {
      return (
        <motion.div
           key="gov"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <GovServices onBack={() => setScreen('home')} />
        </motion.div>
      );
    }

    if (screen === 'cards') {
      return (
        <motion.div
           key="cards"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <Cards onBack={() => setScreen('home')} />
        </motion.div>
      );
    }

    if (screen === 'paymentsHub') {
      return (
        <motion.div
           key="paymentsHub"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <PaymentsHub onBack={() => setScreen('home')} userId={currentUser?.id} />
        </motion.div>
      );
    }

    if (screen === 'addMoney') {
      return (
        <motion.div
           key="addMoney"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <AddMoney 
            onBack={() => {
              setScreen('home');
              fetchBalance();
            }} 
            userId={currentUser?.id} 
          />
        </motion.div>
      );
    }

    if (screen === 'receiveMoney') {
      return (
        <motion.div
           key="receiveMoney"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <ReceiveMoney 
            onBack={() => setScreen('home')} 
            userName={currentUserName} 
            accountNo={currentUserAccountNo} 
            language={selectedLanguage}
            userId={currentUserId}
          />
        </motion.div>
      );
    }

    if (screen === 'scanner') {
      return (
        <motion.div
           key="scanner"
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
        >
          <Scanner 
            onClose={() => setScreen('home')} 
            onScan={(data) => {
              setScannedData(data);
              setScreen('payment');
            }} 
          />
        </motion.div>
      );
    }

    if (screen === 'payment') {
      return (
        <motion.div
           key="payment"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <Payment 
            scannedData={scannedData} 
            onBack={() => setScreen('home')} 
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </motion.div>
      );
    }

    if (screen === 'transfers') {
      return (
        <motion.div
           key="transfers"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <Transfers 
            onBack={() => setScreen('home')}
            onScanQR={() => setScreen('scanner')}
            onShowReceipt={() => setScreen('receipt')}
            currentUserId={currentUserId}
          />
        </motion.div>
      );
    }

    if (screen === 'receipt') {
      return (
        <motion.div
           key="receipt"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <Receipt onBack={() => setScreen('home')} />
        </motion.div>
      );
    }

    if (screen === 'history') {
      return (
        <motion.div
           key="history"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <History 
            type={historyType} 
            onBack={() => setScreen('home')} 
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAccountNo={currentUserAccountNo}
            balances={balances}
            activeCurrency={activeCurrency}
          />
        </motion.div>
      );
    }

    if (screen === 'ecash') {
      return (
        <motion.div
           key="ecash"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <ECashHub onBack={() => setScreen('home')} />
        </motion.div>
      );
    }

    if (screen === 'useful') {
      return (
        <motion.div
           key="useful"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <UsefulHub onBack={() => setScreen('home')} />
        </motion.div>
      );
    }
    
    if (screen === 'profile') {
      return (
        <motion.div
           key="profile"
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
        >
          <ProfileDetailScreen 
            onBack={() => setScreen('home')} 
            user={{
              name: currentUserName,
              role: currentUser?.role || 'user'
            }} 
          />
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="home-screen bg-linear-to-b from-[#005c7a] via-[#003b4d] to-[#011a24] px-0 pt-0 pb-20 max-w-md mx-auto relative overflow-y-auto no-scrollbar font-sans"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <StatusBar className="bg-[#005c7a]" />
        <div className="px-4">
        {/* Pull to refresh indicator */}
        <motion.div 
          className="absolute left-0 right-0 top-0 flex justify-center z-50 pointer-events-none"
          animate={{ y: isRefreshing ? 60 : pullDistance > 0 ? pullDistance : -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="w-10 h-10 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center relative overflow-hidden">
            {isRefreshing ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-1.5 border-2 border-transparent border-t-[#00bcd4] border-r-[#00bcd4] border-b-[#00bcd4] rounded-full"
              />
            ) : (
              <motion.div 
                animate={{ rotate: pullDistance * 2 }}
                className="absolute inset-1.5 border-2 border-transparent border-t-[#00bcd4] border-r-[#00bcd4] rounded-full opacity-60"
              />
            )}
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-2 h-2 bg-[#00bcd4] rounded-full" />
             </div>
          </div>
        </motion.div>

        <motion.div
           animate={{ y: isRefreshing ? 20 : pullDistance > 0 ? pullDistance * 0.3 : 0 }}
           transition={{ type: "spring", stiffness: 300, damping: 25 }}
           className="w-full relative"
        >
        {/* Decorative Blur */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-red-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

        {/* Header */}
        <header className="relative flex items-center justify-between mt-2 mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="relative group cursor-pointer" 
               onClick={() => setShowProfile(true)}
            >
              <div className="absolute inset-0 bg-white/20 blur-md rounded-full group-hover:bg-white/30 transition-all" />
              <div className="relative w-14 h-14 rounded-full border-2 border-white/50 overflow-hidden shadow-lg">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=00bcd4&color=fff`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans" onClick={() => setShowProfile(true)}>{t.hello}</h1>
              <button 
                onClick={() => setShowProfile(true)}
                className="flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors font-sans"
              >
                {t.viewProfile} <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <HapticButton 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative transition-transform"
            >
              <Bell className="w-7 h-7 text-white" strokeWidth={2.5} />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-[#005c7a]" />
            </HapticButton>
            <HapticButton 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setScreen('scanner');
              }} 
              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg border border-white/10 overflow-hidden p-1.5"
            >
              <img src={BLOB_IMAGES.scanQrIcon} alt="Scan QR" className="w-full h-full object-contain" />
            </HapticButton>
          </div>
        </header>

        {/* Main Account Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="relative bg-white rounded-[1.7rem] p-5 shadow-2xl mb-6 overflow-hidden cursor-pointer"
          onClick={() => {
            setHistoryType('receive');
            setScreen('history');
          }}
        >
          <div className="relative w-full flex flex-col mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div 
                   className="flex items-center h-10 active:opacity-70 transition-opacity"
                   onClick={(e) => {
                     e.stopPropagation();
                     setActiveCurrency(prev => prev === 'USD' ? 'KHR' : 'USD');
                   }}
                 >
                    <span 
                      className="text-[#3a3b3c] font-bold text-[28px] tracking-tight leading-none"
                    >
                      {currentBalance}
                    </span>
                 </div>
              </div>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all border border-gray-100 shadow-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  const newVal = !hideBalances;
                  setHideBalances(newVal);
                  localStorage.setItem('hide_balances_enabled', newVal.toString());
                }}
              >
                {hideBalances ? <EyeOff className="w-5 h-5 text-[#00bcd4]" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <div className="px-2 py-[2px] flex items-center rounded-[4px] bg-[#4abfb4] text-[10px] font-medium text-white tracking-wide uppercase">
                {activeCurrency} Savings
              </div>
              <span className="text-[#9ea6b5] font-normal text-[13px] font-khmer capitalize">
                {activeCurrency === 'USD' ? 'Monthly Savings' : currentUserAccountNo.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}
              </span>
            </div>
          </div>

          <div className="relative w-full flex justify-start mt-7 gap-6">
            <HapticButton 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e: any) => { e.stopPropagation(); setScreen('receiveMoney'); }} 
              className="flex items-center flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-[22px] h-[22px] rounded-full border-[2px] border-[#38a3a5] flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[11px] h-[11px] text-[#38a3a5]"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>
                </div>
                <span className="text-[#434546] font-bold text-[15px] tracking-tight font-sans">{t.receiveMoney}</span>
              </div>
            </HapticButton>
            
            <HapticButton 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e: any) => { e.stopPropagation(); setHistoryType('send'); setScreen('history'); }} 
              className="flex items-center flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2">
                <div className="w-[22px] h-[22px] rounded-full border-[2px] border-[#d85e5b] flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[11px] h-[11px] text-[#d85e5b]"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                </div>
                <span className="text-[#434546] font-bold text-[15px] tracking-tight font-sans">{t.sendMoney}</span>
              </div>
            </HapticButton>
          </div>
        </motion.div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
          {mainGrid.map((item, index) => (
            <HapticButton
              key={index}
              onClick={item.onClick}
              whileHover={{ y: -5, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="w-full h-[90px] bg-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 backdrop-blur-sm mx-auto"
            >
              <div className="h-10 flex items-center justify-center">
                <item.icon />
              </div>
              <span className="text-[11px] font-bold text-[#003b4d] tracking-tight leading-[1.1] text-center px-1 font-sans">
                {item.label}
              </span>
            </HapticButton>
          ))}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6 px-1">
          {[
            { icon: <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Protect_Your_Funds.png" alt="Protect Funds" className="w-[32px] h-[32px] object-contain" />, label: "Check Balance" },
            { icon: <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/24-7_Banking.png" alt="24/7 Banking" className="w-[32px] h-[32px] object-contain" />, label: "24/7 Banking" },
            { icon: <img src="https://www.ababank.com/fileadmin/user_upload/ABA_Mobile/Top_Up_Any_Mobile.png" alt="Top Up Mobile" className="w-[32px] h-[32px] object-contain" />, label: "Top Up" }
          ].map((item, i) => (
            <HapticButton
              key={i}
              whileHover={{ y: -2, shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[150px] px-4 h-[65px]"
            >
              <div className="w-[35px] flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <span className="text-[13px] font-bold text-[#005e7e] font-sans leading-tight">
                {item.label}
              </span>
            </HapticButton>
          ))}
        </div>

        {/* Footer Title */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-white tracking-tight font-sans">{t.govServices}</h2>
          <button className="flex items-center text-[10px] font-bold text-white/60 hover:text-white tracking-widest transition-colors font-sans">
            {t.viewAll} <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Gov Services Scrollable */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 px-1">
          {[
            {
              id: 'edc',
              name: 'PTT',
              bgImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2fTnSCfV2MuSNxWdoHYo7CzB8z6SNqANScg&s'
            },
            {
              id: 'sportal',
              name: 'Sportal',
              bgImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Sportal.rs.png/500px-Sportal.rs.png'
            },
            {
              id: 'game',
              name: 'Game',
              bgImage: 'https://gamefaqs.gamespot.com/a/box/0/6/5/890065_side.jpg'
            },
            {
              id: 'cinema',
              name: 'Cinema',
              bgImage: 'https://static.vecteezy.com/system/resources/previews/031/717/715/non_2x/cinema-ticket-with-barcode-icon-movie-ticket-template-realistic-cinema-theater-admission-pass-mock-up-coupon-vintage-retro-old-ticket-illustration-vector.jpg'
            },
            {
              id: 'todaytix',
              name: 'TodayTix',
              bgImage: 'https://cdn-1.webcatalog.io/catalog/todaytix/todaytix-icon-filled-256.png?v=1775435963242'
            }
          ].map((service, i) => (
            <HapticButton 
              key={i} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setScreen('govServices')}
              className="w-[80px] h-[80px] flex-shrink-0 cursor-pointer rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col items-center justify-center relative overflow-hidden"
            >
              <img 
                src={service.bgImage} 
                alt={service.name} 
                className="absolute inset-0 w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              {/* Optional overlay for readability if needed, but user asked for images to occupy the buttons */}
              <div className="absolute inset-0 bg-black/10" />
              <span className="relative z-10 text-[10px] font-bold text-white font-sans text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-1 drop-shadow-md">
                {service.name}
              </span>
            </HapticButton>
          ))}
        </div>
        </motion.div>
        </div>
      </motion.div>
    );
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <LoginPinScreen onSuccess={onLoginSuccess} userName={currentUserName} />;
  }

  return (
    <AppProvider>
            <div className="mobile-shell">
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
      
      <ProfileOverlay 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={{
          id: currentUser?.id,
          name: currentUserName,
          role: currentUser?.role || 'user'
        }}
        onLogout={handleLogout}
        hideBalances={hideBalances}
        onToggleHideBalances={setHideBalances}
        onViewProfile={() => {
          setShowProfile(false);
          setScreen('profile');
        }}
        onViewAdmin={() => {
          setShowProfile(false);
          setScreen('admin');
        }}
      />

      {/* OS Navigation Indicator */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/40 rounded-full backdrop-blur-sm z-[60] pointer-events-none" />
          </div>
</AppProvider>
  );
}
