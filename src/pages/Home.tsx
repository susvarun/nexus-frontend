import { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import removeMarkdown from 'remove-markdown';
import { HeartIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Post {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; username: string; email: string; avatar?: string };
  tags: string[];
  likes?: string[];
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const { token } = useContext(AuthContext);
  
  const searchQuery = searchParams.get('search');
  const tagQuery = searchParams.get('tag');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let url = '/posts';
        if (searchQuery) url += `?search=${encodeURIComponent(searchQuery)}`;
        else if (tagQuery) url += `?tag=${encodeURIComponent(tagQuery)}`;
        
        const [postsRes, bookmarksRes] = await Promise.all([
          api.get(url),
          token ? api.get('/users/bookmarks/ids') : Promise.resolve({ data: [] })
        ]);
        
        setPosts(postsRes.data);
        setBookmarks(bookmarksRes.data);
      } catch (error) {
        console.error('Failed to fetch stories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [searchQuery, tagQuery, token]);

  const handleBookmark = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toast.error('Please log in to save stories');
      return;
    }

    const isBookmarked = bookmarks.includes(postId);
    if (isBookmarked) {
      setBookmarks(bookmarks.filter(id => id !== postId));
    } else {
      setBookmarks([...bookmarks, postId]);
    }

    try {
      await api.put(`/users/bookmarks/${postId}`);
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {searchQuery || tagQuery ? (
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200 pb-8 px-4 gap-6 pt-12">
          <div>
            {searchQuery ? (
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Results for "{searchQuery}"</h1>
            ) : (
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Stories tagged with #{tagQuery}</h1>
            )}
            <p className="text-gray-500 mt-2 text-lg">A place to read, write, and deepen your understanding.</p>
          </div>
        </div>
      ) : (
        <div className="py-24 md:py-32 px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-6 tracking-tighter">
            Human stories & ideas
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            A place to read, write, and deepen your understanding.
          </p>
          <Link to="/create" className="px-8 py-3.5 bg-black text-white rounded-full text-lg font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl inline-block">
            Start writing
          </Link>
        </div>
      )}

      <div className="px-4">
        <div className="pt-8">
          {loading ? (
            <div className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="animate-pulse">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-6 h-6 rounded-full bg-gray-200"></div>
                     <div className="h-3 bg-gray-200 rounded w-24"></div>
                   </div>
                   <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                   <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                   <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                 </div>
               ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">No stories yet</h3>
              <p className="text-gray-500 text-lg">Be the first to share your perspective.</p>
            </div>
          ) : (
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article key={post._id} className="flex flex-col h-full group">
                  <div className="flex items-center gap-2 mb-4">
                    <Link to={`/user/${post.author?.username}`} className="flex items-center gap-2 hover:opacity-80 transition">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs text-gray-700 font-medium border border-gray-200">
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                          post.author?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{post.author?.username}</span>
                    </Link>
                  </div>
                  
                  <Link to={`/post/${post._id}`} className="block flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:underline decoration-gray-300 underline-offset-4 leading-tight tracking-tight">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-base line-clamp-3 leading-relaxed mb-6 font-serif">
                      {removeMarkdown(post.content)}
                    </p>
                  </Link>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4">
                    <div className="flex items-center gap-3">
                      <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {Math.max(1, Math.ceil(removeMarkdown(post.content).length / 1000))} min read</span>
                      {post.likes && post.likes.length > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <HeartIcon className="w-3.5 h-3.5 text-gray-400" />
                          {post.likes.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 relative z-10">
                        {post.tags.slice(0, 2).map(tag => (
                          <Link to={`/?tag=${encodeURIComponent(tag)}`} key={tag} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 transition rounded-md text-gray-700 font-medium">
                            {tag}
                          </Link>
                        ))}
                      </div>
                      <button
                        onClick={(e) => handleBookmark(e, post._id)}
                        className="text-gray-400 hover:text-black transition z-10 relative"
                        title={bookmarks.includes(post._id) ? "Remove from Reading List" : "Add to Reading List"}
                      >
                        {bookmarks.includes(post._id) ? (
                          <BookmarkIconSolid className="w-5 h-5 text-black" />
                        ) : (
                          <BookmarkIconOutline className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
