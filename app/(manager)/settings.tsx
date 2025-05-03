import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { checkAndRestoreSession, getUserInfo, Logout, databases, account, config, uploadFile } from '@/lib/appwrite';
import { images } from '@/constants/images';
import { ThemeContext } from '@/context/ThemeContext';
import { LanguageContext } from '@/context/LanguageContext';

const Settings = () => {
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isError, setIsError] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    reminders: false,
  });
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
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
          setNewEmail(userInfo.email || '');
          // Load notification preferences
          const notifs = await AsyncStorage.getItem('notifications');
          const isPublic = await AsyncStorage.getItem('isPublicProfile');
          if (notifs) setNotifications(JSON.parse(notifs));
          if (isPublic) setIsPublicProfile(JSON.parse(isPublic));
        } else {
          setModalMessage(t('loginPrompt'));
          setIsError(true);
          setModalVisible(true);
        }
      } catch (error: any) {
        setModalMessage(t('userInfoError'));
        setIsError(true);
        setModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [t]);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
      await AsyncStorage.setItem('isPublicProfile', JSON.stringify(isPublicProfile));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [notifications, isPublicProfile]);

  const handleUpdateAvatar = async () => {
    const options = {
      mediaType: 'photo' as const,
      maxWidth: 300,
      maxHeight: 300,
    };
    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        setModalMessage(`${t('profilePictureError')}: ${response.errorMessage}`);
        setIsError(true);
        setModalVisible(true);
        return;
      }
      if (response.assets && response.assets[0].uri) {
        setUploadingImage(true);
        try {
          const fileDoc = await uploadFile(response.assets[0].uri);
          const avatarUrl = `${config.endpoint}/storage/buckets/${config.storageId}/files/${fileDoc.$id}/view?project=${config.projectId}`;
          await databases.updateDocument(
            config.databaseId,
            config.userCollectionId,
            user.$id,
            { avatar: avatarUrl }
          );
          setUser({ ...user, avatar: avatarUrl });
          setModalMessage(t('profilePictureSuccess'));
          setIsError(false);
          setModalVisible(true);
        } catch (error: any) {
          setModalMessage(t('profilePictureError'));
          setIsError(true);
          setModalVisible(true);
        } finally {
          setUploadingImage(false);
        }
      }
    });
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername.length < 3) {
      setModalMessage(t('usernameError'));
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
      setModalMessage(t('usernameSuccess'));
      setIsError(false);
      setModalVisible(true);
      setIsEditingUsername(false);
    } catch (error: any) {
      setModalMessage(t('usernameErrorMsg'));
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim() || !emailRegex.test(newEmail)) {
      setModalMessage(t('emailError'));
      setIsError(true);
      setModalVisible(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await account.updateEmail(newEmail, user.email);
      await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        user.$id,
        { email: newEmail }
      );
      setUser({ ...user, email: newEmail });
      setModalMessage(t('emailSuccess'));
      setIsError(false);
      setModalVisible(true);
      setIsEditingEmail(false);
    } catch (error: any) {
      setModalMessage(t('emailErrorMsg'));
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      setModalMessage(t('passwordError'));
      setIsError(true);
      setModalVisible(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await account.updatePassword(newPassword);
      setModalMessage(t('passwordSuccess'));
      setIsError(false);
      setModalVisible(true);
      setIsEditingPassword(false);
    } catch (error: any) {
      setModalMessage(t('passwordErrorMsg'));
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const newValue = { ...prev, [key]: !prev[key] };
      saveSettings();
      setModalMessage(`${t(key)} ${newValue[key] ? t('enabled') : t('disabled')}`);
      setIsError(false);
      setModalVisible(true);
      return newValue;
    });
  };

  const toggleProfileVisibility = async () => {
    setIsSubmitting(true);
    try {
      await databases.updateDocument(
        config.databaseId,
        config.userCollectionId,
        user.$id,
        { isPublic: !isPublicProfile }
      );
      setIsPublicProfile(prev => {
        const newValue = !prev;
        saveSettings();
        setModalMessage(`${t('profileVisibilitySuccess')} ${newValue ? t('public') : t('private')}`);
        setIsError(false);
        setModalVisible(true);
        return newValue;
      });
    } catch (error: any) {
      setModalMessage(t('profileVisibilityError'));
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await Logout();
      setModalMessage(t('logoutSuccess'));
      setIsError(false);
      setModalVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/Login');
      }, 1500);
    } catch (error: any) {
      setModalMessage(t('logoutError'));
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
      setModalMessage(t('deleteAccountSuccess'));
      setIsError(false);
      setModalVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/Login');
      }, 1500);
    } catch (error: any) {
      setModalMessage(t('deleteAccountError'));
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDarkTheme ? 'bg-gray-900' : 'bg-white'}`}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView className={`flex-1 ${isDarkTheme ? 'bg-gray-900' : 'bg-white'} p-5`}>
      <View className="bg-orange-500 p-6 rounded-b-2xl mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleUpdateAvatar} disabled={uploadingImage} accessibilityLabel={t('changeProfilePicture')}>
            <Image
              source={user?.avatar ? { uri: user.avatar } : images.icon}
              className="w-16 h-16 rounded-full mr-4"
            />
            {uploadingImage && (
              <ActivityIndicator size="small" color="#FFFFFF" className="absolute top-0 left-0 right-0 bottom-0" />
            )}
          </TouchableOpacity>
          <View>
            <Text className="text-white text-2xl font-roboto-bold">
              {t('welcome')}, {user?.username || 'Guest'}!
            </Text>
            <Text className="text-white text-base font-roboto">
              {user?.email || t('manageSettings')}
            </Text>
          </View>
        </View>
      </View>

      <Text className={`text-2xl font-roboto-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-orange-500'}`}>
        {t('profile')}
      </Text>
       <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('username')}
          </Text>
          <Ionicons name="person-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} />
        </View>
        {isEditingUsername ? (
          <View className="flex-row items-center mt-2">
            <TextInput
              className={`flex-1 border ${isDarkTheme ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg p-2 mr-2`}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder={t('enterUsername')}
              placeholderTextColor={isDarkTheme ? '#9ca3af' : '#d1d5db'}
              accessibilityLabel={t('enterUsername')}
            />
            <TouchableOpacity
              className="bg-orange-500 rounded-lg p-2"
              onPress={handleUpdateUsername}
              disabled={isSubmitting}
              accessibilityLabel={t('saveUsername')}
            >
              <Ionicons name="checkmark" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 rounded-lg p-2 ml-2"
              onPress={() => setIsEditingUsername(false)}
              accessibilityLabel={t('cancelEdit')}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row justify-between items-center p-2"
            onPress={() => setIsEditingUsername(true)}
            accessibilityLabel={t('editUsername')}
          >
            <Text className={`text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {user?.username || t('setUsername')}
            </Text>
            <Ionicons name="pencil" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} />
          </TouchableOpacity>
        )}
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('email')}
          </Text>
          <Ionicons name="mail-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} />
        </View>
        {isEditingEmail ? (
          <View className="flex-row items-center mt-2">
            <TextInput
              className={`flex-1 border ${isDarkTheme ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg p-2 mr-2`}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder={t('enterEmail')}
              placeholderTextColor={isDarkTheme ? '#9ca3af' : '#d1d5db'}
              keyboardType="email-address"
              accessibilityLabel={t('enterEmail')}
            />
            <TouchableOpacity
              className="bg-orange-500 rounded-lg p-2"
              onPress={handleUpdateEmail}
              disabled={isSubmitting}
              accessibilityLabel={t('saveEmail')}
            >
              <Ionicons name="checkmark" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 rounded-lg p-2 ml-2"
              onPress={() => setIsEditingEmail(false)}
              accessibilityLabel={t('cancelEdit')}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row justify-between items-center p-2"
            onPress={() => setIsEditingEmail(true)}
            accessibilityLabel={t('editEmail')}
          >
            <Text className={`text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {user?.email || t('setEmail')}
            </Text>
            <Ionicons name="pencil" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} />
          </TouchableOpacity>
        )}
      </View>

      <Text className={`text-2xl font-roboto-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-orange-500'}`}>
        {t('preferences')}
      </Text>

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="moon-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} className="mr-2" />
          <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('darkMode')}
          </Text>
        </View>
        <Switch
          value={isDarkTheme}
          onValueChange={toggleTheme}
          thumbColor={isDarkTheme ? '#f97316' : '#f4f4f5'}
          trackColor={{ false: '#d1d5db', true: '#fb923c' }}
          accessibilityLabel={t('toggleDarkMode')}
        />
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} className="mr-2" />
            <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('notifications')}
            </Text>
          </View>
        </View>
        <View className="mt-2">
          {Object.keys(notifications).map(key => (
            <View key={key} className="flex-row justify-between items-center p-2">
              <Text className={`text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {t(key)}
              </Text>
              <Switch
                value={notifications[key as keyof typeof notifications]}
                onValueChange={() => toggleNotification(key as keyof typeof notifications)}
                thumbColor={notifications[key as keyof typeof notifications] ? '#f97316' : '#f4f4f5'}
                trackColor={{ false: '#d1d5db', true: '#fb923c' }}
                accessibilityLabel={`${t('toggle')} ${t(key)}`}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="language-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} className="mr-2" />
            <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('language')}
            </Text>
          </View>
        </View>
        <View className="flex-row mt-2">
          {(['en', 'am'] as const).map(lang => (
            <TouchableOpacity
              key={lang}
              className={`flex-1 p-2 rounded-lg mr-2 ${language === lang ? 'bg-orange-500' : isDarkTheme ? 'bg-gray-800' : 'bg-gray-200'}`}
              onPress={() => {
                console.log('Changing language to:', lang);
                setLanguage(lang);
                setModalMessage(`${t('languageSuccess')} ${t(lang)}`);
                setIsError(false);
                setModalVisible(true);
              }}
              accessibilityLabel={`${t('setLanguage')} ${t(lang)}`}
            >
              <Text className={`text-center ${language === lang ? 'text-white' : isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {t(lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text className={`text-2xl font-roboto-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-orange-500'}`}>
        {t('security')}
      </Text>

      <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="lock-closed-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} className="mr-2" />
            <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
              {t('password')}
            </Text>
          </View>
        </View>
        {isEditingPassword ? (
          <View className="flex-row items-center mt-2">
            <TextInput
              className={`flex-1 border ${isDarkTheme ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-black'} rounded-lg p-2 mr-2`}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('enterPassword')}
              placeholderTextColor={isDarkTheme ? '#9ca3af' : '#d1d5db'}
              secureTextEntry
              accessibilityLabel={t('enterPassword')}
            />
            <TouchableOpacity
              className="bg-orange-500 rounded-lg p-2"
              onPress={handleUpdatePassword}
              disabled={isSubmitting}
              accessibilityLabel={t('savePassword')}
            >
              <Ionicons name="checkmark" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 rounded-lg p-2 ml-2"
              onPress={() => setIsEditingPassword(false)}
              accessibilityLabel={t('cancelEdit')}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row justify-between items-center p-2"
            onPress={() => setIsEditingPassword(true)}
            accessibilityLabel={t('changePassword')}
          >
            <Text className={`text-base ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('changePassword')}
            </Text>
            <Ionicons name="pencil" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} />
          </TouchableOpacity>
        )}
      </View>

      <Text className={`text-2xl font-roboto-bold mb-4 ${isDarkTheme ? 'text-white' : 'text-orange-500'}`}>
        {t('account')}
      </Text>

      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={20} color={isDarkTheme ? '#d1d5db' : '#4b5563'} className="mr-2" />
          <Text className={`text-lg font-roboto-medium ${isDarkTheme ? 'text-gray-200' : 'text-gray-700'}`}>
            {t('publicProfile')}
          </Text>
        </View>
        <Switch
          value={isPublicProfile}
          onValueChange={toggleProfileVisibility}
          thumbColor={isPublicProfile ? '#f97316' : '#f4f4f5'}
          trackColor={{ false: '#d1d5db', true: '#fb923c' }}
          accessibilityLabel={t('toggleProfileVisibility')}
        />
      </View>

      <TouchableOpacity
        className={`bg-orange-500 rounded-lg py-4 px-6 mb-4 ${isSubmitting ? 'opacity-60' : ''}`}
        onPress={handleLogout}
        disabled={isSubmitting}
        accessibilityLabel={t('logout')}
      >
        <Text className="text-white text-lg font-roboto-bold text-center">
          {t('logout')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-red-500 rounded-lg py-4 px-6 mb-10"
        onPress={() => {
          setModalMessage(t('deleteAccountPrompt'));
          setIsError(true);
          setModalVisible(true);
        }}
        accessibilityLabel={t('deleteAccount')}
      >
        <Text className="text-white text-lg font-roboto-bold text-center">
          {t('deleteAccount')}
        </Text>
      </TouchableOpacity>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        animationIn="zoomIn"
        animationOut="zoomOut"
        className="m-5"
      >
        <View className={`bg-white rounded-xl p-6 items-center ${isDarkTheme ? 'bg-gray-800' : 'bg-white'}`}>
          <Ionicons
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={40}
            color={isError ? '#ff4444' : '#00cc00'}
          />
          <Text className={`text-xl font-roboto-bold mt-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            {isError ? t('confirmation') : t('success')}
          </Text>
          <Text className={`text-base text-center my-4 max-w-md ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            {modalMessage}
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className="bg-orange-500 rounded-lg py-2 px-6"
              onPress={() => {
                setModalVisible(false);
                if (!isError && modalMessage.includes(t('success'))) {
                  if (modalMessage.includes(t('logoutSuccess')) || modalMessage.includes(t('deleteAccountSuccess'))) {
                    router.replace('/(auth)/Login');
                  }
                } else if (modalMessage === t('deleteAccountPrompt')) {
                  handleDeleteAccount();
                }
              }}
              accessibilityLabel={modalMessage === t('deleteAccountPrompt') ? t('confirmDelete') : t('closeModal')}
            >
              <Text className="text-white font-roboto-bold">
                {modalMessage === t('deleteAccountPrompt') ? t('confirm') : 'OK'}
              </Text>
            </TouchableOpacity>
            {modalMessage === t('deleteAccountPrompt') && (
              <TouchableOpacity
                className="bg-gray-500 rounded-lg py-2 px-6 ml-2"
                onPress={() => setModalVisible(false)}
                accessibilityLabel={t('cancelDelete')}
              >
                <Text className="text-white font-roboto-bold">{t('cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Settings;
