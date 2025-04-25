import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import { checkAndRestoreSession, getUserInfo, Logout, databases, account, config } from '@/lib/appwrite'; 
import { images } from '@/constants/images';

const Settings = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const { session } = await checkAndRestoreSession();
        if (session) {
          const userInfo = await getUserInfo(session.userId);
          setUser(userInfo);
          setNewUsername(userInfo.username || '');
        } else {
          setModalMessage('Please log in to access settings');
          setIsError(true);
          setModalVisible(true);
        }
      } catch (error: any) {
        setModalMessage(error.message || 'Failed to load user info');
        setIsError(true);
        setModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await Logout();
      setModalMessage('Logged out successfully');
      setIsError(false);
      setModalVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/Login');
      }, 1500);
    } catch (error: any) {
      setModalMessage(error.message || 'An error occurred during logout');
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setModalMessage('Username cannot be empty');
      setIsError(true);
      setModalVisible(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        user.$id,
        { username: newUsername }
      );
      await account.updateName(newUsername);
      setUser({ ...user, username: newUsername });
      setModalMessage('Username updated successfully');
      setIsError(false);
      setModalVisible(true);
      setIsEditing(false);
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to update username');
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    try {
      await databases.deleteDocument(config.databaseId, config.userCollectionId, user.$id);
      await account.delete();
      setModalMessage('Account deleted successfully');
      setIsError(false);
      setModalVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/Login');
      }, 1500);
    } catch (error: any) {
      setModalMessage(error.message || 'Failed to delete account');
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setModalMessage(`Switched to ${isDarkMode ? 'Light' : 'Dark'} Mode`);
    setIsError(false);
    setModalVisible(true);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    setModalMessage(`Notifications ${notificationsEnabled ? 'disabled' : 'enabled'}`);
    setIsError(false);
    setModalVisible(true);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-5`}>
  
      <View className="bg-orange-500 p-6 rounded-b-2xl mb-6">
        <View className="flex-row items-center">
          <Image
            source={user?.avatar ? { uri: user.avatar } : images.icon}
            className="w-16 h-16 rounded-full mr-4"
          />
          <View>
            <Text className="text-white text-2xl font-roboto font-bold">
              Welcome, {user?.username || 'Guest'}!
            </Text>
            <Text className="text-white text-base font-roboto">
              {user?.email || 'Manage your account settings'}
            </Text>
          </View>
        </View>
      </View>

     
      <View className="flex-1">
        <Text className={`text-3xl font-roboto font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-orange-500'}`}>
          Settings
        </Text>

     
        <View className="mb-4">
          <Text className={`text-lg font-roboto font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Username
          </Text>
          {isEditing ? (
            <View className="flex-row items-center">
              <TextInput
                className={`flex-1 border ${isDarkMode ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg p-2 mr-2`}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter new username"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#d1d5db'}
              />
              <TouchableOpacity
                className="bg-orange-500 rounded-lg p-2"
                onPress={handleUpdateUsername}
                disabled={isSubmitting}
              >
                <Ionicons name="checkmark" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-500 rounded-lg p-2 ml-2"
                onPress={() => setIsEditing(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row justify-between items-center p-2"
              onPress={() => setIsEditing(true)}
            >
              <Text className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {user?.username || 'Set username'}
              </Text>
              <Ionicons name="pencil" size={20} color={isDarkMode ? '#d1d5db' : '#4b5563'} />
            </TouchableOpacity>
          )}
        </View>

       
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-roboto font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Dark Mode
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            thumbColor={isDarkMode ? '#f97316' : '#f4f4f5'}
            trackColor={{ false: '#d1d5db', true: '#fb923c' }}
          />
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-lg font-roboto font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Push Notifications
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            thumbColor={notificationsEnabled ? '#f97316' : '#f4f4f5'}
            trackColor={{ false: '#d1d5db', true: '#fb923c' }}
          />
        </View>

     
        <TouchableOpacity
          className={`bg-orange-500 rounded-lg py-4 px-6 mb-4 ${isSubmitting ? 'opacity-60' : ''}`}
          onPress={handleLogout}
          disabled={isSubmitting}
        >
          <Text className="text-white text-lg font-roboto font-bold text-center">
            Logout
          </Text>
        </TouchableOpacity>

    
        <TouchableOpacity
          className="bg-red-500 rounded-lg py-4 px-6"
          onPress={() => {
            setModalMessage('Are you sure you want to delete your account? This action cannot be undone.');
            setIsError(true);
            setModalVisible(true);
          }}
        >
          <Text className="text-white text-lg font-roboto font-bold text-center">
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        className="m-5"
      >
        <View className="bg-white rounded-xl p-6 items-center">
          <Ionicons
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={40}
            color={isError ? '#ff4444' : '#00cc00'}
          />
          <Text className="text-xl font-roboto font-bold mt-4 text-gray-800">
            {isError ? 'Confirmation' : 'Success'}
          </Text>
          <Text className="text-base text-gray-600 text-center my-4">
            {modalMessage}
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className="bg-orange-500 rounded-lg py-2 px-6"
              onPress={() => {
                setModalVisible(false);
                if (!isError && modalMessage.includes('successfully')) {
                  router.replace('/(auth)/Login');
                } else if (modalMessage.includes('delete your account')) {
                  handleDeleteAccount();
                }
              }}
            >
              <Text className="text-white font-roboto font-bold">
                {modalMessage.includes('delete your account') ? 'Confirm' : 'OK'}
              </Text>
            </TouchableOpacity>
            {modalMessage.includes('delete your account') && (
              <TouchableOpacity
                className="bg-gray-500 rounded-lg py-2 px-6 ml-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white font-roboto font-bold">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Settings;