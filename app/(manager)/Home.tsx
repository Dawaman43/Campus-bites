import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentSession, getUserInfo } from '@/lib/appwrite';
import * as Animatable from 'react-native-animatable';

const Home = () => {
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const session = await getCurrentSession();
        if (!session) {
          setError('No active session found. Please log in.');
          setModalVisible(true);
          setIsLoading(false);
          return;
        }

        const userData = await getUserInfo(session.userId);
        setUserInfo(userData);
      } catch (err: any) {
        console.error('Error fetching user info:', err);
        setError(err.message || 'Failed to load user information');
        setModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#ff6200" />
        ) : userInfo ? (
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            style={styles.card}
          >
            <View style={styles.header}>
              <Ionicons name="person-circle" size={50} color="#ff6200" />
              <Text style={styles.welcomeText}>
                Welcome, {userInfo.username}!
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color="#666" />
                <Text style={styles.infoText}>{userInfo.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="briefcase" size={20} color="#666" />
                <Text style={styles.infoText}>Role: {userInfo.role}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(manager)/orders')}
            >
              <Text style={styles.buttonText}>View Orders</Text>
            </TouchableOpacity>
          </Animatable.View>
        ) : (
          <Text style={styles.errorText}>No user data available</Text>
        )}

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
              onPress={() => {
                setModalVisible(false);
                if (error.includes('No active session')) {
                  router.push('/(auth)/Login');
                }
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6200',
    marginLeft: 10,
    flex: 1,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#ff6200',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
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
    backgroundColor: '#ff6200',
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

export default Home;