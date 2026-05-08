"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info } from "@phosphor-icons/react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceDot,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { InfluencerViewModel, compactNumber } from "./utils";
import { apiGetInfluencerMatchScore } from "../../services/brandApi";

const NA = "N/A";

const isEmptyValue = (value: any) => {
    if (value === undefined || value === null) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (value === "-") return true;
    return false;
};

const textOrNA = (value: any) => {
    if (isEmptyValue(value)) return NA;
    return value;
};

const getPlatformIconSrc = (platform: string) => {
    const normalized = String(platform || "").toLowerCase();

    if (normalized.includes("youtube")) return "/logos_youtube-icon.svg";
    if (normalized.includes("instagram")) return "/skill-icons_instagram.svg";
    if (normalized.includes("tiktok") || normalized.includes("tik tok")) {
        return "/ic_baseline-tiktok.svg";
    }

    return "";
};

const formatTimeAgo = (value: any) => {
    if (!value) return NA;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return NA;

    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "1 month ago";
    if (diffMonths < 12) return `${diffMonths} months ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
};

const getNumberFromPercent = (value: any) => {
    if (isEmptyValue(value)) return null;

    const str = String(value).replace("%", "").trim();
    const num = Number(str);

    if (!Number.isFinite(num)) return null;

    return Math.max(0, Math.min(100, num));
};

const getPostEngagement = (post: any, followers: number) => {
    const likes = Number(post?.likes || 0);
    const comments = Number(post?.comments || 0);

    if (!followers) return NA;

    return `${(((likes + comments) / followers) * 100).toFixed(2)}%`;
};

const getMatchLabel = (scoreNumber: number | null, apiLabel?: string) => {
    if (apiLabel && apiLabel !== NA) return apiLabel;
    if (scoreNumber === null) return NA;
    if (scoreNumber >= 80) return "High";
    if (scoreNumber >= 60) return "Good";
    if (scoreNumber >= 40) return "Average";
    return "Low";
};

function PlatformCircle({ platform }: { platform: string }) {
    const safePlatform = textOrNA(platform);
    const iconSrc = getPlatformIconSrc(platform);

    return (
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E6E6E6] bg-white">
            {iconSrc ? (
                <img
                    src={iconSrc}
                    alt={`${platform} icon`}
                    className="h-[1.0625rem] w-[1.0625rem] object-contain"
                    draggable={false}
                />
            ) : (
                <span className="text-xs font-bold text-[#1A1A1A]">
                    {safePlatform !== NA ? safePlatform.slice(0, 1).toUpperCase() : "?"}
                </span>
            )}
        </span>
    );
}

function InlinePlatformIcon({ platform }: { platform: string }) {
    const iconSrc = getPlatformIconSrc(platform);

    if (!iconSrc) return null;

    return (
        <img
            src={iconSrc}
            alt={`${platform} icon`}
            className="h-3.5 w-3.5 object-contain"
            draggable={false}
        />
    );
}

function StatBlock({
    label,
    value,
}: {
    label: string;
    value: ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col items-start justify-center gap-2">
            <p className="font-['Inter'] text-sm font-normal leading-5 text-[#B8B8B8]">
                {label}
            </p>

            <div className="font-['Inter'] text-base font-medium leading-6 text-[#1A1A1A]">
                {isEmptyValue(value) ? NA : value}
            </div>
        </div>
    );
}

function SmallMetricCard({
    title,
    value,
    suffix,
    trend,
    children,
}: {
    title: string;
    value: string;
    suffix?: string;
    trend?: string;
    children?: ReactNode;
}) {
    const safeValue = textOrNA(value);
    const safeTrend = textOrNA(trend);

    return (
        <div className="flex h-[6.3125rem] items-center justify-between self-stretch rounded-xl border border-[#E6E6E6] bg-white px-4 py-3">
            <div>
                <p className="font-['Inter'] text-sm font-normal leading-5 text-[#969696]">
                    {title}
                </p>

                <div className="mt-2 flex items-center gap-2">
                    <span className="font-['Inter'] text-[1.25rem] font-medium leading-7 text-[#1A1A1A]">
                        {safeValue}
                    </span>

                    {safeTrend !== NA ? (
                        <span className="rounded-md bg-[#EAF8ED] px-2 py-0.5 text-xs font-medium text-[#22A447]">
                            {safeTrend} ↟
                        </span>
                    ) : null}
                </div>

                {suffix ? (
                    <p className="font-['Inter'] text-xs font-normal leading-4 text-[#969696]">
                        {suffix}
                    </p>
                ) : null}
            </div>

            {children}
        </div>
    );
}

function RecentPostCard({
    post,
    view,
}: {
    post: any;
    view: InfluencerViewModel;
}) {
    const profileName = textOrNA(
        (view as any)?.profileName || (view as any)?.header?.profileName
    );

    const profileHandle = textOrNA(
        (view as any)?.profileHandle ||
        (view as any)?.header?.profileHandle ||
        (view as any)?.raw?.page1Primary?.handle ||
        (view as any)?.raw?.page1Data?.profile?.handle ||
        (view as any)?.raw?.page1Data?.profile?.username
    );

    const profileImage = textOrNA(
        (view as any)?.profileImage || (view as any)?.header?.profileImage
    );

    const profileLocation = textOrNA(
        (view as any)?.profileLocation || (view as any)?.header?.profileLocation
    );

    const profileFollowers = Number(
        (view as any)?.profileFollowers ||
        (view as any)?.overview?.profileFollowers ||
        0
    );

    const providerKey = String(
        (view as any)?.providerKey ||
        (view as any)?.header?.providerKey ||
        "instagram"
    );

    const postImage = textOrNA(post?.image || post?.thumbnail);
    const postText = textOrNA(post?.text);
    const postEngagement = getPostEngagement(post, profileFollowers);
    const postViews = post?.views || post?.plays || post?.videoViews;
    const postUrl = post?.url || "";

    return (
        <article className="w-[19.5rem] shrink-0 overflow-hidden rounded-xl border border-[#E6E6E6] bg-white shadow-sm">
            <div className="flex items-center justify-between self-stretch bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <img
                        src={
                            profileImage !== NA
                                ? profileImage
                                : "https://i.pravatar.cc/40?img=47"
                        }
                        alt={profileName}
                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0">
                        <p className="truncate font-['Inter'] text-xs font-semibold leading-4 text-[#1A1A1A]">
                            {profileName}
                        </p>
                        <p className="truncate font-['Inter'] text-[0.625rem] font-normal leading-3 text-[#969696]">
                            {profileLocation}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 font-['Inter'] text-[0.625rem] font-normal text-[#969696]">
                    <span>{postEngagement}</span>
                    <span>engagement</span>
                    <InlinePlatformIcon platform={providerKey} />
                </div>
            </div>

            <a
                href={postUrl || undefined}
                target={postUrl ? "_blank" : undefined}
                rel={postUrl ? "noopener noreferrer" : undefined}
                className="flex h-[17.5rem] items-end self-stretch bg-[#F5F5F5]"
            >
                {postImage !== NA ? (
                    <img
                        src={postImage}
                        alt={postText !== NA ? postText : "Recent post"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center font-['Inter'] text-sm text-[#969696]">
                        {NA}
                    </div>
                )}
            </a>

            <div className="flex h-[10.75rem] flex-col items-start justify-between self-stretch p-3">
                <div className="w-full">
                    <div className="flex items-center justify-between gap-3 font-['Inter'] text-xs text-[#1A1A1A]">
                        <div className="flex items-center gap-3">
                            <span>{compactNumber(post?.likes)} ♡</span>
                            <span>{compactNumber(post?.comments)} ◌</span>
                            <span>{postViews ? compactNumber(postViews) : NA} ◉</span>
                        </div>

                        <span className="font-semibold">
                            CPE ~${post?.cpe ? post.cpe : "5.2"}
                        </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 font-['Inter'] text-xs text-[#B8B8B8]">
                        <span>
                            {post?.impressions
                                ? compactNumber(post.impressions)
                                : NA}{" "}
                            est. Impression
                        </span>
                        <span>
                            {post?.reach ? compactNumber(post.reach) : NA} est. Reach
                        </span>
                        <span>{postViews ? `${compactNumber(postViews)} views` : NA}</span>
                    </div>

                    <p className="mt-2 line-clamp-3 font-['Inter'] text-sm font-normal leading-5 text-[#B8B8B8]">
                        <span className="font-semibold text-[#1A1A1A]">
                            {profileHandle}
                        </span>{" "}
                        {postText}
                    </p>
                </div>

                <p className="font-['Inter'] text-xs font-normal leading-4 text-[#B8B8B8]">
                    {formatTimeAgo(post?.created)}
                </p>
            </div>
        </article>
    );
}

function RecentPostsSection({ view }: { view: InfluencerViewModel }) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [activeFrame, setActiveFrame] = useState(0);
    const [postsPerFrame, setPostsPerFrame] = useState(3);

    const posts = useMemo(() => {
        const page1Data = (view as any)?.raw?.page1Data || {};

        const recentPosts =
            Array.isArray((view as any)?.recentPosts) &&
                (view as any).recentPosts.length > 0
                ? (view as any).recentPosts
                : Array.isArray(page1Data?.recentPosts)
                    ? page1Data.recentPosts
                    : [];

        const popularPosts =
            Array.isArray(page1Data?.popularPosts) && page1Data.popularPosts.length > 0
                ? page1Data.popularPosts
                : Array.isArray((view as any)?.raw?.providerRaw?.popularPosts)
                    ? (view as any).raw.providerRaw.popularPosts
                    : [];

        const mergedPosts = [...recentPosts, ...popularPosts];
        const uniquePostsMap = new Map<string, any>();

        mergedPosts.forEach((post: any, index: number) => {
            const key = String(post?.id || post?.url || `post-${index}`);

            if (!uniquePostsMap.has(key)) {
                uniquePostsMap.set(key, post);
                return;
            }

            const existing = uniquePostsMap.get(key);
            uniquePostsMap.set(key, {
                ...existing,
                ...post,
            });
        });

        return Array.from(uniquePostsMap.values());
    }, [view]);

    useEffect(() => {
        const calculatePostsPerFrame = () => {
            const viewportWidth = viewportRef.current?.offsetWidth || 0;
            const cardWidth = 312;
            const gap = 32;

            if (!viewportWidth) return;

            const count = Math.max(
                1,
                Math.floor((viewportWidth + gap) / (cardWidth + gap))
            );

            setPostsPerFrame(count);
        };

        calculatePostsPerFrame();

        const resizeObserver = new ResizeObserver(calculatePostsPerFrame);

        if (viewportRef.current) {
            resizeObserver.observe(viewportRef.current);
        }

        window.addEventListener("resize", calculatePostsPerFrame);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", calculatePostsPerFrame);
        };
    }, []);

    const frames = useMemo(() => {
        const chunks: any[][] = [];

        for (let index = 0; index < posts.length; index += postsPerFrame) {
            chunks.push(posts.slice(index, index + postsPerFrame));
        }

        return chunks;
    }, [posts, postsPerFrame]);

    useEffect(() => {
        if (activeFrame > frames.length - 1) {
            setActiveFrame(0);
        }
    }, [activeFrame, frames.length]);

    return (
        <section className="flex w-full flex-col items-start gap-10 bg-[#F9F9F9] px-14 py-10">
            <h2 className="w-full text-left font-['Inter'] text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
                Recent Posts
            </h2>

            {posts.length > 0 ? (
                <>
                    <div ref={viewportRef} className="w-full overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{
                                transform: `translateX(-${activeFrame * 100}%)`,
                            }}
                        >
                            {frames.map((framePosts, frameIndex) => (
                                <div
                                    key={frameIndex}
                                    className="flex w-full shrink-0 items-start justify-start gap-8"
                                >
                                    {framePosts.map((post: any, postIndex: number) => (
                                        <RecentPostCard
                                            key={post?.id || post?.url || `${frameIndex}-${postIndex}`}
                                            post={post}
                                            view={view}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {frames.length > 1 ? (
                        <div className="flex w-full items-center justify-center gap-2">
                            {frames.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Show recent posts frame ${index + 1}`}
                                    onClick={() => setActiveFrame(index)}
                                    className={`h-2 w-2 rounded-lg transition-colors ${index === activeFrame
                                            ? "bg-[#1A1A1A]"
                                            : "bg-[#EDEDED]"
                                        }`}
                                />
                            ))}
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="flex min-h-[12rem] w-full items-center justify-center rounded-xl border border-[#E6E6E6] bg-white font-['Inter'] text-sm text-[#969696]">
                    {NA}
                </div>
            )}
        </section>
    );
}

