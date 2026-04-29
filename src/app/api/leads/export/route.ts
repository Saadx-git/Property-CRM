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
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    await connectDB();

    const query = user.role === 'agent' ? { assignedTo: user.id } : {};
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'csv') {
      const headers = [
        'Name', 'Email', 'Phone', 'Property Interest', 'Budget (PKR)',
        'Budget Formatted', 'Status', 'Priority', 'Score', 'Source',
        'Location', 'Assigned To', 'Follow-Up Date', 'Notes', 'Created At',
      ];

      const rows = leads.map((lead) => [
        lead.name,
        lead.email || '',
        lead.phone,
        lead.propertyInterest,
        lead.budget,
        lead.budgetFormatted,
        lead.status,
        lead.priority,
        lead.score,
        lead.source,
        lead.location || '',
        (lead.assignedTo as { name?: string })?.name || 'Unassigned',
        lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '',
        lead.notes || '',
        new Date(lead.createdAt).toLocaleDateString(),
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
