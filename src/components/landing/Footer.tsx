import React from 'react';
import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';

const footerColumns = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact Us', href: '#lead' },
      { label: 'FAQs', href: '#faq' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Managed Plan', href: '#managed' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Creator Discovery', href: '#features' },
      { label: 'Campaign Dashboard', href: '#features' },
      { label: 'Creator Inbox', href: '#features' },
      { label: 'Performance Reports', href: '#features' },
      { label: 'AI Brief Creator', href: '#features' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Shipping & Delivery', href: '/shipping-delivery' },
      { label: 'Returns Policy', href: '/returns-policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0c0c12] px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 py-16 lg:grid-cols-[1.15fr_1.85fr] lg:py-20">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img
                  src="/logo.png"
                  alt="CollabGlam Logo"
                  className="h-full w-full object-contain"
                />
              </span>

              <span className="text-2xl font-extrabold tracking-[-0.04em] text-white">
                CollabGlam
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
              Connect, create, and drive revenue with CollabGlam&apos;s
              intelligent influencer partnership hub. Built for brands that take
              growth seriously.
            </p>

            <div className="mt-7 space-y-3">
              <a
                href="mailto:help@collabglam.com"
                className="flex items-center gap-3 text-sm font-medium text-white/55 transition hover:text-[#f97316]"
              >
                <Mail className="h-4 w-4" />
                help@collabglam.com
              </a>

              <a
                href="tel:+19042194648"
                className="flex items-center gap-3 text-sm font-medium text-white/55 transition hover:text-[#f97316]"
              >
                <Phone className="h-4 w-4" />
                +1 (904) 219-4648
              </a>

              <div className="flex items-center gap-3 text-sm font-medium text-white/55">
                <MapPin className="h-4 w-4" />
                Las Vegas, Nevada, USA
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-10 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">
                  {column.title}
                </h3>

                <div className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-sm font-medium text-white/48 transition hover:text-[#f97316]"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col gap-6 border-t border-white/[0.08] py-7 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm leading-6 text-white/38">
            © 2025 CollabGlam. All rights reserved. — Where Brands Meet the
            Right Creators.
          </p>

          <a
            href="https://www.instagram.com/collabglamllc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:border-[#f97316]/30 hover:bg-[#f97316]/10 hover:text-[#f97316]"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}