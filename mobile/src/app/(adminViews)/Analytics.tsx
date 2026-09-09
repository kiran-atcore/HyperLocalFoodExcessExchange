import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
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
      <View style={styles.container}>
        <LinearGradient
          colors={['#042F2E', '#0B132B', '#021815']}
          style={styles.bgGradient}
        />
        <SafeAreaView style={styles.center} edges={['top']}>
          <ActivityIndicator size="large" color="#5EEAD4" />
          <Text style={styles.loadingText}>Compiling telemetry analytics...</Text>
        </SafeAreaView>
      </View>
    );
  }

  const weeklyValues: number[] = Array.isArray(data.weekly_donations)
    ? data.weekly_donations
    : (data.weekly_donations?.values || []);
  const weeklyLabels: string[] = Array.isArray(data.weekly_donations?.labels)
    ? data.weekly_donations.labels
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totalWeekly = data.weekly_donations?.total ?? weeklyValues.reduce((a: number, b: number) => a + b, 0);
  const maxWeekly = Math.max(...weeklyValues, 10);
  const totalUsers = data.user_distribution.reduce((acc: number, curr: any) => acc + curr.value, 0);
  const totalOrders = data.order_outcomes ? data.order_outcomes.reduce((acc: number, curr: any) => acc + curr.value, 0) : 0;

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
            <Text style={styles.headerTitle}>Network Analytics</Text>
            <Text style={styles.headerSubtitle}>System Performance & Trends</Text>
          </View>
          <View style={{ width: 40 }} />
        </MotiView>
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable style={{ flex: 1 }} onPress={() => setSelectedDay(null)}>

            {/* Weekly Donations Chart */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 80 }}
              style={styles.card}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeader}>Weekly Donations</Text>
                  <Text style={styles.cardSubtitle}>{totalWeekly} {totalWeekly === 1 ? 'donation' : 'donations'} past 7 days</Text>
                </View>
                <View style={styles.metricBadge}>
                  <Text style={styles.metricBadgeText}>{totalWeekly} Total</Text>
                </View>
              </View>

              <View style={styles.barsContainer}>
                {weeklyLabels.map((day: string, idx: number) => {
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

            {/* User Distribution */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 180 }}
              style={styles.card}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeader}>User Demographics</Text>
                  <Text style={styles.cardSubtitle}>Total Platform Members: {totalUsers}</Text>
                </View>
                <Ionicons name="people" size={20} color="#5EEAD4" />
              </View>

              {data.user_distribution.map((item: any, idx: number) => {
                const pct = totalUsers > 0 ? Math.round((item.value / totalUsers) * 100) : 0;
                return (
                  <View key={idx} style={styles.hBarContainer}>
                    <View style={styles.hBarLabelRow}>
                      <Text style={styles.hBarLabel}>{item.label}</Text>
                      <Text style={styles.hBarValue}>{item.value} <Text style={styles.hBarPct}>({pct}%)</Text></Text>
                    </View>
                    <View style={styles.hBarBackground}>
                      <View style={[styles.hBarFill, { width: `${pct}%`, backgroundColor: item.color || '#5EEAD4' }]} />
                    </View>
                  </View>
                );
              })}
            </MotiView>

            {/* Order Outcomes */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 280 }}
              style={styles.card}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardHeader}>Order Outcomes</Text>
                  <Text style={styles.cardSubtitle}>Total Orders: {totalOrders}</Text>
                </View>
                <Ionicons name="receipt" size={20} color="#34D399" />
              </View>

              {(data.order_outcomes || []).map((item: any, idx: number) => {
                const rawPct = totalOrders > 0 ? (item.value / totalOrders) * 100 : 0;
                const roundedPct = Math.round(rawPct);
                const displayPct = rawPct > 0 && roundedPct === 0 ? '<1' : roundedPct;
                const barWidth = item.value > 0 ? Math.max(roundedPct, 3) : 0;
                return (
                  <View key={idx} style={styles.hBarContainer}>
                    <View style={styles.hBarLabelRow}>
                      <Text style={styles.hBarLabel}>{item.label}</Text>
                      <Text style={styles.hBarValue}>{item.value} <Text style={styles.hBarPct}>({displayPct}%)</Text></Text>
                    </View>
                    <View style={styles.hBarBackground}>
                      <View style={[styles.hBarFill, { width: `${barWidth}%`, backgroundColor: item.color || '#34D399' }]} />
                    </View>
                  </View>
                );
              })}
            </MotiView>

          </Pressable>
        </ScrollView>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
  cardSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  metricBadge: {
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
  },
  metricBadgeText: { fontSize: 10, fontWeight: '700', color: '#5EEAD4' },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, paddingTop: 20 },
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
  hBarContainer: { marginBottom: 14 },
  hBarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hBarLabel: { fontSize: 13, color: '#CBD5E1', fontWeight: '600' },
  hBarValue: { fontSize: 13, color: '#F8FAFC', fontWeight: '700' },
  hBarPct: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  hBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hBarFill: { height: '100%', borderRadius: 4 },
});
