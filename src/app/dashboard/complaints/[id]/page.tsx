"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

type ComplaintDetail = {
  id: string;
  category: string;
  description: string;
  location: string;
  status: string;
  createdAt: string;
  history: {
    id: string;
    oldStatus: string;
    newStatus: string;
    note: string;
    createdAt: string;
    changedByUser: { name: string; role: string };
  }[];
};

export default function ComplaintDetailPage({ params }: { params: { id: string } }) {
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/complaints/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setComplaint(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!complaint || (complaint as any).error) return <div className="p-8 text-red-500">Error loading complaint</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complaint Details</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">{complaint.category}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{complaint.location}</p>
          </div>
          <div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                complaint.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'}`}>
              {complaint.status}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <p className="text-sm text-gray-900">{complaint.description}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Status History</h2>
      <div className="flow-root">
        <ul className="-mb-8">
          {complaint.history.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== complaint.history.length - 1 ? (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Status changed to <span className="font-medium text-gray-900">{event.newStatus}</span> by {event.changedByUser.name}
                      </p>
                      {event.note && <p className="text-sm text-gray-700 mt-1">Note: {event.note}</p>}
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
