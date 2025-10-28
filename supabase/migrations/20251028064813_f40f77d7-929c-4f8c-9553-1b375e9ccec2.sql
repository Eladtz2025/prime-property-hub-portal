-- Allow anyone to view available properties
CREATE POLICY "Anyone can view available properties"
ON properties FOR SELECT
USING (available = true);