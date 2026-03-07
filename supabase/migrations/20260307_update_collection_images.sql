-- ============================================
-- Update Collection Image URLs
-- ============================================
-- Update image URLs to use local static images

UPDATE collections 
SET image_url = '/static/images/collections/sharp.jpg'
WHERE theme_no = '01';

UPDATE collections 
SET image_url = '/static/images/collections/vital.jpg'
WHERE theme_no = '02';

UPDATE collections 
SET image_url = '/static/images/collections/calm.jpg'
WHERE theme_no = '03';
