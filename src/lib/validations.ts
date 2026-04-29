import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(['admin', 'agent']).optional().default('agent'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(7, 'Valid phone number required').max(20),
  propertyInterest: z.enum(['House', 'Apartment', 'Plot', 'Commercial', 'Villa', 'Other']),
  budget: z.number().positive('Budget must be positive'),
  location: z.string().optional(),
  source: z.enum(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone', 'Other']),
  notes: z.string().max(1000).optional(),
  status: z.enum(['New', 'Contacted', 'In Progress', 'Closed', 'Lost']).optional().default('New'),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(7).max(20).optional(),
  propertyInterest: z.enum(['House', 'Apartment', 'Plot', 'Commercial', 'Villa', 'Other']).optional(),
  budget: z.number().positive().optional(),
  location: z.string().optional(),
  source: z.enum(['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Phone', 'Other']).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['New', 'Contacted', 'In Progress', 'Closed', 'Lost']).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
});

export const assignLeadSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
});

export const createAgentSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
