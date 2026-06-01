'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Header: React.FC = () => {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);

    handleScroll();
    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Testimonials', href: '/#testimonials' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'About', href: '/about-us' },
    { label: 'Contact', href: '/contact-us' },
  ];

  const navigate = (path: string) => {
    setIsMobileMenuOpen(false);
    router.push(path);
  };

  const textColor = isScrolled ? 'text-gray-800' : 'text-white';
  const linkColor = isScrolled ? 'text-gray-700' : 'text-white/90';
  const mobileIconColor = isScrolled ? 'text-gray-800' : 'text-white';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 font-lexend transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 shadow-lg backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center space-x-2">
            <img
              src="/logo.png"
              alt="Collabglam Logo"
              width={50}
              height={50}
              className="rounded-lg"
            />

            <span
              className={`ml-3 text-2xl font-bold transition-colors duration-300 ${textColor}`}
            >
              CollabGlam
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="ml-auto hidden items-center space-x-8 lg:flex">
            <nav className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`font-medium transition-all duration-200 hover:bg-gradient-to-r hover:from-[#FFA135] hover:to-[#FF7236] hover:bg-clip-text hover:text-transparent ${linkColor}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <button
              onClick={() => navigate('/brand/login')}
              className="cursor-pointer rounded-lg bg-gradient-to-r from-[#FFA135] to-[#FF7236] px-6 py-2 font-medium text-white transition-all hover:scale-105 hover:from-[#FFA236] hover:to-[#FF7456] hover:shadow-lg"
            >
              <strong>Get Started</strong>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className={`ml-auto p-2 transition-colors duration-300 lg:hidden ${mobileIconColor}`}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t bg-white shadow-lg lg:hidden">
          <div className="space-y-4 px-4 py-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2 font-medium text-gray-800 transition-colors hover:bg-gradient-to-r hover:from-[#FFA135] hover:to-[#FF7236] hover:bg-clip-text hover:text-transparent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="space-y-3 pt-4">
              <button
                onClick={() => navigate('/brand/login')}
                className="w-full rounded-lg bg-gradient-to-r from-[#FFA135] to-[#FF7236] py-3 font-medium text-white transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;