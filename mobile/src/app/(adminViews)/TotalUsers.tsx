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

export default function TotalUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/admin/list/');
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
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'donor': return { icon: 'restaurant', color: '#F59E0B' };
      case 'shelter': return { icon: 'home', color: '#818CF8' };
      case 'admin': return { icon: 'shield', color: '#FB7185' };
      default: return { icon: 'person', color: '#5EEAD4' };
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const roleInfo = getRoleIcon(item.role);
    const isApproved = item.is_approved || item.approval_status === 'APPROVED';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'timing', duration: 350, delay: Math.min(index * 45, 300) }}
      >
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: `${roleInfo.color}15`, borderColor: `${roleInfo.color}35` }]}>
            <Ionicons name={roleInfo.icon as any} size={20} color={roleInfo.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.first_name || item.business_name || 'Member'}</Text>
            <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
            <Text style={styles.role}>Role: {item.role?.toUpperCase() || 'USER'}</Text>
          </View>
          <View style={[styles.statusBadge, isApproved ? styles.statusBadgeApproved : styles.statusBadgePending]}>
            <Text style={[styles.statusText, isApproved ? styles.statusTextApproved : styles.statusTextPending]}>
              {item.approval_status || (isApproved ? 'Approved' : 'Pending')}
            </Text>
          </View>
        </View>
      </MotiView>
    );
  };

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
            <Text style={styles.headerTitle}>Total Users</Text>
            <Text style={styles.headerSubtitle}>{users.length} Registered Accounts</Text>
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
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="dark"
          />
        </MotiView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching directory...</Text>
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
                <Ionicons name="people-outline" size={48} color="#64748B" />
                <Text style={styles.empty}>No matching users found.</Text>
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
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  email: { fontSize: 12, color: '#94A3B8' },
  role: { fontSize: 11, color: '#5EEAD4', marginTop: 2, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextApproved: { color: '#34D399' },
  statusTextPending: { color: '#F59E0B' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});
