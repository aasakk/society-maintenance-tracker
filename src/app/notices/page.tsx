"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  body: string;
  isImportant: boolean;
  createdAt: string;
  postedByUser: { name: string };
};

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => res.json())
      .then((data) => {
        setNotices(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notice Board</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : notices.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          No notices posted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`bg-white shadow rounded-lg overflow-hidden ${notice.isImportant ? 'border-l-4 border-red-500' : ''}`}
            >
              <div className="px-4 py-5 sm:px-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    {notice.isImportant && (
                      <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Important
                      </span>
                    )}
                    {notice.title}
                  </h3>
                  <span className="text-sm text-gray-500">{formatDate(notice.createdAt)}</span>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Posted by {notice.postedByUser.name}</p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6 whitespace-pre-wrap text-sm text-gray-700">
                {notice.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
