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

export default function SuccessfulPickups() {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/admin/list/?status=PICKED_UP');
      setOrders(response.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const title = (order.listing_details?.title || '').toLowerCase();
    const id = order.id.toString();
    const isDonation = (order.listing_details?.listing_type || '').toUpperCase() === 'DONATION';
    const type = isDonation ? 'donation' : 'deal';
    const q = searchQuery.toLowerCase();
    return title.includes(q) || id.includes(q) || type.includes(q);
  });

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isDonation = (item.listing_details?.listing_type || '').toUpperCase() === 'DONATION';
    const typeLabel = isDonation ? 'Donation' : 'Deal';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'timing', duration: 350, delay: Math.min(index * 45, 300) }}
      >
        <View style={styles.card}>
          <View style={[styles.iconContainer, isDonation ? styles.donationIconContainer : styles.dealIconContainer]}>
            <Ionicons
              name={isDonation ? "gift" : "pricetag"}
              size={20}
              color={isDonation ? "#34D399" : "#FBBF24"}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>Order #{item.id} • {item.listing_details?.title || 'Surplus Portion'}</Text>
            <Text style={styles.sub}>
              Quantity: {item.quantity || 1} • {item.listing_details?.donor_name || 'Verified Kitchen'}
            </Text>
          </View>
          <View style={styles.rightBadgesCol}>
            <View style={[styles.typeBadge, isDonation ? styles.donationBadge : styles.dealBadge]}>
              <Text style={[styles.typeBadgeText, isDonation ? styles.donationBadgeText : styles.dealBadgeText]}>
                {typeLabel}
              </Text>
            </View>
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
            <Text style={styles.headerTitle}>Successful Pickups</Text>
            <Text style={styles.headerSubtitle}>{orders.length} Fulfilled Orders</Text>
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
            placeholder="Search order ID or listing..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            variant="dark"
          />
        </MotiView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#5EEAD4" />
            <Text style={styles.loadingText}>Fetching fulfilled exchanges...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
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
                <Ionicons name="leaf-outline" size={48} color="#64748B" />
                <Text style={styles.empty}>No matching pickups found.</Text>
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
    marginBottom: 12,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donationIconContainer: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  dealIconContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', marginBottom: 2 },
  sub: { fontSize: 12, color: '#94A3B8' },
  rightBadgesCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 8,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  donationBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  dealBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  donationBadgeText: {
    color: '#34D399',
  },
  dealBadgeText: {
    color: '#FBBF24',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#34D399', marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#34D399' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  empty: { marginTop: 12, color: '#94A3B8', fontSize: 14, fontWeight: '500' },
});
