import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TaxDocsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Exemption Docs</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Section */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconBg}>
            <Ionicons name="shield-checkmark" size={32} color="#10b981" />
          </View>
          <Text style={styles.statusTitle}>Section 80G Verified</Text>
          <Text style={styles.statusDesc}>Your organization is fully verified under Section 80G to receive tax-deductible bulk donations in India.</Text>
        </View>

        <Text style={styles.sectionHeader}>Uploaded Documents</Text>

        {/* Dummy Document List */}
        <View style={styles.docCard}>
          <View style={styles.docIcon}>
            <Ionicons name="document-text" size={24} color="#3b82f6" />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>80G Approval Certificate.pdf</Text>
            <Text style={styles.docMeta}>Uploaded: Jan 12, 2024 • 1.2 MB</Text>
          </View>
          <TouchableOpacity style={styles.docAction}>
            <Ionicons name="eye-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.docCard}>
          <View style={styles.docIcon}>
            <Ionicons name="document-text" size={24} color="#3b82f6" />
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>12A Registration Certificate.pdf</Text>
            <Text style={styles.docMeta}>Uploaded: Jan 12, 2024 • 0.8 MB</Text>
          </View>
          <TouchableOpacity style={styles.docAction}>
            <Ionicons name="eye-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.uploadBtn}>
          <Ionicons name="cloud-upload-outline" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
          <Text style={styles.uploadBtnText}>Upload New Document</Text>
        </TouchableOpacity>

      </ScrollView>
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
  
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusIconBg: {
    backgroundColor: '#d1fae5',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  statusDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginLeft: 4 },
  
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  docIcon: {
    backgroundColor: '#eff6ff',
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  docMeta: { fontSize: 12, color: '#64748b' },
  docAction: { padding: 8 },

  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  uploadBtnText: { color: '#3b82f6', fontSize: 15, fontWeight: 'bold' }
});
