import React, { useState, useEffect } from 'react';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PhotoIcon,
  LinkIcon,
  CubeIcon,
  PaintBrushIcon,
  ChevronDownIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import 'react-toastify/dist/ReactToastify.css';
import { uploadFile } from '../config/imagekit';

interface GalleryItem {
  title: string;
  description: string;
  dimensions: string;
  category: string;
  style: string;
}

const predefinedOptions = {
  titles: [
    'Modern Minimalist Design',
    'Contemporary Luxury Space',
    'Classic Elegant Interior',
    'Urban Chic Room',
    'Rustic Comfort Design',
  ],
  categories: [
    'Bedrooms',
    'Living Rooms',
    'Kitchen',
    'Washroom',
    'Custom Made',
    'Dining Rooms',
    'Other'
  ],
  dimensions: [
    '10x12 ft',
    '12x15 ft',
    '15x20 ft',
    '20x25 ft',
    '25x30 ft',
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
  ]
};

const GalleryUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
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
    if (event.target.files && event.target.files.length > 0) {
      const selectedFiles = Array.from(event.target.files);
      const oversized = selectedFiles.some(f => f.size > 2 * 1024 * 1024);
      if (oversized) {
        toast.error('Some files are larger than 2MB. Please optimize your images.');
        return;
      }

      setFiles(prev => [...prev, ...selectedFiles]);
      try {
        const base64Promises = selectedFiles.map(f => convertToBase64(f));
        const base64s = await Promise.all(base64Promises);
        setPreviews(prev => [...prev, ...base64s]);
        setError('');
      } catch (err) {
        toast.error('Error processing images');
      }
    }
  };

  const handleUrlAdd = () => {
    if (imageUrl) {
      setPreviews(prev => [...prev, imageUrl]);
      setImageUrl('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGalleryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    if (previews.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (!galleryData.title || !galleryData.category) {
      toast.error('Project Title and Category are required');
      return;
    }

    setUploading(true);
    try {
      const uploadTargets = uploadType === 'file' ? files : previews;
      const uploadPromises = uploadTargets.map((target, idx) => {
        const safeTitle = galleryData.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_') || 'image';
        return uploadFile(target, `${safeTitle}_${Date.now()}_${idx}.jpg`, "gallery");
      });

      const uploadResults = await Promise.all(uploadPromises) as any[];
      const imageUrls = uploadResults.map(res => res.url);

      const finalData = {
        ...galleryData,
        title: galleryData.title === 'custom' ? customTitle : galleryData.title,
        category: galleryData.category === 'Other' ? customCategory : galleryData.category,
        imageData: imageUrls[0], // Main thumbnail
        images: imageUrls, // All images for the collection
        uploadedAt: serverTimestamp(),
        userId: user.uid,
        type: 'collection'
      };

      await addDoc(collection(db, 'gallery'), finalData);

      toast.success(`Success! Collection published with ${imageUrls.length} images.`);

      setPreviews([]);
      setFiles([]);
      setGalleryData({
        title: '',
        description: '',
        dimensions: '',
        category: 'Bedrooms',
        style: ''
      });
      setCustomTitle('');
      setCustomCategory('');
    } catch (err) {
      console.error('Error uploading:', err);
      toast.error('Failed to publish collection');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
      <div className="p-8 md:p-12">
        <h2 className="text-4xl font-black text-gray-800 mb-12 tracking-tight">Create Gallery Collection</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Side: Upload Section */}
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block">
                Upload Method
              </label>
              <div className="flex p-1.5 bg-[#F8F9FA] rounded-2xl w-fit">
                <button
                  onClick={() => setUploadType('file')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadType === 'file'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Local Files
                </button>
                <button
                  onClick={() => setUploadType('url')}
                  className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${uploadType === 'url'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {uploadType === 'file' ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="file-upload"
                >
                  <label className="group cursor-pointer block">
                    <div className="w-full h-56 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-gray-50/50 group-hover:bg-indigo-50/50 group-hover:border-indigo-200 transition-all">
                      <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <PlusIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-500">Pick Images (Max 2MB/each)</p>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key="url-upload"
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste your image URL here..."
                      className="w-full pl-12 pr-4 py-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 placeholder:text-gray-300 shadow-inner"
                    />
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                  </div>
                  <button
                    onClick={handleUrlAdd}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                  >
                    Add to Collection
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {previews.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">
                    Selected Assets ({previews.length})
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {previews.map((prev, i) => (
                    <motion.div
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      key={i}
                      className="aspect-square rounded-2xl overflow-hidden relative group shadow-sm shadow-gray-100"
                    >
                      <img src={prev} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => removePreview(i)}
                          className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-rose-500 transition-colors shadow-lg"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-lg">
                          Cover
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Form Details */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Title</label>
                <div className="relative">
                  <select
                    name="title"
                    value={galleryData.title}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner"
                  >
                    <option value="">Select a title</option>
                    {predefinedOptions.titles.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="custom">Add Custom Title...</option>
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {galleryData.title === 'custom' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Project Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter your custom title..."
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                <div className="relative">
                  <select
                    name="category"
                    value={galleryData.category}
                    onChange={handleInputChange}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner"
                  >
                    {predefinedOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>

                {galleryData.category === 'Other' && (
                  <div className="space-y-3 pt-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Category Name</label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter your custom category..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions & Style</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      name="dimensions"
                      value={galleryData.dimensions}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner text-sm"
                    >
                      <option value="">Dimensions</option>
                      {predefinedOptions.dimensions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      name="style"
                      value={galleryData.style}
                      onChange={handleInputChange}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner text-sm"
                    >
                      <option value="">Style</option>
                      {predefinedOptions.styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <PaintBrushIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Description</label>
                <textarea
                  name="description"
                  value={galleryData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the collection's details and finishes..."
                  className="w-full p-5 h-44 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 placeholder:text-gray-300 shadow-inner resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  PUBLISH COLLECTION ({previews.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
};

export default GalleryUpload;
