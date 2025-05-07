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

// Appwrite configuration
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
  deliveryCollectionId: '68188ac00010b8f4d657',
  notificationCollectionId: '6818c53d001793fb7152',
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Interfaces for collections
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
  deliveryPersonId?: string;
}

export interface Delivery {
  $id: string;
  name: string;
  order: string;
  deliveryPersonId: string;
}

export interface Notification {
  $id: string;
  userId: string;
  message: string;
  orderId: string;
  deliveryId: string;
  read: boolean;
  createdAt: string;
}

// Utility functions
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

// Authentication functions
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
  baseRetryDelay = 2000
): Promise<{ session: Models.Session; userDocId: string }> => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  console.log('Attempting login for:', email);

  // Check for existing valid session
  const existingId = await loadSessionId();
  if (existingId) {
    try {
      const session = await account.getSession(existingId);
      const me = await account.get();
      if (session && me.email === email) {
        const userDoc = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal('accountId', me.$id)]
        );
        if (!userDoc.documents.length) {
          throw new Error('User document not found');
        }
        console.log('Using existing session:', session.$id, 'userDocId:', userDoc.documents[0].$id);
        return { session, userDocId: userDoc.documents[0].$id };
      } else {
        console.log('Invalid existing session, deleting:', existingId);
        await account.deleteSession(existingId);
        await clearSessionId();
      }
    } catch (error) {
      console.warn('Existing session invalid:', (error as Error).message);
      await clearSessionId();
    }
  }

  // Attempt login with exponential backoff for rate limits
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Login attempt ${i + 1} for:`, email);
      const session = await account.createEmailPasswordSession(email, password);
      console.log('Session created:', session.$id);

      // Verify session
      const currentSession = await account.getSession('current');
      console.log('Current session verified:', currentSession.$id);

      const user = await account.get();
      if (!user.$id) {
        throw new Error('Failed to retrieve user account details');
      }
      console.log('User account retrieved:', user.$id);

      const userDoc = await databases.listDocuments(
        config.databaseId,
        config.userCollectionId,
        [Query.equal('accountId', user.$id)]
      );
      if (!userDoc.documents.length) {
        throw new Error('User document not found for accountId: ' + user.$id);
      }

      await saveSessionId(session.$id);
      console.log('Login successful, session ID:', session.$id, 'userDocId:', userDoc.documents[0].$id);
      return { session, userDocId: userDoc.documents[0].$id };
    } catch (err: any) {
      console.error('Login attempt failed:', {
        message: err.message,
        code: err.code,
        type: err.type,
      });
      if (err.code === 429 && i < retries - 1) {
        const retryDelay = baseRetryDelay * Math.pow(2, i); // Exponential backoff: 2000ms, 4000ms, 8000ms
        console.log(`Rate limit hit, retrying after ${retryDelay}ms`);
        await delay(retryDelay);
      } else if (err.message.includes('session is active')) {
        const current = await account.getSession('current').catch(() => null);
        const me = await account.get().catch(() => null);
        if (current && me?.email === email) {
          const userDoc = await databases.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('accountId', me.$id)]
          );
          if (!userDoc.documents.length) {
            throw new Error('User document not found');
          }
          await saveSessionId(current.$id);
          console.log('Reused active session:', current.$id);
          return { session: current, userDocId: userDoc.documents[0].$id };
        }
        console.log('Deleting stale active session');
        await account.deleteSession('current').catch(() => null);
        await clearSessionId();
      } else {
        throw new Error(err.message || 'Login failed');
      }
    }
  }

  throw new Error('Rate limit exceeded. Please try again later.');
};

export const handleLogin = async ({ email, password }: { email: string; password: string }) => {
  try {
    console.log('handleLogin called with:', { email, password: '****' });
    
    // Check for existing session first
    let currentSession = await getCurrentSession();
    if (currentSession.session && currentSession.userDocId) {
      const user = await account.get();
      if (user.email === email) {
        console.log('Using existing session:', currentSession.session.$id);
        const role = await getUserRole(user.$id);
        return { 
          session: currentSession.session, 
          userDocId: currentSession.userDocId, 
          role, 
          accountId: user.$id 
        };
      } else {
        console.log('Existing session does not match email, clearing session');
        await account.deleteSession(currentSession.session.$id);
        await clearSessionId();
      }
    }

    // Perform login
    const loginResult = await Login(email, password);
    console.log('Login successful, session ID:', loginResult.session.$id, 'userDocId:', loginResult.userDocId);

    // Get account details
    const user = await account.get();
    if (!user || !user.$id) {
      console.error('Failed to retrieve user details');
      await clearSessionId();
      throw new Error('Failed to retrieve account details. Please login again.');
    }
    console.log('Retrieved accountId:', user.$id);

    // Fetch user role
    const role = await getUserRole(user.$id);
    console.log('User role:', role);

    return { 
      session: loginResult.session, 
      userDocId: loginResult.userDocId, 
      role, 
      accountId: user.$id 
    };
  } catch (error: any) {
    console.error('Login error in handleLogin:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });
    if (error.message.includes('login') || error.code === 401) {
      await clearSessionId();
      throw new Error('Please login again');
    }
    if (error.message.includes('Rate limit')) {
      throw new Error('Too many login attempts. Please wait a few minutes and try again.');
    }
    throw error;
  }
};

export const Logout = async () => {
  console.log('Logging out');
  await account.deleteSession('current');
  await clearSessionId();
};

export const getCurrentSession = async (): Promise<{
  session: Models.Session | null;
  userDocId: string | null;
  accountId: string | null;
}> => {
  const id = await loadSessionId();
  if (!id) {
    console.log('No session ID found in AsyncStorage');
    return { session: null, userDocId: null, accountId: null };
  }
  try {
    const session = await account.getSession(id);
    const user = await account.get();
    const userDoc = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', user.$id)]
    );
    if (!userDoc.documents.length) {
      throw new Error('User document not found');
    }
    console.log('Current session retrieved:', session.$id, 'userDocId:', userDoc.documents[0].$id);
    return { session, userDocId: userDoc.documents[0].$id, accountId: user.$id };
  } catch (error: any) {
    console.error('Failed to retrieve session:', error.message);
    await clearSessionId();
    return { session: null, userDocId: null, accountId: null };
  }
};

export const checkAndRestoreSession = async (): Promise<{ session: Models.Session | null; userDocId: string | null }> => {
  try {
    console.log('Checking and restoring session');
    const { session, userDocId } = await getCurrentSession();
    if (session) {
      await account.get();
      return { session, userDocId };
    }
    const currentSession = await account.getSession('current').catch(() => null);
    if (currentSession) {
      const user = await account.get();
      const userDoc = await databases.listDocuments(
        config.databaseId,
        config.userCollectionId,
        [Query.equal('accountId', user.$id)]
      );
      if (!userDoc.documents.length) {
        throw new Error('User document not found');
      }
      await saveSessionId(currentSession.$id);
      return { session: currentSession, userDocId: userDoc.documents[0].$id };
    }
    return { session: null, userDocId: null };
  } catch (error: any) {
    console.error('Session restoration failed:', error.message);
    await clearSessionId();
    return { session: null, userDocId: null };
  }
};

export const ensureActiveSession = async (requiredUserDocId?: string): Promise<Models.Session> => {
  try {
    console.log('Ensuring active session', requiredUserDocId ? `for userDocId: ${requiredUserDocId}` : '');
    
    let session = await account.getSession('current').catch(() => null);
    
    if (!session) {
      console.log('No current session, checking stored session');
      const sessionId = await loadSessionId();
      if (sessionId) {
        try {
          session = await account.getSession(sessionId);
        } catch (e) {
          console.warn('Stored session invalid:', (e as Error).message);
          await clearSessionId();
          throw new Error('Session expired or invalid. Please login again.');
        }
      } else {
        throw new Error('No session found. Please login to continue.');
      }
    }

    if (requiredUserDocId) {
      const user = await account.get();
      const userDoc = await databases.listDocuments(
        config.databaseId,
        config.userCollectionId,
        [Query.equal('accountId', user.$id)]
      );
      
      if (!userDoc.documents.length) {
        console.error('No user document found for accountId:', user.$id);
        await clearSessionId();
        throw new Error('User profile not found. Please login again.');
      }
      
      const userDocId = userDoc.documents[0].$id;
      if (userDocId !== requiredUserDocId) {
        console.error(`Session userDocId (${userDocId}) does not match required userDocId (${requiredUserDocId})`);
        await clearSessionId();
        throw new Error('Session does not belong to the requested user. Please login with the correct account.');
      }
    }

    await saveSessionId(session.$id);
    console.log('Active session validated:', session.$id);
    return session;
  } catch (e: any) {
    console.error('Session validation failed:', e.message);
    await clearSessionId();
    throw new Error(e.message || 'Please login to continue');
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

export const getUserRole = async (accountId: string): Promise<string> => {
  console.log('getUserRole called with accountId:', accountId);
  if (!accountId) {
    console.error('Account ID is missing or undefined');
    throw new Error('Account ID is required');
  }
  try {
    const res = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', accountId)]
    );
    if (!res.documents.length) {
      console.error('No user document found for accountId:', accountId);
      throw new Error('User not found for accountId: ' + accountId);
    }
    console.log('User role retrieved:', res.documents[0].role);
    return res.documents[0].role;
  } catch (error: any) {
    console.error('Error fetching user role:', {
      message: error.message,
      code: error.code,
      type: error.type,
      accountId,
    });
    throw error;
  }
};

export const getUserInfo = async (accountId: string): Promise<Models.Document> => {
  if (!accountId) throw new Error('Account ID is required');
  console.log('Fetching user info for accountId:', accountId);
  try {
    const res = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', accountId)]
    );
    
    if (!res.documents.length) {
      throw new Error('User not found for accountId: ' + accountId);
    }
    
    const userDoc = res.documents[0];
    validateAppwriteId(userDoc.$id, 'user document ID');
    return userDoc;
  } catch (error: any) {
    console.error('Failed to fetch user info:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw error;
  }
};

// Food and restaurant functions
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

// Order and delivery functions
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
    // Validate session and get account ID
    const { session, userDocId, accountId } = await getCurrentSession();
    if (!session || !userDocId || !accountId) {
      throw new Error('No active session or user data. Please login again.');
    }
    // Ensure the session matches the provided userId
    if (userDocId !== userId) {
      throw new Error('Session does not belong to the requested user.');
    }

    const userDoc = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('$id', userId)]
    );
    if (!userDoc.documents.length) throw new Error('User document not found');
    validateAppwriteId(userDoc.documents[0].$id, 'user document ID');

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
      users: userDoc.documents[0].$id,
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
        Permission.read(Role.users()), // Allow all authenticated users to read
        Permission.write(Role.user(accountId)), // Only the user can write
        Permission.update(Role.user(accountId)), // Only the user can update
        Permission.delete(Role.user(accountId)), // Only the user can delete
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
    deliveryPersonId: doc.deliveryPersonId || '',
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

export const getAvailableDeliveryPersonnel = async (): Promise<Models.Document[]> => {
  try {
    console.log('Fetching available delivery personnel');
    const res = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [
        Query.equal('role', 'delivery'),
        Query.limit(100),
      ]
    );
    return res.documents.filter(doc => doc.accountId && doc.username);
  } catch (error: any) {
    console.error('Error fetching delivery personnel:', error);
    throw new Error(`Failed to fetch delivery personnel: ${error.message}`);
  }
};

export const assignDeliveryToOrder = async (
  orderId: string,
  deliveryPersonId: string,
  deliveryPersonName: string
): Promise<Models.Document> => {
  if (!orderId || !deliveryPersonId || !deliveryPersonName) {
    throw new Error('Order ID, delivery person ID, and name are required');
  }

  try {
    console.log('Assigning delivery to order:', { orderId, deliveryPersonId, deliveryPersonName });
    
    const session = await ensureActiveSession();
    const managerId = session.userId;
    console.log('Authenticated manager ID:', managerId);

    console.log('Updating order document:', orderId);
    await databases.updateDocument(
      config.databaseId,
      config.orderCollectionId,
      orderId,
      {
        deliveryPersonId,
        status: 'assigned',
        updatedAt: new Date().toISOString(),
      }
    );
    console.log('Order document updated successfully');

    console.log('Creating delivery document for:', deliveryPersonName);
    const deliveryDoc = await databases.createDocument(
      config.databaseId,
      config.deliveryCollectionId,
      ID.unique(),
      {
        name: deliveryPersonName,
        order: orderId,
        deliveryPersonId,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(managerId)),
        Permission.delete(Role.user(managerId)),
        Permission.read(Role.users()),
      ]
    );
    console.log('Delivery document created:', deliveryDoc.$id);

    const orderDoc = await databases.getDocument(
      config.databaseId,
      config.orderCollectionId,
      orderId
    );
    await createNotification(
      orderDoc.users,
      `Your order #${orderId.slice(0, 8)} has been assigned to ${deliveryPersonName}.`,
      orderId,
      deliveryDoc.$id,
      false
    );

    return deliveryDoc;
  } catch (error: any) {
    console.error('Delivery assignment failed:', {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack,
    });
    throw new Error(`Failed to assign delivery: ${error.message}`);
  }
};

