import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import Svg, { Path } from 'react-native-svg';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import InputField from '../../components/InputField';
import ButtonOne from '../../components/ButtonOne';
import GoogleModal, { UserRole } from '../../components/GoogleModal';

WebBrowser.maybeCompleteAuthSession();

const GoogleLogo = ({ size = 26 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </Svg>
);

const { width } = Dimensions.get('window');

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardRotateX = useRef(new Animated.Value(-20)).current;
  const staggerAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const googleButtonScale = useRef(new Animated.Value(1)).current;

  // Background Blob Animation Values
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const blob3 = useRef(new Animated.Value(0)).current;
  const blob4 = useRef(new Animated.Value(0)).current;

  // Logo Animation Values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let animationFrameId: number;

    const startAnimations = () => {
      // Reset entrance values
      fadeAnim.setValue(0);
      slideAnim.setValue(80);
      cardScale.setValue(0.9);
      cardRotateX.setValue(-20);
      staggerAnims.forEach(anim => anim.setValue(0));
      logoScale.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
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
        Animated.stagger(100, staggerAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          })
        )),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          delay: 200,
          useNativeDriver: true,
        })
      ]).start();
    };

    // Defer animation until after the initial render and transition layout
    animationFrameId = requestAnimationFrame(() => {
      startAnimations();
    });

    // Ambient Logo Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    }, [])
  );

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

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const handleGooglePressIn = () => {
    Animated.spring(googleButtonScale, {
      toValue: 0.9,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleGooglePressOut = () => {
    Animated.spring(googleButtonScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: true,
    }).start();
  };

  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

  const handleRoleSelected = async (selectedRole: UserRole) => {
    setIsGoogleModalOpen(false);
    if (!pendingGoogleToken) return;

    setIsGoogleLoading(true);
    try {
      const response = await api.post('/users/google-login/', { token: pendingGoogleToken, role: selectedRole, action: 'login' });
      await login(response.data.access, response.data.refresh);
      
      const isNewUser = response.data.is_new_user;
      const user = response.data.user;
      const userId = String(user?.id || 'new');

      Toast.show({
        type: 'success',
        text1: 'Account Created!',
        text2: 'Please complete your profile to finish setup.',
      });

      if (user?.role === 'donor') {
        router.replace({ pathname: '/(forms)/edit-kitchen-profile/[id]', params: { id: userId, fromSignup: 'true' } });
      } else if (user?.role === 'shelter') {
        router.replace({ pathname: '/(forms)/edit-shelter-profile/[id]', params: { id: userId, fromSignup: 'true' } });
      } else {
        router.replace({ pathname: '/(forms)/edit-consumer-profile/[id]', params: { id: userId, fromSignup: 'true' } });
      }
    } catch (err: any) {
      const isRoleConflict = err.response?.data?.role_conflict;
      Toast.show({
        type: 'error',
        text1: isRoleConflict ? 'Account Role Conflict' : 'Google Sign-In Error',
        text2: err.response?.data?.detail || err.message || 'Authentication failed',
        visibilityTime: 6000,
      });
    } finally {
      setIsGoogleLoading(false);
      setPendingGoogleToken(null);
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        Toast.show({
          type: 'info',
          text1: 'Google Client ID Required',
          text2: 'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in mobile/.env',
        });
        setIsGoogleLoading(false);
        return;
      }

      const redirectUri = 'https://hyperlocalfoodexcessexchange.onrender.com/api/users/google-callback/';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token%20id_token&scope=${encodeURIComponent(
        'openid email profile'
      )}&prompt=select_account&nonce=${Math.random().toString(36).substring(7)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'mobile://auth');

      if (result.type === 'success' && result.url) {
        const hash = result.url.split('#')[1] || '';
        const query = result.url.split('?')[1] || '';
        const params = new URLSearchParams(hash || query);
        const token = params.get('access_token') || params.get('id_token');

        if (token) {
          // Check if user exists first
          const checkResponse = await api.post('/users/google-login/', { token, action: 'check' });
          
          if (checkResponse.data.is_new_user) {
            setPendingGoogleToken(token);
            setIsGoogleModalOpen(true);
          } else {
            // User exists, tokens are returned
            await login(checkResponse.data.access, checkResponse.data.refresh);
            Toast.show({
              type: 'success',
              text1: 'Welcome back!',
              text2: 'Signed in with Google successfully.',
            });
            router.replace('/');
          }
        } else {
          Toast.show({
            type: 'error',
            text1: 'Sign-in Failed',
            text2: 'No authorization token returned from Google.',
          });
        }
      }
    } catch (err: any) {
      const isRoleConflict = err.response?.data?.role_conflict;
      Toast.show({
        type: 'error',
        text1: isRoleConflict ? 'Account Role Conflict' : 'Google Sign-In Error',
        text2: err.response?.data?.detail || err.message || 'Authentication failed',
        visibilityTime: 6000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
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
          colors={['#042F2E', '#0F766E']}
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
                        <Image 
                          source={require('../../../assets/images/resq-logo.jpg')}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </Animated.View>
                      <Text style={styles.title}>Welcome Back</Text>
                      <Text style={styles.subtitle}>Welcome to ResQ</Text>
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
                    <ButtonOne
                      title="Log In"
                      onPress={handleSubmit(onSubmit)}
                      isLoading={isLoading}
                      showArrow={true}
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[3], transform: [{ translateY: staggerAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or continue with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialRow}>
                      <Animated.View style={{ transform: [{ scale: googleButtonScale }] }}>
                        <TouchableOpacity
                          style={styles.googleCircleButton}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setIsGoogleModalOpen(true);
                          }}
                          onPressIn={handleGooglePressIn}
                          onPressOut={handleGooglePressOut}
                          activeOpacity={0.9}
                          disabled={isGoogleLoading}
                          accessibilityLabel="Sign in with Google"
                        >
                          {isGoogleLoading ? (
                            <ActivityIndicator size="small" color="#0D9488" />
                          ) : (
                            <View style={styles.googleCircleInner}>
                              <GoogleLogo size={26} />
                            </View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[4], transform: [{ translateY: staggerAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.footerContainer}>
                      <TouchableOpacity onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/(auth)/register');
                      }} activeOpacity={0.6}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text></Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>

                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Google Role Selection Modal */}
        <GoogleModal
          visible={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          onSelectRole={handleRoleSelected}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#042F2E',
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
    fontSize: 34,
    fontWeight: '900',
    color: '#042F2E',
    marginBottom: 6,
    letterSpacing: -0.75,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
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
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dividerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  socialRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  googleCircleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  googleCircleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
