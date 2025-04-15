import React, { useState } from "react";
import { FlatList, TextInput, Text, TouchableOpacity, View } from "react-native";
import { Check } from "lucide-react-native"; // Ensure the package is properly installed
import type { ListRenderItem } from 'react-native';
import Card from "@/components/Food";
import {images} from "@/constants/images";

type FoodItem = {
    id: number;
    name: string;
    fee: number;
};

const foodItems: FoodItem[] = [
    { id: 1, name: 'ጨጨብሳ', fee: 100 },
    { id: 2, name: 'እንቁላል ፍርፍር', fee: 80 },
    { id: 3, name: 'ፍርፍር', fee: 90 },
    { id: 4, name: 'ጎመን', fee: 60 },
    { id: 5, name: 'ቀይ ስር', fee: 60 },
    { id: 6, name: 'ሥጋ', fee: 120 },
    { id: 7, name: 'በአይነት', fee: 90 },
    { id: 8, name: 'ሸክላ ጥብስ', fee: 150 },
    { id: 9, name: 'ሽሮ', fee: 70 },
    { id: 10, name: 'ቲማቲም', fee: 60 },
    { id: 11, name: 'ሙሉ ፍርፍር', fee: 110 },
];



export default function OrderTab() {
    const [selectedFood, setSelectedFood] = useState<number[]>([]);
    const [dormBlock, setDormBlock] = useState("");
    const [roomNumber, setRoomNumber] = useState("");

    const toggleFood = (id: number) => {
        setSelectedFood((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const handleOrder = () => {
        if (!dormBlock || !roomNumber || selectedFood.length === 0) {
            alert("Please complete all fields and select at least one item.");
            return;
        }
        alert(`Order placed!\nDorm: ${dormBlock}, Room: ${roomNumber}`);
    };

    const renderFoodItem: ListRenderItem<FoodItem> = ({ item }) => {
        const isSelected = selectedFood.includes(item.id);

        return (
            <TouchableOpacity
                className="flex-row items-center justify-between p-4 mb-2 bg-white rounded-xl shadow"
                onPress={() => toggleFood(item.id)}
            >
                <Text className="text-lg text-gray-800">{item.name}</Text>
                {isSelected && <Check size={20} color="green" />}
            </TouchableOpacity>
        );
    };

    const totalFee = selectedFood.reduce((sum, id) => {
        const food = foodItems.find((item) => item.id === id);
        return sum + (food?.fee || 0);
    }, 0);

    const unselectAll = () => {
        setSelectedFood([]);
    };



    return (
        <View className="flex-1 bg-gray-100 p-4">
            <Text className="text-2xl font-bold mb-4 text-gray-800">Select Food</Text>
            <FlatList
                data={foodItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderFoodItem}
                className="mb-4"
            />
            {selectedFood.length > 0 && (
                <Text className="text-sm text-gray-500 mb-2">
                    {selectedFood.map(id => foodItems.find(f => f.id === id)?.name).join(", ")}
                </Text>
            )}

            <View className="flex-row justify-between items-center mb-2 ">
                <TouchableOpacity onPress={unselectAll}>
                    <Text className="text-white text-base bg-red-600 w-fit rounded-xl p-4">Unselect All</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                    Estimated Total: {totalFee} ብር
                </Text>
            </View>




            <Text className="text-lg mb-1 text-gray-700">Dorm Block</Text>
            <TextInput
                className="bg-white rounded-xl p-3 mb-3 shadow"
                value={dormBlock}
                onChangeText={setDormBlock}
                placeholder="Enter dorm block"
            />

            <Text className="text-lg mb-1 text-gray-700">Room Number</Text>
            <TextInput
                className="bg-white rounded-xl p-3 mb-4 shadow"
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="Enter room number"
                keyboardType="numeric"
            />

            <TouchableOpacity
                className="bg-green-600 p-4 rounded-xl items-center mb-20"
                onPress={handleOrder}
            >
                <Text className="text-white text-lg font-semibold">Place Order</Text>
            </TouchableOpacity>
        </View>
    );
}
