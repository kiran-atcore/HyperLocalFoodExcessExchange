import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useFocusEffect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 40,
        }}
        animate={{
          opacity: [0, 0.55, 0],
          translateY: -280 - Math.random() * 180,
          translateX: (Math.random() - 0.5) * 120,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 4000,
          delay: Math.random() * 3000,
        }}
        style={{
          position: 'absolute',
          bottom: -40,
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#5EEAD4',
          shadowColor: '#5EEAD4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size,
        }}
      />
    );
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {particles}
    </View>
  );
};

export default function AdminFlaggedScreen() {
  const { logout } = React.useContext(AuthContext);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchReceipts();
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tax-receipts/');
      const pending = response.data.filter((r: any) => r.status === 'PENDING');
      setReceipts(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.headerTitle}>Flagged Audits</Text>
            <Text style={styles.headerSubtitle}>Receipts with AI valuation variances</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{receipts.length} Pending</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutBtn} 
              onPress={() => logout(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#FB7185" />
            </TouchableOpacity>
          </View>
        </MotiView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.loadingText}>Loading audit queue...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {isScreenFocused && (
              receipts.length === 0 ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 350 }}
                  style={styles.emptyContainer}
                >
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="shield-checkmark" size={48} color="#5EEAD4" />
                  </View>
                  <Text style={styles.emptyTitle}>Queue All Clear</Text>
                  <Text style={styles.emptySubtitle}>No tax receipts currently flagged for audit review.</Text>
                </MotiView>
              ) : (
                receipts.map((receipt, index) => (
                  <MotiView
                    key={receipt.id}
                    from={{ opacity: 0, scale: 0.94, translateY: 15 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 180, delay: index * 60 }}
                  >
                    <TouchableOpacity 
                      style={styles.card}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/(views)/flagged/${receipt.id}` as any);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.flagIconCircle}>
                          <Ionicons name="warning" size={16} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.itemTitle} numberOfLines={1}>{receipt.listing_title}</Text>
                          <Text style={styles.ngoName} numberOfLines={1}>
                            Recipient: {receipt.ngo_name || 'Shelter Partner'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#5EEAD4" />
                      </View>
                      
                      <View style={styles.comparisonRow}>
                        <View>
                          <Text style={styles.claimedLabel}>Claimed Value</Text>
                          <Text style={styles.claimedValue}>₹{receipt.estimated_value}</Text>
                        </View>
                        <View style={styles.badge}>
                          <Ionicons name="alert-circle-outline" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                          <Text style={styles.badgeText}>Discrepancy</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </MotiView>
                ))
              )
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021815' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.12)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 11, color: '#F59E0B', fontWeight: '600', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  flagIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  ngoName: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  claimedLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '500', marginBottom: 2 },
  claimedValue: { fontSize: 18, fontWeight: '800', color: '#FB7185' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
});
