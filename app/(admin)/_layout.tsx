import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const DeliveryLayout = () => {
  return (
    <>
        <Stack>
            <Stack.Screen 
                name='Home'
                options={{
                    headerShown : false
                }}
            />
            <Stack.Screen 
                name='orders'
                options={{
                    headerShown : false
                }} 
            />
            <Stack.Screen 
                name='settings'
                options={{
                    headerShown : false
                }}
            />
        </Stack>
    </>
  )
}

export default DeliveryLayout
