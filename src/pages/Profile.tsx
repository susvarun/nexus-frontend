import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import removeMarkdown from 'remove-markdown';
import { HeartIcon } from '@heroicons/react/24/solid';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  likes?: string[];
  createdAt: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/posts/author/${username}`)
        ]);
        setProfile(profileRes.data);
        setPosts(postsRes.data);
      } catch (error) {
        console.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  if (loading) return <div className="text-center py-32 text-gray-400 font-medium">Loading profile...</div>;
  if (!profile) return <div className="text-center py-32 text-gray-900 font-bold text-2xl">User not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16 pb-12 border-b border-gray-100">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold text-5xl shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            profile.username.charAt(0).toUpperCase()
          )}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">{profile.username}</h1>
          {profile.bio && (
            <p className="text-xl text-gray-600 font-serif leading-relaxed max-w-2xl mb-4">{profile.bio}</p>
          )}
          <p className="text-sm text-gray-400 font-medium">
            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Author's Posts */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Stories by {profile.username}</h2>
        {posts.length === 0 ? (
          <p className="text-gray-500 italic font-serif">No stories published yet.</p>
        ) : (
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link to={`/post/${post._id}`} key={post._id} className="group block">
                <article className="flex flex-col h-full">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:underline decoration-gray-300 underline-offset-4 leading-tight tracking-tight">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 text-base line-clamp-3 leading-relaxed mb-6 flex-grow font-serif">
                    {removeMarkdown(post.content)}
                  </p>
                  
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
