import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ClaimDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim #{id}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.statusCard}>
          <Ionicons name="time" size={48} color="#f59e0b" style={{ marginBottom: 12 }} />
          <Text style={styles.statusTitle}>Awaiting Pickup</Text>
          <Text style={styles.statusDesc}>Your claim has been secured. Please pick up the items before the deadline.</Text>
        </View>

        <Text style={styles.sectionTitle}>Pickup Instructions</Text>
        <View style={styles.infoCard}>
          <Text style={styles.detailText}><Text style={styles.boldText}>Donor:</Text> Warehouse Co.</Text>
          <Text style={styles.detailText}><Text style={styles.boldText}>Address:</Text> 123 Industrial Way, Gate B</Text>
          <Text style={styles.detailText}><Text style={styles.boldText}>Deadline:</Text> Today by 5:00 PM</Text>
          <Text style={styles.detailText}><Text style={styles.boldText}>Note:</Text> Please ring the bell at the loading dock.</Text>
        </View>

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code-outline" size={100} color="#cbd5e1" />
          </View>
          <Text style={styles.qrText}>Show this code to the donor upon arrival to verify your identity.</Text>
        </View>

        <TouchableOpacity style={styles.contactBtn}>
          <Ionicons name="call-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.contactBtnText}>Contact Donor</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  
  content: { padding: 16, paddingBottom: 40 },
  
  statusCard: { backgroundColor: '#fffbeb', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#fde68a' },
  statusTitle: { fontSize: 22, fontWeight: 'bold', color: '#b45309', marginBottom: 8 },
  statusDesc: { fontSize: 15, color: '#d97706', textAlign: 'center', lineHeight: 22 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  infoCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  detailText: { fontSize: 15, color: '#475569', marginBottom: 8, lineHeight: 22 },
  boldText: { fontWeight: 'bold', color: '#1e293b' },

  qrCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  qrPlaceholder: { width: 160, height: 160, backgroundColor: '#f1f5f9', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  qrText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 16 },

  contactBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
