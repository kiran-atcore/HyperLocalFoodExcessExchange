import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

import api from '../../utils/api';
import RequestCard from '../../components/RequestCard';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';
import AnimatedSegmentControl from '../../components/AnimatedSegmentControl';

let savedRequestsActiveTab: 'NGOs / Shelters' | 'Consumers' = 'NGOs / Shelters';

export default function DonorRequestsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<'NGOs / Shelters' | 'Consumers'>(savedRequestsActiveTab);

  const setActiveTab = (tab: 'NGOs / Shelters' | 'Consumers') => {
    savedRequestsActiveTab = tab;
    setActiveTabState(tab);
  };
  const [sortFilter, setSortFilter] = useState<'LATEST' | 'OLDEST' | 'SOONEST' | 'FURTHEST'>('LATEST');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchOrders();
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/');
      // Filter out picked up or cancelled/expired orders
      const activeOrders = response.data.filter((o: any) => o.status === 'PENDING' || o.status === 'APPROVED');
      setOrders(activeOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoExpire = async (orderId: number) => {
    setOrders(prev => prev.filter(c => c.id !== orderId));
    try {
      await api.patch(`/orders/${orderId}/expire/`);
    } catch (e) {
      console.error("Auto cancel failed", e);
    }
  };

  const isShelterOrder = (order: any): boolean => {
    if (order.listing_details?.listing_type === 'DONATION') return true;
    if (order.listing_details?.listing_type === 'DISCOUNT') return false;
    const role = (order.requester_details?.role || '').toLowerCase();
    return role === 'shelter';
  };

  const renderItem = ({ item, index }: any) => {
    return <RequestCard item={item} index={index} onExpire={handleAutoExpire} />;
  };

  const ngoOrders = orders.filter(o => isShelterOrder(o));
  const consumerOrders = orders.filter(o => !isShelterOrder(o));

  const displayedOrders = (activeTab === 'NGOs / Shelters' ? ngoOrders : consumerOrders)
    .filter(o => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const name = (o.requester_details?.name || '').toLowerCase();
      const title = (o.listing_details?.title || '').toLowerCase();
      const id = o.id ? o.id.toString() : '';
      return name.includes(query) || title.includes(query) || id.includes(query);
    })
    .sort((a, b) => {
      if (sortFilter === 'SOONEST') {
        const timeA = a.eta ? new Date(a.eta).getTime() : Infinity;
        const timeB = b.eta ? new Date(b.eta).getTime() : Infinity;
        return timeA - timeB;
      } else if (sortFilter === 'FURTHEST') {
        const timeA = a.eta ? new Date(a.eta).getTime() : 0;
        const timeB = b.eta ? new Date(b.eta).getTime() : 0;
        return timeB - timeA;
      } else if (sortFilter === 'OLDEST') {
        return a.id - b.id;
      } else {
        // LATEST
        return b.id - a.id;
      }
    });

  const getSortLabel = () => {
    switch (sortFilter) {
      case 'LATEST': return 'Latest';
      case 'OLDEST': return 'Oldest';
      case 'SOONEST': return 'Soonest ETA';
      case 'FURTHEST': return 'Furthest ETA';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#042F2E', '#d9dfe9ff']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Incoming Pickups</Text>
            <Text style={styles.heroSubtitle}>
              {ngoOrders.length} NGO • {consumerOrders.length} Consumer pending
            </Text>
          </View>
        </View>

        {/* Tools (Search, Tabs, Sort) */}
        <View style={styles.toolsContainer}>
          <View style={{ marginBottom: 16 }}>
            <AnimatedSearchBar 
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by requester or item..."
              variant="dark"
            />
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <AnimatedSegmentControl
              tabs={['NGOs / Shelters', 'Consumers']}
              activeTab={activeTab}
              onChange={(t) => setActiveTab(t as any)}
              variant="dark"
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.dropdownButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSortMenu(true);
              }}
            >
              <Ionicons name="filter" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.dropdownButtonText}>
                {getSortLabel()}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* List Content */}
        {loading ? (
          <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={isScreenFocused ? displayedOrders : []}
            extraData={activeTab}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isScreenFocused ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color="#475569" />
                  <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    There are no pending {activeTab === 'NGOs / Shelters' ? 'NGO / shelter' : 'consumer'} requests.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      {/* Glassmorphic Sort Modal */}
      <Modal visible={showSortMenu} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setShowSortMenu(false)}
          />
          <MotiView 
            from={{ translateY: 400, scale: 0.9, opacity: 0 }}
            animate={{ translateY: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            style={styles.menuWrapper}
          >
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.95)', 'rgba(2, 6, 23, 0.95)']}
              style={StyleSheet.absoluteFill}
            />
            {/* Inner Glow Border */}
            <View style={styles.menuInnerGlow} />

            <View style={styles.menuContainer}>
              <View style={styles.dragIndicator} />
              <Text style={styles.menuTitle}>Sort Requests</Text>
              
              <View style={styles.optionsGrid}>
                {[
                  { id: 'LATEST', label: 'Latest', sub: 'Newest first', icon: 'time' },
                  { id: 'OLDEST', label: 'Oldest', sub: 'Oldest first', icon: 'time-outline' },
                  { id: 'SOONEST', label: 'Soonest ETA', sub: 'Arriving soon', icon: 'flash' },
                  { id: 'FURTHEST', label: 'Furthest ETA', sub: 'Arriving later', icon: 'calendar-outline' }
                ].map((option, index) => {
                  const isActive = sortFilter === option.id;
                  return (
                    <MotiView
                      key={option.id}
                      from={{ opacity: 0, translateY: 15 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'spring', delay: index * 100 }}
                      style={{ width: '100%', marginBottom: 12 }}
                    >
                      <TouchableOpacity 
                        activeOpacity={0.8}
                        style={[styles.menuOptionBlock, isActive && styles.menuOptionBlockActive]} 
                        onPress={() => { 
                          Haptics.selectionAsync();
                          setSortFilter(option.id as any); 
                          setTimeout(() => setShowSortMenu(false), 200);
                        }}
                      >
                        {isActive && (
                          <LinearGradient
                            colors={['rgba(13, 148, 136, 0.8)', 'rgba(15, 118, 110, 0.9)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                            <Ionicons name={option.icon as any} size={20} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                          </View>
                          <View>
                            <Text style={[styles.menuOptionTitle, isActive && styles.menuOptionTitleActive]}>{option.label}</Text>
                            <Text style={[styles.menuOptionSub, isActive && styles.menuOptionSubActive]}>{option.sub}</Text>
                          </View>
                        </View>
                        {isActive && (
                          <MotiView from={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                            <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
                          </MotiView>
                        )}
                      </TouchableOpacity>
                    </MotiView>
                  );
                })}
              </View>
            </View>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#c3cddbff', 
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  toolsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dropdownButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dropdownButtonText: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: { 
    textAlign: 'center', 
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  listContent: { 
    paddingHorizontal: 20,
    paddingBottom: 150, // Clear the pill tab bar
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  emptyStateSubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  menuWrapper: {
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    overflow: 'hidden',
    marginBottom: -100, // Extends below the screen to cover the bounce gap
  },
  menuContainer: { 
    padding: 24, 
    paddingBottom: (Platform.OS === 'ios' ? 40 : 24) + 100, // Counters the negative margin so content stays put
    backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  menuTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 24, 
  },
  menuInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionsGrid: {
    marginTop: 8,
  },
  menuOptionBlock: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  menuOptionBlockActive: { 
    backgroundColor: 'transparent',
    borderColor: 'rgba(94, 234, 212, 0.3)',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconBoxActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuOptionTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  menuOptionTitleActive: { 
    color: '#FFFFFF', 
    fontWeight: '800' 
  },
  menuOptionSub: {
    fontSize: 13,
    color: 'rgba(148, 163, 184, 0.6)',
    fontWeight: '500',
  },
  menuOptionSubActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
