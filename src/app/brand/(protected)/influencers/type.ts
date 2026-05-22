export type QA = {
    question?: string;
    answer?: string;
    [key: string]: any;
};

export type SocialPlatformName = "instagram" | "youtube" | "tiktok" | string;

export type PlatformKey = "instagram" | "youtube" | "tiktok";

export type ManageTabKey =
    | "overview"
    | "milestones"
    | "payment"

export type ManageTabDefinition = {
    key: ManageTabKey;
    label: string;
};

export type CategoryItem = {
    _id?: string;
    id?: string;
    name?: string;
    title?: string;
    categoryName?: string;
    categoryId?: string | null;
    subcategoryId?: string | null;
    subcategoryName?: string | null;
    [key: string]: any;
};

export type LanguageItem = {
    code?: string;
    name?: string;
    label?: string;
    title?: string;
    weight?: number;
    [key: string]: any;
};

export type StatHistoryItem = {
    month?: string;
    day?: string;
    label?: string;
    followers?: number;
    avgLikes?: number;
    avg_likes?: number;
    avgComments?: number;
    avg_engagements?: number;
    avgViews?: number;
    engagement?: number;
    value?: number;
    [key: string]: any;
};

export type RecentPost = {
    id?: string;
    text?: string;
    url?: string;
    created?: string;
    type?: string;
    likes?: number;
    comments?: number;
    views?: number;
    plays?: number;
    videoViews?: number;
    thumbnail?: string;
    image?: string;
    hashtags?: string[];
    [key: string]: any;
};

export type PlatformProfile = {
    userId?: string;
    username?: string;
    fullname?: string;
    handle?: string;
    url?: string;
    picture?: string;
    profilePic?: string;
    followers?: number;
    followerCount?: number;
    engagements?: number;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    bio?: string;
    isVerified?: boolean;
    verified?: boolean;
    [key: string]: any;
};

export type InfluencerPlatformData = {
    profile?: PlatformProfile;
    isPrivate?: boolean;
    isVerified?: boolean;
    accountType?: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    language?: string | LanguageItem;
    statsByContentType?: Record<string, any>;
    stats?: Record<string, any>;
    recentPosts?: RecentPost[];
    popularPosts?: RecentPost[];
    postsCount?: number;
    avgLikes?: number;
    avgComments?: number;
    bio?: string;
    categories?: CategoryItem[];
    hashtags?: any[];
    mentions?: any[];
    brandAffinity?: any[];
    audience?: any;
    audienceExtra?: any;
    providerRaw?: any;
    [key: string]: any;
};

export type InfluencerPage1 = {
    platform?: SocialPlatformName;
    handle?: string;
    username?: string;
    data?: InfluencerPlatformData;
    isPrimary?: boolean;
    [key: string]: any;
};

export type InfluencerSocialProfile = {
    provider?: SocialPlatformName;
    platform?: SocialPlatformName;
    handle?: string;
    username?: string;
    followers?: number;
    followerCount?: number;
    url?: string;
    profileUrl?: string;
    picture?: string;
    profilePic?: string;
    fullname?: string;
    name?: string;
    accountType?: string;
    engagementRate?: number;
    engagements?: number;
    bio?: string;
    isVerified?: boolean;
    verified?: boolean;
    providerRaw?: any;
    modashData?: any;
    modash?: any;
    statsByContentType?: Record<string, any>;
    recentPosts?: RecentPost[];
    popularPosts?: RecentPost[];
    statHistory?: StatHistoryItem[];
    history?: StatHistoryItem[];
    [key: string]: any;
};

