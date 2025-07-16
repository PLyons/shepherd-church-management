import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { member } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {member?.first_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening in your church community.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Members</h3>
          <p className="text-3xl font-bold text-blue-600">--</p>
          <p className="text-sm text-gray-500">Total members</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold text-green-600">--</p>
          <p className="text-sm text-gray-500">This week</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Recent Donations</h3>
          <p className="text-3xl font-bold text-purple-600">--</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
      </div>
    </div>
  );
}