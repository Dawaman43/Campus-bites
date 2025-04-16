import { ImageBackground, StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import { StatusBar } from 'react-native';

const TabIcon = ({ focused, icon, title }: any) => {
  if (focused) {
    return (
      <ImageBackground
        source={images.highlight}
        style={{
          flexDirection: 'row',
          width: '100%',
          flex: 1,
          minWidth: 112,
          minHeight: 64,
          marginTop: 16,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 50,
          overflow: 'hidden',
        }}
      >
        <Image source={icon} style={{ width: 20, height: 20, tintColor: '#151312' }} />
        <Text style={{ color: '#151312', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>{title}</Text>
      </ImageBackground>
    );
  }

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 16, borderRadius: 50 }}>
      <Image source={icon} style={{ width: 24, height: 24, tintColor: '#A8B5DB' }} />
    </View>
  );
};

const _Layout = () => {
  return (
    <>
      <StatusBar hidden={false} />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarItemStyle: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarStyle: {
            backgroundColor: '#f1faee',
            borderRadius: 50,
            marginHorizontal: 20,
            marginBottom: 20,
            height: 52,
            position: 'absolute',
            overflow: 'hidden',
            borderWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
          title: 'Home',
          headerShown: false,
           tabBarIcon: ({ focused }) => (
           <TabIcon focused={focused} icon={icons.homeAgreement} title="Home" />
              ),
         }}
       />

        <Tabs.Screen
          name="neworder"
          options={{
            title: 'New Order',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.plus} title="New Order" />
            ),
          }}
        />
        <Tabs.Screen
          name="contact"
          options={{
            title: 'Contact',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.contact} title="Contact" />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default _Layout;
