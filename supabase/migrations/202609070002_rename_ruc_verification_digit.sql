begin;

alter table public.listing_verifications
rename column document_verifier to verification_digit;

comment on column public.listing_verifications.verification_digit is
'Dígito verificador del RUC paraguayo. Debe permanecer vacío para documentos de tipo CI.';

grant insert (verification_digit)
on public.listing_verifications
to authenticated;

grant update (verification_digit)
on public.listing_verifications
to authenticated;

commit;