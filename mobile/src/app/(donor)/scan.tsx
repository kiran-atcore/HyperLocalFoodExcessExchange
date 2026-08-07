import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DonorScanScreen() {
  const [isScanning, setIsScanning] = useState(true);

  const simulateScan = () => {
    setIsScanning(false);
    Alert.alert(
      "Scan Successful",
      "Consumer verified! Order #1234 has been marked as picked up.",
      [
        { text: "Done", onPress: () => {
          setIsScanning(true);
          router.replace('/(donor)');
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Pickup QR</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        {/* Dummy Camera View */}
        <View style={styles.scannerFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          
          <Ionicons name="scan-outline" size={80} color="rgba(255,255,255,0.2)" />
        </View>
        <Text style={styles.instructions}>Position the Consumer's or Shelter's QR code within the frame to verify pickup.</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.simulateBtn} onPress={simulateScan}>
          <Text style={styles.simulateBtnText}>Simulate Scan Success</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#111111', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  
  cameraContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative'
  },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#10b981' },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
  
  instructions: { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  
  footer: { padding: 32, paddingBottom: 48 },
  simulateBtn: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  simulateBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});