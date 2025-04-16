import React, { useState } from "react";
import { TextInput, TouchableOpacity, Linking, Alert, ScrollView } from "react-native";
import { View, Text } from "react-native";

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
                <Text className="text-xl font-bold text-white mb-1">
                    📱 Phone: <Text className="text-blue-600" onPress={() => Linking.openURL('tel:+251912345678')}>+251 912 345 678</Text>
                </Text>
                <Text className="text-xl font-bold text-white mb-1">
                    📍 Location: Adama, Adama Science and Technology University
                </Text>
                <Text className="text-xl font-bold text-white mb-1">
                    📧 Email: <Text className="text-blue-600" onPress={() => Linking.openURL('mailto:CampusBite@gmail.com')}>CampusBite@gmail.com</Text>
                </Text>
                <Text className="text-xl font-bold text-white mb-1">
                    📲 Socials:
                </Text>
                <View className="ml-4">

                    <Text className="text-blue-600" onPress={() => Linking.openURL('https://t.me/campusbite')}>Telegram</Text>
                    <Text className="text-blue-600" onPress={() => Linking.openURL('https://instagram.com/campusbite')}>Instagram</Text>
                </View>
            </View>

            {/* About Us */}
            <Text className="text-lg font-semibold text-gray-800 mb-2">About Us</Text>
            <Text className="text-base text-gray-600 mb-4 font-semibold">
                CampusBite is a student-powered food delivery service connecting dorms with fast, affordable, and homemade meals around campus.
            </Text>

            {/* Contact Form */}
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
                className="bg-green-600 p-4 rounded-xl items-center  mb-20"
                onPress={handleSubmit}
            >
                <Text className="text-white text-lg font-semibold">Send Message</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
        
    );
}
