import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, DeviceEventEmitter, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '../../utils/api';
import SurplusCard from '../../components/SurplusCard';
import { MotiView } from 'moti';
import AnimatedSearchBar from '../../components/AnimatedSearchBar';
import AnimatedSegmentControl from '../../components/AnimatedSegmentControl';
import ButtonTwo from '../../components/ButtonTwo';
import { useAlert } from '../../context/AlertContext';

const ParticlesBackground = () => {
  // Generate a steady stream of faint, rising particles (like digital embers/fireflies)
  const particles = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 4 + 2;
    return (
      <MotiView
        key={i}
        from={{
          opacity: 0,
          translateY: 0,
          translateX: (Math.random() - 0.5) * 50,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          translateY: -300 - Math.random() * 200,
          translateX: (Math.random() - 0.5) * 150,
        }}
        transition={{
          loop: true,
          type: 'timing',
          duration: 5000 + Math.random() * 5000,
          delay: Math.random() * 4000,
        }}
        style={{
          position: 'absolute',
          bottom: -50,
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
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#042F2E', '#ffffffff']}
        style={StyleSheet.absoluteFill}
      />
      {particles}
    </View>
  );
};

let savedActiveTab: 'DONATION' | 'DISCOUNT' = 'DONATION';

export default function DonorDashboardScreen() {
  const { showAlert } = useAlert();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<'DONATION' | 'DISCOUNT'>(savedActiveTab);

  const setActiveTab = (tab: 'DONATION' | 'DISCOUNT') => {
    savedActiveTab = tab;
    setActiveTabState(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      fetchListings();
      
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  React.useEffect(() => {
    const sub = DeviceEventEmitter.addListener('claim_cancelled', (event) => {
      setListings(prev => prev.map(l => {
        if (l.id.toString() === event.listingId.toString()) {
          return { ...l, donor_status: 'Active', quantity_remaining: l.quantity_available };
        }
        return l;
      }));
    });
    return () => sub.remove();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings/?mine=true');
      setListings(response.data);
    } catch (error) {
      console.error("Failed to fetch listings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    showAlert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      "error",
      async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        try {
          await api.delete(`/listings/${id}/`);
          fetchListings();
        } catch (error) {
          showAlert("Error", "Failed to delete listing.", "error");
        }
      },
      "Delete",
      true,
      "Cancel"
    );
  };

  const renderItem = ({ item, index }: any) => {
    return (
      <SurplusCard
        item={item}
        index={index}
        onDelete={handleDelete}
        onExpire={(id: number) => setListings(prev => prev.map(l => l.id === id ? { ...l, forceExpired: true } : l))}
      />
    );
  };

  const filteredListings = listings.filter(item => {
    const matchesTab = item.listing_type === activeTab;
    const query = searchQuery.toLowerCase();
    const matchesSearch = query === '' ||
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroTitle}>Surplus Hub</Text>
            <Text style={styles.heroSubtitle}>Track and manage your active inventory</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="restaurant" size={24} color="#0D9488" />
          </View>
        </View>

        {/* Search & Filter Row */}
        <View style={styles.toolsContainer}>
          <View style={{ marginBottom: 16 }}>
            <AnimatedSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search surplus..."
              variant="dark"
            />
          </View>
          <AnimatedSegmentControl
            tabs={['Donations', 'Discounted']}
            activeTab={activeTab === 'DONATION' ? 'Donations' : 'Discounted'}
            onChange={(tab) => setActiveTab(tab === 'Donations' ? 'DONATION' : 'DISCOUNT')}
            variant="dark"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={isScreenFocused ? filteredListings : []}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              isScreenFocused ? (
                <View style={styles.emptyState}>
                  <Ionicons name="fast-food-outline" size={64} color="#CBD5E1" />
                  <Text style={styles.emptyStateTitle}>No active surplus</Text>
                  <Text style={styles.emptyStateSubtitle}>You don't have any items in this category. Post something new!</Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      {/* Primary Floating Action Button (Avoids Tab Bar Overlap) */}
      <MotiView
        from={{ scale: 1, translateY: 0 }}
        animate={{ scale: 1.05, translateY: -4 }}
        transition={{ loop: true, type: 'timing', duration: 1500 }}
        style={styles.fabContainer}
      >
        <ButtonTwo
          title="Post"
          icon="add"
          onPress={() => router.push('/(forms)/post-surplus/new' as any)}
          colors={['#042F2E', '#0D9488']}
          contentStyle={styles.fabGradient}
          textStyle={styles.fabText}
          sheen={true}
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c3cddbff',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  toolsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 200, // Extremely important: Clears the custom FAB AND Tab Bar
    paddingTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 130, // Shifted higher to completely avoid the Verify button
    right: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  fab: {
    // Moved positioning to fabContainer
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)', // Premium glassy edge
    overflow: 'hidden', // Contain the sheen
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  }
});
