import api from "@/lib/api";

export type InfluencerSignatureAsset = {
  _id: string;
  influencerId: string;
  name: string;
  remarks: string;
  signature: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  isPrimary: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export async function apiListInfluencerSignatures(influencerId: string) {
  const res = await api.get(`/contract/influencer-signatures/${influencerId}`);

  return {
    max: Number(res?.data?.max || 3),
    count: Number(res?.data?.count || 0),
    signatures: (res?.data?.signatures || []) as InfluencerSignatureAsset[],
  };
}

export async function apiGetPrimaryInfluencerSignature(influencerId: string) {
  const res = await api.get(`/contract/influencer-signature/${influencerId}`);
  return (res?.data?.signature || res?.data || null) as InfluencerSignatureAsset | null;
}

export async function apiUploadInfluencerSignatureAsset({
  influencerId,
  name,
  remarks,
  file,
  isPrimary,
}: {
  influencerId: string;
  name: string;
  remarks: string;
  file: File;
  isPrimary: boolean;
}) {
  const formData = new FormData();
  formData.append("influencerId", influencerId);
  formData.append("name", name);
  formData.append("remarks", remarks);
  formData.append("isPrimary", String(isPrimary));
  formData.append("signature", file);

  const res = await api.post(
    `/contract/influencer-signatures/${influencerId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return (res?.data?.signature || res?.data) as InfluencerSignatureAsset;
}

export async function apiSetPrimaryInfluencerSignature(
  influencerId: string,
  signatureId: string
) {
  const res = await api.patch(
    `/contract/influencer-signatures/${influencerId}/${signatureId}/primary`,
    {}
  );

  return (res?.data?.signature || res?.data) as InfluencerSignatureAsset;
}

export async function apiDeleteInfluencerSignature(
  influencerId: string,
  signatureId: string
) {
  const res = await api.delete(
    `/contract/influencer-signatures/${influencerId}/${signatureId}`
  );

  return res?.data;
}
