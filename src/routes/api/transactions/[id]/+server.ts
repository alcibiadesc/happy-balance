import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';

// GET single transaction
export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!transaction) {
      return json({ error: 'Transaction not found' }, { status: 404 });
    }

    return json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
};

// PATCH update single transaction
export const PATCH: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const updates = await request.json();

  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    return json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return json({ error: 'Failed to update transaction' }, { status: 500 });
  }
};

// DELETE single transaction
export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  try {
    await prisma.transaction.delete({
      where: { id }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
};