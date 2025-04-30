import { Text, View, Image, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
} from "@expo-google-fonts/roboto";
import * as Font from "expo-font";
import { images } from "@/constants/images";
import Card from "@/components/Food";
import BannerComponent from "@/components/Banner";
import Greeting from "@/components/Greeting";
import {
  checkAndRestoreSession,
  getUserInfo,
} from "@/lib/appwrite";
export default function Index() {

  const [username, setUsername] = useState<string | null>(null);

  
  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
  });

  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { session } = await checkAndRestoreSession();
        if (session) {
          const userInfo = await getUserInfo(session.userId);
          setUsername(userInfo.username || "Guest");
        } else {
          setUsername("Guest");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        setUsername("Guest");
      }
    };

    fetchUser();
  }, []);


  if (!fontsLoaded) {
    return null; 
  }

  return (
    <>
      <StatusBar
        hidden={false}
        translucent={false}
        backgroundColor="black"
      />
      <ScrollView
        nestedScrollEnabled={true}
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: "100%",
          paddingBottom: 10,
        }}
      >
        <View className="bg-green-600 p-10 w-full h-60 mt-0 justify-end rounded-2xl">
          <View className="flex-row items-center justify-between">
            <Image
              className="w-36 h-36"
              source={images.icon}
            />
            <View className="flex-1 ml-4">
              <Text className="text-white text-2xl font-roboto font-bold">
                Welcome, {username}!
              </Text>
              <Text className="text-red-600 text-lg font-roboto font-medium mt-2">
                Order Your Food Now
              </Text>
            </View>
          </View>
          <Greeting />
        </View>
        <BannerComponent />
        <View className="flex-1">
          <Text className="font-bold text-2xl text-black-600 my-2 font-roboto bg-green-600 p-2 rounded-lg">
            Morning Meal
          </Text>
          <View className="flex-1 flex-row flex-wrap gap-0">
            <Card
              imageSource={images.food1}
              text="ጨጨብሳ"
              fee={100}
            />
            <Card
              imageSource={images.food2}
              text="እንቁላል ፍርፍር"
              fee={80}
            />
            <Card
              imageSource={images.food3}
              text="ፍርፍር"
              fee={90}
            />
            <Card
              imageSource={images.food4}
              text="ጎመን"
              fee={70}
            />
            <Card
              imageSource={images.food10}
              text="ቲማቲም"
              fee={60}
            />
            <Card
              imageSource={images.food11}
              text="ሙሉ ፍርፍር"
              fee={140}
            />
          </View>
        </View>
        <View>
          <Text className="font-bold text-2xl text-black-600 my-2 font-roboto bg-green-600 p-2 rounded-lg">
            Afternoon Meal
          </Text>
          <View className="flex-1 flex-row flex-wrap gap-0">
            <Card
              imageSource={images.food1}
              text="ጨጨብሳ"
              fee={100}
            />
            <Card
              imageSource={images.food2}
              text="እንቁላል ፍርፍር"
              fee={80}
            />
            <Card
              imageSource={images.food3}
              text="ፍርፍር"
              fee={90}
            />
            <Card
              imageSource={images.food4}
              text="ጎመን"
              fee={60}
            />
            <Card
              imageSource={images.food5}
              text="ቀይ ስር"
              fee={60}
            />
            <Card
              imageSource={images.food6}
              text="ሥጋ"
              fee={120}
            />
            <Card
              imageSource={images.food7}
              text="በአይነት"
              fee={90}
            />
            <Card
              imageSource={images.food8}
              text="ሸክላ ጥብስ"
              fee={150}
            />
            <Card
              imageSource={images.food9}
              text="ሽሮ"
              fee={70}
            />
            <Card
              imageSource={images.food10}
              text="ቲማቲም"
              fee={60}
            />
            <Card
              imageSource={images.food11}
              text="ሙሉ ፍርፍር"
              fee={140}
            />
          </View>
        </View>
        <View>
          <Text className="font-bold text-2xl text-black-600 my-2 font-roboto bg-green-600 p-2 rounded-lg">
            Evening Meal
          </Text>
          <View className="flex-1 flex-row flex-wrap gap-0">
            <Card
              imageSource={images.food1}
              text="ጨጨብሳ"
              fee={100}
            />
            <Card
              imageSource={images.food2}
              text="እንቁላል ፍርፍር"
              fee={80}
            />
            <Card
              imageSource={images.food3}
              text="ፍርፍር"
              fee={90}
            />
            <Card
              imageSource={images.food4}
              text="ጎመን"
              fee={60}
            />
            <Card
              imageSource={images.food5}
              text="ቀይ ስር"
              fee={60}
            />
            <Card
              imageSource={images.food6}
              text="ሥጋ"
              fee={120}
            />
            <Card
              imageSource={images.food7}
              text="በአይነት"
              fee={90}
            />
            <Card
              imageSource={images.food8}
              text="ሸክላ ጥብስ"
              fee={150}
            />
            <Card
              imageSource={images.food9}
              text="ሽሮ"
              fee={70}
            />
            <Card
              imageSource={images.food10}
              text="ቲማቲም"
              fee={60}
            />
            <Card
              imageSource={images.food11}
              text="ሙሉ ፍርፍር"
              fee={140}
            />
          </View>
        </View>
      </ScrollView>
    </>
  );
}