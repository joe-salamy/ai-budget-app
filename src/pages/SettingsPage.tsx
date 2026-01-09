import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock, LogOut, AlertTriangle } from "lucide-react";

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, updatePassword, error, clearError } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordUpdated(false);
    clearError();

    try {
      await updatePassword(newPassword);
      setPasswordUpdated(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleDeleteAccount = () => {
    // This will be implemented in a future phase with a serverless function
    alert("Account deletion will be available in a future update.");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account preferences</p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-600 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">Email</label>
            <p className="text-white mt-1">{user?.email || "Not available"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">User ID</label>
            <p className="text-gray-400 text-sm mt-1 font-mono">{user?.id || "Not available"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Account Created</label>
            <p className="text-gray-400 text-sm mt-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not available"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-600/20 border-2 border-yellow-600 flex items-center justify-center">
              <Lock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Input
              type="password"
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordErrors({});
                setPasswordUpdated(false);
              }}
              error={passwordErrors.newPassword}
              helperText="Minimum 6 characters"
              fullWidth
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />

            <Input
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordErrors({});
                setPasswordUpdated(false);
              }}
              error={passwordErrors.confirmPassword}
              fullWidth
              disabled={isUpdatingPassword}
              autoComplete="new-password"
            />

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
                {error}
              </div>
            )}

            {passwordUpdated && (
              <div className="p-3 rounded-lg bg-green-900/20 border border-green-800 text-green-400 text-sm">
                Password updated successfully!
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingPassword}
              disabled={isUpdatingPassword}
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Placeholder Cards for Future Phases */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-gray-400">Accounts & Categories</CardTitle>
          <CardDescription>Management interface coming in Phase 3</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            You'll be able to manage your financial accounts, categories, and subcategories here.
          </p>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-gray-400">AI Assistant</CardTitle>
          <CardDescription>Personality settings coming in Phase 9</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">
            Customize your AI assistant's personality (Professional, Friendly, or Stern).
          </p>
        </CardContent>
      </Card>

      {/* Sign Out & Delete Account */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div>
              <h3 className="font-medium text-white">Sign Out</h3>
              <p className="text-sm text-gray-400">Sign out of your account on this device</p>
            </div>
            <Button variant="secondary" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/10 border border-red-800/50">
            <div>
              <h3 className="font-medium text-red-400">Delete Account</h3>
              <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
            </div>
            {!showDeleteConfirm ? (
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} size="sm">
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount} size="sm">
                  Confirm Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
