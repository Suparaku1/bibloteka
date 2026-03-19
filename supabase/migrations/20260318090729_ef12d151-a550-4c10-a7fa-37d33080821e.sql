-- Shtrëngo politikat e shkrimit: vetëm admin mund të ndryshojë të dhënat kryesore
DROP POLICY IF EXISTS "Vetem te autentikuarit shtojne autore" ON public.autoret;
DROP POLICY IF EXISTS "Vetem te autentikuarit perditesojne autore" ON public.autoret;
DROP POLICY IF EXISTS "Vetem te autentikuarit fshijne autore" ON public.autoret;
CREATE POLICY "Vetem admin shton autore"
ON public.autoret FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin perditeson autore"
ON public.autoret FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin fshin autore"
ON public.autoret FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vetem te autentikuarit shtojne kategori" ON public.kategorite;
DROP POLICY IF EXISTS "Vetem te autentikuarit perditesojne kategori" ON public.kategorite;
DROP POLICY IF EXISTS "Vetem te autentikuarit fshijne kategori" ON public.kategorite;
CREATE POLICY "Vetem admin shton kategori"
ON public.kategorite FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin perditeson kategori"
ON public.kategorite FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin fshin kategori"
ON public.kategorite FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vetem te autentikuarit shtojne libra" ON public.librat;
DROP POLICY IF EXISTS "Vetem te autentikuarit perditesojne libra" ON public.librat;
DROP POLICY IF EXISTS "Vetem te autentikuarit fshijne libra" ON public.librat;
CREATE POLICY "Vetem admin shton libra"
ON public.librat FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin perditeson libra"
ON public.librat FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin fshin libra"
ON public.librat FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vetem te autentikuarit shtojne nxenes" ON public.nxenesit;
DROP POLICY IF EXISTS "Vetem te autentikuarit perditesojne nxenes" ON public.nxenesit;
DROP POLICY IF EXISTS "Vetem te autentikuarit fshijne nxenes" ON public.nxenesit;
CREATE POLICY "Vetem admin shton nxenes"
ON public.nxenesit FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin perditeson nxenes"
ON public.nxenesit FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin fshin nxenes"
ON public.nxenesit FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vetem te autentikuarit shtojne huazime" ON public.huazimet;
DROP POLICY IF EXISTS "Vetem te autentikuarit perditesojne huazime" ON public.huazimet;
DROP POLICY IF EXISTS "Vetem te autentikuarit fshijne huazime" ON public.huazimet;
CREATE POLICY "Vetem admin shton huazime"
ON public.huazimet FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin perditeson huazime"
ON public.huazimet FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Vetem admin fshin huazime"
ON public.huazimet FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));