
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Image, ImageBackground } from 'react-native';

import { useRouter } from 'expo-router';



const Signup = () => {
  const router = useRouter();


  return (
    <ImageBackground style={{ flex: 1 }}>
      <View style={{ backgroundColor: 'white', flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 5 }}>
        <Image source={require('../assets/images/icon.png')} style={{ width: 160, height: 160 }} />
        <Text style={styles.signupText}>Sign Up</Text>
        <Text style={{ marginBottom: 29, fontSize: 13 }}>please fill the form to join us</Text>

        <TextInput style={styles.textInput} placeholder='User name' placeholderTextColor="black" />
        <TextInput style={styles.textInput} placeholder='Email' placeholderTextColor="black" />
        <TextInput style={styles.textInput} placeholder='Password' placeholderTextColor="black" />
        <TextInput style={styles.textInput} placeholder='Confirm Password' placeholderTextColor="black" />

        <TouchableOpacity style={styles.signupButton}>
          <Text style={{ textAlign: 'center', color: 'white', fontFamily: 'outfit', letterSpacing: 1 }}>Create Account</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 5, marginTop: 10, width: '85%', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: 'black' }}>You already have an account?</Text>
          <Pressable onPress={() => router.push('/Login')}>
            <Text style={{ color: "#ffcc00", fontWeight: 'bold' }}>Sign in</Text>
          </Pressable>
        </View>
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
    borderColor: "#ccc",
    color: 'black',
  },
  signupButton: {
    backgroundColor: "orange",
    width: '85%',
    paddingVertical: 15,
    borderRadius: 4
  }
});
