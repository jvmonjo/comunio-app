export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  isFixed: boolean; // true = fixed, false = variable (depends on consumption)
}

export interface Invoice {
  id: string;
  name: string; // e.g., "Factura Luz Enero"
  date: string;
  items: InvoiceItem[];
  total: number;
}

export interface Person {
  id: string;
  name: string;
  fixedPercentage: number; // For fixed costs or simple split
  consumptionPercentage: number; // For variable costs
}

export interface Settings {
  people: Person[];
  splitMode: 'simple' | 'complex'; // simple = all by fixedPercentage, complex = split by type
}

export const useInvoiceStore = () => {
  const invoices = useState<Invoice[]>('invoices', () => []);
  const settings = useState<Settings>('settings', () => ({
    people: [],
    splitMode: 'complex'
  }));

  const initialized = useState('invoices-initialized', () => false);

  const init = () => {
    if (initialized.value) return;
    if (import.meta.client) {
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        try {
          invoices.value = JSON.parse(storedInvoices);
        } catch (e) {
          console.error("Failed to parse invoices", e);
        }
      }

      const storedSettings = localStorage.getItem('settings');
      if (storedSettings) {
        try {
          settings.value = JSON.parse(storedSettings);
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      initialized.value = true;
    }
  };

  const save = () => {
    if (import.meta.client) {
      localStorage.setItem('invoices', JSON.stringify(invoices.value));
      localStorage.setItem('settings', JSON.stringify(settings.value));
    }
  };

  const addInvoice = (invoice: Invoice) => {
    invoices.value.push(invoice);
    save();
  };
  
  const removeInvoice = (id: string) => {
    invoices.value = invoices.value.filter(i => i.id !== id);
    save();
  };

  const updateInvoice = (updatedInvoice: Invoice) => {
    const index = invoices.value.findIndex(i => i.id === updatedInvoice.id);
    if (index !== -1) {
      invoices.value[index] = updatedInvoice;
      save();
    }
  };

  const updateSettings = (newSettings: Settings) => {
    settings.value = newSettings;
    save();
  };
  
  return {
    invoices,
    settings,
    init,
    addInvoice,
    removeInvoice,
    updateInvoice,
    updateSettings,
    save
  };
};
