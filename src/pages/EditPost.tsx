import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';
import { PhotoIcon } from '@heroicons/react/24/outline';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const navigate = useNavigate();
  const { token, username } = useContext(AuthContext);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        const post = res.data.post;
        
        if (post.author.username !== username) {
          toast.error('You are not authorized to edit this story');
          navigate('/dashboard');
          return;
        }

        setTitle(post.title);
        setContent(post.content);
        setTags(post.tags.join(', '));
      } catch (error) {
        toast.error('Failed to load story');
        navigate('/dashboard');
      } finally {
        setFetching(false);
      }
    };
    fetchPost();
  }, [id, token, navigate, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      await api.put(`/posts/${id}`, { title, content, tags: tagArray });
      toast.success('Story updated successfully!');
      navigate(`/post/${id}`);
    } catch (error) {
      toast.error('Failed to update story');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.url) {
        setContent(prev => prev + `\n![Image](${response.data.url})\n`);
        toast.success('Image uploaded!', { id: toastId });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  if (fetching) return <div className="text-center py-20 text-gray-500 font-medium">Loading editor...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 tracking-tight">Edit story</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <input
            type="text"
            required
            placeholder="Title"
            className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 focus:outline-none bg-transparent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 py-2">
          <label className={`flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <PhotoIcon className="w-5 h-5 text-gray-500" />
            {uploadingImage ? 'Uploading...' : 'Add Image'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        </div>

        <div data-color-mode="light" className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height={500}
            preview="edit"
            className="w-full !border-0 font-sans"
            textareaProps={{
              placeholder: 'Tell your story in Markdown...'
            }}
          />
        </div>
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-500 mb-2">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. technology, life, code"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className="flex justify-end pt-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 text-gray-600 font-medium rounded-full hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 bg-black text-white rounded-full font-medium text-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
