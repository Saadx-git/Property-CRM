import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadStatus = 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Lost';
export type LeadPriority = 'High' | 'Medium' | 'Low';
export type PropertyType = 'House' | 'Apartment' | 'Plot' | 'Commercial' | 'Villa' | 'Other';
export type LeadSource = 'Facebook Ads' | 'Walk-in' | 'Website' | 'Referral' | 'Phone' | 'Other';

export interface ILead extends Document {
  name: string;
  email?: string;
  phone: string;
  propertyInterest: PropertyType;
  budget: number;
  budgetFormatted: string;
  location?: string;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  source: LeadSource;
  notes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  followUpDate?: Date;
  lastActivityAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    propertyInterest: {
      type: String,
      enum: ['House', 'Apartment', 'Plot', 'Commercial', 'Villa', 'Other'],
      required: [true, 'Property interest is required'],
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    budgetFormatted: { type: String },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Closed', 'Lost'],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
    },
    score: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone', 'Other'],
      default: 'Other',
    },
    notes: { type: String, trim: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    followUpDate: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-calculate score and priority based on budget (in PKR millions)
LeadSchema.pre('save', function (next) {
  const budgetInMillions = this.budget / 1_000_000;

  if (budgetInMillions > 20) {
    this.score = 90 + Math.min(10, (budgetInMillions - 20) / 5);
    this.priority = 'High';
  } else if (budgetInMillions >= 10) {
    this.score = 50 + ((budgetInMillions - 10) / 10) * 40;
    this.priority = 'Medium';
  } else {
    this.score = Math.min(49, (budgetInMillions / 10) * 49);
    this.priority = 'Low';
  }

  this.score = Math.round(this.score);

  // Format budget for display
  if (budgetInMillions >= 10) {
    this.budgetFormatted = `${budgetInMillions.toFixed(1)}M PKR`;
  } else if (this.budget >= 100_000) {
    this.budgetFormatted = `${(this.budget / 100_000).toFixed(1)}L PKR`;
  } else {
    this.budgetFormatted = `${this.budget.toLocaleString()} PKR`;
  }

  next();
});

LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ priority: 1, score: -1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ followUpDate: 1 });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
