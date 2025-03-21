import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '@/services/storageService';
import { TelegramBotService } from '@/services/telegramBotService';
import { logger } from '@/lib/logger';
import formidable from 'formidable';
import { createReadStream } from 'fs';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      });
    }

    // Check authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);
    const { subject, body } = fields;

    if (!subject || !body) {
      return res.status(400).json({
        error: 'Subject and body are required',
        code: 'INVALID_REQUEST'
      });
    }

    // Create manual document record
    const document = await prisma.manualDocument.create({
      data: {
        userId: session.user.id,
        subject: subject as string,
        body: body as string,
        status: 'PENDING',
        from: session.user.email || 'unknown@example.com',
        to: process.env.ADMIN_EMAIL || 'admin@example.com'
      }
    });

    // Handle file attachments
    const attachments = [];
    const fileArray = files.files || [];
    for (const file of fileArray) {
      const fileStream = createReadStream(file.filepath);
      const fileBuffer = await streamToBuffer(fileStream);
      
      // Upload to storage
      const fileKey = await StorageService.uploadFile(
        fileBuffer,
        file.originalFilename || 'document',
        file.mimetype || 'application/octet-stream',
        {
          documentId: document.id,
          userId: session.user.id
        }
      );

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          documentId: document.id,
          name: file.originalFilename || 'document',
          url: await StorageService.getSignedUrl(fileKey),
          size: file.size || 0,
          mimeType: file.mimetype || 'application/octet-stream',
          key: fileKey
        }
      });

      attachments.push(attachment);

      // Send to Telegram bot if it's a supported document type
      if (isSupportedDocumentType(file.mimetype || '')) {
        await TelegramBotService.sendDocument(
          fileBuffer,
          file.originalFilename || 'document',
          `ID:${document.id}`
        );
      }
    }

    logger.info('Manual document created successfully', {
      documentId: document.id,
      userId: session.user.id,
      attachmentsCount: attachments.length
    });

    return res.status(200).json({
      success: true,
      documentId: document.id
    });
  } catch (error) {
    logger.error('Error sending manual document', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

async function parseForm(req: NextApiRequest): Promise<{
  fields: { [key: string]: string };
  files: { [key: string]: formidable.File[] };
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      multiples: true
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({
        fields: fields as { [key: string]: string },
        files: files as { [key: string]: formidable.File[] }
      });
    });
  });
}

function isSupportedDocumentType(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return supportedTypes.includes(mimeType);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
