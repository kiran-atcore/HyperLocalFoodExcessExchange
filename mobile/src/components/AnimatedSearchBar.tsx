import React, { useState } from 'react';
import { TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

interface AnimatedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  variant?: 'dark' | 'light';
}

export default function AnimatedSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  variant = 'dark'
}: AnimatedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const isDark = variant === 'dark';

  const idleBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const activeBorderColor = isDark ? 'rgba(94, 234, 212, 0.5)' : 'rgba(13, 148, 136, 0.5)';
  const idleBgColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 1)';
  const activeBgColor = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 1)';
  const iconIdleColor = isDark ? '#94A3B8' : '#64748B';
  const iconActiveColor = isDark ? '#5EEAD4' : '#0D9488';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)';
  const shadowColor = isDark ? '#5EEAD4' : '#0D9488';

  return (
    <MotiView
      animate={{
        borderColor: isFocused ? activeBorderColor : idleBorderColor,
        backgroundColor: isFocused ? activeBgColor : idleBgColor,
        shadowOpacity: isFocused ? 0.2 : 0,
        scale: isFocused ? 1.01 : 1,
      }}
      transition={{ type: 'timing', duration: 250 }}
      style={[styles.container, { shadowColor }]}
    >
      <Ionicons
        name="search"
        size={20}
        color={isFocused ? iconActiveColor : iconIdleColor}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: textColor }]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        selectionColor={iconActiveColor}
      />
      {value.length > 0 && (
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.3)"} />
          </TouchableOpacity>
        </MotiView>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearBtn: {
    padding: 4,
  }
});
