import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface GalleryItem {
  title: string;
  description: string;
  dimensions: string;
  category: 'Bedrooms' | 'Living Rooms' | 'Dining Rooms' | 'Kitchen';
  style: string;
}

const predefinedOptions = {
  titles: [
    'Modern Minimalist Design',
    'Contemporary Luxury Space',
    'Classic Elegant Interior',
    'Urban Chic Room',
    'Rustic Comfort Design',
    'Custom...'
  ],
  descriptions: [
    'A perfect blend of functionality and style',
    'Luxurious space with premium finishes',
    'Elegant design with timeless appeal',
    'Modern urban living at its finest',
    'Warm and inviting space with natural elements',
    'Custom...'
  ],
  dimensions: [
    '10x12 ft',
    '12x15 ft',
    '15x20 ft',
    '20x25 ft',
    '25x30 ft',
    'Custom...'
  ],
  styles: [
    'Modern',
    'Contemporary',
    'Traditional',
    'Minimalist',
    'Industrial',
    'Scandinavian',
    'Bohemian',
    'Rustic',
    'Custom...'
  ]
};

const GalleryUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState(auth.currentUser);
  const [galleryData, setGalleryData] = useState<GalleryItem>({
    title: '',
    description: '',
    dimensions: '',
    category: 'Bedrooms',
    style: ''
  });
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [customFields, setCustomFields] = useState({
    title: false,
    description: false,
    dimensions: false,
    style: false
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        setError('Please log in to upload images');
      }
    });

    return () => unsubscribe();
  }, []);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      if (selectedFile.size > 1024 * 1024) {
        setError('File size must be less than 1MB');
        return;
      }

      setFile(selectedFile);
      try {
        const base64 = await convertToBase64(selectedFile);
        setPreview(base64);
        setError('');
      } catch (err) {
        setError('Error processing image');
        console.error(err);
      }
    }
  };

  const handleUrlChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setImageUrl(url);
    if (url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Invalid image URL');
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
          throw new Error('URL does not point to a valid image');
        }
        const base64 = await convertToBase64(new File([blob], 'url-image', { type: blob.type }));
        setPreview(base64);
        setError('');
      } catch (err) {
        setError('Error loading image from URL');
        setPreview('');
        console.error(err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGalleryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePredefinedSelect = (field: keyof GalleryItem, value: string) => {
    if (value === 'Custom...') {
      setCustomFields(prev => ({ ...prev, [field]: true }));
      setGalleryData(prev => ({ ...prev, [field]: '' }));
    } else {
      setCustomFields(prev => ({ ...prev, [field]: false }));
      setGalleryData(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetForm = () => {
    setPreview('');
    setFile(null);
    setImageUrl('');
    setGalleryData({
      title: '',
      description: '',
      dimensions: '',
      category: 'Bedrooms',
      style: ''
    });
    setCustomFields({
      title: false,
      description: false,
      dimensions: false,
      style: false
    });
  };

  const handleUpload = async () => {
    if (!user) {
      setError('Please log in to upload images');
      return;
    }

    if ((!file && !imageUrl) || !preview) {
      setError('Please select a file or enter an image URL');
      return;
    }

    if (!galleryData.title || !galleryData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const docRef = await addDoc(collection(db, 'gallery'), {
        ...galleryData,
        imageData: preview,
        fileName: file ? file.name : 'url-image',
        uploadedAt: serverTimestamp(),
        userId: user.uid,
        type: 'image'
      });

      toast.success('Image uploaded successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      resetForm();
    } catch (err) {
      console.error('Error uploading:', err);
      setError('Failed to upload image. Please try again.');
      toast.error('Failed to upload image', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-red-500">Please log in to upload images</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload to Gallery</h2>
      <ToastContainer position="bottom-right" />

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
        <div className="flex space-x-4">
          <button
            onClick={() => setUploadType('file')}
            className={`px-4 py-2 rounded-md ${
              uploadType === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setUploadType('url')}
            className={`px-4 py-2 rounded-md ${
              uploadType === 'url'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {uploadType === 'file' ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Image (Max 1MB)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="Enter image URL"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
      )}

      {preview && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Preview</h3>
          <div className="relative aspect-video w-full max-w-2xl mx-auto">
            <img
              src={preview}
              alt="Preview"
              className="rounded-lg object-contain w-full h-full"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          {!customFields.title ? (
            <select
              value={galleryData.title}
              onChange={(e) => handlePredefinedSelect('title', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="">Select a title</option>
              {predefinedOptions.titles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="title"
              value={galleryData.title}
              onChange={handleInputChange}
              placeholder="Enter custom title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={galleryData.category}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <option value="Bedrooms">Bedrooms</option>
            <option value="Living Rooms">Living Rooms</option>
            <option value="Dining Rooms">Dining Rooms</option>
            <option value="Kitchen">Kitchen</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload to Gallery'}
      </button>
    </div>
  );
};

export default GalleryUpload;
