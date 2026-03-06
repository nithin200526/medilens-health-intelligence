import DashboardLayout from "@/app/dashboard/layout";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your account and preferences.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Profile Information</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" defaultValue="John" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" defaultValue="john@example.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                <span className="text-sm text-slate-700">Email me when analysis is ready</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-slate-700">Enable dark mode (Beta)</span>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Button className="bg-blue-600 text-white">Save Changes</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
