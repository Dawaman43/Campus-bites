import React, { useState } from "react";
import { TextInput, TouchableOpacity, Linking, Alert, ScrollView } from "react-native";
import { View, Text } from "react-native";
const Icon = require('react-native-vector-icons/FontAwesome5').default;
import { useFonts, Roboto_400Regular, Roboto_500Medium } from "@expo-google-fonts/roboto";
import { images } from "@/constants/images";

export default function ContactTab() {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = () => {
        if (!phone || !message) {
            Alert.alert("Please fill in both fields");
            return;
        }

        Alert.alert("Message Sent", "Thank you for reaching out!");
        setPhone("");
        setMessage("");
    };

    return (
        <ScrollView>
            <View className="flex-1 bg-gray-100 p-4">
            {/* Contact Info */}
            <Text className="text-2xl font-bold text-gray-800 mb-4">Contact Info</Text>

            <View className="mb-4 bg-green-600 rounded-xl p-4 shadow">
                <Text className="text-xl font-bold text-white mb-3 bg-green-500 p-2 rounded-xl">
                    <Icon name="phone" size={20} color="#000" /> Phone: <Text className="text-black bg-" onPress={() => Linking.openURL('tel:+251912345678')}>+251 912 345 678</Text>
                </Text>
                <Text className="text-xl font-bold text-white mb-3 bg-green-500 p-2 rounded-xl">
                    <Icon name="map-marker-alt" size={20} color="#000" /> <Text className="text-black">Location: Adama, Adama Science and Technology University</Text>
                </Text>
                <Text className="text-xl font-bold text-white mb-3 bg-green-500 p-2 rounded-xl">
                    <Icon name="envelope" size={20} color="#000"/> Email: <Text className="text-black" onPress={() => 
                            Linking.openURL('mailto:CampusBite@gmail.com')}>CampusBite@gmail.com</Text>
                </Text>
                <Text className="text-2xl font-bold text-white mb-3 bg-green-500 p-2 rounded-xl text-center">
                    Socials
                </Text>
                <View className="flex-row justify-between p-2 rounded-xl">
                    <TouchableOpacity onPress={() => Linking.openURL('https://tiktok.com/campusbite')} className="flex-row items-center bg-green-500 p-2 rounded-xl">
                        <Icon name="tiktok" size={20} color="#000" />
                        <Text className="text-black ml-2">Tiktok</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => Linking.openURL('https://t.me/campusbite')} className="flex-row items-center bg-green-500 p-2 rounded-xl">
                        <Icon name="telegram" size={20} color="#000" />
                        <Text className="text-black ml-2">Telegram</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com/campusbite')} className="flex-row items-center bg-green-500 p-2 rounded-xl">
                        <Icon name="instagram" size={20} color="#000" />
                        <Text className="text-black ml-2">Instagram</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* About Us */}
            <View className="mb-4 bg-white rounded-xl p-4 shadow">
                <Text className="text-2xl font-bold text-white mb-3 bg-green-500 p-2 rounded-xl text-center">About Us</Text>
                <Text className="text-base text-gray-600 mb-3 font-semibold p-2 rounded-xl">
                    CampusBite is a student-powered food delivery service connecting dorms with fast, affordable, and homemade meals around campus.
                </Text>
                <Text className="text-lg text-gray-600 mb-3 p-2 rounded-xl">
                    CampusBite is a platform designed to connect students with local businesses, providing a unique opportunity for students to discover and enjoy the best food and services in their area.
                    Our mission is to enhance the student experience by offering a convenient and efficient way to access local resources, while also supporting local businesses in their growth and success.  
                </Text>
                <Text className="text-lg text-gray-600 mb-3 p-2 rounded-xl">
                    We are committed to providing a user-friendly platform that allows students to easily find and connect with local businesses, while also offering businesses the tools they need to reach and engage with their target audience.
                    Whether you're a student looking for a great meal or a local business looking to connect with students, CampusBite is here to help.
                </Text>
            </View>

            {/* Contact Form */}
            <View className="bg-white rounded-xl p-4 mb-40">
                <Text className="text-2xl font-bold mb-4 text-gray-800">Send Us a Message</Text>
                <Text className="text-lg mb-1 text-gray-700">Phone Number</Text>
                <TextInput
                    className="bg-white rounded-xl p-3 mb-3 shadow"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />

                <Text className="text-lg mb-1 text-gray-700">Message</Text>
                <TextInput
                    className="bg-white rounded-xl p-3 mb-4 shadow"
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Enter your message"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    className="bg-green-600 p-4 rounded-xl items-center"
                    onPress={handleSubmit}
                >
                    <Text className="text-white text-lg font-semibold ">Send Message</Text>
                </TouchableOpacity>
            </View>
        </View>
        </ScrollView>
        
    );
}
