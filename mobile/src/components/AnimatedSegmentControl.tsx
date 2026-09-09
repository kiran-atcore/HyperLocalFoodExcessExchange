import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface AnimatedSegmentControlProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  variant?: 'dark' | 'light';
}

const PADDING = 5;

export default function AnimatedSegmentControl({
  tabs,
  activeTab,
  onChange,
  variant = 'dark'
}: AnimatedSegmentControlProps) {
  // Pre-calculate immediate default width to eliminate 0-width initial mount state
  const windowWidth = Dimensions.get('window').width;
  const initialContainerWidth = Math.max(0, windowWidth - 40);
  const initialTabWidth = Math.max(0, (initialContainerWidth - PADDING * 2) / tabs.length);

  const [containerWidth, setContainerWidth] = useState(initialContainerWidth);

  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const isDark = variant === 'dark';

  const containerBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const activeBgColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#FFFFFF';

  const textIdleColor = isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748B';
  const textActiveColor = isDark ? '#0F766E' : '#0F172A';

  const tabWidth = containerWidth > 0 ? (containerWidth - PADDING * 2) / tabs.length : initialTabWidth;

  // Shared values for UI-thread driven width and position
  const tabWidthShared = useSharedValue(initialTabWidth);
  const translateX = useSharedValue(activeIndex * initialTabWidth);
  const isInitialized = useRef(false);

  // Synchronize Reanimated shared values on activeIndex or tabWidth change
  useEffect(() => {
    if (tabWidth > 0) {
      tabWidthShared.value = tabWidth;
      const targetX = activeIndex * tabWidth;
      if (!isInitialized.current) {
        translateX.value = targetX;
        isInitialized.current = true;
      } else {
        translateX.value = withSpring(targetX, {
          damping: 26,
          stiffness: 280,
          mass: 0.7
        });
      }
    }
  }, [activeIndex, tabWidth]);

  // Re-sync immediately on screen focus (prevents tab navigation freeze/offset)
  useFocusEffect(
    useCallback(() => {
      if (tabWidth > 0) {
        tabWidthShared.value = tabWidth;
        translateX.value = activeIndex * tabWidth;
      }
    }, [activeIndex, tabWidth])
  );

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    width: tabWidthShared.value,
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
          const newTabW = (w - PADDING * 2) / tabs.length;
          tabWidthShared.value = newTabW;
          if (!isInitialized.current) {
            translateX.value = activeIndex * newTabW;
            isInitialized.current = true;
          }
        }
      }}
    >
      <Animated.View
        style={[
          styles.activeBackground,
          {
            backgroundColor: activeBgColor,
          },
          animatedIndicatorStyle,
        ]}
      />

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
                  damping: 26,
                  stiffness: 280,
                  mass: 0.7
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
              numberOfLines={1}
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
    height: 48,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeBackground: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
