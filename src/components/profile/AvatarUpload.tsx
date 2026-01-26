import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, auth, db } from '../../lib/firebase';
import { useToast } from '../ui/Toast';
import { Upload, X, Check } from 'lucide-react';
import './AvatarUpload.css';

interface AvatarUploadProps {
    currentPhotoURL?: string;
    onUploadComplete?: (url: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentPhotoURL,
    onUploadComplete
}) => {
    const toast = useToast();
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
            toast.error('Apenas imagens são permitidas');
            return;
        }

        // Validate file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            toast.error('Imagem muito grande', 'Tamanho máximo: 5MB');
            return;
        }

        setFile(selectedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleUpload = async () => {
        if (!file || !auth.currentUser) return;

        setUploading(true);
        try {
            // Create unique filename
            const timestamp = Date.now();
            const fileName = `${auth.currentUser.uid}_${timestamp}`;
            const storageRef = ref(storage, `avatars/${fileName}`);

            // Upload file
            await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(storageRef);

            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                photoURL: downloadURL
            });

            // Update Firestore user document
            if (auth.currentUser.uid) {
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    avatarUrl: downloadURL,
                    updatedAt: new Date()
                });
            }

            toast.success('Avatar atualizado!');
            setPreview(null);
            setFile(null);

            if (onUploadComplete) {
                onUploadComplete(downloadURL);
            }
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao fazer upload', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setPreview(null);
        setFile(null);
    };

    return (
        <div className="avatar-upload">
            <div className="avatar-upload-preview">
                <img
                    src={preview || currentPhotoURL || 'https://via.placeholder.com/150?text=Avatar'}
                    alt="Avatar"
                    className="avatar-upload-image"
                />
                {preview && (
                    <div className="avatar-upload-overlay">
                        <span className="avatar-upload-preview-label">Preview</span>
                    </div>
                )}
            </div>

            {!preview ? (
                <label className="avatar-upload-button">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="avatar-upload-input"
                    />
                    <Upload size={16} />
                    Escolher Foto
                </label>
            ) : (
                <div className="avatar-upload-actions">
                    <button
                        className="avatar-upload-cancel"
                        onClick={handleCancel}
                        disabled={uploading}
                    >
                        <X size={16} />
                        Cancelar
                    </button>
                    <button
                        className="avatar-upload-confirm"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        <Check size={16} />
                        {uploading ? 'Enviando...' : 'Confirmar'}
                    </button>
                </div>
            )}

            <p className="avatar-upload-hint">
                {preview ? 'Clique em "Confirmar" para salvar' : 'JPG, PNG ou GIF. Máx 5MB.'}
            </p>
        </div>
    );
};
