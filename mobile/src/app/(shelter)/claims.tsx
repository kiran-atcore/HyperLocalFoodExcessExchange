import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const DUMMY_CLAIMS = [
  { id: '1', title: 'Produce Box (Slightly bruised)', donor: 'Downtown Grocer', status: 'Awaiting Pickup', time: 'Claimed 2 hours ago' },
  { id: '2', title: 'Canned Goods Pallet', donor: 'Food Bank Distribution', status: 'Completed', time: 'Claimed Yesterday' },
];

export default function ShelterClaimsScreen() {
  const renderItem = ({ item }: any) => {
    const isCompleted = item.status === 'Completed';
    return (
      <TouchableOpacity style={[styles.card, isCompleted && styles.cardCompleted]} onPress={() => router.push(`/(views)/claim/${item.id}` as any)}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : "time-outline"} 
            size={24} 
            color={isCompleted ? "#10b981" : "#f59e0b"} 
          />
        </View>
        <Text style={styles.donor}>{item.donor}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.time}>{item.time}</Text>
          <Text style={[styles.status, { color: isCompleted ? "#10b981" : "#f59e0b" }]}>{item.status}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Claims</Text>
      <FlatList 
        data={DUMMY_CLAIMS} 
        renderItem={renderItem} 
        keyExtractor={item => item.id} 
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  list: { paddingBottom: 24 },
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginBottom: 16, 
    padding: 16, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  cardCompleted: {
    borderLeftColor: '#10b981',
    opacity: 0.8
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 8 },
  donor: { fontSize: 14, color: '#64748b', marginBottom: 12, marginTop: 4 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 13, color: '#94a3b8' },
  status: { fontSize: 14, fontWeight: 'bold' }
});