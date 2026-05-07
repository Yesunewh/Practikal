import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../store/apiSlice/practikalApi';
import { getImageUrl } from '../../utils/imageUtils';
import type { Category } from '../../types';

export default function CategoryManagement() {
  const { data: categoriesData, isLoading: loading } = useGetCategoriesQuery(undefined);
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    image_url: '',
    description: '',
  });

  const categories = categoriesData?.categories || [];

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter(
      (c: Category) =>
        c.name.toLowerCase().includes(q) ||
        c.display_name.toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q)
    );
  }, [categories, search]);

  const handleOpenModal = (cat: Category | null = null) => {
    setSelectedFile(null);
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        display_name: cat.display_name,
        image_url: cat.image_url || '',
        description: cat.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        display_name: '',
        image_url: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('display_name', formData.display_name);
      data.append('description', formData.description);
      if (selectedFile) {
        data.append('image', selectedFile);
      } else {
        data.append('image_url', formData.image_url);
      }

      if (editingCategory) {
        // For multipart/form-data, we need to pass the ID separately or inside FormData
        // But RTK Query mutation usually takes one arg.
        // I'll update the mutation in practikalApi.ts if needed, but let's see.
        await updateCategory({ id: editingCategory.id, data } as any).unwrap();
        toast.success('Category updated');
      } else {
        await createCategory(data as any).unwrap();
        toast.success('Category created');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Category Management</h1>
          <p className="text-neutral-500 text-sm">Manage dynamic challenge categories and their visuals.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 shadow-sm"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100">
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat: Category) => (
                  <tr key={cat.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-neutral-900">{cat.display_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      {cat.image_url ? (
                        <div className="h-12 w-20 rounded-lg overflow-hidden border border-neutral-100 shadow-sm">
                          <img
                            src={getImageUrl(cat.image_url)}
                            alt={cat.display_name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-20 flex items-center justify-center bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-600 max-w-xs truncate">
                        {cat.description || <span className="text-neutral-300 italic">No description</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="p-2 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm px-4 py-8 custom-scrollbar">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 px-8 py-5">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 tracking-tight">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Modal Body */}
                <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.display_name || formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        name: val.toLowerCase().replace(/\s+/g, '-'),
                        display_name: val 
                      });
                    }}
                    placeholder="e.g. Phishing Awareness"
                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-base font-black text-neutral-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                  />
                </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category Image</label>
                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-4">
                      <div className="flex items-center gap-5">
                        {selectedFile ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Card Preview</label>
                            <div className="w-full max-w-[280px]">
                              <div className="aspect-video w-full rounded-3xl bg-neutral-100 overflow-hidden border border-neutral-200 shadow-sm relative group">
                                <img
                                  src={URL.createObjectURL(selectedFile)}
                                  alt="Preview"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedFile(null)}
                                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                                >
                                  <X size={14} />
                                </button>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                                  <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">Live Preview</span>
                                </div>
                              </div>
                              <div className="mt-3 px-1">
                                <h4 className="text-sm font-black text-neutral-900 line-clamp-1">{formData.display_name || 'Category Title'}</h4>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400 font-bold">
                                  <span className="flex items-center gap-1">~10m</span>
                                  <span className="flex items-center gap-1">★ 4.8</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : formData.image_url ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Card Preview</label>
                            <div className="w-full max-w-[280px]">
                              <div className="aspect-video w-full rounded-3xl bg-neutral-100 overflow-hidden border border-neutral-200 shadow-sm relative group">
                                <img
                                  src={getImageUrl(formData.image_url)}
                                  alt="Preview"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                                  <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">Live Preview</span>
                                </div>
                              </div>
                              <div className="mt-3 px-1">
                                <h4 className="text-sm font-black text-neutral-900 line-clamp-1">{formData.display_name || 'Category Title'}</h4>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400 font-bold">
                                  <span className="flex items-center gap-1">~10m</span>
                                  <span className="flex items-center gap-1">★ 4.8</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-40 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-neutral-200 text-neutral-300">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        
                        <label className="cursor-pointer group">
                          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-4 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-600 transition-all">
                            <Plus size={24} className="mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </div>
                        </label>
                      </div>
                      
                      {!selectedFile && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-neutral-200" />
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">or</span>
                            <div className="h-px flex-1 bg-neutral-200" />
                          </div>
                          <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="External Image URL..."
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide a brief overview of this topic..."
                      className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-neutral-100 bg-neutral-50/50 px-8 py-5 flex items-center justify-end gap-4 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-black text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-neutral-900 px-8 py-3 text-sm font-black text-white shadow-xl shadow-neutral-900/20 hover:bg-emerald-600 hover:shadow-emerald-600/20 active:scale-[0.98] transition-all"
                  >
                    {editingCategory ? 'Update Topic' : 'Create Topic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
