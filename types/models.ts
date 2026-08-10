export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  updatedAt: string;
};

export type ChatRole = "USER" | "ASSISTANT";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatConversation = {
  id: string;
  title: string;
  updatedAt: string;
};

export type DocumentType = "QUOTE" | "INVOICE";
export type DocumentStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";

export type DocumentItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  position: number;
};

export type BillingDocument = {
  id: string;
  type: DocumentType;
  number: string;
  status: DocumentStatus;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
  items: DocumentItem[];
};

export function documentTotals(doc: Pick<BillingDocument, "items" | "taxRate">) {
  const subtotal = doc.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * (doc.taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}
