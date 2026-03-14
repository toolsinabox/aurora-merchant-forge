
-- Insert 3 categories for store toolsinabox
INSERT INTO public.categories (id, store_id, name, slug, sort_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', '57391678-8e43-4bd9-9a92-d368cad04f27', 'Power Tools', 'power-tools', 1),
  ('a1000000-0000-0000-0000-000000000002', '57391678-8e43-4bd9-9a92-d368cad04f27', 'Hand Tools', 'hand-tools', 2),
  ('a1000000-0000-0000-0000-000000000003', '57391678-8e43-4bd9-9a92-d368cad04f27', 'Safety & Accessories', 'safety-accessories', 3);

-- Insert 10 products across the 3 categories
INSERT INTO public.products (store_id, title, sku, price, cost_price, status, category_id, slug, description, tags, brand) VALUES
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Cordless Drill 20V', 'PT-DRILL-001', 149.99, 72.00, 'active', 'a1000000-0000-0000-0000-000000000001', 'cordless-drill-20v', 'Powerful 20V cordless drill with brushless motor and 2-speed gearbox.', ARRAY['drill','cordless','power'], 'DeWalt'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Circular Saw 7¼"', 'PT-SAW-002', 129.99, 58.00, 'active', 'a1000000-0000-0000-0000-000000000001', 'circular-saw-7', 'Lightweight 15-amp circular saw with laser guide.', ARRAY['saw','cutting','power'], 'Makita'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Angle Grinder 4½"', 'PT-GRIND-003', 89.99, 40.00, 'active', 'a1000000-0000-0000-0000-000000000001', 'angle-grinder-4', 'Compact angle grinder for cutting and grinding metal.', ARRAY['grinder','metal','power'], 'Bosch'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Impact Driver Kit', 'PT-IMPACT-004', 179.99, 85.00, 'active', 'a1000000-0000-0000-0000-000000000001', 'impact-driver-kit', '20V max impact driver with battery and charger included.', ARRAY['impact','driver','cordless'], 'Milwaukee'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Claw Hammer 16oz', 'HT-HAM-001', 24.99, 8.50, 'active', 'a1000000-0000-0000-0000-000000000002', 'claw-hammer-16oz', 'Forged steel claw hammer with fibreglass handle.', ARRAY['hammer','striking','hand'], 'Stanley'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Tape Measure 8m', 'HT-TAPE-002', 19.99, 5.00, 'active', 'a1000000-0000-0000-0000-000000000002', 'tape-measure-8m', 'Heavy-duty 8m tape measure with magnetic tip.', ARRAY['measuring','tape','hand'], 'Stanley'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Socket Set 52pc', 'HT-SOCK-003', 79.99, 32.00, 'active', 'a1000000-0000-0000-0000-000000000002', 'socket-set-52pc', '52-piece chrome vanadium socket set in blow-mould case.', ARRAY['socket','mechanic','hand'], 'Kincrome'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Safety Glasses Clear', 'SA-GLASS-001', 12.99, 3.00, 'active', 'a1000000-0000-0000-0000-000000000003', 'safety-glasses-clear', 'Anti-fog clear safety glasses with UV protection.', ARRAY['safety','eyewear','ppe'], 'Uvex'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Work Gloves Leather', 'SA-GLOVE-002', 18.99, 6.00, 'active', 'a1000000-0000-0000-0000-000000000003', 'work-gloves-leather', 'Premium cowhide leather work gloves with reinforced palm.', ARRAY['gloves','safety','leather'], 'Mechanix'),
  ('57391678-8e43-4bd9-9a92-d368cad04f27', 'Ear Muffs Industrial', 'SA-EAR-003', 34.99, 12.00, 'active', 'a1000000-0000-0000-0000-000000000003', 'ear-muffs-industrial', 'NRR 30dB industrial ear muffs with padded headband.', ARRAY['hearing','safety','ppe'], '3M');
