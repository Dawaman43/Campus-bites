import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {
  Client,
  Account,
  ID,
  Models,
  Avatars,
  Databases,
  Query,
  Storage,
  Permission,
  Role,
} from 'react-native-appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  platform: 'com.campus.bites',
  projectId: '680a8d8e0014d2032491',
  databaseId: '680a8fc000090daecdee',
  userCollectionId: '680a8fed000663815bf7',
  storageId: '6814a6ce00114e8d01cb',
  foodCollectionId: '680f91ce002dd3078d6e',
  restaurantCollectionId: '680fa097001ea20faf55',
  orderCollectionId: '6812463a0019be665e64',
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export interface FoodDocument extends Models.Document {
  name: string;
  description: string;
  price: number;
  catagory: string;
  image_url: string;
  Availablity: boolean;
  rating: number;
  Restaurant_id: string | null;
  users: string[];
  postDate: string;
}

export interface Order {
  $id: string;
  users: string;
  restaurant: string[];
  restaurantId: string;
  foodDetails: string[];
  total: number;
  paymentMethod: 'telebirr' | 'mpesa';
  phone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const saveSessionId = async (sessionId: string) => {
  console.log('Saving session ID:', sessionId);
  await AsyncStorage.setItem('sessionId', sessionId);
};

const loadSessionId = async (): Promise<string | null> => {
  const sessionId = await AsyncStorage.getItem('sessionId');
  console.log('Loaded session ID:', sessionId);
  return sessionId;
};

const clearSessionId = async () => {
  console.log('Clearing session ID');
  await AsyncStorage.removeItem('sessionId');
};

const validateAppwriteId = (id: string | null | undefined, context: string): string => {
  if (!id) throw new Error(`Invalid ${context}: ID is empty or undefined`);
  if (id.length > 36) throw new Error(`Invalid ${context}: ID exceeds 36 characters: ${id}`);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) {
    throw new Error(`Invalid ${context}: ID contains invalid characters: ${id}`);
  }
  return id;
};

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif'];

export const uploadFile = async (uri: string): Promise<Models.File> => {
  if (!uri || !uri.startsWith('file://')) {
    throw new Error(`Invalid file URI: ${uri}`);
  }

  try {
    console.log('Starting file upload for URI:', uri);
    const fileInfo = await FileSystem.getInfoAsync(uri);
    console.log('File info:', fileInfo);
    if (!fileInfo.exists) throw new Error(`File does not exist at URI: ${uri}`);

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileInfo.size > maxSize) {
      throw new Error('File size exceeds 5MB limit');
    }

    let fileName = uri.split('/').pop() || `file-${ID.unique()}`;
    let extension = fileName.split('.').pop()?.toLowerCase();
    console.log('Original file name:', fileName, 'Extension:', extension);

    // Handle missing or invalid extension
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      console.warn(`Invalid or missing extension: ${extension}. Defaulting to .jpg`);
      fileName = fileName.split('.')[0] + '.jpg';
      extension = 'jpg';
    }

    console.log('Final file name:', fileName, 'Final extension:', extension);

    const mimeType = getMimeType(fileName);
    console.log('MIME type:', mimeType);

    const formData = new FormData();
    formData.append('fileId', ID.unique());
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as any);

    const session = await account.getSession('current').catch(() => null);
    if (!session) {
      throw new Error('No active session. Please login to upload files.');
    }

    console.log('Uploading to Appwrite storage...');
    const response = await fetch(
      `${config.endpoint}/storage/buckets/${config.storageId}/files`,
      {
        method: 'POST',
        headers: {
          'X-Appwrite-Project': config.projectId,
          'X-Appwrite-Session': session.$id,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Upload response error:', errorData);
      throw new Error(`File upload failed: ${errorData.message || response.statusText}`);
    }

    const fileDoc: Models.File = await response.json();
    console.log('File uploaded successfully:', fileDoc.$id);
    return fileDoc;
  } catch (error: any) {
    console.error('File upload error:', error.message, error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      console.warn(`Unknown extension: ${extension}. Defaulting to image/jpeg`);
      return 'image/jpeg';
  }
};

export const createUser = async (
  email: string,
  password: string,
  username: string,
  role: string
): Promise<Models.Document> => {
  if (!email || !password || !username || !role) {
    throw new Error('All fields are required');
  }

  console.log('Creating user:', { email, username, role });
  const newAccount = await account.create(ID.unique(), email, password, username);
  const avatarUrl = avatars.getInitials(username).href;

  const userDoc = await databases.createDocument(
    config.databaseId,
    config.userCollectionId,
    ID.unique(),
    {
      accountId: newAccount.$id,
      email,
      username,
      avatar: avatarUrl,
      role,
    }
  );

  if (role === 'hotel_manager') {
    await account.createEmailPasswordSession(email, password);
    await createRestaurant(userDoc.$id, `${username}'s Restaurant`);
  }

  return userDoc;
};

export const Login = async (
  email: string,
  password: string,
  retries = 3,
  retryDelay = 1000
): Promise<Models.Session> => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  console.log('Attempting login for:', email);
  const existingId = await loadSessionId();
  if (existingId) {
    try {
      const session = await account.getSession(existingId);
      const me = await account.get();
      if (session && me.email === email) {
        return session;
      } else {
        await account.deleteSession(existingId);
        await clearSessionId();
      }
    } catch {
      await clearSessionId();
    }
  }

  for (let i = 1; i <= retries; i++) {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      await saveSessionId(session.$id);
      console.log('Login successful, session ID:', session.$id);
      return session;
    } catch (err: any) {
      console.error('Login attempt failed:', err.message);
      if (err.message.includes('Rate limit') && i < retries) {
        await delay(retryDelay * i);
      } else if (err.message.includes('session is active')) {
        const current = await account.getSession('current').catch(() => null);
        const me = await account.get().catch(() => null);
        if (current && me?.email === email) {
          await saveSessionId(current.$id);
          return current;
        }
        await account.deleteSession('current').catch(() => null);
        await clearSessionId();
      } else {
        throw err;
      }
    }
  }

  throw new Error('Rate limit exceeded');
};

