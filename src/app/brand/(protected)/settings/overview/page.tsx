"use client";

import { CaretDown, Eye, UserCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FloatingInput } from "@/components/ui/floatingInput";
import { get, getApiErrorMessage, postFormData } from "@/lib/api";

type BrandSettingProfile = {
  brandId: string;
  workspaceTitle: string;
  profilePic: string;
  brandName: string;
  brandEmail: string;
  companySize: string;
  pocName: string;
  brandEmailAlias: string;
  industryName: string;
  pocContact: string;
  website: string;
};

type CreditItem = {
  label: string;
  used: number;
  total: number;
  color: "green" | "red";
};

type PlanData = {
  planName: string;
  planTitle: string;
  monthlyCost: number;
  billingCycle: string;
  creditUsage: CreditItem[];
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  relation: "You" | "Other" | "Others" | string;
  role: string;
  access: string;
  action: string;
};

type UsersData = {
  used: number;
  total: number;
  noSeatsAvailable: boolean;
  items: UserItem[];
};

type WorkspaceItem = {
  id: string;
  name: string;
  email: string;
  logo: string;
  relation: "You" | "Other" | "Others" | string;
  role: string;
  meta: string;
  action: string;
};

type WorkspacesData = {
  used: number;
  total: number;
  limitReached: boolean;
  items: WorkspaceItem[];
};

type OverviewPayload = {
  message?: string;
  profileCompleted?: boolean;
  profile?: Partial<BrandSettingProfile>;
  plan?: Partial<PlanData>;
  users?: Partial<UsersData>;
  workspaces?: Partial<WorkspacesData>;
};

type OverviewResponse = OverviewPayload & {
  success?: boolean;
  data?: OverviewPayload;
};

type ReadonlyField = {
  label: string;
  value: string;
  muted?: boolean;
};

const PROFILE_ALERT_DISMISSED_KEY_PREFIX =
  "collabglam:brand-settings:profile-alert-dismissed";

const getProfileAlertDismissedKey = (brandId?: string) =>
  `${PROFILE_ALERT_DISMISSED_KEY_PREFIX}:${brandId || "current"}`;

const emptyProfile: BrandSettingProfile = {
  brandId: "",
  workspaceTitle: "Brand’s Workspace",
  profilePic: "",
  brandName: "",
  brandEmail: "",
  companySize: "",
  pocName: "",
  brandEmailAlias: "",
  industryName: "",
  pocContact: "",
  website: "",
};

const emptyPlan: PlanData = {
  planName: "free",
  planTitle: "FREE PLAN",
  monthlyCost: 0,
  billingCycle: "monthly",
  creditUsage: [
    { label: "Influencer Search", used: 0, total: 20, color: "green" },
    { label: "Influencer Profile Views", used: 0, total: 3, color: "green" },
    { label: "Invites Per Month", used: 0, total: 3, color: "red" },
    { label: "Active Campaign", used: 0, total: 10, color: "green" },
  ],
};

const emptyUsers: UsersData = {
  used: 0,
  total: 3,
  noSeatsAvailable: false,
  items: [],
};

const emptyWorkspaces: WorkspacesData = {
  used: 0,
  total: 1,
  limitReached: false,
  items: [],
};

const cleanValue = (value: unknown) => String(value || "").trim();

const displayValue = (value: unknown) => {
  const cleaned = cleanValue(value);
  return cleaned || "-";
};

