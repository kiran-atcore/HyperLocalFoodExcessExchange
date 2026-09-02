import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent, Text } from 'react-native';
import { MotiView } from 'moti';
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

  const activeIndex = tabs.indexOf(activeTab);
  const isDark = variant === 'dark';

  // Premium, airy color palette
  const containerBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const activeBgColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#FFFFFF';

  const textIdleColor = isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748B';
  const textActiveColor = isDark ? '#0F766E' : '#0F172A';

  // Geometry
  const PADDING = 8;
  const tabWidth = containerWidth > 0 ? (containerWidth - (PADDING * 2)) / tabs.length : 0;

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
        setContainerWidth(e.nativeEvent.layout.width);
      }}
    >
      {tabWidth > 0 && (
        <MotiView
          style={[
            styles.activeBackground,
            {
              width: tabWidth,
              backgroundColor: activeBgColor,
            }
          ]}
          animate={{
            translateX: activeIndex * tabWidth,
          }}
          transition={{
            type: 'spring',
            damping: 24,
            stiffness: 250,
            mass: 0.8
          }}
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
              if (!isActive) {
                Haptics.selectionAsync();
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
