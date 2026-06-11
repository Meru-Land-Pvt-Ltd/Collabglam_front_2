export type WorkspaceAccessType = "full_access" | "limited_access";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "marketing_manager"
  | "campaign_manager"
  | "finance_manager"
  | "content_reviewer"
  | "viewer"
  | "agency_member";

export type WorkspaceItem = {
  _id?: string;
  id?: string;
  workspaceId?: string;
  brandId?: string;
  ownerBrandId?: string;
  createdBy?: string;
  brandRealEmail?: string;
  name?: string;
  workspaceName?: string;
  slug?: string;
  logo?: string;
  status?: string;
  role?: WorkspaceRole | string;
  accessType?: WorkspaceAccessType | string;
  permissions?: Record<string, any>;
  relation?: string;
  relationLabel?: string;
  email?: string;
  ownerEmail?: string;
  createdAt?: string;
  updatedAt?: string;

  isPendingInvitation?: boolean;
  inviteStatus?: string;
  invitationId?: string;
  invitationToken?: string;
  invitedEmail?: string;
  invitedBy?: string;
  canAccept?: boolean;
  canReject?: boolean;
  canDelete?: boolean;
  canLeave?: boolean;
  memberStatus?: string;
};

export type WorkspaceMemberItem = {
  _id?: string;
  id?: string;
  memberId?: string;
  workspaceId?: string;
  brandId?: string;
  rootBrandId?: string;
  workspaceBrandId?: string;
  userId?: string;
  name?: string;
  email?: string;
  brandRealEmail?: string;
  avatar?: string;
  profilePic?: string;
  role?: WorkspaceRole | string;
  accessType?: WorkspaceAccessType | string;
  permissions?: Record<string, any>;
  status?: string;
  joinedAt?: string;
  createdAt?: string;
};

export type WorkspaceInvitationItem = {
  _id?: string;
  id?: string;
  invitationId?: string;
  workspaceId?: string;
  brandId?: string;
  email?: string;
  role?: WorkspaceRole | string;
  accessType?: WorkspaceAccessType | string;
  token?: string;
  inviteLink?: string;
  workspaceName?: string;
  workspaceLogo?: string;
  status?: string;
  expiresAt?: string;
};

export type CreateWorkspacePayload = {
  name: string;
  logo?: string;
};

export type InviteWorkspaceMemberPayload = {
  email: string;
  role?: WorkspaceRole | string;
  accessType?: WorkspaceAccessType;
  brandId?: string;
};

export type BulkInviteWorkspaceMemberPayload = {
  invites: InviteWorkspaceMemberPayload[];
};

const WORKSPACE_ROUTE_PREFIX = "/workspace";

function getApiBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "";

  return raw
    .replace(/\/+$/, "")
    .replace(/\/api$/, "")
    .replace(/\/workspace$/, "");
}

function getAuthToken() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("brandToken") ||
    window.localStorage.getItem("authToken") ||
    ""
  );
}

function getActiveWorkspaceId() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("workspaceId") ||
    window.localStorage.getItem("currentWorkspaceId") ||
    ""
  );
}

function getActiveBrandId() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("brandId") ||
    window.localStorage.getItem("currentBrandId") ||
    ""
  );
}

function buildApiUrl(path: string) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) return cleanPath;

  return `${base}${cleanPath}`;
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const workspaceId = getActiveWorkspaceId();
  const brandId = getActiveBrandId();

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
      ...(brandId ? { "x-brand-id": brandId, "x-active-brand-id": brandId } : {}),
      ...(options.headers || {}),
    },
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      json?.message ||
        json?.error ||
        json?.data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return json as T;
}

