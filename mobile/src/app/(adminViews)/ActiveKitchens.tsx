import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import api from '../../utils/api';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';

export default function ActiveKitchens() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/admin/list/?role=donor&is_approved=true');
      setUsers(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 16, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 350, delay: Math.min(index * 45, 300) }}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="restaurant" size={20} color="#F59E0B" />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.business_name || item.first_name || 'Kitchen Entity'}</Text>
          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
          {item.phone_number ? <Text style={styles.phone}>{item.phone_number}</Text> : null}
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={styles.bgGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <MotiView
          from={{ opacity: 0, translateY: -16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.header}
        >
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color="#5EEAD4" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Active Kitchens</Text>
            <Text style={styles.headerSubtitle}>{users.length} Verified Donors</Text>
          </View>
          <View style={{ width: 40 }} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.searchWrapper}
        >
          <AnimatedSearchBar
            placeholder="Search kitchen or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="dark"
          />
        </MotiView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching kitchens...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 350 }}
                style={styles.emptyBox}
              >
                <Ionicons name="restaurant-outline" size={48} color="#64748B" />
                <Text style={styles.empty}>No active kitchens found.</Text>
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
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.12)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 11, color: '#5EEAD4', fontWeight: '600', marginTop: 1 },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  email: { fontSize: 12, color: '#94A3B8' },
  phone: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    marginLeft: 8,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34D399', marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#34D399' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});
