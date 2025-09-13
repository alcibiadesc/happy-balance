import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';

// GET all categories
export const GET: RequestHandler = async () => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
};

// POST new category
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, type, color, icon } = body;

    // Validate required fields
    if (!name || !type) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name,
        type,
        color: color || '#7abaa5',
        icon: icon || '📁'
      }
    });

    return json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return json({ error: 'Failed to create category' }, { status: 500 });
  }
};