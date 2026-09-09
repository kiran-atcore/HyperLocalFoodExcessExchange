import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../utils/api';
import { AuthContext } from '../../../context/AuthContext';
import LocationBanner from '../../../components/LocationBanner';
import ProfileImagePicker from '../../../components/ProfileImagePicker';
import ButtonOne from '../../../components/ButtonOne';
import LoadingScreen from '../../../components/LoadingScreen';
import { useAlert } from '../../../context/AlertContext';

const RadarRipple = ({ initialDelay = 0 }: { initialDelay?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const startAnimation = (delay: number) => {
      if (!isMounted) return;
      anim.setValue(0);

      // Randomize to make it feel organic (water ripples / radar)
      const duration = 5000 + Math.random() * 4000; // between 5s and 9s
      const nextDelay = 200 + Math.random() * 2000; // between 0.2s and 2.2s

      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ]).start((result) => {
        if (result.finished && isMounted) {
          startAnimation(nextDelay); // recursive loop with new random delay
        }
      });
    };

    startAnimation(initialDelay);

    return () => {
      isMounted = false;
      anim.stopAnimation();
    };
  }, [anim, initialDelay]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 4.0], // Expands even further outwards
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.05, 1],
    outputRange: [0, 0.25, 0], // Quick fade in, long slow fade out
  });

  return <Animated.View style={[styles.ripple, { transform: [{ scale }], opacity }]} />;
};

