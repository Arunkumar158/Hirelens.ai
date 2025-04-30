import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { buttonVariants } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "../components/ui/alert-dialog";

export default function JobSeekerSettings() {
  // Form State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [resumeVisible, setResumeVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    jobMatches: false,
    careerTips: false,
    productUpdates: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save logic
    alert("Changes saved!");
  };

  const handleDeleteAccount = () => {
    // TODO: Delete account logic
    setDeleteDialogOpen(false);
    alert("Account deleted");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Card className="rounded-2xl shadow-lg p-6 bg-white dark:bg-muted text-muted-foreground space-y-6">
          <h1 className="text-2xl font-bold mb-4">Settings</h1>
          <form className="space-y-6" onSubmit={handleSave}>
            {/* Profile Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    autoComplete="name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    autoComplete="email"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    autoComplete="tel"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button type="submit" className="mt-6 w-full">Save Changes</Button>
            </div>

            {/* Resume Visibility */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Resume Visibility</h2>
              <div className="flex items-center justify-between">
                <Label htmlFor="resume-visibility">Make resume visible to recruiters</Label>
                <Switch
                  id="resume-visibility"
                  checked={resumeVisible}
                  onCheckedChange={setResumeVisible}
                />
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jobMatches"
                    name="jobMatches"
                    checked={notifications.jobMatches}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, jobMatches: !!checked }))
                    }
                  />
                  <Label htmlFor="jobMatches">New job matches</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="careerTips"
                    name="careerTips"
                    checked={notifications.careerTips}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, careerTips: !!checked }))
                    }
                  />
                  <Label htmlFor="careerTips">Weekly career tips</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="productUpdates"
                    name="productUpdates"
                    checked={notifications.productUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, productUpdates: !!checked }))
                    }
                  />
                  />
                  <Label htmlFor="productUpdates">Product updates</Label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogTrigger asChild>
    <Button
      type="button"
      variant="destructive"
      className="w-full"
      onClick={() => setDeleteDialogOpen(true)}
    >
      Delete Account
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Account</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete your account? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDeleteAccount}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