function unwrapList<T>(response: any, key: string): T[] {
  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  if (Array.isArray(response?.[key])) {
    return response[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function unwrapItem<T>(response: any, key: string): T | null {
  return response?.data?.[key] || response?.[key] || response?.data || null;
}

export async function apiGetMyWorkspaces() {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/my`,
    {
      method: "GET",
    }
  );

  const list = unwrapList<WorkspaceItem>(response, "workspaces");

  const unique = new Map<string, WorkspaceItem>();

  list.forEach((workspace) => {
    const id = getWorkspaceId(workspace);

    if (id) unique.set(id, workspace);
  });

  return {
    workspaces: Array.from(unique.values()),
    meta: {
      used: Number(response?.data?.used ?? list.length ?? 0),
      total: Number(response?.data?.total ?? 1),
      totalCount: Number(response?.data?.totalCount ?? list.length ?? 0),
      acceptedCount: Number(response?.data?.acceptedCount ?? 0),
      pendingInvitationCount: Number(response?.data?.pendingInvitationCount ?? 0),
      limitReached: Boolean(response?.data?.limitReached ?? false),
      canAddWorkspace: Boolean(response?.data?.canAddWorkspace ?? true),
    },
  };
}

export async function apiGetWorkspace(workspaceId: string) {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(workspaceId)}`,
    {
      method: "GET",
    }
  );

  return unwrapItem<WorkspaceItem>(response, "workspace");
}

export async function apiCreateWorkspace(payload: CreateWorkspacePayload) {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return unwrapItem<WorkspaceItem>(response, "workspace");
}

export async function apiGetWorkspaceMembers(workspaceId: string) {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(
      workspaceId
    )}/members`,
    {
      method: "GET",
    }
  );

  return unwrapList<WorkspaceMemberItem>(response, "members");
}

export async function apiInviteWorkspaceMember(
  workspaceId: string,
  payload: InviteWorkspaceMemberPayload
) {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(
      workspaceId
    )}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return unwrapItem<WorkspaceInvitationItem>(response, "invitation") || response;
}

export async function apiBulkInviteWorkspaceMembers(
  workspaceId: string,
  payload: BulkInviteWorkspaceMemberPayload
) {
  return requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(
      workspaceId
    )}/invitations/bulk`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function apiGetWorkspaceInvitation(token: string) {
  const response = await requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspace-invitations/${encodeURIComponent(
      token
    )}`,
    {
      method: "GET",
    }
  );

  return unwrapItem<WorkspaceInvitationItem>(response, "invitation") || response;
}

export async function apiAcceptWorkspaceInvitation(token: string) {
  return requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspace-invitations/accept/${encodeURIComponent(
      token
    )}`,
    {
      method: "POST",
    }
  );
}

export async function apiRejectWorkspaceInvitation(token: string) {
  return requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspace-invitations/reject/${encodeURIComponent(
      token
    )}`,
    {
      method: "POST",
    }
  );
}

export async function apiLeaveWorkspace(workspaceId: string) {
  return requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(
      workspaceId
    )}/leave`,
    {
      method: "POST",
    }
  );
}

export async function apiDeleteWorkspace(workspaceId: string) {
  return requestJson<any>(
    `${WORKSPACE_ROUTE_PREFIX}/workspaces/${encodeURIComponent(workspaceId)}`,
    {
      method: "DELETE",
    }
  );
}

export function getWorkspaceId(workspace: WorkspaceItem | null | undefined) {
  return String(workspace?._id || workspace?.workspaceId || workspace?.id || "");
}

export function getWorkspaceBrandId(workspace: WorkspaceItem | null | undefined) {
  return String(workspace?.brandId || "");
}

export function switchWorkspaceLocalStorage(workspace: WorkspaceItem) {
  if (typeof window === "undefined") return;

  const token =
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("brandToken") ||
    window.localStorage.getItem("authToken") ||
    "";

  const accessToken = window.localStorage.getItem("accessToken") || token;

  const workspaceId = getWorkspaceId(workspace);
  const brandId = getWorkspaceBrandId(workspace);

  window.localStorage.clear();

  if (token) window.localStorage.setItem("token", token);
  if (accessToken) window.localStorage.setItem("accessToken", accessToken);

  if (brandId) {
    window.localStorage.setItem("brandId", brandId);
    window.localStorage.setItem("currentBrandId", brandId);
  }

  if (workspaceId) {
    window.localStorage.setItem("workspaceId", workspaceId);
    window.localStorage.setItem("currentWorkspaceId", workspaceId);
  }

  window.localStorage.setItem("selectedWorkspace", JSON.stringify(workspace));
}
