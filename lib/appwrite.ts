import { Client, Account, ID, Models, Avatars, Databases } from 'react-native-appwrite';

export const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  platform: 'com.campus.bites',
  projectId: '680a8d8e0014d2032491',
  databaseId: '680a8fc000090daecdee',
  userCollectionId: '680a8fed000663815bf7',
  storageId: '680a90c10020735ce532',
};

const client: Client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account: Account = new Account(client);
const avatars: Avatars = new Avatars(client);
const databases: Databases = new Databases(client);

export const createUser = async (
  email: string,
  password: string,
  username: string
): Promise<Models.Document | undefined> => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw new Error('Account creation failed');

    const avatarUrl = avatars.getInitials(username).href;

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error: any) {
    console.error('CreateUser Error:', error);
    throw new Error(error.message || 'An error occurred during user creation');
  }
};

export const Login = async (
  email: string,
  password: string
): Promise<Models.Session> => {
  try {
    console.log('Login Attempt:', { email, password: password ? '****' : 'MISSING' });
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

  
    try {
      const currentSession = await account.getSession('current');
      console.log('Existing session found:', currentSession);
      await account.deleteSession('current');
      console.log('Existing session deleted');
    } catch (e) {
      console.log('No active session or error checking session:', e.message);
    }

    const session = await account.createEmailPasswordSession(email, password);
    console.log('New session created:', session);
    return session;
  } catch (error: any) {
    console.error('Login Error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

export const Logout = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
    console.log('Session deleted successfully');
  } catch (error: any) {
    console.error('Logout Error:', error);
    throw new Error(error.message || 'Logout failed');
  }
};

export const getCurrentSession = async (): Promise<Models.Session | null> => {
  try {
    const session = await account.getSession('current');
    console.log('Current session retrieved:', session);
    return session;
  } catch (error: any) {
    console.log('No current session or error:', error.message);
    return null;
  }
};