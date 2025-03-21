import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '@/services/storageService';
import { TelegramBotService } from '@/services/telegramBotService';
import { logger } from '@/lib/logger';
import formidable from 'formidable';
import { createReadStream } from 'fs';
import { z } from 'zod';

const prisma = new PrismaClient();

// Disable body parsing, we'll handle the multipart form data manually
export const config = {
  api: {
    bodyParser: false
  }
};

// Validation schema for form fields
const FormSchema = z.object({
  region: z.enum(['europe', 'asia', 'americas', 'africa', 'oceania']),
  questionOne: z.enum(['true', 'false']).transform(val => val === 'true'),
  questionTwo: z.enum(['true', 'false']).transform(val => val === 'true')
});

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

    // Authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    // Parse form data
    const { fields, files } = await parseForm(req);
    
    // Validate form fields
    const validationResult = FormSchema.safeParse(fields);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid form data',
        code: 'INVALID_FORM',
        details: validationResult.error.errors
      });
    }

    const formData = validationResult.data;
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    // Validate file
    if (!isValidFileType(file.mimetype || '')) {
      return res.status(400).json({
        error: 'Invalid file type',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Create request in database
    const request = await prisma.aiScore.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        telegramStatus: 'PENDING',
        metadata: {
          region: formData.region,
          questionOne: formData.questionOne,
          questionTwo: formData.questionTwo,
          originalFileName: file.originalFilename,
          mimeType: file.mimetype
        }
      }
    });

    // Upload file to storage
    const fileStream = createReadStream(file.filepath);
    const fileBuffer = await streamToBuffer(fileStream);
    const fileKey = await StorageService.uploadFile(
      fileBuffer,
      file.originalFilename || 'document',
      file.mimetype || 'application/octet-stream',
      {
        requestId: request.id,
        userId: session.user.id
      }
    );

    // Update request with file key
    await prisma.aiScore.update({
      where: { id: request.id },
      data: {
        metadata: {
          ...request.metadata,
          fileKey
        }
      }
    });

    // Send to Telegram bot with request ID in caption
    await TelegramBotService.sendDocument(
      fileBuffer,
      file.originalFilename || 'document',
      `ID:${request.id}`
    );

    logger.info('Document upload processed successfully', {
      requestId: request.id,
      userId: session.user.id,
      fileKey
    });

    return res.status(200).json({
      success: true,
      requestId: request.id
    });
  } catch (error) {
    logger.error('Document upload failed', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : 'An unexpected error occurred'
    });
  }
}

async function parseForm(req: NextApiRequest): Promise<{
  fields: { [key: string]: string };
  files: { [key: string]: formidable.File[] };
}> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => isValidFileType(mimetype || '')
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

function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  return allowedTypes.includes(mimeType);
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
