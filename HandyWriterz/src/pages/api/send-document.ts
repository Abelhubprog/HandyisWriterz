import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { z } from 'zod';
import nodemailer from 'nodemailer';

// Validate document submission data
const documentSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  fileName: z.string().min(1, 'File name is required'),
  userEmail: z.string().min(1, 'User email is required'),
  fileUrl: z.string().min(1, 'File URL is required'),
});

interface RequestBody {
  uploadId: string;
  fileName: string;
  userEmail: string;
  fileUrl: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input data
    const validatedData = documentSchema.parse(req.body);

    // Get the document details from Supabase
    const { data: document, error: docError } = await supabase
      .from('document_uploads')
      .select('*')
      .eq('id', validatedData.uploadId)
      .single();

    if (docError || !document) {
      console.error('Document fetch error:', docError);
      return res.status(404).json({ error: 'Document not found' });
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOSTNAME || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME || 'handywriterz@gmail.com',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });

    const recipientEmail = process.env.RECIPIENT_EMAIL || 'handywriterz@gmail.com';

    // Send email to service email (handywriterz@gmail.com)
    await transporter.sendMail({
      from: validatedData.userEmail,
      to: recipientEmail,
      subject: `Turnitin Document Check Request: ${validatedData.fileName}`,
      html: `
        <html>
          <body>
            <h1>Turnitin Document Check Request</h1>
            <p>A new document has been submitted for Turnitin plagiarism check.</p>
            <ul>
              <li><strong>Document Name:</strong> ${validatedData.fileName}</li>
              <li><strong>User Email:</strong> ${validatedData.userEmail}</li>
              <li><strong>Size:</strong> ${Math.round(document.filesize / 1024)} KB</li>
              <li><strong>Type:</strong> ${document.filetype}</li>
            </ul>
            <p>You can download the document using this link:</p>
            <p><a href="${validatedData.fileUrl}">${validatedData.fileName}</a></p>
            <p>Please process this document and send the plagiarism report to the user.</p>
          </body>
        </html>
      `,
    });

    // Send confirmation email to user
    await transporter.sendMail({
      from: recipientEmail,
      to: validatedData.userEmail,
      subject: `Document Received: ${validatedData.fileName}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f0f7ff; padding: 20px; border-radius: 10px;">
              <h1 style="color: #3366cc; border-bottom: 1px solid #bbcee7; padding-bottom: 10px;">Document Received</h1>
              <p>Thank you for submitting your document for Turnitin plagiarism check.</p>
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0e7ff;">
                <h2 style="margin-top: 0; font-size: 18px; color: #333;">Document Details:</h2>
                <ul style="padding-left: 20px;">
                  <li><strong>Document Name:</strong> ${validatedData.fileName}</li>
                  <li><strong>Size:</strong> ${Math.round(document.filesize / 1024)} KB</li>
                  <li><strong>Submission Date:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              <p>Your document is being processed and the plagiarism report will be sent to you once it's ready.</p>
              <p>This typically takes between 2-15 minutes depending on the document size and complexity.</p>
              <p style="background-color: #fff4e5; padding: 10px; border-radius: 5px; border-left: 4px solid #ffaa33;">
                <strong>Note:</strong> The plagiarism report will be delivered to this email address.
              </p>
              <p style="margin-top: 20px; font-size: 14px; color: #777;">
                If you have any questions, please reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    // Update document status in Supabase
    await supabase
      .from('document_uploads')
      .update({ 
        status: 'emailed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', validatedData.uploadId);

    // Create document stats record
    await supabase
      .from('document_stats')
      .insert({
        document_id: validatedData.uploadId,
        views: 0,
        likes: 0,
        shares: 0
      });

    return res.status(200).json({ success: true, message: 'Document sent successfully' });
  } catch (error: any) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: error.message || 'An unknown error occurred' });
  }
}