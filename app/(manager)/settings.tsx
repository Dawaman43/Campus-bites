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
