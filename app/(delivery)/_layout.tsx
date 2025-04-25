import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


const CustomHeader = ({ title }) => {
  const router = useRouter();
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={() => router.push('/settings')}>
        <Ionicons name="settings-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

const DeliveryLayout = () => {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          header: ({ route }) => <CustomHeader title={route.name} />,
          contentStyle: styles.screenContent,
        }}
      >
        <Stack.Screen
          name="home"
          options={{
            title: 'Home',
          }}
        />
        <Stack.Screen
          name="orders"
          options={{
            title: 'Orders',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Stack>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  screenContent: {
    backgroundColor: '#F5F5F5',
  },
});

export default DeliveryLayout;