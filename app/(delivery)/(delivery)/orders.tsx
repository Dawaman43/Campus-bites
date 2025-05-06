import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemeContext } from '@/context/ThemeContext';
import { getUserInfo, acceptDeliveryAssignment, getDeliveryAssignments, Order, databases, config, account } from '@/lib/appwrite';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';

interface CustomerInfo {
  username: string;
  email: string;
}

interface Delivery {
  $id: string;
  name?: string;
  order: string | { $id: string };
  deliveryPersonId: string;
}

export default function DeliveryOrderScreen() {
  const { isDarkTheme } = useContext(ThemeContext);
  const params = useLocalSearchParams();
  const router = useRouter();
  const orderId = params.orderId as string | undefined;
  const [order, setOrder] = useState<Order | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Received orderId from route params:', orderId);
    if (!orderId) {
      setError('No order ID provided. Please select an order.');
      setIsLoading(false);
      return;
    }
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Starting fetchOrderDetails for orderId:', orderId);


      if (!orderId || typeof orderId !== 'string' || orderId.length > 36) {
        throw new Error(`Invalid order ID: ${orderId}`);
      }

      console.log('Checking current session...');
      const session = await account.getSession('current').catch((e) => {
        console.error('Session check failed:', e);
        return null;
      });
      console.log('Current session:', session);
      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      console.log('Fetching order document with:', {
        databaseId: config.databaseId,
        orderCollectionId: config.orderCollectionId,
        orderId,
      });
      let orderDoc;
      try {
        orderDoc = await databases.getDocument(
          config.databaseId,
          config.orderCollectionId,
          orderId
        );
      } catch (e: any) {
        console.error('Failed to fetch order document:', {
          message: e.message,
          code: e.code,
          type: e.type,
          stack: e.stack,
        });
        throw new Error(`Failed to fetch order: ${e.message}`);
      }
      console.log('Raw order document:', JSON.stringify(orderDoc, null, 2));

      const fetchedOrder: Order = {
        $id: orderDoc.$id || orderId,
        users: typeof orderDoc.users === 'object' && orderDoc.users?.$id ? orderDoc.users.$id : orderDoc.users || '',
        restaurant: Array.isArray(orderDoc.restaurant) ? orderDoc.restaurant : [],
        restaurantId: orderDoc.restaurantId || '',
        foodDetails: Array.isArray(orderDoc.foodDetails) ? orderDoc.foodDetails : [],
        total: orderDoc.total || 0,
        paymentMethod: orderDoc.paymentMethod || 'unknown',
        phone: orderDoc.phone || '',
        status: orderDoc.status || 'unknown',
        createdAt: orderDoc.createdAt || new Date().toISOString(),
        updatedAt: orderDoc.updatedAt || new Date().toISOString(),
        deliveryPersonId: orderDoc.deliveryPersonId || '',
      };
      console.log('Parsed order:', fetchedOrder);
      setOrder(fetchedOrder);

      let userId = fetchedOrder.users;
      console.log('Extracted userId for customer info:', userId);
      if (!userId || typeof userId !== 'string') {
        console.warn('Invalid or missing customer ID in order document:', userId);
        setCustomerInfo({ username: 'Unknown', email: 'N/A' });
      } else {
        console.log('Fetching customer info for userId:', userId);
        try {
          const userDoc = await getUserInfo(userId);
          console.log('Raw user document:', JSON.stringify(userDoc, null, 2));
          console.log('Customer info:', { username: userDoc.username, email: userDoc.email });
          setCustomerInfo({
            username: userDoc.username && typeof userDoc.username === 'string' ? userDoc.username : 'Unknown',
            email: userDoc.email && typeof userDoc.email === 'string' ? userDoc.email : 'N/A',
          });
        } catch (e: any) {
          console.error('Failed to fetch customer info for userId:', userId, {
            message: e.message,
            code: e.code,
            type: e.type,
            stack: e.stack,
          });
          setCustomerInfo({ username: 'Unknown', email: 'N/A' });
        }
      }

      console.log('Fetching delivery assignments for deliveryPersonId:', fetchedOrder.deliveryPersonId);
      let deliveries: Delivery[] = [];
      try {
        deliveries = await getDeliveryAssignments(fetchedOrder.deliveryPersonId || '');
      } catch (e: any) {
        console.error('Failed to fetch delivery assignments:', {
          message: e.message,
          code: e.code,
          type: e.type,
        });
        deliveries = [];
      }
      console.log('Delivery assignments:', deliveries);
      const delivery = deliveries.find(d => {
        const orderMatchId = typeof d.order === 'string' ? d.order : d.order?.$id;
        return orderMatchId === orderId;
      });
      if (delivery) {
        console.log('Found delivery assignment:', delivery);
        setDeliveryId(delivery.$id);
      } else {
        console.warn('No delivery assignment found for orderId:', orderId);
        setDeliveryId(null);
      }
    } catch (e: any) {
      console.error('Error in fetchOrderDetails:', {
        message: e.message,
        code: e.code,
        type: e.type,
        stack: e.stack,
      });
      setError(e.message || 'Failed to load order details');
      setOrder(null);
    } finally {
      setIsLoading(false);
      console.log('State after fetch:', { order, customerInfo, deliveryId, error });
    }
  };

  const handleAcceptDelivery = async () => {
    if (!deliveryId || !order) {
      Alert.alert('Error', 'No delivery assignment found');
      return;
    }

    try {
      console.log('Accepting delivery for deliveryId:', deliveryId, 'orderId:', order.$id);
      await acceptDeliveryAssignment(deliveryId, order.$id);
      Alert.alert('Success', 'Delivery accepted successfully');
      fetchOrderDetails(); 
    } catch (e: any) {
      console.error('Error accepting delivery:', {
        message: e.message,
        code: e.code,
        type: e.type,
        stack: e.stack,
      });
      Alert.alert('Error', e.message || 'Failed to accept delivery');
    }
  };

  const themeStyles = isDarkTheme ? darkStyles : lightStyles;

  if (isLoading) {
    return (
      <View style={themeStyles.loadingContainer}>
        <ActivityIndicator size="large" color={themeStyles.activityIndicator.color} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={themeStyles.errorContainer}>
        <Animatable.View
          animation="bounceIn"
          duration={1000}
          style={themeStyles.errorCard}
        >
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={isDarkTheme ? '#FFD700' : '#FF4500'}
            style={themeStyles.errorIcon}
          />
          <Text style={themeStyles.errorTitle}>No Order Present</Text>
          <Text style={themeStyles.errorMessage}>
            {error || 'The requested order could not be found.'}
          </Text>
          <TouchableOpacity
            style={themeStyles.backButton}
            onPress={() => router.push('/(delivery)/home')}
          >
            <Text style={themeStyles.backButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    );
  }

  return (
    <View style={themeStyles.container}>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={themeStyles.header}
      >
        <Ionicons
          name="cube-outline"
          size={40}
          color={isDarkTheme ? '#FFD700' : '#228B22'}
          style={themeStyles.headerIcon}
        />
        <Text style={themeStyles.title}>Order #{order.$id.slice(0, 8)}</Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        style={themeStyles.card}
      >
        <Text style={themeStyles.cardTitle}>Order Details</Text>
        <Text style={themeStyles.cardDetail}>Total: {order.total.toFixed(2)} ብር</Text>
        <Text style={themeStyles.cardDetail}>Payment: {order.paymentMethod}</Text>
        <Text style={themeStyles.cardDetail}>Phone: {order.phone}</Text>
        <Text style={themeStyles.cardDetail}>Status: {order.status}</Text>
        <Text style={themeStyles.cardDetail}>Date: {new Date(order.createdAt).toLocaleString()}</Text>
      </Animatable.View>

      <Animatable.View
        animation="fadeInUp"
        duration={1000}
        delay={200}
        style={themeStyles.card}
      >
        <Text style={themeStyles.cardTitle}>Customer Details</Text>
        <Text style={themeStyles.cardDetail}>Name: {customerInfo?.username || 'Unknown'}</Text>
        <Text style={themeStyles.cardDetail}>Email: {customerInfo?.email || 'N/A'}</Text>
      </Animatable.View>

      {order.status === 'assigned' && (
        <Animatable.View
          animation="zoomIn"
          duration={1000}
          style={themeStyles.buttonContainer}
        >
          <TouchableOpacity
            style={themeStyles.acceptButton}
            onPress={handleAcceptDelivery}
          >
            <Text style={themeStyles.acceptButtonText}>Accept Delivery</Text>
          </TouchableOpacity>
        </Animatable.View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F5',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F5',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  card: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#ffa500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#ffa500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  activityIndicator: {
    color: '#ffa500',
  },
});