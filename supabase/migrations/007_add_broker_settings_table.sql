-- Table broker_settings pour gérer la disponibilité/maintenance des brokers

CREATE TABLE IF NOT EXISTS public.broker_settings (
    broker_name TEXT PRIMARY KEY,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_maintenance BOOLEAN NOT NULL DEFAULT FALSE,
    maintenance_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour updated_at automatique sur broker_settings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_broker_settings_updated_at'
    ) THEN
        CREATE TRIGGER update_broker_settings_updated_at
            BEFORE UPDATE ON public.broker_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS
ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;

-- Lecture ouverte (utile côté app pour afficher la dispo)
CREATE POLICY "Anyone can view broker settings"
    ON public.broker_settings
    FOR SELECT
    USING (true);

-- Les modifications se font via service role (pas de policy INSERT/UPDATE/DELETE)

