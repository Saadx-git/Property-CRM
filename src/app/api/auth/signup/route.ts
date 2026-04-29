import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { signupSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = rateLimit(`signup:${ip}`, 5);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many signup attempts' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

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

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role || 'agent',
      phone: parsed.data.phone,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
