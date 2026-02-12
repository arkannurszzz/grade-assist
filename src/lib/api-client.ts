import { toast } from "sonner";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;

    try {
      // Don't set Content-Type for FormData - browser sets it with boundary
      const isFormData = options?.body instanceof FormData;

      const res = await fetch(fullUrl, {
        ...options,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...options?.headers,
        },
      });

      // Try to parse response body
      const contentType = res.headers.get("content-type");
      let data: unknown;

      if (contentType?.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errorMessage =
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : "Request failed";

        throw new ApiError(res.status, errorMessage, data);
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error or other issues
      throw new ApiError(0, "Network error or request failed", error);
    }
  }

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    url: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

// Helper function for mutations with toast feedback
export async function mutateWithToast<T>(
  fn: () => Promise<T>,
  messages: {
    loading?: string;
    success: string;
    error?: string;
  }
): Promise<T> {
  const toastId = messages.loading ? toast.loading(messages.loading) : null;

  try {
    const result = await fn();
    if (toastId) toast.dismiss(toastId);
    toast.success(messages.success);
    return result;
  } catch (error) {
    if (toastId) toast.dismiss(toastId);
    const errorMessage =
      error instanceof ApiError
        ? error.message
        : messages.error || "Something went wrong";
    toast.error(errorMessage);
    throw error;
  }
}