export const Logout = async () => {
  console.log('Logging out');
  await account.deleteSession('current');
  await clearSessionId();
};

export const getCurrentSession = async (): Promise<Models.Session | null> => {
  const id = await loadSessionId();
  if (!id) {
    console.log('No session ID found in AsyncStorage');
    return null;
  }
  try {
    const session = await account.getSession(id);
    console.log('Current session retrieved:', session.$id);
    return session;
  } catch (error: any) {
    console.error('Failed to retrieve session:', error.message);
    await clearSessionId();
    return null;
  }
};

export const checkAndRestoreSession = async (): Promise<{ session: Models.Session | null }> => {
  try {
    console.log('Checking and restoring session');
    const session = await getCurrentSession();
    if (session) {
      await account.get();
      return { session };
    }
    const currentSession = await account.getSession('current').catch(() => null);
    if (currentSession) {
      await saveSessionId(currentSession.$id);
      return { session: currentSession };
    }
    return { session: null };
  } catch (error: any) {
    console.error('Session restoration failed:', error.message);
    await clearSessionId();
    return { session: null };
  }
};

export const ensureActiveSession = async () => {
  try {
    console.log('Ensuring active session');
    return await account.getSession('current');
  } catch (e) {
    console.log('No current session, checking storage');
    const sessionId = await loadSessionId();
    if (sessionId) {
      try {
        const session = await account.getSession(sessionId);
        await saveSessionId(session.$id);
        return session;
      } catch (e) {
        console.log('Stored session invalid');
        await clearSessionId();
      }
    }
    throw new Error('Please login to continue');
  }
};

export const refreshSession = async () => {
  try {
    console.log('Refreshing session');
    await account.deleteSession('current');
    const sessionId = await loadSessionId();
    if (sessionId) {
      await account.deleteSession(sessionId);
    }
    await clearSessionId();
    return true;
  } catch (e) {
    console.error('Failed to refresh session:', e);
    return false;
  }
};

export const getUserRole = async (userId: string): Promise<string> => {
  if (!userId) throw new Error('User ID is required');
  console.log('Fetching user role for:', userId);
  const res = await databases.listDocuments(
    config.databaseId,
    config.userCollectionId,
    [Query.equal('accountId', userId)]
  );
  if (!res.documents.length) throw new Error('User not found');
  return res.documents[0].role;
};

export const getUserInfo = async (userId: string): Promise<Models.Document> => {
  if (!userId) throw new Error('User ID is required');
  console.log('Fetching user info for:', userId);
  const res = await databases.listDocuments(
    config.databaseId,
    config.userCollectionId,
    [Query.equal('accountId', userId)]
  );
  if (!res.documents.length) throw new Error('User not found');
  validateAppwriteId(res.documents[0].$id, 'user document ID');
  return res.documents[0];
};

