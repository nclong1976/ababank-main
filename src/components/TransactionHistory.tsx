import React, { useState } from 'react';
import { useAppState } from '../context/AppContext';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: 'send' | 'receive';
  currency: string;
  timestamp: any; // Firestore Timestamp
  receiverId: string;
  senderId: string;
}

export const TransactionHistory: React.FC = () => {
  const { transactions } = useAppState();
  const [typeFilter, setTypeFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'USD' | 'KHR'>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCurrency = currencyFilter === 'all' || t.currency === currencyFilter;
    return matchesType && matchesCurrency;
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Transaction History</h2>
      
      <div className="flex flex-col gap-3 mb-6">
        {/* Type Filter */}
        <div>
          <label className="text-sm font-medium text-gray-500 mb-2 block">Transaction Type</label>
          <div className="flex gap-2">
            {(['all', 'send', 'receive'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  typeFilter === type
                    ? 'bg-[#37aeb2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type === 'send' ? 'Sent' : 'Received'}
              </button>
            ))}
          </div>
        </div>

        {/* Currency Filter */}
        <div>
          <label className="text-sm font-medium text-gray-500 mb-2 block">Currency</label>
          <div className="flex gap-2">
            {(['all', 'USD', 'KHR'] as const).map((currency) => (
              <button
                key={currency}
                onClick={() => setCurrencyFilter(currency)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  currencyFilter === currency
                    ? 'bg-[#37aeb2] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {currency === 'all' ? 'All' : currency}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <p>No transactions found.</p>
        ) : (
          filteredTransactions.map(t => (
            <div key={t.id} className="p-3 border-b flex justify-between items-center">
              <div>
                <p className="font-semibold">{t.type === 'send' ? 'Sent to' : 'Received from'} {t.type === 'send' ? t.receiverId : t.senderId}</p>
                <p className="text-sm text-gray-500">
                  {t.timestamp?.toDate ? format(t.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss') : 'Loading...'}
                </p>
              </div>
              <p className={`font-bold ${t.type === 'send' ? 'text-red-500' : 'text-green-500'}`}>
                {t.type === 'send' ? '-' : '+'}{t.amount} {t.currency}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
