import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import api from '../../../utils/api';
import FoodImageUploader from '../../../components/FoodImageUploader';
import { AnimatedFormInput, AnimatedPickerButton } from '../../../components/AnimatedFormInput';
import ThemeDateTimePickerModal from '../../../components/ThemeDateTimePickerModal';
import ButtonTwo from '../../../components/ButtonTwo';
import { useAlert } from '../../../context/AlertContext';

export default function PostSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [quantityUnit, setQuantityUnit] = useState('portions');
  const [dietaryInfo, setDietaryInfo] = useState('None');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isDonation, setIsDonation] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userAddress, setUserAddress] = useState('');
  const [pickupEnd, setPickupEnd] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitScrollEnd, setUnitScrollEnd] = useState(false);
  const [dietaryScrollEnd, setDietaryScrollEnd] = useState(false);
  const { showAlert } = useAlert();

  const handleUnitScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isEnd = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
    if (isEnd !== unitScrollEnd) {
      setUnitScrollEnd(isEnd);
    }
  };

  const handleDietaryScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isEnd = layoutMeasurement.width + contentOffset.x >= contentSize.width - 20;
    if (isEnd !== dietaryScrollEnd) {
      setDietaryScrollEnd(isEnd);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me/');
        if (response.data.latitude && response.data.longitude) {
          setUserLat(response.data.latitude);
          setUserLng(response.data.longitude);
          setUserAddress(response.data.address || 'Pickup at Kitchen');
        }
      } catch (e) {
        console.error("Failed to load kitchen profile location", e);
      }
    };
    fetchProfile();
  }, []);

  const handleOpenPicker = () => {
    Haptics.selectionAsync();
    setShowDatePicker(true);
  };

  const handleGetEstimate = async () => {
    if (!title) {
      showAlert("Missing Info", "Please enter a title to get an AI estimate.", "warning");
      return;
    }
    setIsEstimating(true);
    try {
      const response = await api.post('/listings/estimate_value/', {
        title,
        description,
        quantity_available: parseInt(quantity) || 1,
        quantity_unit: quantityUnit,
        listing_type: isDonation ? 'DONATION' : 'DISCOUNT'
      });
      const suggestedVal = response.data.suggested_value_inr;
      setAiEstimate(suggestedVal.toString());
      if (!originalPrice || originalPrice === '0.00' || originalPrice === '0') {
        setOriginalPrice(suggestedVal.toString());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      showAlert("Error", "Failed to get AI estimate", "error");
    } finally {
      setIsEstimating(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showAlert("Title Required", "Please provide a title for the surplus item.", "warning");
      return;
    }
    if (!description.trim()) {
      showAlert("Description Required", "Please describe the food items.", "warning");
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      showAlert("Quantity Required", "Please enter a valid quantity greater than zero.", "warning");
      return;
    }
    if (!pickupEnd || pickupEnd.getTime() <= Date.now()) {
      showAlert("Invalid Deadline", "Please set a valid future pickup deadline.", "warning");
      return;
    }
    if (isDonation && !quantityUnit) {
      showAlert("Unit Required", "Please select a quantity unit.", "warning");
      return;
    }
    if (!dietaryInfo) {
      showAlert("Dietary Info Required", "Please select dietary information.", "warning");
      return;
    }
    const parsedOriginalPrice = parseFloat(originalPrice);
    if (!originalPrice || isNaN(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      showAlert(
        isDonation ? "Estimated Value Required" : "Original Price Required",
        isDonation 
          ? "Please provide an estimated fair market value for tax and reporting purposes." 
          : "Please enter an original price greater than ₹0.",
        "warning"
      );
      return;
    }
    if (!isDonation) {
      const parsedDiscountPrice = parseFloat(discountPrice);
      if (!discountPrice || isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
        showAlert("Discount Price Required", "Please enter a discount price (can be ₹0 for free).", "warning");
        return;
      }
      if (parsedDiscountPrice > parsedOriginalPrice) {
        showAlert("Invalid Price", "Discount price cannot exceed original price.", "warning");
        return;
      }
    }
    if (!isCertified) {
      showAlert("Certification Required", "Please certify food safety before publishing.", "warning");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        listing_type: isDonation ? 'DONATION' : 'DISCOUNT',
        original_price: originalPrice || '0.00',
        discounted_price: isDonation ? '0.00' : (discountPrice || '0.00'),
        estimated_fmv: originalPrice || '0.00',
        quantity_available: parsedQty,
        quantity_unit: quantityUnit,
        dietary_info: dietaryInfo,
        additional_details: additionalDetails,
        image: image,
        latitude: userLat || 8.5241,
        longitude: userLng || 76.9366,
        pickup_address: userAddress || "Kitchen Location",
        pickup_start: new Date().toISOString(),
        pickup_end: pickupEnd.toISOString(),
        is_active: true
      };
      
      await api.post('/listings/', payload);
      showAlert("Success", "Your food excess listing has been published!", "success", () => router.replace('/(donor)'));
    } catch (e: any) {
      console.error(e.response?.data || e.message);
      showAlert("Error", "Failed to publish listing", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dietaryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'None': 'restaurant-outline',
    'Veg': 'leaf-outline',
    'Non-Veg': 'nutrition-outline',
    'Vegan': 'flower-outline',
    'Halal': 'moon-outline',
    'Kosher': 'star-outline'
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#042F2E', '#0f172a']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <MotiView 
            from={{ opacity: 0, translateY: -16 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: 'spring', damping: 18, stiffness: 140 }}
            style={styles.header}
          >
            <TouchableOpacity style={styles.backBtnPill} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
            </TouchableOpacity>
            <View style={styles.headerTitleWrapper}>
              <MotiView 
                from={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ type: 'spring', damping: 16, delay: 100 }}
                style={styles.headerBadge}
              >
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.headerBadgeText}>NEW LISTING</Text>
              </MotiView>
              <Text style={styles.headerTitle}>Publish Surplus</Text>
            </View>
            <View style={styles.headerRightBadge}>
              <Ionicons name="leaf-outline" size={16} color="#5EEAD4" />
            </View>
          </MotiView>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <MotiView 
              from={{ opacity: 0, translateY: 20, scale: 0.97 }} 
              animate={{ opacity: 1, translateY: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 60 }}
            >
              <FoodImageUploader
                imageUri={image}
                onImageSelected={(img) => setImage(img)}
                onImageRemoved={() => setImage(null)}
              />
            </MotiView>

            <MotiView 
              from={{ opacity: 0, translateY: 20, scale: 0.97 }} 
              animate={{ opacity: 1, translateY: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 140 }}
            >
              <View style={[styles.donationToggleCard, isDonation && styles.donationToggleActive]}>
                <LinearGradient
                  colors={isDonation ? ['rgba(14, 165, 233, 0.2)', 'rgba(2, 132, 199, 0.05)'] : ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={[styles.donationIconBox, isDonation && styles.donationIconBoxActive]}>
                  <Ionicons name="heart" size={24} color={isDonation ? "#F8FAFC" : "#64748B"} />
                </View>
                <View style={styles.toggleTextCol}>
                  <Text style={[styles.toggleTitle, isDonation && { color: '#38BDF8' }]}>Bulk NGO Donation</Text>
                  <Text style={styles.toggleDesc}>Mark this as a 100% free bulk donation for Verified Shelters only.</Text>
                </View>
                <Switch 
                  value={isDonation} 
                  onValueChange={(val) => {
                    Haptics.selectionAsync();
                    setIsDonation(val);
                  }} 
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(56, 189, 248, 0.5)' }}
                  thumbColor={isDonation ? '#38BDF8' : '#94A3B8'}
                />
              </View>
            </MotiView>

            <MotiView 
              from={{ opacity: 0, translateY: 20, scale: 0.97 }} 
              animate={{ opacity: 1, translateY: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 220 }}
            >
              <Text style={styles.sectionTitle}>DETAILS</Text>
              <View style={styles.card}>
                <LinearGradient colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.005)']} style={StyleSheet.absoluteFill} />
                
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Title</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <AnimatedFormInput
                    leftIconName="fast-food-outline"
                    maxLength={80}
                    onClear={() => setTitle('')}
                    isValid={title.length > 0}
                    placeholderTextColor="#64748B"
                    placeholder="e.g. 50lb Rice Bags (x3)"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Description</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <AnimatedFormInput
                    leftIconName="document-text-outline"
                    maxLength={200}
                    placeholderTextColor="#64748B"
                    placeholder="Describe the items..."
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Quantity (portions)</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <AnimatedFormInput
                    leftIconName="layers-outline"
                    showStepper
                    onStepUp={() => setQuantity((parseInt(quantity || '0') + 1).toString())}
                    onStepDown={() => setQuantity(Math.max(1, parseInt(quantity || '0') - 1).toString())}
                    placeholderTextColor="#64748B"
                    placeholder="e.g. 5"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Deadline</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <AnimatedPickerButton 
                    style={styles.datePickerBtn} 
                    onPress={handleOpenPicker} 
                    activeOpacity={0.8}
                    leftIconName="calendar-outline"
                  >
                    <Text style={styles.datePickerText}>{pickupEnd.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
                  </AnimatedPickerButton>
                  <ThemeDateTimePickerModal
                    visible={showDatePicker}
                    value={pickupEnd}
                    onConfirm={(selectedDate) => setPickupEnd(selectedDate)}
                    onClose={() => setShowDatePicker(false)}
                  />
                </View>

                {isDonation && (
                  <View style={styles.inputGroup}>
                    <View style={[styles.labelRow, { marginBottom: 12 }]}>
                      <Text style={styles.label}>Unit</Text>
                      <Text style={styles.requiredStar}>*</Text>
                    </View>
                    <View style={{ position: 'relative' }}>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        onScroll={handleUnitScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={{ gap: 10, paddingBottom: 8, paddingRight: 36 }}
                      >
                        {['portions', 'lbs', 'kgs', 'items', 'boxes'].map(u => (
                          <TouchableOpacity 
                            key={u} 
                            style={[styles.unitBadge, quantityUnit === u && styles.unitBadgeActive]} 
                            onPress={() => {
                              Haptics.selectionAsync();
                              setQuantityUnit(u);
                            }}
                            activeOpacity={0.7}
                          >
                            {quantityUnit === u && <Ionicons name="checkmark-circle" size={14} color="#042F2E" style={{ marginRight: 6 }} />}
                            <Text style={[styles.unitBadgeText, quantityUnit === u && styles.unitBadgeTextActive]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <MotiView 
                        animate={{ opacity: unitScrollEnd ? 0 : 1 }}
                        transition={{ type: 'timing', duration: 200 }}
                        pointerEvents="none" 
                        style={styles.scrollHintRight}
                      >
                        <LinearGradient
                          colors={['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.95)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.scrollHintGradient}
                        >
                          <Ionicons name="chevron-forward" size={14} color="#5EEAD4" />
                        </LinearGradient>
                      </MotiView>
                    </View>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={[styles.labelRow, { marginBottom: 12 }]}>
                    <Text style={styles.label}>Dietary Info</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <View style={{ position: 'relative' }}>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false} 
                      onScroll={handleDietaryScroll}
                      scrollEventThrottle={16}
                      contentContainerStyle={{ gap: 10, paddingBottom: 8, paddingRight: 36 }}
                    >
                      {['None', 'Veg', 'Non-Veg', 'Vegan', 'Halal', 'Kosher'].map(d => (
                        <TouchableOpacity 
                          key={d} 
                          style={[styles.unitBadge, dietaryInfo === d && styles.unitBadgeActive]} 
                          onPress={() => {
                            Haptics.selectionAsync();
                            setDietaryInfo(d);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={dietaryIcons[d]} size={14} color={dietaryInfo === d ? "#042F2E" : "#94A3B8"} style={{ marginRight: 6 }} />
                          <Text style={[styles.unitBadgeText, dietaryInfo === d && styles.unitBadgeTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <MotiView 
                      animate={{ opacity: dietaryScrollEnd ? 0 : 1 }}
                      transition={{ type: 'timing', duration: 200 }}
                      pointerEvents="none" 
                      style={styles.scrollHintRight}
                    >
                      <LinearGradient
                        colors={['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.95)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.scrollHintGradient}
                      >
                        <Ionicons name="chevron-forward" size={14} color="#5EEAD4" />
                      </LinearGradient>
                    </MotiView>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Additional Details (Optional)</Text>
                  </View>
                  <AnimatedFormInput
                    leftIconName="information-circle-outline"
                    placeholderTextColor="#64748B"
                    placeholder="Allergens, packaging info..."
                    multiline
                    numberOfLines={3}
                    style={{ height: 80 }}
                    value={additionalDetails}
                    onChangeText={setAdditionalDetails}
                  />
                </View>
              </View>
            </MotiView>

            <MotiView 
              from={{ opacity: 0, translateY: 20, scale: 0.97 }} 
              animate={{ opacity: 1, translateY: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 300 }}
            >
              <Text style={styles.sectionTitle}>PRICING</Text>
              <View style={styles.card}>
                <LinearGradient colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.005)']} style={StyleSheet.absoluteFill} />
                <View style={[styles.row, { gap: 12 }]}>
                  <View style={[styles.inputGroup, { flex: 1, flexBasis: 0, marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 22, marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons name="cash-outline" size={13} color="#5EEAD4" />
                        <Text style={[styles.label, { marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                          {isDonation ? 'Est. Value (₹)' : 'Original (₹)'} {isDonation && <Text style={{ color: '#5EEAD4', fontSize: 10 }}>(For Tax)</Text>}
                        </Text>
                        <Text style={styles.requiredStar}>*</Text>
                      </View>
                      {isDonation && (
                        <TouchableOpacity onPress={handleGetEstimate} disabled={isEstimating}>
                          <AnimatePresence>
                            {isEstimating ? (
                              <MotiView
                                from={{ opacity: 0.5, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1.1 }}
                                transition={{ loop: true, type: 'timing', duration: 600 }}
                              >
                                <Ionicons name="sparkles" size={16} color="#38BDF8" />
                              </MotiView>
                            ) : (
                              <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '700' }}>Get AI Estimate</Text>
                            )}
                          </AnimatePresence>
                        </TouchableOpacity>
                      )}
                    </View>
                    <AnimatedFormInput
                      prefix="₹"
                      placeholderTextColor="#64748B"
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      value={originalPrice}
                      onChangeText={setOriginalPrice}
                    />
                    {isDonation && aiEstimate && (
                      <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Text style={{ color: '#5EEAD4', fontSize: 11, marginTop: 8 }}>AI Suggested Max: ₹{aiEstimate}</Text>
                      </MotiView>
                    )}
                    {isDonation && <Text style={{ color: '#FCD34D', fontSize: 10, marginTop: 8, fontStyle: 'italic', lineHeight: 14 }}>Note: Exaggerated values will be flagged for review.</Text>}
                  </View>
                  
                  {!isDonation && (
                    <View style={[styles.inputGroup, { flex: 1, flexBasis: 0, marginBottom: 0 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', height: 22, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Ionicons name="pricetag-outline" size={13} color="#5EEAD4" />
                          <Text style={[styles.label, { marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">Discount (₹)</Text>
                          <Text style={styles.requiredStar}>*</Text>
                        </View>
                      </View>
                      <AnimatedFormInput
                        prefix="₹"
                        placeholderTextColor="#64748B"
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={discountPrice}
                        onChangeText={setDiscountPrice}
                      />
                    </View>
                  )}
                </View>
              </View>
            </MotiView>

            <MotiView 
              from={{ opacity: 0, translateY: 20, scale: 0.97 }} 
              animate={{ opacity: 1, translateY: 0, scale: 1 }} 
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 380 }}
            >
              <TouchableOpacity style={styles.certificationRow} onPress={() => {
                Haptics.selectionAsync();
                setIsCertified(!isCertified);
              }} activeOpacity={0.7}>
                <MotiView animate={{ scale: isCertified ? 1.1 : 1 }} transition={{ type: 'spring' }}>
                  <Ionicons name={isCertified ? "checkbox" : "square-outline"} size={24} color={isCertified ? "#5EEAD4" : "#64748B"} />
                </MotiView>
                <Text style={styles.certificationText}>I certify that this food is genuine, safe for consumption, and meets local safety guidelines.</Text>
              </TouchableOpacity>

              <ButtonTwo
                title="Publish Listing"
                icon="cloud-upload-outline"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isCertified}
                onPress={handlePublish}
                style={{ marginTop: 12, marginBottom: 20 }}
              />
            </MotiView>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtnPill: { 
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    marginBottom: 3,
  },
  liveIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#5EEAD4',
    marginRight: 5,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5EEAD4',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  headerRightBadge: { 
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 60 },
  donationToggleCard: { 
    flexDirection: 'row', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 28, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  donationToggleActive: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  donationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  donationIconBoxActive: {
    backgroundColor: '#0284C7',
  },
  toggleTextCol: { flex: 1, marginRight: 16 },
  toggleTitle: { fontSize: 16, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', marginBottom: 16, marginLeft: 4, letterSpacing: 1 },
  card: { 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 28, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)'
  },
  inputGroup: { marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 0 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { 
    backgroundColor: 'rgba(2, 6, 23, 0.55)', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 16, 
    fontSize: 15, 
    color: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: 'rgba(94, 234, 212, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  datePickerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)'
  },
  datePickerText: {
    color: '#F8FAFC',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600'
  },
  currencyInputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    height: 52,
  },
  currencySymbol: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700'
  },
  currencyInput: {
    paddingLeft: 36,
    height: 52,
    flex: 1,
  },
  unitBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 24, 
    backgroundColor: 'rgba(2, 6, 23, 0.5)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)' 
  },
  unitBadgeActive: { 
    backgroundColor: '#5EEAD4', 
    borderColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  unitBadgeText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  unitBadgeTextActive: { color: '#042F2E', fontWeight: '800' },
  certificationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, paddingRight: 16, paddingLeft: 4 },
  certificationText: { marginLeft: 12, fontSize: 13, color: '#94A3B8', lineHeight: 20, flex: 1 },
  publishBtn: { 
    flexDirection: 'row', 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  publishBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scrollHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5EEAD4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollHintRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 44,
    width: 36,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scrollHintGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  requiredStar: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 13,
  },
});