export async function foodDetails({
  foodName,
  foodDesc,
  foodPrice,
  foodCategory,
  imageURI,
  postDate,
  availability,
}: {
  foodName: string;
  foodDesc: string;
  foodPrice: number;
  foodCategory: string;
  imageURI: string;
  postDate?: string;
  availability?: boolean;
}): Promise<Models.Document> {
  const missingFields = [];
  if (!foodName?.trim()) missingFields.push('foodName');
  if (!foodDesc?.trim()) missingFields.push('foodDesc');
  if (!foodPrice || isNaN(foodPrice)) missingFields.push('foodPrice');
  if (!foodCategory?.trim()) missingFields.push('foodCategory');
  if (!imageURI?.startsWith('file://')) missingFields.push('imageURI');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  try {
    console.log('Starting foodDetails with:', { foodName, foodPrice, foodCategory, imageURI });
    const session = await ensureActiveSession();
    if (!session?.userId) throw new Error('Authentication required');

    console.log('Uploading file...');
    const fileDoc = await uploadFile(imageURI);
    console.log('File uploaded, file ID:', fileDoc.$id);
    const imageUrl = `${config.endpoint}/storage/buckets/${config.storageId}/files/${fileDoc.$id}/view?project=${config.projectId}`;

    const userDocs = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', session.userId)]
    );
    if (userDocs.documents.length === 0) throw new Error('User profile not found');
    const userDoc = userDocs.documents[0];

    let restaurant;
    try {
      restaurant = await getRestaurantByManager(session.userId);
    } catch (e) {
      console.log('Creating new restaurant for manager');
      restaurant = await createRestaurant(userDoc.$id, `${userDoc.username}'s Restaurant`);
    }

    validateAppwriteId(restaurant.$id, 'restaurant ID');
    validateAppwriteId(userDoc.$id, 'user document ID');

    const documentData = {
      name: foodName.trim(),
      description: foodDesc.trim(),
      price: Number(foodPrice),
      catagory: foodCategory.trim(),
      image_url: imageUrl,
      postDate: postDate || new Date().toISOString(),
      Availablity: availability !== false,
      rating: 0,
      Restaurant_id: restaurant.$id,
      users: [userDoc.$id],
    };

    const permissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(session.userId)),
      Permission.delete(Role.user(session.userId)),
    ];

    console.log('Creating food document with:', documentData);

    return await databases.createDocument(
      config.databaseId,
      config.foodCollectionId,
      ID.unique(),
      documentData,
      permissions
    );
  } catch (error: any) {
    console.error('Food creation error:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Food creation failed: ${error.message}`);
  }
}

export const createRestaurant = async (
  userDocId: string,
  restaurantName: string
): Promise<Models.Document> => {
  console.log('Creating restaurant:', { userDocId, restaurantName });
  validateAppwriteId(userDocId, 'user document ID for restaurant');
  return await databases.createDocument(
    config.databaseId,
    config.restaurantCollectionId,
    ID.unique(),
    {
      users: [userDocId],
      name: restaurantName,
    },
    [
      Permission.read(Role.any()),
      Permission.update(Role.user(userDocId)),
      Permission.delete(Role.user(userDocId)),
    ]
  );
};

export const getRestaurantByManager = async (
  managerAccountId: string
): Promise<Models.Document> => {
  console.log('Fetching restaurant for manager:', managerAccountId);
  validateAppwriteId(managerAccountId, 'manager account ID');
  const userRes = await databases.listDocuments(
    config.databaseId,
    config.userCollectionId,
    [Query.equal('accountId', managerAccountId)]
  );
  if (!userRes.documents.length) {
    throw new Error('Manager user not found');
  }
  const userDoc = userRes.documents[0];

  const restRes = await databases.listDocuments(
    config.databaseId,
    config.restaurantCollectionId,
    [Query.equal('users', [userDoc.$id])]
  );
  if (!restRes.documents.length) {
    return createRestaurant(userDoc.$id, `${userDoc.username}'s Restaurant`);
  }
  return restRes.documents[0];
};

