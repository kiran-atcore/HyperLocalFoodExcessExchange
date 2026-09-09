import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { router, useFocusEffect } from 'expo-router';
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

export default function AdminApprovalsScreen() {
  const { logout } = React.useContext(AuthContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchPendingUsers();
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/pending_approvals/');
      setUsers(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isDonor = item.role === 'donor';

    return (
      <MotiView
        from={{
          opacity: 0,
          translateY: 20,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          translateY: 0,
          scale: 1,
        }}
        transition={{
          type: 'timing',
          duration: 350,
          delay: Math.min(index * 50, 350),
        }}
      >
        <TouchableOpacity 
          style={styles.card}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/(views)/approval-request/[id]', params: { id: item.id } });
          }}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.roleBadge, isDonor ? styles.donorBadge : styles.shelterBadge]}>
                <Ionicons 
                  name={isDonor ? 'restaurant' : 'home'} 
                  size={11} 
                  color={isDonor ? '#34D399' : '#818CF8'} 
                  style={{ marginRight: 4 }} 
                />
                <Text style={[styles.roleText, { color: isDonor ? '#34D399' : '#818CF8' }]}>
                  {item.role.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.nameText} numberOfLines={1}>{item.business_name || item.first_name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#5EEAD4" />
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={13} color="#94A3B8" style={styles.icon} />
              <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={13} color="#94A3B8" style={styles.icon} />
              <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Address pending verification'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
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
            <Text style={styles.headerTitle}>Entity Approvals</Text>
            <Text style={styles.headerSubtitle}>Vetting kitchen & shelter registrations</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{users.length} In Review</Text>
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
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching registration dossiers...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 350 }}
                style={styles.emptyContainer}
              >
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="checkmark-done-circle" size={48} color="#5EEAD4" />
                </View>
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySubtext}>There are no pending accounts waiting for verification.</Text>
              </MotiView>
            }
          />
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
  headerSubtitle: { fontSize: 11, color: '#5EEAD4', fontWeight: '600', marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: {
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#5EEAD4' },
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
  listContainer: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
  },
  donorBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  shelterBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    borderColor: 'rgba(129, 140, 248, 0.35)',
  },
  roleText: { fontSize: 10, fontWeight: '800' },
  nameText: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', flex: 1 },
  cardBody: { marginLeft: 2, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  infoText: { fontSize: 13, color: '#94A3B8', flex: 1 },
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
  emptySubtext: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
});
