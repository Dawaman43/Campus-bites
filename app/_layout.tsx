
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext'; 
import { LanguageProvider } from '@/context/LanguageContext';
import './globals.css';
import { OrderProvider } from '@/context/OrderContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <OrderProvider>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(delivery)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(manager)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(admin)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        </OrderProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
