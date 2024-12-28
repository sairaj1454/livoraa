import React, { useState, useEffect } from 'react';
import { db, storage } from '../config/firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  imageData: string;
  galleryImages?: string[];
  createdAt: any;
}

interface EditModalProps {
  post: BlogPost;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: BlogPost, newImages: File[], newGalleryImages: File[]) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ post, isOpen, onClose, onSave }) => {
  const [editedPost, setEditedPost] = useState<BlogPost>(post);
  const [newMainImage, setNewMainImage] = useState<File | null>(null);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMainImage(e.target.files[0]);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewGalleryImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(editedPost, newMainImage ? [newMainImage] : [], newGalleryImages);
      onClose();
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Blog Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={editedPost.title}
                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={editedPost.content}
                onChange={(e) => setEditedPost({ ...editedPost, content: e.target.value })}
                rows={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                value={editedPost.category}
                onChange={(e) => setEditedPost({ ...editedPost, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Main Image</label>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="mt-1 block w-full"
              />
              {editedPost.imageData && !newMainImage && (
                <img src={editedPost.imageData} alt="Current" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
              <input
                type="file"
                onChange={handleGalleryImagesChange}
                accept="image/*"
                multiple
                className="mt-1 block w-full"
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {editedPost.galleryImages?.map((img, index) => (
                  <img key={index} src={img} alt={`Gallery ${index + 1}`} className="h-24 w-full object-cover rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BlogManager: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const blogRef = collection(db, 'blogs');
      const q = query(blogRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const posts: BlogPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          authorName: data.authorName,
          imageData: data.imageData,
          galleryImages: data.galleryImages || [],
          createdAt: data.createdAt?.toDate(),
        });
      });

      setBlogPosts(posts);
    } catch (err) {
      console.error('Error fetching blog posts:', err);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      try {
        await deleteDoc(doc(db, 'blogs', postId));
        setBlogPosts(blogPosts.filter(post => post.id !== postId));
        toast.success('Blog post deleted successfully');
      } catch (err) {
        console.error('Error deleting blog post:', err);
        toast.error('Failed to delete blog post');
      }
    }
  };

  const uploadImage = async (file: File, path: string) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async (updatedPost: BlogPost, newImages: File[], newGalleryImages: File[]) => {
    try {
      const postRef = doc(db, 'blogs', updatedPost.id);
      const updates: any = {
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
      };

      // Upload new main image if provided
      if (newImages.length > 0) {
        const mainImageUrl = await uploadImage(
          newImages[0],
          `blogs/${updatedPost.id}/main-${Date.now()}`
        );
        updates.imageData = mainImageUrl;
      }

      // Upload new gallery images if provided
      if (newGalleryImages.length > 0) {
        const galleryUrls = await Promise.all(
          newGalleryImages.map((file, index) =>
            uploadImage(file, `blogs/${updatedPost.id}/gallery-${Date.now()}-${index}`)
          )
        );
        updates.galleryImages = [...(updatedPost.galleryImages || []), ...galleryUrls];
      }

      await updateDoc(postRef, updates);
      
      // Update local state
      setBlogPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === updatedPost.id
            ? { ...post, ...updates }
            : post
        )
      );

      toast.success('Blog post updated successfully');
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Blog Posts</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <div key={post.id} className="bg-gray-50 rounded-lg shadow-sm p-4 relative hover:shadow-md transition-shadow">
              {post.imageData && (
                <img
                  src={post.imageData}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{post.title}</h3>
              <p className="text-sm text-gray-700 mb-2">
                Category: <span className="font-medium text-gray-800">{post.category}</span>
              </p>
              <p className="text-sm text-gray-700 mb-2">
                Author: <span className="font-medium text-gray-800">{post.authorName}</span>
              </p>
              <p className="text-sm text-gray-700 mb-4">
                {post.createdAt?.toLocaleDateString()}
              </p>
              
              {post.galleryImages && post.galleryImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Gallery Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {post.galleryImages.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingPost(post)}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="inline-flex items-center text-red-600 hover:text-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPost && (
        <EditModal
          post={editingPost}
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSave={handleSave}
        />
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default BlogManager;
