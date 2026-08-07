import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ShelterSettingsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoAccept, setAutoAccept] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Preferences Section */}
          <Text style={styles.sectionHeader}>Preferences & Notifications</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Push Notifications</Text>
                <Text style={styles.toggleDesc}>Alerts for nearby donations</Text>
              </View>
              <Switch 
                value={pushNotifications} 
                onValueChange={setPushNotifications} 
                trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                thumbColor={pushNotifications ? '#3b82f6' : '#f8fafc'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Email Summaries</Text>
                <Text style={styles.toggleDesc}>Weekly impact reports</Text>
              </View>
              <Switch 
                value={emailAlerts} 
                onValueChange={setEmailAlerts} 
                trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                thumbColor={emailAlerts ? '#3b82f6' : '#f8fafc'}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Auto-Accept Free Bulk</Text>
                <Text style={styles.toggleDesc}>Automatically claim free donations</Text>
              </View>
              <Switch 
                value={autoAccept} 
                onValueChange={setAutoAccept} 
                trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                thumbColor={autoAccept ? '#3b82f6' : '#f8fafc'}
              />
            </View>
          </View>

          {/* Security Section */}
          <Text style={styles.sectionHeader}>Account Security</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "Change Password flow will be here.")}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="lock-closed-outline" size={22} color="#64748b" />
                <Text style={styles.menuItemText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Coming Soon", "Active sessions management.")}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#64748b" />
                <Text style={styles.menuItemText}>Manage Active Sessions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  placeholder: { width: 32 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, fontSize: 15, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  toggleDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 15, color: '#1e293b', marginLeft: 12, fontWeight: '500' }
});
