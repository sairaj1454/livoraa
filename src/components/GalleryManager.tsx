import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrashIcon,
  PencilSquareIcon,
  XMarkIcon,
  PlusIcon,
  ChevronDownIcon,
  BriefcaseIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  category: string;
  style: string;
  imageData: string;
  images: string[];
}

const categories = ['All', 'Bedrooms', 'Living Rooms', 'Kitchen', 'Washroom', 'Custom Made', 'Dining Rooms'];

const GalleryManager: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, items]);

  const fetchGalleryItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'gallery'));
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        images: doc.data().images || [doc.data().imageData]
      })) as GalleryItem[];
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this collection permanently?')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
        setItems(items.filter(item => item.id !== id));
        toast.success('Collection deleted');
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const handleUpdate = async () => {
    if (!editItem) return;
    try {
      const docRef = doc(db, 'gallery', editItem.id);
      await updateDoc(docRef, {
        title: editItem.title,
        description: editItem.description,
        dimensions: editItem.dimensions,
        category: editItem.category,
        style: editItem.style,
        images: editItem.images,
        imageData: editItem.images[0] || editItem.imageData // Update thumbnail
      });
      setItems(items.map(img => img.id === editItem.id ? editItem : img));
      setEditItem(null);
      toast.success('Collection updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const addImageToCollection = () => {
    if (newImageUrl && editItem) {
      setEditItem({
        ...editItem,
        images: [...editItem.images, newImageUrl]
      });
      setNewImageUrl('');
    }
  };

  const removeImageFromCollection = (index: number) => {
    if (editItem) {
      setEditItem({
        ...editItem,
        images: editItem.images.filter((_, i) => i !== index)
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <PhotoIcon className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Gallery Management</h2>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-3 whitespace-nowrap">Filter by Category:</span>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-100 transition-all min-w-[160px]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => (
          <motion.div
            layout
            key={item.id}
            className="group bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-500"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.imageData}
                alt={item.title}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {item.images?.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  +{item.images.length - 1} more
                </div>
              )}
            </div>
            <div className="p-8">
              <h3 className="text-xl font-black text-gray-900 mb-2 truncate">{item.title}</h3>
              <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                  {item.category}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editItem && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-4xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <PencilSquareIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight">Edit Collection Details</h3>
                </div>
                <button
                  onClick={() => setEditItem(null)}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <XMarkIcon className="h-7 w-7 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collection Title</label>
                    <input
                      type="text"
                      value={editItem.title}
                      onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <div className="relative">
                      <select
                        value={editItem.category}
                        onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner"
                      >
                        {categories.slice(1).map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Description</label>
                    <textarea
                      value={editItem.description}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      className="w-full p-4 h-32 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dimensions</label>
                      <input
                        type="text"
                        value={editItem.dimensions}
                        onChange={(e) => setEditItem({ ...editItem, dimensions: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Style</label>
                      <input
                        type="text"
                        value={editItem.style}
                        onChange={(e) => setEditItem({ ...editItem, style: e.target.value })}
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manage Images</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        placeholder="Add new image URL..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner shadow-gray-200/50"
                      />
                      <button
                        onClick={addImageToCollection}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {editItem.images?.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden shadow-sm group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImageFromCollection(i)}
                          className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-12 pt-10 border-t border-gray-100">
                <button
                  onClick={() => setEditItem(null)}
                  className="px-10 py-5 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryManager;
