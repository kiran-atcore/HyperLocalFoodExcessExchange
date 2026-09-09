import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, DeviceEventEmitter, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../utils/api';
import LocationBanner from '../../../components/LocationBanner';
import ProfileImagePicker from '../../../components/ProfileImagePicker';
import ButtonOne from '../../../components/ButtonOne';
import LoadingScreen from '../../../components/LoadingScreen';
import * as Location from 'expo-location';
import { AuthContext } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';

const RadarRipple = ({ initialDelay = 0 }: { initialDelay?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    const startAnimation = (delay: number) => {
      if (!isMounted) return;
      anim.setValue(0);

      const duration = 5000 + Math.random() * 4000;
      const nextDelay = 200 + Math.random() * 2000;

      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        })
      ]).start((result) => {
        if (result.finished && isMounted) {
          startAnimation(nextDelay);
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
    outputRange: [0.5, 4.0],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.05, 1],
    outputRange: [0, 0.25, 0],
  });

  return <Animated.View style={[styles.ripple, { transform: [{ scale }], opacity }]} />;
};

export default function EditShelterProfileScreen() {
  const params = useLocalSearchParams();
  const id = params.id;
  const { login } = React.useContext(AuthContext);
  const { showAlert } = useAlert();

  const [businessName, setBusinessName] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasManualLocation = useRef(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const staggerAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  // Refs for manual focus
  const bNameRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);

  useEffect(() => {
    if (id === 'new') {
      setBusinessName((params.business_name as string) || '');
      setRegEmail((params.email as string) || '');
      setRegPassword((params.password as string) || '');
      setRegRole((params.role as string) || '');
      setAddress('Fetching location...');
      fetchCurrentLocation();
      setLoading(false);
    } else {
      fetchProfile();
    }

    const subscription = DeviceEventEmitter.addListener('onLocationSelected', (data) => {
      hasManualLocation.current = true;
      if (data.address) setAddress(data.address);
      if (data.lat && data.lng) {
        setLat(data.lat);
        setLng(data.lng);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
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

  const fetchCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAddress('');
        return;
      }
      let location;
      try {
        location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (e) {
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        setAddress('');
        return;
      }

      const { latitude, longitude } = location.coords;
      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (hasManualLocation.current) return;

      setLat(latitude);
      setLng(longitude);

      if (geocode.length > 0) {
        const addr = geocode[0];
        const addressString = [addr.name, addr.street, addr.city, addr.region, addr.country].filter(Boolean).join(', ');
        setAddress(addressString);
      } else {
        setAddress('Current Location');
      }
    } catch (error) {
      console.log('Error fetching location', error);
      setAddress('');
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/');
      const data = response.data;
      setBusinessName(data.business_name || '');
      setName(data.first_name || '');
      setPhoneNumber(data.phone_number || '');
      setAddress(data.address || '');
      setLat(data.latitude || null);
      setLng(data.longitude || null);
      setProfilePicture(data.profile_picture || null);
    } catch (error) {
      console.error(error);
      showAlert("Error", "Could not load profile", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    const cleanPhone = phoneNumber.replace(/\s+/g, '');

    if (!businessName.trim()) {
      showAlert("Required Field", "Please enter the Shelter/NGO Name.", "warning");
      return;
    }
    if (!name.trim()) {
      showAlert("Required Field", "Please enter the Coordinator/Representative Name.", "warning");
      return;
    }
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      showAlert("Invalid Phone Number", "Please provide a valid Indian phone number (e.g. +91 9876543210).", "error");
      return;
    }
    if (!lat || !lng || !address) {
      showAlert("Required Field", "Please select your location from the map.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      if (id === 'new') {
        await api.post('/users/register/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
          business_name: businessName,
          first_name: name,
          role: regRole || (params.role as string),
          phone_number: phoneNumber,
          address: address,
          latitude: lat,
          longitude: lng,
          profile_picture: profilePicture,
        });

        const loginRes = await api.post('/users/login/', {
          email: regEmail || (params.email as string),
          password: regPassword || (params.password as string),
        });
        await login(loginRes.data.access, loginRes.data.refresh);
        showAlert("Request Sent", "Your account is pending admin approval.", "success", () => {
          router.replace('/');
        });
      } else {
        const payload = {
          business_name: businessName,
          first_name: name,
          phone_number: phoneNumber,
          address: address,
          latitude: lat,
          longitude: lng,
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
    } catch (error: any) {
      console.error(error);
      showAlert("Error", "Failed to update profile", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMap = () => {
    if (lat && lng) {
      router.push(`/(views)/map/location?lat=${lat}&lng=${lng}` as any);
    } else {
      router.push('/(views)/map/location' as any);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#042F2E" />
        <View style={styles.headerButtonContainer} pointerEvents="box-none">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <LoadingScreen message="Fetching Profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#042F2E" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Title layer behind ScrollView */}
        <Animated.View style={[styles.headerTextContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>{id === 'new' ? 'Shelter Setup' : 'Edit Profile'}</Text>
        </Animated.View>

        <ScrollView style={{ flex: 1, zIndex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

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
            <Animated.View style={[styles.profilePicWrapper, {
              opacity: staggerAnims[0],
              transform: [{ translateY: staggerAnims[0].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
            }]}>
              <ProfileImagePicker
                imageUri={profilePicture}
                defaultInitial={businessName ? businessName.charAt(0) : 'S'}
                defaultIcon="business"
                onImageSelected={(img) => setProfilePicture(img)}
                onImageRemoved={() => setProfilePicture(null)}
              />
            </Animated.View>

            <View style={styles.formSection}>
              <Animated.View style={{ opacity: staggerAnims[1], transform: [{ translateY: staggerAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="business" size={14} color="#0D9488" />
                  </View>
                  <Text style={styles.sectionTitle}>Organization Details</Text>
                </View>

                {renderInput(
                  "Shelter / NGO Name *",
                  businessName,
                  setBusinessName,
                  "e.g. Hope Shelter Organization",
                  "business-outline",
                  "default",
                  "off",
                  false,
                  bNameRef
                )}

                {renderInput(
                  "Coordinator / Representative Name *",
                  name,
                  setName,
                  "e.g. Jane Doe",
                  "person-outline",
                  "default",
                  "name",
                  false,
                  nameRef
                )}

                {renderInput(
                  "Phone Number *",
                  phoneNumber,
                  setPhoneNumber,
                  "e.g. +91 9876543210",
                  "call-outline",
                  "phone-pad",
                  "tel",
                  false,
                  phoneRef
                )}
              </Animated.View>
            </View>

            <View style={styles.formSection}>
              <Animated.View style={{ opacity: staggerAnims[2], transform: [{ translateY: staggerAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="map" size={14} color="#0D9488" />
                  </View>
                  <Text style={styles.sectionTitle}>Location Details</Text>
                </View>

                <LocationBanner
                  address={address}
                  onLocationChange={(newAddress, newLat, newLng) => {
                    setAddress(newAddress);
                    if (newLat && newLng) {
                      setLat(newLat);
                      setLng(newLng);
                    }
                  }}
                  onMapPress={openMap}
                />
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#042F2E' },
  rippleContainer: {
    position: 'absolute',
    top: 140,
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
    paddingTop: 140,
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
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
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
