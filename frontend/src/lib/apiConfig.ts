export const ACTIVE_BACKEND_URL = "https://nodepilot-backend.jd2cvuk.workers.dev";
export const ACTIVE_RAZORPAY_KEY = "rzp_live_ThMsNAO9ONgtkA";

export function getBackendApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl || envUrl.includes("nodepilot-app")) {
    return ACTIVE_BACKEND_URL;
  }
  return envUrl;
}

export function getRazorpayKeyId(): string {
  const envKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  if (!envKey || envKey.includes("TEfso5ER7rHM8p")) {
    return ACTIVE_RAZORPAY_KEY;
  }
  return envKey;
}
