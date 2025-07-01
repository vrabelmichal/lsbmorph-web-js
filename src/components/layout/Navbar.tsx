import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const classifyMenuItems = [
    { href: '/classify', label: 'All galaxies' },
    { href: '/classify?withRedshift=false', label: 'Without redshift' },
    { href: '/classify?withRedshift=true', label: 'With redshift' },
    { href: '/classify?classified=true', label: 'Classified only' },
    { href: '/classify?classified=true&withRedshift=true', label: 'Classified with redshift' },
    { href: '/classify?classified=true&validRedshift=false', label: 'Classified with invalid redshift' },
    { href: '/classify?skipped=true', label: 'Skipped only' },
    { href: '/classify?lsbClass=1', label: 'LSB galaxies only' },
    { href: '/classify?lsbClass=0', label: 'Non-LSB galaxies only' },
    { href: '/classify?lsbClass=-1', label: 'Failed fitting galaxies only' },
  ];

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            LSBMorph
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                <div className="relative group">
                  <button className="hover:text-gray-300 px-3 py-2">
                    Classify ▾
                  </button>
                  <div className="absolute top-full left-0 bg-white text-gray-800 shadow-lg rounded-md min-w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {classifyMenuItems.map((item, index) => (
                      <React.Fragment key={item.href}>
                        <Link href={item.href} className="block px-4 py-2 hover:bg-gray-100">
                          {item.label}
                        </Link>
                        {(index === 2 || index === 5 || index === 6) && (
                          <hr className="border-gray-200" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <Link href="/results" className="hover:text-gray-300">
                  Results
                </Link>
                <Link href="/skipped" className="hover:text-gray-300">
                  Skipped Galaxies
                </Link>
              </>
            )}
            <Link href="/help" className="hover:text-gray-300">
              Help
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <span>Welcome, {user.username}</span>
                <button onClick={logout} className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded">
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            ☰
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {/* Mobile menu items... */}
          </div>
        )}
      </div>
    </nav>
  );
};
