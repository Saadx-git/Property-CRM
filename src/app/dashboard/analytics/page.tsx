import AdminDashboard from '@/components/dashboard/AdminDashboard';

export default function AnalyticsPage() {
  return (
    <div className="animate-in">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-white">Analytics & Insights</h2>
        <p className="text-gray-500 text-sm mt-1">Full system overview and performance metrics</p>
      </div>
      <AdminDashboard />
    </div>
  );
}
