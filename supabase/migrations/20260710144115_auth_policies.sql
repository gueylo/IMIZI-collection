-- Update RLS policies for products
CREATE POLICY "Allow authenticated full access on products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Update RLS policies for settings
CREATE POLICY "Allow authenticated full access on settings"
ON public.settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
