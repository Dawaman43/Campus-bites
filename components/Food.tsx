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
    <View className="mr-5 rounded-lg">
      <Image source={imageSource} style={styles.image} />
      <Text className="mt-4 text-base text-gray-700">{text}</Text>
      <Text className="text-xl font-bold text-gray-800">{fee} Birr</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: width*0.40,  // equivalent to w-28
    height: 100, // equivalent to h-28
    borderRadius: 8, // equivalent to rounded-lg
  },
});

export default Card;
