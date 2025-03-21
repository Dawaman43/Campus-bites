import { Text, View, Image, ScrollView } from "react-native";

import { StatusBar } from 'react-native';

import { useFonts, Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import * as Font from "expo-font";
import { images } from "@/constants/images";
import Card from '@/components/Food';
import BannerComponent from "@/components/Banner";
import Greeting from "@/components/Greeting";


export default function Index() {
  
  
  return (
    <>
      <StatusBar hidden={false} translucent={false} backgroundColor="black"/>
        <ScrollView nestedScrollEnabled={true} 
        className="flex-1 px-5" 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{
          minHeight: "100%", paddingBottom: 10
        }}>
          <View className="bg-primary p-10 w-100% 
          h-60 mt-0 justify-end rounded-b-2xl">
          <View className="">
            <Image className="w-36 h-36 "source={images.icon}/>
          </View>
            <View>
              <Greeting />
            </View>
            <Text className="text-red-600 font-bold font-roboto" >
              Order Your Food Now
            </Text>
          </View>
          <BannerComponent />
          <View className="flex-1">
            <Text className="font-bold text-2xl text-black-600 m-4 font-roboto">
              Morning Meal
            </Text>
            <View className="flex-1 flex-row flex-wrap gap-0">
                <Card imageSource={images.food1} text="ጨጨብሳ" fee={100}/>
                <Card imageSource={images.food2} text="እንቁላል ፍርፍር" fee={80}/>
                <Card imageSource={images.food3} text="ፍርፍር" fee={90}/>
                <Card imageSource={images.food4} text="ጎመን" fee={70}/>
                {/* <Card imageSource={images.food5} text="ቀይ ስር" fee={12}/>
                <Card imageSource={images.food6} text=" ሥጋ" fee={12}/>
                <Card imageSource={images.food7} text="በአይነት" fee={12}/>
                <Card imageSource={images.food8} text="ሸክላ ጥብስ" fee={12}/>
                <Card imageSource={images.food9} text="ሽሮ" fee={12}/> */}
                <Card imageSource={images.food10} text="ቲማቲም" fee={60}/>
                <Card imageSource={images.food11} text="ሙሉ ፍርፍር" fee={140}/>                
            </View>
          </View>
          <View>
            <Text className="font-bold text-2xl text-black-600 m-4">
              Afternoon Meal
            </Text>
            <View className="flex-1 flex-row flex-wrap gap-0">
                <Card imageSource={images.food1} text="ጨጨብሳ" fee={100}/>
                <Card imageSource={images.food2} text="እንቁላል ፍርፍር" fee={80}/>
                <Card imageSource={images.food3} text="ፍርፍር" fee={90}/>
                <Card imageSource={images.food4} text="ጎመን" fee={60}/>
                <Card imageSource={images.food5} text="ቀይ ስር" fee={60}/>
                <Card imageSource={images.food6} text=" ሥጋ" fee={120}/>
                <Card imageSource={images.food7} text="በአይነት" fee={90}/>
                <Card imageSource={images.food8} text="ሸክላ ጥብስ" fee={150}/>
                <Card imageSource={images.food9} text="ሽሮ" fee={70}/>
                <Card imageSource={images.food10} text="ቲማቲም" fee={60}/>
                <Card imageSource={images.food11} text="ሙሉ ፍርፍር" fee={140}/>
            </View>
            
          </View>
          <View>
            <Text className="font-bold text-2xl text-black-600 m-4 font-roboto">
              Evening Meal
            </Text>
            <View className="flex-1 flex-row flex-wrap gap-0">
            <Card imageSource={images.food1} text="ጨጨብሳ" fee={100}/>
                <Card imageSource={images.food2} text="እንቁላል ፍርፍር" fee={80}/>
                <Card imageSource={images.food3} text="ፍርፍር" fee={90}/>
                <Card imageSource={images.food4} text="ጎመን" fee={60}/>
                <Card imageSource={images.food5} text="ቀይ ስር" fee={60}/>
                <Card imageSource={images.food6} text=" ሥጋ" fee={120}/>
                <Card imageSource={images.food7} text="በአይነት" fee={90}/>
                <Card imageSource={images.food8} text="ሸክላ ጥብስ" fee={150}/>
                <Card imageSource={images.food9} text="ሽሮ" fee={70}/>
                <Card imageSource={images.food10} text="ቲማቲም" fee={60}/>
                <Card imageSource={images.food11} text="ሙሉ ፍርፍር" fee={140}/>
            </View>
          </View>
        </ScrollView>
    </>
    
  );
}
