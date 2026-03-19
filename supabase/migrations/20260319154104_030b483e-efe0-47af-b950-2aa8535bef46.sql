UPDATE storage.buckets 
SET allowed_mime_types = array[
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon',
  'font/woff', 'font/woff2', 'font/ttf', 'application/font-woff', 'application/font-woff2', 'application/x-font-ttf', 'application/vnd.ms-fontobject',
  'text/css', 'application/javascript', 'text/javascript'
]
WHERE id = 'theme-assets';