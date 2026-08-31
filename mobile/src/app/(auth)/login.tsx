import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import InputField from '../../components/InputField';

const { width } = Dimensions.get('window');

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardRotateX = useRef(new Animated.Value(-20)).current;
  const staggerAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  // Background Blob Animation Values
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const blob3 = useRef(new Animated.Value(0)).current;
  const blob4 = useRef(new Animated.Value(0)).current;

  // Premium Button Animation Values
  const btnScaleAnim = useRef(new Animated.Value(1)).current;
  const arrowTranslateX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Logo Animation Values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Reset entrance values so animation replays when returning from signup
      fadeAnim.setValue(0);
      slideAnim.setValue(80);
      cardScale.setValue(0.9);
      cardRotateX.setValue(-20);
      staggerAnims.forEach(anim => anim.setValue(0));
      logoScale.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 20,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(cardRotateX, {
          toValue: 0,
          tension: 20,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(300),
          Animated.stagger(150, staggerAnims.map(anim =>
            Animated.spring(anim, {
              toValue: 1,
              tension: 40,
              friction: 7,
              useNativeDriver: true,
            })
          ))
        ]),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          delay: 500,
          useNativeDriver: true,
        })
      ]).start();
    }, [])
  );

  useEffect(() => {

    // Ambient Logo Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Looped Ambient Blob Animations
    const animateBlob = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      ).start();
    };

    animateBlob(blob1, 6000);
    animateBlob(blob2, 7500);
    animateBlob(blob3, 5000);
    animateBlob(blob4, 8000);

    // Premium Button Pulsing Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Helper for generating oscillating transform styles
  const getBlobStyle = (anim: Animated.Value, moveX: number, moveY: number, maxScale: number) => ({
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-moveX, moveX],
        })
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-moveY, moveY],
        })
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, maxScale],
        })
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'], // Full rotation to showcase irregular shapes
        })
      }
    ]
  });

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  // Clear the form state every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reset();
      setErrorMsg('');
    }, [reset])
  );

  const handleAdminLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setValue('email', 'kiranchand.0987@gmail.com');
    setValue('password', 'Kiran@Kirra@1234');
    handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMsg('');
    setIsLoading(true);
    try {
      const response = await api.post('/users/login/', {
        ...data,
        email: data.email.trim()
      });
      await login(response.data.access, response.data.refresh);
      router.replace('/');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F766E', '#0D9488']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative Animated Blobs (Professional Arrangement) */}
        {/* Top-Right Anchor */}
        <Animated.View style={[styles.blob1, getBlobStyle(blob1, 60, 80, 1.2)]}>
          <LinearGradient colors={['rgba(94, 234, 212, 0.35)', 'rgba(15, 118, 110, 0.05)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Bottom-Left Anchor */}
        <Animated.View style={[styles.blob2, getBlobStyle(blob2, 80, -60, 1.15)]}>
          <LinearGradient colors={['rgba(20, 184, 166, 0.3)', 'rgba(4, 47, 46, 0.0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Mid-Right Accent */}
        <Animated.View style={[styles.blob3, getBlobStyle(blob3, -120, -100, 1.25)]}>
          <LinearGradient colors={['rgba(45, 212, 191, 0.25)', 'rgba(13, 148, 136, 0.1)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Top-Left Accent */}
        <Animated.View style={[styles.blob4, getBlobStyle(blob4, 100, 120, 1.1)]}>
          <LinearGradient colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior="padding"
          >
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={[
                  styles.cardWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      { perspective: 1000 },
                      { translateY: slideAnim },
                      { scale: cardScale },
                      {
                        rotateX: cardRotateX.interpolate({
                          inputRange: [-20, 0],
                          outputRange: ['-20deg', '0deg']
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.card}>

                  <Animated.View style={{ opacity: staggerAnims[0], transform: [{ translateY: staggerAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.headerContainer}>
                      <Animated.View style={[
                        styles.iconContainer,
                        {
                          transform: [
                            { scale: logoScale },
                            { translateY: logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }
                          ]
                        }
                      ]}>
                        <LinearGradient
                          colors={['rgba(255, 255, 255, 0.9)', 'rgba(204, 251, 241, 0.4)']} // 3D glassy surface
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.iconInnerHighlight} />
                        <Ionicons name="leaf" size={34} color="#0D9488" style={{
                          shadowColor: '#0D9488',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 4
                        }} />
                      </Animated.View>
                      <Text style={styles.title}>Welcome Back</Text>
                      <Text style={styles.subtitle}>Hyper-Local Food Excess Exchange</Text>
                    </View>
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[1], transform: [{ translateY: staggerAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    {errorMsg ? (
                      <View>
                        <Text style={styles.errorText}>{errorMsg}</Text>
                      </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                      <InputField
                        control={control}
                        name="email"
                        errors={errors}
                        placeholder="Email Address"
                        leftIconName="mail-outline"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />

                      <InputField
                        control={control}
                        name="password"
                        errors={errors}
                        placeholder="Password"
                        leftIconName="lock-closed-outline"
                        isPassword={true}
                      />
                    </View>
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[2], transform: [{ translateY: staggerAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={{ marginTop: 12, position: 'relative' }}>
                      {/* Pulsing Aura Glow Behind Button */}
                      <Animated.View style={{
                        position: 'absolute',
                        top: 4, left: 12, right: 12, bottom: -4,
                        backgroundColor: '#FF6B6B',
                        borderRadius: 24,
                        opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
                        transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
                      }} />

                      <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
                        <TouchableOpacity
                          style={styles.buttonContainer}
                          onPress={handleSubmit(onSubmit)}
                          onPressIn={() => {
                            Animated.parallel([
                              Animated.spring(btnScaleAnim, { toValue: 0.94, friction: 5, tension: 80, useNativeDriver: true }),
                              Animated.spring(arrowTranslateX, { toValue: 6, friction: 5, tension: 80, useNativeDriver: true })
                            ]).start();
                          }}
                          onPressOut={() => {
                            Animated.parallel([
                              Animated.spring(btnScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
                              Animated.spring(arrowTranslateX, { toValue: 0, friction: 3, tension: 40, useNativeDriver: true })
                            ]).start();
                          }}
                          disabled={isLoading}
                          activeOpacity={0.9}
                        >
                          <LinearGradient
                            colors={['#FF8A8A', '#FA5252', '#E03131']}
                            locations={[0, 0.5, 1]}
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
                                <Text style={styles.buttonText}>Log In</Text>
                                <Animated.View style={{ transform: [{ translateX: arrowTranslateX }] }}>
                                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 6, marginTop: 2 }} />
                                </Animated.View>
                              </View>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[3], transform: [{ translateY: staggerAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.footerContainer}>
                      <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/register');
                      }} activeOpacity={0.6}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text></Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.adminButton} onPress={handleAdminLogin} activeOpacity={0.7}>
                        <Text style={styles.adminText}>Admin Access</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D9488',
  },
  blob1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 380,
    height: 350,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 150,
    borderBottomRightRadius: 220,
    borderBottomLeftRadius: 180,
    overflow: 'hidden',
  },
  blob2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 350,
    height: 380,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 210,
    borderBottomRightRadius: 175,
    borderBottomLeftRadius: 190,
    overflow: 'hidden',
  },
  blob3: {
    position: 'absolute',
    top: '40%',
    right: -150,
    width: 300,
    height: 280,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 160,
    borderBottomRightRadius: 120,
    borderBottomLeftRadius: 170,
    overflow: 'hidden',
  },
  blob4: {
    position: 'absolute',
    top: '15%',
    left: -120,
    width: 250,
    height: 250,
    borderTopLeftRadius: 140,
    borderTopRightRadius: 100,
    borderBottomRightRadius: 150,
    borderBottomLeftRadius: 110,
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  cardWrapper: {
    marginHorizontal: 24,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
      },
      android: {
        // Significantly softened to feel like a subtle bevel instead of a hard slab
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
        borderRightWidth: 1,
        borderRightColor: 'rgba(0, 0, 0, 0.04)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.5)',
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(255, 255, 255, 0.3)',
      }
    })
  },
  card: {
    borderRadius: 36,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#CCFBF1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconInnerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#FA5252',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600',
    backgroundColor: '#FFEAEA',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  validationError: {
    color: '#FA5252',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputFocused: {
    borderColor: '#0D9488',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  inputError: {
    borderColor: '#FA5252',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 16,
  },
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
  footerContainer: {
    marginTop: 36,
    alignItems: 'center',
    gap: 16,
  },
  linkText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '500',
  },
  linkTextBold: {
    color: '#0D9488',
    fontWeight: '800',
  },
  adminButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  adminText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700'
  }
});
