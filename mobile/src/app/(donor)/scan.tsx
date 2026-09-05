import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useAlert } from '../../context/AlertContext';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

export default function DonorScanScreen() {
  const { showAlert, hideAlert } = useAlert();
  const { order_id, qr_code_id } = useLocalSearchParams<{ order_id?: string; qr_code_id?: string }>();
  const [isFocused, setIsFocused] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const isFocusedRef = useRef(true);

  // Animation for the scanning laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Focus Key for Moti Animations
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      setIsFocused(true);
      setScanned(false);
      setIsScanning(false);
      setFocusKey(prev => prev + 1);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: SCANNER_SIZE,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();

      return () => {
        isFocusedRef.current = false;
        setIsFocused(false);
        setScanned(true);
        setIsScanning(false);
        scanLineAnim.stopAnimation();
        hideAlert();
      };
    }, [])
  );

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#042F2E', '#020617']} style={styles.absoluteFill} />
        <SafeAreaView style={styles.permissionContent}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.permissionIconWrapper}
          >
            <Ionicons name="camera" size={80} color="#5EEAD4" />
          </MotiView>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>We need your permission to access the camera to scan pickup QR codes.</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
            <LinearGradient colors={['#0D9488', '#0F766E']} style={styles.absoluteFill} />
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (!isFocusedRef.current || scanned || isScanning) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanned(true);

    let scannedData = data;
    if (typeof scannedData === 'string') {
      scannedData = scannedData.trim();
      if (scannedData.startsWith('claim:')) {
        scannedData = scannedData.split(':')[1].trim();
      }
    }

    if (!isFocusedRef.current) return;

    if (!scannedData) {
      showAlert("Error", "No valid QR data found.", "error", () => setScanned(false));
      return;
    }

    // If expected QR was passed from request details, validate against it
    if (qr_code_id && qr_code_id.trim()) {
      const cleanScanned = scannedData.toLowerCase().trim();
      const cleanExpected = qr_code_id.toLowerCase().trim();
      const matchesQr = cleanScanned === cleanExpected;
      const matchesOrderId = order_id && cleanScanned === order_id.toString().trim();

      if (!matchesQr && !matchesOrderId) {
        showAlert(
          "Invalid QR Code", 
          "The scanned QR code does not match this specific pickup request.", 
          "warning",
          () => setScanned(false),
          "Try Again",
          true,
          "Cancel",
          () => router.replace('/(donor)')
        );
        return;
      }
    }

    setIsScanning(true);
    try {
      const response = await api.post(`/orders/complete_qr/`, { 
        qr_code_id: scannedData,
        expected_order_id: order_id || undefined,
      });
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

      showAlert(
        "Scan Failed",
        errorMsg,
        "error",
        () => setScanned(false),
        "Try Again",
        true,
        "Cancel",
        () => router.replace('/(donor)')
      );
    } finally {
      if (isFocusedRef.current) {
        setIsScanning(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Background acts as the fallback before camera loads */}
      <LinearGradient colors={['#042F2E', '#020617']} style={styles.absoluteFill} />

      <CameraView
        style={styles.absoluteFill}
        facing={facing}
        onBarcodeScanned={scanned || !isFocused ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Dark overlay with cutout using border sizes */}
      <View style={styles.overlayWrapper}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />

          {/* Transparent Hole for Scanner */}
          <MotiView
            key={`frame-${focusKey}`}
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, delay: 200 }}
            style={styles.scannerHole}
          >
            {/* The Target Corners */}
            <View style={styles.targetCornerTL} />
            <View style={styles.targetCornerTR} />
            <View style={styles.targetCornerBL} />
            <View style={styles.targetCornerBR} />

            {/* Animated Laser Line */}
            {!scanned && (
              <Animated.View style={[styles.laserLine, { transform: [{ translateY: scanLineAnim }] }]}>
                <LinearGradient
                  colors={['rgba(94, 234, 212, 0.0)', 'rgba(94, 234, 212, 0.8)', 'rgba(94, 234, 212, 0.0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.absoluteFill}
                />
              </Animated.View>
            )}

            {/* Scanned Success Glow */}
            {scanned && (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={[styles.absoluteFill, { backgroundColor: 'rgba(16, 185, 129, 0.3)' }]}
              />
            )}
          </MotiView>

          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      <SafeAreaView style={styles.safeAreaOverlay}>
        {/* Floating Header */}
        <MotiView
          key={`header-${focusKey}`}
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.headerPill}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.absoluteFill}
          />
          <Ionicons name="qr-code-outline" size={20} color="#5EEAD4" />
          <Text style={styles.headerText}>Scan Pickup QR</Text>
        </MotiView>

        {/* Floating Footer Controls */}
        <View style={styles.footerControls}>
          <MotiView
            key={`instructions-${focusKey}`}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 300 }}
          >
            <Text style={styles.instructionsText}>
              {scanned ? "Verifying..." : "Align QR code within the frame"}
            </Text>
          </MotiView>

        </View>

        {/* Floating Flip Button (Bottom Right to avoid Tab Bar) */}
        <MotiView
          key={`flip-${focusKey}`}
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 400 }}
          style={styles.flipBtnContainer}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.flipBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFacing(f => f === 'back' ? 'front' : 'back');
            }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
              style={styles.absoluteFill}
            />
            <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </MotiView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safeAreaOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, zIndex: 2 },

  // Custom Dark Overlay around the Scanner Hole
  overlayWrapper: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  overlayTop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)' },
  overlayRow: { flexDirection: 'row', height: SCANNER_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)' },

  scannerHole: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },

  // Animated Laser Line
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#5EEAD4',
    shadowColor: '#5EEAD4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 10,
  },

  // Target Corners
  targetCornerTL: { position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#5EEAD4', borderTopLeftRadius: 16 },
  targetCornerTR: { position: 'absolute', top: -2, right: -2, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#5EEAD4', borderTopRightRadius: 16 },
  targetCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#5EEAD4', borderBottomLeftRadius: 16 },
  targetCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#5EEAD4', borderBottomRightRadius: 16 },

  // Floating Header Pill
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    marginTop: 20,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  // Footer Controls
  footerControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionsText: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 80, // Extra margin to ensure it clears the tab bar
    textAlign: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  flipBtnContainer: {
    position: 'absolute',
    top: 180, // Safely above the bottom tab bar
    right: 60,
    zIndex: 10,
  },
  flipBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },

  // Permissions Screen
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  permissionIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(94, 234, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.3)',
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  permissionText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  permissionBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
