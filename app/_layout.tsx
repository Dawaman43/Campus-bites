import { Stack } from "expo-router";
import './globals.css'

export default function RootLayout() {
  return (
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
  );
}
