import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';

interface RejectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

export default function RejectionModal({ visible, onClose, onConfirm, loading = false }: RejectionModalProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Reject Account Request</Text>
          <Text style={styles.subtitle}>Please provide a reason for the rejection. This will be shown to the user so they can correct their details.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="e.g. Please upload a valid food safety certificate."
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            editable={!loading}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, (loading || reason.trim().length === 0) && styles.confirmButtonDisabled]} 
              onPress={handleConfirm}
              disabled={loading || reason.trim().length === 0}
            >
              <Text style={styles.confirmText}>{loading ? 'Rejecting...' : 'Confirm Reject'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16, height: 100, textAlignVertical: 'top', marginBottom: 24 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
  cancelText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  confirmButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#ef4444' },
  confirmButtonDisabled: { backgroundColor: '#cbd5e1' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
