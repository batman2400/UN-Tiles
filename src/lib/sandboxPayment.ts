/**
 * UN Tiles Sandbox Payment Gateway Library
 * 
 * Provides types, test card datasets, validation helpers,
 * brand detection, and realistic processing simulations
 * for the UN Tiles luxury sandbox checkout experience.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export interface SandboxTestCard {
  id: string;
  name: string;
  badge: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  holderName: string;
  description: string;
  behavior: "success_instant" | "success_3ds" | "decline_funds" | "decline_expired";
  brand: CardBrand;
}

export interface PaymentDetailsSnapshot {
  transaction_id: string;
  auth_code: string;
  payment_channel: "card" | "digital_wallet" | "bank_transfer";
  card_brand?: string;
  last4?: string;
  cardholder_name?: string;
  wallet_provider?: string;
  bank_name?: string;
  currency: string;
  amount: number;
  paid_at: string;
  environment: "sandbox";
}

export interface SandboxPaymentPayload {
  channel: "card" | "digital_wallet" | "bank_transfer";
  cardholderName?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  walletProvider?: "Apple Pay" | "Google Pay";
  bankName?: string;
  amount: number;
  currency?: string;
  simulated3dsOtp?: string;
}

export interface SandboxPaymentResult {
  success: boolean;
  requires3ds?: boolean;
  transactionId?: string;
  authCode?: string;
  paymentDetails?: PaymentDetailsSnapshot;
  error?: string;
}

// ── Test Card Fixtures ─────────────────────────────────

export const SANDBOX_TEST_CARDS: SandboxTestCard[] = [
  {
    id: "visa_instant",
    name: "Visa (Instant Auth)",
    badge: "Instant Pass",
    cardNumber: "4242 4242 4242 4242",
    expiry: "12/28",
    cvv: "123",
    holderName: "Alex Mercer",
    description: "Instant transaction authorization with no 3D-Secure challenge.",
    behavior: "success_instant",
    brand: "visa",
  },
  {
    id: "mc_3ds",
    name: "Mastercard (3D Secure)",
    badge: "3DS Challenge",
    cardNumber: "5555 5555 5555 4444",
    expiry: "08/29",
    cvv: "456",
    holderName: "Elena Rostova",
    description: "Simulates an authentic SMS / 3D-Secure OTP verification flow (Code: 123456).",
    behavior: "success_3ds",
    brand: "mastercard",
  },
  {
    id: "amex_gold",
    name: "Amex Centurion",
    badge: "VIP Pass",
    cardNumber: "3782 822464 81005",
    expiry: "11/27",
    cvv: "8888",
    holderName: "Julian Sterling",
    description: "American Express instant luxury authorization simulation.",
    behavior: "success_instant",
    brand: "amex",
  },
  {
    id: "decline_funds",
    name: "Decline (Funds)",
    badge: "Simulate Fail",
    cardNumber: "4000 0000 0000 0002",
    expiry: "05/27",
    cvv: "321",
    holderName: "Jordan Hayes",
    description: "Simulates ERR_INSUFFICIENT_FUNDS to test graceful rejection and retry handling.",
    behavior: "decline_funds",
    brand: "visa",
  },
  {
    id: "decline_expired",
    name: "Decline (Expired)",
    badge: "Expired Test",
    cardNumber: "4000 0000 0000 0003",
    expiry: "01/22",
    cvv: "999",
    holderName: "Morgan Vance",
    description: "Simulates ERR_CARD_EXPIRED bank error response.",
    behavior: "decline_expired",
    brand: "visa",
  },
];

// ── Card Helper Utilities ──────────────────────────────

export function detectCardBrand(rawNumber: string): CardBrand {
  const clean = rawNumber.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^6(?:011|5)/.test(clean)) return "discover";
  return "unknown";
}

export function formatCardNumber(rawNumber: string): string {
  const digits = rawNumber.replace(/\D/g, "");
  const brand = detectCardBrand(digits);

  if (brand === "amex") {
    // 4 - 6 - 5 format for 15-digit Amex
    const part1 = digits.slice(0, 4);
    const part2 = digits.slice(4, 10);
    const part3 = digits.slice(10, 15);
    return [part1, part2, part3].filter(Boolean).join(" ");
  }

  // Standard 4 - 4 - 4 - 4
  const parts = [];
  for (let i = 0; i < digits.length && i < 16; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

export function formatExpiry(rawExpiry: string): string {
  const digits = rawExpiry.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

export function generateSandboxTransactionId(): string {
  const randHex = Math.random().toString(16).substring(2, 10).toUpperCase();
  const timeHex = Date.now().toString(36).toUpperCase().slice(-4);
  return `UN-SBX-${timeHex}-${randHex}`;
}

export function generateAuthCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Processing Simulator ───────────────────────────────

/**
 * Simulates end-to-end sandbox payment processing with authentic timing,
 * validation, 3D-Secure challenges, and decline simulations.
 */
