import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import AgentDashboard from '@/components/dashboard/AgentDashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as { id: string; name?: string | null; role: string };

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }
  return <AgentDashboard userId={user.id} userName={user.name || 'Agent'} />;
}
