import type {
    CategoryItem,
    DetailTableItem,
    GetInfluencerByIdResponse,
    InfluencerDetails,
    InfluencerPage1,
    InfluencerPlatformData,
    InfluencerSocialProfile,
    InfluencerViewModel,
    LanguageItem,
    ManageTabDefinition,
    ManageTabKey,
    PlatformKey,
    PlatformProfile,
    RecentPost,
} from "./type";

export type {
    CategoryItem,
    DetailTableItem,
    GetInfluencerByIdResponse,
    InfluencerDetails,
    InfluencerPage1,
    InfluencerPlatformData,
    InfluencerSocialProfile,
    InfluencerViewModel,
    LanguageItem,
    ManageTabDefinition,
    ManageTabKey,
    PlatformKey,
    PlatformProfile,
    RecentPost,
} from "./type";

export const MANAGE_TABS: ManageTabDefinition[] = [
    { key: "overview", label: "Overview" },
    { key: "milestones", label: "Milestone & Deliverables" },
    { key: "payment", label: "Payment & Contract" },
];

export const dash = (value: any) =>
    value === undefined || value === null || value === "" ? "-" : value;

export const safeArray = <T,>(value: T[] | undefined | null): T[] =>
    Array.isArray(value) ? value : [];

export const compactNumber = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";

    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(num);
};

export const fullNumber = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";

    return new Intl.NumberFormat("en").format(num);
};

export const formatPercent = (value: any, multiply = true, digits = 2) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";

    const finalValue = multiply ? num * 100 : num;
    return `${finalValue.toFixed(digits)}%`;
};

export const formatDelta = (value: any, multiply = true, digits = 1) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";

    const finalValue = multiply ? num * 100 : num;
    return `${finalValue >= 0 ? "+" : ""}${finalValue.toFixed(digits)}%`;
};

export const formatDate = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    }).format(date);
};

export const formatTimeAgo = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

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

export const humanize = (value: string) =>
    value
        ? value
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : "-";

export const extractHandle = (value: any) => {
    if (!value || typeof value !== "string") return "-";

    if (value.startsWith("@")) return value;

    try {
        const url = new URL(value);
        const path = url.pathname.replaceAll("/", "").trim();
        return path ? `@${path}` : "-";
    } catch {
        return value.startsWith("http") ? "-" : `@${value.replace("@", "")}`;
    }
};

export const countryLabel = (value: any) => {
    const map: Record<string, string> = {
        US: "United States",
        GB: "United Kingdom",
        CA: "Canada",
        AU: "Australia",
        IN: "India",
        DE: "Germany",
        MX: "Mexico",
        NL: "The Netherlands",
        PH: "Philippines",
        ID: "Indonesia",
    };

    if (!value) return "";

    if (typeof value === "object") {
        return value?.name || value?.countryName || value?.label || "";
    }

    return map[value] || value;
};

export const getUniqueValues = (arr: any[], key: string) =>
    [...new Set(safeArray(arr).map((item) => item?.[key]).filter(Boolean))];

export const getTopLanguages = (languages: any[]) => {
    const items = safeArray<any>(languages)
        .filter((item) => item?.name || item?.label || item?.title || typeof item === "string")
        .sort((a: any, b: any) => Number(b?.weight || 0) - Number(a?.weight || 0))
        .slice(0, 2)
        .map((item: any) =>
            typeof item === "string" ? item : item?.name || item?.label || item?.title
        )
        .filter(Boolean);

    return items.length ? items.join(", ") : "-";
};

export const getChartData = (history: any[]) =>
    safeArray<any>(history).map((item) => ({
        day: item?.month
            ? new Date(`${item.month}-01`).toLocaleString("en", { month: "short" })
            : item?.day || item?.label || "-",
        engagement: Number(
            item?.avg_engagements ??
            item?.engagement ??
            item?.avgLikes ??
            item?.avg_likes ??
            item?.avgViews ??
            item?.followers ??
            item?.value ??
            0
        ),
    }));

export const getYAxisTicks = (maxValue: number) => {
    if (!maxValue || maxValue <= 0) return [25, 50, 75, 100];

    if (maxValue <= 100) return [25, 50, 75, 100];

    const magnitude = maxValue <= 1000 ? 100 : maxValue <= 10000 ? 1000 : 10000;
    const roundedMax = Math.ceil(maxValue / magnitude) * magnitude;

    return [
        Math.round(roundedMax * 0.25),
        Math.round(roundedMax * 0.5),
        Math.round(roundedMax * 0.75),
        roundedMax,
    ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);
};

