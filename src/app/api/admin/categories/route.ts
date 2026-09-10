import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllCategoriesAdmin, saveCategory, deleteCategory } from '@/db/store';

export async function GET() {
  const cats = await getAllCategoriesAdmin();
  return NextResponse.json(cats);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = {
      ...body,
      id: body.id || `cat-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sortOrder: Number(body.sortOrder) || 1,
      isActive: body.isActive !== false,
      subcategories: body.subcategories || [],
    };

    const saved = await saveCategory(category);
    revalidatePath('/');
    revalidatePath('/cakes');
    revalidatePath('/fast-food');
    revalidatePath('/biscuits-cookies');
    revalidatePath('/gift-essentials');
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  await deleteCategory(id);
  revalidatePath('/');
    revalidatePath('/cakes');
    revalidatePath('/fast-food');
    revalidatePath('/biscuits-cookies');
    revalidatePath('/gift-essentials');
  return NextResponse.json({ success: true });
}