export async function simulateSandboxPayment(
  payload: SandboxPaymentPayload
): Promise<SandboxPaymentResult> {
  // Artificial network round-trip simulation
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (payload.channel === "digital_wallet") {
    const txnId = generateSandboxTransactionId();
    const authCode = generateAuthCode();
    return {
      success: true,
      transactionId: txnId,
      authCode,
      paymentDetails: {
        transaction_id: txnId,
        auth_code: authCode,
        payment_channel: "digital_wallet",
        wallet_provider: payload.walletProvider || "Apple Pay",
        currency: payload.currency || "LKR",
        amount: payload.amount,
        paid_at: new Date().toISOString(),
        environment: "sandbox",
      },
    };
  }

  if (payload.channel === "bank_transfer") {
    const txnId = generateSandboxTransactionId();
    const authCode = generateAuthCode();
    return {
      success: true,
      transactionId: txnId,
      authCode,
      paymentDetails: {
        transaction_id: txnId,
        auth_code: authCode,
        payment_channel: "bank_transfer",
        bank_name: payload.bankName || "Commercial Bank of Ceylon (Sandbox)",
        currency: payload.currency || "LKR",
        amount: payload.amount,
        paid_at: new Date().toISOString(),
        environment: "sandbox",
      },
    };
  }

  // ── Card Channel Processing ────────────────────────────
  const cleanNumber = (payload.cardNumber || "").replace(/\D/g, "");
  const cardBrand = detectCardBrand(cleanNumber);
  const last4 = cleanNumber.slice(-4) || "4242";

  // Check matching test card behavior
  if (cleanNumber.endsWith("0002")) {
    return {
      success: false,
      error: "Payment Declined (ERR_INSUFFICIENT_FUNDS): The test card has insufficient funds. Please select another test card.",
    };
  }

  if (cleanNumber.endsWith("0003")) {
    return {
      success: false,
      error: "Payment Declined (ERR_CARD_EXPIRED): The card expiry date has lapsed. Please verify your card details.",
    };
  }

  // If this is a 3DS-requiring card (e.g. 5555 5555 5555 4444)
  if (cleanNumber.startsWith("5555") && !payload.simulated3dsOtp) {
    return {
      success: false,
      requires3ds: true,
    };
  }

  // If 3DS OTP was submitted, check validity
  if (payload.simulated3dsOtp) {
    if (payload.simulated3dsOtp !== "123456") {
      return {
        success: false,
        requires3ds: true,
        error: "Invalid 3D-Secure authentication code. (Use test OTP: 123456)",
      };
    }
  }

  const txnId = generateSandboxTransactionId();
  const authCode = generateAuthCode();

  return {
    success: true,
    transactionId: txnId,
    authCode,
    paymentDetails: {
      transaction_id: txnId,
      auth_code: authCode,
      payment_channel: "card",
      card_brand: cardBrand === "unknown" ? "Visa" : cardBrand.toUpperCase(),
      last4,
      cardholder_name: payload.cardholderName?.trim() || "Valued Patron",
      currency: payload.currency || "LKR",
      amount: payload.amount,
      paid_at: new Date().toISOString(),
      environment: "sandbox",
    },
  };
}
