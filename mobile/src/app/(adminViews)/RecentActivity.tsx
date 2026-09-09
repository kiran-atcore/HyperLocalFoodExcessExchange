import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import api from '../../utils/api';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';

export default function RecentActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/users/admin/activity-logs/');
      setLogs(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    (log.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconForType = (type: string) => {
    switch (type) {
      case 'approval': return <Ionicons name="checkmark-circle" size={18} color="#5EEAD4" />;
      case 'donation': return <Ionicons name="fast-food" size={18} color="#F59E0B" />;
      case 'rejection': return <Ionicons name="close-circle" size={18} color="#FB7185" />;
      case 'ban': return <Ionicons name="warning" size={18} color="#F43F5E" />;
      default: return <Ionicons name="person" size={18} color="#818CF8" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'approval': return { bg: 'rgba(94, 234, 212, 0.12)', border: 'rgba(94, 234, 212, 0.3)' };
      case 'donation': return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' };
      case 'rejection': return { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' };
      case 'ban': return { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)' };
      default: return { bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.3)' };
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const badge = getBadgeStyle(item.type);
    return (
      <MotiView
        from={{ opacity: 0, translateY: 16, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'timing', duration: 350, delay: Math.min(index * 45, 300) }}
      >
        <View style={styles.card}>
          <View style={[styles.iconContainer, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            {getIconForType(item.type)}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.text}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        </View>
      </MotiView>
    );
  };

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
            <Text style={styles.headerTitle}>System Activity Logs</Text>
            <Text style={styles.headerSubtitle}>Full Audit & Event Stream</Text>
          </View>
          <View style={{ width: 40 }} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350, delay: 100 }}
          style={styles.searchWrapper}
        >
          <AnimatedSearchBar
            placeholder="Filter audit logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="dark"
          />
        </MotiView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching audit logs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 350 }}
                style={styles.emptyBox}
              >
                <Ionicons name="document-text-outline" size={48} color="#64748B" />
                <Text style={styles.empty}>No matching audit logs.</Text>
              </MotiView>
            }
          />
        )}
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: '#F8FAFC', marginBottom: 2, lineHeight: 18 },
  time: { fontSize: 11, color: '#94A3B8' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});
