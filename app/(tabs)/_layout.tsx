import { ImageBackground, StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { images } from '@/constants/images';
import { icons } from '@/constants/icons';
import { StatusBar } from 'react-native';

const TabIcon = ({ focused, icon, title }: any) => {
<<<<<<< HEAD
    if (focused) {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: '#16A34A', // or use an image background only on native
                    borderRadius: 25,
                    minWidth: 112,
                    height: 52,
                }}
            >
                <Image
                    source={icon}
                    style={{ width: 20, height: 20, tintColor: '#151312' }}
                    resizeMode="contain"
                />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>{title}</Text>
            </View>
        );
=======
    if(focused){
        return(
            <ImageBackground 
                                source={images.highlight2}
                                className="flex flex-row w-full flex-1 
                                min-w-[112px] min-h-16 mt-4 justify-center 
                                items-center rounded-full overflow-hidden"
                            >
                                <Image source={icon} tintColor="#151312" className="size-5" />
                                <Text className="text-white text-base font-semibold ml-2">{title}</Text>
                            </ImageBackground>
        )
>>>>>>> 05e2958743f50eabaac63d88228f1b73631f0916
    }

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Image
                source={icon}
                style={{ width: 24, height: 24, tintColor: '#A8B5DB' }}
                resizeMode="contain"
            />
        </View>
    );
};


const _Layout = () => {
  return (
    <Tabs
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: {
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 4,
                paddingHorizontal: 8,
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

            }
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

      <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon={icons.settings} title="Settings" />
            ),
          }}
        />
      </Tabs>
    
  );
};

export default _Layout;
