import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Radar ripples loop
    const createLoop = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    createLoop(anim1, 0);
    createLoop(anim2, 1250);
    
    return () => {
        anim1.stopAnimation();
        anim2.stopAnimation();
        fadeAnim.stopAnimation();
    }
  }, []);

  const createRippleStyle = (anim: Animated.Value) => {
    return {
      transform: [
        {
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 2.5]
          })
        }
      ],
      opacity: anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 0.4, 0]
      })
    };
  };

  return (
    <LinearGradient
      colors={['#042F2E', '#115E59']} // Deep Nordic Teal gradient
      style={styles.container}
    >
      <View style={styles.animationContainer}>
        {/* Radar Ripples */}
        <Animated.View style={[styles.ripple, createRippleStyle(anim1)]} />
        <Animated.View style={[styles.ripple, createRippleStyle(anim2)]} />
        
        {/* Core Glowing Orb */}
        <View style={styles.coreOrb}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      </View>
      
      {message ? (
        <Animated.Text style={[styles.messageText, { opacity: fadeAnim }]}>
          {message}
        </Animated.Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
  },
  coreOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#042F2E', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  messageText: {
    marginTop: 32,
    color: '#CCFBF1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
