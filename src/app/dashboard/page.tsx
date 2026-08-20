"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Complaint = {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaints")
      .then((res) => res.json())
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
        <Link
          href="/dashboard/new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-gray-800"
        >
          New Complaint
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : complaints.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          You haven't logged any complaints yet.
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <li key={complaint.id}>
                <Link href={`/dashboard/complaints/${complaint.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary truncate">
                        {complaint.category}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                            complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {complaint.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {complaint.description.substring(0, 50)}...
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Reported on {formatDate(complaint.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
