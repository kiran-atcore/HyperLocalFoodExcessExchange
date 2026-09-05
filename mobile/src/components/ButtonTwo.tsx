import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

export interface ButtonTwoProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  disabled?: boolean;
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: Haptics.ImpactFeedbackStyle;
  sheen?: boolean;
}

export default function ButtonTwo({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  colors = ['#042F2E', '#0D9488'],
  style,
  contentStyle,
  textStyle,
  hapticFeedback = Haptics.ImpactFeedbackStyle.Medium,
  sheen = true,
}: ButtonTwoProps) {
  const handlePress = () => {
    if (disabled || isLoading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(hapticFeedback);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, (disabled || isLoading) && styles.disabled]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled || isLoading}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, contentStyle]}
      >
        {sheen && !isLoading && !disabled && (
          <MotiView
            from={{ translateX: -140 }}
            animate={{ translateX: 360 }}
            transition={{ loop: true, type: 'timing', duration: 3000, delay: 600 }}
            pointerEvents="none"
            style={styles.sheenContainer}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0.35)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sheenGradient}
            />
          </MotiView>
        )}

        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons name={icon} size={20} color="#FFFFFF" style={styles.leftIcon} />
            )}
            <Text style={[styles.text, textStyle]} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons name={icon} size={20} color="#FFFFFF" style={styles.rightIcon} />
            )}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  sheenContainer: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    width: 65,
    transform: [{ skewX: '-28deg' }],
  },
  sheenGradient: {
    width: '100%',
    height: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});
