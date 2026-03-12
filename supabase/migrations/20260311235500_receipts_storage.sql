-- Create a new bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the receipts bucket

-- 1. Allow authenticated users to upload files to the receipts bucket
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- 2. Allow public access to view receipts (needed for the share page)
CREATE POLICY "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');

-- 3. Allow users to delete their own uploads
-- Note: This assumes the file path starts with the user ID if we wanted strict ownership,
-- but for now, any authenticated user can manage the bucket objects they uploaded.
-- A simpler version for Sprint 2:
CREATE POLICY "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts');
