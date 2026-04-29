import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as { id: string; role: string };
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLeads,
      statusDistribution,
      priorityDistribution,
      sourceDistribution,
      agentPerformance,
      recentLeads,
      overdueFollowups,
      leadsThisMonth,
      leadsThisWeek,
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $match: { assignedTo: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            totalLeads: { $sum: 1 },
            closedLeads: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
            avgScore: { $avg: '$score' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'agent',
          },
        },
        { $unwind: '$agent' },
        {
          $project: {
            agentName: '$agent.name',
            agentEmail: '$agent.email',
            totalLeads: 1,
            closedLeads: 1,
            highPriority: 1,
            avgScore: { $round: ['$avgScore', 1] },
            conversionRate: {
              $round: [
                { $multiply: [{ $divide: ['$closedLeads', '$totalLeads'] }, 100] },
                1,
              ],
            },
          },
        },
        { $sort: { totalLeads: -1 } },
      ]),

      Lead.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'name')
        .lean(),

      Lead.countDocuments({
        followUpDate: { $lt: now },
        status: { $nin: ['Closed', 'Lost'] },
      }),

      Lead.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    // Monthly trend (last 6 months)
    const monthlyTrend = await Lead.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const agents = await User.countDocuments({ role: 'agent', isActive: true });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalLeads,
          leadsThisMonth,
          leadsThisWeek,
          overdueFollowups,
          totalAgents: agents,
          unassignedLeads: await Lead.countDocuments({ assignedTo: { $exists: false } }),
        },
        statusDistribution,
        priorityDistribution,
        sourceDistribution,
        agentPerformance,
        recentLeads,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
