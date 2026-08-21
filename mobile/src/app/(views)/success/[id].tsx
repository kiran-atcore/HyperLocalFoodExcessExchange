import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../../utils/api';

export default function SuccessScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [itemExpanded, setItemExpanded] = useState(false);
  const [requesterExpanded, setRequesterExpanded] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}/`);
      setOrder(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#10b981" />
        </View>
        
        <Text style={styles.title}>Scan Successful!</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.detailsContainer}>
            <Text style={styles.subtitle}>
              Consumer Verified. Order #{id} has been marked as picked up.
            </Text>
            {order && (
              <View style={styles.card}>
                <TouchableOpacity style={styles.dropdownHeader} onPress={() => setItemExpanded(!itemExpanded)}>
                  <View>
                    <Text style={styles.label}>Item</Text>
                    <Text style={styles.value}>{order.listing_details?.title || 'Unknown Item'}</Text>
                  </View>
                  <Ionicons name={itemExpanded ? "chevron-up" : "chevron-down"} size={24} color="#64748b" />
                </TouchableOpacity>
                {itemExpanded && (
                  <View style={styles.dropdownContent}>
                    <Text style={styles.detailText}><Text style={styles.bold}>Quantity:</Text> {order.listing_details?.quantity_available} {order.listing_details?.quantity_unit}</Text>
                    <Text style={styles.detailText}><Text style={styles.bold}>Type:</Text> {order.listing_details?.listing_type}</Text>
                    <Text style={styles.detailText}><Text style={styles.bold}>Est. Value:</Text> ₹{order.listing_details?.estimated_fmv || '0.00'}</Text>
                  </View>
                )}
                
                <View style={styles.divider} />
                
                <TouchableOpacity style={styles.dropdownHeader} onPress={() => setRequesterExpanded(!requesterExpanded)}>
                  <View>
                    <Text style={styles.label}>Picked up by</Text>
                    <Text style={styles.value}>{order.requester_details?.name || 'Unknown Consumer'}</Text>
                  </View>
                  <Ionicons name={requesterExpanded ? "chevron-up" : "chevron-down"} size={24} color="#64748b" />
                </TouchableOpacity>
                {requesterExpanded && (
                  <View style={styles.dropdownContent}>
                    <Text style={styles.detailText}><Text style={styles.bold}>Role:</Text> {order.requester_details?.role}</Text>
                    <Text style={styles.detailText}><Text style={styles.bold}>Email:</Text> {order.requester_details?.email}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.okButton} onPress={() => router.replace('/(donor)')}>
          <Text style={styles.okButtonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  
  detailsContainer: { width: '100%', alignItems: 'center' },
  card: { 
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: { fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 18, color: '#1e293b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownContent: { marginTop: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8 },
  detailText: { fontSize: 15, color: '#475569', marginBottom: 4 },
  bold: { fontWeight: 'bold', color: '#1e293b' },
  
  footer: { padding: 24, paddingBottom: 40 },
  okButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  okButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' }
});