export const acceptDeliveryAssignment = async (
  deliveryId: string,
  orderId: string
): Promise<void> => {
  try {
    console.log('Accepting delivery assignment:', { deliveryId, orderId });

    await databases.updateDocument(
      config.databaseId,
      config.orderCollectionId,
      orderId,
      {
        status: 'picked_up',
        updatedAt: new Date().toISOString(),
      }
    );

    const deliveryDoc = await databases.getDocument(
      config.databaseId,
      config.deliveryCollectionId,
      deliveryId
    );

    await databases.updateDocument(
      config.databaseId,
      config.deliveryCollectionId,
      deliveryId,
      {
        name: deliveryDoc.name,
        order: orderId,
        deliveryPersonId: deliveryDoc.deliveryPersonId,
      }
    );

    await createNotification(
      deliveryDoc.deliveryPersonId,
      `You have successfully picked up order #${orderId.slice(0, 8)}.`,
      orderId,
      deliveryId,
      false
    );

    const orderDoc = await databases.getDocument(
      config.databaseId,
      config.orderCollectionId,
      orderId
    );
    await createNotification(
      orderDoc.users,
      `Your order #${orderId.slice(0, 8)} has been picked up by ${deliveryDoc.name}.`,
      orderId,
      deliveryId,
      false
    );
  } catch (error: any) {
    console.error('Accept delivery failed:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Failed to accept delivery: ${error.message}`);
  }
};

export const getDeliveryAssignments = async (
  deliveryPersonId: string
): Promise<Delivery[]> => {
  if (!deliveryPersonId) throw new Error('Delivery person ID is required');
  console.log('Fetching delivery assignments for:', deliveryPersonId);
  try {
    const res = await databases.listDocuments(
      config.databaseId,
      config.deliveryCollectionId,
      [
        Query.equal('deliveryPersonId', deliveryPersonId),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]
    );

    const deliveries = res.documents
      .map(doc => {
        const orderId = typeof doc.order === 'string' ? doc.order : doc.order?.$id;
        if (!orderId) {
          console.warn('Invalid order ID in delivery:', doc);
          return null;
        }
        return {
          $id: doc.$id,
          name: doc.name,
          order: orderId,
          deliveryPersonId: doc.deliveryPersonId,
        } as Delivery;
      })
      .filter((doc): doc is Delivery => doc !== null);

    console.log('Fetched delivery assignments:', deliveries);
    return deliveries;
  } catch (error: any) {
    console.error('Error fetching delivery assignments:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Failed to fetch delivery assignments: ${error.message}`);
  }
};

// Notification functions
export const createNotification = async (
  userId: string,
  message: string,
  orderId: string,
  deliveryId: string,
  read: boolean = false
): Promise<Models.Document> => {
  if (!userId || !message || !orderId || !deliveryId) {
    throw new Error('User ID, message, order ID, and delivery ID are required');
  }

  try {
    console.log('Creating notification for:', { userId, message, orderId, deliveryId });
    const notification = await databases.createDocument(
      config.databaseId,
      config.notificationCollectionId,
      ID.unique(),
      {
        userId,
        message,
        orderId,
        deliveryId,
        read,
        createdAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );
    return notification;
  } catch (error: any) {
    console.error('Notification creation failed:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

export const getNotifications = async (userDocId: string): Promise<Notification[]> => {
  if (!userDocId) throw new Error('User document ID is required');
  console.log('Fetching notifications for userDocId:', userDocId);
  try {
    await ensureActiveSession(userDocId);
    
    const res = await databases.listDocuments(
      config.databaseId,
      config.notificationCollectionId,
      [
        Query.equal('userId', userDocId),
        Query.orderDesc('createdAt'),
        Query.limit(50),
      ]
    );
    
    const notifications = res.documents.map(doc => ({
      $id: doc.$id,
      userId: doc.userId,
      message: doc.message,
      orderId: doc.orderId,
      deliveryId: doc.deliveryId,
      read: doc.read,
      createdAt: doc.createdAt,
    }));

    console.log(`Fetched ${notifications.length} notifications for userDocId: ${userDocId}`);
    return notifications;
  } catch (error: any) {
    console.error('Error fetching notifications:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    if (error.message.includes('login') || error.code === 401) {
      throw new Error('Please login to continue');
    }
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  if (!notificationId) throw new Error('Notification ID is required');
  console.log('Marking notification as read:', notificationId);
  try {
    await databases.updateDocument(
      config.databaseId,
      config.notificationCollectionId,
      notificationId,
      {
        read: true,
      }
    );
  } catch (error: any) {
    console.error('Error marking notification as read:', {
      message: error.message,
      code: error.code,
      type: error.type,
    });
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};
