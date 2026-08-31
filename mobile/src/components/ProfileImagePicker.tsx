import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickImageAsBase64 } from '../utils/imagePickerHelper';

interface ProfileImagePickerProps {
  imageUri: string | null;
  defaultInitial?: string;
  defaultIcon?: keyof typeof Ionicons.glyphMap;
  onImageSelected: (base64OrUri: string) => void;
  onImageRemoved: () => void;
  title?: string;
}

export default function ProfileImagePicker({
  imageUri,
  defaultInitial = 'U',
  defaultIcon,
  onImageSelected,
  onImageRemoved,
  title = 'Profile Photo',
}: ProfileImagePickerProps) {

  const handlePickImage = async () => {
    const base64Data = await pickImageAsBase64();
    if (base64Data) {
      onImageSelected(base64Data);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            {defaultIcon ? (
              <Ionicons name={defaultIcon} size={40} color="#3b82f6" />
            ) : (
              <Text style={styles.avatarInitial}>{defaultInitial.toUpperCase()}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.changeBtn} onPress={handlePickImage}>
          <Ionicons name="camera-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.changeBtnText}>{imageUri ? 'Change Photo' : 'Add Photo'}</Text>
        </TouchableOpacity>

        {imageUri ? (
          <TouchableOpacity style={styles.removeBtn} onPress={onImageRemoved}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#cbd5e1',
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changeBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  removeBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
