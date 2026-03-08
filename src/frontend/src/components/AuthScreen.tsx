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

// ── Global Google Identity Services type declarations ──────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: unknown) => void) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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

// Fake Google accounts kept for demo mode only
const GOOGLE_ACCOUNTS = [
  { name: "Priya Sharma", email: "priya.sharma@gmail.com", avatar: "PS" },
  { name: "Rahul Kumar", email: "rahul.kumar@gmail.com", avatar: "RK" },
  { name: "Anita Patel", email: "anita.patel@gmail.com", avatar: "AP" },
];

// ── MSG91 Widget helpers ──────────────────────────────────────────────────────
function generateDemoOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function loadMsg91Script(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("msg91-otp-script")) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "msg91-otp-script";
    s.src = "https://verify.msg91.com/otp-provider.js";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

// ── Google Identity Services helpers ─────────────────────────────────────────
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("gsi-client-script")) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-client-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load GSI script"));
    document.head.appendChild(s);
  });
}

interface GoogleJwtPayload {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

function decodeGoogleJwt(token: string): GoogleJwtPayload {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = parts[1];
    // Base64url decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    return JSON.parse(atob(padded)) as GoogleJwtPayload;
  } catch {
    return {};
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function verifyAccessTokenWithMsg91(
  authKey: string,
  accessToken: string,
): Promise<boolean> {
  const response = await fetch(
    "https://control.msg91.com/api/v5/widget/verifyAccessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authkey: authKey,
        "access-token": accessToken,
      }),
    },
  );
  if (!response.ok) {
    throw new Error("Token verification request failed");
  }
  const data = await response.json();
  return (data as { type?: string }).type === "success";
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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [widgetAccessToken, setWidgetAccessToken] = useState<string | null>(
    null,
  );
  const [googleAccount, setGoogleAccount] = useState<{
    name: string;
    email: string;
    avatar: string;
    picture?: string;
  } | null>(null);

  // Google OAuth state (real mode)
  const [gsiLoading, setGsiLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [gsiSigningIn, setGsiSigningIn] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived: joined OTP string for validation
  const otp = otpDigits.join("");

  // Widget mode: both API key and widget ID configured
  const isWidgetMode =
    !!localStorage.getItem("fooddash_sms_api_key") &&
    !!localStorage.getItem("fooddash_msg91_widget_id");

  // Google OAuth: real mode when client ID is configured
  const googleClientId =
    localStorage.getItem("fooddash_google_client_id") ?? "";
  const isGoogleRealMode = !!googleClientId;

  // handleGoogleCredentialResponse declared before the effect that uses it
  const handleGoogleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      const payload = decodeGoogleJwt(response.credential);
      const name = payload.name ?? "Google User";
      const email = payload.email ?? "";
      const picture = payload.picture;
      const initials = name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      setGsiSigningIn(true);
      setGoogleAccount({ name, email, avatar: initials, picture });

      // Save email for profile display
      if (email) localStorage.setItem("fooddash_login_email", email);
      localStorage.removeItem("fooddash_login_phone");

      toast.success(`Signing in as ${name}...`);
      setTimeout(() => login(), 800);
    },
    [login],
  );

  // Focus first OTP cell when OTP step mounts
  useEffect(() => {
    if (step === "mobile_otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [step]);

  // When google_picker step mounts in real mode, load GSI and initialize
  useEffect(() => {
    if (step !== "google_picker" || !isGoogleRealMode) return;

    setGsiLoading(true);
    setGsiReady(false);
    setGsiSigningIn(false);

    loadGsiScript()
      .then(() => {
        if (!window.google) {
          throw new Error("Google GSI not available after script load");
        }
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          ux_mode: "popup",
          context: "signin",
        });
        setGsiReady(true);
        setGsiLoading(false);
        // Auto-prompt One-Tap
        window.google.accounts.id.prompt((notification) => {
          const n = notification as {
            isNotDisplayed?: () => boolean;
            isSkippedMoment?: () => boolean;
          };
          if (n.isNotDisplayed?.() || n.isSkippedMoment?.()) {
            // One-Tap was not shown or skipped — user can click the button manually
          }
        });
      })
      .catch((err) => {
        console.error("GSI load error:", err);
        toast.error("Google Sign-In unavailable, falling back to demo mode");
        setGsiLoading(false);
        setGsiReady(false);
      });
  }, [step, isGoogleRealMode, googleClientId, handleGoogleCredentialResponse]);

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleGsiPrompt = () => {
    if (!window.google || !gsiReady) return;
    window.google.accounts.id.prompt();
  };

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
      if (isWidgetMode) {
        const authKey = localStorage.getItem("fooddash_sms_api_key")!;
        const wId = localStorage.getItem("fooddash_msg91_widget_id")!;
        await loadMsg91Script();
        setStep("mobile_otp");
        // Slight delay to let the step transition render before widget overlay
        setTimeout(() => {
          (
            window as unknown as { initSendOTP: (opts: unknown) => void }
          ).initSendOTP({
            widgetId: wId,
            tokenAuth: authKey,
            identifier: `91${phone}`,
            success: (data: { "access-token": string }) => {
              const token = data["access-token"];
              setWidgetAccessToken(token);
              toast.success("OTP verified by widget! Confirming login...");
              verifyWithWidgetToken(authKey, token);
            },
            failure: (err: unknown) => {
              console.error("MSG91 widget error", err);
              toast.error("OTP verification failed. Please try again.");
              setStep("mobile_phone");
            },
          });
        }, 200);
      } else {
        // Demo mode: store OTP in sessionStorage
        const demoOtp = generateDemoOtp();
        sessionStorage.setItem(`otp_${phone}`, demoOtp);
        setStep("mobile_otp");
        startResendCooldown();
      }
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyWithWidgetToken = async (authKey: string, token: string) => {
    setIsVerifyingOtp(true);
    try {
      const isValid = await verifyAccessTokenWithMsg91(authKey, token);
      if (!isValid) {
        toast.error("Access token verification failed. Please try again.");
        setStep("mobile_phone");
        return;
      }
      toast.success("Identity confirmed! Signing in...");
      // Save mobile number for profile display (widget mode)
      localStorage.setItem("fooddash_login_phone", `+91${phone}`);
      localStorage.removeItem("fooddash_login_email");
      login();
    } catch {
      toast.error("Verification failed. Please try again.");
      setStep("mobile_phone");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsSendingOtp(true);
    try {
      // Demo mode only — widget handles resend internally
      const demoOtp = generateDemoOtp();
      sessionStorage.setItem(`otp_${phone}`, demoOtp);
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
      // Demo mode: compare with sessionStorage
      const stored = sessionStorage.getItem(`otp_${phone}`);
      const isValid = stored === otp;
      if (!isValid) {
        toast.error("Invalid OTP. Please check and try again.");
        return;
      }
      sessionStorage.removeItem(`otp_${phone}`);
      toast.success("OTP verified! Connecting...");
      // Save mobile number for profile display
      localStorage.setItem("fooddash_login_phone", `+91${phone}`);
      localStorage.removeItem("fooddash_login_email");
      login();
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleManualWidgetVerify = async () => {
    if (!widgetAccessToken) {
      toast.error(
        "No access token available. Please complete the widget flow.",
      );
      return;
    }
    const authKey = localStorage.getItem("fooddash_sms_api_key");
    if (!authKey) return;
    await verifyWithWidgetToken(authKey, widgetAccessToken);
  };

  // Demo mode Google login (fake accounts)
  const handleDemoGoogleLogin = (account: (typeof GOOGLE_ACCOUNTS)[0]) => {
    setGoogleAccount(account);
    // Save email for profile display
    localStorage.setItem("fooddash_login_email", account.email);
    localStorage.removeItem("fooddash_login_phone");
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
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
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
                {isWidgetMode ? (
                  /* ── Widget mode UI ── */
                  <>
                    <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <p className="text-sm font-semibold text-primary">
                          Verification in Progress
                        </p>
                      </div>
                      <p className="text-xs text-primary/80 leading-snug">
                        MSG91 Widget is active. Complete the OTP verification in
                        the popup that appeared.
                      </p>
                    </div>

                    {widgetAccessToken ? (
                      <Button
                        className="w-full h-11 gradient-food border-0 text-white font-semibold"
                        onClick={handleManualWidgetVerify}
                        disabled={isLoggingIn || isVerifyingOtp}
                        data-ocid="auth.widget_verify_button"
                      >
                        {isLoggingIn || isVerifyingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Access Token"
                        )}
                      </Button>
                    ) : (
                      <div
                        className="text-center py-2"
                        data-ocid="auth.widget_verify_button"
                      >
                        <p className="text-xs text-muted-foreground">
                          Waiting for widget to complete…
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStep("mobile_phone");
                        setWidgetAccessToken(null);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    >
                      ← Change number
                    </button>
                  </>
                ) : (
                  /* ── Demo mode UI ── */
                  <>
                    {/* Clean single info box for demo mode */}
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none mt-0.5">
                          📱
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-primary">
                            Demo Mode
                          </p>
                          <p className="text-xs text-primary/80 leading-snug mt-0.5">
                            OTP messages are not sent via SMS in demo mode.
                            Enter any 6-digit code to continue.{" "}
                            <span className="text-primary/60">
                              Configure MSG91 in Admin → Integrations for real
                              OTP.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

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
                        if (cooldownRef.current)
                          clearInterval(cooldownRef.current);
                        setResendCooldown(0);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    >
                      ← Change number
                    </button>
                  </>
                )}
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
                {isGoogleRealMode ? (
                  /* ── Real Google OAuth (GSI) UI ── */
                  <>
                    {gsiSigningIn && googleAccount ? (
                      /* Signed-in confirmation card */
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="w-16 h-16 rounded-full gradient-food flex items-center justify-center text-white font-bold text-xl">
                          {googleAccount.picture ? (
                            <img
                              src={googleAccount.picture}
                              alt={googleAccount.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            googleAccount.avatar
                          )}
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm">
                            {googleAccount.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {googleAccount.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-primary text-xs font-medium">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Signing in...
                        </div>
                      </div>
                    ) : gsiLoading ? (
                      /* Loading spinner while GSI initializes */
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Loading Google Sign-In...
                        </p>
                      </div>
                    ) : (
                      /* GSI ready — show "Continue with Google" button */
                      <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground text-center">
                          Sign in with your Google account
                        </p>
                        <Button
                          variant="outline"
                          className="w-full h-12 font-semibold border-border bg-card hover:bg-secondary"
                          onClick={handleGsiPrompt}
                          disabled={!gsiReady || isLoggingIn}
                          data-ocid="auth.google_continue_button"
                        >
                          <svg
                            className="mr-2 h-4 w-4"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Continue with Google
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Demo mode: fake Google accounts ── */
                  <>
                    <p className="text-sm text-muted-foreground text-center mb-2">
                      Choose a Google account
                    </p>
                    {GOOGLE_ACCOUNTS.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleDemoGoogleLogin(account)}
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
                        {isLoggingIn &&
                          googleAccount?.email === account.email && (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto flex-shrink-0 text-muted-foreground" />
                          )}
                      </button>
                    ))}
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep("options");
                    setGsiReady(false);
                    setGsiLoading(false);
                    setGsiSigningIn(false);
                    setGoogleAccount(null);
                  }}
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
