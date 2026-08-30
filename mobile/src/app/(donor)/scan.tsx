import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../utils/api';

export default function DonorScanScreen() {
  const { order_id } = useLocalSearchParams();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const isFocusedRef = React.useRef(true);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      setScanned(false);
      setIsScanning(false);
      
      return () => {
        isFocusedRef.current = false;
      };
    }, [])
  );

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ textAlign: 'center', color: 'white', marginBottom: 20 }}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.simulateBtn} onPress={requestPermission}>
          <Text style={styles.simulateBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    setScanned(true);
    // Parse the QR code data. If it starts with "claim:", extract the ID.
    let targetOrderId = order_id || data;
    if (typeof targetOrderId === 'string' && targetOrderId.startsWith('claim:')) {
      targetOrderId = targetOrderId.split(':')[1];
    }

    if (!targetOrderId) {
      Alert.alert("Error", "No valid order ID found.", [{ text: "OK", onPress: () => setScanned(false) }]);
      return;
    }
    
    setIsScanning(true);
    try {
      const response = await api.post(`/orders/complete_qr/`, { qr_code_id: targetOrderId });
      if (!isFocusedRef.current) return;
      router.push(`/(views)/success/${response.data.order_id}` as any);
    } catch (e: any) {
      if (!isFocusedRef.current) return;
      
      let errorMsg = "Could not verify QR code. Please ensure this is a valid pickup code.";
      if (e.response?.status === 404) {
        errorMsg = "Invalid or unrecognized QR code. This order could not be found.";
      } else if (e.response?.data?.error) {
        errorMsg = e.response.data.error;
      } else if (e.response?.data?.detail) {
        errorMsg = e.response.data.detail;
      }

      Alert.alert(
        "Scan Failed", 
        errorMsg,
        [
          { text: "Cancel", style: "cancel", onPress: () => router.replace('/(donor)') },
          { text: "Try Again", onPress: () => setScanned(false) }
        ]
      );
    } finally {
      if (isFocusedRef.current) {
        setIsScanning(false);
      }
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan Pickup QR</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={[styles.scannerOverlay, StyleSheet.absoluteFill]}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructions}>
            {scanned ? "Processing QR code..." : "Position the Consumer's or Shelter's QR code within the frame to verify pickup."}
          </Text>
        </View>
        <TouchableOpacity 
          style={{ position: 'absolute', top: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, borderRadius: 50 }}
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#111111', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 24 },
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
  simulateBtn: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', margin: 20 },
  simulateBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});
