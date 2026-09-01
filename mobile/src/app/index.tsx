import { Redirect } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function AestheticSplashScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;
  const textSlideLeft = useRef(new Animated.Value(-100)).current;
  const textSlideRight = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.spring(textSlideLeft, {
      toValue: 0,
      tension: 20,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.spring(textSlideRight, {
      toValue: 0,
      tension: 20,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse Logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();

    // Ripple Rings
    const createRingLoop = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    createRingLoop(ring1Anim, 0);
    createRingLoop(ring2Anim, 1250);
  }, []);

  const getRingStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 2.5]
      })
    }],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.2, 0]
    })
  });

  return (
    <View style={styles.splashContainer}>
      <LinearGradient colors={['#042F2E', '#0F766E']} style={StyleSheet.absoluteFill} />

      {/* Ripple Rings */}
      <Animated.View style={[styles.ring, getRingStyle(ring1Anim)]} />
      <Animated.View style={[styles.ring, getRingStyle(ring2Anim)]} />

      {/* Center Logo */}
      <Animated.View style={[styles.iconWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#F43F5E', '#FB923C']} // Rose to Coral Gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Image 
            source={require('../../assets/images/resq-logo.jpg')} 
            style={{ width: 120, height: 120, borderRadius: 60 }} 
          />
        </LinearGradient>
      </Animated.View>

      {/* Typography */}
      <Animated.View style={{ marginTop: 50, opacity: fadeAnim }}>
        <Animated.View style={{ transform: [{ translateX: textSlideLeft }] }}>
          <Text style={styles.titleBrand}>ResQ</Text>
        </Animated.View>
        <Animated.View style={{ transform: [{ translateX: textSlideRight }] }}>
          <Text style={styles.titleSub}>FOOD RESCUE</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export default function EntryScreen() {
  const { isAuthenticated, userRole, isApproved, loading } = useContext(AuthContext);
  const [isSplashReady, setIsSplashReady] = useState(false);

  useEffect(() => {
    // Artificial minimum delay of 2.5 seconds to appreciate the splash animation
    const timer = setTimeout(() => {
      setIsSplashReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !isSplashReady) {
    return <AestheticSplashScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  if (userRole === 'admin') return <Redirect href="/(admin)" />;
  
  if (!isApproved && (userRole === 'donor' || userRole === 'shelter')) {
    return <Redirect href="/(views)/approval-pending/new" />;
  }

  if (userRole === 'donor') return <Redirect href="/(donor)" />;
  if (userRole === 'shelter') return <Redirect href="/(shelter)" />;
  
  return <Redirect href="/(consumer)/deals" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#042F2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderWidth: 2,
    borderColor: '#FB923C', // Coral ring
    backgroundColor: 'rgba(251, 146, 60, 0.05)',
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 20,
    backgroundColor: '#042F2E',
    padding: 6,
  },
  iconGradient: {
    flex: 1,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBrand: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 20,
    fontWeight: '300',
    color: '#A7F3D0',
    letterSpacing: 8,
    textAlign: 'center',
    marginTop: 8,
  },
});
