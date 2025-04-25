import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Login, getCurrentSession, Logout } from '@/lib/appwrite';
import { getUserRole } from '@/lib/appwrite';

const SignUp = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session) {
        console.log('Active session found on Login mount, logging out');
        await Logout();
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    console.log('handleLogin called with:', { email, password: password ? '****' : 'MISSING' });

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password fields');
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await Login(email.trim(), password.trim());
      console.log('Login successful, checking role');

      
      const session = await getCurrentSession();
      if (session) {
        const role = await getUserRole(session.userId);

       
        if (role === 'hotel_manager') {
          router.replace('/(manager)/Home'); 
        } else if (role === 'delivery') {
          router.replace('/(delivery)/home'); 
        } else {
          router.replace('/(tabs)/home'); 
        }
      }
    } catch (error: any) {
      console.error('Login error in handleLogin:', error);
      setError(error.message || 'An error occurred during login');
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground style={{ flex: 1 }} resizeMode="cover">
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/icon.png')}
          style={styles.logo}
        />

        <Text style={styles.signupText}>Login</Text>
        <Text style={styles.subtitle}>
          Enter your credentials to access your account
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="black"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            console.log('Email input changed:', text);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="black"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              console.log('Password input changed:', text ? '****' : 'EMPTY');
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.signupButton, isSubmitting && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 5, marginTop: 10, width: '85%', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: 'black' }}>Don't have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/Sign-up')}>
            <Text style={{ color: "#ffcc00", fontWeight: 'bold' }}>Sign up</Text>
          </Pressable>
        </View>

        <Modal
          isVisible={isModalVisible}
          onBackdropPress={() => setModalVisible(false)}
          style={styles.modal}
          animationIn="slideInUp"
          animationOut="slideOutDown"
        >
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={40} color="#ff4444" />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 10,
  },
  signupText: {
    textAlign: 'center',
    color: 'orange',
    fontWeight: 'bold',
    fontSize: 40,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 30,
    color: '#555',
    textAlign: 'center',
  },
  textInput: {
    fontSize: 14,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 6,
    marginBottom: 18,
    borderColor: '#ccc',
    color: 'black',
  },
  signupButton: {
    backgroundColor: 'orange',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ffa50099',
    opacity: 0.6,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 18,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: 'black',
  },
  eyeIcon: {
    padding: 10,
  },
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalButton: {
    backgroundColor: 'orange',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
