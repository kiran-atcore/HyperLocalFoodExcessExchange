import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../context/AuthContext';
import { AlertProvider } from '../context/AlertContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AlertProvider>
        <StatusBar style="auto" />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#042F2E' } 
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(consumer)" />
          <Stack.Screen name="(donor)" />
          <Stack.Screen name="(shelter)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        <Toast />
      </AlertProvider>
    </AuthProvider>
  );
}
