-- Migration pour ajouter les politiques RLS INSERT et UPDATE pour la table referrals

-- Les utilisateurs peuvent insérer leur propre code de parrainage
CREATE POLICY "Users can insert their own referral code"
    ON public.referrals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre code de parrainage
CREATE POLICY "Users can update their own referral code"
    ON public.referrals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
