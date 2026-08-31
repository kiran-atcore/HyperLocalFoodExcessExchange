import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps, Animated } from 'react-native';
import { Controller, FieldErrors } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

interface InputFieldProps extends TextInputProps {
  control: any;
  name: string;
  errors: FieldErrors<any>;
  placeholder: string;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export default function InputField({
  control,
  name,
  errors,
  placeholder,
  leftIconName,
  isPassword = false,
  ...textInputProps
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const errorMessage = errors?.[name]?.message as string;

  // React Native's core Animated API (Bulletproof, zero crashes, zero React re-renders on focus)
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(textInputProps.defaultValue ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const errorAnim = useRef(new Animated.Value(0)).current;

  // Track focus safely without causing React state re-renders
  const isFocusedRef = useRef(false);

  // Run error animation if error appears
  useEffect(() => {
    if (errorMessage) {
      Animated.spring(errorAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true
      }).start();
    } else {
      errorAnim.setValue(0);
    }
  }, [errorMessage]);

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.4)', '#0D9488']
  });

  const animatedBackgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 0.6)', '#FFFFFF']
  });

  const animatedElevation = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6]
  });

  // Floating Label Interpolations
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 10] // Floats to 10 to give breathing room from the top border
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12]
  });
  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9CA3AF', '#0D9488']
  });
  const animatedHeight = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [64, 76] // Physically expands the box height when focused OR when text is present
  });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => {

        useEffect(() => {
          if (value || isFocusedRef.current) {
            Animated.timing(labelAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
          } else {
            Animated.timing(labelAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          }
        }, [value]);

        return (
          <View style={styles.container}>
            <Animated.View style={[
              styles.inputBox,
              {
                height: animatedHeight,
                borderColor: errorMessage ? '#FA5252' : animatedBorderColor,
                backgroundColor: errorMessage ? '#FFFFFF' : animatedBackgroundColor,
                elevation: errorMessage ? 0 : animatedElevation,
                shadowOpacity: errorMessage ? 0 : focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
                shadowRadius: 16,
                shadowColor: '#0D9488',
                shadowOffset: { width: 0, height: 6 },
                transform: [{ scale: scaleAnim }]
              }
            ]}>

              <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />

              {/* Floating Label */}
              <Animated.Text
                style={{
                  position: 'absolute',
                  left: leftIconName ? 48 : 20,
                  top: labelTop,
                  fontSize: labelFontSize,
                  color: errorMessage ? '#FA5252' : labelColor,
                  fontWeight: '600',
                  zIndex: 1,
                }}
                pointerEvents="none"
              >
                {placeholder}
              </Animated.Text>

              {/* Dynamic Content Wrapper: Pushes text and icons DOWN when focused or filled to create breathing room */}
              <Animated.View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  transform: [{
                    translateY: labelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 6] // Physically separates text from the floating label
                    })
                  }]
                }}
              >
                {leftIconName && (
                  <View style={styles.leftIconContainer}>
                    <Ionicons
                      name={leftIconName}
                      size={20}
                      color={errorMessage ? "#FA5252" : "#9CA3AF"}
                    />
                  </View>
                )}

                <TextInput
                  style={[
                    styles.textInput,
                    leftIconName ? { paddingLeft: 12 } : { paddingLeft: 20 },
                    isPassword ? { paddingRight: 12 } : { paddingRight: 20 }
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onFocus={() => {
                    isFocusedRef.current = true;

                    Animated.parallel([
                      Animated.timing(focusAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                      Animated.timing(labelAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
                    ]).start();

                    Animated.sequence([
                      Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: false }),
                      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 40, useNativeDriver: false })
                    ]).start();
                  }}
                  onBlur={() => {
                    isFocusedRef.current = false;

                    Animated.timing(focusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                    if (!value) {
                      Animated.timing(labelAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
                    }

                    onBlur();
                  }}
                  secureTextEntry={isPassword && !showPassword}
                  {...textInputProps}
                />

                {isPassword && (
                  <TouchableOpacity
                    style={styles.eyeIconContainer}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPassword(!showPassword);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                )}
              </Animated.View>
            </Animated.View>

            {errorMessage && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorAnim,
                    transform: [{
                      translateY: errorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-5, 0]
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="alert-circle" size={14} color="#FA5252" style={{ marginRight: 4 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  leftIconContainer: {
    paddingLeft: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  textInput: {
    flex: 1,
    paddingVertical: 18, // Equal padding restores the original perfect text centering
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    zIndex: 2,
  },
  eyeIconContainer: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 6,
  },
  errorText: {
    color: '#FA5252',
    fontSize: 13,
    fontWeight: '500',
  },
});
