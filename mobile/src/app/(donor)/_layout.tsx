import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DonorTabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#3b82f6' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kitchen',
          tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color }) => <Ionicons name="qr-code-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tax"
        options={{
          title: 'Tax Docs',
          tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