export const updateFoodRating = async (
  foodId: string,
  rating: number
): Promise<Models.Document> => {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  console.log('Updating food rating:', { foodId, rating });
  const existing = await databases.getDocument(
    config.databaseId,
    config.foodCollectionId,
    foodId
  );
  return await databases.updateDocument(
    config.databaseId,
    config.foodCollectionId,
    foodId,
    {
      name: existing.name,
      description: existing.description,
      price: existing.price,
      catagory: existing.catagory,
      image_url: existing.image_url,
      postDate: existing.postDate ?? existing.$createdAt,
      Availablity: existing.Availablity ?? true,
      rating,
      Restaurant_id: existing.Restaurant_id
        ? typeof existing.Restaurant_id === 'object'
          ? existing.Restaurant_id.$id
          : existing.Restaurant_id
        : null,
      users: existing.users || [],
    }
  );
};

export const getFoodPosts = async (page: number = 1, limit: number = 10): Promise<FoodDocument[]> => {
  try {
    console.log('Fetching food posts:', { page, limit });
    const res = await databases.listDocuments(
      config.databaseId,
      config.foodCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ]
    );
    const validDocuments = res.documents
      .filter(doc => {
        const isValid = doc && doc.$id && doc.name && typeof doc.price === 'number' && doc.image_url;
        if (!isValid) {
          console.warn('Invalid document filtered:', {
            $id: doc?.$id,
            name: doc?.name,
            price: doc?.price,
            image_url: doc?.image_url,
          });
        }
        return isValid;
      })
      .map(doc => {
        try {
          let restaurantId: string | null = null;
          if (doc.Restaurant_id) {
            restaurantId = typeof doc.Restaurant_id === 'object' && doc.Restaurant_id.$id
              ? validateAppwriteId(doc.Restaurant_id.$id, `Restaurant_id for food ${doc.$id}`)
              : validateAppwriteId(doc.Restaurant_id, `Restaurant_id for food ${doc.$id}`);
          }
          return {
            ...doc,
            rating: doc.rating || 0,
            Restaurant_id: restaurantId,
            Availablity: doc.Availablity ?? true,
            catagory: doc.catagory ?? 'unknown',
            description: doc.description || 'No description available',
            postDate: doc.postDate || doc.$createdAt,
          } as FoodDocument;
        } catch (error) {
          console.warn(`Skipping document ${doc.$id} due to error:`, error);
          return null;
        }
      })
      .filter((doc): doc is FoodDocument => doc !== null);

    if (validDocuments.length < res.documents.length) {
      console.warn(`Skipped ${res.documents.length - validDocuments.length} invalid documents`);
    }

    return validDocuments;
  } catch (error) {
    console.error('Error fetching food posts:', error);
    throw error;
  }
};

export const getFoodById = async (foodId: string): Promise<FoodDocument> => {
  if (!foodId) throw new Error('Food ID is required');
  console.log('Fetching food by ID:', foodId);
  const doc = await databases.getDocument(
    config.databaseId,
    config.foodCollectionId,
    foodId
  );
  return {
    ...doc,
    Restaurant_id: doc.Restaurant_id
      ? typeof doc.Restaurant_id === 'object'
        ? doc.Restaurant_id.$id
        : doc.Restaurant_id
      : null,
    Availablity: doc.Availablity ?? true,
    catagory: doc.catagory ?? 'unknown',
    postDate: doc.postDate || doc.$createdAt,
  } as FoodDocument;
};

