import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function AdminDashboardScreen() {
  const { logout } = useContext(AuthContext);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/admin/stats/');
      setData(response.data);
    } catch (e) {
      Alert.alert("Error", "Could not load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'approval': return <Ionicons name="checkmark-circle" size={20} color="#10b981" />;
      case 'donation': return <Ionicons name="fast-food" size={20} color="#f59e0b" />;
      case 'rejection': return <Ionicons name="close-circle" size={20} color="#ef4444" />;
      default: return <Ionicons name="person" size={20} color="#3b82f6" />;
    }
  };

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(false)}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1e40af" />
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    { id: 1, title: 'Total Users', value: data.total_users.toString(), icon: 'people', color: '#3b82f6', bg: '#eff6ff' },
    { id: 2, title: 'Active Kitchens', value: data.active_kitchens.toString(), icon: 'restaurant', color: '#f59e0b', bg: '#fffbeb' },
    { id: 3, title: 'Active Shelters', value: data.active_shelters.toString(), icon: 'home', color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 4, title: 'Successful Pickups', value: data.successful_pickups.toString(), icon: 'leaf', color: '#10b981', bg: '#ecfdf5' },
  ];

  const maxWeekly = Math.max(...data.weekly_donations, 10); // Minimum scale of 10 to avoid exaggerated bars
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout(false)}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={{ flex: 1 }} onPress={() => setSelectedDay(null)}>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Overview</Text>
          <Text style={styles.welcomeDesc}>Here is what's happening on your platform today.</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.iconWrapper, { backgroundColor: stat.bg }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardHeader}>Weekly Donations</Text>
          <View style={styles.barsContainer}>
            {days.map((day, idx) => {
              const val = data.weekly_donations[idx] || 0;
              const height = (val / maxWeekly) * 100;
              const isSelected = selectedDay === idx;
              
              return (
                <TouchableOpacity 
                  key={day} 
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
                      backgroundColor: isSelected ? '#1e40af' : (idx === 5 ? '#3b82f6' : '#cbd5e1') 
                    }
                  ]} />
                  <Text style={[styles.barLabel, isSelected && { color: '#1e40af', fontWeight: 'bold' }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.cardHeader}>Recent Activity</Text>
          {data.recent_activity.length > 0 ? (
            data.recent_activity.map((activity: any, index: number) => (
              <View key={activity.id} style={[styles.activityRow, index === data.recent_activity.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.activityIcon}>
                  {getIconForType(activity.type)}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>No recent activity.</Text>
          )}
        </View>
        
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 4, fontSize: 13 },
  content: { padding: 16, paddingBottom: 40 },
  
  welcomeSection: { marginBottom: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  welcomeDesc: { fontSize: 14, color: '#64748b' },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconWrapper: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  statTitle: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  
  chartCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 10 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 6, marginBottom: 8 },
  barLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  floatingCard: { position: 'absolute', bottom: '100%', marginBottom: 12, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, alignItems: 'center', minWidth: 90, zIndex: 10 },
  floatingCardTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 2, textAlign: 'center' },
  floatingCardValue: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },

  activityCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 14, color: '#1e293b', fontWeight: '500', marginBottom: 2 },
  activityTime: { fontSize: 12, color: '#94a3b8' }
});
