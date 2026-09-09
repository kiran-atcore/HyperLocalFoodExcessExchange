import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  badgeBgColor?: string;
  value: number | string;
  label: string;
}

export function StatTile({
  icon,
  color = '#10B981',
  badgeBgColor,
  value,
  label,
}: StatTileProps) {
  return (
    <View style={styles.statTile}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        style={[
          styles.statIconBadge,
          badgeBgColor ? { backgroundColor: badgeBgColor } : null,
        ]}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export interface StatsCardProps {
  completed: number;
  active: number;
  completedLabel?: string;
  activeLabel?: string;
}

export default function StatsCard({
  completed,
  active,
  completedLabel = 'Total Rescued',
  activeLabel = 'Active Pickups',
}: StatsCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 100 }}
      style={styles.statsRow}
    >
      <StatTile
        icon="gift-outline"
        color="#10B981"
        badgeBgColor="rgba(16, 185, 129, 0.15)"
        value={completed}
        label={completedLabel}
      />
      <StatTile
        icon="time-outline"
        color="#38BDF8"
        badgeBgColor="rgba(56, 189, 248, 0.15)"
        value={active}
        label={activeLabel}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
});
