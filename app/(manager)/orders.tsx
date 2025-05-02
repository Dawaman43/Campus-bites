import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getManagerOrders, getCurrentSession, getUserRole, Order } from '@/lib/appwrite';
import { ThemeContext } from '@/context/ThemeContext';

export default function OrdersScreen() {
  const { isDarkTheme } = useContext(ThemeContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        throw new Error('User not logged in');
      }

      const role = await getUserRole(session.userId);
      if (role !== 'hotel_manager') {
        throw new Error('Only managers can view orders');
      }

      const managerOrders = await getManagerOrders(session.userId);
      setOrders(managerOrders);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={themeStyles.orderCard}>
      <Text style={themeStyles.orderId}>Order #{item.$id.slice(0, 8)}</Text>
      <Text style={themeStyles.orderDetail}>Total: {item.total.toFixed(2)} ብር</Text>
      <Text style={themeStyles.orderDetail}>Payment: {item.paymentMethod}</Text>
      <Text style={themeStyles.orderDetail}>Phone: {item.phone}</Text>
      <Text style={themeStyles.orderDetail}>Status: {item.status}</Text>
      <Text style={themeStyles.orderDetail}>Date: {new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  const themeStyles = isDarkTheme ? darkStyles : lightStyles;

  return (
    <View style={themeStyles.container}>
      <Text style={themeStyles.title}>Restaurant Orders</Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={themeStyles.activityIndicator.color} style={themeStyles.loader} />
      ) : orders.length === 0 ? (
        <Text style={themeStyles.empty}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.$id}
          renderItem={renderOrder}
          contentContainerStyle={themeStyles.listContent}
        />
      )}
    </View>
  );
}

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F6F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  activityIndicator: {
    color: '#059669',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 40,
  },
  empty: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  activityIndicator: {
    color: '#ffa500',
  },
});
