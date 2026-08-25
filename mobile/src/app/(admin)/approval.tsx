import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

export default function AdminApprovalsScreen() {
  const { logout } = React.useContext(AuthContext);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPendingUsers();
    }, [])
  );

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/users/pending_approvals/');
      setUsers(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({ pathname: '/(views)/approval-request/[id]', params: { id: item.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.roleBadge, item.role === 'donor' ? styles.donorBadge : styles.shelterBadge]}>
            <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
          </View>
          <Text style={styles.nameText}>{item.business_name || item.username}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={14} color="#64748b" style={styles.icon} />
          <Text style={styles.infoText}>{item.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={14} color="#64748b" style={styles.icon} />
          <Text style={styles.infoText} numberOfLines={1}>{item.address || 'Address pending'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(false)}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1e40af" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySubtext}>There are no pending accounts to review.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  donorBadge: { backgroundColor: '#dcfce7' },
  shelterBadge: { backgroundColor: '#e0e7ff' },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  cardBody: { marginLeft: 2, gap: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  infoText: { fontSize: 14, color: '#475569', flex: 1 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#475569', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94a3b8' }
});
