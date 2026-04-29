import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface LeadCreatedEmailData {
  leadName: string;
  leadEmail?: string;
  leadPhone: string;
  property: string;
  budget: string;
  source: string;
  priority: string;
  adminEmail: string;
}

interface LeadAssignedEmailData {
  agentName: string;
  agentEmail: string;
  leadName: string;
  leadPhone: string;
  property: string;
  budget: string;
  priority: string;
  notes?: string;
}

export async function sendNewLeadEmail(data: LeadCreatedEmailData): Promise<void> {
  const priorityColor =
    data.priority === 'High' ? '#e53e3e' : data.priority === 'Medium' ? '#d97706' : '#38a169';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a24 0%, #2c2c3e 100%); padding: 32px; text-align: center; }
        .header h1 { color: #f0ad36; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { color: #a0a0b8; margin: 8px 0 0; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: ${priorityColor}22; color: ${priorityColor}; border: 1px solid ${priorityColor}; }
        .content { padding: 32px; }
        .field { margin-bottom: 16px; border-bottom: 1px solid #f0f0f5; padding-bottom: 16px; }
        .field:last-child { border-bottom: none; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .value { font-size: 16px; color: #1a1a24; font-weight: 600; }
        .footer { background: #f8f8fc; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 28px; background: #f0ad36; color: #1a1a24; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Property CRM</h1>
          <p>New Lead Alert</p>
        </div>
        <div class="content">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
            <h2 style="margin:0; color:#1a1a24;">New Lead Received</h2>
            <span class="badge">${data.priority} Priority</span>
          </div>
          <div class="field">
            <div class="label">Client Name</div>
            <div class="value">${data.leadName}</div>
          </div>
          ${data.leadEmail ? `<div class="field"><div class="label">Email</div><div class="value">${data.leadEmail}</div></div>` : ''}
          <div class="field">
            <div class="label">Phone</div>
            <div class="value">${data.leadPhone}</div>
          </div>
          <div class="field">
            <div class="label">Property Interest</div>
            <div class="value">${data.property}</div>
          </div>
          <div class="field">
            <div class="label">Budget</div>
            <div class="value">${data.budget}</div>
          </div>
          <div class="field">
            <div class="label">Lead Source</div>
            <div class="value">${data.source}</div>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/leads" class="btn">View in CRM Dashboard →</a>
          </div>
        </div>
        <div class="footer">Property Dealer CRM System · Automated Notification</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Property CRM" <${process.env.EMAIL_FROM}>`,
    to: data.adminEmail,
    subject: `🔔 New ${data.priority} Priority Lead: ${data.leadName}`,
    html,
  });
}

export async function sendLeadAssignedEmail(data: LeadAssignedEmailData): Promise<void> {
  const priorityColor =
    data.priority === 'High' ? '#e53e3e' : data.priority === 'Medium' ? '#d97706' : '#38a169';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f8; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a24 0%, #2c2c3e 100%); padding: 32px; text-align: center; }
        .header h1 { color: #f0ad36; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; background: ${priorityColor}22; color: ${priorityColor}; border: 1px solid ${priorityColor}; }
        .content { padding: 32px; }
        .field { margin-bottom: 16px; border-bottom: 1px solid #f0f0f5; padding-bottom: 16px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
        .value { font-size: 16px; color: #1a1a24; font-weight: 600; }
        .footer { background: #f8f8fc; padding: 20px; text-align: center; color: #888; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 28px; background: #f0ad36; color: #1a1a24; text-decoration: none; border-radius: 8px; font-weight: 700; margin-top: 20px; }
        .alert { background: #fffbeb; border: 1px solid #f0ad36; border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Property CRM</h1>
        </div>
        <div class="content">
          <div class="alert">
            <strong>Hi ${data.agentName},</strong> a new lead has been assigned to you. Please follow up promptly.
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;">
            <h2 style="margin:0; color:#1a1a24;">Lead Assignment</h2>
            <span class="badge">${data.priority} Priority</span>
          </div>
          <div class="field"><div class="label">Client Name</div><div class="value">${data.leadName}</div></div>
          <div class="field"><div class="label">Phone</div><div class="value">${data.leadPhone}</div></div>
          <div class="field"><div class="label">Property Interest</div><div class="value">${data.property}</div></div>
          <div class="field"><div class="label">Budget</div><div class="value">${data.budget}</div></div>
          ${data.notes ? `<div class="field"><div class="label">Notes</div><div class="value">${data.notes}</div></div>` : ''}
          <div style="text-align:center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard/leads" class="btn">Open Lead in CRM →</a>
          </div>
        </div>
        <div class="footer">Property Dealer CRM System · Automated Notification</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Property CRM" <${process.env.EMAIL_FROM}>`,
    to: data.agentEmail,
    subject: `📋 Lead Assigned: ${data.leadName} (${data.priority} Priority)`,
    html,
  });
}
