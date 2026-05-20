import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TikTokLaunch, TikTokCost, TikTokStructure, CreateTikTokLaunch, CreateTikTokCost, CreateTikTokStructure } from '../types/tiktok';

// Helper to convert Firestore timestamps to JavaScript Dates
const convertTimestamps = (data: any) => {
  if (!data) return data;
  const result = { ...data };
  if (result.createdAt instanceof Timestamp) result.createdAt = result.createdAt.toDate();
  if (result.updatedAt instanceof Timestamp) result.updatedAt = result.updatedAt.toDate();
  if (result.date instanceof Timestamp) result.date = result.date.toDate();
  return result;
};

// ==========================================
// 1. ESTRUTURAS (tiktokStructures)
// ==========================================

export const subscribeStructures = (
  userId: string,
  callback: (structures: TikTokStructure[]) => void
) => {
  const q = query(
    collection(db, 'tiktokStructures'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const structures: TikTokStructure[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      structures.push({
        id: docSnap.id,
        ...convertTimestamps(data)
      } as TikTokStructure);
    });
    callback(structures);
  });
};

export const addStructure = async (userId: string, structure: CreateTikTokStructure) => {
  const docRef = await addDoc(collection(db, 'tiktokStructures'), {
    ...structure,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateStructure = async (id: string, structure: Partial<TikTokStructure>) => {
  const docRef = doc(db, 'tiktokStructures', id);
  await updateDoc(docRef, {
    ...structure,
    updatedAt: serverTimestamp()
  });
};

export const deleteStructure = async (id: string) => {
  const docRef = doc(db, 'tiktokStructures', id);
  await deleteDoc(docRef);
};

// ==========================================
// 2. LANÇAMENTOS (tiktokLaunches)
// ==========================================

export const subscribeLaunches = (
  userId: string,
  callback: (launches: TikTokLaunch[]) => void
) => {
  const q = query(
    collection(db, 'tiktokLaunches'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const launches: TikTokLaunch[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      launches.push({
        id: docSnap.id,
        ...convertTimestamps(data)
      } as TikTokLaunch);
    });
    callback(launches);
  });
};

export const addLaunch = async (userId: string, launch: CreateTikTokLaunch) => {
  const docRef = await addDoc(collection(db, 'tiktokLaunches'), {
    ...launch,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateLaunch = async (id: string, launch: Partial<TikTokLaunch>) => {
  const docRef = doc(db, 'tiktokLaunches', id);
  await updateDoc(docRef, {
    ...launch,
    updatedAt: serverTimestamp()
  });
};

export const deleteLaunch = async (id: string) => {
  const docRef = doc(db, 'tiktokLaunches', id);
  await deleteDoc(docRef);
};

// ==========================================
// 3. CUSTOS DA OPERAÇÃO (tiktokCosts)
// ==========================================

export const subscribeCosts = (
  userId: string,
  callback: (costs: TikTokCost[]) => void
) => {
  const q = query(
    collection(db, 'tiktokCosts'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const costs: TikTokCost[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      costs.push({
        id: docSnap.id,
        ...convertTimestamps(data)
      } as TikTokCost);
    });
    callback(costs);
  });
};

export const addCost = async (userId: string, cost: CreateTikTokCost) => {
  const docRef = await addDoc(collection(db, 'tiktokCosts'), {
    ...cost,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateCost = async (id: string, cost: Partial<TikTokCost>) => {
  const docRef = doc(db, 'tiktokCosts', id);
  await updateDoc(docRef, {
    ...cost,
    updatedAt: serverTimestamp()
  });
};

export const deleteCost = async (id: string) => {
  const docRef = doc(db, 'tiktokCosts', id);
  await deleteDoc(docRef);
};