const normalizeOverview = (response: OverviewResponse) => {
  const payload = response.data || response;
  const rawProfile = payload.profile || {};
  const rawPlan = payload.plan || {};
  const rawUsers = payload.users || {};
  const rawWorkspaces = payload.workspaces || {};

  const brandName = cleanValue(rawProfile.brandName);

  const profile: BrandSettingProfile = {
    brandId: cleanValue(rawProfile.brandId),
    workspaceTitle:
      cleanValue(rawProfile.workspaceTitle) ||
      `${brandName || "Brand"}’s Workspace`,
    profilePic: cleanValue(rawProfile.profilePic),
    brandName,
    brandEmail: cleanValue(rawProfile.brandEmail),
    companySize: cleanValue(rawProfile.companySize),
    pocName: cleanValue(rawProfile.pocName),
    brandEmailAlias: cleanValue(rawProfile.brandEmailAlias),
    industryName: cleanValue(rawProfile.industryName),
    pocContact: cleanValue(rawProfile.pocContact),
    website: cleanValue(rawProfile.website),
  };

  const plan: PlanData = {
    planName: cleanValue(rawPlan.planName) || emptyPlan.planName,
    planTitle: cleanValue(rawPlan.planTitle) || emptyPlan.planTitle,
    monthlyCost: Number(rawPlan.monthlyCost ?? 0),
    billingCycle: cleanValue(rawPlan.billingCycle) || "monthly",
    creditUsage: Array.isArray(rawPlan.creditUsage)
      ? rawPlan.creditUsage.map((item) => ({
          label: cleanValue(item.label),
          used: Number(item.used || 0),
          total: Number(item.total || 0),
          color: item.color === "red" ? "red" : "green",
        }))
      : emptyPlan.creditUsage,
  };

  const fallbackUser: UserItem = {
    id: profile.brandId,
    name: profile.pocName || profile.brandName || "Brand User",
    email: profile.brandEmail,
    avatar: profile.profilePic,
    relation: "You",
    role: "Owner",
    access: "Owner",
    action: "Transfer Ownership",
  };

  const userItems = Array.isArray(rawUsers.items)
    ? (rawUsers.items as UserItem[])
    : [];

  const users: UsersData = {
    used: Number(rawUsers.used || userItems.length || 1),
    total: Number(rawUsers.total || 3),
    noSeatsAvailable: Boolean(rawUsers.noSeatsAvailable),
    items: userItems.length ? userItems : [fallbackUser],
  };

  const fallbackWorkspace: WorkspaceItem = {
    id: profile.brandId,
    name: `${profile.brandName || "Brand"} workspace`,
    email: profile.brandEmail,
    logo: profile.profilePic,
    relation: "You",
    role: "Owner",
    meta: "Created by you",
    action: "Delete",
  };

  const workspaceItems = Array.isArray(rawWorkspaces.items)
    ? (rawWorkspaces.items as WorkspaceItem[])
    : [];

  const workspaces: WorkspacesData = {
    used: Number(rawWorkspaces.used || workspaceItems.length || 1),
    total: Number(rawWorkspaces.total || 1),
    limitReached: Boolean(rawWorkspaces.limitReached),
    items: workspaceItems.length ? workspaceItems : [fallbackWorkspace],
  };

  return {
    profile,
    plan,
    users,
    workspaces,
    profileCompleted: Boolean(payload.profileCompleted),
  };
};

const EmptyStateIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="88"
      height="88"
      viewBox="0 0 88 88"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.70688 26.3162C4.52756 22.9572 3.41304 18.8644 4.19492 14.716C4.5661 12.7375 5.32426 10.8517 6.42585 9.1668C7.52748 7.48191 8.95088 6.0311 10.6144 4.89752C12.278 3.76394 14.1489 2.96993 16.12 2.56103C18.0911 2.15212 20.1235 2.13637 22.1007 2.51467C24.0779 2.89297 25.961 3.65789 27.6419 4.76552C29.3228 5.87318 30.7685 7.30177 31.8961 8.96941C33.0237 10.637 33.811 12.5108 34.2128 14.4834C34.6146 16.4559 34.6231 18.4884 34.2377 20.4642C33.2428 25.7719 30.3573 29.3768 24.7253 31.9271C22.0022 33.1608 11.7612 34.1055 6.70688 26.3162ZM11.3929 15.3857C11.7568 16.574 12.4168 17.6503 13.3111 18.5134C14.2053 19.3764 15.3043 19.9979 16.5048 20.3194C17.7053 20.6409 18.9678 20.6518 20.1737 20.3512C21.3796 20.0505 22.4892 19.4482 23.3983 18.6008C28.5995 13.7494 24.4103 5.05892 17.3091 6.04979C16.2726 6.20564 15.2816 6.5825 14.4035 7.15481C13.5253 7.72712 12.7805 8.48154 12.2194 9.36695C11.6583 10.2523 11.2941 11.248 11.1515 12.2864C11.0089 13.3249 11.0913 14.3819 11.3929 15.3857ZM13.8006 31.0875C13.764 31.2121 13.8758 31.2385 13.9915 31.2767C21.3866 33.7275 28.1388 30.9951 31.6492 25.4375C31.7402 25.2941 31.7473 25.2584 31.6157 25.1524C26.9698 20.6191 15.4052 23.7395 13.8006 31.0875Z"
        fill="#969696"
      />
      <path
        d="M20.6289 10.2725C20.6201 12.0572 18.4144 12.8245 18.3233 14.3412C18.2824 15.0179 19.0972 15.4685 18.5904 15.8812C18.1825 16.2121 17.6866 15.3532 17.548 14.5775C17.5398 14.3228 17.5606 14.068 17.61 13.818C17.9229 12.2917 19.9346 11.5784 19.7612 10.1396C19.5878 8.70085 17.9845 8.95649 16.8396 10.0842C16.4172 10.5 16.5114 10.8062 16.3864 11.0434C16.2214 11.3549 15.7999 11.1433 15.7638 10.7952C15.6028 9.24557 18.7294 7.05833 20.2901 9.19277C20.5188 9.50561 20.6379 9.88515 20.6289 10.2725Z"
        fill="#969696"
      />
      <path
        d="M18.9429 18.0628C18.8626 18.0174 18.7939 17.954 18.7423 17.8775C18.6908 17.8011 18.6577 17.7136 18.6457 17.6222C18.6337 17.5307 18.6431 17.4377 18.6733 17.3506C18.7033 17.2634 18.7533 17.1844 18.8192 17.1198C18.8761 17.0627 18.9451 17.0191 19.0211 16.9921C19.0971 16.9651 19.1781 16.9555 19.2583 16.9639C19.3385 16.9724 19.4158 16.9987 19.4844 17.0409C19.5531 17.0831 19.6115 17.1401 19.6552 17.2078C19.9074 17.6426 19.4603 18.3259 18.9429 18.0628Z"
        fill="#969696"
      />
      <path
        d="M9.03801 78.8213C15.279 77.1123 30.5377 75.2295 36.9635 74.4701C52.3943 72.6463 68.4613 71.1195 83.8675 70.4063C83.9141 70.4058 83.9595 70.4234 83.9938 70.4555C84.0281 70.4872 84.0483 70.5312 84.051 70.5779C84.0536 70.6249 84.0378 70.6707 84.0074 70.7063C83.9771 70.742 83.934 70.7644 83.8873 70.7688C64.7002 72.0448 20.4191 76.7269 9.21005 79.5627C8.97861 79.6207 8.80965 78.8837 9.03801 78.8213Z"
        fill="#969696"
      />
      <path
        d="M62.7053 50.534C62.6081 50.314 63.0476 50.5622 63.2104 50.105C63.5981 49.0147 63.6029 48.6728 63.0987 48.2953C62.4985 47.9081 61.8521 47.5975 61.1745 47.3713C61.0051 47.3194 61.3712 47.1513 61.7875 46.6444C61.8931 46.5164 61.8601 46.5657 62.8659 47.0677C64.0931 47.6806 64.1696 47.6129 64.3179 48.0071C64.5106 48.4625 64.8657 48.8299 65.3145 49.0376C66.2249 49.5018 67.1101 49.9435 67.8366 49.1718C67.9272 49.0754 67.9211 49.0864 68.4288 49.3544C70.7533 50.5807 70.6895 50.3413 70.7445 50.5983C70.8083 50.8706 70.9355 51.1241 71.1155 51.3379C71.2954 51.5522 71.5229 51.7207 71.7803 51.8303C72.5261 52.2302 72.9023 52.5114 73.6565 52.2535C75.8565 51.5011 77.1628 48.393 76.1596 47.4039C75.3003 46.5573 74.8339 45.973 73.6463 46.2339C73.4624 46.2744 73.6098 46.2757 71.2915 44.653C71.0508 44.4845 71.0473 44.4422 71.0847 44.3049C71.1225 44.1628 71.126 44.0137 71.0948 43.8698C71.0635 43.726 70.9984 43.5917 70.9047 43.4782C69.6107 41.7688 68.4407 41.8304 68.0227 41.8564C67.9827 41.861 67.9417 41.8563 67.9035 41.8427C67.8652 41.829 67.8309 41.8068 67.8027 41.7776C65.9107 39.5983 52.569 30.3332 49.328 28.1491C49.0059 27.9317 49.2074 27.8582 49.1221 27.5581C48.8141 26.4727 47.1667 25 46.1741 24.6176C42.2475 23.1053 37.4638 28.1601 37.8765 32.3207C38.1036 34.6087 39.2669 35.4729 41.3627 36.3036C41.7338 36.4477 42.1351 36.4967 42.53 36.4461C42.9426 36.3313 43.3388 36.1639 43.7087 35.9481C44.0973 35.6907 43.8918 36.3463 56.1607 43.4404C56.357 43.5539 56.276 43.5442 56.269 43.7669C56.232 44.6354 56.4239 45.4978 56.8256 46.2687C56.9184 46.4447 56.7816 46.3567 56.2052 46.3395C54.6841 46.2911 54.5508 46.7214 54.5455 48.2192C54.5455 48.532 54.7259 48.6728 55.0387 48.8479C55.4972 49.1053 55.5148 49.1177 55.4884 49.2079C55.4391 49.3759 42.9801 84.4422 42.9607 84.9909C42.9462 85.408 43.388 85.7257 43.7967 85.7992C43.8913 85.8163 44.2702 84.88 44.9495 83.1719C46.5533 79.1402 50.6629 69.2956 51.3964 67.4265C57.5767 51.6745 56.6839 53.8111 57.567 51.6397C57.6941 51.3273 57.6906 51.5909 57.7641 52.8229C57.7989 53.4033 59.8075 82.0055 59.9236 83.369C60.0283 84.5909 60.0789 84.5883 60.2461 84.601C60.4327 84.6481 60.6281 84.649 60.8151 84.6041C61.0025 84.5592 61.1759 84.4695 61.3211 84.3432C61.5499 84.066 61.4751 83.9679 61.373 81.0872C61.3149 79.4517 60.3491 52.514 60.357 52.5131C60.357 51.3691 70.5545 76.7668 73.9803 84.392C74.1193 84.7 74.3068 84.554 74.7881 84.3177C74.9628 84.1962 75.0887 84.0167 75.1428 83.8108C75.1969 83.6049 75.1762 83.3866 75.0843 83.1948C73.6714 79.3958 62.7053 50.534 62.7053 50.534Z"
        fill="#969696"
      />
      <path
        d="M73.0678 51.1134C73.3423 51.7734 74.5013 51.1108 75.1327 50.0658C75.42 49.5906 75.7025 49.0758 75.6105 48.6015C75.5005 48.0295 74.8441 48.0937 74.4151 48.4162C73.6235 49.0107 72.7981 50.2722 73.0678 51.1134Z"
        fill="#969696"
      />
      <path
        d="M20.3237 49.5516C20.7936 49.5516 20.7729 49.578 20.7637 49.4196C20.7637 49.4196 20.6902 48.6839 20.6237 47.7814C20.6031 47.5007 21.2063 47.2275 21.2653 48.8872C21.2917 49.6352 21.3321 49.5912 21.4624 49.5942C23.1265 49.6294 23.148 49.5467 23.2074 49.6893C23.2615 49.8213 22.5413 50.0232 22.4027 50.0492C21.3946 50.2366 21.3907 50.0492 21.3907 50.3291C21.403 52.196 21.3977 51.8207 21.4448 52.2043C21.454 52.2778 21.3735 52.2761 21.3449 52.2541C21.0505 52.0283 20.9049 50.9622 20.8935 50.7061C20.8644 50.1236 20.8209 50.1588 20.7056 50.15C19.8797 50.0866 19.6791 50.1038 19.6659 49.9154C19.6381 49.5282 19.9334 49.5516 20.3237 49.5516Z"
        fill="#969696"
      />
      <path
        d="M52.6722 10.2787C52.6722 11.2027 52.6322 11.1851 52.7915 11.1855C53.4246 11.1855 53.5835 11.2062 53.8197 11.2199C54.056 11.2335 54.0345 11.4007 53.9205 11.4707C53.6055 11.6607 53.2438 11.7597 52.8759 11.7567C52.5987 11.7835 52.7285 11.6898 52.5886 12.9785C52.509 13.7155 52.4408 14.009 52.2982 13.9065C52.0364 13.7182 52.0835 12.4677 52.0417 11.886C52.032 11.7461 52.0619 11.7329 51.3588 11.7342C51.2224 11.7342 51.0381 11.7505 50.998 11.5842C50.9369 11.3299 50.98 11.2053 51.482 11.1882C52.0615 11.1671 52.0822 11.208 52.0879 11.0791C52.0993 10.5226 52.1411 9.96722 52.2133 9.41542C52.2133 9.35496 52.2375 9.29697 52.2802 9.25425C52.3229 9.21152 52.3809 9.1875 52.4412 9.1875C52.5015 9.1875 52.5596 9.21152 52.6023 9.25425C52.6449 9.29697 52.6691 9.35496 52.6691 9.41542C52.685 9.70292 52.6859 9.99107 52.6722 10.2787Z"
        fill="#969696"
      />
      <path
        d="M75.7791 25.5262C75.8953 25.5622 75.6638 25.7735 75.4711 25.858C75.2555 25.925 75.0329 25.9677 74.8076 25.9851C74.7561 25.993 74.658 25.9851 74.6417 26.0648C74.5814 26.3648 74.5559 26.796 74.438 27.5168C74.35 28.0553 74.2572 28.0936 74.174 28.1064C74.1093 28.116 73.998 28.032 74.0059 27.5414C74.0165 26.9844 74.0468 26.2302 74.0622 26.1413C74.082 26.0296 73.8651 26.056 73.2984 26.1167C73.2416 26.1231 73.1849 26.1092 73.1374 26.0775C73.0903 26.0457 73.0555 25.9981 73.0401 25.9433C73.0247 25.8884 73.0296 25.8298 73.0533 25.7781C73.0771 25.7264 73.1184 25.6848 73.1704 25.6608C73.4251 25.5336 73.7014 25.4547 73.9852 25.428C74.0358 25.4162 74.0944 25.4509 74.123 25.37C74.2246 25.0848 74.1978 24.3699 74.291 24.006C74.3905 23.6175 74.6725 23.7318 74.68 24.0288C74.7288 26.1118 74.4257 25.1055 75.7791 25.5262Z"
        fill="#969696"
      />
    </svg>
  );
};

