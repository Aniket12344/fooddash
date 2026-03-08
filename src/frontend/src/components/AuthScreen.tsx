import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ShieldCheck, Utensils, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type AuthStep = "options" | "mobile_phone" | "mobile_otp" | "google_picker";

// ── OTP single-cell input ─────────────────────────────────────────────────────
interface OtpCellProps {
  pos: number;
  value: string;
  otpRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  otpDigits: string[];
  setOtpDigits: (d: string[]) => void;
  onComplete: () => void;
}

function OtpCell({
  pos,
  value,
  otpRefs,
  otpDigits,
  setOtpDigits,
  onComplete,
}: OtpCellProps) {
  return (
    <input
      ref={(el) => {
        otpRefs.current[pos] = el;
      }}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      data-ocid={pos === 0 ? "auth.otp_input" : undefined}
      className="w-11 h-12 text-center text-xl font-mono font-bold border-2 rounded-xl bg-card border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, "");
        if (!val) return;
        const char = val[val.length - 1];
        const next = [...otpDigits];
        next[pos] = char;
        setOtpDigits(next);
        if (pos < 5) otpRefs.current[pos + 1]?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace") {
          if (otpDigits[pos]) {
            const next = [...otpDigits];
            next[pos] = "";
            setOtpDigits(next);
          } else if (pos > 0) {
            const next = [...otpDigits];
            next[pos - 1] = "";
            setOtpDigits(next);
            otpRefs.current[pos - 1]?.focus();
          }
        } else if (e.key === "Enter") {
          onComplete();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = e.clipboardData
          .getData("text")
          .replace(/\D/g, "")
          .slice(0, 6);
        if (!pasted) return;
        const next = [...otpDigits];
        for (let i = 0; i < pasted.length; i++) {
          next[pos + i] = pasted[i] ?? "";
        }
        setOtpDigits(next);
        otpRefs.current[Math.min(pos + pasted.length - 1, 5)]?.focus();
      }}
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_ACCOUNTS = [
  { name: "Priya Sharma", email: "priya.sharma@gmail.com", avatar: "PS" },
  { name: "Rahul Kumar", email: "rahul.kumar@gmail.com", avatar: "RK" },
  { name: "Anita Patel", email: "anita.patel@gmail.com", avatar: "AP" },
];

// ── SMS OTP helpers ───────────────────────────────────────────────────────────
function generateDemoOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpViaSms(phone: string): Promise<{ demoMode: boolean }> {
  const apiKey = localStorage.getItem("fooddash_sms_api_key");
  const templateId = localStorage.getItem("fooddash_sms_template_id");

  if (!apiKey) {
    // Demo mode: store OTP in sessionStorage
    const demoOtp = generateDemoOtp();
    sessionStorage.setItem(`otp_${phone}`, demoOtp);
    return { demoMode: true };
  }

  // Real MSG91 call
  const response = await fetch("https://api.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: templateId ?? "",
      mobile: `91${phone}`,
      authkey: apiKey,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send OTP via MSG91");
  }

  const data = await response.json();
  if (data.type !== "success") {
    throw new Error(data.message ?? "OTP sending failed");
  }

  return { demoMode: false };
}

