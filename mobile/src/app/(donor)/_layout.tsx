import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRef, useEffect } from 'react';
import { MotiView } from 'moti';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

const BUBBLES = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 90 + 5}%`,
  size: Math.random() * 8 + 4,
  color: Math.random() > 0.6 ? '#0D9488' : (Math.random() > 0.5 ? '#0F766E' : '#FFFFFF'),
  delay: Math.random() * 5000,
  duration: Math.random() * 4000 + 4000,
  translateY: -(Math.random() * 40 + 30),
  translateX: (Math.random() - 0.5) * 50,
  opacity: Math.random() * 0.3 + 0.15,
}));

const AnimatedPillBackground = () => {
  return (
    <View style={[StyleSheet.absoluteFill, { borderRadius: 35, overflow: 'hidden', backgroundColor: '#022C22' }]}>
      {BUBBLES.map((bubble) => (
        <MotiView
          key={bubble.id}
          from={{ translateY: 70, translateX: 0, opacity: 0 }}
          animate={{ translateY: bubble.translateY, translateX: bubble.translateX, opacity: [0, bubble.opacity, 0] }}
          transition={{ loop: true, type: 'timing', duration: bubble.duration, delay: bubble.delay }}
          style={{
            position: 'absolute',
            left: bubble.left as any,
            width: bubble.size,
            height: bubble.size,
            borderRadius: bubble.size / 2,
            backgroundColor: bubble.color
          }}
        />
      ))}
      <View style={[StyleSheet.absoluteFill, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 35 }]} />
    </View>
  );
};

// Custom component for the active icon with a glowing dot
const TabIcon = ({ name, focused }: { name: any, focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={{ transform: [{ translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }, { scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }] }}>
        <Ionicons name={name} size={24} color={focused ? '#FFFFFF' : '#94A3B8'} />
      </Animated.View>
    </View>
  );
};

// Extremely custom Verify Button for the center
const VerifyIcon = ({ focused }: { focused: boolean }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[
      styles.verifyContainer,
      {
        transform: [{
          scale: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] })
        }]
      }
    ]}>
      <LinearGradient
        colors={['#0D9488', '#0F766E']}
        style={styles.verifyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="scan" size={28} color="#FFFFFF" />
        {/* Soft Breathing Inner Sheen (replaces the radar ping) */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ loop: true, type: 'timing', duration: 1800 }}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: 30, backgroundColor: '#FFFFFF' }]}
        />
      </LinearGradient>
      {/* Outer Glow */}
      <View style={styles.verifyGlow} />
    </Animated.View>
  );
};

export default function DonorTabLayout() {
  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { height: 70, justifyContent: 'center', alignItems: 'center' },
        tabBarBackground: () => <AnimatedPillBackground />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kitchen',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "restaurant" : "restaurant-outline"} focused={focused} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "cube" : "cube-outline"} focused={focused} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Verify',
          tabBarIcon: ({ focused }) => <VerifyIcon focused={focused} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        }}
      />
      <Tabs.Screen
        name="tax"
        options={{
          title: 'Tax Docs',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "document-text" : "document-text-outline"} focused={focused} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />,
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 25,
    right: 25,
    height: 70,
    marginHorizontal: 10,
    borderRadius: 35,
    borderWidth: 1.75,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 8,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    backgroundColor: 'transparent',
    paddingHorizontal: 15,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 47, 46, 0.4)', // Deep Teal tint over the blur
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 32,
  },
  verifyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -20, // Make it pop out of the tab bar
  },
  verifyGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#022C22', // Matches the new dark background for a clean cut-out effect
    zIndex: 2,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyGlow: {
    display: 'none', // Removed cartoonish glow for a cleaner, professional look
  }
});
