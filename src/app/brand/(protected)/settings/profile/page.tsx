"use client";

import { PencilSimple } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FloatingInput } from "@/components/ui/floatingInput";
import { PasswordInput } from "@/components/ui/password";
import {
  FloatingMultiSelect,
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";
import {
  get,
  getApiErrorMessage,
  patch,
  postFormData,
} from "@/lib/api";

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
  companyDetails: string;
  onboarding: {
    brandType: string;
    organizationRole: string;
    preferredPlatform: string;
    preferredPlatforms?: string[];
  };
  demographic: {
    timeZone: string;
    currencyFormat: string;
    region: string;
    preferredLanguage: string;
  };
  auth: {
    isGoogleAccount: boolean;
  };
};

type ProfilePayload = {
  message?: string;
  profileCompleted?: boolean;
  profile?: Partial<BrandSettingProfile>;
};

type ProfileResponse = ProfilePayload & {
  success?: boolean;
  data?: ProfilePayload;
};

type ProfileForm = {
  brandName: string;
  companySize: string;
  pocName: string;
  brandEmailAlias: string;
  industryName: string;
  pocContact: string;
  website: string;
  companyDetails: string;
  brandType: string;
  organizationRole: string;
  preferredPlatforms: string[];
  timeZone: string;
  currencyFormat: string;
  region: string;
  preferredLanguage: string;
};

type PasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

const BRAND_TYPES = [
  "D2C / Consumer Brand",
  "Marketplace",
  "Agency (managing clients)",
  "Startup / Early-stage brand",
  "Enterprise / Established brand",
  "Creator-led / Personal brand",
];

const ROLES = [
  "Founder / Co-founder",
  "Marketing Manager",
  "Brand Manager",
  "Social Media Manager",
  "Growth / Performance Marketer",
  "Agency Account Manager",
  "Other",
];

const PLATFORM_OPTIONS = ["Instagram", "TikTok", "YouTube"].map((platform) => ({
  label: platform,
  value: platform,
}));

const COMPANY_SIZE_OPTIONS = [
  "Solo / Self-employed",
  "2–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];

const INDUSTRY_OPTIONS = [
  "Beauty & Personal Care",
  "Fashion & Apparel",
  "Lifestyle & Home",
  "Health & Fitness",
  "Technology & SaaS",
  "Food & Beverage",
  "Travel & Hospitality",
  "Education",
  "Finance & Fintech",
  "Gaming & Entertainment",
  "Media & Publishing",
  "Real Estate",
  "Sustainability & Eco Brands",
  "Other",
];

const TIME_ZONE_OPTIONS = [
  "GMT+5:30 Indian standard time",
  "GMT-8:00 Pacific standard time",
  "GMT-5:00 Eastern standard time",
  "GMT+0:00 Greenwich mean time",
  "GMT+1:00 Central European time",
];

const CURRENCY_OPTIONS = ["$ Dollars", "₹ Rupees", "€ Euros", "£ Pounds"];

const REGION_OPTIONS = [
  "All",
  "India",
  "United States",
  "United Kingdom",
  "Europe",
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French"];

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
  companyDetails: "",
  onboarding: {
    brandType: "",
    organizationRole: "",
    preferredPlatform: "",
    preferredPlatforms: [],
  },
  demographic: {
    timeZone: "GMT+5:30 Indian standard time",
    currencyFormat: "$ Dollars",
    region: "All",
    preferredLanguage: "English",
  },
  auth: {
    isGoogleAccount: false,
  },
};

const emptyPassword: PasswordForm = {
  newPassword: "",
  confirmPassword: "",
};

const cleanValue = (value: unknown) => String(value || "").trim();

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(cleanValue).filter(Boolean);
  }

  const single = cleanValue(value);
  return single ? [single] : [];
};

const displayArrayValue = (value: string[]) => {
  return value.length ? value.join(", ") : "";
};

