import { useEffect, useState } from 'react';

interface StatusBarProps {
  className?: string;
  customTime?: string;
}

export default function StatusBar({
  className = '',
  customTime,
}: StatusBarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    if (customTime) {
      setTimeStr(customTime);
      return;
    }

    const updateTime = () => {
      const vnTime = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      setTimeStr(vnTime.replace(/\s/g, ''));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [customTime]);

  return (
    <div
      className={`w-full flex items-center justify-center px-4 pt-2 pb-1 text-white/95 text-[12px] sm:text-[13px] font-bold tracking-tight shrink-0 h-[22px] ${className}`}
    >
      {/* Clock display removed as requested */}
    </div>
  );
}
