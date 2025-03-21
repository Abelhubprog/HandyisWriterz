import { clerkClient } from '@clerk/clerk-sdk-node';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    const { role } = req.body;

    // Verify the requester is an admin
    const requestingUser = await clerkClient.users.getUser(req.auth?.userId as string);
    if (requestingUser.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update the user's role
    await clerkClient.users.updateUser(userId as string, {
      publicMetadata: { role },
    });

    return res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
