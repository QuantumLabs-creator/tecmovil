export type UploadResponse = {
  url: string;
  publicId?: string;
  resourceType?: string;
};

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type ApiError = {
  error: string;
  status: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export async function uploadFileApi(file: File): Promise<ApiEnvelope<UploadResponse>> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw {
      error: data?.error || data?.message || "Error al subir archivo",
      status: res.status,
    } satisfies ApiError;
  }

  return data as ApiEnvelope<UploadResponse>;
}