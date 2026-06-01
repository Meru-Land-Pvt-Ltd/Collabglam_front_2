'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';

type NavLink = {
  label: string;
  href: string;
};

const navLinks: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Managed Plan', href: '#managed' },
  { label: 'Case Studies', href: '#case-studies' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-[999] border-b border-white/[0.07] bg-[#0c0c12]/[0.92] font-lexend backdrop-blur-2xl transition-all duration-300">
      <div className="mx-auto flex h-[76px] max-w-full items-center justify-between px-8 sm:px-12 lg:px-16">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-3"
          aria-label="Go to CollabGlam home"
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] shadow-[0_4px_14px_rgba(249,115,22,0.25)]">
            <img
              src="/logo.png"
              alt="CollabGlam Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          </span>

          <span className="text-xl font-black tracking-[-0.03em] text-[#EEEDEB]">
            CollabGlam
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#8887A2] transition-colors duration-200 hover:text-[#EEEDEB]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
<a
  href="/brand/signup"
  className="group hidden items-center justify-center rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#C2410C] hover:shadow-[0_10px_32px_rgba(249,115,22,0.45)] lg:inline-flex"
>
  Get Started Free
  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
</a>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls={mobileMenuId}
          onClick={toggleMobileMenu}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white transition hover:bg-white/[0.08] lg:hidden"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        id={mobileMenuId}
        className={`border-t border-white/[0.07] bg-[#0c0c12]/95 px-4 py-5 backdrop-blur-2xl transition lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'
          }`}
      >
        <nav className="mx-auto max-w-7xl space-y-2" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={closeMobileMenu}
              className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#EEEDEB]/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <a
            href="/brand/signup"
            onClick={closeMobileMenu}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#F97316] px-6 py-3 text-sm font-bold text-white shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition hover:bg-[#C2410C]"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}