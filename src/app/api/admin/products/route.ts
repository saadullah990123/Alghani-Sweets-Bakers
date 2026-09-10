import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllProductsAdmin, saveProduct, deleteProduct, getCategories } from '@/db/store';
import { getProductFallbackImage } from '@/lib/utils';

const storefrontProductPaths = [
  '/',
  '/cakes',
  '/fast-food',
  '/fastfood',
  '/biscuits-cookies',
  '/biscuits',
  '/gift-essentials',
  '/sweets',
  '/desserts',
  '/frozen',
] as const;

function revalidateStorefrontProducts() {
  revalidatePath('/', 'layout');
  storefrontProductPaths.forEach((path) => revalidatePath(path));
}

export async function GET() {
  const products = await getAllProductsAdmin();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.categoryId) {
      return NextResponse.json({ error: 'Product name and category required' }, { status: 400 });
    }

    // If no image was supplied, inherit the parent category/subcategory
    // banner instead of a hardcoded photo from an unrelated category.
    let images = body.images;
    if (!images || images.length === 0) {
      const categories = await getCategories();
      images = [getProductFallbackImage(body.categoryId, body.subcategoryId, categories)];
    }

    const product = {
      ...body,
      id: body.id || `prod-${Date.now()}`,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      images,
      basePrice: Number(body.basePrice) || 0,
      isCustomizable: !!body.isCustomizable,
      isFeatured: !!body.isFeatured,
      isPopular: !!body.isPopular,
      isAvailable: body.isAvailable !== false,
      sortOrder: Number(body.sortOrder) || 1,
    };

    const saved = await saveProduct(product);
    try {
      revalidateStorefrontProducts();
    } catch (e) {
      console.warn('Revalidation warning:', e);
    }
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error('Failed to save product:', err);
    return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    await deleteProduct(id);
    try {
      revalidateStorefrontProducts();
    } catch (e) {
      console.warn('Revalidation warning:', e);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete product:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
