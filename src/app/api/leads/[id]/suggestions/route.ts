import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const lead = await Lead.findById(params.id).lean();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const activities = await Activity.find({ lead: params.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const daysSinceActivity = lead.lastActivityAt
      ? Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const suggestions: string[] = [];
    const actionItems: string[] = [];

    // Rule-based AI suggestion engine
    if (lead.priority === 'High' && lead.status === 'New') {
      suggestions.push('🔴 HIGH PRIORITY: Contact this lead within 2 hours. High-budget clients expect immediate attention.');
      actionItems.push('Call the client now and introduce yourself');
      actionItems.push('Send a WhatsApp message with your property portfolio');
    }

    if (lead.status === 'New' && daysSinceActivity > 1) {
      suggestions.push(`⚠️ This lead has been untouched for ${daysSinceActivity} day(s). Immediate follow-up recommended.`);
      actionItems.push('Schedule a call for today');
    }

    if (lead.status === 'Contacted' && daysSinceActivity > 3) {
      suggestions.push('📞 Follow up with the client. It has been over 3 days since last contact.');
      actionItems.push('Send a property update or new listing that matches their interest');
      actionItems.push('Ask if they would like to schedule a site visit');
    }

    if (lead.propertyInterest === 'Plot' || lead.propertyInterest === 'Commercial') {
      suggestions.push('💼 Commercial/Plot buyers often need ROI data. Prepare investment return analysis.');
      actionItems.push('Share area development plans and infrastructure updates');
    }

    if (lead.budget > 20_000_000) {
      suggestions.push('💎 Premium client detected. Offer exclusive property tours and VIP service.');
      actionItems.push('Arrange a private viewing of top-tier properties');
      actionItems.push('Consider offering a dedicated property consultant');
    }

    const lastActionType = activities[0]?.action;
    if (lastActionType === 'status_changed' && lead.status === 'In Progress') {
      suggestions.push('📋 Client is actively engaged. Strike while the iron is hot!');
      actionItems.push('Present 2-3 shortlisted properties matching their criteria');
      actionItems.push('Discuss financing options if budget allows');
    }

    if (!lead.followUpDate && lead.status !== 'Closed' && lead.status !== 'Lost') {
      suggestions.push('📅 No follow-up date set. Schedule one to avoid this lead going cold.');
      actionItems.push('Set a follow-up reminder for 2-3 days from now');
    }

    // Suggested next follow-up date
    const suggestedFollowUp = new Date();
    if (lead.priority === 'High') suggestedFollowUp.setDate(suggestedFollowUp.getDate() + 1);
    else if (lead.priority === 'Medium') suggestedFollowUp.setDate(suggestedFollowUp.getDate() + 3);
    else suggestedFollowUp.setDate(suggestedFollowUp.getDate() + 7);

    return NextResponse.json({
      success: true,
      data: {
        suggestions: suggestions.length > 0 ? suggestions : ['✅ This lead is on track. Keep up the good work!'],
        actionItems,
        suggestedFollowUpDate: suggestedFollowUp.toISOString(),
        urgencyScore: lead.priority === 'High' ? 90 : lead.priority === 'Medium' ? 60 : 30,
        daysSinceActivity,
      },
    });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