const Avatar = ({
  src,
  label,
  size = "md",
}: {
  src?: string;
  label: string;
  size?: "md" | "lg";
}) => {
  const dimension = size === "lg" ? "h-24 w-24" : "h-10 w-10";

  return (
    <div
      className={`relative flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-full bg-black`}
    >
      {src ? (
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="font-inter text-sm font-bold text-white">
          {label?.slice(0, 2).toUpperCase() || "CG"}
        </span>
      )}
    </div>
  );
};

const OverviewPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<BrandSettingProfile>(emptyProfile);
  const [plan, setPlan] = useState<PlanData>(emptyPlan);
  const [users, setUsers] = useState<UsersData>(emptyUsers);
  const [workspaces, setWorkspaces] =
    useState<WorkspacesData>(emptyWorkspaces);

  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileAlertDismissed, setProfileAlertDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");

  const workspaceTitle = useMemo(() => {
    return (
      profile.workspaceTitle || `${profile.brandName || "Brand"}’s Workspace`
    );
  }, [profile.brandName, profile.workspaceTitle]);

  const readonlyFields: ReadonlyField[] = [
    { label: "Brand Name", value: profile.brandName },
    { label: "Brand Email", value: profile.brandEmail, muted: true },
    { label: "Company Size", value: profile.companySize },
    { label: "POC Name", value: profile.pocName },
    { label: "Brand Email Alias", value: profile.brandEmailAlias, muted: true },
    { label: "Industry Name", value: profile.industryName },
    { label: "POC Contact", value: profile.pocContact },
    { label: "Website", value: profile.website },
  ];

  const applyOverview = (response: OverviewResponse) => {
    const normalized = normalizeOverview(response);

    setProfile(normalized.profile);
    setPlan(normalized.plan);
    setUsers(normalized.users);
    setWorkspaces(normalized.workspaces);
    setProfileCompleted(normalized.profileCompleted);

    if (typeof window !== "undefined") {
      const alertKey = getProfileAlertDismissedKey(
        normalized.profile.brandId
      );

      setProfileAlertDismissed(localStorage.getItem(alertKey) === "true");
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError("");

      const response: OverviewResponse =
        await get<OverviewResponse>("/brand/setting/overview");

      applyOverview(response);
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to fetch brand settings."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDismissProfileAlert = () => {
    const alertKey = getProfileAlertDismissedKey(profile.brandId);

    try {
      localStorage.setItem(alertKey, "true");
    } catch {}

    setProfileAlertDismissed(true);
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setPhotoUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("brandProfilePic", file);

      const response: OverviewResponse = await postFormData<OverviewResponse>(
        "/brand/setting/profile/photo",
        formData
      );

      applyOverview(response);
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to update profile photo."
      );
      setError(message);
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  const shouldShowProfileAlert = !profileCompleted && !profileAlertDismissed;

  if (loading) {
    return (
      <div className="flex min-h-[25rem] w-full items-center justify-center bg-white">
        <p className="font-inter text-base font-medium leading-6 text-[#969696]">
          Loading settings...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="flex w-full flex-col gap-8">
        <section>
          <h1 className="font-inter text-[1.5rem] font-bold leading-8 tracking-[0] text-[#1A1A1A]">
            {workspaceTitle}
          </h1>

          {shouldShowProfileAlert ? (
            <div className="mt-6 flex min-h-[4rem] w-full items-center gap-3 rounded-[0.5rem] bg-[#FDE8DF] px-4 py-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#FF6B3D] text-xs font-bold text-[#FF6B3D]">
                !
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-inter text-sm font-semibold leading-5 text-[#1A1A1A]">
                  Profile Not Completed.
                </p>
                <p className="font-inter text-xs font-normal leading-4 text-[#969696]">
                  Complete the onboarding questions to finish setting up your
                  account.
                </p>
              </div>

              <button
                type="button"
                aria-label="Dismiss profile incomplete alert"
                onClick={handleDismissProfileAlert}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-xl leading-none text-[#1A1A1A]"
              >
                ×
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-[0.5rem] border border-[#FAD8D4] bg-[#FFF5F4] px-4 py-3 font-inter text-sm font-medium leading-5 text-[#E35141]">
              {error}
            </div>
          ) : null}
        </section>

        <section>
          <h2 className="font-inter text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
            Profile
          </h2>

          <p className="mt-1 font-inter text-[0.875rem] font-normal leading-5 tracking-[0] text-[#969696]">
            This is where you manage profile details specific to you. To manage
            what communication you receive from Collabglam.
          </p>

          <div className="mt-10">
            <p className="font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
              Profile Picture
            </p>

            <div className="mt-4 flex items-center gap-4">
              <Avatar
                src={profile.profilePic}
                label={profile.brandName || "Brand"}
                size="lg"
              />

              <div>
                <h3 className="font-inter text-base font-semibold leading-6 text-[#1A1A1A]">
                  Upload your photo
                </h3>

                <p className="font-inter text-xs font-normal leading-4 text-[#969696]">
                  Photo should be at least 250px × 250px
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />

                  <button
                    type="button"
                    onClick={handleChangePhoto}
                    disabled={photoUploading}
                    className="flex h-8 items-center justify-center rounded-[0.375rem] bg-black px-5 font-inter text-sm font-medium leading-5 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {photoUploading ? "Updating..." : "Change Photo"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className="mb-3 font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
              Personal Info
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {readonlyFields.map((field) => (
                <FloatingInput
                  key={field.label}
                  label={field.label}
                  value={displayValue(field.value)}
                  readOnly
                  disabled={field.muted}
                  icon={false}
                  className="my-0"
                  aria-readonly="true"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1rem] border border-[#E6E6E6] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-center font-inter text-base font-semibold leading-6 tracking-[0] text-[#1A1A1A]">
              {plan.planTitle}
            </p>

            <button
              type="button"
              className="flex h-8 items-center justify-center rounded-[0.375rem] border border-[#E6E6E6] bg-white px-5 font-inter text-sm font-medium leading-5 text-[#1A1A1A]"
            >
              Upgrade
            </button>
          </div>

          <div className="mt-4">
            <h2 className="text-center font-inter text-[2rem] font-semibold leading-10 tracking-[-0.0625rem] text-[#1A1A1A] sm:text-left">
              Credit Usage
            </h2>

            <div className="mt-2 flex items-end gap-1">
              <span className="font-inter text-base font-bold leading-6 text-[#1A1A1A]">
                $
              </span>
              <span className="font-inter text-[1.75rem] font-bold leading-9 text-[#1A1A1A]">
                {Number.isFinite(plan.monthlyCost) ? plan.monthlyCost : 0}
              </span>
              <span className="mb-1 font-inter text-sm font-medium leading-5 text-[#969696]">
                Per month
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {plan.creditUsage.map((item) => {
              const percentage =
                item.total > 0
                  ? Math.min((item.used / item.total) * 100, 100)
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-inter text-sm font-medium leading-5 text-[#969696]">
                      {item.label}
                    </p>
                    <p className="font-inter text-sm font-medium leading-5 text-[#969696]">
                      {item.used} of {item.total}
                    </p>
                  </div>

                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#EDEDED]">
                    <div
                      className={`h-full rounded-full ${
                        item.color === "red" ? "bg-[#F49A8F]" : "bg-[#39B56A]"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-inter text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
              Users
            </h2>

            <p className="font-inter text-base font-medium leading-6 text-[#969696]">
              {String(users.used).padStart(2, "0")} of{" "}
              {String(users.total).padStart(2, "0")}
            </p>
          </div>

          <div className="flex flex-col divide-y divide-[#E6E6E6]">
            {users.items.map((user) => (
              <div
                key={user.id || user.email}
                className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {user.avatar ? (
                    <Avatar src={user.avatar} label={user.name} />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black">
                      <UserCircle
                        size={24}
                        weight="fill"
                        className="text-white"
                      />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-inter text-base font-semibold leading-6 text-[#1A1A1A]">
                        {displayValue(user.name)}
                      </p>

                      <span
                        className={`font-inter text-xs font-semibold leading-4 ${
                          user.relation === "You"
                            ? "text-[#FFBF00]"
                            : "text-[#969696]"
                        }`}
                      >
                        {user.relation}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-inter text-sm font-normal leading-5 text-[#969696]">
                        {displayValue(user.email)}
                      </p>
                      <span className="font-inter text-sm font-normal leading-5 text-[#969696]">
                        {displayValue(user.role)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    className="flex h-8 items-center justify-center rounded-[0.375rem] border border-[#E6E6E6] bg-white px-5 font-inter text-sm font-medium leading-5 text-[#1A1A1A]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="flex h-8 items-center justify-center gap-2 rounded-[0.375rem] border border-[#E6E6E6] bg-white px-4 font-inter text-sm font-medium leading-5 text-[#1A1A1A]"
                  >
                    {displayValue(user.action)}
                    <CaretDown size={14} />
                  </button>

                  <button
                    type="button"
                    aria-label="View user"
                    className="flex h-8 w-8 items-center justify-center text-[#1A1A1A]"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {users.noSeatsAvailable ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <EmptyStateIcon />

              <h3 className="mt-4 font-inter text-base font-bold leading-6 text-[#1A1A1A]">
                No Seats Available
              </h3>

              <p className="mt-1 max-w-[28rem] text-center font-inter text-[0.875rem] font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                All seats in your current plan are in use. Upgrade your plan to
                add more team members.
              </p>

              <button
                type="button"
                className="mt-4 flex h-8 items-center justify-center rounded-[0.375rem] bg-black px-5 font-inter text-sm font-medium leading-5 text-white"
              >
                Upgrade to add Users
              </button>
            </div>
          ) : null}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-inter text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
              Workspaces
            </h2>

            <p className="font-inter text-base font-medium leading-6 text-[#969696]">
              {String(workspaces.used).padStart(2, "0")} of{" "}
              {String(workspaces.total).padStart(2, "0")}
            </p>
          </div>

          <div className="flex flex-col divide-y divide-[#E6E6E6]">
            {workspaces.items.map((workspace) => (
              <div
                key={workspace.id || workspace.name}
                className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    src={workspace.logo}
                    label={workspace.name || "Workspace"}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-inter text-base font-semibold leading-6 text-[#1A1A1A]">
                        {displayValue(workspace.name)}
                      </p>

                      <span
                        className={`font-inter text-xs font-semibold leading-4 ${
                          workspace.relation === "You"
                            ? "text-[#FFBF00]"
                            : "text-[#969696]"
                        }`}
                      >
                        {workspace.relation}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-inter text-sm font-normal leading-5 text-[#969696]">
                        {displayValue(workspace.email)}
                      </p>
                      <span className="font-inter text-sm font-normal leading-5 text-[#969696]">
                        {displayValue(workspace.role)}
                      </span>
                      <span className="font-inter text-sm font-normal leading-5 text-[#969696]">
                        {displayValue(workspace.meta)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    type="button"
                    className="flex h-8 items-center justify-center rounded-[0.375rem] border border-[#E6E6E6] bg-white px-5 font-inter text-sm font-medium leading-5 text-[#1A1A1A]"
                  >
                    View members
                  </button>

                  <button
                    type="button"
                    className="flex h-8 items-center justify-center rounded-[0.375rem] border border-[#E6E6E6] bg-white px-5 font-inter text-sm font-medium leading-5 text-[#B8B8B8]"
                  >
                    {displayValue(workspace.action)}
                  </button>

                  <button
                    type="button"
                    aria-label="Workspace details"
                    className="flex h-8 w-8 items-center justify-center text-[#1A1A1A]"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {workspaces.limitReached ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <EmptyStateIcon />

              <h3 className="mt-4 font-inter text-base font-bold leading-6 text-[#1A1A1A]">
                Workspace Limit Reached
              </h3>

              <p className="mt-1 max-w-[34rem] text-center font-inter text-[0.875rem] font-medium leading-5 tracking-[0] text-[#B8B8B8]">
                You’ve reached the maximum number of workspaces allowed in your
                current plan. Upgrade your plan to create and manage additional
                workspaces.
              </p>

              <button
                type="button"
                className="mt-4 flex h-8 items-center justify-center rounded-[0.375rem] bg-black px-5 font-inter text-sm font-medium leading-5 text-white"
              >
                Upgrade for more workspace
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default OverviewPage;