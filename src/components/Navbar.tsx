import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PencilSquareIcon, UserCircleIcon, ArrowRightOnRectangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const { token, username, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-2xl font-black tracking-tighter text-gray-900 hover:text-gray-700 transition">
            Nexus.
          </Link>
          <div className="flex gap-6 items-center">
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-300 rounded-full text-sm focus:outline-none transition-all w-48 focus:w-64 text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {token ? (
              <>
                <Link to="/create" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
                  <PencilSquareIcon className="w-5 h-5" />
                  <span className="hidden sm:block">Write</span>
                </Link>
                <Link to="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
                  <UserCircleIcon className="w-5 h-5" />
                  <span className="hidden sm:block">{username}</span>
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-600 transition">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="hidden sm:block">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Sign in</Link>
                <Link to="/signup" className="text-sm font-medium px-5 py-2 bg-black text-white rounded-full hover:bg-gray-800 shadow-sm transition">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
