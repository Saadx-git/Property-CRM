import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'lead_created' | 'lead_assigned' | 'lead_updated' | 'followup_due' | 'system';
  lead?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['lead_created', 'lead_assigned', 'lead_updated', 'followup_due', 'system'],
      required: true,
    },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
