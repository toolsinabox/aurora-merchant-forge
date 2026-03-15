-- Insert subcategories of All Toolboxes
INSERT INTO categories (store_id, name, slug, sort_order, parent_id, image_url) VALUES
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Flat Plate Series', 'flat-plate-series', 2, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/18/318.webp?1734784437'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'White Ute Tool Boxes', 'white-series', 3, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/17/317.webp?1734784617'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Black Ute Tool Boxes', 'black-series', 4, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/16/316.webp?1734784648'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Chest Style', 'chest-style-toolboxes', 5, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/89/189.webp?1734784386'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Gullwing', 'gullwing-toolboxes', 6, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/90/190.webp?1734784477'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Full Opening', 'full-door-toolboxes', 7, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/91/191.webp?1734784451'),
('57391678-8e43-4bd9-9a92-d368cad04f27', '3/4 Opening', '3-4-opening-side-toolbox', 8, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/92/192.webp?1734784287'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Tub Liner', 'tub-liner-toolboxes', 9, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/95/195.webp?1734784577'),
('57391678-8e43-4bd9-9a92-d368cad04f27', 'Aluminium Toolboxes', 'aluminium-toolboxes', 11, 'ed75de61-c4d5-4c93-bb8f-5da078b810c3', 'https://www.toolsinabox.com.au/assets/webshop/cms/22/422.webp?1734784324');

-- Insert subcategories of Under Tray
INSERT INTO categories (store_id, name, slug, sort_order, parent_id, image_url)
SELECT '57391678-8e43-4bd9-9a92-d368cad04f27', name, slug, ord, id, img FROM
(SELECT id FROM categories WHERE slug = 'under-tray-toolboxes' AND store_id = '57391678-8e43-4bd9-9a92-d368cad04f27') parent,
(VALUES 
  ('Drawer Toolboxes', 'toolbox-with-drawers', 11, 'https://www.toolsinabox.com.au/assets/webshop/cms/84/184.webp?1734784419'),
  ('Trundle Trays', 'trundle-trays', 12, 'https://www.toolsinabox.com.au/assets/webshop/cms/82/182.webp?1734784563'),
  ('Generator Toolboxes', 'generator-toolboxes', 13, 'https://www.toolsinabox.com.au/assets/webshop/cms/86/186.webp?1734784463')
) AS v(name, slug, ord, img);

-- Insert subcategories of Truck Boxes
INSERT INTO categories (store_id, name, slug, sort_order, parent_id, image_url)
SELECT '57391678-8e43-4bd9-9a92-d368cad04f27', name, slug, ord, id, img FROM
(SELECT id FROM categories WHERE slug = 'truck-toolboxes' AND store_id = '57391678-8e43-4bd9-9a92-d368cad04f27') parent,
(VALUES 
  ('Trailer Toolboxes', 'trailer-toolboxes', 26, 'https://www.toolsinabox.com.au/assets/webshop/cms/87/187.webp?1734784544'),
  ('Job Site Toolboxes', 'job-site', 27, 'https://www.toolsinabox.com.au/assets/webshop/cms/94/194.webp?1734790507')
) AS v(name, slug, ord, img);