async function verifyOtpViaSms(phone: string, otp: string): Promise<boolean> {
  const apiKey = localStorage.getItem("fooddash_sms_api_key");

  if (!apiKey) {
    // Demo mode: compare with stored OTP
    const stored = sessionStorage.getItem(`otp_${phone}`);
    return stored === otp;
  }

  // Real MSG91 verify call
  const url = `https://api.msg91.com/api/v5/otp/verify?otp=${encodeURIComponent(otp)}&mobile=91${encodeURIComponent(phone)}&authkey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Verification request failed");
  }

  const data = await response.json();
  return data.type === "success";
}
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN = 30;

export function AuthScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [step, setStep] = useState<AuthStep>("options");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [googleAccount, setGoogleAccount] = useState<
    (typeof GOOGLE_ACCOUNTS)[0] | null
  >(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived: joined OTP string for validation
  const otp = otpDigits.join("");

  // Focus first OTP cell when OTP step mounts
  useEffect(() => {
    if (step === "mobile_otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [step]);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startResendCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setIsSendingOtp(true);
    try {
      const { demoMode } = await sendOtpViaSms(phone);
      setIsDemoMode(demoMode);
      setStep("mobile_otp");
      startResendCooldown();
      if (demoMode) {
        toast.success(`OTP sent to +91 ${phone.slice(-10)} (demo mode)`);
      } else {
        toast.success(`OTP sent to +91 ${phone.slice(-10)}`);
      }
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSendingOtp(true);
    try {
      const { demoMode } = await sendOtpViaSms(phone);
      setIsDemoMode(demoMode);
      startResendCooldown();
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
      toast.success("OTP resent!");
    } catch {
      toast.error("Failed to resend OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const isValid = await verifyOtpViaSms(phone, otp);
      if (!isValid) {
        toast.error("Invalid OTP. Please check and try again.");
        return;
      }
      // Clean up demo OTP from sessionStorage
      if (isDemoMode) {
        sessionStorage.removeItem(`otp_${phone}`);
      }
      toast.success("OTP verified! Connecting...");
      login();
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleLogin = (account: (typeof GOOGLE_ACCOUNTS)[0]) => {
    setGoogleAccount(account);
    toast.success(`Signing in as ${account.name}...`);
    setTimeout(() => login(), 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, oklch(0.72 0.19 55 / 0.12), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-food flex items-center justify-center mb-4 shadow-food-lg">
            <Utensils className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-foreground">
            Food<span className="text-primary">Dash</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            Deliver happiness, one order at a time
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { icon: Zap, label: "Fast Delivery" },
            { icon: Utensils, label: "Top Restaurants" },
            { icon: ShieldCheck, label: "Secure Payments" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground border border-border"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>

        {/* Login card */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to order food, manage your restaurant, or start delivering.
          </p>

          <AnimatePresence mode="wait">
            {/* Step: options */}
            {step === "options" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {/* Mobile OTP — primary */}
                <Button
                  className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
                  onClick={() => setStep("mobile_phone")}
                  data-ocid="auth.mobile_button"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Sign In with Mobile OTP
                </Button>

                {/* Google Sign-In — secondary */}
                <Button
                  variant="outline"
                  className="w-full h-11 font-semibold border-border bg-card"
                  onClick={() => setStep("google_picker")}
                  data-ocid="auth.google_button"
                >
                  <span className="mr-2 text-lg leading-none">🎨</span>
                  Sign In with Google
                </Button>
              </motion.div>
            )}

            {/* Step: mobile phone */}
            {step === "mobile_phone" && (
              <motion.div
                key="mobile_phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label
                    htmlFor="phone-input"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Mobile Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="h-11 flex items-center px-3 bg-muted rounded-lg border border-border text-sm font-medium text-muted-foreground">
                      +91
                    </div>
                    <Input
                      id="phone-input"
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                      className="h-11 flex-1 bg-card border-border"
                      inputMode="numeric"
                      autoFocus
                      data-ocid="auth.phone_input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your 10-digit mobile number
                  </p>
                </div>
                <Button
                  className="w-full h-11 gradient-food border-0 text-white font-semibold"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  data-ocid="auth.send_otp_button"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("options")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                  data-ocid="auth.back_button"
                >
                  ← Back to options
                </button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Powered by Internet Identity
                </p>
              </motion.div>
            )}

            {/* Step: OTP verification */}
            {step === "mobile_otp" && (
              <motion.div
                key="mobile_otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center p-3 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-sm font-semibold text-success">
                    OTP Sent!
                  </p>
                  <p className="text-xs text-success/80 mt-0.5">
                    Check your SMS on +91 {phone} for the 6-digit code
                  </p>
                </div>

                {isDemoMode && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
                    <span className="text-base">⚠️</span>
                    <p className="text-xs text-warning/90 leading-snug">
                      Running in <strong>demo mode</strong> — SMS not sent.
                      Configure MSG91 in Admin → SMS Config for real OTPs.
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Enter OTP
                  </Label>
                  {/* 6-cell individual digit input */}
                  <div className="flex gap-2 justify-center">
                    {([0, 1, 2, 3, 4, 5] as const).map((pos) => (
                      <OtpCell
                        key={pos}
                        pos={pos}
                        value={otpDigits[pos]}
                        otpRefs={otpRefs}
                        otpDigits={otpDigits}
                        setOtpDigits={setOtpDigits}
                        onComplete={handleVerifyOtp}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP button with cooldown */}
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Resend in{" "}
                      <span className="font-semibold text-foreground">
                        {resendCooldown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors disabled:opacity-50"
                      data-ocid="auth.resend_otp_button"
                    >
                      {isSendingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  )}
                </div>

                <Button
                  className="w-full h-11 gradient-food border-0 text-white font-semibold"
                  onClick={handleVerifyOtp}
                  disabled={isLoggingIn || isVerifyingOtp || otp.length < 6}
                  data-ocid="auth.verify_otp_button"
                >
                  {isLoggingIn || isVerifyingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile_phone");
                    setOtpDigits(["", "", "", "", "", ""]);
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    setResendCooldown(0);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  ← Change number
                </button>
              </motion.div>
            )}

            {/* Step: Google account picker */}
            {step === "google_picker" && (
              <motion.div
                key="google_picker"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground text-center mb-2">
                  Choose a Google account
                </p>
                {GOOGLE_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleGoogleLogin(account)}
                    disabled={isLoggingIn}
                    data-ocid="auth.google_account_button"
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full gradient-food flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {account.avatar}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {account.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {account.email}
                      </p>
                    </div>
                    {isLoggingIn && googleAccount?.email === account.email && (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStep("options")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center pt-1"
                  data-ocid="auth.back_button"
                >
                  ← Back to options
                </button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Powered by Internet Identity
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "options" && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Uses Internet Identity — no password required
            </p>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Built with love using caffeine.ai
        </a>
      </p>
    </div>
  );
}