function CustomEngagementTooltip({ active, payload, label, view }: any) {
    if (!active || !payload?.length) return null;

    const engagement = payload?.[0]?.value;
    const followersText = textOrNA(
        (view as any)?.followersText || (view as any)?.overview?.followersText
    );
    const avgEngagementText = textOrNA(
        (view as any)?.avgEngagementText || (view as any)?.overview?.avgEngagementText
    );
    const engagementTrend = textOrNA(
        (view as any)?.engagementTrend || (view as any)?.overview?.engagementTrend
    );

    return (
        <div className="rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 shadow-lg">
            <p className="font-['Inter'] text-xs font-medium text-[#969696]">
                {followersText !== NA ? followersText : label}
            </p>

            <p className="mt-1 font-['Inter'] text-xs font-medium text-[#1A1A1A]">
                {avgEngagementText !== NA
                    ? avgEngagementText
                    : `${compactNumber(engagement)} avg engagement`}
                {engagementTrend !== NA ? (
                    <span className="ml-2 rounded-md bg-[#EAF8ED] px-2 py-0.5 text-[#22A447]">
                        {engagementTrend}
                    </span>
                ) : null}
            </p>
        </div>
    );
}

function EngagementRateSection({
    view,
    chartData,
    chartDomainMax,
}: {
    view: InfluencerViewModel;
    chartData: Array<{ day: string; engagement: number }>;
    chartDomainMax: number;
}) {
    const overview = (view as any)?.overview || view;

    const engagementRate = textOrNA(
        overview?.engagementRate || (view as any)?.engagementRate
    );
    const engagementTrend = textOrNA(
        overview?.engagementTrend || (view as any)?.engagementTrend
    );

    const contentPlatforms =
        Array.isArray(overview?.contentPlatforms) && overview.contentPlatforms.length > 0
            ? overview.contentPlatforms
            : Array.isArray((view as any)?.contentPlatforms)
                ? (view as any).contentPlatforms
                : [];

    const safeChartData = chartData.length > 0 ? chartData : [];
    const lastPoint = safeChartData[safeChartData.length - 1];

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-7 rounded-2xl border border-[#E6E6E6] bg-white px-4 py-7">
            <div className="flex w-full items-start justify-between">
                <p className="font-['Inter'] text-[1.02344rem] font-semibold leading-[1.31581rem] tracking-[-0.03656rem] text-[#7A7A7A]">
                    Engagement Rate
                </p>

                <select className="rounded-md border border-[#E6E6E6] bg-white px-2 py-1 text-center font-['Inter'] text-xs font-medium leading-4 text-[#1A1A1A] outline-none">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Last 90 Days</option>
                </select>
            </div>

            <div className="w-full">
                <div className="mb-5 flex items-center gap-2">
                    <span className="font-['Inter'] text-[2rem] font-medium leading-none text-[#1A1A1A]">
                        {engagementRate}
                    </span>

                    {engagementTrend !== NA ? (
                        <span className="rounded-md bg-[#EAF8ED] px-2 py-0.5 text-xs font-medium text-[#22A447]">
                            {engagementTrend}
                        </span>
                    ) : null}
                </div>

                <div className="h-[16rem] w-full">
                    {safeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={safeChartData}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="engagementPinkGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FF2B75" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#FF2B75" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} stroke="#F1F1F1" />
                                <XAxis hide dataKey="day" />
                                <YAxis
                                    tick={{ fontSize: 10, fill: "#969696" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={34}
                                    tickFormatter={(value) => `$${value}`}
                                    domain={[0, Math.max(chartDomainMax, 100)]}
                                />

                                <Tooltip
                                    cursor={{ stroke: "#FF2B75", strokeWidth: 1 }}
                                    content={<CustomEngagementTooltip view={view} />}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="engagement"
                                    stroke="#FF2B75"
                                    strokeWidth={2}
                                    fill="url(#engagementPinkGradient)"
                                    isAnimationActive={false}
                                    dot={false}
                                    activeDot={{
                                        r: 5,
                                        fill: "#fff",
                                        stroke: "#FF2B75",
                                        strokeWidth: 2,
                                    }}
                                />

                                {lastPoint ? (
                                    <ReferenceDot
                                        x={lastPoint.day}
                                        y={lastPoint.engagement}
                                        r={4}
                                        fill="#fff"
                                        stroke="#FF2B75"
                                        strokeWidth={2}
                                    />
                                ) : null}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#FAFAFA] font-['Inter'] text-sm text-[#969696]">
                            {NA}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-center gap-8 rounded-xl bg-white px-8 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {(contentPlatforms.length > 0
                    ? contentPlatforms
                    : ["instagram", "youtube", "tiktok"]
                )
                    .slice(0, 3)
                    .map((platform: any) => (
                        <div
                            key={String(platform)}
                            className="flex items-center gap-2 font-['Inter'] text-xs font-medium text-[#1A1A1A]"
                        >
                            <InlinePlatformIcon platform={String(platform)} />
                            <span>
                                {String(platform).charAt(0).toUpperCase() +
                                    String(platform).slice(1)}
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

function AudienceCredibilityScoreCard({
    score,
    chartData,
    chartDomainMax,
}: {
    score: string;
    chartData: Array<{ day: string; engagement: number }>;
    chartDomainMax: number;
}) {
    const safeScore = textOrNA(score);
    const lastPoint = chartData[chartData.length - 1];

    return (
        <div className="flex min-h-[13.5rem] flex-col justify-between rounded-xl border border-[#E6E6E6] bg-white p-4">
            <div className="flex items-center gap-1">
                <p className="font-['Inter'] text-sm font-normal leading-5 text-[#969696]">
                    Audience credibility score
                </p>
                <Info size={14} className="text-[#969696]" />
            </div>

            <div className="grid grid-cols-[8rem_1fr] items-end gap-4">
                <div>
                    <div className="flex items-end gap-1">
                        <span className="font-['Inter'] text-[2rem] font-medium leading-none text-[#1A1A1A]">
                            {safeScore}
                        </span>

                        {safeScore !== NA ? (
                            <span className="font-['Inter'] text-base font-normal text-[#B8B8B8]">
                                /100
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-2 max-w-[7rem] font-['Inter'] text-xs leading-4 text-[#969696]">
                        {safeScore !== NA ? "this Influencer has a good score" : NA}
                    </p>
                </div>

                <div className="relative h-[8rem]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="credibilityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} stroke="transparent" />
                                <XAxis hide dataKey="day" />
                                <YAxis hide domain={[0, Math.max(chartDomainMax, 100)]} />

                                <Tooltip
                                    cursor={{ stroke: "#22A447", strokeWidth: 1 }}
                                    content={({ active, payload, label }) => {
                                        if (!active || !payload?.length) return null;

                                        return (
                                            <div className="rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 shadow-lg">
                                                <p className="font-['Inter'] text-xs font-medium text-[#969696]">
                                                    {label}
                                                </p>
                                                <p className="mt-1 font-['Inter'] text-xs font-semibold text-[#1A1A1A]">
                                                    Score: {safeScore !== NA ? `${safeScore}/100` : NA}
                                                </p>
                                            </div>
                                        );
                                    }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="engagement"
                                    stroke="#22A447"
                                    strokeWidth={1}
                                    fill="url(#credibilityGradient)"
                                    isAnimationActive={false}
                                    dot={false}
                                />

                                {lastPoint ? (
                                    <ReferenceDot
                                        x={lastPoint.day}
                                        y={lastPoint.engagement}
                                        r={4}
                                        fill="#22A447"
                                        stroke="#22A447"
                                    />
                                ) : null}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#FAFAFA] font-['Inter'] text-sm text-[#969696]">
                            {NA}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfluencerMatchScoreCard({
    score,
    label,
}: {
    score: string;
    label: string;
}) {
    const scoreNumber = getNumberFromPercent(score);
    const safeScore = scoreNumber === null ? NA : `${scoreNumber}%`;
    const scoreLabel = getMatchLabel(scoreNumber, label);

    const getGaugeColor = (percent: number | null) => {
        if (percent === null) return "#FFBF00";
        if (percent < 40) return "#EF5350";
        if (percent < 60) return "#FF8751";
        if (percent < 80) return "#FFBF00";
        return "#28A745";
    };

    const getArcPoint = (percent: number, radius = 112) => {
        const clamped = Math.max(0, Math.min(100, percent));
        const angle = Math.PI - (clamped / 100) * Math.PI;

        const cx = 160;
        const cy = 152;

        return {
            x: cx + Math.cos(angle) * radius,
            y: cy - Math.sin(angle) * radius,
        };
    };

    const describeArc = (startPercent: number, endPercent: number) => {
        const start = getArcPoint(startPercent);
        const end = getArcPoint(endPercent);

        return `M ${start.x} ${start.y} A 112 112 0 0 1 ${end.x} ${end.y}`;
    };

    const indicatorPoint =
        scoreNumber === null ? null : getArcPoint(scoreNumber, 112);

    const indicatorColor = getGaugeColor(scoreNumber);

    return (
        <div className="flex flex-1 flex-col rounded-2xl border border-[#E6E6E6] bg-white p-7">
            <div className="w-full">
                <p className="font-['Inter'] text-[1.02344rem] font-semibold leading-[1.31581rem] tracking-[-0.03656rem] text-[#7A7A7A]">
                    Influencer Match score
                </p>
            </div>

            {scoreNumber !== null ? (
                <>
                    <div className="relative mt-4 flex w-full justify-center">
                        <div className="relative h-[20rem] w-full max-w-[32rem]">
                            <svg
                                viewBox="0 0 320 230"
                                className="h-full w-full"
                                aria-label={`Influencer match score ${safeScore}`}
                            >
                                {/* dotted inner guide */}
                                {Array.from({ length: 35 }).map((_, index) => {
                                    const percent = (index / 34) * 100;
                                    const point = getArcPoint(percent, 80);

                                    return (
                                        <circle
                                            key={index}
                                            cx={point.x}
                                            cy={point.y}
                                            r="1.4"
                                            fill="#969696"
                                        />
                                    );
                                })}

                                {/* Low */}
                                <path
                                    d={describeArc(0, 39)}
                                    fill="none"
                                    stroke="#EF5350"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                {/* Average */}
                                <path
                                    d={describeArc(45, 66)}
                                    fill="none"
                                    stroke="#FF8751"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                {/* Good */}
                                <path
                                    d={describeArc(73, 85)}
                                    fill="none"
                                    stroke="#FFBF00"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                {/* High */}
                                <path
                                    d={describeArc(92, 100)}
                                    fill="none"
                                    stroke="#28A745"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                {/* Indicator */}
                                {indicatorPoint ? (
                                    <circle
                                        cx={indicatorPoint.x}
                                        cy={indicatorPoint.y}
                                        r="9"
                                        fill="#F9F9F9"
                                        stroke={indicatorColor}
                                        strokeWidth="8"
                                    />
                                ) : null}
                            </svg>

                            {/* Percentage - moved slightly lower */}
                            <div className="absolute left-1/2 top-[9.8rem] -translate-x-1/2 text-center">
                                <p
                                    className="font-['Inter'] font-semibold text-[#242424]"
                                    style={{
                                        fontSize: "3.50888rem",
                                        lineHeight: "4.23988rem",
                                        letterSpacing: "-0.14619rem",
                                    }}
                                >
                                    {safeScore}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Text block */}
                    <div className="-mt-1 flex flex-col items-center text-center">
                        <p className="font-['Inter'] text-[1.25rem] font-semibold leading-7 text-[#1A1A1A]">
                            Influencer Match Score is {scoreLabel}
                        </p>

                        <p className="mt-2 max-w-[24rem] font-['Inter'] text-base font-normal leading-6 text-[#969696]">
                            this score shows a glance of the similarity
                            <br />
                            between influencer and campaign
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="mx-auto mt-8 flex items-center gap-6 rounded-full border border-[#E6E6E6] px-8 py-3">
                        {[
                            ["Low", "#EF5350"],
                            ["Average", "#FF8751"],
                            ["Good", "#FFBF00"],
                            ["High", "#28A745"],
                        ].map(([itemLabel, color]) => (
                            <div key={itemLabel} className="flex items-center gap-1.5">
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="font-['Inter'] text-sm font-normal text-[#969696]">
                                    {itemLabel}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="mt-4 flex h-[24rem] w-full items-center justify-center rounded-lg bg-[#FAFAFA] font-['Inter'] text-sm text-[#969696]">
                    {NA}
                </div>
            )}
        </div>
    );
}

function AnalyticsSection({
    view,
    chartData,
    chartDomainMax,
    matchScore,
    matchScoreLabel,
}: {
    view: InfluencerViewModel;
    chartData: Array<{ day: string; engagement: number }>;
    chartDomainMax: number;
    matchScore: string;
    matchScoreLabel: string;
}) {
    return (
        <section className="flex w-full flex-col gap-4 px-4 py-5">
            <div className="grid w-full grid-cols-2 gap-4">
                <EngagementRateSection
                    view={view}
                    chartData={chartData}
                    chartDomainMax={chartDomainMax}
                />

                <InfluencerMatchScoreCard
                    score={matchScore}
                    label={matchScoreLabel}
                />
            </div>

            <button className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E6E6E6] bg-white px-5 font-['Inter'] text-sm font-medium text-[#1A1A1A]">
                <span>View Revisions history</span>
                <span>›</span>
            </button>

            <button className="flex h-12 w-full items-center justify-between rounded-xl border border-[#E6E6E6] bg-white px-5 font-['Inter'] text-sm font-medium text-[#1A1A1A]">
                <span>View Deliveries</span>
                <span>›</span>
            </button>

            <p className="py-10 text-center font-['Inter'] text-sm text-[#B8B8B8]">
                You have reached the end of the page
            </p>
        </section>
    );
}

type OverviewTabProps = {
    view: InfluencerViewModel;
};

export default function OverviewTab({ view }: OverviewTabProps) {
    const searchParams = useSearchParams();

    const overview = (view as any)?.overview || view;

    const [matchScore, setMatchScore] = useState<string>(NA);
    const [matchScoreLabel, setMatchScoreLabel] = useState<string>(NA);

    const resolvedCampaignId =
        searchParams.get("campaignId") ||
        (view as any)?.raw?.contract?.campaignId ||
        (view as any)?.contract?.campaignId ||
        "";

    const resolvedInfluencerId =
        searchParams.get("influencerId") ||
        (view as any)?.raw?.influencer?.influencerId ||
        (view as any)?.raw?.influencer?._id ||
        (view as any)?.influencer?.influencerId ||
        (view as any)?.influencer?._id ||
        "";

    useEffect(() => {
        if (!resolvedCampaignId || !resolvedInfluencerId) {
            setMatchScore(NA);
            setMatchScoreLabel(NA);
            return;
        }

        let isMounted = true;

        const fetchInfluencerMatchScore = async () => {
            try {
                const res = await apiGetInfluencerMatchScore({
                    campaignId: resolvedCampaignId,
                    influencerId: resolvedInfluencerId,
                });

                if (!isMounted) return;

                const nextScore =
                    res?.matchPercent ||
                    (res?.matchScore !== undefined && res?.matchScore !== null
                        ? `${res.matchScore}%`
                        : NA);

                setMatchScore(textOrNA(nextScore));
                setMatchScoreLabel(textOrNA(res?.label));
            } catch (err) {
                console.error("Failed to fetch influencer match score", err);

                if (!isMounted) return;

                setMatchScore(NA);
                setMatchScoreLabel(NA);
            }
        };

        fetchInfluencerMatchScore();

        return () => {
            isMounted = false;
        };
    }, [resolvedCampaignId, resolvedInfluencerId]);

    const credibilityScore = textOrNA(
        overview?.credibilityScore || (view as any)?.credibilityScore
    );

    const contentPlatforms =
        Array.isArray(overview?.contentPlatforms) && overview.contentPlatforms.length > 0
            ? overview.contentPlatforms
            : Array.isArray((view as any)?.contentPlatforms) &&
                (view as any).contentPlatforms.length > 0
                ? (view as any).contentPlatforms
                : [];

    const contentFormats =
        Array.isArray(overview?.contentFormats) && overview.contentFormats.length > 0
            ? overview.contentFormats
            : Array.isArray((view as any)?.contentFormats) &&
                (view as any).contentFormats.length > 0
                ? (view as any).contentFormats
                : [];

    const chartData = useMemo(() => {
        const incoming =
            Array.isArray(overview?.chartData) && overview.chartData.length > 0
                ? overview.chartData
                : Array.isArray((view as any)?.chartData) &&
                    (view as any).chartData.length > 0
                    ? (view as any).chartData
                    : [];

        return incoming;
    }, [overview?.chartData, view]);

    const influencerPayment = textOrNA(
        overview?.influencerPayment || (view as any)?.influencerPayment
    );

    const milestonesText = textOrNA(
        overview?.milestonesText || (view as any)?.milestonesText
    );

    const totalDeliverables = textOrNA(
        overview?.totalDeliverables || (view as any)?.totalDeliverables
    );

    const contentLanguage = textOrNA(
        overview?.contentLanguages || (view as any)?.contentLanguages
    );

    const activeDate = textOrNA(
        overview?.activeDate || (view as any)?.activeDate
    );

    const avgViews = textOrNA(
        overview?.avgViews || (view as any)?.avgViews
    );

    const audienceMatch = textOrNA(
        overview?.audienceMatch || (view as any)?.audienceMatch
    );

    const engagementTrend = textOrNA(
        overview?.engagementTrend || (view as any)?.engagementTrend
    );

    const chartDomainMax = Number(
        overview?.chartDomainMax || (view as any)?.chartDomainMax || 100
    );

    return (
        <section className="flex w-full flex-col items-center justify-center gap-5 self-stretch">
            <div className="flex w-full flex-col items-center justify-center gap-5 p-4">
                <div className="flex w-full flex-col items-center justify-center gap-5 rounded-xl border border-[#E6E6E6] bg-white p-4">
                    <div className="flex w-full items-center gap-[13.6875rem]">
                        <StatBlock
                            label="Influencer Payment"
                            value={influencerPayment}
                        />

                        <StatBlock
                            label="Milestones"
                            value={milestonesText}
                        />

                        <StatBlock
                            label="Total Deliverables"
                            value={
                                totalDeliverables === NA
                                    ? NA
                                    : String(totalDeliverables).padStart(2, "0")
                            }
                        />
                    </div>

                    <div className="h-px w-full bg-[#E6E6E6]" />

                    <div className="flex w-full items-center gap-[13.6875rem]">
                        <StatBlock
                            label="Content Format"
                            value={
                                contentFormats.length > 0 ? (
                                    <div className="flex gap-6">
                                        {contentFormats.map((item: any) => (
                                            <span key={String(item)}>
                                                {textOrNA(item)}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    NA
                                )
                            }
                        />

                        <StatBlock
                            label="Content Language"
                            value={contentLanguage}
                        />

                        <StatBlock
                            label="Active date"
                            value={activeDate}
                        />
                    </div>
                </div>

                <div className="grid w-full grid-cols-[1fr_1fr] gap-4">
                    <div className="flex flex-col gap-4">
                        <SmallMetricCard
                            title="Avg views"
                            value={avgViews}
                            suffix="per month"
                            trend={engagementTrend}
                        >
                            {contentPlatforms.length > 0 ? (
                                <div className="flex items-center -space-x-1">
                                    {contentPlatforms.slice(0, 3).map((platform: any) => (
                                        <PlatformCircle
                                            key={String(platform)}
                                            platform={String(platform)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <span className="font-['Inter'] text-sm text-[#969696]">
                                    {NA}
                                </span>
                            )}
                        </SmallMetricCard>

                        <SmallMetricCard
                            title="Audience match"
                            value={audienceMatch}
                            suffix="per month"
                            trend={engagementTrend}
                        />
                    </div>

                    <AudienceCredibilityScoreCard
                        score={credibilityScore}
                        chartData={chartData}
                        chartDomainMax={chartDomainMax}
                    />
                </div>
            </div>

            <RecentPostsSection view={view} />

            <AnalyticsSection
                view={view}
                chartData={chartData}
                chartDomainMax={chartDomainMax}
                matchScore={matchScore}
                matchScoreLabel={matchScoreLabel}
            />
        </section>
    );
}