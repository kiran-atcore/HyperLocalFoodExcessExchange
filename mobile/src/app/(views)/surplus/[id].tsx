import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SurplusDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Surplus #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.summaryCard}>
          <Text style={styles.title}>Leftover Lasagna</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>$4.00 (DISCOUNT)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Portions Available:</Text>
            <Text style={styles.infoValue}>5</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Posted:</Text>
            <Text style={styles.infoValue}>2 hrs ago</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <Text style={styles.infoLabel}>Expires:</Text>
            <Text style={styles.infoValueTime}>Today at 8:00 PM</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="eye-outline" size={24} color="#3b82f6" />
            <Text style={styles.statVal}>42</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="bookmark-outline" size={24} color="#10b981" />
            <Text style={styles.statVal}>12</Text>
            <Text style={styles.statLabel}>Saves</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(forms)/edit-surplus/${id}` as any)}>
          <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.editBtnText}>Edit Listing</Text>
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
  
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, textAlign: 'center' },
  badge: { backgroundColor: '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 15, color: '#64748b' },
  infoValue: { fontSize: 15, fontWeight: 'bold', color: '#1e293b' },
  infoValueTime: { fontSize: 15, fontWeight: 'bold', color: '#ef4444' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  statVal: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginVertical: 8 },
  statLabel: { fontSize: 13, color: '#64748b' },

  editBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
