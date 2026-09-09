import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export interface ProfileCardProps {
  profile: any;
  editRoute?: string;
  tagText?: string;
  icon?: any;
}

export default function ProfileCard({
  profile,
  editRoute = '/(forms)/edit-kitchen-profile/me',
  tagText,
  icon = 'storefront',
}: ProfileCardProps) {
  const displayTag = tagText || (profile?.role === 'shelter' ? 'Verified Shelter' : 'Verified Donor');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={styles.cardContainer}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Avatar Area */}
          <View style={styles.avatarWrapper}>
            {profile?.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name={icon} size={40} color="#5EEAD4" />
              </View>
            )}
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            </View>
          </View>

          {/* Profile Details */}
          <View style={styles.infoContainer}>
            <Text style={styles.name} numberOfLines={1}>{profile?.business_name || profile?.first_name || 'Loading...'}</Text>

            {profile?.first_name && (
              <View style={styles.detailRow}>
                <Ionicons name="person" size={12} color="#94A3B8" style={{ marginRight: 6 }} />
                <Text style={styles.ownerName} numberOfLines={1}>Manager: {profile.first_name}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Ionicons name="mail" size={12} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.email} numberOfLines={1}>{profile?.email || 'Loading...'}</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>{displayTag}</Text>
            </View>
          </View>

          {/* Edit Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.editBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(editRoute as any);
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="pencil" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  avatarWrapper: {
    marginRight: 16,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  verificationBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 2,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  email: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34D399',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
