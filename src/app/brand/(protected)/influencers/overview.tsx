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
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { InfluencerViewModel, compactNumber } from "./utils";
import {
    apiGetContractDetails,
    apiGetInfluencerMatchScore,
    apiGetMilestonesByCampaign,
} from "../../services/brandApi";

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

const normalizeScoreTo100 = (value: any): number | null => {
    if (isEmptyValue(value)) return null;

    const cleaned =
        typeof value === "string"
            ? value.replace("%", "").replace("/100", "").trim()
            : value;

    const num = Number(cleaned);

    if (!Number.isFinite(num)) return null;

    if (num > 0 && num <= 1) {
        return Math.max(0, Math.min(100, num * 100));
    }

    return Math.max(0, Math.min(100, num));
};

const getFirstScore = (...values: any[]) => {
    for (const value of values) {
        const score = normalizeScoreTo100(value);

        if (score !== null) return score;
    }

    return null;
};

const getContractDoc = (data: any) => {
    return data?.contract || data?.data?.contract || data?.data || data || null;
};

const firstPositiveNumber = (...values: any[]) => {
    for (const value of values) {
        const num = Number(value);

        if (Number.isFinite(num) && num > 0) {
            return num;
        }
    }

    return 0;
};

const formatMoney = (amount: any, currency = "USD") => {
    const num = Number(amount);

    if (!Number.isFinite(num) || num <= 0) return NA;

    return `${currency || "USD"} $ ${num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

const getCommercial = (contract: any) => {
    return (
        contract?.content?.scheduleA?.commercial ||
        contract?.scheduleA?.commercial ||
        {}
    );
};

const getCurrency = (contract: any) => {
    return getCommercial(contract)?.currency || contract?.currency || "USD";
};

const getInfluencerBudgetFromContract = (contract: any) => {
    const commercial = getCommercial(contract);

    return firstPositiveNumber(
        commercial?.influencerBudget,
        commercial?.feeAmount,
        contract?.influencerBudget,
        contract?.feeAmount
    );
};

const humanizeLabel = (value: any) => {
    if (isEmptyValue(value)) return NA;

    return String(value)
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const extractMilestonesFromResponse = (res: any): any[] => {
    const candidates = [
        res?.milestones,
        res?.data?.milestones,
        res?.data?.data?.milestones,
        res?.items,
        res?.data?.items,
        res?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
    }

    return [];
};

const getMilestoneDeliverables = (milestone: any) => {
    const raw = milestone?.raw || milestone || {};

    return Array.isArray(raw?.deliverables) ? raw.deliverables : [];
};

const getMilestoneDeliverablesCount = (milestone: any) => {
    const raw = milestone?.raw || milestone || {};

    const explicitCount = Number(
        raw?.deliverablesCount ||
        raw?.deliverableCount ||
        raw?.totalDeliverables ||
        0
    );

    if (Number.isFinite(explicitCount) && explicitCount > 0) {
        return explicitCount;
    }

    return getMilestoneDeliverables(raw).length;
};

const getContentFormatsFromMilestones = (milestones: any[]) => {
    const formats = milestones.flatMap((milestone) =>
        getMilestoneDeliverables(milestone).flatMap((deliverable: any) =>
            Array.isArray(deliverable?.deliveries)
                ? deliverable.deliveries
                : deliverable?.deliveries
                    ? [deliverable.deliveries]
                    : []
        )
    );

    return Array.from(
        new Set(
            formats
                .map((item) => humanizeLabel(item))
                .filter((item) => item && item !== NA)
        )
    );
};

const getAllPageDataCandidates = (view: any) => {
    const raw = view?.raw || {};
    const influencer = raw?.influencer || view?.influencer || view || {};

    const page1FromInfluencer = Array.isArray(influencer?.page1)
        ? influencer.page1.map((item: any) => item?.data).filter(Boolean)
        : [];

    const page1FromRawInfluencer = Array.isArray(raw?.influencer?.page1)
        ? raw.influencer.page1.map((item: any) => item?.data).filter(Boolean)
        : [];

    const page1FromRoot = Array.isArray(view?.page1)
        ? view.page1.map((item: any) => item?.data).filter(Boolean)
        : [];

    const page1FromRaw = Array.isArray(raw?.page1)
        ? raw.page1.map((item: any) => item?.data).filter(Boolean)
        : [];

    return [
        view?.page1Data,
        view?.providerRaw,
        view?.page1Primary?.data,
        raw?.page1Data,
        raw?.providerRaw,
        raw?.page1Primary?.data,
        raw?.page1Primary,
        influencer?.page1Data,
        influencer?.providerRaw,
        ...page1FromInfluencer,
        ...page1FromRawInfluencer,
        ...page1FromRoot,
        ...page1FromRaw,
    ].filter(Boolean);
};

const getAudienceCredibilityScore = (view: any, overview: any) => {
    const raw = view?.raw || {};
    const influencer =
        raw?.influencer ||
        view?.influencer ||
        raw?.data?.influencer ||
        view?.data?.influencer ||
        view ||
        {};

    const pageDataCandidates = getAllPageDataCandidates(view);

    const pageDataScores = pageDataCandidates.flatMap((data: any) => [
        data?.audience?.credibility,
        data?.audience?.credibilityScore,
        data?.audience?.audienceCredibilityScore,

        data?.providerRaw?.audience?.credibility,
        data?.providerRaw?.audience?.credibilityScore,
        data?.providerRaw?.audience?.audienceCredibilityScore,

        data?.audienceLikers?.credibility,
        data?.audienceLikers?.credibilityScore,

        data?.audienceCommenters?.credibility,
        data?.audienceCommenters?.credibilityScore,

        data?.audienceExtra?.credibility,
        data?.audienceExtra?.credibilityScore,

        data?.audienceCredibilityScore,
        data?.credibilityScore,
        data?.credibility,
    ]);

    return getFirstScore(
        overview?.audienceCredibilityScore,
        overview?.credibilityScore,
        overview?.audience?.credibility,
        overview?.audience?.credibilityScore,
        overview?.audience?.audienceCredibilityScore,

        (view as any)?.audienceCredibilityScore,
        (view as any)?.credibilityScore,
        (view as any)?.audience?.credibility,
        (view as any)?.audience?.credibilityScore,
        (view as any)?.audience?.audienceCredibilityScore,

        raw?.audienceCredibilityScore,
        raw?.credibilityScore,
        raw?.audience?.credibility,
        raw?.audience?.credibilityScore,
        raw?.audience?.audienceCredibilityScore,

        influencer?.audienceCredibilityScore,
        influencer?.credibilityScore,
        influencer?.audience?.credibility,
        influencer?.audience?.credibilityScore,
        influencer?.audience?.audienceCredibilityScore,

        ...pageDataScores
    );
};

const buildSyntheticCredibilityChart = (score: number | null) => {
    if (score === null) return [];

    const safeScore = Math.max(0, Math.min(100, score));

    const multipliers = [
        0.72,
        0.9,
        0.65,
        0.6,
        1.08,
        0.77,
        0.91,
        1,
        0.55,
        0.62,
        0.62,
        0.62,
    ];

    return multipliers.map((multiplier, index) => ({
        day: `P${index + 1}`,
        credibility: Math.max(
            0,
            Math.min(100, Number((safeScore * multiplier).toFixed(2)))
        ),
    }));
};

const getCredibilityChartData = (
    view: any,
    overview: any,
    score: number | null
) => {
    const pageDataCandidates = getAllPageDataCandidates(view);

    const candidates = [
        overview?.credibilityChartData,
        overview?.audienceCredibilityChartData,
        overview?.audience?.credibilityChartData,
        (view as any)?.credibilityChartData,
        (view as any)?.audienceCredibilityChartData,
        (view as any)?.audience?.credibilityChartData,
        ...pageDataCandidates.map((data: any) => data?.audience?.credibilityHistory),
        ...pageDataCandidates.map((data: any) => data?.audience?.credibilityChartData),
    ];

    for (const candidate of candidates) {
        if (!Array.isArray(candidate) || candidate.length === 0) continue;

        const normalized = candidate
            .map((item: any, index: number) => {
                const value = getFirstScore(
                    item?.credibility,
                    item?.score,
                    item?.value,
                    item?.audienceCredibilityScore
                );

                if (value === null) return null;

                return {
                    day: String(item?.day || item?.month || item?.label || `P${index + 1}`),
                    credibility: Number(value.toFixed(2)),
                };
            })
            .filter(Boolean) as Array<{ day: string; credibility: number }>;

        if (normalized.length > 0) return normalized;
    }

    return buildSyntheticCredibilityChart(score);
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

function CredibilityMarkerLabel({ viewBox, value }: any) {
    const x = Number(viewBox?.x || 0);
    const y = Number(viewBox?.y || 0);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    return (
        <g transform={`translate(${x - 26}, ${y - 42})`}>
            <rect
                width="52"
                height="28"
                rx="6"
                fill="#3FA34D"
                filter="drop-shadow(0px 6px 8px rgba(0,0,0,0.15))"
            />
            <text
                x="26"
                y="18"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="10"
                fontWeight="600"
                fontFamily="Inter"
            >
                {value}
            </text>
            <path d="M21 28 L26 34 L31 28 Z" fill="#3FA34D" />
        </g>
    );
}

function AudienceCredibilityScoreCard({
    score,
    chartData,
}: {
    score: number | null;
    chartData: Array<{ day: string; credibility: number }>;
}) {
    const safeScoreNumber =
        score === null ? null : Math.max(0, Math.min(100, score));

    const displayScore =
        safeScoreNumber === null
            ? NA
            : Number.isInteger(safeScoreNumber)
                ? String(safeScoreNumber)
                : safeScoreNumber.toFixed(2).replace(/\.00$/, "");

    const roundedBubbleScore =
        safeScoreNumber === null ? NA : `${Math.round(safeScoreNumber)}%`;

    const safeChartData =
        safeScoreNumber === null
            ? []
            : chartData.length > 0
                ? chartData
                : buildSyntheticCredibilityChart(safeScoreNumber);

    const highlightPoint =
        safeScoreNumber === null || safeChartData.length === 0
            ? null
            : safeChartData.reduce((closest, current) => {
                return Math.abs(current.credibility - safeScoreNumber) <
                    Math.abs(closest.credibility - safeScoreNumber)
                    ? current
                    : closest;
            }, safeChartData[safeChartData.length - 1]);

    return (
        <div className="flex min-h-[13.5rem] flex-col justify-between rounded-[1.5rem] border border-[#E6E6E6] bg-white p-4">
            <div className="flex items-center gap-1">
                <p className="font-['Inter'] text-sm font-normal leading-5 text-[#969696]">
                    Audience credibility score
                </p>
                <Info size={14} className="text-[#969696]" />
            </div>

            <div className="grid grid-cols-[8rem_1fr] items-end gap-4">
                <div className="pb-2">
                    <div className="flex items-end gap-1">
                        <span className="font-['Inter'] text-[2rem] font-medium leading-none text-[#1A1A1A]">
                            {displayScore}
                        </span>

                        {displayScore !== NA ? (
                            <span className="font-['Inter'] text-base font-normal text-[#B8B8B8]">
                                /100
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-2 max-w-[7rem] font-['Inter'] text-xs leading-4 text-[#969696]">
                        {displayScore !== NA ? "this Influencer has a good score" : NA}
                    </p>
                </div>

                <div className="relative h-[9rem]">
                    {safeChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={safeChartData}
                                margin={{ top: 44, right: 18, left: 0, bottom: 8 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="credibilityGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="5%" stopColor="#3FA34D" stopOpacity={0.22} />
                                        <stop offset="95%" stopColor="#3FA34D" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} horizontal={false} stroke="transparent" />
                                <XAxis hide dataKey="day" />
                                <YAxis hide domain={[0, 100]} />

                                <Tooltip
                                    cursor={{ stroke: "#3FA34D", strokeWidth: 1 }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;

                                        const value = Number(payload?.[0]?.value || 0);

                                        return (
                                            <div className="rounded-xl border border-[#E6E6E6] bg-white px-4 py-3 shadow-lg">
                                                <p className="font-['Inter'] text-xs font-semibold text-[#1A1A1A]">
                                                    {value.toFixed(2).replace(/\.00$/, "")}/100
                                                </p>
                                            </div>
                                        );
                                    }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="credibility"
                                    stroke="#3FA34D"
                                    strokeWidth={1.5}
                                    fill="url(#credibilityGradient)"
                                    isAnimationActive={false}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        fill: "#3FA34D",
                                        stroke: "#3FA34D",
                                        strokeWidth: 2,
                                    }}
                                />

                                {highlightPoint ? (
                                    <ReferenceLine
                                        x={highlightPoint.day}
                                        stroke="#3FA34D"
                                        strokeDasharray="4 4"
                                        strokeWidth={1}
                                        segment={[
                                            {
                                                x: highlightPoint.day,
                                                y: 0,
                                            },
                                            {
                                                x: highlightPoint.day,
                                                y: highlightPoint.credibility,
                                            },
                                        ]}
                                    />
                                ) : null}

                                {highlightPoint ? (
                                    <ReferenceDot
                                        x={highlightPoint.day}
                                        y={highlightPoint.credibility}
                                        r={4}
                                        fill="#3FA34D"
                                        stroke="#3FA34D"
                                        strokeWidth={2}
                                        label={
                                            <CredibilityMarkerLabel value={roundedBubbleScore} />
                                        }
                                    />
                                ) : null}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#FAFAFA] font-['Inter'] text-sm text-[#969696]">
                            No credibility data
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

                                <path
                                    d={describeArc(0, 39)}
                                    fill="none"
                                    stroke="#EF5350"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                <path
                                    d={describeArc(45, 66)}
                                    fill="none"
                                    stroke="#FF8751"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                <path
                                    d={describeArc(73, 85)}
                                    fill="none"
                                    stroke="#FFBF00"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

                                <path
                                    d={describeArc(92, 100)}
                                    fill="none"
                                    stroke="#28A745"
                                    strokeWidth="20"
                                    strokeLinecap="round"
                                />

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
    const [contractDetailsData, setContractDetailsData] = useState<any | null>(null);
    const [contractDetailsLoading, setContractDetailsLoading] = useState(false);
    const [apiMilestones, setApiMilestones] = useState<any[]>([]);
    const [milestonesLoading, setMilestonesLoading] = useState(false);

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

    const resolvedBrandId =
        searchParams.get("brandId") ||
        (view as any)?.raw?.contract?.brandId ||
        (view as any)?.contract?.brandId ||
        (view as any)?.raw?.contract?.content?.brand?._id ||
        (view as any)?.contract?.content?.brand?._id ||
        "";

    const resolvedContractId =
        searchParams.get("contractId") ||
        (view as any)?.raw?.contract?.contractId ||
        (view as any)?.contract?.contractId ||
        (view as any)?.raw?.contractId ||
        (view as any)?.contractId ||
        (view as any)?.raw?.contract?._id ||
        (view as any)?.contract?._id ||
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

    useEffect(() => {
        if (!resolvedContractId) {
            setContractDetailsData(null);
            return;
        }

        let isMounted = true;

        const fetchContractDetails = async () => {
            try {
                setContractDetailsLoading(true);

                const data = await apiGetContractDetails(resolvedContractId);

                if (isMounted) {
                    setContractDetailsData(data);
                }
            } catch (err) {
                console.error("Failed to fetch contract details for overview", err);

                if (isMounted) {
                    setContractDetailsData(null);
                }
            } finally {
                if (isMounted) {
                    setContractDetailsLoading(false);
                }
            }
        };

        fetchContractDetails();

        return () => {
            isMounted = false;
        };
    }, [resolvedContractId]);

    useEffect(() => {
        if (!resolvedCampaignId) {
            setApiMilestones([]);
            return;
        }

        let isMounted = true;

        const fetchMilestones = async () => {
            try {
                setMilestonesLoading(true);

                const res = await apiGetMilestonesByCampaign({
                    campaignId: resolvedCampaignId,
                    brandId: resolvedBrandId || "",
                } as any);

                if (!isMounted) return;

                const milestones = extractMilestonesFromResponse(res);
                const filteredMilestones = resolvedInfluencerId
                    ? milestones.filter(
                        (item: any) =>
                            String(item?.influencerId || item?.raw?.influencerId || "") ===
                            String(resolvedInfluencerId)
                    )
                    : milestones;

                setApiMilestones(filteredMilestones);
            } catch (err) {
                console.error("Failed to fetch milestone overview details", err);

                if (isMounted) {
                    setApiMilestones([]);
                }
            } finally {
                if (isMounted) {
                    setMilestonesLoading(false);
                }
            }
        };

        fetchMilestones();

        return () => {
            isMounted = false;
        };
    }, [resolvedCampaignId, resolvedBrandId, resolvedInfluencerId]);

    const detailedContract = useMemo(() => {
        return getContractDoc(contractDetailsData);
    }, [contractDetailsData]);

    const selectedContractMeta = useMemo(() => {
        return (
            detailedContract ||
            (view as any)?.raw?.contract ||
            (view as any)?.contract ||
            (view as any)?.raw?.contractData ||
            null
        );
    }, [detailedContract, view]);

    const contractCurrency = getCurrency(selectedContractMeta);
    const contractInfluencerBudget = getInfluencerBudgetFromContract(selectedContractMeta);

    const milestoneOverviewStats = useMemo(() => {
        const fallbackMilestones =
            Array.isArray((view as any)?.milestones) &&
                (view as any).milestones.length > 0
                ? (view as any).milestones
                : Array.isArray((view as any)?.milestonesTab?.milestones)
                    ? (view as any).milestonesTab.milestones
                    : [];

        const source = apiMilestones.length > 0 ? apiMilestones : fallbackMilestones;

        const filtered = resolvedInfluencerId
            ? source.filter(
                (item: any) =>
                    String(item?.influencerId || item?.raw?.influencerId || "") ===
                    String(resolvedInfluencerId)
            )
            : source;

        const milestonesCount = filtered.length;
        const deliverablesCount = filtered.reduce(
            (sum: number, milestone: any) =>
                sum + getMilestoneDeliverablesCount(milestone),
            0
        );

        return {
            milestonesCount,
            deliverablesCount,
            contentFormats: getContentFormatsFromMilestones(filtered),
        };
    }, [apiMilestones, resolvedInfluencerId, view]);

    const credibilityScoreNumber = useMemo(() => {
        return getAudienceCredibilityScore(view, overview);
    }, [overview, view]);

    const credibilityChartData = useMemo(() => {
        return getCredibilityChartData(view, overview, credibilityScoreNumber);
    }, [credibilityScoreNumber, overview, view]);

    const contentPlatforms =
        Array.isArray(overview?.contentPlatforms) && overview.contentPlatforms.length > 0
            ? overview.contentPlatforms
            : Array.isArray((view as any)?.contentPlatforms) &&
                (view as any).contentPlatforms.length > 0
                ? (view as any).contentPlatforms
                : [];

    const contentFormats =
        milestoneOverviewStats.contentFormats.length > 0
            ? milestoneOverviewStats.contentFormats
            : Array.isArray(overview?.contentFormats) && overview.contentFormats.length > 0
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

    const influencerPayment = contractDetailsLoading
        ? "Loading..."
        : contractInfluencerBudget
            ? formatMoney(contractInfluencerBudget, contractCurrency)
            : textOrNA(overview?.influencerPayment || (view as any)?.influencerPayment);

    const milestonesText =
        milestonesLoading && milestoneOverviewStats.milestonesCount === 0
            ? "Loading..."
            : milestoneOverviewStats.milestonesCount > 0
                ? String(milestoneOverviewStats.milestonesCount).padStart(2, "0")
                : textOrNA(overview?.milestonesText || (view as any)?.milestonesText);

    const totalDeliverables =
        milestonesLoading && milestoneOverviewStats.deliverablesCount === 0
            ? "Loading..."
            : milestoneOverviewStats.deliverablesCount > 0
                ? String(milestoneOverviewStats.deliverablesCount).padStart(2, "0")
                : textOrNA(overview?.totalDeliverables || (view as any)?.totalDeliverables);

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
                        score={credibilityScoreNumber}
                        chartData={credibilityChartData}
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