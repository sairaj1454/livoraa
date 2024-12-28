import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BlogUpload: React.FC = () => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [readTime, setReadTime] = useState('');
  const [imageData, setImageData] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const predefinedCategories = ['Interior Trends', 'Small Spaces', 'Sustainability', 'Color & Design', 'Renovation', 'Technology', 'DIY', 'Furniture', 'Other'];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImageData(reader.result.toString());
        }
      };
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setImageData(previewUrl);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: string[] = [];
      
      files.forEach(file => {
        // Create preview URLs for immediate display
        const previewUrl = URL.createObjectURL(file);
        newImages.push(previewUrl);
        
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            // Update the preview URL with the actual base64 data when ready
            setGalleryImages(prev => 
              prev.map(img => img === previewUrl ? reader.result!.toString() : img)
            );
          }
        };
        reader.readAsDataURL(file);
      });
      
      setGalleryImages(prev => [...prev, ...newImages]);
    }
  };

  const clearImage = () => {
    setImageData('');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !excerpt || !content || !imageData || !authorName || !readTime || (!category && !customCategory)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const blogData = {
        title,
        excerpt,
        content,
        category: category === 'Other' ? customCategory : category,
        authorName,
        readTime,
        imageData,
        galleryImages,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };

      await addDoc(collection(db, 'blogs'), blogData);

      // Reset form
      setTitle('');
      setExcerpt('');
      setContent('');
      setCategory('');
      setCustomCategory('');
      setAuthorName('');
      setReadTime('');
      setImageData('');
      setGalleryImages([]);
      clearImage();
      
      toast.success('Blog post uploaded successfully!');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error uploading blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Blog Post</h2>
      <ToastContainer position="bottom-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter blog title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Excerpt/Summary *
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
            placeholder="Brief summary of the blog post"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Content *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-48"
            placeholder="Write your blog content here"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {predefinedCategories.map((cat) => (
                <option key={cat} value={cat} className="text-gray-700">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category === 'Other' && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Custom Category *
              </label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter custom category"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Author Name *
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter author name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Read Time *
            </label>
            <input
              type="text"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5 min read"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Featured Image *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
            <div className="flex flex-col items-center">
              {imageData ? (
                <div className="relative w-full">
                  <img
                    src={imageData}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-md"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800 bg-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-700">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-600">PNG, JPG or JPEG (MAX. 800x400px)</p>
                </>
              )}
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                id="featured-image"
              />
              <label
                htmlFor="featured-image"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Select Image
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Gallery Images
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
            <div className="flex flex-col items-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-700">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-600">Multiple images allowed</p>
              <input
                type="file"
                onChange={handleGalleryImagesChange}
                accept="image/*"
                multiple
                className="hidden"
                id="gallery-images"
              />
              <label
                htmlFor="gallery-images"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Select Images
              </label>
            </div>
            {galleryImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-1 right-1 text-red-600 hover:text-red-800 bg-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 text-white rounded-md font-medium transition-colors ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {loading ? 'Publishing...' : 'Publish Blog Post'}
        </button>
      </form>
    </div>
  );
};

export default BlogUpload;
