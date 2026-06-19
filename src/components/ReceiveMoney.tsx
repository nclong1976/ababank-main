import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Share2, Download, Copy, Check, DollarSign, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateKHQRString } from '../lib/khqr';
import StatusBar from './StatusBar';

interface ReceiveMoneyProps {
  onBack: () => void;
  userName: string;
  accountNo: string;
  language: 'km' | 'en' | 'zh';
  userId: string;
}

export default function ReceiveMoney({ onBack, userName, accountNo, language, userId }: ReceiveMoneyProps) {
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [amount, setAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [accountNumbers, setAccountNumbers] = useState<Record<string, string>>({ USD: accountNo, KHR: '000 639 999' });

  const displayAccountNo = accountNumbers[currency] || (currency === 'USD' ? accountNo : '000 639 999');

  const t = {
    title: language === 'km' ? 'ទទួលប្រាក់' : 'Receive Money',
    account: language === 'km' ? 'គណនី' : 'Account',
    name: language === 'km' ? 'ឈ្មោះ' : 'Name',
    setAmount: language === 'km' ? 'កំណត់ចំនួនទឹកប្រាក់' : 'Set Amount',
    enterAmount: language === 'km' ? 'បញ្ចូលចំនួនទឹកប្រាក់' : 'Enter amount',
    share: language === 'km' ? 'ចែករំលែក' : 'Share',
    download: language === 'km' ? 'ទាញយក' : 'Download',
    scanToPay: language === 'km' ? 'ស្កេនដើម្បីទូទាត់' : 'Scan to pay',
    copySuccess: language === 'km' ? 'បានចម្លង!' : 'Copied!',
    clear: language === 'km' ? 'សម្អាត' : 'Clear',
  };

  const qrString = useMemo(() => {
    return generateKHQRString({
      accountNo: displayAccountNo.replace(/\s/g, ''),
      name: userName,
      amount: amount || undefined,
      currency: currency === 'USD' ? '840' : '116'
    });
  }, [displayAccountNo, userName, amount, currency]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [systemTransactions, setSystemTransactions] = useState<any[]>([]);
  const [loadingSystem, setLoadingSystem] = useState(false);

  useEffect(() => {
    setLoadingSystem(true);
    fetch(`/api/user/${userId}/transactions`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.transactions)) {
          // Filter only system adjustments
          const system = data.transactions.filter((t: any) => t.party_name === 'ABA SYSTEM' || (t.admin_id && t.type === 'receive'));
          setSystemTransactions(system);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingSystem(false));

    fetch(`/api/balance/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.accountNumbers) setAccountNumbers(data.accountNumbers);
      })
      .catch(err => console.error(err));
  }, [userId]);

  return (
            <div className="screen bg-[#011a24] flex flex-col font-sans">
      <StatusBar className="bg-[#011a24]" />
      {/* Header */}
      <header className="p-4 pt-2 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg font-khmer">{t.title}</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        {/* Currency Switcher */}
        <div className="mt-4 mb-6 flex justify-center">
          <div className="bg-white/5 p-1.5 rounded-2xl flex gap-2 border border-white/5">
            <button 
              onClick={() => { setCurrency('USD'); setAmount(''); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${currency === 'USD' ? 'bg-[#00bcd4] text-white shadow-lg shadow-[#00bcd4]/20' : 'text-white/40'}`}
            >
              USD
            </button>
            <button 
              onClick={() => { setCurrency('KHR'); setAmount(''); }}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${currency === 'KHR' ? 'bg-[#00bcd4] text-white shadow-lg shadow-[#00bcd4]/20' : 'text-white/40'}`}
            >
              KHR
            </button>
          </div>
        </div>

        {/* QR Card */}
        <motion.div 
          key={currency}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* ABA Branding Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#005c7a]" />
          
          <div className="flex flex-col items-center">
            {/* Bank Logo Area */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#005c7a] rounded-xl flex items-center justify-center text-white font-bold text-[10px] leading-tight italic p-1 text-center">
                ABA BANK
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">KHQR Receiver</p>
                <p className="text-[#005c7a] font-black text-sm italic">ABA Mobile</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-50 mb-8 relative group">
              <QRCodeSVG
                value={qrString}
                size={220}
                level="Q"
                imageSettings={{
                  src: "https://play-lh.googleusercontent.com/WU6sZMD1UspzwqYnlACtmN60rckp8hoINSgsR21mKLJBbsHPwXtzwvOocpjC7FcO1g=w240-h480-rw",
                  x: undefined,
                  y: undefined,
                  height: 52,
                  width: 52,
                  excavate: true,
                }}
              />
              <motion.button 
                onClick={handleCopy}
                className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]"
              >
                <div className="bg-white/95 backdrop-blur px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-gray-100">
                  {copied ? <Check className="w-4 h-4 text-green-500" strokeWidth={3} /> : <Copy className="w-4 h-4 text-[#00bcd4]" strokeWidth={3} />}
                  <span className="text-sm font-bold text-gray-700">{copied ? t.copySuccess : 'Copy KHQR'}</span>
                </div>
              </motion.button>
            </div>

            {/* Account Info */}
            <div className="w-full text-center mb-6">
              <h2 className="text-gray-900 font-black text-2xl uppercase tracking-tighter mb-2">{userName}</h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                <span className="text-gray-500 font-bold text-sm tracking-tight">{displayAccountNo}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className="text-[#00bcd4] font-black text-xs uppercase">{currency}</span>
              </div>
              
              <AnimatePresence>
                {amount && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-6 flex flex-col items-center"
                  >
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Requested Amount</span>
                    <div className="text-[#005c7a] font-black text-4xl tracking-tighter">
                      {currency === 'USD' ? '$' : ''}
                      {currency === 'KHR' ? parseFloat(amount).toLocaleString('en-US') : parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {currency === 'KHR' ? ' ៛' : ''}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-full relative py-6">
               <div className="absolute left-0 right-0 h-px bg-gray-100 top-1/2 -translate-y-1/2" />
               <div className="relative z-10 mx-auto px-4 bg-white text-gray-300 text-[10px] font-bold uppercase tracking-widest font-khmer">
                 {t.scanToPay}
               </div>
            </div>
          </div>
        </motion.div>

        {/* Amount Input */}
        <div className="mt-10">
          <label className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2 mb-3 block font-khmer">
            {t.setAmount} ({currency})
          </label>
          <div className="bg-white/5 rounded-[2rem] flex items-center p-5 border border-white/10 group focus-within:border-[#00bcd4]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-focus-within:bg-[#00bcd4]/20 transition-colors">
              <span className={`font-black text-xl ${currency === 'USD' ? 'text-[#00bcd4]' : 'text-[#8cc63f]'}`}>
                {currency === 'USD' ? '$' : '៛'}
              </span>
            </div>
            <input 
              type="number" 
              placeholder={t.enterAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-white font-black text-2xl focus:ring-0 w-full placeholder:text-white/10"
            />
            {amount && (
              <button 
                onClick={() => setAmount('')}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button className="bg-white/10 py-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/20 transition-all text-white">
            <Share2 className="w-6 h-6" />
            <span className="text-xs font-bold font-khmer">{t.share}</span>
          </button>
            <button className="bg-white/10 py-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/20 transition-all text-white">
            <Download className="w-6 h-6" />
            <span className="text-xs font-bold font-khmer">{t.download}</span>
          </button>
        </div>

        {/* System Adjustments List */}
        {systemTransactions.length > 0 && (
          <div className="mt-10">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2 mb-4 block">
              Recent System Adjustments
            </h3>
            <div className="space-y-3">
              {systemTransactions.map((t, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={t.id} 
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm tracking-tight">Received from Admin</span>
                    <span className="text-white/40 text-[10px] font-medium">{new Date(t.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                    {t.note && <span className="text-[#00bcd4] text-[10px] font-bold mt-1 italic">"{t.note}"</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[#00bcd4] font-black text-lg">
                      +{t.currency === 'USD' ? '$' : ''}{t.amount.toLocaleString()}{t.currency === 'KHR' ? ' ៛' : ''}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <span className="text-[9px] text-green-500 font-bold uppercase tracking-tight">Verified</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OS Indicator */}
      <div className="p-2 flex justify-center">
        <div className="w-24 h-1.5 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}
