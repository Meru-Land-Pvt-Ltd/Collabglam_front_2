"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import Swal from "sweetalert2";

const footerSections = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "FAQs", href: "/#faq" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Managed Plan", href: "/#managed" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Creator Discovery", href: "/#features" },
      { label: "Campaign Dashboard", href: "/#features" },
      { label: "Creator Inbox", href: "/#features" },
      { label: "Performance Reports", href: "/#features" },
      { label: "AI Brief Creator", href: "/#features" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Shipping & Delivery", href: "/service-delivery" },
      { label: "Returns Policy", href: "/returns" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function FooterWithNewsletter() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNav = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    const isLegalLink =
      href.includes("privacy") ||
      href.includes("terms") ||
      href.includes("cookie") ||
      href.includes("service-delivery") ||
      href.includes("returns");

    if (!isLegalLink) {
      e.preventDefault();
      router.push(href);
    }
  };

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });
      return;
    }

    setLoading(true);

    try {
      await post<{ message: string }>("/contact/newsletter/create", { email });

      await Swal.fire({
        icon: "success",
        title: "Subscribed!",
        text: "You’ve been added to our newsletter.",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      setEmail("");
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "Subscription Failed",
        text:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Something went wrong. Please try again later.",
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[#131320] text-white font-lexend">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CollabGlam Logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-contain ring-1 ring-white/10"
              />
              <span className="text-2xl font-extrabold tracking-[-0.04em]">
                CollabGlam
              </span>
            </Link>

            <p className="mt-5 max-w-md text-base leading-8 text-white/58">
              Connect, create, and drive revenue with CollabGlam’s intelligent
              influencer partnership hub. Built for brands that take growth
              seriously.
            </p>

            <div className="mt-7 grid gap-3 text-sm text-white/62">
              <a href="mailto:care@collabglam.com" className="flex items-center gap-3 transition hover:text-[#f97316]">
                <Mail className="h-4 w-4" />
                care@collabglam.com
              </a>
              <a href="tel:+19042194648" className="flex items-center gap-3 transition hover:text-[#f97316]">
                <Phone className="h-4 w-4" />
                +1 (904) 219-4648
              </a>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                Florida, USA
              </div>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="mt-8 max-w-xl rounded-[24px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.25)] sm:flex"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Get growth ideas in your inbox"
                className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0c0c12] px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#f97316]/60"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-3 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#f97316] px-5 text-sm font-extrabold text-white transition hover:bg-[#ea580c] disabled:cursor-not-allowed disabled:opacity-70 sm:ml-3 sm:mt-0 sm:w-auto"
              >
                {loading ? "Subscribing..." : "Subscribe"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/30">
                  {section.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {section.links.map((link) => {
                    const isLegalLink = section.title === "Legal";

                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          onClick={(event) => handleNav(link.href, event)}
                          target={isLegalLink ? "_blank" : undefined}
                          rel={isLegalLink ? "noopener noreferrer" : undefined}
                          className="text-sm font-medium text-white/58 transition hover:text-[#f97316]"
                        >
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/35">
            © 2026 CollabGlam. All rights reserved. — Where Brands Meet the Right Creators.
          </p>

          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/58 transition hover:border-[#f97316]/50 hover:text-[#f97316]"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
