import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';
import { HeartIcon as HeartIconOutline, BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';

interface Comment {
  _id: string;
  text: string;
  author: { _id: string; username: string; avatar?: string };
  createdAt: string;
  parentComment?: string | null;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; username: string; email: string; avatar?: string };
  tags: string[];
  likes?: string[];
  createdAt: string;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const { token, userId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`);
        setPost(res.data.post);
        setComments(res.data.comments);
        setLikes(res.data.post.likes || []);
        
        if (token) {
          const bookmarksRes = await api.get('/users/bookmarks/ids');
          setIsBookmarked(bookmarksRes.data.includes(id));
        }
      } catch (error) {
        toast.error('Story not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { text: commentText });
      setComments([res.data, ...comments]);
      setCommentText('');
      toast.success('Comment published');
    } catch (error) {
      toast.error('Failed to publish comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    try {
      const res = await api.put(`/posts/${id}/comments/${commentId}`, { text: editCommentText });
      setComments(res.data);
      setEditingCommentId(null);
      setEditCommentText('');
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/posts/${id}/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId && c.parentComment !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { text: replyText, parentComment: parentId });
      setComments([...comments, res.data]);
      setReplyText('');
      setReplyingToId(null);
      toast.success('Reply published');
    } catch (error) {
      toast.error('Failed to publish reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    if (!token) {
      toast.error('Please log in to like this story');
      return;
    }
    
    const isLiked = userId ? likes.includes(userId) : false;
    if (isLiked && userId) {
      setLikes(likes.filter(x => x !== userId));
    } else if (userId) {
      setLikes([...likes, userId]);
    }
    
    try {
      const res = await api.put(`/posts/${id}/like`);
      setLikes(res.data);
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  const handleBookmark = async () => {
    if (!token) {
      toast.error('Please log in to save this story');
      return;
    }
    setIsBookmarked(!isBookmarked);
    try {
      await api.put(`/users/bookmarks/${id}`);
    } catch (error) {
      toast.error('Failed to update bookmark');
      setIsBookmarked(!isBookmarked);
    }
  };

  const hasLiked = userId ? likes.includes(userId) : false;

  if (loading) return <div className="text-center py-32 text-gray-400 font-medium">Loading story...</div>;
  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 bg-white min-h-screen">
      <article className="mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-[1.15] tracking-tight">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-100">
          <Link to={`/user/${post.author?.username}`} className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-medium text-lg shrink-0 hover:opacity-80 transition">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
            ) : (
              post.author?.username?.charAt(0).toUpperCase()
            )}
          </Link>
          <div>
            <Link to={`/user/${post.author?.username}`} className="font-semibold text-gray-900 hover:underline">
              {post.author?.username}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {Math.max(1, Math.ceil(post.content.length / 1000))} min read · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div data-color-mode="light" className="prose prose-lg max-w-none text-gray-800 font-serif leading-[1.8] text-[1.1rem]">
          <MDEditor.Markdown 
            source={post.content} 
            className="!bg-transparent !text-gray-800 !font-serif !text-[1.1rem] !leading-[1.8]"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-gray-100">
          {post.tags.map(tag => (
            <Link to={`/?tag=${encodeURIComponent(tag)}`} key={tag} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition rounded-full text-sm text-gray-700 font-medium">
              {tag}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-6 mt-8 pt-8 border-t border-gray-100">
          <button 
            onClick={handleLike} 
            className="flex items-center gap-2 group transition"
          >
            {hasLiked ? (
              <HeartIconSolid className="w-8 h-8 text-black" />
            ) : (
              <HeartIconOutline className="w-8 h-8 text-gray-400 group-hover:text-black transition" />
            )}
            <span className={`text-xl font-medium transition ${hasLiked ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>
              {likes.length}
            </span>
          </button>
          
          <button 
            onClick={handleBookmark} 
            className="flex items-center gap-2 group transition ml-auto"
            title={isBookmarked ? "Remove from Reading List" : "Add to Reading List"}
          >
            {isBookmarked ? (
              <BookmarkIconSolid className="w-8 h-8 text-black" />
            ) : (
              <BookmarkIconOutline className="w-8 h-8 text-gray-400 group-hover:text-black transition" />
            )}
          </button>
        </div>
      </article>

      {/* Responses Section */}
      <section className="bg-gray-50 -mx-4 px-4 py-12 border-t border-gray-100 sm:rounded-3xl sm:mx-0 sm:px-10">
        <div className="flex items-center gap-2 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Responses ({comments.length})</h3>
        </div>
        
        {token ? (
          <form onSubmit={handleCommentSubmit} className="mb-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
            <textarea
              required
              rows={3}
              placeholder="What are your thoughts?"
              className="w-full px-2 py-2 focus:outline-none resize-none bg-transparent text-gray-800 placeholder-gray-400"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting || !commentText.trim()}
                className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition disabled:opacity-30"
              >
                {submitting ? 'Responding...' : 'Respond'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl text-center mb-10 border border-gray-200 shadow-sm">
            <h4 className="text-gray-900 font-semibold mb-2 text-lg">What do you think?</h4>
            <p className="text-gray-500 text-sm mb-5">Please log in to share your thoughts on this story.</p>
            <Link to="/login" className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition inline-block">
              Log in to respond
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {comments.filter(c => !c.parentComment).map((comment) => {
            const replies = comments.filter(c => c.parentComment === comment._id);
            
            const renderCommentNode = (c: Comment, isReply: boolean) => (
              <div key={c._id} className={`${isReply ? 'ml-8 mt-6 border-l-2 border-gray-100 pl-4' : 'pb-8 border-b border-gray-200 last:border-0 last:pb-0'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold">
                      {c.author?.avatar ? (
                        <img src={c.author.avatar} alt={c.author.username} className="w-full h-full object-cover" />
                      ) : (
                        c.author?.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 block text-sm">{c.author?.username}</span>
                      <span className="text-gray-500 text-sm">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {token && (
                    <div className="flex gap-2 ml-4">
                      {!isReply && (
                        <button
                          onClick={() => setReplyingToId(replyingToId === c._id ? null : c._id)}
                          className="text-xs text-gray-500 hover:text-black transition font-medium"
                        >
                          Reply
                        </button>
                      )}
                      {userId === c.author._id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCommentId(c._id);
                              setEditCommentText(c.text);
                            }}
                            className="text-xs text-gray-500 hover:text-black transition font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="text-xs text-red-400 hover:text-red-600 transition font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === c._id ? (
                  <div className="mt-4">
                    <textarea
                      className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-base min-h-[100px] font-serif"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditComment(c._id)}
                        className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditCommentText('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-800 text-base leading-relaxed mt-4 font-serif whitespace-pre-wrap">{c.text}</p>
                )}

                {/* Reply Form */}
                {replyingToId === c._id && (
                  <form onSubmit={(e) => handleReplySubmit(e, c._id)} className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 focus-within:ring-1 focus-within:ring-black focus-within:border-black transition-all">
                    <textarea
                      required
                      rows={2}
                      placeholder={`Reply to ${c.author?.username}...`}
                      className="w-full px-2 py-2 focus:outline-none resize-none bg-transparent text-gray-800 placeholder-gray-400 text-sm"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        disabled={submitting || !replyText.trim()}
                        className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition disabled:opacity-30"
                      >
                        {submitting ? 'Replying...' : 'Reply'}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Render Replies */}
                {!isReply && replies.length > 0 && (
                  <div className="mt-2">
                    {replies.map(r => renderCommentNode(r, true))}
                  </div>
                )}
              </div>
            );

            return renderCommentNode(comment, false);
          })}
        </div>
      </section>
    </div>
  );
}
