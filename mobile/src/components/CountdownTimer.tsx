import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'react-native';

export default function CountdownTimer({ targetDate, onExpire }: { targetDate: string | null, onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const hasExpiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('N/A');
      return;
    }

    const target = new Date(targetDate).getTime();
    hasExpiredRef.current = false;

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          setTimeLeft('Expired');
          if (onExpireRef.current) onExpireRef.current();
        }
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <Text style={{ color: timeLeft === 'Expired' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{timeLeft}</Text>;
}
