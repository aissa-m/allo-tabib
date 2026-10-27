-- RLS sin políticas en todas las tablas: la API REST de Supabase (roles anon/authenticated) no puede
-- leer ni escribir nada. La app no se ve afectada: Prisma conecta como dueño de las tablas, que se salta RLS.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Professional" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Specialty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Zone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoredFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
