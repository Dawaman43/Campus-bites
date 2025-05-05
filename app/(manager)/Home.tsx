import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TextInput,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { useRouter } from 'expo-router';
import { getManagerFoodPosts, getUserInfo, account, checkAndRestoreSession } from '@/lib/appwrite';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { Models } from 'react-native-appwrite';
import { debounce } from 'lodash';
import { ThemeContext } from '@/context/ThemeContext';
import { LanguageContext } from '@/context/LanguageContext';

type FoodItem = {
  $id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  Availablity: boolean;
  catagory: string;
};

const HomeScreen: React.FC = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext); 
  const router = useRouter();
  const [username, setUsername] = useState<string>('Manager');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCatagory, setSelectedCatagory] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });

  useEffect(() => {
    console.log('Theme changed. isDarkTheme:', isDarkTheme);
  }, [isDarkTheme]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('goodMorning');
    if (h < 18) return t('goodAfternoon');
    return t('goodEvening');
  }, [t]);

  const fetchFoods = useCallback(
    async (userId: string, reset: boolean = false) => {
      try {
        if (reset) {
          setIsLoading(true);
        }
        const all = await getManagerFoodPosts(userId);
        const newFoods = all.map((item: Models.Document) => ({
          $id: item.$id,
          name: item.name,
          description: item.description || t('noDescription'),
          price: item.price,
          image_url: item.image_url,
          Availablity: item.Availablity ?? true,
          catagory: item.catagory || 'unknown',
        }));
        setFoods(newFoods);
        applyFilters(newFoods, searchQuery, selectedCatagory, showAvailableOnly);
      } catch (err: any) {
        console.error('Error fetching foods:', err);
        setError(t('errorLoading'));
      } finally {
        if (reset) {
          setIsLoading(false);
        }
      }
    },
    [searchQuery, selectedCatagory, showAvailableOnly, t]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const { session } = await checkAndRestoreSession();
        if (!session) {
          setError(t('userNotLoggedIn'));
          router.push('/(auth)/login' as any);
          return;
        }

        const user = await account.get();
        const userInfo = await getUserInfo(user.$id);
        setUsername(userInfo.username || 'Manager');
        setAvatarUrl(userInfo.avatar || null);
        await fetchFoods(user.$id, true);
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        if (err.message.includes('User not found')) {
          setError(t('userInfoError'));
          router.push('/(auth)/login' as any);
        } else {
          setError(t('error'));
        }
      }
    };
    fetchData();
  }, [t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const user = await account.get();
      await fetchFoods(user.$id, true);
    } catch (err) {
      setError(t('errorLoading'));
    }
    setRefreshing(false);
  }, [t]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string, foods: FoodItem[], catagory: string, availableOnly: boolean) => {
        applyFilters(foods, query, catagory, availableOnly);
      }, 300),
    []
  );

  const applyFilters = (foodsToFilter: FoodItem[], query: string, catagory: string, availableOnly: boolean) => {
    let filtered = foodsToFilter;
    if (query) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    }
    if (catagory !== 'all') {
      filtered = filtered.filter(f => f.catagory.toLowerCase() === catagory);
    }
    if (availableOnly) {
      filtered = filtered.filter(f => f.Availablity);
    }
    setFilteredFoods(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text, foods, selectedCatagory, showAvailableOnly);
  };

  const handleCatagoryFilter = (catagory: string) => {
    setSelectedCatagory(catagory);
    applyFilters(foods, searchQuery, catagory, showAvailableOnly);
  };

  const handleAvailabilityToggle = () => {
    setShowAvailableOnly(prev => {
      const newValue = !prev;
      applyFilters(foods, searchQuery, selectedCatagory, newValue);
      return newValue;
    });
  };

  const handlePress = (food: FoodItem) => {
    setSelectedFood(food);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[themeStyles.card, isDarkTheme ? darkStyles.card : lightStyles.card]}
      activeOpacity={0.8}
      accessibilityLabel={t('viewDetails') + ' ' + item.name}
    >
      <Image source={{ uri: item.image_url }} style={themeStyles.cardImage} resizeMode="cover" />
      <View style={themeStyles.cardContent}>
        <Text style={[themeStyles.cardTitle, isDarkTheme ? darkStyles.cardTitle : lightStyles.cardTitle]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[themeStyles.cardPrice, isDarkTheme ? darkStyles.cardPrice : lightStyles.cardPrice]}>
          {item.price} {t('amount')}
        </Text>
        <View style={[themeStyles.availabilityBadge, item.Availablity ? themeStyles.inStock : themeStyles.outOfStock]}>
          <Text style={themeStyles.availabilityBadgeText}>
            {item.Availablity ? t('inStock') : t('outOfStock')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <Animatable.View
        animation="fadeInDown"
        duration={1000}
        style={[themeStyles.welcomeContainer, isDarkTheme ? darkStyles.welcomeContainer : lightStyles.welcomeContainer]}
      >
        <View style={themeStyles.welcomeGradientOverlay} />
        <View style={themeStyles.welcomeContent}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={themeStyles.welcomeIcon} />
          ) : (
            <Ionicons
              name="person-circle"
              size={100}
              color={isDarkTheme ? '#FFD700' : '#FF4500'}
              style={themeStyles.welcomeIcon}
            />
          )}
          <View style={themeStyles.welcomeTextContainer}>
            <Text style={[themeStyles.welcomeText, isDarkTheme ? darkStyles.welcomeText : lightStyles.welcomeText]} numberOfLines={1}>
              {greeting}, {username}!
            </Text>
            <Text style={[themeStyles.orderText, isDarkTheme ? darkStyles.orderText : lightStyles.orderText]}>
              {t('manageSettings')}
            </Text>
          </View>
        </View>
      </Animatable.View>

      <View style={[themeStyles.searchContainer, isDarkTheme ? darkStyles.searchContainer : lightStyles.searchContainer]}>
        <Ionicons
          name="search"
          size={22}
          color={isDarkTheme ? '#BBBBBB' : '#888888'}
          style={themeStyles.searchIcon}
        />
        <TextInput
          style={[themeStyles.searchInput, isDarkTheme ? darkStyles.searchInput : lightStyles.searchInput]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={isDarkTheme ? '#BBBBBB' : '#888888'}
          value={searchQuery}
          onChangeText={handleSearch}
          accessibilityLabel={t('searchPlaceholder')}
        />
      </View>

      <View style={[themeStyles.filtersContainer, isDarkTheme ? darkStyles.filtersContainer : lightStyles.filtersContainer]}>
        <Text style={[themeStyles.sectionTitle, isDarkTheme ? darkStyles.sectionTitle : lightStyles.sectionTitle]}>
          {t('filterMenu')}
        </Text>
        <View style={themeStyles.filterScroll}>
          {(['all', 'breakfast', 'lunch', 'dinner'] as const).map(catagory => (
            <TouchableOpacity
              key={catagory}
              style={[
                themeStyles.filterButton,
                isDarkTheme ? darkStyles.filterButton : lightStyles.filterButton,
                selectedCatagory === catagory && (isDarkTheme ? darkStyles.filterButtonActive : lightStyles.filterButtonActive),
              ]}
              onPress={() => handleCatagoryFilter(catagory)}
              activeOpacity={0.7}
            >
              <Text style={[themeStyles.filterButtonText, isDarkTheme ? darkStyles.filterButtonText : lightStyles.filterButtonText]}>
                {t(catagory)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[themeStyles.availabilityToggle, isDarkTheme ? darkStyles.availabilityToggle : lightStyles.availabilityToggle]}
          onPress={handleAvailabilityToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showAvailableOnly ? 'eye-off' : 'eye'}
            size={16}
            color={isDarkTheme ? '#FFFFFF' : '#333333'}
            style={themeStyles.availabilityIcon}
          />
          <Text style={[themeStyles.availabilityText, isDarkTheme ? darkStyles.availabilityText : lightStyles.availabilityText]}>
            {showAvailableOnly ? t('showAll') : t('inStockOnly')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[themeStyles.listSection, isDarkTheme ? darkStyles.listSection : lightStyles.listSection]}>
        <Text style={[themeStyles.sectionTitle, isDarkTheme ? darkStyles.sectionTitle : lightStyles.sectionTitle]}>
          {t('exploreMenu')}
        </Text>
      </View>

      {error && (
        <Animatable.View
          animation="shake"
          style={[themeStyles.errorContainer, isDarkTheme ? darkStyles.errorContainer : lightStyles.errorContainer]}
        >
          <Text style={[themeStyles.errorText, isDarkTheme ? darkStyles.errorText : lightStyles.errorText]}>
            {error}
          </Text>
        </Animatable.View>
      )}
    </>
  );

  const themeStyles = isDarkTheme ? darkStyles : lightStyles;

  if (!fontsLoaded) {
    return (
      <View style={[themeStyles.loadingContainer, { backgroundColor: isDarkTheme ? '#121212' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color={isDarkTheme ? '#FFD700' : '#FF4500'} />
      </View>
    );
  }

  return (
    <View style={[themeStyles.container, { backgroundColor: isDarkTheme ? '#121212' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkTheme ? '#121212' : '#228B22'}
        translucent={false}
      />
      {isLoading ? (
        <View style={themeStyles.skeletonContainer}>
          {[...Array(4)].map((_, i) => (
            <Animatable.View
              key={i}
              style={themeStyles.skeletonCard}
              animation="pulse"
              iterationCount="infinite"
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          keyExtractor={item => item.$id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={themeStyles.list}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <Text style={[themeStyles.emptyText, isDarkTheme ? darkStyles.emptyText : lightStyles.emptyText]}>
              {t('noFoodsFound')}
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDarkTheme ? '#FFD700' : '#FF4500']}
            />
          }
        />
      )}

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={themeStyles.modal}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.5}
      >
        <View style={themeStyles.modalContent}>
          {selectedFood && (
            <>
              <Image source={{ uri: selectedFood.image_url }} style={themeStyles.modalImage} resizeMode="cover" />
              <Text style={[themeStyles.modalTitle, isDarkTheme ? darkStyles.modalTitle : lightStyles.modalTitle]} numberOfLines={2}>
                {selectedFood.name}
              </Text>
              <Text style={[themeStyles.foodDescription, isDarkTheme ? darkStyles.foodDescription : lightStyles.foodDescription]} numberOfLines={3}>
                {selectedFood.description}
              </Text>
              <Text style={[themeStyles.modalPrice, isDarkTheme ? darkStyles.modalPrice : lightStyles.modalPrice]}>
                {selectedFood.price} {t('amount')}
              </Text>
              <Text style={[themeStyles.modalStatus, isDarkTheme ? darkStyles.modalStatus : lightStyles.modalStatus]}>
                {selectedFood.Availablity ? t('inStock') : t('outOfStock')}
              </Text>
              <TouchableOpacity
                style={[themeStyles.modalButton, isDarkTheme ? darkStyles.modalButton : lightStyles.modalButton]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={themeStyles.modalButtonText}>{t('closeModal')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  welcomeContainer: {
    backgroundColor: '#228B22',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 28,
    marginBottom: 20,
    height: 200,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF4500',
    transform: [{ translateY: -8 }],
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#333333',
  },
  filtersContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  filterScroll: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  filterButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  filterButtonActive: {
    backgroundColor: '#FF4500',
    borderColor: '#FF4500',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#333333',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  availabilityIcon: {
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#333333',
  },
  listSection: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#228B22',
    marginVertical: 12,
    textAlign: 'left',
  },
  card: {
    width: cardWidth,
    marginBottom: 20,
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
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
  cardPrice: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#FF4500',
    marginBottom: 6,
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#E6FFE6',
  },
  outOfStock: {
    backgroundColor: '#FFE6E6',
  },
  availabilityBadgeText: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: '#333333',
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
  },
  skeletonCard: {
    width: cardWidth,
    height: 220,
    backgroundColor: '#E0E0E0',
    borderRadius: 15,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#666666',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: 'Roboto_700Bold',
    color: '#228B22',
    marginBottom: 10,
  },
  foodDescription: {
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#555555',
    marginBottom: 10,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 18,
    fontFamily: 'Roboto_500Medium',
    color: '#FF4500',
    marginBottom: 10,
  },
  modalStatus: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#333333',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#FF4500',
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFDADA',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#C62828',
    textAlign: 'center',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#121212',
  },
  welcomeContainer: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    padding: 28,
    marginBottom: 20,
    height: 200,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
    transform: [{ translateY: -8 }],
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 15,
    paddingHorizontal: 14,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#FFFFFF',
  },
  filtersContainer: {
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: '#121212',
  },
  filterScroll: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  filterButton: {
    backgroundColor: '#3A3A3A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#3A3A3A',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  availabilityIcon: {
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
  },
  listSection: {
    marginHorizontal: 20,
    backgroundColor: '#121212',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    marginVertical: 12,
    textAlign: 'left',
  },
  card: {
    width: cardWidth,
    marginBottom: 20,
    marginHorizontal: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#FFD700',
    marginBottom: 6,
  },
  availabilityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#2A4D2A',
  },
  outOfStock: {
    backgroundColor: '#4D2A2A',
  },
  availabilityBadgeText: {
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#121212',
  },
  skeletonCard: {
    width: cardWidth,
    height: 220,
    backgroundColor: '#3A3A3A',
    borderRadius: 15,
    marginBottom: 20,
    marginHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
    color: '#BBBBBB',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 15,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  foodDescription: {
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#BBBBBB',
    marginBottom: 10,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 18,
    fontFamily: 'Roboto_500Medium',
    color: '#FFD700',
    marginBottom: 10,
  },
  modalStatus: {
    fontSize: 16,
    fontFamily: 'Roboto_500Medium',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#3D2C2C',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5A3E3E',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#FF6666',
    textAlign: 'center',
  },
});

export default HomeScreen;