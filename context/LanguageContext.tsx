import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databases, config, checkAndRestoreSession, getUserInfo } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

console.log('LanguageProvider Query:', Query);

interface Translation {
  [key: string]: string;
}

const translations: Record<'en' | 'am', Translation> = {
  en: {
    searchPlaceholder: 'Search food items...',
    all: 'All',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    noItems: 'No food items available',
    errorLoading: 'Failed to load food items',
    viewDetails: 'View Details',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    discoverMeals: 'Discover Delicious Meals',
    filterMenu: 'Filter Menu',
    exploreMenu: 'Explore Our Menu',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    showAll: 'Show All',
    inStockOnly: 'In Stock Only',
    noFoodsFound: 'No foods found. Try a different search or filter.',
    addToCart: 'Add to Cart',
    viewCart: 'View cart',
    noDescription: 'No description available',
    yourOrder: 'Your Order',
    noItemsInOrder: 'No items in your order.',
    total: 'Total',
    proceedToPayment: 'Proceed to Payment',
    choosePaymentMethod: 'Choose Payment Method',
    telebirr: 'Telebirr',
    mpesa: 'M-Pesa',
    cancel: 'Cancel',
    back: 'Back',
    telebirrPayment: 'Telebirr Payment',
    mpesaPayment: 'M-Pesa Payment',
    amount: 'Amount',
    enterTelebirrNumber: 'Enter Telebirr number',
    enterMpesaNumber: 'Enter M-Pesa number',
    payNow: 'Pay Now',
    error: 'Error',
    orderFailed: 'Order Failed',
    pleaseTryAgain: 'Please try again.',
    noItemsError: 'Please add food items to your order.',
    noPhoneError: 'Please enter your {method} number.',
    userNotLoggedIn: 'User not logged in',
    orderSuccess: 'Order placed and paid {amount} Birr via {method}!',
    remove: 'Remove',
    profile: 'Profile',
    username: 'Username',
    email: 'Email',
    preferences: 'Preferences',
    darkMode: 'Dark Mode',
    notifications: 'Notifications',
    orderUpdates: 'Order Updates',
    promotions: 'Promotions',
    reminders: 'Reminders',
    language: 'Language',
    security: 'Security',
    password: 'Password',
    account: 'Account',
    publicProfile: 'Public Profile',
    logout: 'Logout',
    deleteAccount: 'Delete Account',
    welcome: 'Welcome',
    manageSettings: 'Manage your account settings',
    editUsername: 'Edit username',
    saveUsername: 'Save username',
    cancelEdit: 'Cancel',
    enterUsername: 'Enter new username',
    enterEmail: 'Enter new email',
    enterPassword: 'Enter new password',
    changePassword: 'Change password',
    setLanguage: 'Set language to',
    toggle: 'Toggle',
    toggleDarkMode: 'Toggle dark mode',
    toggleProfileVisibility: 'Toggle profile visibility',
    changeProfilePicture: 'Change profile picture',
    saveEmail: 'Save email',
    savePassword: 'Save password',
    setUsername: 'Set username',
    setEmail: 'Set email',
    enabled: 'enabled',
    disabled: 'disabled',
    public: 'public',
    private: 'private',
    confirmation: 'Confirmation',
    success: 'Success',
    confirm: 'Confirm',
    closeModal: 'Close modal',
    confirmDelete: 'Confirm account deletion',
    cancelDelete: 'Cancel account deletion',
    en: 'English',
    am: 'Amharic',
    usernameError: 'Username must be at least 3 characters',
    emailError: 'Please enter a valid email address',
    passwordError: 'Password must be at least 8 characters',
    profilePictureSuccess: 'Profile picture updated successfully',
    profilePictureError: 'Failed to update profile picture',
    usernameSuccess: 'Username updated successfully',
    usernameErrorMsg: 'Failed to update username',
    emailSuccess: 'Email updated successfully',
    emailErrorMsg: 'Failed to update email',
    passwordSuccess: 'Password updated successfully',
    passwordErrorMsg: 'Failed to update password',
    languageSuccess: 'Language set to',
    languageError: 'Failed to update language',
    profileVisibilitySuccess: 'Profile is now',
    profileVisibilityError: 'Failed to update profile visibility',
    logoutSuccess: 'Logged out successfully',
    logoutError: 'An error occurred during logout',
    deleteAccountPrompt: 'Are you sure you want to delete your account? This action cannot be undone.',
    deleteAccountSuccess: 'Account deleted successfully',
    deleteAccountError: 'Failed to delete account',
    loginPrompt: 'Please log in to access settings',
    userInfoError: 'Failed to load user info',
    contactInfo: 'Contact Info',
    phoneLabel: 'Phone',
    location: 'Location: Adama, Adama Science and Technology University',
    emailLabel: 'Email',
    socials: 'Socials',
    telegram: 'Telegram',
    instagram: 'Instagram',
    aboutUs: 'About Us',
    aboutUsDescription: 'CampusBite is a student-powered food delivery service connecting dorms with fast, affordable, and homemade meals around campus.',
    sendMessage: 'Send Us a Message',
    phoneNumber: 'Phone Number',
    message: 'Message',
    enterPhoneNumber: 'Enter your phone number',
    enterMessage: 'Enter your message',
    submit: 'Send Message',
    fieldsRequired: 'Please fill in both fields',
    messageSent: 'Message Sent',
    thankYou: 'Thank you for reaching out!',
  },
  am: {
    searchPlaceholder: 'የምግብ እቃዎችን ፈልግ...',
    all: 'ሁሉም',
    breakfast: 'ቁርስ',
    lunch: 'ምሳ',
    dinner: 'እራት',
    noItems: 'ምንም የምግብ እቃዎች የሉም',
    errorLoading: 'የምግብ እቃዎችን መጫን አልተሳካም',
    viewDetails: 'ዝርዝሮችን ተመልከት',
    goodMorning: 'መልካም ቁርስ',
    goodAfternoon: 'መልካም ምሳ',
    goodEvening: 'መልካም ራት',
    discoverMeals: 'ጣፋጭ ምግቦችን ያግኙ',
    filterMenu: 'ሜኑ ለይ',
    exploreMenu: 'ሜኑ ያስሱ',
    inStock: 'በክምችት ውስጥ',
    outOfStock: 'ከክምችት ውጪ',
    showAll: 'ሁሉንም አሳይ',
    inStockOnly: 'በክምችት ውስጥ ብቻ',
    noFoodsFound: 'ምንም ምግቦች አልተገኙም። ሌላ ፍለጋ ወይም ማጣሪያ ይሞክሩ።',
    addToCart: 'ወደ ጋሪ ጨምር',
    viewCart: 'ጋሪ ተመልከት',
    noDescription: 'ምንም መግለጫ የለም',
    yourOrder: 'ትዕዛዝዎ',
    noItemsInOrder: 'በትዕዛዝዎ ውስጥ ምንም እቃዎች የሉም።',
    total: 'ጠቅላላ',
    proceedToPayment: 'ወደ ክፍያ ቀጥል',
    choosePaymentMethod: 'የክፍያ ዘዴ ይምረጡ',
    telebirr: 'ቴሌብር',
    mpesa: 'ኤም-ፔሳ',
    cancel: 'መሰረዝ',
    back: 'ተመለስ',
    telebirrPayment: 'ቴሌብር ክፍያ',
    mpesaPayment: 'ኤም-ፔሳ ክፍያ',
    amount: 'መጠን',
    enterTelebirrNumber: 'የቴሌብር ቁጥር ያስገቡ',
    enterMpesaNumber: 'የኤም-ፔሳ ቁጥር ያስገቡ',
    payNow: 'አሁን ክፈል',
    error: 'ስህተት',
    orderFailed: 'ትዕዛዝ አልተሳካም',
    pleaseTryAgain: 'እባክዎ እንደገና ይሞክሩ።',
    noItemsError: 'እባክዎ የምግብ እቃዎችን ወደ ትዕዛዝዎ ያክሉ።',
    noPhoneError: 'እባክዎ የ{method} ቁጥርዎን ያስገቡ።',
    userNotLoggedIn: 'ተጠቃሚ አልገባም',
    orderSuccess: 'ትዕዛዝ ተቀምጧል እና {amount} ብር በ{method} ተከፍሏል!',
    remove: 'አስወግድ',
    profile: 'መገለጫ',
    username: 'የተጠቃሚ ስም',
    email: 'ኢሜይል',
    preferences: 'ምርጫዎች',
    darkMode: 'ጨለማ ሁነታ',
    notifications: 'ማሳወቂያዎች',
    orderUpdates: 'የትዕዛዝ ዝማኔዎች',
    promotions: 'ማስተዋወቂያዎች',
    reminders: 'አስታዋሾች',
    language: 'ቋንቋ',
    security: 'ደህንነት',
    password: 'የይለፍ ቃል',
    account: 'መለያ',
    publicProfile: 'ይፋዊ መገለጫ',
    logout: 'ውጣ',
    deleteAccount: 'መለያ ሰርዝ',
    welcome: 'እንኳን ደህና መጡ',
    manageSettings: 'የመለያ ቅንብሮችዎን ያስተዳድሩ',
    editUsername: 'የተጠቃሚ ስም አርትዕ',
    saveUsername: 'የተጠቃሚ ስም አስቀምጥ',
    cancelEdit: 'መሰረዝ',
    enterUsername: 'አዲስ የተጠቃሚ ስም ያስገቡ',
    enterEmail: 'አዲስ ኢሜይል ያስገቡ',
    enterPassword: 'አዲስ የይለፍ ቃል ያስገቡ',
    changePassword: 'የይለፍ ቃል ቀይር',
    setLanguage: 'ቋንቋ ወደ',
    toggle: 'ቀይር',
    toggleDarkMode: 'ጨለማ ሁነታ ቀይር',
    toggleProfileVisibility: 'የመገለጫ ታይነት ቀይር',
    changeProfilePicture: 'የመገለጫ ምስል ቀይር',
    saveEmail: 'ኢሜይል አስቀምጥ',
    savePassword: 'የይለፍ ቃል አስቀምጥ',
    setUsername: 'የተጠቃሚ ስም አዘጋጅ',
    setEmail: 'ኢሜይል አዘጋጅ',
    enabled: 'እንዲሰራ ተደርጓል',
    disabled: 'ተሰናክሏል',
    public: 'ይፋዊ',
    private: 'የግል',
    confirmation: 'መረጋገጥ',
    success: 'ስኬት',
    confirm: 'አረጋግጥ',
    closeModal: 'ሞዳል ዝጋ',
    confirmDelete: 'መለያ መሰረዝ አረጋግጥ',
    cancelDelete: 'መሰረዝ መሰረዝ',
    en: 'እንግሊዝኛ',
    am: 'አማርኛ',
    usernameError: 'የተጠቃሚ ስም ቢያንስ 3 ቁምፊዎች መሆን አለበት',
    emailError: 'እባክዎ ትክክለኛ ኢሜይል አድራሻ ያስገቡ',
    passwordError: 'የይለፍ ቃል ቢያንስ 8 ቁምፊዎች መሆን አለበት',
    profilePictureSuccess: 'የመገለጫ ምስል በተሳካ ሁኔታ ተዘምኗል',
    profilePictureError: 'የመገለጫ ምስል መዘመን አልተሳካም',
    usernameSuccess: 'የተጠቃሚ ስም በተሳካ ሁኔታ ተዘምኗል',
    usernameErrorMsg: 'የተጠቃሚ ስም መዘመን አልተሳካም',
    emailSuccess: 'ኢሜይል በተሳካ ሁኔታ ተዘምኗል',
    emailErrorMsg: 'ኢሜይል መዘመን አልተሳካም',
    passwordSuccess: 'የይለፍ ቃል በተሳካ ሁኔታ ተዘምኗል',
    passwordErrorMsg: 'የይለፍ ቃል መዘመን አልተሳካም',
    languageSuccess: 'ቋንቋ ተዘጋጅቷል ወደ',
    languageError: 'ቋንቋ መዘመን አልተሳካም',
    profileVisibilitySuccess: 'መገለጫ አሁን',
    profileVisibilityError: 'የመገለጫ ታይነት መዘመን አልተሳካም',
    logoutSuccess: 'በተሳካ ሁኔታ ወጥቷል',
    logoutError: 'በማለቁ ጊዜ ስህተት ተከስቷል',
    deleteAccountPrompt: 'መለያዎን መሰረዝ እንደሚፈልጉ እርግጠኛ ኖት? ይህ ተግባር ሊቀለበስ አይችልም።',
    deleteAccountSuccess: 'መለያ በተሳካ ሁኔታ ተሰርዟል',
    deleteAccountError: 'መለያ መሰረዝ አልተሳካም',
    loginPrompt: 'ቅንብሮችን ለመድረስ እባክዎ ይግቡ',
    userInfoError: 'የተጠቃሚ መረጃ መጫን አልተሳካም',
    contactInfo: 'የእውቂያ መረጃ',
    phoneLabel: 'ስልክ',
    location: 'ቦታ: አዳማ፣ የአዳማ ሳይንስና ቴክኖሎጂ ዩኒቨርሲቲ',
    emailLabel: 'ኢሜይል',
    socials: 'ማህበራዊ ሚዲያዎች',
    telegram: 'ቴሌግራም',
    instagram: 'ኢንስታግራም',
    aboutUs: 'ስለ እኛ',
    aboutUsDescription: 'CampusBite በተማሪዎች የተቋቋመ የምግብ ዴሊቨሪ አገልግሎት ሲሆን ምግቦችን በብርሃን ፍጥነት ከካምፓስ አካባቢ ካሉ በቤት ውስጥ የተዘጋጁ ምግቦችን ዶርም ድረስ እናመጣልዎታለን',
    sendMessage: 'መልእክት ላክልን',
    phoneNumber: 'የስልክ ቁጥር',
    message: 'መልእክት',
    enterPhoneNumber: 'የስልክ ቁጥርዎን ያስገቡ',
    enterMessage: 'መልእክትዎን ያስገቡ',
    submit: 'መልእክት ላክ',
    fieldsRequired: 'እባክዎ ሁለቱንም መስኮች ይሙሉ',
    messageSent: 'መልእክት ተልኳል',
    thankYou: 'ስለደወሉልን እናመሰግናለን!',
  },
};

