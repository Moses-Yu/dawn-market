const TOSS_API_URL = "https://api.tosspayments.com";

function getSecretKey(): string {
  const key = process.env.TOSS_SECRET_KEY;
  if (!key) throw new Error("Missing TOSS_SECRET_KEY");
  return key;
}

function authHeader(): string {
  return `Basic ${Buffer.from(getSecretKey() + ":").toString("base64")}`;
}

async function tossRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${TOSS_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `Toss API error ${res.status}: ${data.code ?? "UNKNOWN"} - ${data.message ?? JSON.stringify(data)}`
    );
  }
  return data as T;
}

export interface TossBillingAuth {
  mId: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  billingKey: string;
  card?: {
    issuerCode: string;
    acquirerCode: string;
    number: string;
    cardType: string;
    ownerType: string;
  };
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
}

/**
 * Issue a billing key from an authorization key (after frontend card registration).
 */
export async function issueBillingKey(
  authKey: string,
  customerKey: string
): Promise<TossBillingAuth> {
  return tossRequest<TossBillingAuth>(
    "/v1/billing/authorizations/issue",
    {
      method: "POST",
      body: JSON.stringify({ authKey, customerKey }),
    }
  );
}

/**
 * Charge using a billing key (for subscription payments).
 */
export async function chargeBillingKey(
  billingKey: string,
  params: {
    customerKey: string;
    amount: number;
    orderId: string;
    orderName: string;
  }
): Promise<TossPayment> {
  return tossRequest<TossPayment>(`/v1/billing/${billingKey}`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Get payment details by payment key.
 */
export async function getPayment(paymentKey: string): Promise<TossPayment> {
  return tossRequest<TossPayment>(`/v1/payments/${paymentKey}`);
}

/**
 * Verify Toss webhook signature.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const crypto = require("crypto");
  const secret = getSecretKey();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
