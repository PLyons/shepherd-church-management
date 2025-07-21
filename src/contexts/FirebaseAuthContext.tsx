import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Member } from '../types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signUp: (email: string, password: string, memberData?: Partial<Member>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateMember: (updates: Partial<Member>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch member data from Firestore
  const fetchMemberData = async (uid: string): Promise<Member | null> => {
    try {
      const memberDoc = await getDoc(doc(db, 'members', uid));
      if (memberDoc.exists()) {
        return { id: memberDoc.id, ...memberDoc.data() } as Member;
      }
      return null;
    } catch (error) {
      console.error('Error fetching member data:', error);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const memberData = await fetchMemberData(user.uid);
        setMember(memberData);
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle email link sign in (for magic links)
  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          email = window.prompt('Please provide your email for confirmation');
        }
        if (email) {
          try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            // Clear the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            console.error('Error signing in with email link:', error);
          }
        }
      }
    };

    handleEmailLinkSignIn();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithMagicLink = async (email: string) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/callback`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const signUp = async (email: string, password: string, memberData?: Partial<Member>) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create member document in Firestore
    const now = Timestamp.now();
    const newMemberData: Partial<Member> = {
      email: user.email || email,
      role: 'member',
      member_status: 'active',
      joined_at: now.toDate().toISOString(),
      created_at: now.toDate().toISOString(),
      updated_at: now.toDate().toISOString(),
      ...memberData
    };
    
    await setDoc(doc(db, 'members', user.uid), newMemberData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    });
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await firebaseUpdatePassword(user, newPassword);
  };

  const updateMember = async (updates: Partial<Member>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const updateData = {
      ...updates,
      updated_at: Timestamp.now().toDate().toISOString()
    };

    await setDoc(doc(db, 'members', user.uid), updateData, { merge: true });
    
    // Update local state
    const updatedMember = await fetchMemberData(user.uid);
    setMember(updatedMember);
  };

  const value: AuthContextType = {
    user,
    member,
    loading,
    signIn,
    signInWithMagicLink,
    signUp,
    signOut: logout,
    resetPassword,
    updatePassword,
    updateMember
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within FirebaseAuthProvider');
  }
  return context;
};