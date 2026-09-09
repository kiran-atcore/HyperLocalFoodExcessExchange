import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
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

export default function EditSurplusScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [originalQuantity, setOriginalQuantity] = useState(1);
  const [remainingQuantity, setRemainingQuantity] = useState(1);
  const [quantityUnit, setQuantityUnit] = useState('portions');
  const [dietaryInfo, setDietaryInfo] = useState('None');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isDonation, setIsDonation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCertified, setIsCertified] = useState(false);
  const [pickupEnd, setPickupEnd] = useState(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
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
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}/`);
      const data = response.data;
      setTitle(data.title);
      setDescription(data.description);
      setOriginalPrice(data.original_price);
      setDiscountPrice(data.discounted_price);
      setQuantity(data.quantity_available.toString());
      setOriginalQuantity(data.quantity_available);
      setRemainingQuantity(data.quantity_remaining !== undefined ? data.quantity_remaining : data.quantity_available);
      setQuantityUnit(data.quantity_unit || 'portions');
      setDietaryInfo(data.dietary_info || 'None');
      setAdditionalDetails(data.additional_details || '');
      setIsDonation(data.listing_type === 'DONATION');
      setImage(data.image || null);
      if (data.pickup_end) {
        const fetchedDate = new Date(data.pickup_end);
        if (fetchedDate.getTime() < new Date().getTime()) {
          setPickupEnd(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));
        } else {
          setPickupEnd(fetchedDate);
        }
      }
      setIsCertified(true); 
    } catch (e) {
      showAlert("Error", "Could not load listing details", "error", () => router.back());
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdate = async () => {
    if (!title.trim()) {
      showAlert("Title Required", "Please provide a title for the surplus item.", "warning");
      return;
    }
    if (!description.trim()) {
      showAlert("Description Required", "Please describe the food items.", "warning");
      return;
    }
    const parsedQuantity = parseInt(quantity, 10);
    if (!quantity || isNaN(parsedQuantity) || parsedQuantity <= 0) {
      showAlert("Quantity Required", "Please enter a valid quantity greater than zero.", "warning");
      return;
    }
    const minQuantity = Math.max(1, originalQuantity - remainingQuantity);
    if (!isDonation && parsedQuantity < minQuantity) {
      showAlert("Invalid Quantity", `You cannot decrease the total quantity below ${minQuantity} because those portions have already been claimed.`, "warning");
      return;
    }
    if (!pickupEnd || pickupEnd.getTime() <= Date.now()) {
      showAlert("Invalid Deadline", "Please set a valid future pickup deadline.", "warning");
      return;
    }
    if (!quantityUnit) {
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
      showAlert("Certification Required", "Please certify food safety before updating.", "warning");
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
        quantity_available: parsedQuantity,
        quantity_unit: quantityUnit,
        dietary_info: dietaryInfo,
        additional_details: additionalDetails,
        image: image,
        pickup_end: pickupEnd.toISOString(),
      };
      await api.patch(`/listings/${id}/`, payload);
      showAlert("Updated", "Your surplus listing has been updated.", "success", () => router.back());
    } catch (e: any) {
      showAlert("Error", "Failed to update listing", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={['#042F2E', '#0f172a']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#5EEAD4" />
      </View>
    );
  }

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
                style={[styles.headerBadge, { borderColor: 'rgba(56, 189, 248, 0.25)', backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}
              >
                <Ionicons name="create-outline" size={10} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={[styles.headerBadgeText, { color: '#38BDF8' }]}>EDIT MODE</Text>
              </MotiView>
              <Text style={styles.headerTitle}>Modify Surplus</Text>
            </View>
            <View style={styles.headerRightBadge}>
              <Ionicons name="options-outline" size={16} color="#38BDF8" />
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
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
                
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

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Quantity ({quantityUnit})</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <AnimatedFormInput
                    leftIconName="layers-outline"
                    showStepper
                    onStepUp={() => setQuantity((parseInt(quantity || '0') + 1).toString())}
                    onStepDown={() => setQuantity(Math.max(1, parseInt(quantity || '0') - 1).toString())}
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                  {!isDonation && (
                    <Text style={{ fontSize: 10, color: '#FCD34D', marginTop: 8, fontStyle: 'italic', lineHeight: 14 }}>
                      Min: {Math.max(1, originalQuantity - remainingQuantity)} (Active Claims)
                    </Text>
                  )}
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
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 220 }}
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
                          {isDonation ? 'Est. Value (₹)' : 'Original (₹)'}
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
              transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 300 }}
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
                title="Save Changes"
                icon="save-outline"
                isLoading={isSubmitting}
                disabled={isSubmitting || !isCertified}
                onPress={handleUpdate}
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
