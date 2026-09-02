import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

export default function CountdownTimer({ targetDate, onExpire }: { targetDate: string | null, onExpire?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
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
          setIsUrgent(true);
          if (onExpireRef.current) onExpireRef.current();
        }
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setIsUrgent(hours === 0 && minutes < 30); // Urgent if less than 30 mins
      
      // Formatting to keep it compact
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <MotiView
      animate={{
        scale: isUrgent ? [1, 1.05, 1] : 1,
        opacity: isUrgent ? [0.7, 1, 0.7] : 1,
      }}
      transition={
        isUrgent
          ? {
              loop: true,
              type: 'timing',
              duration: 1000,
            }
          : { type: 'timing' }
      }
      style={styles.container}
    >
      <Text style={[styles.text, { color: timeLeft === 'Expired' ? '#EF4444' : '#FFE4E6' }]}>
        {timeLeft}
      </Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'], // Crucial for timers to prevent layout shifting
    letterSpacing: 0.5,
  }
});
