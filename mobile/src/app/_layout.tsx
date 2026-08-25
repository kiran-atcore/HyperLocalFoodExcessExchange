import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(consumer)" />
        <Stack.Screen name="(donor)" />
        <Stack.Screen name="(shelter)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </AuthProvider>
  );
}
