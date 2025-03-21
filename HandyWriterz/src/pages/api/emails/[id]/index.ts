import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '@/services/storageService';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'Invalid document ID',
        code: 'INVALID_ID'
      });
    }

    // Check if document exists and belongs to user
    const document = await prisma.manualDocument.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        attachments: true
      }
    });

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
        code: 'NOT_FOUND'
      });
    }

    if (req.method === 'DELETE') {
      // Delete attachments from storage
      for (const attachment of document.attachments) {
        try {
          await StorageService.deleteFile(attachment.key);
        } catch (error) {
          logger.error('Failed to delete attachment from storage', {
            error,
            attachmentId: attachment.id,
            documentId: document.id
          });
        }
      }

      // Delete document and attachments from database
      await prisma.$transaction([
        prisma.attachment.deleteMany({
          where: { documentId: document.id }
        }),
        prisma.manualDocument.delete({
          where: { id: document.id }
        })
      ]);

      logger.info('Document deleted successfully', {
        documentId: document.id,
        userId: session.user.id
      });

      return res.status(200).json({
        success: true
      });
    }

    if (req.method === 'GET') {
      return res.status(200).json(document);
    }

    return res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  } catch (error) {
    logger.error('Error handling document request', { error });
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}
