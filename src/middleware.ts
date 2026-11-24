import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Interceta todas as rotas de requisição exceto:
     * - _next/static (ficheiros estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone do browser)
     * - ficheiros com extensão (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
