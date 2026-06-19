import React, { useState } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AddMoneyProps {
  onBack: () => void;
  userId: string;
}

export default function AddMoney({ onBack, userId }: AddMoneyProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [type, setType] = useState<'plus' | 'minus'>('plus');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          amount: amt,
          type: type,
          currency: currency,
          note: `Self adjusted ${type} via Payments`
        })
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setAmount('');
        setTimeout(() => {
          setSuccess(false);
          onBack();
        }, 2000);
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error updating balance');
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 bg-[#005566] text-white z-50 flex flex-col"
    >
      <div className="flex items-center px-4 py-4 bg-[#005566]">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-[20px] font-medium font-sans text-center -ml-8 truncate">
            Adjust Balance
          </h1>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex flex-col p-6 items-center justify-center text-gray-800">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#00bcd4]/10 rounded-full flex items-center justify-center mb-6 text-[#00bcd4]">
            <PlusCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2 font-sans">Adjust Balance</h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Please enter the amount you want to adjust in your account.
          </p>

          <div className="flex w-full mb-6 bg-gray-100 p-1 rounded-xl">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'plus' ? 'bg-white shadow-sm text-[#00bcd4]' : 'text-gray-500'}`}
              onClick={() => setType('plus')}
            >
              Add (+)
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type === 'minus' ? 'bg-white shadow-sm text-[#ff5252]' : 'text-gray-500'}`}
              onClick={() => setType('minus')}
            >
              Subtract (-)
            </motion.button>
          </div>

          <div className="flex w-full mb-6 bg-gray-100 p-1 rounded-xl">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${currency === 'USD' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              onClick={() => setCurrency('USD')}
            >
              USD
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${currency === 'KHR' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
              onClick={() => setCurrency('KHR')}
            >
              KHR
            </motion.button>
          </div>
          
          <div className="w-full mb-6 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xl">{currency === 'USD' ? '$' : '៛'}</span>
            <input
              type="number"
              className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-10 text-xl font-bold focus:outline-none focus:border-[#00bcd4] focus:ring-1 focus:ring-[#00bcd4] transition-all"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          {success ? (
            <div className="w-full bg-green-50 text-green-600 font-medium py-3 px-4 rounded-xl text-center mb-4">
              Successfully updated!
            </div>
          ) : null}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className={`w-full text-white font-bold h-12 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide text-sm active:scale-95 transition-all ${type === 'minus' ? 'bg-[#ff5252]' : 'bg-[#00bcd4]'}`}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
