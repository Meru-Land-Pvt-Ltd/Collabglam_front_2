import api from "@/lib/api";

export type BrandSignatureAsset = {
  _id: string;
  brandId: string;
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

export async function apiListBrandSignatures(brandId: string) {
  const res = await api.get(`/contract/brand-signatures/${brandId}`);

  return {
    max: Number(res?.data?.max || 3),
    signatures: (res?.data?.signatures || []) as BrandSignatureAsset[],
  };
}

export async function apiGetPrimaryBrandSignature(brandId: string) {
  const res = await api.get(`/contract/signature/${brandId}`);

  return (res?.data?.signature || res?.data || null) as BrandSignatureAsset | null;
}

export async function apiUploadBrandSignature({
  brandId,
  name,
  remarks,
  file,
  isPrimary,
}: {
  brandId: string;
  name: string;
  remarks: string;
  file: File;
  isPrimary: boolean;
}) {
  const formData = new FormData();

  formData.append("brandId", brandId);
  formData.append("name", name);
  formData.append("remarks", remarks);
  formData.append("isPrimary", String(isPrimary));
  formData.append("signature", file);

  const res = await api.post(`/contract/brand-signatures/${brandId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return (res?.data?.signature || res?.data) as BrandSignatureAsset;
}

export async function apiSetPrimaryBrandSignature(
  brandId: string,
  signatureId: string
) {
  const res = await api.patch(
    `/contract/brand-signatures/${brandId}/${signatureId}/primary`,
    {}
  );

  return (res?.data?.signature || res?.data) as BrandSignatureAsset;
}

export async function apiDeleteBrandSignature(brandId: string, signatureId: string) {
  const res = await api.delete(`/contract/brand-signatures/${brandId}/${signatureId}`);

  return res?.data;
}
