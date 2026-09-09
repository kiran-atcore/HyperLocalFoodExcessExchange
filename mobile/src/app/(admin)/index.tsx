import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useFocusEffect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const ParticlesBackground = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 40,
        }}
        animate={{
          opacity: [0, 0.55, 0],
          translateY: -280 - Math.random() * 180,
          translateX: (Math.random() - 0.5) * 120,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 4000,
          delay: Math.random() * 3000,
        }}
        style={{
          position: 'absolute',
          bottom: -40,
          left: `${Math.random() * 100}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#5EEAD4',
          shadowColor: '#5EEAD4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size,
        }}
      />
    );
  });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={['#042F2E', '#0B132B', '#021815']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {particles}
    </View>
  );
};

export default function AdminDashboardScreen() {
  const { logout } = useContext(AuthContext);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchStats();
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/admin/stats/');
      setData(response.data);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not load admin stats.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout(false);
      router.replace('/(auth)/login');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Logout failed.',
      });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'approval': return <Ionicons name="checkmark-circle" size={18} color="#5EEAD4" />;
      case 'donation': return <Ionicons name="fast-food" size={18} color="#F59E0B" />;
      case 'rejection': return <Ionicons name="close-circle" size={18} color="#FB7185" />;
      case 'ban': return <Ionicons name="warning" size={18} color="#F43F5E" />;
      default: return <Ionicons name="person" size={18} color="#818CF8" />;
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#042F2E', '#0B132B', '#021815']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.loadingBox} edges={['top']}>
          <ActivityIndicator size="large" color="#5EEAD4" />
          <Text style={styles.loadingText}>Compiling dashboard telemetry...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const stats = [
    { id: 1, title: 'Total Users', value: data.total_users.toString(), icon: 'people', color: '#5EEAD4', route: '/(adminViews)/TotalUsers' },
    { id: 2, title: 'Active Kitchens', value: data.active_kitchens.toString(), icon: 'restaurant', color: '#F59E0B', route: '/(adminViews)/ActiveKitchens' },
    { id: 3, title: 'Active Shelters', value: data.active_shelters.toString(), icon: 'home', color: '#818CF8', route: '/(adminViews)/ActiveShelters' },
    { id: 4, title: 'Total Pickups', value: data.successful_pickups.toString(), icon: 'leaf', color: '#34D399', route: '/(adminViews)/SuccessfulPickups' },
  ];

  const weeklyValues: number[] = Array.isArray(data.weekly_donations)
    ? data.weekly_donations
    : (data.weekly_donations?.values || []);
  const weeklyLabels: string[] = Array.isArray(data.weekly_donations?.labels)
    ? data.weekly_donations.labels
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalWeekly = data.weekly_donations?.total ?? weeklyValues.reduce((a, b) => a + b, 0);
  const maxWeekly = Math.max(...weeklyValues, 10);

  return (
    <View style={styles.container}>
      <ParticlesBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.headerTitle}>System Oversight</Text>
            <Text style={styles.headerSubtitle}>Real-time network telemetry</Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={16} color="#FB7185" />
          </TouchableOpacity>
        </MotiView>
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isScreenFocused && (
            <Pressable style={{ flex: 1 }} onPress={() => setSelectedDay(null)}>
              {/* Bento Grid */}
              <View style={styles.statsGrid}>
                {stats.map((stat, idx) => (
                  <MotiView
                    key={stat.id}
                    from={{ opacity: 0, scale: 0.92, translateY: 15 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 14, stiffness: 180, delay: idx * 60 }}
                    style={{ width: '48%' }}
                  >
                    <TouchableOpacity 
                      style={[styles.statCard, { width: '100%' }]} 
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(stat.route as any);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.cardTopRow}>
                        <View style={[styles.iconWrapper, { borderColor: `${stat.color}40`, backgroundColor: `${stat.color}15` }]}>
                          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                        </View>
                        <Ionicons name="arrow-forward" size={14} color="#64748B" />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                    </TouchableOpacity>
                  </MotiView>
                ))}
              </View>

              {/* Weekly Donations Chart Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20, scale: 0.96 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 240 }}
                style={styles.chartCard}
              >
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeader}>Weekly Donations</Text>
                    <Text style={styles.chartSub}>{totalWeekly} {totalWeekly === 1 ? 'donation' : 'donations'} past 7 days</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewAnalyticsBtn} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/(adminViews)/Analytics');
                    }}
                  >
                    <Text style={styles.viewAnalyticsText}>Analytics</Text>
                    <Ionicons name="chevron-forward" size={12} color="#5EEAD4" />
                  </TouchableOpacity>
                </View>

                <View style={styles.barsContainer}>
                  {weeklyLabels.map((day, idx) => {
                    const val = weeklyValues[idx] || 0;
                    const height = (val / maxWeekly) * 100;
                    const isSelected = selectedDay === idx;
                    const isToday = idx === weeklyLabels.length - 1;
                    
                    return (
                      <TouchableOpacity 
                        key={day + idx} 
                        style={styles.barCol}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedDay(isSelected ? null : idx);
                        }}
                        activeOpacity={0.7}
                      >
                        {isSelected && (
                          <View style={[
                            styles.floatingCard,
                            idx === 0 && { left: 0 },
                            idx === weeklyLabels.length - 1 && { right: 0 }
                          ]}>
                            <Text style={styles.floatingCardTitle}>{day}{isToday ? ' (Today)' : ''}</Text>
                            <Text style={styles.floatingCardValue}>
                              {val} {val === 1 ? 'Donation' : 'Donations'}
                            </Text>
                          </View>
                        )}
                        <View style={[
                          styles.bar, 
                          { 
                            height: `${Math.max(height, 8)}%`, 
                            backgroundColor: isSelected 
                              ? '#5EEAD4' 
                              : isToday 
                                ? '#2DD4BF' 
                                : 'rgba(94, 234, 212, 0.35)' 
                          }
                        ]} />
                        <Text style={[
                          styles.barLabel, 
                          isSelected && { color: '#5EEAD4', fontWeight: '800' },
                          isToday && !isSelected && { color: '#2DD4BF', fontWeight: '700' }
                        ]}>{day}</Text>
                        {isToday && <View style={styles.todayIndicatorDot} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </MotiView>

              {/* Recent Activity Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20, scale: 0.96 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 320 }}
                style={styles.activityCard}
              >
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeader}>Audit Trail</Text>
                    <Text style={styles.chartSub}>Latest ecosystem events</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewAnalyticsBtn} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/(adminViews)/RecentActivity');
                    }}
                  >
                    <Text style={styles.viewAnalyticsText}>View All</Text>
                    <Ionicons name="chevron-forward" size={12} color="#5EEAD4" />
                  </TouchableOpacity>
                </View>

                {data.recent_activity.length > 0 ? (
                  data.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                    <View 
                      key={activity.id} 
                      style={[
                        styles.activityRow, 
                        index === Math.min(data.recent_activity.length, 5) - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={styles.activityIcon}>
                        {getIconForType(activity.type)}
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityText} numberOfLines={2}>{activity.text}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#64748B', fontStyle: 'italic', marginTop: 8 }}>No activity recorded yet.</Text>
                )}
              </MotiView>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021815' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeArea: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(94, 234, 212, 0.12)',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 11, color: '#5EEAD4', fontWeight: '600', marginTop: 1 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 110 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
  statTitle: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  chartCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeader: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  chartSub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  viewAnalyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  viewAnalyticsText: { color: '#5EEAD4', fontWeight: '700', fontSize: 12, marginRight: 2 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingTop: 20 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 14, borderRadius: 7, marginBottom: 8 },
  barLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5EEAD4',
    marginTop: 3,
  },
  floatingCard: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#0B132B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.35)',
    alignItems: 'center',
    minWidth: 80,
    zIndex: 10,
  },
  floatingCardTitle: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 1 },
  floatingCardValue: { color: '#5EEAD4', fontSize: 12, fontWeight: '800' },
  activityCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(94, 234, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 13, color: '#F1F5F9', fontWeight: '600', marginBottom: 2 },
  activityTime: { fontSize: 11, color: '#94A3B8' },
});
