/**
 * Database seed script
 * Run: node scripts/seed.js
 * Creates demo admin, agent, and sample leads
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set in .env.local');
  process.exit(1);
}

// Inline schemas for seed script
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: { type: String, enum: ['admin', 'agent'] }, phone: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const LeadSchema = new mongoose.Schema({
  name: String, email: String, phone: String, propertyInterest: String,
  budget: Number, budgetFormatted: String, location: String,
  status: { type: String, default: 'New' }, priority: String, score: Number,
  source: String, notes: String, assignedTo: mongoose.Schema.Types.ObjectId,
  followUpDate: Date, lastActivityAt: { type: Date, default: Date.now },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

LeadSchema.pre('save', function (next) {
  const m = this.budget / 1_000_000;
  if (m > 20) { this.score = 90; this.priority = 'High'; }
  else if (m >= 10) { this.score = 60; this.priority = 'Medium'; }
  else { this.score = 30; this.priority = 'Low'; }
  this.budgetFormatted = m >= 1 ? `${m.toFixed(1)}M PKR` : `${(this.budget/100000).toFixed(1)}L PKR`;
  next();
});

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

  // Clear existing data
  await User.deleteMany({});
  await Lead.deleteMany({});
  console.log('🧹 Cleared existing data');

  // Create admin
  const admin = await new User({
    name: 'Admin User', email: 'admin@propertycrm.pk',
    password: 'Admin@1234', role: 'admin', phone: '03001111111',
  }).save();
  console.log('👤 Admin created:', admin.email);

  // Create agents
  const agent1 = await new User({
    name: 'Salman Malik', email: 'agent@propertycrm.pk',
    password: 'Agent@1234', role: 'agent', phone: '03002222222',
  }).save();
  const agent2 = await new User({
    name: 'Fatima Zahra', email: 'fatima@propertycrm.pk',
    password: 'Agent@1234', role: 'agent', phone: '03003333333',
  }).save();
  console.log('🧑‍💼 Agents created');

  // Create sample leads
  const sampleLeads = [
    { name: 'Asif Mehmood', phone: '03214567890', email: 'asif@gmail.com', propertyInterest: 'House', budget: 35000000, location: 'DHA Phase 6, Lahore', source: 'Facebook Ads', status: 'New', notes: 'Looking for 1 kanal house with basement', createdBy: admin._id },
    { name: 'Nadia Hassan', phone: '03334567891', email: 'nadia@yahoo.com', propertyInterest: 'Apartment', budget: 15000000, location: 'Bahria Town, Rawalpindi', source: 'Website', status: 'Contacted', assignedTo: agent1._id, notes: '2-bed apartment, needs parking', createdBy: admin._id },
    { name: 'Tariq Javed', phone: '03454567892', propertyInterest: 'Plot', budget: 8000000, location: 'Gulberg, Islamabad', source: 'Walk-in', status: 'In Progress', assignedTo: agent1._id, createdBy: admin._id },
    { name: 'Sadia Parveen', phone: '03564567893', email: 'sadia@hotmail.com', propertyInterest: 'Villa', budget: 50000000, location: 'Defence, Karachi', source: 'Referral', status: 'New', notes: 'High net worth client, referred by Mr. Ali', createdBy: admin._id },
    { name: 'Bilal Ahmed', phone: '03674567894', propertyInterest: 'Commercial', budget: 25000000, location: 'Blue Area, Islamabad', source: 'Phone', status: 'New', assignedTo: agent2._id, createdBy: admin._id },
    { name: 'Hira Butt', phone: '03784567895', email: 'hira@gmail.com', propertyInterest: 'House', budget: 12000000, location: 'Johar Town, Lahore', source: 'Facebook Ads', status: 'Contacted', assignedTo: agent2._id, createdBy: admin._id },
    { name: 'Usman Ghani', phone: '03894567896', propertyInterest: 'Plot', budget: 5000000, location: 'Faisalabad', source: 'Walk-in', status: 'Lost', createdBy: admin._id },
    { name: 'Zara Malik', phone: '03914567897', email: 'zara@email.com', propertyInterest: 'Apartment', budget: 22000000, location: 'Clifton, Karachi', source: 'Website', status: 'Closed', assignedTo: agent1._id, createdBy: admin._id },
    { name: 'Hamid Raza', phone: '03024567898', propertyInterest: 'House', budget: 18000000, location: 'Model Town, Lahore', source: 'Referral', status: 'In Progress', assignedTo: agent2._id, followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), createdBy: admin._id },
    { name: 'Mehreen Khan', phone: '03134567899', email: 'mehreen@gmail.com', propertyInterest: 'Villa', budget: 45000000, location: 'Gulberg III, Lahore', source: 'Facebook Ads', status: 'New', createdBy: admin._id },
  ];

  for (const lead of sampleLeads) {
    await new Lead(lead).save();
  }
  console.log(`🏘️ ${sampleLeads.length} sample leads created`);

  console.log('\n✅ Seed complete!\n');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@propertycrm.pk / Admin@1234');
  console.log('   Agent: agent@propertycrm.pk / Agent@1234');
  console.log('   Agent: fatima@propertycrm.pk / Agent@1234\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
