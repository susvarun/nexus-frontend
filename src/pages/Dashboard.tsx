import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import removeMarkdown from 'remove-markdown';
import { HeartIcon } from '@heroicons/react/24/solid';

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  likes?: string[];
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [updatingBio, setUpdatingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, username } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [postsRes, userRes, bookmarksRes] = await Promise.all([
          api.get('/posts/user/me'),
          api.get(`/users/${username}`),
          api.get('/users/bookmarks')
        ]);
        setPosts(postsRes.data);
        setBio(userRes.data.bio || '');
        setAvatar(userRes.data.avatar || '');
        setSavedPosts(bookmarksRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      fetchDashboardData();
    }
  }, [token, navigate, username]);

  const handleUpdateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBio(true);
    try {
      await api.put('/users/profile', { bio });
      toast.success('Bio updated!');
    } catch (error) {
      toast.error('Failed to update bio');
    } finally {
      setUpdatingBio(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile picture...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.url) {
        const imageUrl = response.data.url;
        await api.put('/users/profile', { avatar: imageUrl });
        setAvatar(imageUrl);
        toast.success('Profile picture updated!', { id: toastId });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update profile picture', { id: toastId });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this story? This cannot be undone.')) return;
    
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success('Story deleted');
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-500 font-medium">Loading your stories...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-10 mb-12 items-start">
        <div className="flex-shrink-0">
          <label className="relative block w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group">
            {avatar ? (
              <img src={avatar} alt={username || 'Profile'} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-gray-400 text-5xl md:text-6xl font-semibold">
                {username?.charAt(0).toUpperCase()}
              </span>
            )}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition ${uploadingAvatar ? 'opacity-100' : ''}`}>
              <span className="text-white text-xs font-semibold">{uploadingAvatar ? 'Uploading...' : 'Change'}</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarUpload}
              disabled={uploadingAvatar}
            />
          </label>
        </div>
        
        <div className="flex-grow w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 pb-6 border-b border-gray-200 gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{username}</h1>
              <p className="text-gray-500 mt-2 text-lg">You have published {posts.length} stories.</p>
            </div>
            <Link to="/create" className="px-6 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition whitespace-nowrap">
              Write a story
            </Link>
          </div>
          
          <form onSubmit={handleUpdateBio} className="flex flex-col gap-4 w-full">
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition resize-none"
              rows={3}
              placeholder="Write a short bio to introduce yourself on your profile..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={updatingBio}
                className="px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition disabled:opacity-50"
              >
                {updatingBio ? 'Saving...' : 'Save Bio'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">You haven't written any stories yet</h2>
          <p className="text-gray-500 text-lg mb-8">Your voice matters. Share your thoughts with the community.</p>
          <Link to="/create" className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition">
            Start writing
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div key={post._id} className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col hover:border-gray-300 transition">
              <Link to={`/post/${post._id}`} className="flex-grow group">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:underline decoration-gray-300 underline-offset-4 leading-tight tracking-tight">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-xs font-medium mb-3">{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-gray-600 text-sm line-clamp-3 font-serif mb-6">
                  {removeMarkdown(post.content)}
                </p>
              </Link>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                <span className="text-xs text-gray-400 font-medium">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                <div className="flex gap-4">
                  <Link 
                    to={`/edit/${post._id}`}
                    className="text-sm font-medium text-gray-500 hover:text-black transition"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(post._id)}
                    className="text-sm font-medium text-red-600 hover:text-red-800 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saved Stories */}
      <div className="mt-16 pt-12 border-t border-gray-200">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Reading List</h2>
        {savedPosts.length === 0 ? (
          <p className="text-gray-500 italic font-serif">You haven't saved any stories yet.</p>
        ) : (
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {savedPosts.map((post) => (
              <Link to={`/post/${post._id}`} key={post._id} className="group block">
                <article className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:underline decoration-gray-300 underline-offset-4 leading-tight tracking-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-base line-clamp-3 leading-relaxed mb-6 flex-grow font-serif">
                    {removeMarkdown(post.content)}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {Math.max(1, Math.ceil(removeMarkdown(post.content).length / 1000))} min read</span>
                      {post.likes && post.likes.length > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <HeartIcon className="w-3.5 h-3.5 text-gray-400" />
                          {post.likes.length}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
