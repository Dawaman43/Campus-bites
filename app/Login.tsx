import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

const Login = () => {
  const router = useRouter();

  const handleLogin = () => {
   
    router.push('/(tabs)/home');


  };

  return (
    <ImageBackground
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
        />

        <Text style={styles.signupText}>Login Page</Text>
        <Text style={styles.subtitle}>
          Enter your credentials to access your account
        </Text>

        <TextInput
          style={styles.textInput}
          placeholder="User name"
          placeholderTextColor="black"
        />
        <TextInput
          style={styles.textInput}
          placeholder="Password"
          placeholderTextColor="black"
          secureTextEntry
        />

        <TouchableOpacity style={styles.signupButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default Login;

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
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
