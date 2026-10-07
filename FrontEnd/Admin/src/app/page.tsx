import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            SkillConnect Admin
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Admin back office for managing verifications and disputes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/verification-queue"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-3"
          >
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Verification Queue</h3>
            <p className="text-sm text-gray-500">
              Review worker ID and license submissions.
            </p>
          </Link>

          <Link
            href="/admin/disputes"
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-3"
          >
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900">Disputes Desk</h3>
            <p className="text-sm text-gray-500">
              Arbitrate customer and worker disagreements.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
