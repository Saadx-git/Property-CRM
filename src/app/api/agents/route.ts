import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { createAgentSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const agents = await User.find({ role: 'agent' })
      .select('name email phone isActive createdAt')
      .lean();

    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error('GET agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { role: string };
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const agent = await User.create({ ...parsed.data, role: 'agent' });

    return NextResponse.json(
      {
        success: true,
        data: { id: agent._id, name: agent.name, email: agent.email, role: agent.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