export type InfluencerDetails = {
    _id?: string;
    id?: string;

    name?: string;
    creatorName?: string;
    email?: string;
    phone?: string;

    countryId?: string;
    countryName?: string;
    country?: any;

    languageIds?: string[];
    languages?: LanguageItem[];

    categoryIds?: string[];
    categories?: CategoryItem[];

    profilePic?: string;
    bio?: string;

    page1?: InfluencerPage1[];
    page2?: QA[];
    page3?: QA[];

    onboarding?: {
        page1Done?: boolean;
        page2Done?: boolean;
        page3Done?: boolean;
    };

    ispage2Skip?: boolean;
    ispage3Skip?: boolean;

    proxyEmail?: string;
    socialProfiles?: InfluencerSocialProfile[] | Record<string, InfluencerSocialProfile>;

    createdAt?: string;
    updatedAt?: string;

    contract?: any;
    modashData?: any;

    [key: string]: any;
};

export type GetInfluencerByIdResponse = {
    influencer: InfluencerDetails;
};

export type DetailTableItem = {
    label: string;
    value: React.ReactNode;
    sub?: string;
};

export type HeaderDetails = {
    profileName: string;
    profileUrl: string;
    profileHandle: string;
    profileImage: string;
    profileBio: string;
    profileVerified: boolean;
    profileLocation: string;
    accountType: string;
    providerKey: PlatformKey;
    providerLabel: string;
    primaryCategory: string;
    categoryText: string;
};

export type OverviewTabDetails = {
    influencerPayment: string;
    totalMilestones: number;
    totalDeliverables: number;
    milestonesText: string;
    contentFormats: string[];
    contentPlatforms: string[];
    contentLanguages: string;
    activeDate: string;

    avgViews: string;
    audienceMatch: string;
    credibilityScore: string;
    engagementRate: string;
    engagementTrend: string;
    followersText: string;
    avgEngagementText: string;
    profileFollowers: number;

    chartData: Array<{ day: string; engagement: number }>;
    yAxisTicks: number[];
    chartDomainMax: number;

    overviewTopTable: DetailTableItem[];
    overviewBottomTable: DetailTableItem[];
};

export type MilestoneRow = {
    id: string;
    name: string;
    format: string;
    platform: string;
    status: string;
    qty: string;
    deadline: string;
};

export type MilestoneDeliverablesTabDetails = {
    milestones: MilestoneRow[];
    totalMilestones: number;
    totalDeliverables: number;
};

export type PaymentContractTabDetails = {
    influencerPayment: string;
    milestonesText: string;
    totalDeliverables: number;
    printableContractId: string;
    contractFileName: string;
    contractSize: string;
    paymentTable: DetailTableItem[];
};

export type CommunicationTabDetails = {
    influencerName: string;
    email: string;
    proxyEmail: string;
    phone: string;
};

export type RawInfluencerDetails = {
    manageInfo: any;
    influencer: InfluencerDetails;
    contract: any;
    page1Primary: InfluencerPage1;
    page1Data: InfluencerPlatformData;
    providerProfile: PlatformProfile;
    providerRaw: any;
};

export type InfluencerViewModel = {
    raw: RawInfluencerDetails;
    profileUrl: string;
    header: HeaderDetails;
    overview: OverviewTabDetails;
    milestonesTab: MilestoneDeliverablesTabDetails;
    payment: PaymentContractTabDetails;

    influencer: InfluencerDetails;
    contract: any;

    profileName: string;
    profileHandle: string;
    profileImage: string;
    profileBio: string;
    profileVerified: boolean;
    profileLocation: string;
    accountType: string;
    providerKey: PlatformKey;
    providerLabel: string;
    primaryCategory: string;
    categoryText: string;

    contentLanguages: string;
    contentFormats: string[];
    contentPlatforms: string[];

    influencerPayment: string;
    totalMilestones: number;
    totalDeliverables: number;
    milestonesText: string;
    activeDate: string;

    avgViews: string;
    audienceMatch: string;
    credibilityScore: string;
    engagementRate: string;
    engagementTrend: string;
    followersText: string;
    avgEngagementText: string;
    profileFollowers: number;

    chartData: Array<{ day: string; engagement: number }>;
    yAxisTicks: number[];
    chartDomainMax: number;

    recentPosts: RecentPost[];
    milestones: MilestoneRow[];

    printableContractId: string;
    contractFileName: string;
    contractSize: string;
};