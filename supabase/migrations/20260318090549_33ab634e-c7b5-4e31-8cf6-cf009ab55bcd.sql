-- Role system i sigurt
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.assign_role_by_email(_email TEXT, _role public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _target_user_id UUID;
BEGIN
  SELECT id INTO _target_user_id
  FROM auth.users
  WHERE lower(email) = lower(_email)
  ORDER BY created_at ASC
  LIMIT 1;

  IF _target_user_id IS NULL THEN
    RAISE EXCEPTION 'Nuk u gjet përdorues me email: %', _email;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

DROP POLICY IF EXISTS "Perdoruesit shohin rolet e veta" ON public.user_roles;
CREATE POLICY "Perdoruesit shohin rolet e veta"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin menaxhon rolet" ON public.user_roles;
CREATE POLICY "Admin menaxhon rolet"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger-at e updated_at që mungonin
DROP TRIGGER IF EXISTS update_autoret_updated_at ON public.autoret;
CREATE TRIGGER update_autoret_updated_at
BEFORE UPDATE ON public.autoret
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_kategorite_updated_at ON public.kategorite;
CREATE TRIGGER update_kategorite_updated_at
BEFORE UPDATE ON public.kategorite
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nxenesit_updated_at ON public.nxenesit;
CREATE TRIGGER update_nxenesit_updated_at
BEFORE UPDATE ON public.nxenesit
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_huazimet_updated_at ON public.huazimet;
CREATE TRIGGER update_huazimet_updated_at
BEFORE UPDATE ON public.huazimet
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Skema e re e librave
ALTER TABLE public.librat
  ADD COLUMN IF NOT EXISTS autori_emer_mbiemer TEXT,
  ADD COLUMN IF NOT EXISTS cmimi NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sasia INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS data_regjistrimit TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data_inventarizimit TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zhaneri TEXT;

UPDATE public.librat l
SET autori_emer_mbiemer = a.emri_plote
FROM public.autoret a
WHERE l.autori_id = a.id
  AND (l.autori_emer_mbiemer IS NULL OR l.autori_emer_mbiemer = '');

UPDATE public.librat
SET autori_emer_mbiemer = 'Pa autor'
WHERE autori_emer_mbiemer IS NULL OR autori_emer_mbiemer = '';

UPDATE public.librat l
SET zhaneri = k.emri
FROM public.kategorite k
WHERE l.kategoria_id = k.id
  AND l.zhaneri IS NULL;

UPDATE public.librat
SET sasia = GREATEST(COALESCE(sasia, sasia_totale, sasia_gjendje, 1), 0),
    data_regjistrimit = COALESCE(data_regjistrimit, created_at, now())
WHERE sasia IS NULL OR data_regjistrimit IS NULL;

ALTER TABLE public.librat
  ALTER COLUMN autori_emer_mbiemer SET NOT NULL,
  ALTER COLUMN sasia SET NOT NULL,
  ALTER COLUMN data_regjistrimit SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'librat_sasia_nonnegative'
  ) THEN
    ALTER TABLE public.librat
      ADD CONSTRAINT librat_sasia_nonnegative CHECK (sasia >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'librat_cmimi_nonnegative'
  ) THEN
    ALTER TABLE public.librat
      ADD CONSTRAINT librat_cmimi_nonnegative CHECK (cmimi IS NULL OR cmimi >= 0);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.validate_huazim_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _stok_total INTEGER;
  _huazime_aktive INTEGER;
BEGIN
  SELECT sasia INTO _stok_total
  FROM public.librat
  WHERE id = NEW.liber_id;

  IF _stok_total IS NULL THEN
    RAISE EXCEPTION 'Libri nuk ekziston.';
  END IF;

  IF NEW.statusi IN ('aktiv', 'vonuar') THEN
    SELECT COUNT(*) INTO _huazime_aktive
    FROM public.huazimet
    WHERE liber_id = NEW.liber_id
      AND statusi IN ('aktiv', 'vonuar')
      AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

    IF _huazime_aktive >= _stok_total THEN
      RAISE EXCEPTION 'Nuk ka kopje të lira për këtë libër.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_huazim_inventory_trigger ON public.huazimet;
CREATE TRIGGER validate_huazim_inventory_trigger
BEFORE INSERT OR UPDATE ON public.huazimet
FOR EACH ROW
EXECUTE FUNCTION public.validate_huazim_inventory();

ALTER TABLE public.librat DROP CONSTRAINT IF EXISTS librat_autori_id_fkey;
ALTER TABLE public.librat DROP CONSTRAINT IF EXISTS librat_kategoria_id_fkey;

ALTER TABLE public.librat
  DROP COLUMN IF EXISTS autori_id,
  DROP COLUMN IF EXISTS kategoria_id,
  DROP COLUMN IF EXISTS isbn,
  DROP COLUMN IF EXISTS viti_botimit,
  DROP COLUMN IF EXISTS sasia_totale,
  DROP COLUMN IF EXISTS sasia_gjendje,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;