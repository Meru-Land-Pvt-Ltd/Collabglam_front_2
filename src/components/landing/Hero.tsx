'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';

const stats = [
  { value: '500+', label: 'YouTube Campaigns Managed' },
  { value: '2,500+', label: 'Verified Creator Network' },
  { value: '15 min', label: 'Creator Matches Delivered' },
  { value: '3.2×', label: 'Average Campaign ROAS' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function mapProgress(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start), 0, 1);
}

function smoothStep(value: number) {
  return value * value * (3 - 2 * value);
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function StatValue({ value }: { value: string }) {
  const hasPlus = value.includes('+');
  const hasMultiply = value.includes('×');

  return (
    <>
      {value.replace('+', '').replace('×', '')}
      {hasPlus && <span className="text-[#F97316]">+</span>}
      {hasMultiply && <span className="text-[#F97316]">×</span>}
    </>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement | null>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'smooth';

    const measureProgress = () => {
      const section = heroRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;

      if (scrollableDistance <= 0) {
        targetProgressRef.current = 0;
        return;
      }

      targetProgressRef.current = clamp(-rect.top / scrollableDistance, 0, 1);
    };

    const animate = () => {
      smoothProgressRef.current = lerp(
        smoothProgressRef.current,
        targetProgressRef.current,
        0.085
      );

      if (Math.abs(smoothProgressRef.current - targetProgressRef.current) < 0.001) {
        smoothProgressRef.current = targetProgressRef.current;
      }

      setScrollProgress(smoothProgressRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    measureProgress();
    rafRef.current = requestAnimationFrame(animate);

    window.addEventListener('scroll', measureProgress, { passive: true });
    window.addEventListener('resize', measureProgress);

    return () => {
      html.style.scrollBehavior = previousScrollBehavior;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener('scroll', measureProgress);
      window.removeEventListener('resize', measureProgress);
    };
  }, []);

  const copyProgress = smoothStep(mapProgress(scrollProgress, 0.08, 0.46));
  const videoProgress = smoothStep(mapProgress(scrollProgress, 0.2, 0.82));

  const copyOpacity = clamp(1 - copyProgress * 1.15, 0, 1);
  const copyTranslateY = -56 * copyProgress;
  const copyScale = 1 - copyProgress * 0.035;

  const videoOpacity = videoProgress;
  const videoTranslateY = 360 * (1 - videoProgress);
  const videoScale = 0.84 + videoProgress * 0.16;
  const videoBlur = 8 * (1 - videoProgress);

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative h-[235svh] overflow-visible bg-[#0c0c12] text-white"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#0c0c12]">
        {/* Background */}
        <div className="pointer-events-none absolute left-1/2 top-[-200px] h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(249,115,22,0.13)_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-0 left-[-100px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.07)_0%,transparent_60%)]" />

        {/* Hero Text */}
        <div
          className="absolute left-1/2 top-[8.7rem] z-30 w-full max-w-[920px] px-4 text-center sm:px-6 lg:top-[9.5rem] lg:px-8"
          style={{
            opacity: copyOpacity,
            transform: `translate3d(-50%, ${copyTranslateY}px, 0) scale(${copyScale})`,
            filter: `blur(${(1 - copyOpacity) * 5}px)`,
            pointerEvents: copyOpacity < 0.2 ? 'none' : 'auto',
          }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-400 sm:text-sm">
            <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-emerald-400" />
            500+ YouTube Campaigns Managed
          </div>

          <h1 className="text-[clamp(3rem,7vw,5.7rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-white">
            Get Your Product
            <br />
            Reviewed by
            <br />
            <span className="text-[#F97316]">Verified YouTube</span>
            <br />
            <span className="font-serif italic font-normal text-white/70">
              Creators.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[650px] text-base font-light leading-8 text-[#A3A2B8] sm:text-lg">
            Frustrated by expensive agencies and unresponsive influencers? We match
            your brand with the right YouTube creators, negotiate the best rates,
            and manage the entire campaign—so you can focus on sales.
          </p>

          <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#lead"
              className="group inline-flex items-center justify-center rounded-[14px] bg-[#F97316] px-8 py-4 text-base font-bold text-white shadow-[0_6px_24px_rgba(249,115,22,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#C2410C] hover:shadow-[0_10px_32px_rgba(249,115,22,0.45)] sm:px-10"
            >
              Get Matched With Creators — Free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-[14px] border border-white/25 bg-transparent px-8 py-4 text-base font-semibold text-[#FAFAF7] transition-all duration-300 hover:border-white/70 hover:bg-white/[0.06] sm:px-10"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              See How It Works
            </a>
          </div>
        </div>

        {/* Video Reveals Above Stats */}
        <div
          className="absolute left-1/2 bottom-[205px] z-30 w-full max-w-5xl px-4 sm:bottom-[142px] sm:px-6 lg:bottom-[126px] lg:px-0"
          style={{
            opacity: videoOpacity,
            transform: `translate3d(-50%, ${videoTranslateY}px, 0) scale(${videoScale})`,
            filter: `blur(${videoBlur}px)`,
            pointerEvents: videoOpacity > 0.88 ? 'auto' : 'none',
          }}
        >
          <div className="overflow-hidden rounded-t-[26px] border border-white/[0.08] bg-[#131320] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="flex h-12 items-center gap-4 border-b border-white/[0.07] bg-white/[0.04] px-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff6258]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>

              <div className="hidden h-7 flex-1 items-center justify-center rounded-md bg-white/[0.05] text-xs font-medium text-white/35 sm:flex">
                app.collabglam.com/platform-demo
              </div>
            </div>

            <div className="relative bg-black">
              <video
                className="aspect-video w-full object-cover"
                src="/landing/collabglam-demo.mp4"
                poster="/landing/demo-poster.png"
                muted
                playsInline
                autoPlay
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>v

        {/* Stats Base */}
        <div className="absolute inset-x-0 bottom-0 z-40">
          <div className="relative mx-auto w-full max-w-6xl overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 bg-gradient-to-r from-[#0c0c12] to-transparent sm:w-28" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-20 bg-gradient-to-l from-[#0c0c12] to-transparent sm:w-28" />

            <div className="grid grid-cols-2 border-y border-white/[0.07] bg-[#131320]/85 backdrop-blur-sm lg:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="px-6 py-8 text-center">
                  <div className="text-[2.15rem] font-extrabold leading-none tracking-[-0.035em] text-white sm:text-[2.25rem]">
                    <StatValue value={item.value} />
                  </div>

                  <div className="mt-2 text-xs font-normal text-[#8887A2]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}