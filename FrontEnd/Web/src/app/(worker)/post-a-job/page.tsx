"use client";

import React from "react";
import {
  Briefcase,
  DollarSign,
  Tag,
  FileText,
  Send,
  User,
  Clock,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function PostAJobPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Post a Job
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details to post a new job request.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title
          </label>
          <input
            type="text"
            placeholder="Add job title, role, vacancies etc"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Tags & Job Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              placeholder="Job keyword, tags etc..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Role
            </label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
              <option>Select...</option>
              <option>Plumber</option>
              <option>Electrician</option>
              <option>Carpenter</option>
              <option>Painter</option>
            </select>
          </div>
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Salary
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Salary</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Minimum salary..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">ETB</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Salary</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Maximum salary..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-400">ETB</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Salary Type</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>Per Hour</option>
                <option>Per Day</option>
                <option>Per Month</option>
                <option>Fixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advance Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Advance Information
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Education</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>High School</option>
                <option>Diploma</option>
                <option>Bachelor</option>
                <option>Master</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Experience</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>0-1 Years</option>
                <option>1-3 Years</option>
                <option>3-5 Years</option>
                <option>5+ Years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job Type</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vacancies</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>5+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expiration Date</label>
              <input
                type="text"
                placeholder="DD/MM/YYYY"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Job Level</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white">
                <option>Select...</option>
                <option>Entry Level</option>
                <option>Mid Level</option>
                <option>Senior Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Apply Job on */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Apply Job on:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-primary bg-blue-50 cursor-pointer transition-colors">
              <input type="radio" name="applyOn" defaultChecked className="mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">On SkillConnect</p>
                <p className="text-xs text-gray-500 mt-1">
                  Candidate will apply job using SkillConnect & all application will show on your dashboard.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary cursor-pointer transition-colors">
              <input type="radio" name="applyOn" className="mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">External Platform</p>
                <p className="text-xs text-gray-500 mt-1">
                  Candidate apply job on your website, all application on your own website.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary cursor-pointer transition-colors">
              <input type="radio" name="applyOn" className="mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">On Your Email</p>
                <p className="text-xs text-gray-500 mt-1">
                  Candidate apply job on your email address, and all application in your email.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Description & Responsibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description &amp; Responsibility
          </label>
          <textarea
            rows={5}
            placeholder="Add your job description..."
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsibilities
          </label>
          <textarea
            rows={5}
            placeholder="Add your job responsibilities..."
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

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="lg">
            <Send className="w-4 h-4" />
            Post Job
          </Button>
        </div>
      </div>
    </div>
  );
}
