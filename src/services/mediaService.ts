import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
} from 'firebase/storage';
import type { UploadTaskSnapshot } from 'firebase/storage';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { storage, db, auth } from '../lib/firebase';

export type MediaCategory =
    | 'geral'
    | 'thumbnails'
    | 'criativos'
    | 'aulas'
    | 'recursos';

export type MediaType = 'image' | 'video';

export interface MediaFile {
    id: string;
    name: string;
    url: string;
    storagePath: string;
    type: MediaType;
    mimeType: string;
    size: number;
    category: MediaCategory;
    uploadedBy: string;
    createdAt: Date;
}

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
    state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
}

const COLLECTION = 'mediaFiles';

function getMediaType(file: File): MediaType {
    return file.type.startsWith('video/') ? 'video' : 'image';
}

/**
 * Upload a file to Firebase Storage with progress callback.
 * Returns a promise that resolves to the saved MediaFile record.
 */
export function uploadMedia(
    file: File,
    category: MediaCategory = 'geral',
    onProgress?: (progress: UploadProgress) => void
): Promise<MediaFile> {
    return new Promise((resolve, reject) => {
        const uid = auth.currentUser?.uid;
        if (!uid) {
            reject(new Error('Usuário não autenticado'));
            return;
        }

        const timestamp = Date.now();
        // Sanitize filename
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `media-hub/${uid}/${timestamp}-${safeName}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
        });

        uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
                const percentage = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                onProgress?.({
                    bytesTransferred: snapshot.bytesTransferred,
                    totalBytes: snapshot.totalBytes,
                    percentage,
                    state: snapshot.state as UploadProgress['state'],
                });
            },
            (error) => {
                reject(error);
            },
            async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    const mediaType = getMediaType(file);

                    const docData = {
                        name: file.name,
                        url,
                        storagePath,
                        type: mediaType,
                        mimeType: file.type,
                        size: file.size,
                        category,
                        uploadedBy: uid,
                        createdAt: serverTimestamp(),
                    };

                    const docRef = await addDoc(collection(db, COLLECTION), docData);

                    resolve({
                        id: docRef.id,
                        ...docData,
                        createdAt: new Date(),
                    } as MediaFile);
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

/**
 * Fetch all media files ordered by creation date (newest first).
 */
export async function getMediaFiles(): Promise<MediaFile[]> {
    const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    })) as MediaFile[];
}

/**
 * Delete a media file from both Storage and Firestore.
 */
export async function deleteMedia(fileId: string, storagePath: string): Promise<void> {
    // Delete from Storage
    const storageRef = ref(storage, storagePath);
    try {
        await deleteObject(storageRef);
    } catch (err: any) {
        // If object doesn't exist, proceed to delete Firestore record
        if (err.code !== 'storage/object-not-found') throw err;
    }
    // Delete Firestore record
    await deleteDoc(doc(db, COLLECTION, fileId));
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate embed HTML for a media file.
 */
export function getEmbedCode(file: MediaFile): string {
    if (file.type === 'video') {
        return `<video src="${file.url}" controls style="max-width:100%"></video>`;
    }
    return `<img src="${file.url}" alt="${file.name}" style="max-width:100%" />`;
}
