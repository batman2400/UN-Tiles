"use client";

import { useState, useTransition } from "react";
import { 
  Lock, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X, 
  ArrowRight, 
  Smartphone, 
  Building2, 
  KeyRound, 
  Check 
} from "lucide-react";
import {
  SANDBOX_TEST_CARDS,
  SandboxTestCard,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  simulateSandboxPayment,
  type PaymentDetailsSnapshot,
  type CardBrand,
} from "@/lib/sandboxPayment";

interface SandboxPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: (paymentDetails: PaymentDetailsSnapshot) => Promise<void> | void;
}

type PaymentChannel = "card" | "wallet" | "bank";

export function SandboxPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onPaymentSuccess,
}: SandboxPaymentModalProps) {
  const [channel, setChannel] = useState<PaymentChannel>("card");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardHolder, setCardHolder] = useState("Alex Mercer");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [saveCard, setSaveCard] = useState(true);

  // Digital Wallet State
  const [selectedWallet, setSelectedWallet] = useState<"Apple Pay" | "Google Pay">("Apple Pay");

  // Bank Transfer State
  const [selectedBank, setSelectedBank] = useState("Commercial Bank of Ceylon");

  // Processing & Simulation State
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<PaymentDetailsSnapshot | null>(null);

  // 3DS Challenge State
  const [show3dsModal, setShow3dsModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const handleModalClose = () => {
    setErrorMsg(null);
    setProcessingStage(null);
    setIsSuccess(false);
    setShow3dsModal(false);
    setOtpCode("");
    setOtpError(null);
    onClose();
  };

  if (!isOpen) return null;

  const cardBrand = detectCardBrand(cardNumber);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleApplyPreset = (preset: SandboxTestCard) => {
    setCardNumber(preset.cardNumber);
    setCardHolder(preset.holderName);
    setExpiry(preset.expiry);
    setCvv(preset.cvv);
    setErrorMsg(null);
  };

  const executePayment = async (otpSubmitted?: string) => {
    setErrorMsg(null);
    setOtpError(null);

    // Initial Stage Animation
    setProcessingStage("Encrypting 256-bit payment credentials...");
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStage("Authorizing through Sandbox Gateway network...");

    try {
      const result = await simulateSandboxPayment({
        channel: channel === "wallet" ? "digital_wallet" : channel === "bank" ? "bank_transfer" : "card",
        cardNumber,
        cardholderName: cardHolder,
        expiry,
        cvv,
        walletProvider: selectedWallet,
        bankName: selectedBank,
        amount: totalAmount,
        currency: "LKR",
        simulated3dsOtp: otpSubmitted,
      });

      if (result.requires3ds) {
        setProcessingStage(null);
        setShow3dsModal(true);
        if (result.error) {
          setOtpError(result.error);
        }
        return;
      }

      if (!result.success || !result.paymentDetails) {
        setProcessingStage(null);
        setErrorMsg(result.error || "Payment was declined by the test issuer.");
        return;
      }

      // Success stage
      setProcessingStage("Payment authorized! Generating digital receipt...");
      await new Promise((r) => setTimeout(r, 600));

      setSuccessDetails(result.paymentDetails);
      setIsSuccess(true);
      setProcessingStage(null);

      // Invoke parent order completion
      startTransition(async () => {
        try {
          await onPaymentSuccess(result.paymentDetails!);
        } catch (err: unknown) {
          console.error("Order completion callback failed:", err);
          setErrorMsg("Payment succeeded in gateway but order recording failed. Please try again.");
        }
      });
    } catch (err) {
      console.error("Sandbox payment error:", err);
      setProcessingStage(null);
      setErrorMsg("An unexpected gateway simulation error occurred.");
    }
  };

  const renderBrandIcon = (brand: CardBrand) => {
    switch (brand) {
      case "visa":
        return <span className="font-serif italic font-extrabold text-blue-400 tracking-wider text-sm">VISA</span>;
      case "mastercard":
        return (
          <div className="flex -space-x-1.5 items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/90" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90" />
          </div>
        );
      case "amex":
        return <span className="font-mono font-bold text-xs bg-cyan-700 text-white px-1.5 py-0.5 rounded">AMEX</span>;
      default:
        return <CreditCard className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Top Sandbox Environment Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border-b border-yellow-500/30 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
            </span>
            <span className="text-[11px] font-bold tracking-widest uppercase text-yellow-400">
              Sandbox Test Gateway
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
              Simulated Mode • No real charges
            </span>
          </div>
          <button
            onClick={handleModalClose}
            disabled={!!processingStage}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 [scrollbar-width:thin]">
          
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                UN Tiles Luxury Pay
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Encrypted Sandbox Checkout Terminal
              </p>
            </div>
            <div className="sm:text-right bg-zinc-800/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-none border-zinc-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Total Due</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-yellow-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Success State Overlay View */}
          {isSuccess && successDetails ? (
            <div className="py-6 sm:py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Payment Approved
                </span>
                <h3 className="text-2xl font-display font-bold text-white mt-3">
                  Transaction Successful
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
                  Your sandbox payment has been authorized and your order is being queued for studio processing.
                </p>
              </div>

              {/* Digital Receipt Card */}
              <div className="max-w-md mx-auto bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                  <span>Transaction ID:</span>
                  <span className="text-yellow-400 font-bold">{successDetails.transaction_id}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                  <span>Auth Code:</span>
                  <span className="text-white">{successDetails.auth_code}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                  <span>Channel:</span>
                  <span className="text-white capitalize">
                    {successDetails.payment_channel.replace("_", " ")}
                    {successDetails.card_brand ? ` (${successDetails.card_brand} •••• ${successDetails.last4})` : ""}
                    {successDetails.wallet_provider ? ` (${successDetails.wallet_provider})` : ""}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(successDetails.amount)}</span>
                </div>
              </div>

              <button
                onClick={handleModalClose}
                className="w-full max-w-md bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>View Order in Account Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Payment Channel Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setChannel("card"); setErrorMsg(null); }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    channel === "card"
                      ? "bg-yellow-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="truncate">Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setChannel("wallet"); setErrorMsg(null); }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    channel === "wallet"
                      ? "bg-yellow-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="truncate">Wallets</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setChannel("bank"); setErrorMsg(null); }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    channel === "bank"
                      ? "bg-yellow-500 text-zinc-950 shadow-md"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">NetBank</span>
                </button>
              </div>

              {/* Quick Fill Test Presets Bar (For Card Channel) */}
              {channel === "card" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      One-Click Test Cards
                    </span>
                    <span className="text-[10px] text-zinc-500">Click to autofill</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SANDBOX_TEST_CARDS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all group ${
                          cardNumber.replace(/\s/g, "") === preset.cardNumber.replace(/\s/g, "")
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/60 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            preset.behavior === "success_instant"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : preset.behavior === "success_3ds"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {preset.badge}
                          </span>
                          {renderBrandIcon(preset.brand)}
                        </div>
                        <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white">
                          {preset.name.split(" ")[0]}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          •••• {preset.cardNumber.slice(-4)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD CHANNEL CONTENT */}
              {channel === "card" && (
                <div className="space-y-5">
                  {/* Virtual Luxury Card Preview */}
                  <div className="relative w-full aspect-[1.8/1] max-w-sm mx-auto rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-yellow-500/30 shadow-2xl overflow-hidden flex flex-col justify-between group">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12" />
                    
                    {/* Top Row: Chip & Brand */}
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-2">
                        {/* EMV Chip */}
                        <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-500 border border-yellow-700 shadow-inner flex flex-col justify-around p-1">
                          <div className="h-[1px] bg-yellow-800/40 w-full" />
                          <div className="h-[1px] bg-yellow-800/40 w-full" />
                        </div>
                        <div className="w-4 h-4 rounded-full border border-yellow-500/40 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-yellow-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">UN STUDIO</span>
                        {renderBrandIcon(cardBrand)}
                      </div>
                    </div>

                    {/* Middle: Formatted Card Number */}
                    <div className="font-mono text-base sm:text-lg tracking-widest text-yellow-100 font-bold drop-shadow-md py-2">
                      {formatCardNumber(cardNumber) || "•••• •••• •••• ••••"}
                    </div>

                    {/* Bottom Row: Holder & Expiry */}
                    <div className="flex justify-between items-end relative z-10 text-[10px] uppercase tracking-wider text-zinc-400">
                      <div>
                        <span className="block text-[8px] text-zinc-500 font-sans">Cardholder</span>
                        <span className="font-semibold text-zinc-200 truncate max-w-[140px] block">
                          {cardHolder || "Valued Patron"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] text-zinc-500 font-sans">Expires</span>
                        <span className="font-mono font-semibold text-zinc-200">
                          {expiry || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Alex Mercer"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex justify-between">
                        <span>Card Number</span>
                        <span className="text-[10px] text-yellow-500 uppercase">{cardBrand}</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition-all"
                        />
                        <div className="absolute left-3.5 top-3.5">
                          {renderBrandIcon(cardBrand)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="12/28"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center justify-between">
                          <span>CVV / CVC</span>
                          <span className="text-[10px] text-zinc-500">3-4 digits</span>
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                          placeholder="123"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition-all"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-yellow-500 focus:ring-yellow-500/40 h-4 w-4"
                      />
                      <span className="text-xs text-zinc-400">
                        Remember this card for simulated 1-click purchases
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* DIGITAL WALLET CHANNEL CONTENT */}
              {channel === "wallet" && (
                <div className="space-y-5 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedWallet("Apple Pay")}
                      className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        selectedWallet === "Apple Pay"
                          ? "border-yellow-500 bg-yellow-500/10 text-white"
                          : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-2xl"></span>
                      <span className="text-sm font-bold">Apple Pay</span>
                      <span className="text-[10px] text-zinc-500">Instant Biometric Auth</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWallet("Google Pay")}
                      className={`p-5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        selectedWallet === "Google Pay"
                          ? "border-yellow-500 bg-yellow-500/10 text-white"
                          : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-2xl font-bold text-yellow-400">G</span>
                      <span className="text-sm font-bold">Google Pay</span>
                      <span className="text-[10px] text-zinc-500">1-Click Fast Sandbox</span>
                    </button>
                  </div>
                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                    <div className="flex items-center gap-2 text-yellow-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Device Tokenization Simulation</span>
                    </div>
                    <p>
                      Clicking Authorize simulates biometric passkey authentication linked to your test {selectedWallet} account.
                    </p>
                  </div>
                </div>
              )}

              {/* NETBANKING CHANNEL CONTENT */}
              {channel === "bank" && (
                <div className="space-y-4 py-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Select Test Bank (Sri Lanka Sandbox)
                  </label>
                  <div className="space-y-2">
                    {[
                      "Commercial Bank of Ceylon (Sandbox)",
                      "Hatton National Bank - HNB Pay",
                      "Sampath Bank Vishwa Mock",
                      "Standard Chartered Premier Pay",
                    ].map((bank) => (
                      <label
                        key={bank}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedBank === bank
                            ? "border-yellow-500 bg-yellow-500/10 text-white"
                            : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedBank"
                            value={bank}
                            checked={selectedBank === bank}
                            onChange={() => setSelectedBank(bank)}
                            className="sr-only"
                          />
                          <Building2 className={`w-4 h-4 ${selectedBank === bank ? "text-yellow-400" : "text-zinc-500"}`} />
                          <span className="text-xs font-bold">{bank}</span>
                        </div>
                        {selectedBank === bank && <Check className="w-4 h-4 text-yellow-400" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-red-400 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1">
                    <p className="font-semibold">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Submit / Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!!processingStage}
                  onClick={() => executePayment()}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {processingStage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                      <span className="text-xs font-semibold">{processingStage}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-zinc-950" />
                      <span>Authorize {formatCurrency(totalAmount)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Footer Trust Badges */}
              <div className="flex items-center justify-center gap-6 pt-2 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  256-bit TLS Sandbox
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-yellow-500" />
                  PCI-DSS Mock Level 1
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── 3D Secure Verification Challenge Modal ───────────────── */}
        {show3dsModal && (
          <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 text-white">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-yellow-400" />
                  <h4 className="font-bold text-sm">3D-Secure Authentication</h4>
                </div>
                <button
                  onClick={() => setShow3dsModal(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <p className="text-zinc-300">
                  A simulated OTP has been dispatched to your test phone number for Mastercard ending in{" "}
                  <strong className="text-yellow-400">{cardNumber.slice(-4)}</strong>.
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-[11px] text-yellow-400">
                  👉 Test Verification Code: <strong className="font-mono text-white text-xs">123456</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ""));
                    setOtpError(null);
                  }}
                  placeholder="123456"
                  className="w-full text-center font-mono text-xl tracking-[0.5em] bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-yellow-400 focus:outline-none focus:border-yellow-500"
                />
              </div>

              {otpError && (
                <p className="text-xs text-red-400 font-semibold">{otpError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShow3dsModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShow3dsModal(false);
                    void executePayment(otpCode);
                  }}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold text-xs py-3 rounded-xl transition-all shadow-md"
                >
                  Verify & Pay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