export const getManagerFoodPosts = async (
  managerId: string
): Promise<FoodDocument[]> => {
  if (!managerId) throw new Error('Manager ID is required');
  console.log('Fetching manager food posts:', managerId);
  const restaurant = await getRestaurantByManager(managerId);
  const res = await databases.listDocuments(
    config.databaseId,
    config.foodCollectionId,
    [
      Query.equal('Restaurant_id', restaurant.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]
  );
  return res.documents.map(doc => ({
    ...doc,
    rating: doc.rating || 0,
    Restaurant_id: doc.Restaurant_id
      ? typeof doc.Restaurant_id === 'object'
        ? doc.Restaurant_id.$id
        : doc.Restaurant_id
      : null,
    Availablity: doc.Availablity ?? true,
    catagory: doc.catagory ?? 'unknown',
    postDate: doc.postDate || doc.$createdAt,
  } as FoodDocument));
};

export const createOrder = async (
  userId: string,
  foodItems: { id: string; name: string; price: number }[],
  total: number,
  paymentMethod: 'telebirr' | 'mpesa',
  phone: string
): Promise<Models.Document> => {
  if (!foodItems.length) throw new Error('No food items provided');

  try {
    console.log('Creating order for user:', userId);
    const session = await ensureActiveSession();
    if (session.userId !== userId) {
      throw new Error('User ID does not match authenticated user');
    }

    const userDoc = await getUserInfo(userId);
    validateAppwriteId(userDoc.$id, 'user document ID');

    let restaurantId: string | null = null;
    for (const item of foodItems) {
      const foodDoc = await getFoodById(item.id);
      console.log(`Food document (${item.id}):`, {
        Restaurant_id: foodDoc.Restaurant_id,
        name: foodDoc.name,
      });

      if (!foodDoc.Restaurant_id) {
        throw new Error(`No restaurant ID found for food item: ${item.id}`);
      }

      const restaurantDocId = validateAppwriteId(foodDoc.Restaurant_id, `restaurant ID for food item ${item.id}`);

      if (restaurantId === null) {
        restaurantId = restaurantDocId;
      } else if (restaurantId !== restaurantDocId) {
        throw new Error(`Food item ${item.id} belongs to a different restaurant`);
      }
    }

    if (!restaurantId) {
      throw new Error('No valid restaurant ID found for food items');
    }

    const orderData = {
      users: userDoc.$id,
      restaurant: [restaurantId],
      restaurantId,
      foodDetails: foodItems.map(f => f.id),
      total,
      paymentMethod,
      phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Creating order with:', orderData);

    return await databases.createDocument(
      config.databaseId,
      config.orderCollectionId,
      ID.unique(),
      orderData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
        Permission.read(Role.any()),
      ]
    );
  } catch (error: any) {
    console.error('Order creation failed:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

export const getManagerOrders = async (
  managerId: string
): Promise<Order[]> => {
  if (!managerId) throw new Error('Manager ID is required');
  console.log('Fetching manager orders:', managerId);
  const restaurant = await getRestaurantByManager(managerId);
  const res = await databases.listDocuments(
    config.databaseId,
    config.orderCollectionId,
    [
      Query.equal('restaurantId', restaurant.$id),
      Query.orderDesc('createdAt'),
      Query.limit(50),
    ]
  );

  return res.documents.map(doc => ({
    $id: doc.$id,
    users: doc.users as string,
    restaurant: doc.restaurant as string[],
    restaurantId: doc.restaurantId,
    foodDetails: doc.foodDetails as string[],
    total: doc.total,
    paymentMethod: doc.paymentMethod,
    phone: doc.phone,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }));
};

export const verifyFoodDocuments = async (managerAccountId: string): Promise<void> => {
  try {
    console.log('Verifying food documents for manager:', managerAccountId);
    const res = await databases.listDocuments(
      config.databaseId,
      config.foodCollectionId,
      [Query.limit(100)]
    );

    const restaurant = await getRestaurantByManager(managerAccountId);
    const userDoc = await getUserInfo(managerAccountId);

    for (const doc of res.documents) {
      const updates: any = {};
      if (!doc.Restaurant_id || (typeof doc.Restaurant_id === 'object' && !doc.Restaurant_id?.$id)) {
        console.log(`Fixing Restaurant_id for food document ${doc.$id}`);
        updates.Restaurant_id = restaurant.$id;
      }
      if (!doc.users || !Array.isArray(doc.users) || doc.users.length === 0) {
        console.log(`Fixing users for food document ${doc.$id}`);
        updates.users = [userDoc.$id];
      }
      if (!doc.name) updates.name = 'Unnamed Food';
      if (!doc.price || isNaN(doc.price)) updates.price = 0;
      if (!doc.image_url) updates.image_url = 'https://via.placeholder.com/150';
      if (!doc.description) updates.description = 'No description available';
      if (!doc.catagory) updates.catagory = 'unknown';
      if (doc.Availablity === undefined) updates.Availablity = true;
      if (!doc.postDate) updates.postDate = doc.$createdAt || new Date().toISOString();

      if (Object.keys(updates).length > 0) {
        console.log(`Updating food document ${doc.$id} with:`, updates);
        await databases.updateDocument(
          config.databaseId,
          config.foodCollectionId,
          doc.$id,
          updates
        );
      }
    }
    console.log('Food documents verification complete');
  } catch (error) {
    console.error('Error verifying food documents:', error);
    throw error;
  }
};