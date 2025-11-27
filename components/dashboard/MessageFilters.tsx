/**
 * MessageFilters - Filter and sort controls for message lists
 *
 * Requirements: 7.2, 8.2
 */

"use client";

import { MessageStatus } from "@/types/contract";

interface MessageFiltersProps {
  statusFilter: MessageStatus | "All";
  onStatusFilterChange: (status: MessageStatus | "All") => void;
  sortOrder: "newest" | "oldest";
  onSortOrderChange: (order: "newest" | "oldest") => void;
}

export function MessageFilters({
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: MessageFiltersProps) {
  const statusOptions: Array<MessageStatus | "All"> = [
    "All",
    "Locked",
    "Unlockable",
    "Unlocked",
  ];

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <div className="flex-1">
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as MessageStatus | "All")
            }
            className="w-full rounded-md bg-gray-900 text-gray-100 border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex-1">
          <label
            htmlFor="sort-order"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Sort by Date
          </label>
          <select
            id="sort-order"
            value={sortOrder}
            onChange={(e) =>
              onSortOrderChange(e.target.value as "newest" | "oldest")
            }
            className="w-full rounded-md bg-gray-900 text-gray-100 border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
