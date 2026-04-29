import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';
import { updateLeadSchema } from '@/lib/validations';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();

    const lead = await Lead.findById(params.id)
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .lean();

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Agents can only view their assigned leads
    if (user.role === 'agent' && lead.assignedTo?._id?.toString() !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('GET lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Agents can only update their assigned leads
    if (user.role === 'agent' && lead.assignedTo?.toString() !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateLeadSchema.safeParse({
      ...body,
      budget: body.budget ? Number(body.budget) : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const oldStatus = lead.status;
    const oldPriority = lead.priority;

    // Update fields
    Object.assign(lead, parsed.data);
    lead.lastActivityAt = new Date();
    await lead.save();

    // Activity logging
    const activities = [];

    if (parsed.data.status && parsed.data.status !== oldStatus) {
      activities.push({
        lead: lead._id,
        performedBy: user.id,
        action: 'status_changed' as const,
        description: `Status changed from ${oldStatus} to ${parsed.data.status}`,
        metadata: { from: oldStatus, to: parsed.data.status },
      });
    }

    if (parsed.data.budget && lead.priority !== oldPriority) {
      activities.push({
        lead: lead._id,
        performedBy: user.id,
        action: 'priority_changed' as const,
        description: `Priority changed from ${oldPriority} to ${lead.priority}`,
        metadata: { from: oldPriority, to: lead.priority },
      });
    }

    if (parsed.data.notes) {
      activities.push({
        lead: lead._id,
        performedBy: user.id,
        action: 'notes_updated' as const,
        description: 'Notes updated',
      });
    }

    if (parsed.data.followUpDate) {
      activities.push({
        lead: lead._id,
        performedBy: user.id,
        action: 'followup_set' as const,
        description: `Follow-up scheduled for ${new Date(parsed.data.followUpDate).toLocaleDateString()}`,
        metadata: { date: parsed.data.followUpDate },
      });
    }

    if (activities.length === 0) {
      activities.push({
        lead: lead._id,
        performedBy: user.id,
        action: 'lead_updated' as const,
        description: 'Lead information updated',
      });
    }

    await Activity.insertMany(activities);

    await lead.populate('assignedTo', 'name email');
    await lead.populate('createdBy', 'name');

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('PATCH lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();
    const lead = await Lead.findByIdAndDelete(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    await Activity.create({
      lead: lead._id,
      performedBy: user.id,
      action: 'lead_deleted',
      description: `Lead for ${lead.name} was deleted`,
    });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('DELETE lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
