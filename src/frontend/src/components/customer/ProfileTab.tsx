import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export function ProfileTab() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-6)}`
    : "Not logged in";

  const loginPhone = localStorage.getItem("fooddash_login_phone") ?? "";
  const loginEmail = localStorage.getItem("fooddash_login_email") ?? "";

  return (
    <div className="pb-28 pt-6 px-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full gradient-food flex items-center justify-center mb-3 shadow-food">
          <User className="h-9 w-9 text-white" />
        </div>
        <h2 className="font-display font-black text-xl">My Profile</h2>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {shortPrincipal}
        </p>
      </div>

      {/* Info cards */}
      <div className="space-y-3 mb-8">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Account Status
            </p>
            <p className="font-semibold text-sm text-foreground">
              Verified Customer
            </p>
          </div>
        </div>

        {loginPhone && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                Mobile Number
              </p>
              <p className="font-semibold text-sm text-foreground">
                {loginPhone}
              </p>
            </div>
          </div>
        )}

        {loginEmail && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                Email Address
              </p>
              <p className="font-semibold text-sm text-foreground truncate">
                {loginEmail}
              </p>
            </div>
          </div>
        )}

        {!loginPhone && !loginEmail && (
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">
                Logged in via
              </p>
              <p className="font-semibold text-sm text-foreground">
                Internet Identity
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Delivery Region
            </p>
            <p className="font-semibold text-sm text-foreground">India</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-12 gap-2 border-border font-semibold"
          data-ocid="profile.toggle"
        >
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          Switch Role
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 font-semibold"
          onClick={clear}
          data-ocid="auth.logout_button"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-10">
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
