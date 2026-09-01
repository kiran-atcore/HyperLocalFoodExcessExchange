import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import InputField from '../../components/InputField';
import ButtonOne from '../../components/ButtonOne';

const { width } = Dimensions.get('window');

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), undefined], 'Passwords must match')
    .required('Confirm password is required'),
});

export default function RegisterScreen() {
  const { login } = useContext(AuthContext);
  const [role, setRole] = useState('consumer');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Segmented Control Animation Values
  const [segmentWidth, setSegmentWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const ROLES = [
    { id: 'consumer', label: 'Consumer', icon: 'person' as const },
    { id: 'donor', label: 'Kitchen', icon: 'restaurant' as const },
    { id: 'shelter', label: 'Shelter', icon: 'home' as const },
  ];

  // Entrance Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardRotateX = useRef(new Animated.Value(-20)).current;
  const staggerAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  // Background Blob Animation Values
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const blob3 = useRef(new Animated.Value(0)).current;
  const blob4 = useRef(new Animated.Value(0)).current;

  // Logo Animation Values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  // Animate the sliding segmented control highlight
  useEffect(() => {
    if (segmentWidth > 0) {
      const index = ROLES.findIndex(r => r.id === role);
      Animated.spring(indicatorAnim, {
        toValue: index * segmentWidth,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    }
  }, [role, segmentWidth]);

  useEffect(() => {
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
  }, []);

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
          outputRange: ['0deg', '360deg'],
        })
      }
    ]
  });

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  // Clear the form state every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reset();
      setErrorMsg('');
    }, [reset])
  );

  const onSubmit = async (data: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setErrorMsg('');
    setIsLoading(true);
    try {
      const params = {
        email: data.email.trim(),
        password: data.password,
        role: role
      };

      if (role === 'donor') {
        router.replace({ pathname: '/(forms)/edit-kitchen-profile/[id]', params: { ...params, id: 'new' } });
      } else if (role === 'shelter') {
        router.replace({ pathname: '/(forms)/edit-shelter-profile/[id]', params: { ...params, id: 'new' } });
      } else {
        router.replace({ pathname: '/(forms)/edit-consumer-profile/[id]', params: { ...params, id: 'new' } });
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (err.response?.data?.email) {
        setErrorMsg('Email is already in use. Please log in.');
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
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

        {/* Decorative Animated Blobs */}
        <Animated.View style={[styles.blob1, getBlobStyle(blob1, 60, 80, 1.2)]}>
          <LinearGradient colors={['rgba(94, 234, 212, 0.35)', 'rgba(15, 118, 110, 0.05)']} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.blob2, getBlobStyle(blob2, 80, -60, 1.15)]}>
          <LinearGradient colors={['rgba(20, 184, 166, 0.3)', 'rgba(4, 47, 46, 0.0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.blob3, getBlobStyle(blob3, -120, -100, 1.25)]}>
          <LinearGradient colors={['rgba(45, 212, 191, 0.25)', 'rgba(13, 148, 136, 0.1)']} style={StyleSheet.absoluteFill} />
        </Animated.View>
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
                      <Text style={styles.title}>Create Account</Text>
                      <Text style={styles.subtitle}>Join ResQ</Text>
                    </View>
                  </Animated.View>

                  {errorMsg ? (
                    <View>
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  ) : null}

                  <Animated.View style={{ opacity: staggerAnims[1], transform: [{ translateY: staggerAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    {/* Premium Segmented Control with Icons */}
                    <View 
                      style={styles.roleContainer}
                      onLayout={(e) => setSegmentWidth((e.nativeEvent.layout.width - 12) / 3)}
                    >
                      {segmentWidth > 0 && (
                        <Animated.View style={[
                          styles.roleActiveIndicator, 
                          { width: segmentWidth, transform: [{ translateX: indicatorAnim }] }
                        ]} />
                      )}
                      
                      {ROLES.map((r) => {
                        const isActive = role === r.id;
                        return (
                          <TouchableOpacity
                            key={r.id}
                            style={styles.roleBtn}
                            onPress={() => {
                              if (!isActive) {
                                Haptics.selectionAsync();
                                setRole(r.id);
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }}>
                              <Ionicons 
                                name={isActive ? r.icon : `${r.icon}-outline` as any} 
                                size={18} 
                                color={isActive ? '#0D9488' : '#6B7280'} 
                                style={{ marginBottom: 4 }}
                              />
                              <Text style={[styles.roleText, isActive && styles.roleTextActive]} numberOfLines={1} adjustsFontSizeToFit>
                                {r.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[2], transform: [{ translateY: staggerAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <InputField
                      key="email"
                      control={control}
                      name="email"
                      errors={errors}
                      placeholder="Email Address"
                      leftIconName="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textContentType="emailAddress"
                    />

                    <InputField
                      key="password"
                      control={control}
                      name="password"
                      errors={errors}
                      placeholder="Password"
                      leftIconName="lock-closed-outline"
                      isPassword={true}
                      textContentType="password"
                    />

                    <InputField
                      key="confirmPassword"
                      control={control}
                      name="confirmPassword"
                      errors={errors}
                      placeholder="Confirm Password"
                      leftIconName="shield-checkmark-outline"
                      isPassword={true}
                      textContentType="password"
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[3], transform: [{ translateY: staggerAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <ButtonOne
                      title="Sign Up"
                      onPress={handleSubmit(onSubmit)}
                      isLoading={isLoading}
                      showArrow={true}
                    />
                  </Animated.View>

                  <Animated.View style={{ opacity: staggerAnims[4], transform: [{ translateY: staggerAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                    <View style={styles.footerContainer}>
                      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
                        <Text style={styles.footerText}>
                          Already have an account? <Text style={styles.footerLink}>Log in</Text>
                        </Text>
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
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleContainer: {
    flexDirection: 'row',
    position: 'relative', // for absolute indicator
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: 6,
    borderRadius: 20, // Modern pill shape
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  roleActiveIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(13, 148, 136, 0.1)',
      }
    }),
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    zIndex: 1, // ensure text sits above indicator
  },
  roleText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  roleTextActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  footerContainer: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '500',
  },
  footerLink: {
    color: '#0D9488',
    fontWeight: '800',
  },
});