export default function EditConsumerProfileScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const { login } = useContext(AuthContext);
  const { showAlert } = useAlert();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const staggerAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  // Background Blob Animations
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Looped Ambient Blob Animations
    const animateBlob = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true })
        ])
      ).start();
    };

    animateBlob(blob1, 7000);
    animateBlob(blob2, 9000);
  }, []);

  useEffect(() => {
    if (id === 'new') {
      setName((params.business_name as string) || '');
      setRegEmail((params.email as string) || '');
      setRegPassword((params.password as string) || '');
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      const data = response.data;
      setName(data.first_name || data.business_name || '');
      setPhoneNumber(data.phone_number || '');
      setAddress(data.address || '');
      setProfilePicture(data.profile_picture || null);
    } catch (e) {
      showAlert("Error", "Could not load profile", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      // Trigger Entrance Animations once data is loaded
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 20, friction: 7, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.stagger(100, staggerAnims.map(anim =>
            Animated.spring(anim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true })
          ))
        ])
      ]).start();
    }
  }, [loading]);

  const handleUpdate = async () => {
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (!name.trim()) {
      showAlert("Required Field", "Please enter your name.", "warning");
      return;
    }

    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      showAlert("Invalid Phone Number", "Please provide a valid Indian phone number (e.g. +91 9876543210).", "error");
      return;
    }



    setIsSubmitting(true);
    try {
      if (id === 'new') {
        await api.post('/users/register/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
          business_name: name.trim(),
          first_name: name.trim(),
          role: 'consumer',
          phone_number: phoneNumber.trim(),
          address: address.trim(),
          profile_picture: profilePicture,
        });

        const loginRes = await api.post('/users/login/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
        });
        await login(loginRes.data.access, loginRes.data.refresh);
        router.replace('/');
      } else {
        const payload: any = {
          first_name: name.trim(),
          business_name: name.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
          profile_picture: profilePicture,
        };
        await api.patch('/users/me/', payload);
        showAlert("Updated", "Your profile has been updated.", "success", () => {
          if (params.fromSignup === 'true' || id === 'new') {
            router.replace('/');
          } else {
            router.back();
          }
        });
      }
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      const errorMsg = e.response?.data?.email
        ? "Email is already registered."
        : (e.response?.data?.detail || "Failed to save profile. Please try again.");
      showAlert("Error", errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (params.fromSignup === 'true' || !router.canGoBack()) {
      router.replace('/(auth)/login');
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#042F2E" />
        <View style={styles.headerButtonContainer} pointerEvents="box-none">
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <LoadingScreen message="Fetching Profile..." />
      </SafeAreaView>
    );
  }

  const renderInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    placeholder: string,
    iconName: keyof typeof Ionicons.glyphMap,
    keyboardType: any = 'default',
    inputKey: string,
    isMultiline: boolean = false,
    inputRef?: any
  ) => {
    const isFocused = focusedInput === inputKey;
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef?.current?.focus()}
        style={[styles.inputContainer, isFocused && styles.inputContainerFocused, isMultiline && { alignItems: 'flex-start' }]}
      >
        <View style={[styles.iconWrapper, isFocused && styles.iconWrapperFocused]}>
          <Ionicons name={iconName} size={20} color={isFocused ? "#FFFFFF" : "#64748B"} />
        </View>
        <View style={[styles.inputContent, isMultiline && { paddingTop: 8 }]}>
          <Text style={[styles.internalLabel, isFocused && styles.internalLabelFocused]}>{label}</Text>
          <TextInput
            ref={inputRef}
            style={[styles.input, isMultiline && { height: 84, textAlignVertical: 'top' }]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType={keyboardType}
            onFocus={() => setFocusedInput(inputKey)}
            onBlur={() => setFocusedInput(null)}
            multiline={isMultiline}
            numberOfLines={isMultiline ? 3 : 1}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#042F2E" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Title layer behind ScrollView */}
        <Animated.View style={[styles.headerTextContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>{id === 'new' ? 'Setup Profile' : 'Edit Profile'}</Text>
        </Animated.View>

        <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Hyper-local Radar Ripples aligned exactly behind the avatar's center */}
          <View style={styles.rippleContainer} pointerEvents="none">
            <RadarRipple initialDelay={0} />
            <RadarRipple initialDelay={1200} />
            <RadarRipple initialDelay={2800} />
            <RadarRipple initialDelay={4000} />
          </View>

          <LinearGradient
            colors={['#F0FDFA', '#FFF1F2']}
            style={styles.sheetContainer}
          >

            {/* Overlapping Profile Picture */}
            <Animated.View style={[styles.profilePicWrapper, {
              opacity: staggerAnims[0],
              transform: [{ translateY: staggerAnims[0].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
            }]}>
              <ProfileImagePicker
                imageUri={profilePicture}
                defaultInitial={name ? name.charAt(0) : 'C'}
                onImageSelected={(img) => setProfilePicture(img)}
                onImageRemoved={() => setProfilePicture(null)}
              />
            </Animated.View>

            <View style={styles.formSection}>
              <Animated.View style={{ opacity: staggerAnims[1], transform: [{ translateY: staggerAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="person" size={14} color="#0D9488" />
                  </View>
                  <Text style={styles.sectionTitle}>Personal Details</Text>
                </View>
                {renderInput("Full Name", name, setName, "Enter your full name", "person-outline", "default", "name", false, nameRef)}
                {renderInput(`Phone Number ${id === 'new' ? '*' : ''}`, phoneNumber, setPhoneNumber, "e.g. +91 9876543210", "call-outline", "phone-pad", "phone", false, phoneRef)}
              </Animated.View>
            </View>

            <View style={styles.formSection}>
              <Animated.View style={{ opacity: staggerAnims[2], transform: [{ translateY: staggerAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="map" size={14} color="#0D9488" />
                  </View>
                  <Text style={styles.sectionTitle}>Location</Text>
                </View>
                {renderInput("Address", address, setAddress, "Enter your complete address", "map-outline", "default", "address", true, addressRef)}
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: staggerAnims[3], transform: [{ translateY: staggerAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
              <ButtonOne
                title={id === 'new' ? 'Complete Setup' : 'Save Changes'}
                onPress={handleUpdate}
                isLoading={isSubmitting}
              />
            </Animated.View>

          </LinearGradient>
        </ScrollView>

        {/* Back button layer above ScrollView */}
        <Animated.View style={[styles.headerButtonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#042F2E' }, // Deep Nordic Teal background
  rippleContainer: {
    position: 'absolute',
    top: 140, // Matches scrollContent paddingTop
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(20, 184, 166, 0.4)',
  },
  headerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    alignItems: 'center',
    paddingVertical: 14,
  },
  headerButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4, marginLeft: -8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  placeholder: { width: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 140, // Increased so the sheet sits perfectly below the absolute header
  },

  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },

  profilePicWrapper: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 24,
  },

  formSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.1)', // Soft teal backing
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainerFocused: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
    // Removed dynamic elevation/shadow to prevent Android focus looping bugs
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconWrapperFocused: {
    backgroundColor: '#0D9488',
    // Removed dynamic elevation/shadow to prevent Android focus looping bugs
  },
  inputContent: {
    flex: 1,
    justifyContent: 'center',
  },
  internalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  internalLabelFocused: {
    color: '#0D9488',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
    lineHeight: 22,
  },
});
