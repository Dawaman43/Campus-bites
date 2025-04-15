import { ImageBackground, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { images } from '@/constants/images'
import { icons } from '@/constants/icons'

import { StatusBar } from 'react-native';

<StatusBar hidden={false} />


const TabIcon = ({ focused, icon, title }: any) => {
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
    }
    return(
        <View className="justify-center items-center
        mt-4 rounded-full">
            <Image source={icon} tintColor="#A8B5DB"
            className="size-6" />
        </View>
    )
}

const _Layout = () => {
  return (
    <Tabs 
        screenOptions={{
            tabBarShowLabel: false,
            tabBarItemStyle: {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
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