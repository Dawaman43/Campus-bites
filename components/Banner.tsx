import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Image, View, StyleSheet } from 'react-native';
import { images } from '../constants/images';

const BannerComponent = () => {
  const imageList = [
    images.food1,
    images.food2,
    images.food3,
    images.food4,
    images.food5,
    images.food6,
    images.food7,
    images.food8,
    images.food9,
    images.food10,
    images.food11,
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: currentIndex, animated: true });
    }
  }, [currentIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        horizontal
        data={imageList}
        renderItem={({ item }) => (
          <Image source={item} style={styles.image} />
        )}
        keyExtractor={(item, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        getItemLayout={(data, index) => ({
          length: 320, // Image width (300) + margin (20)
          offset: 320 * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 500);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginTop: 20,
  },
  flatList: {
    height: 220,
    borderRadius: 15,
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 15,
    marginRight: 20, // Space between images
  },
});

export default BannerComponent;
