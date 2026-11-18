import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión - DocuSmart",
  description: "Accede a tu repositorio documental personal y seguro en DocuSmart.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <LoginForm />
    </div>
  );
}
