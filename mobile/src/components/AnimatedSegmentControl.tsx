import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface AnimatedSegmentControlProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  variant?: 'dark' | 'light';
}

export default function AnimatedSegmentControl({
  tabs,
  activeTab,
  onChange,
  variant = 'dark'
}: AnimatedSegmentControlProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const isDark = variant === 'dark';

  // Premium, airy color palette
  const containerBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const activeBgColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#FFFFFF';

  const textIdleColor = isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748B';
  const textActiveColor = isDark ? '#0F766E' : '#0F172A';

  // Geometry
  const PADDING = 8;
  const tabWidth = containerWidth > 0 ? (containerWidth - (PADDING * 2)) / tabs.length : 0;

  const translateX = useSharedValue(0);
  const isInitialized = useRef(false);

  // Sync position on activeIndex or tabWidth change
  useEffect(() => {
    if (tabWidth > 0) {
      const targetX = activeIndex * tabWidth;
      if (!isInitialized.current) {
        translateX.value = targetX;
        isInitialized.current = true;
      } else {
        translateX.value = withSpring(targetX, {
          damping: 24,
          stiffness: 250,
          mass: 0.8
        });
      }
    }
  }, [activeIndex, tabWidth]);

  // Force-sync immediately on screen focus to prevent native unfreeze transform desync
  useFocusEffect(
    useCallback(() => {
      if (tabWidth > 0) {
        translateX.value = activeIndex * tabWidth;
      }
    }, [activeIndex, tabWidth])
  );

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: containerBgColor,
          padding: PADDING,
        }
      ]}
      onLayout={(e: LayoutChangeEvent) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - containerWidth) > 0.5) {
          setContainerWidth(w);
        }
      }}
    >
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.activeBackground,
            {
              width: tabWidth,
              backgroundColor: activeBgColor,
            },
            animatedIndicatorStyle,
          ]}
        />
      )}

      {tabs.map((tab, index) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.selectionAsync();
              if (tabWidth > 0) {
                translateX.value = withSpring(index * tabWidth, {
                  damping: 24,
                  stiffness: 250,
                  mass: 0.8
                });
              }
              if (!isActive) {
                onChange(tab);
              }
            }}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? textActiveColor : textIdleColor,
                  fontWeight: isActive ? '700' : '500',
                }
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    height: 50, // Generous modern touch target height
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeBackground: {
    position: 'absolute',
    top: 7,
    bottom: 7,
    left: 7,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 15,
    letterSpacing: 1,
  },
});
