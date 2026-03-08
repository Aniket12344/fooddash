import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle2, Loader2, Phone, Save, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export interface RiderProfileData {
  name: string;
  phone: string;
  selfieDataUrl: string;
  isComplete: boolean;
}

const STORAGE_KEY = "fooddash_rider_profile";

interface RiderProfileProps {
  profileData: RiderProfileData | null;
  onProfileSaved: (data: RiderProfileData) => void;
}

export function RiderProfile({
  profileData,
  onProfileSaved,
}: RiderProfileProps) {
  const { identity } = useInternetIdentity();
  const [name, setName] = useState(profileData?.name ?? "");
  const [phone, setPhone] = useState(profileData?.phone ?? "");
  const [selfieDataUrl, setSelfieDataUrl] = useState<string>(
    profileData?.selfieDataUrl ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const _isComplete = !!(name.trim() && phone.trim() && selfieDataUrl);

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfieDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!selfieDataUrl) {
      toast.error("Selfie is required to complete your rider profile");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));

    const data: RiderProfileData = {
      name: name.trim(),
      phone: phone.trim(),
      selfieDataUrl,
      isComplete: true,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Also update admin riders list
    const principal =
      identity?.getPrincipal().toString() ?? `rider_${Date.now()}`;
    const adminRiders = JSON.parse(
      localStorage.getItem("fooddash_riders_admin") ?? "[]",
    ) as Array<{
      principal: string;
      name: string;
      phone: string;
      isActive: boolean;
      hasSelfie: boolean;
    }>;

    const existing = adminRiders.findIndex((r) => r.principal === principal);
    const riderEntry = {
      principal,
      name: data.name,
      phone: data.phone,
      isActive: true,
      hasSelfie: !!selfieDataUrl,
    };

    if (existing >= 0) {
      adminRiders[existing] = riderEntry;
    } else {
      adminRiders.push(riderEntry);
    }
    localStorage.setItem("fooddash_riders_admin", JSON.stringify(adminRiders));

    setIsSaving(false);
    toast.success("Profile saved! You're verified and ready to deliver. 🚴");
    onProfileSaved(data);
  };

  return (
    <div className="px-4 pt-5 pb-28 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl">Rider Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your profile to start accepting deliveries
        </p>
      </div>

      {/* Verification status */}
      {profileData?.isComplete ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0" />
          <div>
            <p className="font-semibold text-success">Verified Rider</p>
            <p className="text-xs text-success/80">
              Your profile is complete and verified
            </p>
          </div>
          <Badge className="ml-auto bg-success/20 text-success border-success/30 text-xs">
            ✓ Active
          </Badge>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
          <Camera className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-warning">Profile Incomplete</p>
            <p className="text-xs text-warning/80">
              Please upload your selfie to complete verification and start
              delivering
            </p>
          </div>
        </div>
      )}

      {/* Profile form */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        {/* Name */}
        <div>
          <Label
            htmlFor="rider-name"
            className="text-xs font-semibold mb-1.5 flex items-center gap-1"
          >
            <User className="h-3.5 w-3.5" />
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="rider-name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 bg-background border-border"
            data-ocid="rider.name_input"
          />
        </div>

        {/* Phone */}
        <div>
          <Label
            htmlFor="rider-phone"
            className="text-xs font-semibold mb-1.5 flex items-center gap-1"
          >
            <Phone className="h-3.5 w-3.5" />
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-2">
            <div className="h-11 flex items-center px-3 bg-muted rounded-lg border border-border text-sm font-medium text-muted-foreground">
              +91
            </div>
            <Input
              id="rider-phone"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="h-11 flex-1 bg-background border-border"
              inputMode="numeric"
              data-ocid="rider.phone_input"
            />
          </div>
        </div>
      </div>

      {/* Selfie upload */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div>
          <h2 className="font-display font-bold text-base mb-1 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Selfie Upload <span className="text-destructive text-sm">*</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            A clear photo of your face is required for verification
          </p>
        </div>

        {selfieDataUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={selfieDataUrl}
                alt="Your selfie"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/30"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full gradient-food flex items-center justify-center border-2 border-background">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
              data-ocid="rider.upload_button"
            >
              <Camera className="h-3.5 w-3.5" />
              Retake Photo
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            data-ocid="rider.dropzone"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Upload your selfie</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap to take a photo or upload from gallery
              </p>
            </div>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleSelfieChange}
        />
      </div>

      {/* Completion indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div
          className={`w-2 h-2 rounded-full ${name.trim() ? "bg-success" : "bg-muted"}`}
        />
        Name
        <div
          className={`w-2 h-2 rounded-full ${phone.trim() ? "bg-success" : "bg-muted"}`}
        />
        Phone
        <div
          className={`w-2 h-2 rounded-full ${selfieDataUrl ? "bg-success" : "bg-warning animate-pulse"}`}
        />
        Selfie{" "}
        {!selfieDataUrl && (
          <span className="text-warning font-medium">(required)</span>
        )}
      </div>

      {/* Save button */}
      <Button
        className="w-full h-12 text-base font-semibold gradient-food border-0 text-white shadow-food"
        onClick={handleSave}
        disabled={isSaving || !name.trim() || !phone.trim() || !selfieDataUrl}
        data-ocid="rider.save_button"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </>
        )}
      </Button>
    </div>
  );
}
