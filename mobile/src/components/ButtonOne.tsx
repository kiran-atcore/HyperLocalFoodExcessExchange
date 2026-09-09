import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface ButtonOneProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  colors?: readonly [string, string, ...string[]];
  glowColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ButtonOne({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  showArrow = false,
  colors = ['#FF8A8A', '#FA5252', '#E03131'],
  glowColor = '#FF6B6B',
  style,
}: ButtonOneProps) {
  const btnScaleAnim = useRef(new Animated.Value(1)).current;
  const arrowTranslateX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(btnScaleAnim, { toValue: 0.94, friction: 5, tension: 80, useNativeDriver: true }),
      ...(showArrow ? [Animated.spring(arrowTranslateX, { toValue: 6, friction: 5, tension: 80, useNativeDriver: true })] : [])
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(btnScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
      ...(showArrow ? [Animated.spring(arrowTranslateX, { toValue: 0, friction: 3, tension: 40, useNativeDriver: true })] : [])
    ]).start();
  };

  return (
    <View style={[{ marginTop: 12, position: 'relative' }, style]}>
      {/* Pulsing Aura Glow Behind Button */}
      <Animated.View style={{
        position: 'absolute',
        top: 4, left: 12, right: 12, bottom: -4,
        backgroundColor: glowColor,
        borderRadius: 24,
        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
        transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
      }} />

      <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading || disabled}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors as any}
            locations={colors.length === 3 ? [0, 0.5, 1] : undefined}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.buttonGradient}
          >
            {/* Glossy 3D Inner Edge */}
            <View style={styles.buttonInnerEdge} />

            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.buttonText}>{title}</Text>
                {showArrow && (
                  <Animated.View style={{ transform: [{ translateX: arrowTranslateX }] }}>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6, marginTop: 2 }} />
                  </Animated.View>
                )}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#E03131',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInnerEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
