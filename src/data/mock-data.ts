/**
 * Datos ficticios (Mock Data) para diseño visual y pruebas de interfaz de DocuSmart.
 * NOTA: Estos datos son exclusivamente para demostración visual de la UI.
 * No representan persistencia real en base de datos.
 */

export interface MockFolder {
  id: string;
  name: string;
  count: number;
  color?: string;
  icon?: string;
}

export interface MockCategory {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export interface MockDocument {
  id: string;
  name: string;
  type: "pdf" | "docx" | "img";
  extension: string;
  size: string;
  sizeBytes: number;
  updatedAt: string;
  createdAt?: string;
  folderId: string;
  categoryId: string;
  tags: string[];
  isFavorite?: boolean;
  notes?: string;
  storagePath?: string;
  tipoMime?: string;
}

export const MOCK_FOLDERS: MockFolder[] = [
  { id: "folder-1", name: "Facturas & Recibos", count: 4, color: "#3b82f6" },
  { id: "folder-2", name: "Contratos & Legal", count: 3, color: "#8b5cf6" },
  { id: "folder-3", name: "Identificaciones & Personal", count: 2, color: "#10b981" },
  { id: "folder-4", name: "Garantías & Equipos", count: 2, color: "#f59e0b" },
];

export const MOCK_CATEGORIES: MockCategory[] = [
  { id: "cat-1", name: "Facturas", color: "#3b82f6", badgeBg: "bg-blue-100", badgeText: "text-blue-800" },
  { id: "cat-2", name: "Legal", color: "#8b5cf6", badgeBg: "bg-purple-100", badgeText: "text-purple-800" },
  { id: "cat-3", name: "Finanzas", color: "#10b981", badgeBg: "bg-emerald-100", badgeText: "text-emerald-800" },
  { id: "cat-4", name: "Personal", color: "#f59e0b", badgeBg: "bg-amber-100", badgeText: "text-amber-800" },
  { id: "cat-5", name: "Vehículo", color: "#ec4899", badgeBg: "bg-pink-100", badgeText: "text-pink-800" },
];

export const MOCK_DOCUMENTS: MockDocument[] = [
  {
    id: "doc-1",
    name: "Factura_Internet_Noviembre_2026.pdf",
    type: "pdf",
    extension: "PDF",
    size: "1.4 MB",
    sizeBytes: 1468006,
    updatedAt: "Hace 2 horas",
    folderId: "folder-1",
    categoryId: "cat-1",
    tags: ["Servicios", "2026", "Fibra"],
    isFavorite: true,
    notes: "Comprobante pagado mediante débito automático.",
  },
  {
    id: "doc-2",
    name: "Contrato_Arrendamiento_Vivienda_Firmado.docx",
    type: "docx",
    extension: "DOCX",
    size: "3.2 MB",
    sizeBytes: 3355443,
    updatedAt: "Ayer, 16:45",
    folderId: "folder-2",
    categoryId: "cat-2",
    tags: ["Inmueble", "Legal", "Firma"],
    isFavorite: true,
    notes: "Vigencia de 3 años a partir del 1 de diciembre.",
  },
  {
    id: "doc-3",
    name: "Recibo_Mantenimiento_Vehicular_Taller.pdf",
    type: "pdf",
    extension: "PDF",
    size: "820 KB",
    sizeBytes: 839680,
    updatedAt: "12 Nov 2026",
    folderId: "folder-1",
    categoryId: "cat-5",
    tags: ["Auto", "Frenos", "Taller"],
    isFavorite: false,
    notes: "Cambio de pastillas y revisión de neumáticos.",
  },
  {
    id: "doc-4",
    name: "DNI_Identificacion_Anverso_Reverso.jpg",
    type: "img",
    extension: "JPG",
    size: "2.1 MB",
    sizeBytes: 2202009,
    updatedAt: "10 Nov 2026",
    folderId: "folder-3",
    categoryId: "cat-4",
    tags: ["Identificación", "Oficial"],
    isFavorite: false,
    notes: "Copia escaneada en alta resolución.",
  },
  {
    id: "doc-5",
    name: "Poliza_Seguro_Hogar_TodoRiesgo.pdf",
    type: "pdf",
    extension: "PDF",
    size: "4.8 MB",
    sizeBytes: 5033164,
    updatedAt: "05 Nov 2026",
    folderId: "folder-2",
    categoryId: "cat-2",
    tags: ["Seguro", "Hogar", "Anual"],
    isFavorite: false,
    notes: "Número de póliza: POL-992384-H.",
  },
  {
    id: "doc-6",
    name: "Garantia_Laptop_ProBook_2026.png",
    type: "img",
    extension: "PNG",
    size: "1.8 MB",
    sizeBytes: 1887436,
    updatedAt: "28 Oct 2026",
    folderId: "folder-4",
    categoryId: "cat-4",
    tags: ["Equipos", "Garantía", "Laptop"],
    isFavorite: true,
    notes: "Garantía extendida por 24 meses.",
  },
];