export const calcPostEngagement = (post: any, followers: number) => {
    const likes = Number(post?.likes || 0);
    const comments = Number(post?.comments || 0);

    if (!followers) return "-";

    return formatPercent((likes + comments) / followers, true, 2);
};

export const getSocialProfilesObject = (socialProfiles: any) => {
    if (!socialProfiles) return {};

    if (Array.isArray(socialProfiles)) {
        return socialProfiles.reduce((acc: Record<string, any>, item: any) => {
            const key = String(
                item?.platform ||
                item?.provider ||
                item?.type ||
                item?.name ||
                ""
            ).toLowerCase();

            if (key) acc[key] = item;

            return acc;
        }, {});
    }

    return socialProfiles;
};

export const getProfileByKey = (profiles: any, key: PlatformKey) => {
    return (
        profiles?.[key] ||
        profiles?.[key.toUpperCase()] ||
        profiles?.[key.charAt(0).toUpperCase() + key.slice(1)] ||
        {}
    );
};

export const getFirstAvailableProfile = (
    instagramProfile: any,
    youtubeProfile: any,
    tiktokProfile: any
) => {
    if (
        instagramProfile?.username ||
        instagramProfile?.handle ||
        instagramProfile?.url ||
        instagramProfile?.profileUrl ||
        instagramProfile?.picture
    ) {
        return instagramProfile;
    }

    if (
        youtubeProfile?.username ||
        youtubeProfile?.handle ||
        youtubeProfile?.url ||
        youtubeProfile?.profileUrl ||
        youtubeProfile?.picture
    ) {
        return youtubeProfile;
    }

    if (
        tiktokProfile?.username ||
        tiktokProfile?.handle ||
        tiktokProfile?.url ||
        tiktokProfile?.profileUrl ||
        tiktokProfile?.picture
    ) {
        return tiktokProfile;
    }

    return {};
};

export const detectProviderKey = (
    firstSocialProfile: any,
    instagramProfile: any,
    youtubeProfile: any,
    tiktokProfile: any
): PlatformKey => {
    const raw = String(
        firstSocialProfile?.platform ||
        firstSocialProfile?.provider ||
        firstSocialProfile?.type ||
        ""
    ).toLowerCase();

    if (raw.includes("youtube")) return "youtube";
    if (raw.includes("tiktok") || raw.includes("tik tok")) return "tiktok";
    if (raw.includes("instagram")) return "instagram";

    if (youtubeProfile?.username || youtubeProfile?.handle || youtubeProfile?.url) {
        return "youtube";
    }

    if (tiktokProfile?.username || tiktokProfile?.handle || tiktokProfile?.url) {
        return "tiktok";
    }

    return "instagram";
};

const getContentFormatsFromStats = (statsByContentType: any) => {
    const keys = Object.keys(statsByContentType || {}).filter((key) => key !== "all");

    return keys
        .map((key) => humanize(key))
        .filter((value) => value && value !== "-");
};

const buildMilestoneRows = (deliverables: any[], contract: any) => {
    return safeArray<any>(deliverables).map((item: any, index) => ({
        id: `${item?.srNo || index + 1}-${item?.platform || "item"}`,
        name: item?.name || `Deliverable ${item?.srNo || index + 1}`,
        format: dash(item?.deliverableFormat),
        platform: dash(item?.platform),
        status: contract?.isAssigned ? "Active" : humanize(contract?.status || "Active"),
        qty: dash(item?.qty || 1),
        deadline: item?.liveDate
            ? formatDate(item?.liveDate)
            : item?.draftDue
                ? formatDate(item?.draftDue)
                : "-",
    }));
};

