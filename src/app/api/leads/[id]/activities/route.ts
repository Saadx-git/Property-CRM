import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Activity from '@/models/Activity';
import Lead from '@/models/Lead';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();

    // Agents can only view activities for their leads
    if (user.role === 'agent') {
      const lead = await Lead.findById(params.id).lean();
      if (!lead || lead.assignedTo?.toString() !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const activities = await Activity.find({ lead: params.id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('GET activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
