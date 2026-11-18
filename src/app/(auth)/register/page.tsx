import { RegisterForm } from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Usuario - DocuSmart",
  description: "Crea tu cuenta gratuita en DocuSmart y organiza tus documentos con IA.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <RegisterForm />
    </div>
  );
}
