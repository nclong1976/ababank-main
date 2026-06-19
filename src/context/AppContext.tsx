import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, query, collection, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase/config';

interface AppState {
  userProfile: any | null;
  balance: number | null;
  sent: any[];
  received: any[];
}

const AppContext = createContext<AppState>({ userProfile: null, balance: null, sent: [], received: [] });

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({ userProfile: null, balance: null, sent: [], received: [] });

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubSender: (() => void) | null = null;
    let unsubReceiver: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Clean up existing listeners if user changes or signs out
      if (unsubUser) unsubUser();
      if (unsubSender) unsubSender();
      if (unsubReceiver) unsubReceiver();

      if (!user) {
        setState({ userProfile: null, balance: null, sent: [], received: [] });
        return;
      }

      // Synchronize user profile
      try {
        unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setState(prev => ({
              ...prev,
              userProfile: data,
              balance: data.balance || 0,
            }));
          }
        }, (error) => {
          console.warn("Firestore user sync offline or restricted:", error.message || error);
        });
      } catch (err) {
        console.warn("Failed to attach user sync listener:", err);
      }

      // Synchronize transactions (real-time)
      try {
        const senderQuery = query(
          collection(db, 'transactions'),
          where('senderId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        unsubSender = onSnapshot(senderQuery, (snapshot) => {
          const sent = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'send' }));
          setState(prev => ({ ...prev, sent }));
        }, (error) => {
          console.warn("Firestore sender transactions offline or restricted:", error.message || error);
        });
      } catch (err) {
        console.warn("Failed to attach sender transactions listener:", err);
      }

      try {
        const receiverQuery = query(
          collection(db, 'transactions'),
          where('receiverId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        unsubReceiver = onSnapshot(receiverQuery, (snapshot) => {
          const received = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'receive' }));
          setState(prev => ({ ...prev, received }));
        }, (error) => {
          console.warn("Firestore receiver transactions offline or restricted:", error.message || error);
        });
      } catch (err) {
        console.warn("Failed to attach receiver transactions listener:", err);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUser) unsubUser();
      if (unsubSender) unsubSender();
      if (unsubReceiver) unsubReceiver();
    };
  }, []);

  const value = {
    ...state,
    transactions: [...state.sent, ...state.received].sort((a,b) => {
      const aTime = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const bTime = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return bTime - aTime;
    })
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppState = () => useContext(AppContext);
