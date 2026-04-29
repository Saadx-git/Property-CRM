import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { createLeadSchema } from '@/lib/validations';
import { sendNewLeadEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    // Agents only see assigned leads
    if (user.role === 'agent') query.assignedTo = user.id;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Lead.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: leads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('GET leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const limit = user.role === 'admin' ? 500 : 50;
    const rl = rateLimit(`leads:${ip}:${user.role}`, limit);
    if (!rl.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    const body = await req.json();
    const parsed = createLeadSchema.safeParse({ ...body, budget: Number(body.budget) });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const lead = await Lead.create({ ...parsed.data, createdBy: user.id });

    // Populate for response
    await lead.populate('createdBy', 'name');

    // Create activity log
    await Activity.create({
      lead: lead._id,
      performedBy: user.id,
      action: 'lead_created',
      description: `Lead created for ${lead.name} with ${lead.priority} priority`,
      metadata: { budget: lead.budget, priority: lead.priority, source: lead.source },
    });

    // Notify all admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('email').lean();

    await Promise.allSettled([
      ...admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          title: 'New Lead Created',
          message: `${lead.name} - ${lead.priority} Priority - ${lead.budgetFormatted}`,
          type: 'lead_created',
          lead: lead._id,
        })
      ),
      // Send email to first admin
      admins.length > 0
        ? sendNewLeadEmail({
            leadName: lead.name,
            leadEmail: lead.email,
            leadPhone: lead.phone,
            property: lead.propertyInterest,
            budget: lead.budgetFormatted,
            source: lead.source,
            priority: lead.priority,
            adminEmail: admins[0].email,
          }).catch(console.error)
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch (error) {
    console.error('POST lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
