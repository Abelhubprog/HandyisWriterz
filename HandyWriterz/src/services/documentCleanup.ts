import { scheduleJob } from 'node-schedule';
import { createHash } from 'crypto';
import * as fs from 'fs';

// Daily cleanup at 2AM
scheduleJob('0 2 * * *', async () => {
  const expiredDocs = await prisma.document.findMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    }
  });

  async function verifyFileIntegrity(doc: any) {
    const fileBuffer = await fs.promises.readFile(doc.storagePath);
    const currentHash = createHash('sha256').update(fileBuffer).digest('hex');
    
    if (currentHash !== doc.originalHash) {
      throw new Error(`File hash mismatch for document ${doc.id}`);
    }
  }

  await Promise.all(expiredDocs.map(async doc => {
    await verifyFileIntegrity(doc);
    await fs.promises.unlink(doc.storagePath);
  }));

  await prisma.document.deleteMany({
    where: {
      id: {
        in: expiredDocs.map(d => d.id)
      }
    }
  });

  console.log(`Cleaned up ${expiredDocs.length} old documents`);
});
