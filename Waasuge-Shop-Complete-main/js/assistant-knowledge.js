import { getSettingValue } from "./database.js";

const normalize = (text = "") => String(text || "").toLowerCase().replace(/[^\w\u0600-\u06ff]+/g, " ").replace(/\s+/g, " ").trim();

async function readSetting(keys = [], fallback = "") {
  for (const key of keys) {
    try {
      const value = await getSettingValue(key, null);
      if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
    } catch {}
  }
  return fallback;
}

function entry(patterns, answer, chips = []) {
  return { patterns, answer, chips };
}

export const ASSISTANT_KNOWLEDGE_BANK = [
  entry(
    [
      "shop name",
      "what is the shop name",
      "tell me the shop name",
      "shop name please",
      "business name",
      "what do you call the shop"
    ]
, 
    async () => `The shop name is ${await readSetting(["shopName","shop_name","businessName","business_name","name"], "Waasuge Electronics")}.`
, 
    [
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      },
      {
        "label": "Opening hours",
        "intent": "assistant.knowledge",
        "commandText": "opening hours"
      },
      {
        "label": "Shop WhatsApp",
        "intent": "assistant.knowledge",
        "commandText": "shop whatsapp"
      }
    ]
  ),
  entry(
    [
      "owner name",
      "who owns the shop",
      "shop owner",
      "owner of the shop",
      "who is the owner"
    ]
, 
    async () => `The owner is ${await readSetting(["ownerName","owner_name","proprietor","owner"], "the shop owner")}.`
, 
    [
      {
        "label": "Shop name",
        "intent": "assistant.knowledge",
        "commandText": "shop name"
      },
      {
        "label": "Contact details",
        "intent": "assistant.knowledge",
        "commandText": "contact details"
      }
    ]
  ),
  entry(
    [
      "developer",
      "who made this app",
      "who built the assistant",
      "app developer",
      "assistant developer"
    ]
, 
    async () => `This assistant was built for the Waasuge shop system. ${await readSetting(["developerName","developer_name","devName"], "Eng Zakariye Salah")}`.trim()
, 
    [
      {
        "label": "About the shop",
        "intent": "assistant.knowledge",
        "commandText": "about the shop"
      },
      {
        "label": "What can I ask you",
        "intent": "assistant.help",
        "commandText": "what can i ask you"
      }
    ]
  ),
  entry(
    [
      "shop phone",
      "phone number",
      "contact number",
      "shop number",
      "call the shop",
      "what is the phone number"
    ]
, 
    async () => `The phone number is ${await readSetting(["phone","shopPhone","shop_phone","contactPhone","contact_phone"], "not set yet")}.`
, 
    [
      {
        "label": "WhatsApp",
        "intent": "assistant.knowledge",
        "commandText": "shop whatsapp"
      },
      {
        "label": "Email",
        "intent": "assistant.knowledge",
        "commandText": "shop email"
      },
      {
        "label": "Address",
        "intent": "assistant.knowledge",
        "commandText": "shop address"
      }
    ]
  ),
  entry(
    [
      "shop whatsapp",
      "whatsapp number",
      "what is the whatsapp",
      "contact whatsapp",
      "send whatsapp"
    ]
, 
    async () => `The WhatsApp number is ${await readSetting(["whatsapp","whatsappNumber","whatsapp_number","whatsAppNumber"], "not set yet")}.`
, 
    [
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      },
      {
        "label": "Email",
        "intent": "assistant.knowledge",
        "commandText": "shop email"
      }
    ]
  ),
  entry(
    [
      "shop email",
      "email address",
      "contact email",
      "what is the email",
      "send email"
    ]
, 
    async () => `The email address is ${await readSetting(["email","shopEmail","contactEmail"], "not set yet")}.`
, 
    [
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      },
      {
        "label": "Address",
        "intent": "assistant.knowledge",
        "commandText": "shop address"
      }
    ]
  ),
  entry(
    [
      "shop address",
      "address",
      "location",
      "where is the shop",
      "shop location"
    ]
, 
    async () => `The address is ${await readSetting(["address","shopAddress","location","shopLocation"], "not set yet")}.`
, 
    [
      {
        "label": "Opening hours",
        "intent": "assistant.knowledge",
        "commandText": "opening hours"
      },
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      }
    ]
  ),
  entry(
    [
      "opening hours",
      "business hours",
      "shop hours",
      "when do you open",
      "when do you close",
      "opening time"
    ]
, 
    async () => `The opening hours are ${await readSetting(["hours","openingHours","businessHours","workingHours"], "not set yet")}.`
, 
    [
      {
        "label": "Shop address",
        "intent": "assistant.knowledge",
        "commandText": "shop address"
      },
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      }
    ]
  ),
  entry(
    [
      "currency",
      "shop currency",
      "what currency do you use",
      "currency used",
      "money unit"
    ]
, 
    async () => `The current currency is ${await readSetting(["currency","shopCurrency","defaultCurrency"], "not set yet")}.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Settings",
        "intent": "settings.open",
        "commandText": "settings"
      }
    ]
  ),
  entry(
    [
      "payment methods",
      "how can customers pay",
      "accepted payment",
      "payment options",
      "do you take cash"
    ]
, 
    () => `Customers can usually pay by the methods configured in the shop settings. If you want, I can help you check the payments setup.`
, 
    [
      {
        "label": "Settings",
        "intent": "settings.open",
        "commandText": "settings"
      },
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      }
    ]
  ),
  entry(
    [
      "warranty",
      "repair warranty",
      "do you give warranty",
      "service warranty",
      "how long is warranty"
    ]
, 
    () => `Warranty depends on the service or product. Check the item or repair record for the exact warranty note.`
, 
    [
      {
        "label": "Repair search",
        "intent": "repair.search",
        "commandText": "search repair"
      },
      {
        "label": "Product search",
        "intent": "product.search",
        "commandText": "search product"
      }
    ]
  ),
  entry(
    [
      "services",
      "what services do you offer",
      "shop services",
      "repair services",
      "mobile repair services"
    ]
, 
    () => `The shop handles product sales, phone repair, diagnosis, receipts, reports, and customer records.`
, 
    [
      {
        "label": "Add repair",
        "intent": "repair.add",
        "commandText": "add repair"
      },
      {
        "label": "Add product",
        "intent": "product.add",
        "commandText": "add product"
      }
    ]
  ),
  entry(
    [
      "dashboard",
      "what is dashboard",
      "dashboard meaning",
      "dashboard summary"
    ]
, 
    () => `The dashboard shows today summary, quick stats, income, profit, expenses, and activity.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Quick stats",
        "intent": "dashboard.open",
        "commandText": "open dashboard"
      }
    ]
  ),
  entry(
    [
      "low stock",
      "what is low stock",
      "low stock meaning",
      "low stock products"
    ]
, 
    () => `Low stock means the product quantity is getting small and needs restocking soon.`
, 
    [
      {
        "label": "Low stock products",
        "intent": "product.filter",
        "commandText": "low stock products"
      },
      {
        "label": "Out of stock products",
        "intent": "product.filter",
        "commandText": "out of stock products"
      }
    ]
  ),
  entry(
    [
      "out of stock",
      "what is out of stock",
      "out of stock meaning"
    ]
, 
    () => `Out of stock means the product quantity is zero or unavailable now.`
, 
    [
      {
        "label": "Out of stock products",
        "intent": "product.filter",
        "commandText": "out of stock products"
      },
      {
        "label": "All stock",
        "intent": "product.filter",
        "commandText": "all stock"
      }
    ]
  ),
  entry(
    [
      "invoice only",
      "direct sales",
      "sales only",
      "invoice type",
      "what is invoice only"
    ]
, 
    () => `Invoice only means a normal invoice record, while direct sales means a sale without the same invoice flow.`
, 
    [
      {
        "label": "Invoice only",
        "intent": "invoice.filter",
        "commandText": "invoice only"
      },
      {
        "label": "Direct sales only",
        "intent": "invoice.filter",
        "commandText": "direct sales only"
      }
    ]
  ),
  entry(
    [
      "repairs status",
      "repair statuses",
      "pending repair",
      "processing repair",
      "completed repair",
      "delivered repair"
    ]
, 
    () => `Repair statuses usually include pending, processing, in repair, waiting for parts, completed, and delivered.`
, 
    [
      {
        "label": "Pending repairs",
        "intent": "repair.filter",
        "commandText": "pending repairs"
      },
      {
        "label": "Completed repairs",
        "intent": "repair.filter",
        "commandText": "completed repairs"
      }
    ]
  ),
  entry(
    [
      "today report",
      "daily report",
      "today summary",
      "show today report"
    ]
, 
    () => `I can show today report with income, expenses, profit, invoices, repairs, products, and customers.`
, 
    [
      {
        "label": "Weekly report",
        "intent": "report.weekly",
        "commandText": "weekly report"
      },
      {
        "label": "Monthly report",
        "intent": "report.monthly",
        "commandText": "monthly report"
      }
    ]
  ),
  entry(
    [
      "weekly report",
      "week report",
      "this week report"
    ]
, 
    () => `The weekly report summarizes the current week and helps you compare sales, repairs, and expenses.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Monthly report",
        "intent": "report.monthly",
        "commandText": "monthly report"
      }
    ]
  ),
  entry(
    [
      "monthly report",
      "month report",
      "this month report"
    ]
, 
    () => `The monthly report groups the current month so you can track performance and totals.`
, 
    [
      {
        "label": "Yearly report",
        "intent": "report.yearly",
        "commandText": "yearly report"
      },
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      }
    ]
  ),
  entry(
    [
      "yearly report",
      "year report",
      "this year report"
    ]
, 
    () => `The yearly report helps you review the full year totals and trends.`
, 
    [
      {
        "label": "Monthly report",
        "intent": "report.monthly",
        "commandText": "monthly report"
      },
      {
        "label": "Export PDF",
        "intent": "report.export.pdf",
        "commandText": "export report pdf"
      }
    ]
  ),
  entry(
    [
      "print report",
      "how to print report",
      "print this report"
    ]
, 
    () => `Use the report page print button to print the selected report period and category.`
, 
    [
      {
        "label": "Print report",
        "intent": "report.print",
        "commandText": "print report"
      },
      {
        "label": "Export PDF",
        "intent": "report.export.pdf",
        "commandText": "export pdf"
      }
    ]
  ),
  entry(
    [
      "export pdf",
      "export csv",
      "how to export report",
      "download report"
    ]
, 
    () => `You can export the report as PDF or CSV from the report actions.`
, 
    [
      {
        "label": "Export PDF",
        "intent": "report.export.pdf",
        "commandText": "export report pdf"
      },
      {
        "label": "Export CSV",
        "intent": "report.export.csv",
        "commandText": "export report csv"
      }
    ]
  ),
  entry(
    [
      "search invoice",
      "search invoice number",
      "find invoice",
      "invoice search"
    ]
, 
    () => `Use the invoice search box and type the invoice number or customer detail you want to find.`
, 
    [
      {
        "label": "Search invoice 245",
        "intent": "invoice.search",
        "commandText": "search invoice 245"
      },
      {
        "label": "Paid invoices",
        "intent": "invoice.filter",
        "commandText": "paid invoices"
      }
    ]
  ),
  entry(
    [
      "search customer",
      "search customer name",
      "search customer phone",
      "find customer"
    ]
, 
    () => `Use the customer search box and type the name, phone number, or ID you want to find.`
, 
    [
      {
        "label": "Search customer name Ahmed",
        "intent": "customer.search",
        "commandText": "search customer name Ahmed"
      },
      {
        "label": "Customers with balance",
        "intent": "customer.filter",
        "commandText": "customers with balance"
      }
    ]
  ),
  entry(
    [
      "search product",
      "find product",
      "product search",
      "search product name"
    ]
, 
    () => `Use the product search box and type the product name, barcode, or ID.`
, 
    [
      {
        "label": "Search product iphone",
        "intent": "product.search",
        "commandText": "search product iphone"
      },
      {
        "label": "Low stock products",
        "intent": "product.filter",
        "commandText": "low stock products"
      }
    ]
  ),
  entry(
    [
      "search repair",
      "find repair",
      "repair search"
    ]
, 
    () => `Use the repair search box and type the repair number, customer name, or device info.`
, 
    [
      {
        "label": "Search repair 120",
        "intent": "repair.search",
        "commandText": "search repair 120"
      },
      {
        "label": "Pending repairs",
        "intent": "repair.filter",
        "commandText": "pending repairs"
      }
    ]
  ),
  entry(
    [
      "settings",
      "what settings do you have",
      "open settings",
      "settings page"
    ]
, 
    () => `The settings page lets you change shop details, currency, language, profile, and theme.`
, 
    [
      {
        "label": "Change shop name",
        "intent": "settings.shop",
        "commandText": "change shop name"
      },
      {
        "label": "Change dark mode",
        "intent": "settings.theme",
        "commandText": "change dark mode"
      }
    ]
  ),
  entry(
    [
      "contact details",
      "shop contact",
      "how can i contact you",
      "contact information"
    ]
, 
    () => `I can show the shop phone, WhatsApp, email, and address from settings.`
, 
    [
      {
        "label": "Shop phone",
        "intent": "assistant.knowledge",
        "commandText": "shop phone"
      },
      {
        "label": "Shop WhatsApp",
        "intent": "assistant.knowledge",
        "commandText": "shop whatsapp"
      }
    ]
  ),
];

export const ASSISTANT_KNOWLEDGE_QUICK_QUESTIONS = [
  {
    "label": "Shop name",
    "intent": "assistant.knowledge",
    "commandText": "shop name"
  },
  {
    "label": "Shop phone",
    "intent": "assistant.knowledge",
    "commandText": "shop phone"
  },
  {
    "label": "Shop WhatsApp",
    "intent": "assistant.knowledge",
    "commandText": "shop whatsapp"
  },
  {
    "label": "Shop email",
    "intent": "assistant.knowledge",
    "commandText": "shop email"
  },
  {
    "label": "Shop address",
    "intent": "assistant.knowledge",
    "commandText": "shop address"
  },
  {
    "label": "Opening hours",
    "intent": "assistant.knowledge",
    "commandText": "opening hours"
  },
  {
    "label": "Warranty",
    "intent": "assistant.knowledge",
    "commandText": "warranty"
  },
  {
    "label": "Services",
    "intent": "assistant.knowledge",
    "commandText": "services"
  },
  {
    "label": "Payment methods",
    "intent": "assistant.knowledge",
    "commandText": "payment methods"
  },
  {
    "label": "Currency",
    "intent": "assistant.knowledge",
    "commandText": "currency"
  },
  {
    "label": "Today report",
    "intent": "report.today",
    "commandText": "today report"
  },
  {
    "label": "Weekly report",
    "intent": "report.weekly",
    "commandText": "weekly report"
  },
  {
    "label": "Monthly report",
    "intent": "report.monthly",
    "commandText": "monthly report"
  },
  {
    "label": "Yearly report",
    "intent": "report.yearly",
    "commandText": "yearly report"
  },
  {
    "label": "Print report",
    "intent": "report.print",
    "commandText": "print report"
  },
  {
    "label": "Export PDF",
    "intent": "report.export.pdf",
    "commandText": "export report pdf"
  },
  {
    "label": "Export CSV",
    "intent": "report.export.csv",
    "commandText": "export report csv"
  },
  {
    "label": "Search invoice",
    "intent": "invoice.search",
    "commandText": "search invoice"
  },
  {
    "label": "Search customer",
    "intent": "customer.search",
    "commandText": "search customer"
  },
  {
    "label": "Search product",
    "intent": "product.search",
    "commandText": "search product"
  },
  {
    "label": "Search repair",
    "intent": "repair.search",
    "commandText": "search repair"
  },
  {
    "label": "Low stock products",
    "intent": "product.filter",
    "commandText": "low stock products"
  },
  {
    "label": "Out of stock products",
    "intent": "product.filter",
    "commandText": "out of stock products"
  },
  {
    "label": "Paid invoices",
    "intent": "invoice.filter",
    "commandText": "paid invoices"
  },
  {
    "label": "Unpaid invoices",
    "intent": "invoice.filter",
    "commandText": "unpaid invoices"
  },
  {
    "label": "Partial invoices",
    "intent": "invoice.filter",
    "commandText": "partial invoices"
  }
];
