import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    setPersistence,
    browserLocalPersistence
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
        let mounted = true;
        console.log("AuthProvider: Initializing...");

        // Ensure persistence is Local
        setPersistence(auth, browserLocalPersistence)
            .then(() => console.log("AuthProvider: Persistence set to local"))
            .catch(err => console.error("AuthProvider: Persistence error:", err));

        const unsubscribe = onAuthStateChanged(
            auth,
            async (fbUser) => {
                console.log("AuthProvider: Auth state changed:", fbUser?.uid || 'null');
                if (!mounted) return;

                try {
                    setFirebaseUser(fbUser);
                    if (fbUser) {
                        console.log("AuthProvider: Fetching user doc for", fbUser.uid);
                        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
                        if (mounted) {
                            if (userDoc.exists()) {
                                console.log("AuthProvider: User doc found");
                                setUser({ id: fbUser.uid, ...userDoc.data() } as User);
                            } else {
                                console.warn("AuthProvider: User doc missing for", fbUser.uid);
                                setUser(null);
                            }
                        }
                    } else {
                        if (mounted) setUser(null);
                    }
                } catch (error) {
                    console.error("AuthProvider: Error fetching user profile:", error);
                } finally {
                    if (mounted) setLoading(false);
                }
            },
            (error) => {
                console.error("AuthProvider: Auth Error:", error);
                if (mounted) setLoading(false);
            }
        );

        // Safety Timeout (Force stop loading after 10s)
        const timeout = setTimeout(() => {
            if (mounted) {
                setLoading((prev) => {
                    if (prev) {
                        console.warn("Auth processing timed out from 10s safety valve.");
                        // Fallback check: if we have a current user in auth but listener didn't fire?
                        if (auth.currentUser) {
                            console.log("AuthProvider: Fallback found currentUser:", auth.currentUser.uid);
                            // We don't force false yet, maybe give it a moment? 
                            // But actually if 10s passed, something is stuck.
                        }
                        return false;
                    }
                    return prev;
                });
            }
        }, 10000);

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timeout);
        };
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

        // MANUALLY set state to avoid race condition where onAuthStateChanged fires before doc is written/readable
        // or if onAuthStateChanged executed too early and found no doc.
        setUser({ id: fbUser.uid, ...userData } as User);
        setFirebaseUser(fbUser);
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
