import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { LinearGradient } from 'expo-linear-gradient';
import { pickImageAsBase64 } from '../utils/imagePickerHelper';
import * as Haptics from 'expo-haptics';

interface FoodImageUploaderProps {
  imageUri: string | null;
  onImageSelected: (base64OrUri: string) => void;
  onImageRemoved: () => void;
  title?: string;
}

export default function FoodImageUploader({
  imageUri,
  onImageSelected,
  onImageRemoved,
  title = 'Food Image',
}: FoodImageUploaderProps) {

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base64Data = await pickImageAsBase64();
    if (base64Data) {
      onImageSelected(base64Data);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onImageRemoved();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{title} (Optional)</Text>
      
      {imageUri ? (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          style={styles.imagePreviewContainer}
        >
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          
          <LinearGradient
            colors={['transparent', 'rgba(2, 6, 23, 0.9)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
          
          <View style={styles.overlayActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePickImage} activeOpacity={0.8}>
              <Ionicons name="camera-reverse-outline" size={16} color="#5EEAD4" />
              <Text style={styles.actionBtnText}>Change</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleRemove} activeOpacity={0.8}>
              <Ionicons name="trash-bin-outline" size={16} color="#FCA5A5" />
              <Text style={[styles.actionBtnText, { color: '#FCA5A5' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      ) : (
        <MotiPressable
          onPress={handlePickImage}
          animate={({ pressed }) => {
            'worklet';
            return {
              scale: pressed ? 0.97 : 1,
              opacity: pressed ? 0.8 : 1,
            };
          }}
          style={styles.uploadBox}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          
          <View style={styles.uploadIconCircle}>
            <LinearGradient
              colors={['#0F766E', '#042F2E']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="cloud-upload-outline" size={28} color="#5EEAD4" />
          </View>
          <Text style={styles.uploadTitle}>Tap to Upload Photo</Text>
          <Text style={styles.uploadSubtitle}>Showcase the surplus (PNG, JPG)</Text>
          
          <View style={styles.dashedBorder} pointerEvents="none" />
        </MotiPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadBox: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    borderStyle: 'dashed',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    backgroundColor: '#020617',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  overlayActions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(127, 29, 29, 0.6)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  actionBtnText: {
    color: '#5EEAD4',
    fontSize: 13,
    fontWeight: '700',
  },
});
