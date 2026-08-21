import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';

interface EtaSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (etaMinutes: number) => void;
  pickupEnd: string; // ISO string representing the expiration time
}

export default function EtaSelectionModal({ visible, onClose, onConfirm, pickupEnd }: EtaSelectionModalProps) {
  const [etaMinutes, setEtaMinutes] = useState<number>(30);
  const expirationTime = new Date(pickupEnd).getTime();
  const options = [15, 30, 60, 120];

  const handleConfirm = () => {
    onConfirm(etaMinutes);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Estimated Arrival Time</Text>
          <Text style={styles.subtitle}>When can you pick this up?</Text>
          
          <View style={styles.optionsContainer}>
            {options.map((mins) => {
              const etaTimestamp = Date.now() + mins * 60000;
              const isPastExpiration = etaTimestamp > expirationTime;
              
              return (
                <TouchableOpacity 
                  key={mins} 
                  style={[
                    styles.etaBtn, 
                    etaMinutes === mins && !isPastExpiration && styles.etaBtnSelected,
                    isPastExpiration && styles.etaBtnDisabled
                  ]}
                  onPress={() => setEtaMinutes(mins)}
                  disabled={isPastExpiration}
                >
                  <Text style={[
                    styles.etaBtnText, 
                    etaMinutes === mins && !isPastExpiration && styles.etaBtnTextSelected,
                    isPastExpiration && styles.etaBtnTextDisabled
                  ]}>
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Confirm Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 24, textAlign: 'center' },
  optionsContainer: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  etaBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  etaBtnSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  etaBtnDisabled: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  etaBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 16 },
  etaBtnTextSelected: { color: '#ffffff' },
  etaBtnTextDisabled: { color: '#94a3b8' },
  actionsContainer: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center' },
  confirmBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
