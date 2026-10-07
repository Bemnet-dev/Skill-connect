"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Edit3,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function WorkerProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
            AK
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Abebe Kebede</h1>
              <Badge variant="success">Verified</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Professional Plumber &amp; Maintenance Specialist
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                Bole, Addis Ababa
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" />
                4.8 Rating
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-400" />
                5+ Years Experience
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="w-4 h-4" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">About</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Experienced plumber with 5+ years in residential and commercial
              plumbing services. Specialized in pipe repair, installation, and
              maintenance. Committed to quality workmanship and customer
              satisfaction.
            </p>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">Services & Skills</h3>
            <div className="flex flex-wrap gap-2">
              {["Plumbing", "Pipe Repair", "Installation", "Maintenance", "Emergency Repair"].map(
                (skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">Experience</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Senior Plumber</p>
                  <p className="text-xs text-gray-500">ABC Construction | 2020 - Present</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Plumber</p>
                  <p className="text-xs text-gray-500">XYZ Services | 2018 - 2020</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">abebe@example.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">+251 911 223 344</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Bole, Addis Ababa</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Jobs Completed</span>
                <span className="text-sm font-bold text-gray-900">47</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Quotes Submitted</span>
                <span className="text-sm font-bold text-gray-900">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Response Rate</span>
                <span className="text-sm font-bold text-gray-900">85%</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4">Availability</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Available Now</span>
              </div>
              <p className="text-xs text-gray-500">Mon - Fri, 8:00 AM - 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
