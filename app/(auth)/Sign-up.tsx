import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { createUser } from '@/lib/appwrite';
import { Picker } from '@react-native-picker/picker';


const Signup = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);

  // State for user role selection
  const [role, setRole] = useState('student'); // Default role is 'student'

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      setModalVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setModalVisible(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass role along with other user details to the createUser function
      await createUser(email, password, username, role);
      router.replace('/(auth)/Login');
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground style={{ flex: 1 }}>
      <View style={{ backgroundColor: 'white', flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 5 }}>
        <Image source={require('../../assets/images/icon.png')} style={{ width: 160, height: 160 }} />
        <Text style={styles.signupText}>Sign Up</Text>
        <Text style={{ marginBottom: 29, fontSize: 13 }}>Please fill the form to join us</Text>

        <TextInput
          style={styles.textInput}
          placeholder="User name"
          placeholderTextColor="black"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="black"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="black"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="black"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Role Picker */}
        <View style={styles.pickerContainer}>
          <Text style={{ fontSize: 14, marginBottom: 10 }}>Select Role</Text>
          <Picker
            selectedValue={role}
            style={styles.picker}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            <Picker.Item label="Student" value="student" />
            <Picker.Item label="Hotel Manager" value="hotel_manager" />
            <Picker.Item label="Delivery" value="delivery" />
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.signupButton, isSubmitting && styles.disabledButton]}
          onPress={handleSignup}
          disabled={isSubmitting}
        >
          <Text style={{ textAlign: 'center', color: 'white', fontFamily: 'outfit', letterSpacing: 1 }}>
            Create Account
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 5, marginTop: 10, width: '85%', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: 'black' }}>You already have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/Login')}>
            <Text style={{ color: '#ffcc00', fontWeight: 'bold' }}>Sign in</Text>
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

export default Signup;

const styles = StyleSheet.create({
  signupText: {
    textAlign: 'center',
    color: 'orange',
    fontWeight: 'bold',
    fontSize: 40,
    marginBottom: 5,
    marginTop: 5,
  },
  textInput: {
    fontSize: 14,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 5,
    width: '85%',
    borderRadius: 4,
    marginBottom: 18,
    borderColor: '#ccc',
    color: 'black',
  },
  signupButton: {
    backgroundColor: 'orange',
    width: '85%',
    paddingVertical: 15,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '85%',
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 18,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 15,
    paddingHorizontal: 5,
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
  pickerContainer: {
    width: '85%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 18,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
