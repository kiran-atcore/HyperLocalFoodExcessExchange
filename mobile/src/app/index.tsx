import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function EntryScreen() {
  const { isAuthenticated, userRole, isApproved, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  if (userRole === 'admin') return <Redirect href="/(admin)" />;
  
  if (!isApproved && (userRole === 'donor' || userRole === 'shelter')) {
    return <Redirect href="/(views)/approval-pending/new" />;
  }

  if (userRole === 'donor') return <Redirect href="/(donor)" />;
  if (userRole === 'shelter') return <Redirect href="/(shelter)" />;
  
  return <Redirect href="/(consumer)/deals" />;
}
