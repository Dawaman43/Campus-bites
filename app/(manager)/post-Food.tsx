import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useRouter } from 'expo-router';
import { foodDetails } from '@/lib/appwrite';
import { ThemeContext } from '@/context/ThemeContext';
import * as FileSystem from 'expo-file-system';

const ManagerFoodPost = () => {
  const { isDarkTheme } = useContext(ThemeContext);
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [catagory, setCatagory] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');  const [Availablity, setAvailablity] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isError, setIsError] = useState(false);

  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'];

  const validateImage = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('Validating image:', { uri, fileInfo });
      if (!fileInfo.exists) {
        throw new Error('Selected image file does not exist');
      }
      const maxSize = 5 * 1024 * 1024; 
      if (fileInfo.size > maxSize) {
        throw new Error('Image size exceeds 5MB limit');
      }
      const fileName = uri.split('/').pop() || 'unknown';
      const extension = fileName.split('.').pop()?.toLowerCase();
      console.log('Image file name:', fileName, 'Extension:', extension);
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error(`File extension not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      }
    } catch (error: any) {
      console.error('Image validation error:', error);
      throw new Error(`Image validation failed: ${error.message}`);
    }
  };

  const validateInputs = () => {
    const errors = [];
    if (!name.trim()) errors.push('Food name is required');
    if (!price.trim()) errors.push('Price is required');
    if (!description.trim()) errors.push('Description is required');
    if (!catagory) errors.push('Category is required');
    if (!imageUri) errors.push('Image is required');
    if (price.trim()) {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.push('Price must be a positive number');
      }
    }
    if (errors.length > 0) {
      setModalMessage(errors.join('\n'));
      setIsError(true);
      setModalVisible(true);
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setModalMessage('Camera roll permission is required to select images');
        setIsError(true);
        setModalVisible(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        let uri = result.assets[0].uri;
        if (!uri.startsWith('file://')) {
          uri = `file://${uri}`;
        }
        console.log('Selected image URI:', uri);
        await validateImage(uri);
        setImageUri(uri);
        setModalMessage('Image selected successfully');
        setIsError(false);
        setModalVisible(true);
      }
    } catch (e: any) {
      console.error('Image picker error:', e);
      setModalMessage(`Failed to select image: ${e.message}`);
      setIsError(true);
      setModalVisible(true);
    }
  };

  const handleFoodPost = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    setModalMessage('');

    try {
      console.log('Posting food with:', {
        foodName: name.trim(),
        foodDesc: description.trim(),
        foodPrice: parseFloat(price),
        foodCategory: catagory,
        imageURI: imageUri,
        postDate: new Date().toISOString(),
        availability: Availablity,
      });

      await validateImage(imageUri!);
      const newFood = await foodDetails({
        foodName: name.trim(),
        foodDesc: description.trim(),
        foodPrice: parseFloat(price),
        foodCategory: catagory,
        imageURI: imageUri!,
        postDate: new Date().toISOString(),
        availability: Availablity,
      });

      console.log('Food posted successfully:', {
        id: newFood.$id,
        Availablity: newFood.Availablity,
      });

      setName('');
      setPrice('');
      setDescription('');
      setCatagory('breakfast');
      setAvailablity(true);
      setImageUri(null);
      setModalMessage('Food item posted successfully!');
      setIsError(false);
      setModalVisible(true);
    } catch (error: any) {
      console.error('Posting error:', error);
      let errorMessage = error.message || 'Failed to post food item';
      if (error.message.includes('File extension not allowed')) {
        errorMessage = `Please select an image with a valid extension: ${ALLOWED_EXTENSIONS.join(', ')}`;
      } else if (error.message.includes('File upload')) {
        errorMessage = 'Failed to upload image. Please try a different image or check your connection.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Session expired. Please log in again.';
      }
      setModalMessage(errorMessage);
      setIsError(true);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const themeStyles = isDarkTheme ? darkStyles : lightStyles;

  return (
    <ScrollView contentContainerStyle={themeStyles.container}>
      <Animatable.View animation="fadeInUp" duration={1000}>
        <Text style={themeStyles.header}>Add New Food Item</Text>

        <View style={themeStyles.formGroup}>
          <Text style={themeStyles.label}>Food Name*</Text>
          <TextInput
            placeholder="e.g., Spaghetti Carbonara"
            value={name}
            onChangeText={setName}
            style={themeStyles.input}
            accessibilityLabel="Food name input"
            placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          />
        </View>

        <View style={themeStyles.formGroup}>
          <Text style={themeStyles.label}>Price (Birr)*</Text>
          <TextInput
            placeholder="e.g., 12.99"
            value={price}
            onChangeText={text => setPrice(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={themeStyles.input}
            accessibilityLabel="Price input"
            placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          />
        </View>

        <View style={themeStyles.formGroup}>
          <Text style={themeStyles.label}>Description*</Text>
          <TextInput
            placeholder="Describe the food item..."
            value={description}
            onChangeText={setDescription}
            style={[themeStyles.input, themeStyles.multilineInput]}
            multiline
            numberOfLines={3}
            accessibilityLabel="Description input"
            placeholderTextColor={isDarkTheme ? '#aaa' : '#666'}
          />
        </View>

        <View style={themeStyles.formGroup}>
          <Text style={themeStyles.label}>Meal Category*</Text>
          <View style={themeStyles.pickerContainer}>
            <Picker
              selectedValue={catagory}
              onValueChange={(itemValue) => setCatagory(itemValue)}
              style={themeStyles.picker}
              accessibilityLabel="Meal category picker"
            >
              <Picker.Item label="Breakfast" value="breakfast" />
              <Picker.Item label="Lunch" value="lunch" />
              <Picker.Item label="Dinner" value="dinner" />
            </Picker>
          </View>
        </View>

        <View style={[themeStyles.formGroup, themeStyles.switchContainer]}>
          <Text style={themeStyles.label}>Available for Sale</Text>
          <Switch
            value={Availablity}
            onValueChange={setAvailablity}
            trackColor={{ false: isDarkTheme ? '#555' : '#767577', true: '#ffa500' }}
            thumbColor={Availablity ? '#fff' : isDarkTheme ? '#ccc' : '#f4f3f4'}
            accessibilityLabel="Toggle food availability"
          />
        </View>

        <View style={themeStyles.formGroup}>
          <Text style={themeStyles.label}>Food Image*</Text>
          {imageUri ? (
            <View style={themeStyles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={themeStyles.imagePreview}
                accessibilityLabel="Selected food image"
              />
              <TouchableOpacity style={themeStyles.button} onPress={pickImage}>
                <Text style={themeStyles.buttonText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={themeStyles.button} onPress={pickImage}>
              <Text style={themeStyles.buttonText}>Select Image</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[themeStyles.submitButton, isLoading && themeStyles.disabledButton]}
          onPress={handleFoodPost}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={themeStyles.buttonText}>Post Food Item</Text>
          )}
        </TouchableOpacity>
      </Animatable.View>

      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={themeStyles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={themeStyles.modalContent}>
          <Ionicons
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={40}
            color={isError ? '#ff4444' : '#00cc00'}
          />
          <Text style={themeStyles.modalTitle}>{isError ? 'Error' : 'Success'}</Text>
          <Text style={themeStyles.modalMessage}>{modalMessage}</Text>
          <TouchableOpacity
            style={themeStyles.modalButton}
            onPress={() => {
              setModalVisible(false);
              if (!isError) {
                router.push('/(manager)/post-Food');
              }
            }}
          >
            <Text style={themeStyles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6200',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#ff6200',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#ff6200',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ff620099',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  modalButton: {
    backgroundColor: '#ff6200',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffa500',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#ffa500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#ffa500',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ffa50099',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#fff',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ccc',
  },
  modalButton: {
    backgroundColor: '#ffa500',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManagerFoodPost;