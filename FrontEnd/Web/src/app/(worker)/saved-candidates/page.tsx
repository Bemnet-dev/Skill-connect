"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bookmark,
  Mail,
  Download,
  MoreVertical,
  Eye,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";

interface SavedCandidate {
  id: number;
  name: string;
  role: string;
  category: string;
  savedAt: string;
}

const fallbackCandidates: SavedCandidate[] = [
  { id: 1, name: "Guy Hawkins", role: "Technical Support Specialist", category: "Plumbing", savedAt: "2024-03-15" },
  { id: 2, name: "Jacob Jones", role: "Product Designer", category: "Carpentry", savedAt: "2024-03-14" },
  { id: 3, name: "Cameron Williamson", role: "Marketing Officer", category: "Painting", savedAt: "2024-03-13" },
  { id: 4, name: "Robert Fox", role: "Marketing Manager", category: "Electrical", savedAt: "2024-03-12" },
  { id: 5, name: "Kathryn Murphy", role: "Junior Graphic Designer", category: "Plumbing", savedAt: "2024-03-11" },
  { id: 6, name: "Darlene Robertson", role: "Visual Designer", category: "Carpentry", savedAt: "2024-03-10" },
  { id: 7, name: "Kristin Watson", role: "Senior UX Designer", category: "Painting", savedAt: "2024-03-09" },
  { id: 8, name: "Jenny Wilson", role: "Interaction Designer", category: "Electrical", savedAt: "2024-03-08" },
  { id: 9, name: "Marvin McKinney", role: "Networking Engineer", category: "Plumbing", savedAt: "2024-03-07" },
  { id: 10, name: "Theresa Webb", role: "Software Engineer", category: "Carpentry", savedAt: "2024-03-06" },
];

export default function SavedCandidatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState(fallbackCandidates);

  const filteredCandidates = candidates.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.role.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Saved Candidates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All of the candidates are visible until{" "}
            {formatDate("2024-03-24")}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search candidates..."
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Empty State */}
      {filteredCandidates.length === 0 && (
        <EmptyState
          title="No saved candidates"
          description="Save candidates from job applications to view them here."
        />
      )}

      {/* Candidates List */}
      {filteredCandidates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                    {candidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-gray-500">{candidate.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                    <Bookmark className="w-4 h-4 text-primary" />
                  </button>
                  <Link href={`/profile/${candidate.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </Button>
                  </Link>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
