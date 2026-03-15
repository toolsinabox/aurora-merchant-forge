-- Update existing categories with proper sort order and images from live site
UPDATE categories SET 
  sort_order = 1, 
  image_url = 'https://www.toolsinabox.com.au/assets/webshop/cms/80/180.webp?1734784310'
WHERE id = 'ed75de61-c4d5-4c93-bb8f-5da078b810c3';

UPDATE categories SET 
  sort_order = 50, 
  image_url = 'https://www.toolsinabox.com.au/assets/webshop/cms/81/181.webp?1734784299'
WHERE id = 'eb65b4d3-7edb-429c-8155-e46afabbb9f4';

UPDATE categories SET 
  sort_order = 90, 
  image_url = 'https://www.toolsinabox.com.au/assets/webshop/cms/79/179.webp?1734784508'
WHERE id = 'b71911ae-87b3-4b21-8375-569354bf6e8d';

-- Insert missing top-level categories
INSERT INTO categories (store_id, name, slug, sort_order, image_url) VALUES
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Under Tray', 'under-tray-toolboxes', 10, 'https://www.toolsinabox.com.au/assets/webshop/cms/85/185.webp?1734784596'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Top Opening', 'top-opening-toolboxes', 15, 'https://www.toolsinabox.com.au/assets/webshop/cms/88/188.webp?1734784528'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Side Opening', 'side-opening', 20, 'https://www.toolsinabox.com.au/assets/webshop/cms/91/191.webp?1734784451'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Truck Boxes', 'truck-toolboxes', 25, 'https://www.toolsinabox.com.au/assets/webshop/cms/93/193.webp?1734784555'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Dog Boxes', 'dog-boxes', 30, 'https://www.toolsinabox.com.au/assets/webshop/cms/06/206.webp?1734787213'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Canopies', 'ute-canopy', 35, 'https://www.toolsinabox.com.au/assets/webshop/cms/83/183.webp?1734789201'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Camper & Trailer Boxes', 'camper-trailer-boxes', 40, 'https://www.toolsinabox.com.au/assets/webshop/cms/96/196.webp?1736309367');