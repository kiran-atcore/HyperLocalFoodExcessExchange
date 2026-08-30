import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/users/admin/analytics/');
      setData(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  const maxWeekly = Math.max(...data.weekly_donations.values, 10);
  const totalUsers = data.user_distribution.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const totalOrders = data.order_outcomes.reduce((acc: number, curr: any) => acc + curr.value, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={{ flex: 1 }} onPress={() => setSelectedDay(null)}>

        {/* Weekly Donations Chart */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Weekly Donations</Text>
          <View style={styles.barsContainer}>
            {data.weekly_donations.labels.map((day: string, idx: number) => {
              const val = data.weekly_donations.values[idx] || 0;
              const height = (val / maxWeekly) * 100;
              const isSelected = selectedDay === idx;
              
              return (
                <TouchableOpacity 
                  key={day + idx} 
                  style={styles.barCol}
                  onPress={() => setSelectedDay(isSelected ? null : idx)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <View style={styles.floatingCard}>
                      <Text style={styles.floatingCardTitle}>{day}</Text>
                      <Text style={styles.floatingCardValue}>
                        {val} {val === 1 ? 'Donation' : 'Donations'}
                      </Text>
                    </View>
                  )}
                  <View style={[
                    styles.bar, 
                    { 
                      height: `${Math.max(height, 5)}%`, 
                      backgroundColor: isSelected ? '#1e40af' : (idx === 6 ? '#3b82f6' : '#cbd5e1') 
                    }
                  ]} />
                  <Text style={[styles.barLabel, isSelected && { color: '#1e40af', fontWeight: 'bold' }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* User Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>User Demographics</Text>
          <Text style={styles.totalText}>Total Active Users: {totalUsers}</Text>
          {data.user_distribution.map((item: any, idx: number) => {
            const width = totalUsers > 0 ? (item.value / totalUsers) * 100 : 0;
            return (
              <View key={idx} style={styles.hBarContainer}>
                <View style={styles.hBarLabelRow}>
                  <Text style={styles.hBarLabel}>{item.label}</Text>
                  <Text style={styles.hBarValue}>{item.value}</Text>
                </View>
                <View style={styles.hBarBackground}>
                  <View style={[styles.hBarFill, { width: `${width}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Order Outcomes */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Order Outcomes</Text>
          <Text style={styles.totalText}>Total Orders: {totalOrders}</Text>
          {data.order_outcomes.map((item: any, idx: number) => {
            const width = totalOrders > 0 ? (item.value / totalOrders) * 100 : 0;
            return (
              <View key={idx} style={styles.hBarContainer}>
                <View style={styles.hBarLabelRow}>
                  <Text style={styles.hBarLabel}>{item.label}</Text>
                  <Text style={styles.hBarValue}>{item.value}</Text>
                </View>
                <View style={styles.hBarBackground}>
                  <View style={[styles.hBarFill, { width: `${width}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backButton: { padding: 4, marginRight: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  
  // Vertical Bars (Weekly Donations)
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 10 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 14, borderRadius: 7, marginBottom: 8 },
  barLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  floatingCard: { position: 'absolute', bottom: '100%', marginBottom: 12, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, alignItems: 'center', minWidth: 90, zIndex: 10 },
  floatingCardTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 2, textAlign: 'center' },
  floatingCardValue: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },

  // Horizontal Bars (Demographics & Outcomes)
  totalText: { fontSize: 14, color: '#64748b', marginBottom: 16, marginTop: -8 },
  hBarContainer: { marginBottom: 16 },
  hBarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  hBarLabel: { fontSize: 14, color: '#475569', fontWeight: '500' },
  hBarValue: { fontSize: 14, color: '#0f172a', fontWeight: 'bold' },
  hBarBackground: { height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' },
  hBarFill: { height: '100%', borderRadius: 6 }
});
