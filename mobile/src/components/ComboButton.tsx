import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

interface ComboButtonProps {
  onLogout: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export default function ComboButton({ onLogout, onDelete, isDeleting }: ComboButtonProps) {
  return (
    <MotiView 
      from={{ opacity: 0, rotateX: '90deg', scale: 0.5, translateY: 80 }}
      animate={{ opacity: 1, rotateX: '0deg', scale: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 400, damping: 12, stiffness: 200, mass: 0.9 }}
      style={[styles.wrapper, { transform: [{ perspective: 800 }] }]}
    >
      <MotiView
        from={{ translateY: -3 }}
        animate={{ translateY: 3 }}
        transition={{
          type: 'timing',
          duration: 2000,
          loop: true,
        }}
        style={styles.dockContainer}
      >
      {/* Dock Background */}
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Logout Action */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={styles.actionBtn} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLogout();
        }}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="power" size={24} color="#CBD5E1" />
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Delete Action */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        style={styles.actionBtn} 
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        }} 
        disabled={isDeleting}
      >
        <View style={[styles.iconWrapper, styles.deleteWrapper]}>
          <LinearGradient
            colors={['rgba(239,68,68,0.2)', 'rgba(153,27,27,0.0)']}
            style={StyleSheet.absoluteFill}
          />
          {isDeleting ? (
            <ActivityIndicator color="#FCA5A5" size="small" />
          ) : (
            <Ionicons name="trash" size={24} color="#FCA5A5" />
          )}
        </View>
      </TouchableOpacity>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 'auto',
    alignSelf: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 40,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  actionBtn: {
    padding: 4,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deleteWrapper: {
    backgroundColor: 'rgba(153, 27, 27, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    overflow: 'hidden',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  }
});
