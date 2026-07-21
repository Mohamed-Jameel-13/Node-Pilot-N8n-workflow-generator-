import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      console.warn("Missing RESEND_API_KEY in environment variables.");
      return NextResponse.json({ success: false, error: 'Email service is not configured (Missing API Key)' }, { status: 500 });
    }

    // Send email using Resend HTTP API (Edge-compatible)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'NodePilot Contact <onboarding@resend.dev>', // If using free Resend account without verified domain
        to: 'reelsstorehub@gmail.com', // Your target email
        subject: subject ? `NodePilot Contact: ${subject}` : `New message from ${name}`,
        html: `
          <h3>New Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
          <br/>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        `
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Message sent successfully.' });
    } else {
      const errorData = await response.json();
      return NextResponse.json({ success: false, error: errorData.message || 'Failed to send email' }, { status: response.status });
    }
  } catch (error: any) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