const normalizeProfile = (response: ProfileResponse) => {
  const payload = response.data || response;
  const rawProfile = payload.profile || {};

  const rawOnboarding = (rawProfile.onboarding || {}) as Partial<
    BrandSettingProfile["onboarding"]
  >;

  const rawDemographic = (rawProfile.demographic || {}) as Partial<
    BrandSettingProfile["demographic"]
  >;

  const rawAuth = (rawProfile.auth || {}) as Partial<
    BrandSettingProfile["auth"]
  >;

  const brandName = cleanValue(rawProfile.brandName);

  const preferredPlatforms =
    normalizeStringArray(rawOnboarding.preferredPlatforms).length > 0
      ? normalizeStringArray(rawOnboarding.preferredPlatforms)
      : normalizeStringArray(rawOnboarding.preferredPlatform);

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
    companyDetails: cleanValue(rawProfile.companyDetails),

    onboarding: {
      brandType: cleanValue(rawOnboarding.brandType),
      organizationRole: cleanValue(rawOnboarding.organizationRole),
      preferredPlatform: preferredPlatforms[0] || "",
      preferredPlatforms,
    },

    demographic: {
      timeZone:
        cleanValue(rawDemographic.timeZone) ||
        emptyProfile.demographic.timeZone,
      currencyFormat:
        cleanValue(rawDemographic.currencyFormat) ||
        emptyProfile.demographic.currencyFormat,
      region:
        cleanValue(rawDemographic.region) || emptyProfile.demographic.region,
      preferredLanguage:
        cleanValue(rawDemographic.preferredLanguage) ||
        emptyProfile.demographic.preferredLanguage,
    },

    auth: {
      isGoogleAccount: Boolean(rawAuth.isGoogleAccount),
    },
  };

  return {
    profile,
    profileCompleted: Boolean(payload.profileCompleted),
    message: payload.message || response.message || "",
  };
};

const toForm = (profile: BrandSettingProfile): ProfileForm => ({
  brandName: profile.brandName,
  companySize: profile.companySize,
  pocName: profile.pocName,
  brandEmailAlias: profile.brandEmailAlias,
  industryName: profile.industryName,
  pocContact: profile.pocContact,
  website: profile.website,
  companyDetails: profile.companyDetails,
  brandType: profile.onboarding.brandType,
  organizationRole: profile.onboarding.organizationRole,
  preferredPlatforms: profile.onboarding.preferredPlatforms || [],
  timeZone: profile.demographic.timeZone,
  currencyFormat: profile.demographic.currencyFormat,
  region: profile.demographic.region,
  preferredLanguage: profile.demographic.preferredLanguage,
});

const areFormsEqual = (left: ProfileForm, right: ProfileForm) => {
  return JSON.stringify(left) === JSON.stringify(right);
};

const ProfilePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<BrandSettingProfile>(emptyProfile);
  const [form, setForm] = useState<ProfileForm>(toForm(emptyProfile));
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPassword);

  const [profileCompleted, setProfileCompleted] = useState(false);
  const [profileAlertDismissed, setProfileAlertDismissed] = useState(false);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const originalForm = useMemo(() => toForm(profile), [profile]);

  const hasProfileChanges = useMemo(() => {
    return !areFormsEqual(form, originalForm);
  }, [form, originalForm]);

  const hasPasswordChanges = Boolean(
    passwordForm.newPassword || passwordForm.confirmPassword
  );

  const hasAnyChanges = hasProfileChanges || hasPasswordChanges;
  const shouldShowProfileAlert = !profileCompleted && !profileAlertDismissed;
  const inputReadOnly = !editing;

  const applyProfile = (
    response: ProfileResponse,
    options?: { resetForm?: boolean }
  ) => {
    const normalized = normalizeProfile(response);
    const shouldResetForm = options?.resetForm ?? true;

    setProfile(normalized.profile);

    if (shouldResetForm) {
      setForm(toForm(normalized.profile));
    }

    setProfileCompleted(normalized.profileCompleted);

    if (typeof window !== "undefined") {
      const alertKey = getProfileAlertDismissedKey(normalized.profile.brandId);
      setProfileAlertDismissed(localStorage.getItem(alertKey) === "true");
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response: ProfileResponse =
        await get<ProfileResponse>("/brand/setting/profile");

      applyProfile(response);
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to fetch brand profile."
      );
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateField = (key: keyof ProfileForm, value: string) => {
    if (!editing) return;

    setSuccessMessage("");
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateMultiField = (key: "preferredPlatforms", value: string[]) => {
    if (!editing) return;

    setSuccessMessage("");
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updatePasswordField = (key: keyof PasswordForm, value: string) => {
    if (!editing || profile.auth.isGoogleAccount) return;

    setSuccessMessage("");
    setPasswordForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDismissProfileAlert = () => {
    const alertKey = getProfileAlertDismissedKey(profile.brandId);

    try {
      localStorage.setItem(alertKey, "true");
    } catch {}

    setProfileAlertDismissed(true);
  };

  const handleStartEditing = () => {
    setEditing(true);
    setError("");
    setSuccessMessage("");
  };

  const handleCancel = () => {
    setForm(toForm(profile));
    setPasswordForm(emptyPassword);
    setEditing(false);
    setError("");
    setSuccessMessage("");
  };

  const handleUpdateProfile = async () => {
    if (!hasProfileChanges) return null;

    const response: ProfileResponse =
      await patch<ProfileResponse>("/brand/setting/profile", {
        brandName: form.brandName,
        companySize: form.companySize,
        pocName: form.pocName,

        // Brand Email Alias is locked in UI.
        brandEmailAlias: profile.brandEmailAlias,

        industryName: form.industryName,
        pocContact: form.pocContact,
        website: form.website,
        companyDetails: form.companyDetails,

        brandType: form.brandType,
        organizationRole: form.organizationRole,
        preferredPlatforms: form.preferredPlatforms,

        timeZone: form.timeZone,
        currencyFormat: form.currencyFormat,
        region: form.region,
        preferredLanguage: form.preferredLanguage,
      });

    applyProfile(response);
    return response;
  };

  const handleUpdatePassword = async () => {
    if (profile.auth.isGoogleAccount || !hasPasswordChanges) return null;

    const response: ProfileResponse =
      await patch<ProfileResponse>("/brand/setting/profile/password", {
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

    setPasswordForm(emptyPassword);
    return response;
  };

  const handleUpdateAll = async () => {
    if (!hasAnyChanges) return;

    try {
      setSaving(true);
      setPasswordSaving(Boolean(hasPasswordChanges));
      setError("");
      setSuccessMessage("");

      let latestMessage = "Profile updated successfully.";

      if (hasProfileChanges) {
        const response = await handleUpdateProfile();
        latestMessage = response?.message || latestMessage;
      }

      if (hasPasswordChanges) {
        const response = await handleUpdatePassword();
        latestMessage = response?.message || "Password updated successfully.";
      }

      setEditing(false);
      setSuccessMessage(latestMessage);
    } catch (err) {
      const message = await getApiErrorMessage(
        err,
        "Failed to update profile."
      );
      setError(message);
    } finally {
      setSaving(false);
      setPasswordSaving(false);
    }
  };

  const handleChangePhoto = () => {
    if (!editing) return;
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
      setSuccessMessage("");

      const formData = new FormData();
      formData.append("brandProfilePic", file);

      const response: ProfileResponse =
        await postFormData<ProfileResponse>(
          "/brand/setting/profile/photo",
          formData
        );

      applyProfile(response, { resetForm: false });
      setSuccessMessage("Profile photo updated successfully.");
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

  if (loading) {
    return (
      <div className="flex min-h-[25rem] w-full items-center justify-center bg-white">
        <p className="font-inter text-base font-medium leading-6 text-[#969696]">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="flex w-full flex-col gap-8">
        {shouldShowProfileAlert ? (
          <div className="flex min-h-[4rem] w-full items-center gap-3 rounded-[0.5rem] bg-[#FDE8DF] px-4 py-3">
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
          <div className="rounded-[0.5rem] border border-[#FAD8D4] bg-[#FFF5F4] px-4 py-3 font-inter text-sm font-medium leading-5 text-[#E35141]">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[0.5rem] border border-[#D7F3E2] bg-[#F4FFF8] px-4 py-3 font-inter text-sm font-medium leading-5 text-[#249653]">
            {successMessage}
          </div>
        ) : null}

        <section>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-inter text-[1.25rem] font-semibold leading-7 tracking-[0] text-[#1A1A1A]">
                Profile
              </h1>

              <p className="mt-1 font-inter text-[0.875rem] font-normal leading-5 tracking-[0] text-[#969696]">
                This is where you manage profile details specific to you. To
                manage what communication you receive from Collabglam.
              </p>
            </div>

            {!editing ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-[0.5rem] border border-[#E6E6E6] bg-white px-4 font-inter text-sm font-medium leading-5 text-[#1A1A1A]"
              >
                <PencilSimple size={16} />
                Edit Profile
              </button>
            ) : null}
          </div>

          <div className="mt-10">
            <p className="font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
              Profile Picture
            </p>

            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black">
                {profile.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt={profile.brandName || "Brand profile picture"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-inter text-sm font-bold text-white">
                    {profile.brandName?.slice(0, 2).toUpperCase() || "CG"}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-inter text-base font-semibold leading-6 text-[#1A1A1A]">
                  Upload your photo
                </h3>

                <p className="font-inter text-xs font-normal leading-4 text-[#969696]">
                  Photo should be at least 250px × 250px
                </p>

                {editing ? (
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
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-3 font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
            Personal Info
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FloatingInput
              label="Brand Name"
              value={form.brandName}
              readOnly={inputReadOnly}
              icon={editing}
              onValueChange={(value) => updateField("brandName", value)}
              className="my-0"
            />

            <FloatingInput
              label="Brand Email"
              value={profile.brandEmail}
              readOnly={inputReadOnly}
              icon={false}
              className="my-0"
            />

            {editing ? (
              <FloatingSelect
                label="Company Size"
                value={form.companySize}
                icon
                onValueChange={(value) => updateField("companySize", value)}
                className="my-0"
              >
                {COMPANY_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="Company Size"
                value={form.companySize}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            <FloatingInput
              label="POC Name"
              value={form.pocName}
              readOnly={inputReadOnly}
              icon={editing}
              onValueChange={(value) => updateField("pocName", value)}
              className="my-0"
            />

            <FloatingInput
              label="Brand Email Alias"
              value={profile.brandEmailAlias}
              readOnly
              disabled
              icon={false}
              className="my-0"
            />

            {editing ? (
              <FloatingSelect
                label="Industry Name"
                value={form.industryName}
                icon
                onValueChange={(value) => updateField("industryName", value)}
                className="my-0"
              >
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="Industry Name"
                value={form.industryName}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            <FloatingInput
              label="POC Contact"
              value={form.pocContact}
              readOnly={inputReadOnly}
              icon={editing}
              onValueChange={(value) => updateField("pocContact", value)}
              className="my-0"
            />

            <FloatingInput
              label="Website"
              value={form.website}
              readOnly={inputReadOnly}
              icon={editing}
              onValueChange={(value) => updateField("website", value)}
              className="my-0"
            />
          </div>
        </section>

        <section>
          <div className="rounded-[0.75rem] border border-[#E6E6E6] bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-[#E6E6E6] px-4 py-3">
              <p className="font-inter text-base font-medium leading-6 text-[#969696]">
                Company Details
              </p>

              {editing ? (
                <button
                  type="button"
                  disabled
                  className="rounded-[0.375rem] border border-[#F8D98A] bg-white px-3 py-1 font-inter text-sm font-medium leading-5 text-[#FFBF00]"
                >
                  ✨ Write with AI
                </button>
              ) : null}
            </div>

            <textarea
              value={form.companyDetails}
              readOnly={inputReadOnly}
              onChange={(event) =>
                updateField("companyDetails", event.target.value)
              }
              placeholder="Describe your campaign goals, product details, and what creators should focus on.

You can paste links to your website, product pages, reference videos, or brand guidelines."
              className="min-h-[9.5rem] w-full resize-none rounded-b-[0.75rem] bg-white px-4 py-3 font-inter text-sm font-medium leading-5 text-[#1A1A1A] outline-none placeholder:text-[#B8B8B8] read-only:cursor-default"
            />
          </div>
        </section>

        <section>
          <p className="mb-3 font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
            Onboarding Questions
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {editing ? (
              <FloatingSelect
                label="What type of brand are you?"
                value={form.brandType}
                icon
                onValueChange={(value) => updateField("brandType", value)}
                className="my-0"
              >
                {BRAND_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="What type of brand are you?"
                value={form.brandType}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            {editing ? (
              <FloatingSelect
                label="What is your role in the organization?"
                value={form.organizationRole}
                icon
                onValueChange={(value) =>
                  updateField("organizationRole", value)
                }
                className="my-0"
              >
                {ROLES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="What is your role in the organization?"
                value={form.organizationRole}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            {editing ? (
              <FloatingMultiSelect
                label="Preferred platforms"
                options={PLATFORM_OPTIONS}
                value={form.preferredPlatforms}
                icon
                includeAll={false}
                onValueChange={(value) =>
                  updateMultiField("preferredPlatforms", value.slice(0, 3))
                }
                className="my-0 md:col-span-2"
              />
            ) : (
              <FloatingInput
                label="Preferred platforms"
                value={displayArrayValue(form.preferredPlatforms)}
                readOnly
                icon={false}
                className="my-0 md:col-span-2"
              />
            )}
          </div>
        </section>

        <section>
          <p className="font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
            Demographic Details
          </p>

          <p className="mt-1 font-inter text-[0.875rem] font-normal leading-5 text-[#969696]">
            When you schedule campaigns, we’ll use this time zone as a
            reference.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {editing ? (
              <FloatingSelect
                label="Time zone"
                value={form.timeZone}
                icon
                onValueChange={(value) => updateField("timeZone", value)}
                className="my-0"
              >
                {TIME_ZONE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="Time zone"
                value={form.timeZone}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            {editing ? (
              <FloatingSelect
                label="Currency format"
                value={form.currencyFormat}
                icon
                onValueChange={(value) =>
                  updateField("currencyFormat", value)
                }
                className="my-0"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="Currency format"
                value={form.currencyFormat}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            {editing ? (
              <FloatingSelect
                label="Select Region"
                value={form.region}
                icon
                onValueChange={(value) => updateField("region", value)}
                className="my-0"
              >
                {REGION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="Select Region"
                value={form.region}
                readOnly
                icon={false}
                className="my-0"
              />
            )}

            {editing ? (
              <FloatingSelect
                label="What is your preferred language?"
                value={form.preferredLanguage}
                icon
                onValueChange={(value) =>
                  updateField("preferredLanguage", value)
                }
                className="my-0"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </FloatingSelect>
            ) : (
              <FloatingInput
                label="What is your preferred language?"
                value={form.preferredLanguage}
                readOnly
                icon={false}
                className="my-0"
              />
            )}
          </div>
        </section>

        {editing && !profile.auth.isGoogleAccount ? (
          <section>
            <p className="mb-3 font-inter text-base font-medium leading-6 tracking-[0] text-[#969696]">
              Password
            </p>

            <div className="flex flex-col gap-4">
              <PasswordInput
                label="New Password"
                value={passwordForm.newPassword}
                onValueChange={(value) =>
                  updatePasswordField("newPassword", value)
                }
                icon
                showRules
                minLength={8}
                maxLength={16}
                className="my-0"
              />

              <PasswordInput
                label="Re-enter Password"
                value={passwordForm.confirmPassword}
                onValueChange={(value) =>
                  updatePasswordField("confirmPassword", value)
                }
                icon
                showRules
                minLength={8}
                maxLength={16}
                className="my-0"
              />
            </div>
          </section>
        ) : null}

        {profile.auth.isGoogleAccount ? (
          <section>
            <div className="rounded-[0.625rem] border border-[#E6E6E6] bg-[#F7F7F7] px-4 py-3">
              <p className="font-inter text-sm font-semibold leading-5 text-[#1A1A1A]">
                You’re using Google credentials to sign in to Collabglam.
              </p>
              <p className="font-inter text-xs font-normal leading-4 text-[#969696]">
                You’ll need to make any password changes in your Google account.
              </p>
            </div>
          </section>
        ) : null}

        {editing ? (
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving || passwordSaving || photoUploading}
              className="flex h-10 items-center justify-center rounded-[0.5rem] px-6 font-inter text-base font-semibold leading-6 text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            {hasAnyChanges ? (
              <button
                type="button"
                onClick={handleUpdateAll}
                disabled={saving || passwordSaving || photoUploading}
                className="flex h-10 items-center justify-center rounded-[0.5rem] border border-[#E6E6E6] bg-white px-8 font-inter text-base font-semibold leading-6 text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving || passwordSaving ? "Updating..." : "Update"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProfilePage;