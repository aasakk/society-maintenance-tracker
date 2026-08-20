"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";

type Complaint = {
  id: string;
  category: string;
  location: string;
  status: string;
  priority: string;
  isOverdue: boolean;
  createdAt: string;
  resident: { name: string; flatNumber: string };
};

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]); // For un-filtered stats
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchComplaints = useCallback(() => {
    let query = "/api/admin/complaints?";
    if (filterCategory) query += `category=${filterCategory}&`;
    if (filterStatus) query += `status=${filterStatus}&`;
    if (filterFrom) query += `from=${filterFrom}&`;
    if (filterTo) query += `to=${filterTo}&`;

    fetch(query)
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      });

    // Also fetch all without filters for accurate top-level metrics
    fetch("/api/admin/complaints")
      .then((res) => res.json())
      .then((data) => {
        setAllComplaints(data);
      });
  }, [filterCategory, filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateStatus = async (id: string, newStatus: string) => {
    const note = prompt(`Enter note for changing status to ${newStatus} (optional):`);
    const res = await fetch(`/api/admin/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, note }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
    }
    fetchComplaints();
  };
  
  const updatePriority = async (id: string, newPriority: string) => {
    await fetch(`/api/admin/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: newPriority }),
    });
    fetchComplaints();
  };

  // Metrics Logic based on allComplaints
  const overdueCount = allComplaints.filter(c => c.isOverdue).length;
  const statusCounts = {
    Open: allComplaints.filter(c => c.status === "Open").length,
    InProgress: allComplaints.filter(c => c.status === "In Progress").length,
    Resolved: allComplaints.filter(c => c.status === "Resolved").length,
  };
  
  const categoryCounts = allComplaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Total Overdue</h3>
          <p className="mt-1 text-3xl font-semibold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Complaints by Status</h3>
          <div className="mt-2 text-sm text-gray-700 flex justify-between">
            <span>Open: <b>{statusCounts.Open}</b></span>
            <span>In Progress: <b>{statusCounts.InProgress}</b></span>
            <span>Resolved: <b>{statusCounts.Resolved}</b></span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500 overflow-y-auto max-h-24">
          <h3 className="text-sm font-medium text-gray-500">Complaints by Category</h3>
          <ul className="mt-1 text-sm text-gray-700">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <li key={cat} className="flex justify-between"><span>{cat}</span> <b>{count}</b></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-md shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700">Category</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary">
            <option value="">All</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Security">Security</option>
            <option value="Lift">Lift</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary">
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">From Date</label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">To Date</label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="mt-1 block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" />
        </div>
        <button onClick={() => { setFilterCategory(""); setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }} className="text-sm text-blue-600 hover:underline">
          Clear Filters
        </button>
      </div>

      {/* Complaints List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                      value={complaint.priority || "Medium"}
                      onChange={(e) => updatePriority(complaint.id, e.target.value)}
                      disabled={complaint.status === "Resolved"}
                      className="text-xs font-medium rounded border-gray-300 py-1 pl-2 pr-6 disabled:opacity-50"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>

                    <select
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                      disabled={complaint.status === "Resolved"}
                      className={`text-xs leading-5 font-semibold rounded-full border-0 py-1 pl-3 pr-8 focus:ring-2 disabled:opacity-50
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
                    <p>{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {complaints.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-gray-500 text-sm">No complaints match your filters.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
