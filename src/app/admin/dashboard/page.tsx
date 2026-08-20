"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

type Complaint = {
  id: string;
  category: string;
  location: string;
  status: string;
  isOverdue: boolean;
  createdAt: string;
  resident: { name: string; flatNumber: string };
};

type Hotspot = {
  category: string;
  location: string;
  count: number;
};

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = () => {
    fetch("/api/admin/complaints")
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const note = prompt(`Enter note for changing status to ${newStatus} (optional):`);
    await fetch(`/api/admin/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note }),
    });
    fetchComplaints(); // Refresh list
  };

  // WOW Factor: Hotspot detection
  const calculateHotspots = (): Hotspot[] => {
    const recent = complaints.filter(c => {
      const daysOld = (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24);
      return daysOld <= 60; // 60 days rolling window
    });

    const counts: Record<string, number> = {};
    recent.forEach(c => {
      const key = `${c.category}|${c.location}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count >= 3) // threshold: 3+ complaints
      .map(([key, count]) => {
        const [category, location] = key.split("|");
        return { category, location, count };
      })
      .sort((a, b) => b.count - a.count);
  };

  const hotspots = calculateHotspots();
  const overdueCount = complaints.filter(c => c.isOverdue).length;
  const openCount = complaints.filter(c => c.status === "Open").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
          <dt className="text-sm font-medium text-gray-500 truncate">Overdue Complaints</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">{overdueCount}</dd>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <dt className="text-sm font-medium text-gray-500 truncate">Open Complaints</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{openCount}</dd>
        </div>
      </div>

      {/* Hotspots Panel (Wow Factor) */}
      {hotspots.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Recurring Issue Intelligence (Hotspots)</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>The following areas have reported the same issue multiple times in the last 60 days. This likely indicates a root-cause problem rather than isolated incidents.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {hotspots.map((h, i) => (
                    <li key={i}>
                      <strong>{h.location}</strong> — {h.category}: {h.count} complaints
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaints List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Complaints</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {complaints.map((complaint) => (
            <li key={complaint.id} className={complaint.isOverdue ? "bg-red-50" : ""}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary truncate">
                    {complaint.category} — {complaint.location}
                    {complaint.isOverdue && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>}
                  </p>
                  <div className="ml-2 flex-shrink-0 flex space-x-2">
                    <select
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                      className={`text-xs leading-5 font-semibold rounded-full border-0 py-1 pl-3 pr-8 focus:ring-2 focus:ring-primary
                        ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                          complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      Reported by {complaint.resident.name} (Flat: {complaint.resident.flatNumber})
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {formatDate(complaint.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {complaints.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">No complaints found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
