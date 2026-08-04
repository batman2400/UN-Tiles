-- Update Product Names and Replace Mosaic Fan

UPDATE public.products SET name = 'Ocean Cyan Pool Tile' WHERE sku = 'UN-POO-100';
UPDATE public.products SET name = 'Sapphire Deep Pool Tile' WHERE sku = 'UN-POO-101';
UPDATE public.products SET name = 'Navy Blue Pool Tile' WHERE sku = 'UN-POO-102';
UPDATE public.products SET name = 'Turquoise Lagoon Pool Tile' WHERE sku = 'UN-POO-103';
UPDATE public.products SET name = 'Royal Azure Pool Tile' WHERE sku = 'UN-POO-104';
UPDATE public.products SET name = 'Cobalt Sea Pool Tile' WHERE sku = 'UN-POO-105';
UPDATE public.products SET name = 'Marine Blue Pool Tile' WHERE sku = 'UN-POO-106';
UPDATE public.products SET name = 'Aqua Clear Pool Tile' WHERE sku = 'UN-POO-107';

-- Remove Mosaic Fan and Add Autumn Matte
DELETE FROM public.products WHERE sku = 'UN-MOS-108';
INSERT INTO public.products (id, sku, name, dimensions, price_per_sqft, image, category_slug, featured, finish, application, stock_sqft)
VALUES ('tile-wall-11', 'UN-WAL-110', 'Autumn Matte', '60x60 cm', 1650, '/tiles/wall_autumn.jpg', 'wall', false, 'Matte', 'Interior', 1000)
ON CONFLICT (id) DO UPDATE SET sku = EXCLUDED.sku, name = EXCLUDED.name, image = EXCLUDED.image, category_slug = EXCLUDED.category_slug;