interface LanguageContextType {
  language: 'en' | 'am';
  setLanguage: (lang: 'en' | 'am') => Promise<void>;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => key,
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'am'>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('language');
        const { session } = await checkAndRestoreSession();
        let selectedLang: 'en' | 'am' = 'en';

        if (session) {
          const userInfo = await getUserInfo(session.userId);
          const dbLang = userInfo.language as 'en' | 'am';
          if (dbLang === 'en' || dbLang === 'am') {
            selectedLang = dbLang;
          }
        } else if (storedLang === 'en' || storedLang === 'am') {
          selectedLang = storedLang;
        }

        console.log('Loaded language:', selectedLang);
        setLanguageState(selectedLang);
        await AsyncStorage.setItem('language', selectedLang);
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState('en');
        await AsyncStorage.setItem('language', 'en');
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: 'en' | 'am') => {
    try {
      console.log('Setting language to:', lang);
      setLanguageState(lang);
      await AsyncStorage.setItem('language', lang);
      console.log('Language saved to AsyncStorage:', lang);

      const { session } = await checkAndRestoreSession();
      if (session) {
        console.log('Query before use:', Query); 
        console.log('Fetching user document for accountId:', session.userId);
        const userDocs = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal('accountId', session.userId)]
        );

        if (userDocs.documents.length === 0) {
          console.error('No user document found for accountId:', session.userId);
          throw new Error('User document not found');
        }

        const userDoc = userDocs.documents[0];
        console.log('Updating language in Appwrite for user document:', userDoc.$id);
        await databases.updateDocument(
          config.databaseId,
          config.userCollectionId,
          userDoc.$id,
          { language: lang }
        );
        console.log('Language updated in Appwrite:', lang);
      } else {
        console.log('No active session, language saved locally only');
      }
    } catch (error: any) {
      console.error('Failed to set language:', error.message);
      throw new Error(`Failed to set language: ${error.message}`);
    }
  };

  const contextValue = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translations[language][key] || key,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};