export const buildInfluencerViewModel = (manageInfo: any): InfluencerViewModel => {
    const influencer: InfluencerDetails =
        manageInfo?.influencer ||
        manageInfo?.data?.influencer ||
        manageInfo?.data ||
        {};

    const contract =
        manageInfo?.contract ||
        manageInfo?.data?.contract ||
        influencer?.contract ||
        {};

    const content = contract?.content || {};
    const campaign = content?.campaign || {};
    const scheduleA = content?.scheduleA || {};
    const commercial = scheduleA?.commercial || {};

    const page1List = safeArray<InfluencerPage1>(influencer?.page1);
    const page1Primary =
        page1List.find((item: InfluencerPage1) => item?.isPrimary) ||
        page1List[0] ||
        {};

    const page1Data: InfluencerPlatformData = page1Primary?.data || {};
    const page1Profile: PlatformProfile = page1Data?.profile || {};

    const page1ProviderRaw = page1Data?.providerRaw || {};
    const page1ProviderRawProfileRoot = page1ProviderRaw?.profile || {};
    const page1ProviderRawProfile =
        page1ProviderRawProfileRoot?.profile ||
        page1ProviderRaw?.profile ||
        {};

    const socialProfiles = getSocialProfilesObject(influencer?.socialProfiles);
    const instagramProfile = getProfileByKey(socialProfiles, "instagram");
    const youtubeProfile = getProfileByKey(socialProfiles, "youtube");
    const tiktokProfile = getProfileByKey(socialProfiles, "tiktok");

    const firstSocialProfile =
        getFirstAvailableProfile(instagramProfile, youtubeProfile, tiktokProfile) ||
        {};

    const providerKey = detectProviderKey(
        {
            ...firstSocialProfile,
            platform: page1Primary?.platform || firstSocialProfile?.provider,
        },
        instagramProfile,
        youtubeProfile,
        tiktokProfile
    );

    const modash =
        manageInfo?.modashData ||
        manageInfo?.data?.modashData ||
        influencer?.modashData ||
        page1Data ||
        firstSocialProfile?.modashData ||
        firstSocialProfile?.modash ||
        {};

    const providerRaw =
        modash?.providerRaw ||
        page1ProviderRaw ||
        firstSocialProfile?.providerRaw ||
        firstSocialProfile?.raw ||
        {};

    const providerProfileRoot =
        providerRaw?.profile ||
        page1ProviderRawProfileRoot ||
        {};

    const providerProfile: PlatformProfile =
        providerProfileRoot?.profile ||
        page1ProviderRawProfile ||
        page1Profile ||
        firstSocialProfile ||
        {};

    const deliverables = safeArray<any>(scheduleA?.deliverables);

    const statsByContentType =
        page1Data?.statsByContentType ||
        modash?.statsByContentType ||
        providerRaw?.statsByContentType ||
        firstSocialProfile?.statsByContentType ||
        {};

    const contentFormatFromDeliverables = getUniqueValues(deliverables, "deliverableFormat");
    const contentFormatFromStats = getContentFormatsFromStats(statsByContentType);

    const contentFormats =
        contentFormatFromDeliverables.length > 0
            ? contentFormatFromDeliverables
            : contentFormatFromStats.length > 0
                ? contentFormatFromStats
                : [];

    const providerPlatform =
        page1Primary?.platform ||
        firstSocialProfile?.provider ||
        firstSocialProfile?.platform ||
        providerKey;

    const contentPlatforms = Array.from(
        new Set([
            ...getUniqueValues(deliverables, "platform"),
            providerPlatform,
        ].filter(Boolean))
    );

    const realStats =
        providerKey === "instagram"
            ? statsByContentType?.all || {}
            : statsByContentType?.[providerKey] || statsByContentType?.all || {};

    const realHistory =
        safeArray<any>(realStats?.statHistory).length > 0
            ? safeArray<any>(realStats?.statHistory)
            : safeArray<any>(page1Data?.statHistory).length > 0
                ? safeArray<any>(page1Data?.statHistory)
                : safeArray<any>(providerRaw?.statHistory).length > 0
                    ? safeArray<any>(providerRaw?.statHistory)
                    : safeArray<any>(page1ProviderRawProfileRoot?.statHistory).length > 0
                        ? safeArray<any>(page1ProviderRawProfileRoot?.statHistory)
                        : safeArray<any>(firstSocialProfile?.statHistory || firstSocialProfile?.history);

    const chartData = getChartData(realHistory);
    const lastPoint = chartData[chartData.length - 1];
    const prevPoint = chartData[chartData.length - 2];

    const chartChange =
        lastPoint && prevPoint && prevPoint.engagement
            ? (lastPoint.engagement - prevPoint.engagement) / prevPoint.engagement
            : null;

    const yAxisMax = Math.max(...chartData.map((d) => d.engagement), 0);
    const yAxisTicks = getYAxisTicks(yAxisMax);
    const chartDomainMax =
        yAxisTicks.length > 0 ? Math.max(...yAxisTicks) : Math.max(yAxisMax, 100);

    const profileFollowers = Number(
        providerProfile?.followers ||
        page1Profile?.followers ||
        page1Data?.stats?.followers?.value ||
        firstSocialProfile?.followers ||
        firstSocialProfile?.followerCount ||
        influencer?.followers ||
        influencer?.audienceSize ||
        modash?.followers ||
        modash?.stats?.followers?.value ||
        0
    );

    const profileName = dash(
        providerProfile?.fullname ||
        page1Profile?.fullname ||
        influencer?.name ||
        influencer?.creatorName ||
        firstSocialProfile?.fullname ||
        firstSocialProfile?.name ||
        modash?.fullname ||
        contract?.influencerName
    );

    const profileHandle = dash(
        extractHandle(
            page1Primary?.handle ||
            page1Profile?.handle ||
            page1Profile?.username ||
            providerProfile?.username ||
            providerProfile?.handle ||
            firstSocialProfile?.handle ||
            firstSocialProfile?.username ||
            firstSocialProfile?.url ||
            firstSocialProfile?.profileUrl ||
            modash?.username ||
            content?.influencer?.postingHandleUrl ||
            contract?.influencerHandle
        )
    );
    const profileUrl = dash(
        page1Profile?.url ||
        providerProfile?.url ||
        firstSocialProfile?.url ||
        firstSocialProfile?.profileUrl ||
        page1Primary?.data?.profile?.url
    );

    const profileImage = dash(
        page1Profile?.picture ||
        providerProfile?.picture ||
        influencer?.profilePic ||
        firstSocialProfile?.picture ||
        firstSocialProfile?.profilePic ||
        modash?.picture
    );

    const profileBio = dash(
        influencer?.bio ||
        page1Data?.bio ||
        page1ProviderRawProfileRoot?.bio ||
        providerProfileRoot?.bio ||
        providerProfile?.bio ||
        firstSocialProfile?.bio ||
        modash?.bio ||
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."
    );

    const profileVerified = Boolean(
        page1Data?.isVerified ||
        page1ProviderRawProfileRoot?.isVerified ||
        providerProfileRoot?.isVerified ||
        providerProfile?.isVerified ||
        firstSocialProfile?.isVerified ||
        firstSocialProfile?.verified ||
        modash?.isVerified
    );

    const city =
        page1Data?.city ||
        page1ProviderRawProfileRoot?.city ||
        providerProfileRoot?.city ||
        modash?.city ||
        "";

    const state =
        page1Data?.state ||
        page1ProviderRawProfileRoot?.state ||
        providerProfileRoot?.state ||
        modash?.state ||
        "";

    const country =
        page1Data?.country ||
        page1ProviderRawProfileRoot?.country ||
        providerProfileRoot?.country ||
        modash?.country ||
        influencer?.countryName ||
        influencer?.country?.name ||
        influencer?.country?.countryName ||
        influencer?.country ||
        "";

    const profileLocation =
        [city, state, countryLabel(country)].filter(Boolean).join(", ") || "-";

    const accountType = dash(
        page1Data?.accountType ||
        page1ProviderRawProfileRoot?.accountType ||
        firstSocialProfile?.accountType ||
        modash?.accountType ||
        providerProfileRoot?.accountType ||
        "Creator"
    );

    const providerLabel =
        providerKey === "instagram"
            ? "Instagram"
            : providerKey === "youtube"
                ? "Youtube"
                : providerKey === "tiktok"
                    ? "TikTok"
                    : humanize(providerKey);

    const topLevelCategories =
        safeArray<CategoryItem>(influencer?.categories).length > 0
            ? safeArray<CategoryItem>(influencer?.categories)
                .map((item: any) => item?.name || item?.title || item?.categoryName || item)
                .filter(Boolean)
            : [];

    const page1Categories =
        safeArray<CategoryItem>(page1Data?.categories).length > 0
            ? safeArray<CategoryItem>(page1Data?.categories)
                .map((item: any) => item?.categoryName || item?.name || item?.title || item)
                .filter(Boolean)
            : [];

    const providerInterests =
        safeArray<any>(page1ProviderRawProfileRoot?.interests).length > 0
            ? safeArray<any>(page1ProviderRawProfileRoot?.interests)
                .map((item: any) => item?.name || item?.title || item)
                .filter(Boolean)
            : [];

    const categoryList =
        topLevelCategories.length > 0
            ? topLevelCategories
            : page1Categories.length > 0
                ? page1Categories
                : providerInterests.length > 0
                    ? providerInterests
                    : safeArray<string>(influencer?.categoryIds);

    const categoryText = categoryList.length > 0 ? categoryList.join(", ") : "-";
    const primaryCategory = categoryList.length > 0 ? String(categoryList[0]) : "-";

    const languageFromProfile =
        typeof page1Data?.language === "string"
            ? page1Data.language
            : page1Data?.language?.name ||
            page1ProviderRawProfileRoot?.language?.name ||
            page1ProviderRawProfileRoot?.language ||
            "";

    const topLanguages = getTopLanguages(
        page1Data?.audience?.languages ||
        providerRaw?.audience?.languages ||
        influencer?.languages ||
        []
    );

    const contentLanguages =
        topLanguages !== "-"
            ? topLanguages
            : languageFromProfile
                ? languageFromProfile
                : safeArray<string>(influencer?.languageIds).length > 0
                    ? safeArray<string>(influencer?.languageIds).join(", ")
                    : "-";

    const totalMilestones =
        deliverables.reduce((sum: number, item: any) => {
            const qty = Number(item?.qty);
            return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
        }, 0) || safeArray<any>(contract?.milestones).length || 0;

    const totalDeliverables =
        deliverables.reduce((sum: number, item: any) => {
            const qty = Number(item?.qty);
            return sum + (Number.isFinite(qty) && qty > 0 ? qty : 1);
        }, 0) || totalMilestones || 0;

    const influencerPayment =
        commercial?.currency && commercial?.totalCampaignFee
            ? `${commercial.currency} $ ${fullNumber(commercial.totalCampaignFee)}`
            : contract?.currency && contract?.feeAmount
                ? `${contract.currency} $ ${fullNumber(contract.feeAmount)}`
                : "-";

    const avgViewsValue =
        statsByContentType?.reels?.avgReelsPlays ??
        page1Data?.avgReelsPlays ??
        modash?.avgReelsPlays ??
        providerRaw?.avgReelsPlays ??
        firstSocialProfile?.avgViews ??
        firstSocialProfile?.views ??
        page1ProviderRawProfileRoot?.avgViews ??
        null;

    const avgViews =
        avgViewsValue !== null && avgViewsValue !== undefined && Number.isFinite(Number(avgViewsValue))
            ? compactNumber(avgViewsValue)
            : "-";

    const engagementRate = formatPercent(
        page1Profile?.engagementRate ||
        providerProfile?.engagementRate ||
        firstSocialProfile?.engagementRate ||
        realStats?.engagementRate ||
        modash?.engagementRate,
        true,
        2
    );

    const engagementTrend =
        chartChange === null ? "-" : formatDelta(chartChange, true, 1);

    const followersText =
        profileFollowers > 0 ? `${compactNumber(profileFollowers)} followers` : "-";

    const avgEngagementText =
        realStats?.engagements ||
            providerProfile?.engagements ||
            page1Profile?.engagements ||
            firstSocialProfile?.engagements
            ? `${compactNumber(
                realStats?.engagements ||
                providerProfile?.engagements ||
                page1Profile?.engagements ||
                firstSocialProfile?.engagements
            )} avg engagement`
            : "-";

    const recentPosts =
        safeArray<RecentPost>(page1Data?.recentPosts).length > 0
            ? safeArray<RecentPost>(page1Data?.recentPosts)
            : safeArray<RecentPost>(providerRaw?.recentPosts).length > 0
                ? safeArray<RecentPost>(providerRaw?.recentPosts)
                : safeArray<RecentPost>(page1ProviderRawProfileRoot?.recentPosts).length > 0
                    ? safeArray<RecentPost>(page1ProviderRawProfileRoot?.recentPosts)
                    : safeArray<RecentPost>(firstSocialProfile?.recentPosts).length > 0
                        ? safeArray<RecentPost>(firstSocialProfile?.recentPosts)
                        : safeArray<RecentPost>(page1Data?.popularPosts).length > 0
                            ? safeArray<RecentPost>(page1Data?.popularPosts)
                            : safeArray<RecentPost>(modash?.popularPosts);

    const milestones = buildMilestoneRows(deliverables, contract);

    const printableContractId = contract?._id || contract?.contractId || "";
    const milestonesText = totalMilestones
        ? `01/${String(totalMilestones).padStart(2, "0")}`
        : "00/00";

    const activeDate = formatDate(
        campaign?.effectiveDate ||
        contract?.requestedEffectiveDate ||
        influencer?.createdAt
    );

    const credibilityScore =
        page1Data?.audienceCredibilityScore ||
        page1Data?.credibilityScore ||
        providerRaw?.audienceCredibilityScore ||
        providerRaw?.credibilityScore ||
        "-";

    const audienceMatch =
        page1Data?.audienceMatch ||
        providerRaw?.audienceMatch ||
        "-";

    const overviewTopTable: DetailTableItem[] = [
        {
            label: "Influencer Payment",
            value: influencerPayment,
        },
        {
            label: "Milestones",
            value: milestonesText,
        },
        {
            label: "Total Deliverables",
            value: String(totalDeliverables || 0).padStart(2, "0"),
        },
    ];

    const overviewBottomTable: DetailTableItem[] = [
        {
            label: "Content Format",
            value: contentFormats.length > 0 ? contentFormats.join(", ") : "-",
        },
        {
            label: "Content Language",
            value: contentLanguages,
        },
        {
            label: "Active date",
            value: activeDate,
        },
    ];

    const paymentTable: DetailTableItem[] = [
        {
            label: "Influencer Payment",
            value: influencerPayment,
        },
        {
            label: "Milestones",
            value: milestonesText,
        },
        {
            label: "Total Deliverables",
            value: String(totalDeliverables || 0).padStart(2, "0"),
        },
    ];

    const header = {
        profileName,
        profileHandle,
        profileImage,
        profileBio,
        profileVerified,
        profileLocation,
        accountType,
        providerKey,
        providerLabel,
        primaryCategory,
        categoryText,
        profileUrl,
    };

    const overview = {
        influencerPayment,
        totalMilestones,
        totalDeliverables,
        milestonesText,
        contentFormats,
        contentPlatforms,
        contentLanguages,
        activeDate,

        avgViews,
        audienceMatch,
        credibilityScore,
        engagementRate,
        engagementTrend,
        followersText,
        avgEngagementText,
        profileFollowers,

        chartData,
        yAxisTicks,
        chartDomainMax,

        overviewTopTable,
        overviewBottomTable,
    };

    const milestonesTab = {
        milestones,
        totalMilestones,
        totalDeliverables,
    };

    const payment = {
        influencerPayment,
        milestonesText,
        totalDeliverables,
        printableContractId,
        contractFileName: "BrandxInfluencer_contract.pdf",
        contractSize: "-",
        paymentTable,
    };


    return {
        raw: {
            manageInfo,
            influencer,
            contract,
            page1Primary,
            page1Data,
            providerProfile,
            providerRaw,
        },

        header,
        profileUrl,
        overview,
        milestonesTab,
        payment,

        influencer,
        contract,

        profileName,
        profileHandle,
        profileImage,
        profileBio,
        profileVerified,
        profileLocation,
        accountType,
        providerKey,
        providerLabel,
        primaryCategory,
        categoryText,

        contentLanguages,
        contentFormats,
        contentPlatforms,

        influencerPayment,
        totalMilestones,
        totalDeliverables,
        milestonesText,
        activeDate,

        avgViews,
        audienceMatch,
        credibilityScore,
        engagementRate,
        engagementTrend,
        followersText,
        avgEngagementText,
        profileFollowers,

        chartData,
        yAxisTicks,
        chartDomainMax,

        recentPosts: recentPosts.slice(0, 5),
        milestones,

        printableContractId,
        contractFileName: "BrandxInfluencer_contract.pdf",
        contractSize: "-",
    };
};