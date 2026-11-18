import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    module: "API Documents",
    story: "HU-02",
    status: "Pendiente",
    message: "Endpoint preparado para carga y listado seguro de documentos",
  });
}
