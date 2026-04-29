import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { assignLeadSchema } from '@/lib/validations';
import { sendLeadAssignedEmail } from '@/lib/email';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = assignLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    await connectDB();

    const [lead, agent] = await Promise.all([
      Lead.findById(params.id),
      User.findById(parsed.data.agentId),
    ]);

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!agent || agent.role !== 'agent') {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const isReassignment = !!lead.assignedTo;
    const previousAgentId = lead.assignedTo?.toString();

    lead.assignedTo = agent._id;
    lead.lastActivityAt = new Date();
    if (lead.status === 'New') lead.status = 'Contacted';
    await lead.save();

    // Activity log
    await Activity.create({
      lead: lead._id,
      performedBy: user.id,
      action: isReassignment ? 'lead_reassigned' : 'lead_assigned',
      description: isReassignment
        ? `Lead reassigned to ${agent.name}`
        : `Lead assigned to ${agent.name}`,
      metadata: { agentId: agent._id, agentName: agent.name, previousAgentId },
    });

    // Notify assigned agent
    await Notification.create({
      recipient: agent._id,
      title: 'New Lead Assigned',
      message: `You have been assigned lead: ${lead.name} (${lead.priority} Priority)`,
      type: 'lead_assigned',
      lead: lead._id,
    });

    // Send email notification
    sendLeadAssignedEmail({
      agentName: agent.name,
      agentEmail: agent.email,
      leadName: lead.name,
      leadPhone: lead.phone,
      property: lead.propertyInterest,
      budget: lead.budgetFormatted,
      priority: lead.priority,
      notes: lead.notes,
    }).catch(console.error);

    await lead.populate('assignedTo', 'name email');

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Assign lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
