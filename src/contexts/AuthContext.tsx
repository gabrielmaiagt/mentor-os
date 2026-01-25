import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';
import type { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    isMentee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setFirebaseUser(fbUser);

            if (fbUser) {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                if (userDoc.exists()) {
                    setUser({ id: fbUser.uid, ...userDoc.data() } as User);
                } else {
                    // User exists in Auth but not in Firestore (shouldn't happen normally)
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
        const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

        // Create user document in Firestore
        const userData: Omit<User, 'id'> = {
            displayName,
            email,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await setDoc(doc(db, 'users', fbUser.uid), userData);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    const isAdmin = user?.role === 'mentor';
    const isMentee = user?.role === 'mentee';

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                signIn,
                signUp,
                signOut,
                isAdmin,
                isMentee,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
