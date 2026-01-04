export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
      
      {/* Challenge Card Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        {/* Challenge Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Streaks */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Confirmation Section */}
        <div className="mt-4">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
          <div className="flex gap-4">
            <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}

