import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { scanFile, sanitizeFilename } from '../../services/fileSanitizer';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from 'next-auth/react';
import nodemailer from 'nodemailer';
import { generateReceipt, sendReceiptEmail } from '@/services/receiptService';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user session
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => {
        // Allow only specific file types
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];
        return part.mimetype ? allowedTypes.includes(part.mimetype) : false;
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
    const fileInfos = [];
    const storedFiles = [];

    // Create a submission record
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: session.user.id,
        status: 'UPLOADED',
        metadata: {
          serviceType: fields.serviceType?.[0] || 'unknown',
          wordCount: parseInt(fields.wordCount?.[0] || '0'),
          studyLevel: fields.studyLevel?.[0] || 'unknown',
          dueDate: fields.dueDate?.[0] || new Date().toISOString(),
          price: parseFloat(fields.price?.[0] || '0'),
          instructions: fields.instructions?.[0] || '',
        }
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return res.status(500).json({ error: 'Failed to create submission record' });
    }

    for (const file of uploadedFiles) {
      if (!file) continue;

      // Scan file for security issues
      const isSafe = await scanFile(file.filepath);
      if (!isSafe) {
        fs.unlinkSync(file.filepath);
        throw new Error('File failed security scan');
      }

      // Generate unique filename
      const sanitizedFilename = sanitizeFilename(file.originalFilename || 'document');
      const uniqueFilename = `${uuidv4()}-${sanitizedFilename}`;
      const newPath = path.join(UPLOADS_DIR, uniqueFilename);

      // Move file to final location
      fs.renameSync(file.filepath, newPath);

      // Read file for storage and email
      const fileBuffer = fs.readFileSync(newPath);
      
      // Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('documents')
        .upload(uniqueFilename, fileBuffer, {
          contentType: file.mimetype || 'application/octet-stream',
          cacheControl: '3600',
        });

      if (storageError) {
        console.error('Error uploading file to storage:', storageError);
        throw new Error('Failed to upload file to storage');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uniqueFilename);

      // Create file record
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          submission_id: submission.id,
          name: file.originalFilename || 'document',
          url: urlData.publicUrl,
          size: file.size || 0,
          mime_type: file.mimetype || 'application/octet-stream',
          storage_path: uniqueFilename
        })
        .select()
        .single();

      if (fileError) {
        console.error('Error creating file record:', fileError);
        throw new Error('Failed to create file record');
      }

      storedFiles.push(fileRecord);

      fileInfos.push({
        originalName: file.originalFilename,
        filename: uniqueFilename,
        size: file.size,
        type: file.mimetype,
        url: urlData.publicUrl,
      });

      // Clean up local file
      fs.unlinkSync(newPath);
    }

    // Send email with files to admin
    await sendEmailWithFiles(
      session.user.email || 'unknown@example.com',
      process.env.VITE_ADMIN_EMAIL || 'handywriterz@gmail.com',
      `New submission from ${session.user.name || 'User'}`,
      `A new submission has been received with ID: ${submission.id}. Please check the attached files.`,
      fileInfos,
      submission
    );

    // Generate receipt
    const receipt = await generateReceipt(submission, storedFiles, session.user);

    // Send receipt to user
    if (session.user.email) {
      await sendReceiptEmail(receipt.url, session.user.email, submission.id);
    }

    return res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileInfos,
      submissionId: submission.id,
      receipt: receipt
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function sendEmailWithFiles(
  from: string,
  to: string,
  subject: string,
  text: string,
  files: any[],
  submission: any
) {
  // Check if email configuration is available
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn('Email configuration missing. Skipping email notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_PORT === '465',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  const attachments = files.map(file => ({
    filename: file.originalName,
    path: file.url
  }));

  const serviceType = submission.metadata?.serviceType || 'N/A';
  const wordCount = submission.metadata?.wordCount || 'N/A';
  const studyLevel = submission.metadata?.studyLevel || 'N/A';
  const dueDate = submission.metadata?.dueDate 
    ? new Date(submission.metadata.dueDate).toLocaleDateString() 
    : 'N/A';
  const price = submission.metadata?.price 
    ? `$${parseFloat(submission.metadata.price).toFixed(2)}` 
    : 'N/A';
  const instructions = submission.metadata?.instructions || 'None provided';

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: `
      <h1>New Submission</h1>
      <p>A new submission has been received with ID: ${submission.id}</p>
      <h2>Details:</h2>
      <ul>
        <li><strong>Service Type:</strong> ${serviceType}</li>
        <li><strong>Word Count:</strong> ${wordCount}</li>
        <li><strong>Study Level:</strong> ${studyLevel}</li>
        <li><strong>Due Date:</strong> ${dueDate}</li>
        <li><strong>Price:</strong> ${price}</li>
      </ul>
      <h3>Instructions:</h3>
      <p>${instructions}</p>
      <h3>Files:</h3>
      <ul>
        ${files.map(file => `<li>${file.originalName} (${formatFileSize(file.size)})</li>`).join('')}
      </ul>
      <p>Please check the attached files.</p>
    `,
    attachments,
  });
}

/**
 * Formats a file size in bytes to a human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
