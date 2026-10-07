"use client";

import React, { useState } from "react";
import {
  User,
  Briefcase,
  Globe,
  Shield,
  Save,
  Upload,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function WorkerSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "company" | "founding" | "social" | "account"
  >("company");

  const tabs = [
    { id: "company" as const, label: "Company Info", icon: User },
    { id: "founding" as const, label: "Founding Info", icon: Briefcase },
    { id: "social" as const, label: "Social Media Profile", icon: Globe },
    { id: "account" as const, label: "Account Setting", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Settings
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company Info Tab */}
      {activeTab === "company" && (
        <div className="space-y-6">
          {/* Logo & Banner */}
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4">
              Logo &amp; Banner Image
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Logo
                </label>
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Click to upload</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>3.5 MB</span>
                  <button className="hover:text-red-500">Remove</button>
                  <button className="text-primary hover:underline">Replace</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image
                </label>
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <Upload className="w-6 h-6" />
                  <span className="text-xs">Click to upload</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>4.3 MB</span>
                  <button className="hover:text-red-500">Remove</button>
                  <button className="text-primary hover:underline">Replace</button>
                </div>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company name
            </label>
            <input
              type="text"
              placeholder="Enter company name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* About Us */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About us
            </label>
            <textarea
              rows={5}
              placeholder="Write down about your company here. Let the candidate know who we are..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex items-center gap-4 mt-2 text-gray-400">
              <button className="text-xs font-medium">B</button>
              <button className="text-xs font-medium">I</button>
              <button className="text-xs font-medium">U</button>
              <button className="text-xs font-medium">S</button>
              <button className="text-xs font-medium">🔗</button>
              <button className="text-xs font-medium">☰</button>
              <button className="text-xs font-medium">≣</button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary">
              <Save className="w-4 h-4" />
              Save Change
            </Button>
          </div>
        </div>
      )}

      {/* Founding Info Tab */}
      {activeTab === "founding" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>Individual</option>
                <option>Company</option>
                <option>Partnership</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry Types
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>Carpentry</option>
                <option>Painting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Size
              </label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>1-10</option>
                <option>11-50</option>
                <option>51-100</option>
                <option>100+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Establishment
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Website
              </label>
              <input
                type="url"
                placeholder="Website url..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Vision
            </label>
            <textarea
              rows={5}
              placeholder="Tell us what Vision of your company..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="primary">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === "social" && (
        <div className="space-y-4">
          {[
            { name: "Facebook", placeholder: "Profile link/url..." },
            { name: "Twitter", placeholder: "Profile link/url..." },
            { name: "Instagram", placeholder: "Profile link/url..." },
            { name: "Youtube", placeholder: "Profile link/url..." },
          ].map((social, idx) => (
            <div key={social.name} className="flex items-center gap-3">
              <label className="block text-sm font-medium text-gray-700 min-w-[100px]">
                Social Link {idx + 1}
              </label>
              <select className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>{social.name}</option>
              </select>
              <input
                type="url"
                placeholder={social.placeholder}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <Button variant="outline" className="w-full sm:w-auto">
            + Add New Social Link
          </Button>

          <div className="flex justify-end pt-4">
            <Button variant="primary">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Account Setting Tab */}
      {activeTab === "account" && (
        <div className="space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Map Location
                </label>
                <input
                  type="text"
                  placeholder="Enter your location"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Phone number.."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="primary">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Change Password */}
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="primary">Change Password</Button>
            </div>
          </div>

          {/* Delete Account */}
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-2">
              Delete Your Company
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              If you delete your account, you will no longer be able to get
              information about the matched jobs, following employers, and job
              alerts, shortlisted jobs and more. You will be abandoned from all
              the services of SkillConnect.
            </p>
            <Button variant="danger">Close Account</Button>
          </div>
        </div>
      )}
    </div>
  );
}
