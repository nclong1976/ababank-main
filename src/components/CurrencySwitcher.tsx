import React from 'react';
import { motion } from 'motion/react';

interface CurrencySwitcherProps {
  currentCurrency: 'KHR' | 'USD';
  onSwitch: (currency: 'KHR' | 'USD') => void;
}

export default function CurrencySwitcher({ currentCurrency, onSwitch }: CurrencySwitcherProps) {
  return (
    <div className="flex bg-gray-100/10 rounded-full p-1 border border-white/10 backdrop-blur-sm">
      <motion.button
        onClick={() => onSwitch('KHR')}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
          currentCurrency === 'KHR'
            ? 'bg-[#FF6B6B] text-white shadow-lg'
            : 'text-white/60 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        KHR
      </motion.button>
      <motion.button
        onClick={() => onSwitch('USD')}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
          currentCurrency === 'USD'
            ? 'bg-[#1AA9B7] text-white shadow-lg'
            : 'text-white/60 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        USD
      </motion.button>
    </div>
  );
}
