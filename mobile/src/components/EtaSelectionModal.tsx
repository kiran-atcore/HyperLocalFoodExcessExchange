import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface EtaSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (etaMinutes: number, quantity: number) => void;
  pickupEnd: string; // ISO string representing the expiration time
  showQuantity?: boolean;
  maxQuantity?: number;
}

export default function EtaSelectionModal({
  visible,
  onClose,
  onConfirm,
  pickupEnd,
  showQuantity,
  maxQuantity,
}: EtaSelectionModalProps) {
  const [etaMinutes, setEtaMinutes] = useState<number>(30);
  const [quantity, setQuantity] = useState<number>(1);
  const expirationTime = new Date(pickupEnd).getTime();
  const options = [15, 30, 60, 120];

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(etaMinutes, quantity);
  };

  const handleSelectMins = (mins: number) => {
    Haptics.selectionAsync();
    setEtaMinutes(mins);
  };

  const handleDecreaseQty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(Math.max(1, quantity - 1));
  };

  const handleIncreaseQty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuantity(maxQuantity !== undefined ? Math.min(maxQuantity, quantity + 1) : quantity + 1);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={35} tint="dark" style={styles.absoluteFill} />

        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />

        <MotiView
          from={{ opacity: 0, translateY: 60, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180 }}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#0F1E28', '#042F2E', '#021815']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.modalGradient}
          >
            {/* Handle bar */}
            <View style={styles.dragHandle} />

            {/* Header Icon */}
            <View style={styles.iconHalo}>
              <Ionicons name="time-outline" size={24} color="#5EEAD4" />
            </View>

            <Text style={styles.title}>Estimated Arrival Time</Text>
            <Text style={styles.subtitle}>Select when you will arrive for pickup</Text>

            {/* ETA Options */}
            <View style={styles.optionsContainer}>
              {options.map((mins) => {
                const etaTimestamp = Date.now() + mins * 60000;
                const isPastExpiration = etaTimestamp > expirationTime;
                const isSelected = etaMinutes === mins && !isPastExpiration;

                return (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.etaBtn,
                      isSelected && styles.etaBtnSelected,
                      isPastExpiration && styles.etaBtnDisabled,
                    ]}
                    onPress={() => handleSelectMins(mins)}
                    disabled={isPastExpiration}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={['#0D9488', '#042F2E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.selectedGradient}
                      />
                    )}
                    <Ionicons
                      name={mins >= 60 ? 'hourglass-outline' : 'flash-outline'}
                      size={14}
                      color={isSelected ? '#5EEAD4' : (isPastExpiration ? '#475569' : '#94A3B8')}
                      style={{ marginBottom: 4 }}
                    />
                    <Text
                      style={[
                        styles.etaBtnText,
                        isSelected && styles.etaBtnTextSelected,
                        isPastExpiration && styles.etaBtnTextDisabled,
                      ]}
                    >
                      {mins >= 60 ? `${mins / 60} hr` : `${mins} min`}
                    </Text>
                    {isPastExpiration && (
                      <Text style={styles.expiredSubtext}>Expired</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity Stepper */}
            {showQuantity && (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>PORTIONS TO CLAIM</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
                    onPress={handleDecreaseQty}
                    disabled={quantity <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={quantity <= 1 ? '#475569' : '#FFFFFF'} />
                  </TouchableOpacity>

                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    {maxQuantity !== undefined && (
                      <Text style={styles.quantityMax}>/ {maxQuantity}</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.stepperBtn,
                      maxQuantity !== undefined && quantity >= maxQuantity && styles.stepperBtnDisabled,
                    ]}
                    onPress={handleIncreaseQty}
                    disabled={maxQuantity !== undefined && quantity >= maxQuantity}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={maxQuantity !== undefined && quantity >= maxQuantity ? '#475569' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0D9488', '#042F2E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmGradient}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Confirm Claim</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </MotiView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropDismiss: {
    flex: 1,
  },
  modalContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    marginBottom: -90,
  },
  modalGradient: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    alignItems: 'center',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  iconHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 22,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  etaBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  etaBtnSelected: {
    borderColor: '#5EEAD4',
  },
  etaBtnDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  etaBtnText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
  },
  etaBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  etaBtnTextDisabled: {
    color: '#64748B',
  },
  expiredSubtext: {
    fontSize: 9,
    color: '#F43F5E',
    fontWeight: '700',
    marginTop: 2,
  },
  quantityContainer: {
    marginBottom: 22,
    alignItems: 'center',
    width: '100%',
  },
  quantityLabel: {
    fontSize: 11,
    color: '#5EEAD4',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepperBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minWidth: 90,
  },
  quantityValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  quantityMax: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    height: 151,
    paddingBottom: 100,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',

  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',

  },
  confirmGradient: {
    flexDirection: 'row',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
