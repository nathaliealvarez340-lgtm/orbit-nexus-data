export type PacInvoiceDraftInput = {
  invoiceId: string;
  companyId: string;
  customerRfc: string;
  totalCents: number;
  currency: string;
};

export type PacInvoiceResult = {
  provider: string;
  status: "draft_created" | "pending" | "stamped" | "cancelled" | "failed";
  providerInvoiceId?: string;
  uuid?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  message: string;
};

export interface PacProvider {
  createInvoiceDraft(input: PacInvoiceDraftInput): Promise<PacInvoiceResult>;
  stampInvoice(invoiceId: string): Promise<PacInvoiceResult>;
  cancelInvoice(invoiceId: string): Promise<PacInvoiceResult>;
  getInvoiceStatus(invoiceId: string): Promise<PacInvoiceResult>;
}

class SafeMockPacProvider implements PacProvider {
  private providerName = "mock-pac-disabled";

  async createInvoiceDraft(input: PacInvoiceDraftInput): Promise<PacInvoiceResult> {
    return {
      provider: this.providerName,
      status: "draft_created",
      providerInvoiceId: `internal-${input.invoiceId}`,
      message:
        "Borrador interno creado. No es CFDI fiscal ni sustituye timbrado con PAC autorizado."
    };
  }

  async stampInvoice(): Promise<PacInvoiceResult> {
    return {
      provider: this.providerName,
      status: "failed",
      message:
        "Timbrado CFDI deshabilitado. La integracion real debe conectarse a proveedor PAC/CFDI como Facturama, Facturapi, SW sapien u otro proveedor autorizado."
    };
  }

  async cancelInvoice(): Promise<PacInvoiceResult> {
    return {
      provider: this.providerName,
      status: "failed",
      message:
        "Cancelacion fiscal deshabilitada hasta configurar un PAC autorizado."
    };
  }

  async getInvoiceStatus(): Promise<PacInvoiceResult> {
    return {
      provider: this.providerName,
      status: "pending",
      message:
        "Estado fiscal no disponible porque no hay PAC autorizado conectado."
    };
  }
}

export function getPacProvider(): PacProvider {
  return new SafeMockPacProvider();
}

