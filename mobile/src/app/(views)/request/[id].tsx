import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Request #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#94a3b8" />
          </View>
          <Text style={styles.name}>John Doe</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CONSUMER</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Item:</Text>
            <Text style={styles.infoValue}>Assorted Pastries (x2)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Arrival:</Text>
            <Text style={styles.infoValueTime}>5:15 PM</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={styles.infoValuePending}>En Route</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(donor)/scan' as any)}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" style={{ marginRight: 12 }} />
          <Text style={styles.scanBtnText}>Open Scanner to Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  
  content: { padding: 16, paddingBottom: 40 },
  
  profileCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  badge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 32, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 15, color: '#64748b' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  infoValueTime: { fontSize: 15, fontWeight: 'bold', color: '#f59e0b' },
  infoValuePending: { fontSize: 15, fontWeight: 'bold', color: '#3b82f6' },

  scanBtn: { flexDirection: 'row', backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scanBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' }
});
