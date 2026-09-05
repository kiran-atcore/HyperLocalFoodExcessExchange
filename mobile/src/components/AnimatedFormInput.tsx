import React, { useRef, useState, useEffect } from 'react';
import { TextInput, TextInputProps, Animated, StyleSheet, TouchableOpacity, TouchableOpacityProps, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export function useFocusAnimation() {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Haptics.selectionAsync();
    Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.06)', '#5EEAD4'],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(2, 6, 23, 0.5)', 'rgba(15, 23, 42, 0.8)'],
  });

  const translateY = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return { isFocused, handleFocus, handleBlur, borderColor, backgroundColor, translateY, focusAnim };
}

interface AnimatedFormInputProps extends TextInputProps {
  containerStyle?: any;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  isValid?: boolean;
  onClear?: () => void;
  showStepper?: boolean;
  onStepUp?: () => void;
  onStepDown?: () => void;
}

export function AnimatedFormInput({ 
  containerStyle, 
  style, 
  onFocus, 
  onBlur, 
  leftIconName,
  prefix,
  isValid,
  onClear,
  showStepper,
  onStepUp,
  onStepDown,
  ...props 
}: AnimatedFormInputProps) {
  const { isFocused, handleFocus, handleBlur, borderColor, backgroundColor, translateY } = useFocusAnimation();
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const handleStepperPress = (action: 'up' | 'down') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    
    if (action === 'up' && onStepUp) onStepUp();
    if (action === 'down' && onStepDown) onStepDown();
  };

  const currentLength = props.value ? props.value.length : 0;
  let counterColor = '#64748B';
  if (props.maxLength) {
    const ratio = currentLength / props.maxLength;
    if (ratio >= 1) counterColor = '#F87171';
    else if (ratio >= 0.8) counterColor = '#FCD34D';
  }

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          styles.container,
          {
            borderColor,
            backgroundColor,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.inputRow, props.multiline && { alignItems: 'flex-start' }]}>
          {leftIconName && (
            <Ionicons 
              name={leftIconName} 
              size={20} 
              color={isFocused ? '#5EEAD4' : '#64748B'} 
              style={[styles.leftIcon, props.multiline && { paddingTop: 14 }]} 
            />
          )}

          {prefix && (
            <Text style={[styles.prefixText, { color: isFocused ? '#5EEAD4' : '#94A3B8' }]}>
              {prefix}
            </Text>
          )}

          <TextInput
            {...props}
            onFocus={(e) => { handleFocus(); if (onFocus) onFocus(e); }}
            onBlur={(e) => { handleBlur(); if (onBlur) onBlur(e); }}
            style={[
              styles.input, 
              props.multiline && styles.textArea, 
              (leftIconName || prefix) && { paddingLeft: 0 },
              style
            ]}
          />

          {onClear && props.value && props.value.length > 0 && !showStepper && (
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onClear(); }} style={styles.rightAction}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}

          {isValid && !showStepper && (
            <View style={styles.rightAction}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          )}

          {showStepper && (
            <Animated.View style={[styles.stepperContainer, { transform: [{ scale: bounceAnim }] }]}>
              <TouchableOpacity onPress={() => handleStepperPress('down')} style={styles.stepperBtn}>
                <Ionicons name="remove" size={16} color="#F8FAFC" />
              </TouchableOpacity>
              <View style={styles.stepperDivider} />
              <TouchableOpacity onPress={() => handleStepperPress('up')} style={styles.stepperBtn}>
                <Ionicons name="add" size={16} color="#F8FAFC" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
      
      {props.maxLength && (
        <Text style={[styles.counterText, { color: counterColor }]}>
          {currentLength}/{props.maxLength}
        </Text>
      )}
    </View>
  );
}

interface AnimatedPickerButtonProps extends TouchableOpacityProps {
  containerStyle?: any;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}

export function AnimatedPickerButton({ containerStyle, style, onPress, leftIconName, children, ...props }: AnimatedPickerButtonProps) {
  const { isFocused, handleFocus, handleBlur, borderColor, backgroundColor, translateY } = useFocusAnimation();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor,
          backgroundColor,
          transform: [{ translateY }],
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        {...props}
        onPress={(e) => { handleFocus(); setTimeout(handleBlur, 500); if (onPress) onPress(e); }}
        style={[styles.pickerBtn, style]}
        activeOpacity={0.8}
      >
        {leftIconName && (
          <Ionicons 
            name={leftIconName} 
            size={20} 
            color={isFocused ? '#5EEAD4' : '#64748B'} 
            style={styles.leftIcon} 
          />
        )}
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    paddingLeft: 16,
    paddingRight: 10,
  },
  prefixText: {
    paddingLeft: 16,
    paddingRight: 6,
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F8FAFC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  rightAction: {
    paddingRight: 16,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    marginRight: 10,
  },
  stepperBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 6,
    marginRight: 4,
  },
});
