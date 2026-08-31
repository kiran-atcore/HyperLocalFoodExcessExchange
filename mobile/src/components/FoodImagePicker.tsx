import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickImageAsBase64 } from '../utils/imagePickerHelper';

interface FoodImagePickerProps {
  imageUri: string | null;
  onImageSelected: (base64OrUri: string) => void;
  onImageRemoved: () => void;
  title?: string;
}

export default function FoodImagePicker({
  imageUri,
  onImageSelected,
  onImageRemoved,
  title = 'Food Image',
}: FoodImagePickerProps) {

  const handlePickImage = async () => {
    const base64Data = await pickImageAsBase64();
    if (base64Data) {
      onImageSelected(base64Data);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title} (Optional)</Text>
      
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          
          <View style={styles.overlayActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onImageRemoved}>
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text style={styles.actionBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} activeOpacity={0.8}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="image-outline" size={32} color="#3b82f6" />
          </View>
          <Text style={styles.uploadTitle}>Upload Food Photo</Text>
          <Text style={styles.uploadSubtitle}>PNG, JPG, or WEBP from device</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  imagePreviewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  overlayActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
