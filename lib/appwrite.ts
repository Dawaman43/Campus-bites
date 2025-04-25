import { Client, Account, ID, Models, Avatars, Databases, Query } from 'react-native-appwrite';

export const config = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  platform: 'com.campus.bites',
  projectId: '680a8d8e0014d2032491',
  databaseId: '680a8fc000090daecdee',
  userCollectionId: '680a8fed000663815bf7',
  storageId: '680a90c10020735ce532',
  otpCollectionId: '680be9ee002a54163937',
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createUser = async (
  email: string,
  password: string,
  username: string,
  role: string
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
        role,
      }
    );

    return newUser;
  } catch (error: any) {
    throw new Error(error.message || 'An error occurred during user creation');
  }
};

export const Login = async (
  email: string,
  password: string,
  retries = 3,
  retryDelay = 1000
): Promise<Models.Session> => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    
    const currentSession = await getCurrentSession();
    if (currentSession) {
      const user = await account.get();
      if (user.email === email) {
        console.log('Reusing existing session for:', email);
        return currentSession;
      }
      console.log('Different user session found, deleting...');
      await account.deleteSession('current');
    }

    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const session = await account.createEmailPasswordSession(email, password);
        console.log('New session created for:', email);
        return session;
      } catch (error: any) {
        if (error.message.includes('Rate limit') && attempt < retries) {
          console.warn(`Rate limit hit, retrying (${attempt}/${retries})...`);
          await delay(retryDelay * attempt); 
          continue;
        }
        throw error;
      }
    }

    throw new Error('Rate limit exceeded after retries');
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
  }
};

export const Logout = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
    console.log('Session deleted');
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

export const getCurrentSession = async (): Promise<Models.Session | null> => {
  try {
    const session = await account.getSession('current');
    return session;
  } catch (error: any) {
    return null;
  }
};

export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', userId)]
    );

    if (response.documents.length === 0) {
      throw new Error('User document not found');
    }

    return response.documents[0].role;
  } catch (error: any) {
    console.error('Error fetching user role:', error);
    throw new Error(error.message || 'User role not found');
  }
};

export const getUserInfo = async (userId: string): Promise<Models.Document> => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', userId)]
    );

    if (response.documents.length === 0) {
      throw new Error('User document not found');
    }

    return response.documents[0];
  } catch (error: any) {
    console.error('Error fetching user info:', error);
    throw new Error(error.message || 'User info not found');
  }
};

export const checkAndRestoreSession = async (): Promise<{
  session: Models.Session | null;
  role: string | null;
}> => {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return { session: null, role: null };
    }

    const role = await getUserRole(session.userId);
    return { session, role };
  } catch (error: any) {
    console.error('Error restoring session:', error);
    return { session: null, role: null };
  }
};