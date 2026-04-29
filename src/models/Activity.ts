import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityAction =
  | 'lead_created'
  | 'lead_updated'
  | 'status_changed'
  | 'lead_assigned'
  | 'lead_reassigned'
  | 'notes_updated'
  | 'followup_set'
  | 'followup_completed'
  | 'priority_changed'
  | 'lead_deleted';

export interface IActivity extends Document {
  lead: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    lead: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: [
        'lead_created', 'lead_updated', 'status_changed', 'lead_assigned',
        'lead_reassigned', 'notes_updated', 'followup_set', 'followup_completed',
        'priority_changed', 'lead_deleted',
      ],
      required: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivitySchema.index({ lead: 1, createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
