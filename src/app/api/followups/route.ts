import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const baseFilter = user.role === 'agent' ? { assignedTo: user.id } : {};

    const [overdue, upcoming, stale] = await Promise.all([
      // Overdue follow-ups
      Lead.find({
        ...baseFilter,
        followUpDate: { $lt: now },
        status: { $nin: ['Closed', 'Lost'] },
      })
        .populate('assignedTo', 'name')
        .sort({ followUpDate: 1 })
        .limit(20)
        .lean(),

      // Upcoming follow-ups (next 7 days)
      Lead.find({
        ...baseFilter,
        followUpDate: { $gte: now, $lte: sevenDaysLater },
        status: { $nin: ['Closed', 'Lost'] },
      })
        .populate('assignedTo', 'name')
        .sort({ followUpDate: 1 })
        .limit(20)
        .lean(),

      // Stale leads (no activity in 7+ days)
      Lead.find({
        ...baseFilter,
        lastActivityAt: { $lt: sevenDaysAgo },
        status: { $nin: ['Closed', 'Lost'] },
      })
        .populate('assignedTo', 'name')
        .sort({ lastActivityAt: 1 })
        .limit(20)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: { overdue, upcoming, stale },
    });
  } catch (error) {
    console.error('GET followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
