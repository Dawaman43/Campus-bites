import React from 'react';
import { View, Text, Image, ImageSourcePropType, StyleSheet,Dimensions } from 'react-native';

interface CardProps {
  imageSource: ImageSourcePropType;
  text: string;
  fee: number;
}
const {width} = Dimensions.get('window')
const Card: React.FC<CardProps> = ({ imageSource, text, fee }) => {
  return (
      <View className="mr-3 rounded-xl mb-4 bg-[#2c2c2e] p-3 shadow-lg shadow-black/40">
          <Image source={imageSource} style={styles.image} />
          <Text className="mt-2 text-white font-semibold">{text}</Text>
          <Text className="text-yellow-400 font-bold">{fee} Birr</Text>
      </View>

  );
};

const styles = StyleSheet.create({
  image: {
    width: 80,  // equivalent to w-28
    height: 80, // equivalent to h-28
    borderRadius: 8, // equivalent to rounded-lg
  },
});

export default Card;
