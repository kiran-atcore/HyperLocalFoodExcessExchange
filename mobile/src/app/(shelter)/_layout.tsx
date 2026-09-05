import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

const BUBBLES = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  left: `${Math.random() * 90 + 5}%`,
  size: Math.random() * 8 + 4,
  color: Math.random() > 0.6 ? '#0D9488' : Math.random() > 0.5 ? '#0F766E' : '#FFFFFF',
  delay: Math.random() * 5000,
  duration: Math.random() * 4000 + 4000,
  translateY: -(Math.random() * 40 + 30),
  translateX: (Math.random() - 0.5) * 50,
  opacity: Math.random() * 0.3 + 0.15,
}));

const AnimatedPillBackground = () => {
  return (
    <View
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        { borderRadius: 35, overflow: 'hidden', backgroundColor: '#022C22' },
      ]}
    >
      {BUBBLES.map((bubble) => (
        <MotiView
          key={bubble.id}
          from={{ translateY: 70, translateX: 0, opacity: 0 }}
          animate={{
            translateY: bubble.translateY,
            translateX: bubble.translateX,
            opacity: [0, bubble.opacity, 0],
          }}
          transition={{ loop: true, type: 'timing', duration: bubble.duration, delay: bubble.delay }}
          style={{
            position: 'absolute',
            left: bubble.left as any,
            width: bubble.size,
            height: bubble.size,
            borderRadius: bubble.size / 2,
            backgroundColor: bubble.color,
          }}
        />
      ))}
      <View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 35 },
        ]}
      />
    </View>
  );
};

const TabIcon = ({ name, focused }: { name: any; focused: boolean }) => {
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
      <Animated.View
        style={{
          transform: [
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3],
              }),
            },
            {
              scale: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.15],
              }),
            },
          ],
        }}
      >
        <Ionicons name={name} size={24} color={focused ? '#FFFFFF' : '#94A3B8'} />
      </Animated.View>
    </View>
  );
};

export default function ShelterTabLayout() {
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
          title: 'Surplus',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'fast-food' : 'fast-food-outline'} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Radar',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'map' : 'map-outline'} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'business' : 'business-outline'} focused={focused} />
          ),
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 32,
  },
});
