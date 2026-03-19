-- Create enum for loan status
CREATE TYPE public.statusi_huazimit AS ENUM ('aktiv', 'kthyer', 'vonuar');

-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Kategorite table
CREATE TABLE public.kategorite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emri TEXT NOT NULL,
  kod_slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.kategorite ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kategorite jane publike per lexim" ON public.kategorite FOR SELECT USING (true);
CREATE POLICY "Vetem te autentikuarit shtojne kategori" ON public.kategorite FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vetem te autentikuarit perditesojne kategori" ON public.kategorite FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vetem te autentikuarit fshijne kategori" ON public.kategorite FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_kategorite_updated_at BEFORE UPDATE ON public.kategorite FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Autoret table
CREATE TABLE public.autoret (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emri_plote TEXT NOT NULL,
  biografi_shkurter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.autoret ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autoret jane publike per lexim" ON public.autoret FOR SELECT USING (true);
CREATE POLICY "Vetem te autentikuarit shtojne autore" ON public.autoret FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vetem te autentikuarit perditesojne autore" ON public.autoret FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vetem te autentikuarit fshijne autore" ON public.autoret FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_autoret_updated_at BEFORE UPDATE ON public.autoret FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Librat table
CREATE TABLE public.librat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  isbn TEXT UNIQUE,
  titulli TEXT NOT NULL,
  autori_id UUID REFERENCES public.autoret(id) ON DELETE SET NULL,
  kategoria_id UUID REFERENCES public.kategorite(id) ON DELETE SET NULL,
  viti_botimit INTEGER,
  sasia_totale INTEGER NOT NULL DEFAULT 1,
  sasia_gjendje INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.librat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Librat jane publike per lexim" ON public.librat FOR SELECT USING (true);
CREATE POLICY "Vetem te autentikuarit shtojne libra" ON public.librat FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vetem te autentikuarit perditesojne libra" ON public.librat FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vetem te autentikuarit fshijne libra" ON public.librat FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_librat_updated_at BEFORE UPDATE ON public.librat FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Nxenesit table
CREATE TABLE public.nxenesit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emri TEXT NOT NULL,
  mbiemri TEXT NOT NULL,
  klasa TEXT,
  nr_amzes TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.nxenesit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nxenesit jane publike per lexim" ON public.nxenesit FOR SELECT USING (true);
CREATE POLICY "Vetem te autentikuarit shtojne nxenes" ON public.nxenesit FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vetem te autentikuarit perditesojne nxenes" ON public.nxenesit FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vetem te autentikuarit fshijne nxenes" ON public.nxenesit FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_nxenesit_updated_at BEFORE UPDATE ON public.nxenesit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Huazimet table
CREATE TABLE public.huazimet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  liber_id UUID NOT NULL REFERENCES public.librat(id) ON DELETE CASCADE,
  nxenes_id UUID NOT NULL REFERENCES public.nxenesit(id) ON DELETE CASCADE,
  data_marrjes TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_kthimit_parashikuar TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '14 days'),
  data_kthimit_real TIMESTAMP WITH TIME ZONE,
  statusi public.statusi_huazimit NOT NULL DEFAULT 'aktiv',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.huazimet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Huazimet jane publike per lexim" ON public.huazimet FOR SELECT USING (true);
CREATE POLICY "Vetem te autentikuarit shtojne huazime" ON public.huazimet FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Vetem te autentikuarit perditesojne huazime" ON public.huazimet FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Vetem te autentikuarit fshijne huazime" ON public.huazimet FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_huazimet_updated_at BEFORE UPDATE ON public.huazimet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_librat_kategoria ON public.librat(kategoria_id);
CREATE INDEX idx_librat_autori ON public.librat(autori_id);
CREATE INDEX idx_huazimet_liber ON public.huazimet(liber_id);
CREATE INDEX idx_huazimet_nxenes ON public.huazimet(nxenes_id);
CREATE INDEX idx_huazimet_statusi ON public.huazimet(statusi);
CREATE INDEX idx_nxenesit_klasa ON public.nxenesit(klasa);