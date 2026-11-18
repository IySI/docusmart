import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    module: "API Auth",
    story: "HU-01",
    status: "Pendiente",
    message: "Endpoint preparado para desarrollo de HU-01 (Autenticación y Sesión)",
  });
}
