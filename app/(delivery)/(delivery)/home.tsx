import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { databases, config, getCurrentSession, getUserInfo, getDeliveryAssignments, Order } from '@/lib/appwrite';
import { ThemeContext } from '@/context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

// Define style interfaces for type safety
interface Styles {
  container: ViewStyle;
  welcomeContainer: ViewStyle;
  welcomeGradientOverlay: ViewStyle;
  welcomeContent: ViewStyle;
  welcomeIcon: ViewStyle | ImageStyle;
  welcomeTextContainer: ViewStyle;
  welcomeText: TextStyle;
  orderText: TextStyle;
  statsContainer: ViewStyle;
  statCard: ViewStyle;
  statIcon: ViewStyle;
  statValue: TextStyle;
  statTitle: TextStyle;
  ordersSection: ViewStyle;
  sectionTitle: TextStyle;
  orderList: ViewStyle;
  card: ViewStyle;
  cardContent: ViewStyle;
  cardTitle: TextStyle;
  cardDetail: TextStyle;
  loader: ViewStyle;
  emptyText: TextStyle;
  loadingContainer: ViewStyle;
}

export default function DeliveryHomeScreen() {
  const { isDarkTheme } = useContext(ThemeContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('Delivery Pro');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    earnings: 0,
  });
  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const router = useRouter();

  // Define styles early to avoid runtime issues
  const styles: Styles = isDarkTheme ? darkStyles : lightStyles;

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    setIsLoading(true);
    try {
      const session = await getCurrentSession();
      if (!session) {
        console.warn('No session found, redirecting to login');
        router.replace({ pathname: '/login' } as Href);
        throw new Error('User not logged in');
      }
      console.log('Session userId:', session.userId);

      const userInfo = await getUserInfo(session.userId);
      console.log('User info:', { username: userInfo.username, avatar: userInfo.avatar });
      setUsername(userInfo.username || 'Delivery Pro');
      setAvatarUrl(userInfo.avatar || null);

      // Fetch delivery assignments
      console.log('Fetching delivery assignments for:', session.userId);
      const deliveries = await getDeliveryAssignments(session.userId);
      console.log('Deliveries fetched:', deliveries);
      const orderIds = deliveries
        .map(d => {
          if (typeof d.order === 'string') {
            return d.order;
          } else if (d.order?.$id) {
            return d.order.$id;
          } else {
            console.warn('Invalid order ID in delivery:', d);
            return null;
          }
        })
        .filter((id): id is string => id !== null);
      console.log('Order IDs:', orderIds);
      const fetchedOrders: Order[] = [];

      for (const orderId of orderIds) {
        try {
          console.log('Fetching order:', orderId);
          const orderDoc = await databases.getDocument(
            config.databaseId,
            config.orderCollectionId,
            orderId
          );
          fetchedOrders.push({
            $id: orderDoc.$id,
            users: typeof orderDoc.users === 'object' ? orderDoc.users.$id : orderDoc.users,
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
          });
        } catch (e: any) {
          console.error(`Error fetching order ${orderId}:`, e.message);
        }
      }

      console.log('Fetched orders:', fetchedOrders);
      setOrders(fetchedOrders);

      // Calculate stats
      const pending = fetchedOrders.filter(o => o.status === 'assigned' || o.status === 'picked_up').length;
      const completed = fetchedOrders.filter(o => o.status === 'delivered').length;
      const earnings = fetchedOrders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total * 0.1, 0); // Assume 10% commission

      setStats({ pending, completed, earnings });
    } catch (e: any) {
      console.error('Error fetching delivery data:', {
        message: e.message,
        code: e.code,
        type: e.type,
      });
      router.replace({ pathname: '/login' } as Href); // Redirect on error
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: '/(delivery)/orders', params: { orderId: item.$id } } as Href)
      }
    >
      <Animatable.View
        animation="fadeInUp"
        duration={800}
        style={[styles.card, isDarkTheme ? darkStyles.card : lightStyles.card]}
      >
        <View style={styles.cardContent}>
          <Text
            style={
              [
                styles.cardTitle,
                isDarkTheme ? darkStyles.cardTitle : lightStyles.cardTitle,
              ] as StyleProp<TextStyle>
            }
          >
            Order #{item.$id.slice(0, 8)}
          </Text>
          <Text
            style={
              [
                styles.cardDetail,
                isDarkTheme ? darkStyles.cardDetail : lightStyles.cardDetail,
              ] as StyleProp<TextStyle>
            }
          >
            Total: {item.total.toFixed(2)} ብር
          </Text>
          <Text
            style={
              [
                styles.cardDetail,
                isDarkTheme ? darkStyles.cardDetail : lightStyles.cardDetail,
              ] as StyleProp<TextStyle>
            }
          >
            Status: {item.status}
          </Text>
        </View>
      </Animatable.View>
    </TouchableOpacity>
  );

  const renderStatCard = (
    title: string,
    value: string | number,
    color: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <Animatable.View
      animation="zoomIn"
      duration={1000}
      style={[styles.statCard, { backgroundColor: color }, isDarkTheme ? darkStyles.statCard : lightStyles.statCard]}
    >
      <Ionicons name={icon} size={24} color="#FFFFFF" style={styles.statIcon} />
      <Text style={styles.statValue as StyleProp<TextStyle>}>{value}</Text>
      <Text style={styles.statTitle as StyleProp<TextStyle>}>{title}</Text>
    </Animatable.View>
  );

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkTheme ? '#121212' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={isDarkTheme ? '#FFD700' : '#FF4500'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkTheme ? '#121212' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkTheme ? '#121212' : '#228B22'}
      />
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={[styles.welcomeContainer, isDarkTheme ? darkStyles.welcomeContainer : lightStyles.welcomeContainer]}
      >
        <View style={styles.welcomeGradientOverlay} />
        <View style={styles.welcomeContent}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.welcomeIcon} />
          ) : (
            <Ionicons
              name="person-circle"
              size={80}
              color={isDarkTheme ? '#FFD700' : '#FF4500'}
              style={styles.welcomeIcon}
            />
          )}
          <View style={styles.welcomeTextContainer}>
            <Text
              style={[styles.welcomeText, isDarkTheme ? darkStyles.welcomeText : lightStyles.welcomeText] as StyleProp<TextStyle>}
            >
              Welcome, {username}!
            </Text>
            <Text
              style={[styles.orderText, isDarkTheme ? darkStyles.orderText : lightStyles.orderText] as StyleProp<TextStyle>}
            >
              Your Delivery Dashboard
            </Text>
          </View>
        </View>
      </Animatable.View>

      <View style={styles.statsContainer}>
        {renderStatCard('Pending Orders', stats.pending, '#ef4444', 'hourglass-outline')}
        {renderStatCard('Completed', stats.completed, '#10b981', 'checkmark-circle-outline')}
        {renderStatCard('Earnings', `${stats.earnings.toFixed(2)} ብር`, '#3b82f6', 'cash-outline')}
      </View>

      <View style={styles.ordersSection}>
        <Text
          style={[styles.sectionTitle, isDarkTheme ? darkStyles.sectionTitle : lightStyles.sectionTitle] as StyleProp<TextStyle>}
        >
          Recent Orders
        </Text>
        {isLoading ? (
          <ActivityIndicator size="large" color={isDarkTheme ? '#FFD700' : '#FF4500'} style={styles.loader} />
        ) : orders.length === 0 ? (
          <Text
            style={[styles.emptyText, isDarkTheme ? darkStyles.emptyText : lightStyles.emptyText] as StyleProp<TextStyle>}
          >
            No orders found.
          </Text>
        ) : (
          <FlatList
            data={orders.slice(0, 5)}
            keyExtractor={item => item.$id}
            renderItem={renderOrder}
            contentContainerStyle={styles.orderList}
          />
        )}
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

const lightStyles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  welcomeContainer: {
    backgroundColor: '#228B22',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    marginBottom: 20,
    height: 180,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  welcomeGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  orderText: {
    color: '#FF4500',
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 4,
  },
  statTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
  },
  ordersSection: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#228B22',
    marginVertical: 12,
  },
  orderList: {
    paddingBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#228B22',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#555555',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#666666',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const darkStyles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  welcomeContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 20,
    marginBottom: 20,
    height: 180,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  welcomeGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  orderText: {
    color: '#FFD700',
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    marginTop: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 4,
  },
  statTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
  },
  ordersSection: {
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    marginVertical: 12,
  },
  orderList: {
    paddingBottom: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
  },
  cardDetail: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#BBBBBB',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#BBBBBB',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});