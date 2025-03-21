import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

const Greeting = () => {
  const greetingMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <View>
      <Text className="text-white font-bold text-4xl"> 
        {greetingMessage}!
      </Text> 
    </View>
  );
};

export default Greeting;
