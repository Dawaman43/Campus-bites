import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import * as Animatable from 'react-native-animatable';

const App = () => {
  return (
    <SafeAreaView className="h-full bg-gradient-to-b from-indigo-900 to-purple-800">
      <StatusBar backgroundColor="#161622" style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Animatable.Image
            animation="zoomIn"
            duration={1200}
            source={require('../assets/images/icon.png')}
            className="w-40 h-40 mb-8"
            resizeMode="contain"
          />

          <Animatable.View animation="fadeInUp" duration={1000} delay={200}>
            <Text style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 'bold',
              textAlign: 'center',
              textShadowColor: 'orange',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            }}>
              Welcome to <Text style={{ color: 'orange' }}>Campus Bites</Text>
            </Text>

            <Text className="text-lg text-orange-300 text-center mb-10">
              Enjoy delicious meals delivered right to your dorm!
            </Text>
          </Animatable.View>

         
          <Animatable.View animation="fadeInUp" duration={1000} delay={400} className="w-full">
            <TouchableOpacity
              className="flex-row items-center bg-white rounded-full py-4 px-6 mb-4 shadow-lg shadow-black/30"
              activeOpacity={0.7}
            >
              <Image
                source={require('../assets/icons/google.png')}
                className="w-6 h-6 mr-3"
                resizeMode="contain"
              />
              <Text className="text-lg font-semibold text-gray-800 flex-1 text-center">
                Login with Google
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Email Login Button */}
          <Animatable.View animation="fadeInUp" duration={1000} delay={600} className="w-full">
            <TouchableOpacity
              className="bg-orange-500 rounded-full py-4 px-6 shadow-lg shadow-black/30"
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/Sign-in')}
            >
              <Text className="text-lg font-semibold text-white text-center">
                Login with Email
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          {/* Sign Up Prompt */}
          <Animatable.View animation="fadeIn" duration={1000} delay={800} className="mt-8">
            <Text className="text-gray-300">
              Don't have an account?{' '}
              <Text
                className="text-orange-400 font-semibold"
                onPress={() => router.push('/(auth)/Sign-in')}
              >
                Sign Up
              </Text>
            </Text>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;