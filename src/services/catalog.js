import { supabase } from '../lib/supabase.js';

const IMAGE_BUCKET = 'product-images';

function getProductImage(productImages = []) {
    if (!productImages.length) {
        return null;
    }

    const orderedImages = [...productImages].sort((first, second) => {
        if (first.is_primary !== second.is_primary) {
            return first.is_primary ? -1 : 1;
        }

        return first.sort_order - second.sort_order;
    });

    const mainImage = orderedImages[0];

    if (!mainImage.storage_path) {
        return null;
    }

    const { data } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(mainImage.storage_path);

    return {
        url: data.publicUrl,
        alt: mainImage.alt_text || null
    };
}

export async function fetchCatalog() {
    if (!supabase) {
        throw new Error(
            'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local.'
        );
    }

    const [categoriesResponse, productsResponse] = await Promise.all([
        supabase
            .from('categories')
            .select('id, name, description, sort_order')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true }),

        supabase
            .from('products')
            .select(`
                id,
                category_id,
                name,
                description,
                price,
                currency,
                is_available,
                sort_order,
                product_images (
                    id,
                    storage_path,
                    alt_text,
                    is_primary,
                    sort_order
                )
            `)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true })
    ]);

    if (categoriesResponse.error) {
        throw categoriesResponse.error;
    }

    if (productsResponse.error) {
        throw productsResponse.error;
    }

    const products = (productsResponse.data ?? []).map((product) => ({
        ...product,
        price: Number(product.price),
        image: getProductImage(product.product_images)
    }));

    return {
        categories: categoriesResponse.data ?? [],
        products
    };
}
