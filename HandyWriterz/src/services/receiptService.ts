import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabaseClient';

const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Generates a professional receipt for a submission
 * @param submission The submission data
 * @param files The files attached to the submission
 * @param user The user who made the submission
 * @returns Object with receipt URL and ID
 */
export async function generateReceipt(submission: any, files: any[], user: any): Promise<{ url: string, id: string }> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page to the document
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Get fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set page margins
    const margin = 50;
    const width = page.getWidth() - 2 * margin;
    
    // Draw company logo/header
    page.drawText('HandyWriterz', {
      x: margin,
      y: page.getHeight() - margin - 30,
      size: 24,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.6),
    });
    
    page.drawText('Professional Academic Services', {
      x: margin,
      y: page.getHeight() - margin - 50,
      size: 12,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Draw receipt title
    page.drawText('RECEIPT', {
      x: margin + width / 2 - 40,
      y: page.getHeight() - margin - 100,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Draw receipt details
    const now = new Date();
    const receiptId = `R-${submission.id}-${uuidv4().substring(0, 8)}`;
    
    // Receipt info
    page.drawText(`Receipt Number: ${receiptId}`, {
      x: margin,
      y: page.getHeight() - margin - 150,
      size: 10,
      font: helveticaFont,
    });
    
    page.drawText(`Date: ${format(now, 'MMMM dd, yyyy HH:mm')}`, {
      x: margin,
      y: page.getHeight() - margin - 170,
      size: 10,
      font: helveticaFont,
    });
    
    page.drawText(`Submission ID: ${submission.id}`, {
      x: margin,
      y: page.getHeight() - margin - 190,
      size: 10,
      font: helveticaFont,
    });
    
    // Customer info
    page.drawText('Customer Information:', {
      x: margin,
      y: page.getHeight() - margin - 220,
      size: 12,
      font: helveticaBold,
    });
    
    page.drawText(`Name: ${user.name || user.email || 'N/A'}`, {
      x: margin,
      y: page.getHeight() - margin - 240,
      size: 10,
      font: helveticaFont,
    });
    
    page.drawText(`Email: ${user.email || 'N/A'}`, {
      x: margin,
      y: page.getHeight() - margin - 260,
      size: 10,
      font: helveticaFont,
    });
    
    // Order details
    page.drawText('Order Details:', {
      x: margin,
      y: page.getHeight() - margin - 290,
      size: 12,
      font: helveticaBold,
    });
    
    page.drawText(`Service Type: ${submission.metadata?.serviceType || 'N/A'}`, {
      x: margin,
      y: page.getHeight() - margin - 310,
      size: 10,
      font: helveticaFont,
    });
    
    page.drawText(`Word Count: ${submission.metadata?.wordCount || 'N/A'}`, {
      x: margin,
      y: page.getHeight() - margin - 330,
      size: 10,
      font: helveticaFont,
    });
    
    page.drawText(`Study Level: ${submission.metadata?.studyLevel || 'N/A'}`, {
      x: margin,
      y: page.getHeight() - margin - 350,
      size: 10,
      font: helveticaFont,
    });
    
    const dueDate = submission.metadata?.dueDate 
      ? format(new Date(submission.metadata.dueDate), 'MMMM dd, yyyy') 
      : 'N/A';
    
    page.drawText(`Due Date: ${dueDate}`, {
      x: margin,
      y: page.getHeight() - margin - 370,
      size: 10,
      font: helveticaFont,
    });
    
    // Files
    page.drawText('Uploaded Files:', {
      x: margin,
      y: page.getHeight() - margin - 400,
      size: 12,
      font: helveticaBold,
    });
    
    let yPos = page.getHeight() - margin - 420;
    files.forEach((file, index) => {
      page.drawText(`${index + 1}. ${file.name || file.originalName || 'File'} (${formatFileSize(file.size)})`, {
        x: margin,
        y: yPos,
        size: 10,
        font: helveticaFont,
      });
      yPos -= 20;
    });
    
    // Payment details
    page.drawText('Payment Details:', {
      x: margin,
      y: yPos - 30,
      size: 12,
      font: helveticaBold,
    });
    
    // Draw a line
    page.drawLine({
      start: { x: margin, y: yPos - 50 },
      end: { x: margin + width, y: yPos - 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // Payment breakdown
    page.drawText('Service Fee:', {
      x: margin,
      y: yPos - 70,
      size: 10,
      font: helveticaFont,
    });
    
    const price = submission.metadata?.price || 0;
    
    page.drawText(`$${parseFloat(price).toFixed(2)}`, {
      x: margin + width - 80,
      y: yPos - 70,
      size: 10,
      font: helveticaFont,
    });
    
    // Draw a line
    page.drawLine({
      start: { x: margin, y: yPos - 90 },
      end: { x: margin + width, y: yPos - 90 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // Total
    page.drawText('Total:', {
      x: margin,
      y: yPos - 110,
      size: 12,
      font: helveticaBold,
    });
    
    page.drawText(`$${parseFloat(price).toFixed(2)}`, {
      x: margin + width - 80,
      y: yPos - 110,
      size: 12,
      font: helveticaBold,
    });
    
    // Payment status
    page.drawText('Payment Status:', {
      x: margin,
      y: yPos - 130,
      size: 10,
      font: helveticaFont,
    });
    
    const paymentStatus = submission.paymentStatus || 'Pending';
    const statusColor = paymentStatus === 'Paid' ? rgb(0, 0.5, 0) : rgb(0.8, 0.4, 0);
    
    page.drawText(paymentStatus, {
      x: margin + width - 80,
      y: yPos - 130,
      size: 10,
      font: helveticaBold,
      color: statusColor,
    });
    
    // Footer
    page.drawText('Thank you for your business!', {
      x: margin + width / 2 - 80,
      y: 100,
      size: 12,
      font: helveticaFont,
    });
    
    page.drawText('For any questions, please contact support@handywriterz.com', {
      x: margin + width / 2 - 150,
      y: 80,
      size: 10,
      font: helveticaFont,
    });
    
    // Save the PDF to a buffer
    const pdfBytes = await pdfDoc.save();
    
    // Save to a temporary file
    const tempFilePath = path.join(TEMP_DIR, `receipt-${receiptId}.pdf`);
    fs.writeFileSync(tempFilePath, pdfBytes);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(`receipt-${receiptId}.pdf`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading receipt to storage:', error);
      throw new Error('Failed to upload receipt');
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(`receipt-${receiptId}.pdf`);
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    return {
      url: urlData.publicUrl,
      id: receiptId
    };
  } catch (error) {
    console.error('Failed to generate receipt:', error);
    throw new Error('Failed to generate receipt');
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sends a receipt to the user via email
 * @param receiptUrl URL of the receipt
 * @param userEmail Email address of the user
 * @param submissionId ID of the submission
 */
export async function sendReceiptEmail(receiptUrl: string, userEmail: string, submissionId: string): Promise<void> {
  try {
    // This function would use an email service to send the receipt
    // Implementation depends on the email service being used
    console.log(`Receipt email would be sent to ${userEmail} with receipt URL: ${receiptUrl}`);
    
    // Example implementation would go here
    // await emailService.sendEmail({
    //   to: userEmail,
    //   subject: `Your Receipt for Submission #${submissionId}`,
    //   html: `
    //     <h1>Thank you for your submission!</h1>
    //     <p>Your receipt is ready. <a href="${receiptUrl}">Click here to view it</a>.</p>
    //     <p>Submission ID: ${submissionId}</p>
    //   `
    // });
  } catch (error) {
    console.error('Failed to send receipt email:', error);
    throw new Error('Failed to send receipt email');
  }
} 