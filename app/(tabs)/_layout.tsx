import { ImageBackground, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from '@/constants/images'
import { icons } from '@/constants/icons'

import { StatusBar } from 'react-native';

<StatusBar hidden={false} />


const TabIcon = ({ focused, icon, title }: any) => {
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
            name="index"
            options={{
                title: 'Home',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon 
                        focused={focused}
                        icon={icons.homeAgreement}
                        title="Home"
                    />
                )
            }}
        />
        <Tabs.Screen 
            name="neworder"
            options={{
                title: 'New Order',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon 
                        focused={focused}
                        icon={icons.plus}
                        title="New Order"
                    />
                )
            }}    
        />
        <Tabs.Screen 
            name="contact"
            options={{
                title: 'Contact',
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                    <TabIcon 
                        focused={focused}
                        icon={icons.contact}
                        title="Contact"
                    />
                )
            }}    
        />

    </Tabs>
  )
}

export default _Layout

const styles = StyleSheet.create({})