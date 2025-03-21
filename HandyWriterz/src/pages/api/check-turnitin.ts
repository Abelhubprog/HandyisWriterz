import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import { TelegramBotInteractionService } from '@/services/telegramBotInteractionService';
import { Client, resources } from 'coinbase-commerce-node';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
Client.init(process.env.COINBASE_COMMERCE_API_KEY!);
const { Charge } = resources;

export const config = {
  api: {
    bodyParser: false,
  },
};

interface TurnitinMatch {
  source: string;
  percentage: number;
  text: string;
}

interface TurnitinResult {
  similarity: number;
  matches: TurnitinMatch[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const form = formidable({
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: (part) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ];
        return part.mimetype ? allowedTypes.includes(part.mimetype) : false;
      },
    });

    // Parse the form
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const chargeId = Array.isArray(fields.chargeId) ? fields.chargeId[0] : fields.chargeId;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!chargeId) {
      return res.status(400).json({ error: 'No payment ID provided' });
    }

    // Verify payment status
    const charge = await Charge.retrieve(chargeId);
    if (!charge || charge.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Create Turnitin check record
    const turnitinCheck = await prisma.turnitinCheck.create({
      data: {
        userId: session.user.id,
        fileName: file.originalFilename || 'document.pdf',
        status: 'PROCESSING',
        payment: {
          create: {
            id: chargeId,
            amount: 5,
            currency: 'GBP',
            status: charge.status,
          }
        }
      }
    });

    // Send the document to Telegram
    try {
      const telegramService = new TelegramBotInteractionService();
      const fileContent = await fs.readFile(file.filepath);
      await telegramService.sendDocument({
        content: fileContent,
        filename: file.originalFilename || 'document.pdf',
        caption: `Turnitin Check Request - ID: ${turnitinCheck.id}\nUser: ${session.user.email}`,
      });

      // Update Telegram status
      await prisma.turnitinCheck.update({
        where: { id: turnitinCheck.id },
        data: {
          telegramStatus: 'SENT',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      // Log Telegram error but don't fail the request
      console.error('Failed to send document to Telegram:', error);
      await prisma.turnitinCheck.update({
        where: { id: turnitinCheck.id },
        data: {
          telegramStatus: 'FAILED',
          telegramError: error instanceof Error ? error.message : 'Unknown error',
          retryCount: 0,
          updatedAt: new Date()
        }
      });
    }

    // Mock Turnitin check result (replace with actual Turnitin API integration)
    const mockResult: TurnitinResult = {
      similarity: Math.floor(Math.random() * 30),
      matches: [
        {
          source: 'Academic Journal Database',
          percentage: Math.floor(Math.random() * 20),
          text: 'Similar content found in academic database...',
        },
        {
          source: 'Online Publication',
          percentage: Math.floor(Math.random() * 10),
          text: 'Similar content found in online publication...',
        },
      ],
    };

    // Update check status and result
    await prisma.turnitinCheck.update({
      where: { id: turnitinCheck.id },
      data: {
        status: 'COMPLETED',
        result: mockResult,
        updatedAt: new Date()
      }
    });

    // Clean up the temporary file
    await fs.unlink(file.filepath);

    return res.status(200).json(mockResult);
  } catch (error) {
    console.error('Error processing Turnitin check:', error);
    return res.status(500).json({ error: 'Failed to process document' });
  }
}