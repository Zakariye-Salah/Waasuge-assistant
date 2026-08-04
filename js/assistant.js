
import { showToast, formatCurrency, formatDate, formatDateTime, normalizeText as utilNormalizeText } from "./main.js";
import {
  PATHS,
  getOnce,
  getCustomers,
  getInvoices,
  getRepairs,
  getProducts,
  getExpenses,
  filterActive,
  buildReportSummary,
  buildInvoiceSummary,
  buildRepairSummary,
  buildProductSummary,
  buildExpenseSummary,
  safeNumber,
  toArray
} from "./database.js";
import {
  ASSISTANT_KNOWLEDGE_BANK,
  ASSISTANT_KNOWLEDGE_QUICK_QUESTIONS
} from "./assistant-knowledge.js";
import {
  ASSISTANT_CHAT_BANK,
  ASSISTANT_CHAT_QUICK_QUESTIONS
} from "./assistant-chat.js";
import {
  ASSISTANT_SOMALI_BANK,
  ASSISTANT_SOMALI_QUICK_QUESTIONS
} from "./assistant-somali.js";
import {
  ASSISTANT_MOTIVATION_BANK,
  ASSISTANT_MOTIVATION_QUICK_QUESTIONS
} from "./assistant-motivation.js";

const STORAGE = {
  history: "waasugeAssistantHistory",
  recent: "waasugeAssistantRecentCommands",
  favorites: "waasugeAssistantFavorites",
  searches: "waasugeAssistantSearchPhrases",
  lastPage: "waasugeAssistantLastPage",
  language: "waasugeAssistantLanguage",
  pending: "waasugeAssistantPendingAction",
  collapsed: "waasugeAssistantCollapsed",
  shortcuts: "waasugeAssistantFavoriteActions",
  nickname: "waasugeAssistantNickname",
  feedback: "waasugeAssistantFeedback",
  feedbackState: "waasugeAssistantFeedbackState",
  pinnedMessages: "waasugeAssistantPinnedMessages"
};

const PAGE_MAP = {
  dashboard: "dashboard.html",
  customers: "customers.html",
  repairs: "repairing.html",
  products: "product.html",
  invoices: "invoice.html",
  expenses: "expenses.html",
  reports: "report.html",
  settings: "settings.html"
};

const ENTITY_HINTS = {
  customer: ["customer", "customers", "macmiil", "macmiilka", "customername", "contact"],
  repair: ["repair", "repairs", "dayactir", "dayactirka", "service", "device"],
  product: ["product", "products", "alaab", "stock", "item", "cart"],
  invoice: ["invoice", "invoices", "biil", "bill", "rasiid", "receipt"],
  expense: ["expense", "expenses", "kharash", "khidmad", "cost", "money"],
  report: ["report", "reports", "warbixin", "today", "daily", "weekly", "monthly", "yearly", "profit", "revenue"],
  setting: ["setting", "settings", "config", "dejin", "shop name", "whatsapp", "dark mode", "theme", "language", "currency"]
};

const ACTION_WORDS = ["add", "edit", "delete", "restore", "search", "print", "export", "view", "show", "open", "update", "change", "sell", "restock", "filter", "pay"];

const NUMERIC_SHORTCUTS = [
  { code: "00", label: "Show all shortcuts", intent: "assistant.shortcuts", action: "show", entity: "assistant", pageOnly: false },
  { code: "1", label: "Open Dashboard", intent: "dashboard.open", action: "open", entity: "dashboard", pageOnly: true },
  { code: "2", label: "Open Invoices", intent: "invoice.open", action: "open", entity: "invoice", pageOnly: true },
  { code: "3", label: "Open Products", intent: "product.open", action: "open", entity: "product", pageOnly: true },
  { code: "4", label: "Open Repairs", intent: "repair.open", action: "open", entity: "repair", pageOnly: true },
  { code: "5", label: "Open Customers", intent: "customer.open", action: "open", entity: "customer", pageOnly: true },
  { code: "6", label: "Open Reports", intent: "report.open", action: "open", entity: "report", pageOnly: true },
  { code: "7", label: "Open Expenses", intent: "expense.open", action: "open", entity: "expense", pageOnly: true },
  { code: "9", label: "Open Settings", intent: "settings.open", action: "open", entity: "setting", pageOnly: true },
  { code: "11", label: "Toggle Dark Mode", intent: "settings.theme", action: "change", entity: "setting", pageOnly: true },
  { code: "22", label: "New Invoice", intent: "invoice.add", action: "add", entity: "invoice", pageOnly: true },
  { code: "33", label: "New Product", intent: "product.add", action: "add", entity: "product", pageOnly: true },
  { code: "44", label: "New Repair", intent: "repair.add", action: "add", entity: "repair", pageOnly: true },
  { code: "55", label: "New Customer", intent: "customer.add", action: "add", entity: "customer", pageOnly: true },
  { code: "66", label: "Print Report", intent: "report.print", action: "print", entity: "report", pageOnly: true, context: { period: "all", category: "all", metric: "revenue", rows: "all", searchText: "" } },
  { code: "77", label: "New Expense", intent: "expense.add", action: "add", entity: "expense", pageOnly: true },
  { code: "99", label: "Open Settings", intent: "settings.open", action: "open", entity: "setting", pageOnly: true },
  { code: "123", label: "Edit Profile", intent: "settings.profile.open", action: "open", entity: "setting", pageOnly: true }
];

const NUMERIC_SHORTCUT_MAP = Object.fromEntries(NUMERIC_SHORTCUTS.map((item) => [item.code, item]));

function shortcutItem(code, label, detail = "") {
  return { code, label, detail };
}

function shortcutSection(title, items) {
  return { title, items };
}

function shortcutCatalogData(scope = "all") {
  const sections = {
    settings: [
      shortcutSection("Settings & profile", [
        shortcutItem(".1", "Open settings shortcuts", "Show settings, profile, dark mode, password, email, and phone actions"),
        shortcutItem("9", "Open Settings", "Go to the settings page"),
        shortcutItem("11", "Toggle Dark Mode", "Switch dark mode on or off"),
        shortcutItem("123", "Edit Profile", "Open profile editing from the top menu"),
        shortcutItem("change password", "Change password", "Open the profile menu and password action"),
        shortcutItem("change my name", "Change my name", "Open profile editing and rename the account"),
        shortcutItem("change my email", "Change my email", "Open profile editing and update email"),
        shortcutItem("change my number", "Change my number", "Open profile editing and update phone number")
      ])
    ],
    invoice: [
      shortcutSection("Invoice shortcuts", [
        shortcutItem(".2", "Open invoice shortcuts", "Show invoice search, status, type, date, and sort commands"),
        shortcutItem("2", "Open Invoices", "Go to the invoice page"),
        shortcutItem("search invoice", "Search invoice", "Search by customer name, phone, invoice number, or ID"),
        shortcutItem("partial invoices", "Partial invoices", "Filter invoices by partial payment"),
        shortcutItem("unpaid invoices", "Unpaid invoices", "Filter invoices with balance remaining"),
        shortcutItem("paid invoices", "Paid invoices", "Filter invoices that are fully paid"),
        shortcutItem("invoice only", "Invoice only", "Show invoice records only"),
        shortcutItem("direct sales", "Direct sales", "Show direct sales or walk-in sales"),
        shortcutItem("this week invoices", "This week invoices", "Filter to the current week"),
        shortcutItem("this month invoices", "This month invoices", "Filter to the current month"),
        shortcutItem("this year invoices", "This year invoices", "Filter to the current year"),
        shortcutItem("oldest invoices", "Oldest invoices", "Sort invoices from oldest to newest"),
        shortcutItem("newest invoices", "Newest invoices", "Sort invoices from newest to oldest"),
        shortcutItem("print invoice", "Print invoice", "Print the invoice or invoice list"),
        shortcutItem("export invoice pdf", "Export invoice PDF", "Export invoices as PDF"),
        shortcutItem("export invoice csv", "Export invoice CSV", "Export invoices as CSV")
      ])
    ],
    product: [
      shortcutSection("Product shortcuts", [
        shortcutItem(".3", "Open product shortcuts", "Show product stock, category, and sorting commands"),
        shortcutItem("3", "Open Products", "Go to the product page"),
        shortcutItem("search product", "Search product", "Search by product name or product ID"),
        shortcutItem("low stock products", "Low stock products", "Show items that need restocking"),
        shortcutItem("out of stock products", "Out of stock products", "Show products with zero stock"),
        shortcutItem("in stock products", "In stock products", "Show products currently available"),
        shortcutItem("all stock products", "All stock products", "Show every product stock status"),
        shortcutItem("product category", "Product category", "Filter products by category"),
        shortcutItem("sort by price", "Sort by price", "Sort products by price"),
        shortcutItem("sort by quantity", "Sort by quantity", "Sort products by quantity"),
        shortcutItem("restock product", "Restock product", "Open the product stock update flow")
      ])
    ],
    repair: [
      shortcutSection("Repair shortcuts", [
        shortcutItem(".4", "Open repair shortcuts", "Show repair status, payment, and date commands"),
        shortcutItem("4", "Open Repairs", "Go to the repairing page"),
        shortcutItem("search repair", "Search repair", "Search by customer, phone, model, or repair ID"),
        shortcutItem("device received", "Device received", "Filter repairs waiting for processing"),
        shortcutItem("diagnosis completed", "Diagnosis completed", "Filter repairs after diagnosis"),
        shortcutItem("repair in progress", "Repair in progress", "Filter active repairs"),
        shortcutItem("quality testing", "Quality testing", "Filter repairs in testing stage"),
        shortcutItem("ready for pickup", "Ready for pickup", "Filter repairs ready to collect"),
        shortcutItem("waiting for parts", "Waiting for parts", "Filter repairs that need parts"),
        shortcutItem("delivered repairs", "Delivered repairs", "Filter repairs already delivered"),
        shortcutItem("paid repairs", "Paid repairs", "Show paid repair jobs"),
        shortcutItem("partial repairs", "Partial repairs", "Show partially paid repair jobs")
      ])
    ],
    customer: [
      shortcutSection("Customer shortcuts", [
        shortcutItem(".5", "Open customer shortcuts", "Show customer search, balance, and sort commands"),
        shortcutItem("5", "Open Customers", "Go to the customers page"),
        shortcutItem("search customer", "Search customer", "Search by name, phone, WhatsApp, or address"),
        shortcutItem("customers with balance", "Customers with balance", "Show customers who still owe money"),
        shortcutItem("paid customers", "Paid customers", "Show customers with zero balance"),
        shortcutItem("oldest customers", "Oldest customers", "Sort customers by oldest first"),
        shortcutItem("newest customers", "Newest customers", "Sort customers by newest first"),
        shortcutItem("highest paid customers", "Highest paid customers", "Sort by highest paid amount"),
        shortcutItem("lowest paid customers", "Lowest paid customers", "Sort by lowest paid amount")
      ])
    ],
    report: [
      shortcutSection("Report shortcuts", [
        shortcutItem(".6", "Open report shortcuts", "Show report period, category, metric, print, and export commands"),
        shortcutItem("6", "Open Reports", "Go to the reports page"),
        shortcutItem("today report", "Today report", "Show today's premium summary"),
        shortcutItem("weekly report", "Weekly report", "Show weekly summary"),
        shortcutItem("monthly report", "Monthly report", "Show monthly summary"),
        shortcutItem("yearly report", "Yearly report", "Show yearly summary"),
        shortcutItem("all time report", "All time report", "Show all records"),
        shortcutItem("products report", "Products report", "Show product-focused metrics"),
        shortcutItem("invoices report", "Invoices report", "Show invoice-focused metrics"),
        shortcutItem("repairs report", "Repairs report", "Show repair-focused metrics"),
        shortcutItem("expenses report", "Expenses report", "Show expense-focused metrics"),
        shortcutItem("print report", "Print report", "Print the selected report"),
        shortcutItem("export report pdf", "Export report PDF", "Export the report as PDF"),
        shortcutItem("export report csv", "Export report CSV", "Export the report as CSV")
      ])
    ],
    help: [
      shortcutSection("Help & chat shortcuts", [
        shortcutItem(".11", "Open help shortcuts", "Show greetings, jokes, time, date, and casual replies"),
        shortcutItem("hello", "Hello", "Friendly greeting"),
        shortcutItem("salaam", "Salaam", "Friendly Somali greeting"),
        shortcutItem("what is the time now", "Ask the current time", "Get the current local time"),
        shortcutItem("what is the date now", "Ask the current date", "Get the current date"),
        shortcutItem("what can i ask you", "Ask for help", "See example commands and questions"),
        shortcutItem("joke", "Tell a joke", "Get a quick funny reply"),
        shortcutItem("kaftan", "Tell a joke in Somali", "Get a Somali-style funny reply"),
        shortcutItem("waan daalanahay", "I am tired", "Get a supportive response")
      ])
    ]
  };

  if (scope === "settings") return sections.settings;
  if (scope === "invoice") return sections.invoice;
  if (scope === "product") return sections.product;
  if (scope === "repair") return sections.repair;
  if (scope === "customer") return sections.customer;
  if (scope === "report") return sections.report;
  if (scope === "help") return sections.help;
  return [
    shortcutSection("Open pages", [
      shortcutItem("1", "Open Dashboard", "Go to the dashboard page"),
      shortcutItem("2", "Open Invoices", "Go to the invoice page"),
      shortcutItem("3", "Open Products", "Go to the product page"),
      shortcutItem("4", "Open Repairs", "Go to the repairing page"),
      shortcutItem("5", "Open Customers", "Go to the customers page"),
      shortcutItem("6", "Open Reports", "Go to the reports page"),
      shortcutItem("7", "Open Expenses", "Go to the expenses page"),
      shortcutItem("9", "Open Settings", "Go to the settings page")
    ]),
    shortcutSection("Quick create", [
      shortcutItem("22", "New Invoice", "Open the new invoice form"),
      shortcutItem("33", "New Product", "Open the new product form"),
      shortcutItem("44", "New Repair", "Open the new repair form"),
      shortcutItem("55", "New Customer", "Open the new customer form"),
      shortcutItem("77", "New Expense", "Open the new expense form"),
      shortcutItem("11", "Toggle Dark Mode", "Switch theme quickly"),
      shortcutItem("123", "Edit Profile", "Open profile editing")
    ]),
    shortcutSection("Shortcuts by area", [
      shortcutItem(".1", "Settings shortcuts", "Open settings and profile commands"),
      shortcutItem(".2", "Invoice shortcuts", "Open invoice search and filters"),
      shortcutItem(".3", "Product shortcuts", "Open product search and filters"),
      shortcutItem(".4", "Repair shortcuts", "Open repair search and filters"),
      shortcutItem(".5", "Customer shortcuts", "Open customer search and filters"),
      shortcutItem(".6", "Report shortcuts", "Open report search and filters"),
      shortcutItem(".11", "Help shortcuts", "Open greetings, jokes, and time/date replies"),
      shortcutItem("00", "Show all shortcuts", "Open the full shortcut list")
    ])
  ];
}

function buildShortcutCatalogResponse(scope = "all") {
  const sections = shortcutCatalogData(scope);
  const text = sections.map((section) => {
    const lines = section.items.map((item) => `• ${item.code} — ${item.label}${item.detail ? `: ${item.detail}` : ""}`);
    return `${section.title}
${lines.join("")}`;
  }).join("");

  const chips = sections.flatMap((section) => section.items).map((item) => ({
    label: `${item.code} · ${item.label}`,
    intent: "assistant.shortcuts"
  }));

  return {
    text,
    chips
  };
}

function detectDotShortcut(text = "") {
  const raw = String(text || "").trim();
  if (!raw.startsWith(".")) return null;

  const compact = raw.replace(/\s+/g, "");
  const code = compact.replace(/^\.+/, "");
  const scopeMap = {
    "00": "all",
    "1": "settings",
    "2": "invoice",
    "3": "product",
    "4": "repair",
    "5": "customer",
    "6": "report",
    "7": "help",
    "11": "help"
  };
  const scope = scopeMap[code];
  if (!scope) return null;

  return {
    type: "shortcut",
    intent: code === "00" ? "assistant.shortcuts" : `assistant.catalog.${scope}`,
    action: "show",
    entity: "assistant",
    shortcutCode: `.${code}`,
    shortcutScope: scope,
    context: {
      pageOnly: false,
      scope
    }
  };
}
const DEFAULT_SHORTCUTS = [
  { label: "Add new customer", intent: "customer.add" },
  { label: "Edit customer name", intent: "customer.edit" },
  { label: "Change customer phone", intent: "customer.edit" },
  { label: "Delete customer", intent: "customer.delete" },
  { label: "Restore customer", intent: "customer.restore" },
  { label: "Search customer by number", intent: "customer.search" },
  { label: "Search customer by name", intent: "customer.search" },
  { label: "Show customer balance", intent: "customer.view" },
  { label: "Add new repair", intent: "repair.add" },
  { label: "Edit repair status", intent: "repair.edit" },
  { label: "Delete repair", intent: "repair.delete" },
  { label: "Restore repair", intent: "repair.restore" },
  { label: "Search repair by number", intent: "repair.search" },
  { label: "Show today repairs", intent: "report.today" },
  { label: "Show pending repairs", intent: "repair.filter" },
  { label: "Show completed repairs", intent: "repair.filter" },
  { label: "Show delivered repairs", intent: "repair.filter" },
  { label: "Add new product", intent: "product.add" },
  { label: "Edit product price", intent: "product.edit" },
  { label: "Delete product", intent: "product.delete" },
  { label: "Restore product", intent: "product.restore" },
  { label: "Search product", intent: "product.search" },
  { label: "Add product to cart", intent: "product.cart" },
  { label: "Sell product to customer", intent: "product.sell" },
  { label: "Sell to walk-in customer", intent: "product.sell" },
  { label: "Ask for paid amount", intent: "product.sell" },
  { label: "Print receipt", intent: "print" },
  { label: "Add new invoice", intent: "invoice.add" },
  { label: "Edit invoice", intent: "invoice.edit" },
  { label: "Delete invoice", intent: "invoice.delete" },
  { label: "Restore invoice", intent: "invoice.restore" },
  { label: "Search invoice", intent: "invoice.search" },
  { label: "Show unpaid invoices", intent: "invoice.filter" },
  { label: "Show partially paid invoices", intent: "invoice.filter" },
  { label: "Show paid invoices", intent: "invoice.filter" },
  { label: "Add new expense", intent: "expense.add" },
  { label: "Edit expense", intent: "expense.edit" },
  { label: "Delete expense", intent: "expense.delete" },
  { label: "Restore expense", intent: "expense.restore" },
  { label: "Search expense", intent: "expense.search" },
  { label: "Show total expenses", intent: "report.expense" },
  { label: "Show today report", intent: "report.today" },
  { label: "Show daily report", intent: "report.today" },
  { label: "Show weekly report", intent: "report.weekly" },
  { label: "Show monthly report", intent: "report.monthly" },
  { label: "Export report PDF", intent: "report.export.pdf" },
  { label: "Export report CSV", intent: "report.export.csv" },
  { label: "Print report", intent: "report.print" },
  { label: "Change dark mode", intent: "settings.theme" },
  { label: "Update shop settings", intent: "settings.open" }
];

const TOP_SUGGESTIONS = DEFAULT_SHORTCUTS.slice(0, 10);

const HISTORY_WARNING_LIMIT = 100;
const HISTORY_WARNING_KEY = "waasugeAssistantHistoryWarningShown";

const HELPFUL_QUESTION_BANK = [
  { label: "Search invoice 245", intent: "invoice.search", commandText: "search invoice 245" },
  { label: "Search customer name Ahmed", intent: "customer.search", commandText: "search customer name Ahmed" },
  { label: "Search customer phone 0617125558", intent: "customer.search", commandText: "search customer phone 0617125558" },
  { label: "Search product iphone", intent: "product.search", commandText: "search product iphone" },
  { label: "Search repair 120", intent: "repair.search", commandText: "search repair 120" },
  { label: "Low stock products", intent: "product.filter", commandText: "low stock products" },
  { label: "Out of stock products", intent: "product.filter", commandText: "out of stock products" },
  { label: "In stock products", intent: "product.filter", commandText: "in stock products" },
  { label: "Paid invoices", intent: "invoice.filter", commandText: "paid invoices" },
  { label: "Partial invoices", intent: "invoice.filter", commandText: "partial invoices" },
  { label: "Unpaid invoices", intent: "invoice.filter", commandText: "unpaid invoices" },
  { label: "Invoice only", intent: "invoice.filter", commandText: "invoice only" },
  { label: "Direct sales only", intent: "invoice.filter", commandText: "direct sales only" },
  { label: "Today report", intent: "report.today", commandText: "today report" },
  { label: "Daily report", intent: "report.today", commandText: "daily report" },
  { label: "Weekly report", intent: "report.weekly", commandText: "weekly report" },
  { label: "Monthly report", intent: "report.monthly", commandText: "monthly report" },
  { label: "Yearly report", intent: "report.yearly", commandText: "yearly report" },
  { label: "Products report", intent: "report.products", commandText: "products report" },
  { label: "Invoices report", intent: "report.invoices", commandText: "invoices report" },
  { label: "Repairs report", intent: "report.repairs", commandText: "repairs report" },
  { label: "Expenses report", intent: "report.expense", commandText: "expenses report" },
  { label: "Print report", intent: "report.print", commandText: "print report" },
  { label: "Export report PDF", intent: "report.export.pdf", commandText: "export report pdf" },
  { label: "Export report CSV", intent: "report.export.csv", commandText: "export report csv" },
  { label: "Add customer", intent: "customer.add", commandText: "add customer" },
  { label: "Add product", intent: "product.add", commandText: "add product" },
  { label: "Add repair", intent: "repair.add", commandText: "add repair" },
  { label: "Add invoice", intent: "invoice.add", commandText: "add invoice" },
  { label: "Add expense", intent: "expense.add", commandText: "add expense" },
  { label: "Edit customer", intent: "customer.edit", commandText: "edit customer" },
  { label: "Edit product", intent: "product.edit", commandText: "edit product" },
  { label: "Edit repair", intent: "repair.edit", commandText: "edit repair" },
  { label: "Edit invoice", intent: "invoice.edit", commandText: "edit invoice" },
  { label: "Delete invoice", intent: "invoice.delete", commandText: "delete invoice INV-123" },
  { label: "Delete customer", intent: "customer.delete", commandText: "delete customer 0617125558" },
  { label: "Restore invoice", intent: "invoice.restore", commandText: "restore invoice" },
  { label: "Customers with balance", intent: "customer.filter", commandText: "customers with balance" },
  { label: "Paid customers", intent: "customer.filter", commandText: "paid customers" },
  { label: "Male customers", intent: "customer.filter", commandText: "male customers" },
  { label: "Female customers", intent: "customer.filter", commandText: "female customers" },
  { label: "Search by name", intent: "assistant.help", commandText: "search customer name Ahmed" },
  { label: "Search by phone", intent: "assistant.help", commandText: "search customer phone 0617125558" },
  { label: "Change dark mode", intent: "settings.theme", commandText: "change dark mode" },
  { label: "Change shop name", intent: "settings.shop", commandText: "change shop name" },
  { label: "Change phone", intent: "settings.phone", commandText: "change phone" },
  { label: "Change email", intent: "settings.email", commandText: "change email" },
  { label: "Change password", intent: "settings.password", commandText: "change password" },
  { label: "Edit profile", intent: "settings.profile.open", commandText: "edit profile" },
  { label: "What is the time now", intent: "assistant.help", commandText: "what is the time now" },
  { label: "What is the date now", intent: "assistant.help", commandText: "what is the date now" },
  { label: "Show all shortcuts", intent: "assistant.shortcuts", commandText: "00" },
  { label: "Repeat last command", intent: "assistant.help", commandText: "repeat last command" },
  { label: "Pin conversation", intent: "assistant.help", commandText: "pin conversation" },
  { label: "Save shortcut", intent: "assistant.help", commandText: "save shortcut" },
  { label: "Clear chat", intent: "assistant.help", commandText: "clear chat" }
];

const EXTENDED_HELPFUL_QUESTION_BANK = [
  ...HELPFUL_QUESTION_BANK,
  ...ASSISTANT_KNOWLEDGE_QUICK_QUESTIONS,
  ...ASSISTANT_CHAT_QUICK_QUESTIONS,
  ...ASSISTANT_SOMALI_QUICK_QUESTIONS,
  ...ASSISTANT_MOTIVATION_QUICK_QUESTIONS
];

const KNOWLEDGE_BANKS = [
  ASSISTANT_KNOWLEDGE_BANK,
  ASSISTANT_CHAT_BANK,
  ASSISTANT_SOMALI_BANK,
  ASSISTANT_MOTIVATION_BANK
];

function patternMatchesInput(text = "", pattern = "") {
  const source = normalizeInput(text);
  const needle = normalizeInput(pattern);
  if (!source || !needle) return false;
  return source === needle || source.includes(needle);
}

async function resolveKnowledgeReply(rawText = "", intent = {}) {
  const text = String(rawText || "").trim();
  if (!text) return null;

  const shouldCheck = !intent || ["clarify", "question", "casual", "empty"].includes(intent.type) || !intent.type;
  if (!shouldCheck) return null;

  for (const bank of KNOWLEDGE_BANKS) {
    for (const entry of bank) {
      const patterns = toArray(entry?.patterns);
      if (!patterns.some((pattern) => patternMatchesInput(text, pattern))) continue;

      const answer = typeof entry?.answer === "function"
        ? await entry.answer({ text, intent, entry })
        : String(entry?.answer || "").trim();

      if (!answer) continue;

      const chips = normalizeSuggestionList(entry?.chips || [], entry?.intent || "");
      return chips.length ? { text: answer, chips } : { text: answer, chips: [] };
    }
  }

  return null;
}

function makeSuggestion(label, intent = "", commandText = "") {
  const cleanLabel = String(label || "").trim();
  const cleanIntent = String(intent || "").trim();
  const cleanCommand = String(commandText || cleanLabel).trim();
  return cleanLabel ? { label: cleanLabel, intent: cleanIntent, commandText: cleanCommand } : null;
}

function normalizeSuggestionList(items = [], fallbackIntent = "") {
  return toArray(items)
    .map((item) => {
      if (typeof item === "string") {
        return makeSuggestion(item, defaultIntentForSuggestion(item) || fallbackIntent, item);
      }
      if (!item) return null;
      return makeSuggestion(item.label || item.text || item.commandText, item.intent || fallbackIntent, item.commandText || item.text || item.label);
    })
    .filter(Boolean);
}

function defaultIntentForSuggestion(label = "") {
  const t = normalizeInput(label);
  if (includesAny(t, ["today report", "daily report"])) return "report.today";
  if (includesAny(t, ["weekly report"])) return "report.weekly";
  if (includesAny(t, ["monthly report"])) return "report.monthly";
  if (includesAny(t, ["yearly report"])) return "report.yearly";
  if (includesAny(t, ["products report"])) return "report.products";
  if (includesAny(t, ["invoices report"])) return "report.invoices";
  if (includesAny(t, ["repairs report"])) return "report.repairs";
  if (includesAny(t, ["expenses report"])) return "report.expense";
  if (includesAny(t, ["print report"])) return "report.print";
  if (includesAny(t, ["export report pdf"])) return "report.export.pdf";
  if (includesAny(t, ["export report csv"])) return "report.export.csv";
  if (includesAny(t, ["low stock"])) return "product.filter";
  if (includesAny(t, ["out of stock", "in stock"])) return "product.filter";
  if (includesAny(t, ["paid invoices", "partial invoices", "unpaid invoices", "invoice only", "direct sales"])) return "invoice.filter";
  if (includesAny(t, ["customers with balance", "paid customers", "male customers", "female customers"])) return "customer.filter";
  if (includesAny(t, ["search invoice"])) return "invoice.search";
  if (includesAny(t, ["search customer"])) return "customer.search";
  if (includesAny(t, ["search product"])) return "product.search";
  if (includesAny(t, ["search repair"])) return "repair.search";
  return "";
}

function formatConversationTime(at = Date.now()) {
  const date = new Date(Number(at) || Date.now());
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (sameDay) return `Today ${time}`;
  if (isYesterday) return `Yesterday ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "2-digit" })} ${time}`;
}

function maybeWarnConversationLimit() {
  if (state.history.length <= HISTORY_WARNING_LIMIT) return;
  if (localStorage.getItem(HISTORY_WARNING_KEY) === "1") return;
  localStorage.setItem(HISTORY_WARNING_KEY, "1");
  showToast?.("Conversation history is over 100. Clear old chats or localStorage to keep the assistant fast.", "warning", ASSISTANT_NAME);
}

function renderConversationWarning() {
  if (!ui?.messages || state.history.length <= HISTORY_WARNING_LIMIT) return;
  if (ui.messages.querySelector(".waasuge-assistant-history-warning")) return;
  const warning = createEl("div", {
    className: "waasuge-assistant-history-warning",
    html: `
      <i class="bi bi-exclamation-triangle"></i>
      <div>
        <strong>Conversation history is getting heavy.</strong>
        <span>Clear old chats or localStorage to keep the assistant fast.</span>
      </div>
    `
  });
  ui.messages.prepend(warning);
}

const REPLY_DELAY = 1000;
const ASSISTANT_NAME = "Waasuge Assistant";

const ASSISTANT_BEHAVIOR_PROMPT = String.raw`You are the local Waasuge Electronics Shop Assistant.

You must work fully offline in the browser.
Do not use external AI services, API keys, or a backend AI server.
Use localStorage for memory, history, nickname, favorites, recent commands, shortcut usage, and user preferences.

Your job is to understand short commands, mixed Somali-English text, typos, slang, and natural sentences.
Be polite, helpful, human, fast, and accurate.

IMPORTANT
• Do not break any existing app features.
• Do not remove or replace current working logic unless the new behavior is clearly better and compatible.
• Reuse existing page functions, current filters, current toasts, and current UI patterns whenever possible.
• Never duplicate CRUD logic if an existing function already does the job.
• Ask a short clarification when the command is unclear.
• Show a typing animation before replying.
• Wait about 1 second before replying.
• Keep responses short unless the user asks for details.
• Mirror the user’s language style: Somali, English, or mixed.
• Store conversation history, nickname, favorite actions, recent commands, and shortcut usage in localStorage.
• Do not store sensitive data unnecessarily.

SMARTER INTENT DETECTION
Understand user intent from short commands and natural language.
Detect:
• action words: add, edit, delete, restore, search, filter, print, export, open, view, pay, sell, change, update
• entity words: customer, repair, product, invoice, expense, report, settings, dashboard
• context words: date, period, status, type, category, balance, stock, phone, name, id, number

Always try to infer the real action and the real target.
If the user says:
• “partial invoice” → set invoice status filter to partial
• “unpaid invoice this month” → set status unpaid and date this month
• “low stock products” → set product stock filter to low stock
• “out of stock items” → set product stock filter to out of stock
• “invoice only” → set invoice type filter to invoice only
• “sales only” → set invoice type filter to direct sales
• “print report for products this year” → set report category to products and period to year before printing
• “search this number 0617125558 in the invoice” → extract only the number
• “edit customer 0617125558” → extract only the number
• “delete invoice 245” → extract only the invoice number
• “search customer name Ahmed” → extract only the name

Do not send the full sentence into a search box if a smaller exact target can be extracted.

PAGE-AWARE COMMANDS
Understand the current page and only show relevant actions.

Dashboard:
• open dashboard
• today summary
• quick stats
• total income
• total profit
• total expenses

Invoices:
• add invoice
• edit invoice
• delete invoice
• restore invoice
• search invoice
• filter invoice
• print invoice
• export invoice
• paid / partial / unpaid
• invoice only / direct sales / all
• today / week / month / year / all time
• biggest remaining
• lowest remaining
• customer A-Z / Z-A

Products:
• add product
• edit product
• delete product
• restore product
• search product
• low stock
• out of stock
• in stock
• all stock
• category filter
• sort products
• add to cart
• sell product
• print receipt

Repairs:
• add repair
• edit repair
• delete repair
• restore repair
• search repair
• filter by status
• filter by payment
• filter by date
• exact date
• print repair receipt
• pending
• processing
• in repair
• waiting for parts
• completed
• delivered

Customers:
• add customer
• edit customer
• delete customer
• restore customer
• search customer
• filter by gender
• filter by balance
• filter by type
• sort by name / balance / newest / oldest
• customers with balance
• paid customers
• male / female
• purchase customers / repair customers

Reports:
• today report
• weekly report
• monthly report
• yearly report
• all time report
• revenue
• expenses
• profit
• invoices
• products
• repairs
• customers
• print report
• export pdf
• export csv

Settings:
• change shop name
• change phone
• change WhatsApp
• change dark mode
• change language
• change currency
• change profile
• change password
• change email
• change my number

NUMERIC SHORTCUTS
• 1 → open Dashboard
• 2 → open Invoices
• 3 → open Products
• 4 → open Repairs
• 5 → open Customers
• 6 → open Reports
• 9 → open Settings
• 11 → toggle dark mode
• 123 → edit profile
• 00 → show all shortcuts
• .1 → show settings shortcuts
• .2 → show invoice shortcuts
• .3 → show product shortcuts
• .4 → show repair shortcuts
• .5 → show customer shortcuts
• .6 → show report shortcuts
• .11 → show help shortcuts, greetings, jokes, time, date, and casual replies

SMART FILTER MAPPING

Invoices:
• “partial invoice” → status = partial
• “unpaid invoice” → status = unpaid
• “paid invoice” → status = paid
• “invoice only” → type = invoice
• “sales only” → type = direct sale
• “all invoices” → type = all
• “this week / this month / this year / today / all time” → set the correct period filter
• “biggest remaining” → set remaining/high balance sort
• “lowest remaining” → set remaining/low balance sort

Products:
• “low stock” → stock = low
• “out of stock” → stock = out
• “in stock” → stock = in
• “all stock” → stock = all
• “product category” or a category name → category filter
• “newest / oldest / price / quantity / recent” → sort filter
• “important products” or “alert products” → low stock / out of stock focus

Repairs:
• “pending” → status = pending
• “processing” → status = processing
• “in repair” → status = in repair
• “waiting for parts” → status = waiting for parts
• “completed” → status = completed
• “delivered” → status = delivered
• “paid / partial / unpaid” → payment filter
• “today / weekly / monthly / yearly / exact date” → date filter

Customers:
• “customers with balance” → balance filter = balance
• “paid customers” → balance filter = paid
• “male / female” → gender filter
• “purchase customers / repair customers” → type filter
• “newest / oldest / biggest remaining / smallest remaining / highest paid / lowest paid / most invoices / most repairs / name A-Z / name Z-A” → sort filter

Reports:
• “products this month” → category = products, period = month
• “repairs this year” → category = repairs, period = year
• “invoice report this week” → category = invoices, period = week
• “expenses today” → category = expenses, period = today
• “customers report” → category = customers
• “print report” → open print for the selected category and period
• “export pdf” / “export csv” → use correct export action

SEARCH EXTRACTION
When the user says a long sentence, extract only the real target.

Examples:
• “search this number 0617125558 in the invoice”
→ extract only 0617125558
• “edit customer 0617125558”
→ extract only 0617125558
• “delete invoice 245”
→ extract only 245
• “search customer name Ahmed”
→ extract only Ahmed
• “print report for products this year”
→ extract products and this year

If the input includes a phone number, ID, invoice number, repair number, product ID, or name, prioritize that exact target.

CLARIFICATION RULES
If the command is too short or unclear, ask a short question and show helpful choices.

Examples:
• add → “What should I add?”
• edit → “What should I edit?”
• delete → “What should I delete?”
• restore → “What should I restore?”
• search → “What should I search?”
• print → “What should I print?”
• export → “Which format do you want?”
• report → “Which report period do you want?”
• today → “Do you mean today report, today sales, or today expenses?”
• customer → “Do you want add, edit, delete, restore, or search customer?”
• invoice → “Do you want add, edit, delete, restore, search, or filter invoice?”
• product → “Do you want add, edit, delete, restore, search, or sell product?”
• settings → “Which setting do you want to change?”

Use 3 to 6 suggestions that match the current page.

CONVERSATION STYLE
Answer naturally and politely.

Greeting examples:
• “Hi boss, welcome back to Waasuge Shop. How can I help you today?”
• “Salaam boss, sidee kuu caawin karaa maanta?”
• “Waa salaaman tahay, what can I do for you?”

Casual examples:
• hello / hi / salaam / waad salaaman tahay
• waan daalanahay
• kaftan / joke / funny
• what is the time now
• what is the date now
• what is today
• what can I ask you
• roast me

The assistant must also respond politely to rude text.
Never argue with the user.
Keep the reply short, friendly, and helpful.

CASUAL REPLY BEHAVIOR
• greetings → warm welcome
• thanks → friendly gratitude response
• jokes → give a funny but clean joke
• roast me → light playful reply, not rude
• rude message → calm polite response
• tired message → supportive response
• what can I ask you → give useful examples
• time/date/today → give direct answer or guide to the correct page

PROFILE AND SETTINGS ACTIONS
When the user says:
• change password
• change email
• change my number
• change my name
• edit profile

Open the profile/settings action in the top-right or three-dots menu.
If needed, tell the user to use the profile edit menu in the page header.

REACTION BUTTONS
For every assistant message:
• show copy button
• show like button
• show dislike button
• show pin button if supported
• show save shortcut button if supported
• show repeat response button if supported

Reaction rules:
• only one reaction can be active at a time
• active like = filled blue
• active dislike = filled red
• clicking one must disable the other
• clicking the active one again should turn it off

SHORTCUT CATALOG RULES
• 00 shows all shortcut groups
• .1 shows settings shortcuts
• .2 shows invoice shortcuts
• .3 shows product shortcuts
• .4 shows repair shortcuts
• .5 shows customer shortcuts
• .6 shows report shortcuts
• .11 shows greetings, jokes, time, date, and casual chat shortcuts

When the assistant is on a page, only show the shortcuts for that page.
Do not show unrelated shortcut groups.

SAFE ACTIONS
For dangerous actions like delete, change phone, change email, reset data, or restore important records:
• ask for confirmation
• show the exact target record
• show a small preview before applying
• allow cancel

BETTER HELP AND FALLBACKS
Improve fallback replies so they are helpful and not generic.
When the user asks:
• “what can I ask you”
• “what do you do”
• “help”
• “show commands”
• “what can you do”

Show a short helpful list of examples based on the current page.

BETTER MEMORY
Remember:
• nickname or preferred name
• recent commands
• favorite commands
• frequent search phrases
• last selected page
• language preference
• shortcuts used often

COMMAND HISTORY AND QUICK ACCESS
Maintain:
• command history panel
• recent command list
• favorite commands list
• quick action suggestions based on the current page
• automatic page-specific shortcut chips

PAGE-AWARE QUICK SUGGESTIONS
Only show relevant suggestion chips:
• invoice page → invoice actions
• product page → product actions
• repair page → repair actions
• customer page → customer actions
• report page → report actions
• settings page → settings actions

SEARCH ACROSS PAGES
If the user asks for a general search that could belong to multiple pages, either:
• clarify the target page, or
• choose the most likely page from the words used, then confirm briefly

Examples:
• “search 0617125558” → likely customer or invoice
• “search partial” → likely invoice status
• “search out of stock” → likely products
• “search completed” → likely repairs

DATE, TIME, AND TODAY HELPERS
Understand:
• what time is it
• what is the time now
• what is the date now
• what day is today
• what is today
• today report

Give a direct human response or open the right report page.

MORE SOMALI PHRASES
Understand and reply naturally to:
• salaam
• hi
• hello
• waan daalanahay
• sidee tahay
• maxaad qabaneysaa
• i caawi
• ii sheeg
• maxaan ku weydiin karaa
• waan ku mahadsan tahay
• kaftan ii sheeg
• sheeko ii sheeg
• waad salaaman tahay
• ii sheeg maanta report-ka
• number-kan raadi
• customer-kan beddel
• invoice-kan tirtir
• product-kan muujin
• stock-kan eeg

FOLLOW-UP IMPROVEMENT GOAL
Always try to help the user finish the action in the fewest steps.
When possible:
• apply the correct filter
• focus the correct search box
• open the right page
• use the correct page action button
• then confirm briefly

If the request is unclear, ask one short clarifying question instead of guessing.

PERFORMANCE AND CLEANUP
• Keep the logic modular.
• Avoid duplicate logic.
• Keep the assistant fast.
• Use page-specific helpers.
• Reuse existing functions.
• Do not break current behavior.

END RULE
Stay local, accurate, friendly, modular, and page-aware.
Do not break the app.`;


const state = {
  open: false,
  history: loadJSON(STORAGE.history, []),
  recent: loadJSON(STORAGE.recent, []),
  favorites: loadJSON(STORAGE.favorites, []),
  searches: loadJSON(STORAGE.searches, []),
  shortcuts: loadJSON(STORAGE.shortcuts, []),
  feedbackState: loadJSON(STORAGE.feedbackState, {}),
  pending: loadJSON(STORAGE.pending, null),
  language: localStorage.getItem(STORAGE.language) || "auto",
  busy: false,
  currentTyping: null
};

let ui = null;
let bootstrapped = false;

function loadJSON(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    void 0;
  }
}

function setSelectValue(selector, value) {
  if (!value) return false;
  const el = document.querySelector(selector);
  if (!el) return false;

  const normalized = normalizeInput(value);

  if (el.tagName !== "SELECT") {
    const container = el.closest(".category-selector, .searchable-filter, [data-category-selector], [data-dropdown-trigger]") || el.parentElement;
    if (container) {
      const trigger = container.querySelector('[data-category-selector="filter"] .category-trigger, [data-dropdown-trigger], .category-trigger, .searchable-filter-trigger, input[readonly]') || el;
      if (trigger && typeof trigger.click === "function") trigger.click();

      const searchInput = container.querySelector('[data-category-search], [data-dropdown-search]');
      if (searchInput) {
        searchInput.value = value;
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        searchInput.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const tryChoose = () => {
        const candidates = Array.from(
          container.querySelectorAll('[data-category-list] [role="option"], [data-category-list] button, [data-category-list] .list-group-item, [data-dropdown-results] [role="option"], [data-dropdown-results] button, [data-dropdown-results] .list-group-item, button, [role="option"]')
        ).filter((node) => node && node.textContent && node.offsetParent !== null);
        const found = candidates.find((node) => {
          const text = normalizeInput(node.textContent || "");
          return text === normalized || text.includes(normalized) || normalized.includes(text);
        }) || candidates[0];
        if (found && typeof found.click === "function") {
          found.click();
          return true;
        }
        return false;
      };

      setTimeout(tryChoose, 120);
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }

  const options = Array.from(el.options || []);
  const match = options.find((option) => {
    const text = normalizeInput(option.textContent || option.value || "");
    const val = normalizeInput(option.value || "");
    return text === normalized || val === normalized || text.includes(normalized) || normalized.includes(text);
  });

  const nextValue = match ? (match.value ?? match.textContent ?? value) : value;
  el.value = nextValue;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setSelectByLabels(selectors, value) {
  if (!value) return false;
  return selectors.some((selector) => setSelectValue(selector, value));
}

function detectSortValue(text = "", entity = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  const isCustomer = entity === "customer";
  const isInvoice = entity === "invoice";
  const isProduct = entity === "product";
  const isRepair = entity === "repair";

  if (includesAny(t, ["oldest", "old to new", "older first", "earliest"])) return isCustomer ? "oldest" : isInvoice ? "oldest" : isRepair ? "Oldest" : isProduct ? "Recent" : "oldest";
  if (includesAny(t, ["newest", "new first", "recent", "latest"])) return isCustomer ? "newest" : isInvoice ? "newest" : isRepair ? "Newest" : isProduct ? "Recent" : "newest";
  if (includesAny(t, ["name a-z", "a to z", "alphabetical", "name az", "az"])) return "name-az";
  if (includesAny(t, ["name z-a", "z to a", "za"])) return "name-za";

  if (includesAny(t, ["biggest remaining", "remaining high", "highest remaining", "most remaining", "largest balance"])) {
    return isCustomer ? "biggest-remaining" : "remaining-high";
  }
  if (includesAny(t, ["lowest remaining", "remaining low", "smallest remaining", "least remaining"])) {
    return isCustomer ? "smallest-remaining" : "remaining-low";
  }
  if (includesAny(t, ["highest paid", "most paid"])) return isCustomer ? "highest-paid" : "";
  if (includesAny(t, ["lowest paid", "least paid"])) return isCustomer ? "lowest-paid" : "";
  if (includesAny(t, ["most invoices"])) return isCustomer ? "most-invoices" : "";
  if (includesAny(t, ["most repairs"])) return isCustomer ? "most-repairs" : "";
  if (includesAny(t, ["price high", "highest price", "price high to low", "expensive"])) return isRepair ? "Highest Price" : isProduct ? "Price" : "";
  if (includesAny(t, ["quantity", "stock count"])) return isProduct ? "Quantity" : "";
  if (includesAny(t, ["status"])) return isRepair ? "Status" : "";
  return "";
}

function detectRowsValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["all rows", "all records", "show all", "everything", "all"])) return "all";
  const rowsMatch = t.match(/\b(?:latest|top|first|show)\s*(\d{1,3})\s*(?:rows?|items?|records?)?\b/);
  if (rowsMatch?.[1]) return rowsMatch[1];
  if (includesAny(t, ["5 rows", "five rows"])) return "5";
  if (includesAny(t, ["10 rows", "ten rows"])) return "10";
  if (includesAny(t, ["20 rows", "twenty rows"])) return "20";
  if (includesAny(t, ["30 rows", "thirty rows"])) return "30";
  if (includesAny(t, ["50 rows", "fifty rows"])) return "50";
  if (includesAny(t, ["100 rows", "hundred rows"])) return "100";
  return "";
}

function detectDateExactValue(text = "") {
  const t = String(text || "").trim();
  const iso = t.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];
  const slash = t.match(/\b(\d{1,2}[/-]\d{1,2}[/-]20\d{2})\b/);
  if (slash?.[1]) return slash[1];
  return "";
}

function detectInvoiceTypeValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["invoice only", "invoice only please", "invoice type invoice", "invoice records", "invoice record", "invoice only records"])) return "invoice";
  if (includesAny(t, ["direct sale", "sales only", "sale only", "direct sales", "walk in sale", "walk-in sale", "sale invoices"])) return "direct sale";
  if (includesAny(t, ["all invoices", "all invoice types", "all types", "all"])) return "all";
  return "";
}

function detectProductStockValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["out of stock", "out stock", "no stock", "empty stock", "stock out", "zero stock", "outstock"])) return "Out of Stock";
  if (includesAny(t, ["low stock", "important", "alert", "warning", "critical stock", "need restock", "restock"])) return "Low Stock";
  if (includesAny(t, ["in stock", "available stock", "stock available", "available", "has stock"])) return "In Stock";
  if (includesAny(t, ["all stock", "all stocks", "stock all", "every stock", "all products"])) return "All Stock";
  return "";
}

function detectRepairStatusValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["device received", "received device", "received", "pickup received"])) return "device received";
  if (includesAny(t, ["diagnosis completed", "diagnosis done", "diagnosed"])) return "diagnosis completed";
  if (includesAny(t, ["repair in progress", "in progress", "working on", "being repaired"])) return "repair in progress";
  if (includesAny(t, ["quality testing", "testing", "quality test"])) return "quality testing";
  if (includesAny(t, ["ready for pickup", "ready to pick", "pickup ready", "ready"])) return "ready for pickup";
  if (includesAny(t, ["waiting for parts", "parts waiting", "need parts"])) return "waiting for parts";
  if (includesAny(t, ["pending", "waiting", "queued"])) return "pending";
  if (includesAny(t, ["completed", "done", "finished"])) return "completed";
  if (includesAny(t, ["delivered", "handover"])) return "delivered";
  return "";
}

function detectCustomerBalanceValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["with balance", "balance customers", "owe", "remaining", "debt", "due"])) return "balance";
  if (includesAny(t, ["paid customers", "no balance", "balance zero", "settled"])) return "paid";
  return "";
}

function detectCustomerTypeValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["purchase customer", "purchase customers", "sales customer", "sell customer"])) return "purchase";
  if (includesAny(t, ["repair customer", "repair customers", "service customer"])) return "repair";
  if (includesAny(t, ["all customers", "every customer"])) return "all";
  return "";
}

function detectCustomerGenderValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["male customers", "men customers", "male"])) return "male";
  if (includesAny(t, ["female customers", "women customers", "female"])) return "female";
  return "";
}

function detectReportMetricValue(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["revenue", "income", "sales"])) return "revenue";
  if (includesAny(t, ["expense", "expenses", "cost", "spend"])) return "expense";
  if (includesAny(t, ["profit", "net profit", "earnings"])) return "profit";
  if (includesAny(t, ["stock movement", "inventory movement", "stock report"])) return "stock movement";
  if (includesAny(t, ["invoices", "invoice summary", "invoice count"])) return "invoices";
  if (includesAny(t, ["repairs", "repair summary", "repair count"])) return "repairs";
  return "";
}

function detectProfileIntent(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["change password", "update password", "password", "pin"])) return "settings.profile.password";
  if (includesAny(t, ["change my name", "update my name", "my name", "rename profile"])) return "settings.profile.name";
  if (includesAny(t, ["change my email", "update my email", "my email"])) return "settings.profile.email";
  if (includesAny(t, ["change my number", "update my number", "my number", "phone number"])) return "settings.profile.phone";
  if (includesAny(t, ["edit profile", "my profile", "profile"])) return "settings.profile.open";
  return "";
}


function getAssistantDisplayName() {
  return localStorage.getItem(STORAGE.nickname) || localStorage.getItem("electronicShopAdminName") || localStorage.getItem("electronicShopAdminEmail") || "boss";
}

function setAssistantDisplayName(name = "") {
  const clean = String(name || "").trim();
  if (clean) localStorage.setItem(STORAGE.nickname, clean);
  else localStorage.removeItem(STORAGE.nickname);
}

function detectUserAliasIntent(text = "") {
  const raw = String(text || "").trim();
  const t = normalizeInput(raw);
  if (!t) return null;

  if (includesAny(t, ["call me my real name", "call me real name", "use my real name", "forget my name", "reset my name", "remove my name", "clear my name", "use default name", "use real name"])) {
    return { clear: true, name: "" };
  }

  const cleaned = raw.replace(/[?!.]+$/g, "").trim();
  const patterns = [
    /(?:call me|name me|my name is|i am|i'm|i am called|i'm called|you can call me|na iigu yeer|iigu yeer|waxaad iigu yeeri kartaa)\s+(.{2,40})$/i,
    /(?:my nickname is|nickname is)\s+(.{2,40})$/i
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const name = match[1].replace(/^(?:please|pls|kindly)\s+/i, "").trim();
      const alias = name.split(/\bor\b/i)[0].trim();
      if (alias && !includesAny(normalizeInput(alias), ["real name", "default", "system"])) {
        return { clear: false, name: alias };
      }
    }
  }

  return null;
}

function detectNumericShortcut(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const compact = raw.replace(/\s+/g, "");
  const codeMatch = NUMERIC_SHORTCUT_MAP[compact] || NUMERIC_SHORTCUT_MAP[compact.replace(/[^\d]/g, "")];
  if (!codeMatch) return null;

  return {
    type: codeMatch.code === "00" ? "shortcut" : "command",
    intent: codeMatch.intent,
    action: codeMatch.action,
    entity: codeMatch.entity,
    shortcutCode: codeMatch.code,
    pageOnly: codeMatch.pageOnly,
    context: codeMatch.context ? { ...codeMatch.context } : buildCommandContext(raw, codeMatch.entity || "", codeMatch.action || "open")
  };
}



function isFilterOnlyCommand(text = "", entity = "") {
  const t = normalizeInput(text);
  if (!t) return false;
  const hasPhoneOrDigits = /(?:\+?\d[\d\s-]{5,}\d)|(?:\b\d{3,}\b)/.test(t);
  if (hasPhoneOrDigits) return false;

  const detect = {
    invoice: detectStatusValue(t, "invoice") || detectInvoiceTypeValue(t) || detectSortValue(t, "invoice") || detectRowsValue(t) || detectPeriod(t),
    product: detectProductStockValue(t) || detectSortValue(t, "product") || detectCategoryValue(t, "product"),
    report: detectPeriod(t) || detectCategoryValue(t, "report") || detectReportMetricValue(t),
    repair: detectRepairStatusValue(t) || detectSortValue(t, "repair") || detectPeriod(t) || detectDateExactValue(t),
    customer: detectCustomerBalanceValue(t) || detectCustomerTypeValue(t) || detectCustomerGenderValue(t) || detectSortValue(t, "customer"),
    expense: detectSortValue(t, "expense") || detectPeriod(t),
    setting: detectProfileIntent(t)
  };

  const hasAny = Boolean(detect[entity]);
  if (!hasAny) return false;

  const looksLikeLookup = includesAny(t, ["search", "find", "lookup", "open", "view", "show", "check", "print", "export", "edit", "delete", "restore"]);
  return !looksLikeLookup || !hasSpecificTarget(t, entity, "search");
}

function contextualSuggestionChips(text = "") {
  const entity = detectEntity(text) || detectEntityFromFilters(text);
  const action = detectAction(text);
  const suggestions = [];

  if (entity === "invoice") {
    suggestions.push(
      makeSuggestion("Partial invoices", "invoice.filter", "partial invoices"),
      makeSuggestion("Paid invoices", "invoice.filter", "paid invoices"),
      makeSuggestion("Unpaid invoices", "invoice.filter", "unpaid invoices"),
      makeSuggestion("This week invoices", "invoice.filter", "this week invoices"),
      makeSuggestion("This month invoices", "invoice.filter", "this month invoices"),
      makeSuggestion("Direct sales invoices", "invoice.filter", "direct sales only")
    );
  } else if (entity === "product") {
    suggestions.push(
      makeSuggestion("Low stock products", "product.filter", "low stock products"),
      makeSuggestion("Out of stock products", "product.filter", "out of stock products"),
      makeSuggestion("In stock products", "product.filter", "in stock products"),
      makeSuggestion("Product category", "product.filter", "product category"),
      makeSuggestion("Newest products", "product.filter", "newest products"),
      makeSuggestion("Sort by price", "product.filter", "sort products by price")
    );
  } else if (entity === "repair") {
    suggestions.push(
      makeSuggestion("Device received repairs", "repair.filter", "device received repairs"),
      makeSuggestion("Diagnosis completed", "repair.filter", "diagnosis completed"),
      makeSuggestion("Repair in progress", "repair.filter", "repair in progress"),
      makeSuggestion("Quality testing", "repair.filter", "quality testing"),
      makeSuggestion("Ready for pickup", "repair.filter", "ready for pickup"),
      makeSuggestion("Delivered repairs", "repair.filter", "delivered repairs")
    );
  } else if (entity === "customer") {
    suggestions.push(
      makeSuggestion("Customers with balance", "customer.filter", "customers with balance"),
      makeSuggestion("Paid customers", "customer.filter", "paid customers"),
      makeSuggestion("Oldest customers", "customer.filter", "oldest customers"),
      makeSuggestion("Newest customers", "customer.filter", "newest customers"),
      makeSuggestion("Search by phone", "customer.search", "search customer phone"),
      makeSuggestion("Search by name", "customer.search", "search customer name")
    );
  } else if (entity === "report") {
    suggestions.push(
      makeSuggestion("Today report", "report.today", "today report"),
      makeSuggestion("Weekly report", "report.weekly", "weekly report"),
      makeSuggestion("Monthly report", "report.monthly", "monthly report"),
      makeSuggestion("Yearly report", "report.yearly", "yearly report"),
      makeSuggestion("Products report", "report.products", "products report"),
      makeSuggestion("Invoices report", "report.invoices", "invoices report")
    );
  } else if (entity === "expense") {
    suggestions.push(
      makeSuggestion("Today expenses", "expense.filter", "today expenses"),
      makeSuggestion("This month expenses", "expense.filter", "this month expenses"),
      makeSuggestion("All expenses", "expense.filter", "all expenses"),
      makeSuggestion("Deleted expenses", "expense.filter", "deleted expenses")
    );
  } else if (entity === "setting" || action === "change") {
    suggestions.push(
      makeSuggestion("Change dark mode", "settings.theme", "change dark mode"),
      makeSuggestion("Change shop name", "settings.shop", "change shop name"),
      makeSuggestion("Change password", "settings.password", "change password"),
      makeSuggestion("Change my phone", "settings.phone", "change my phone"),
      makeSuggestion("Change my email", "settings.email", "change my email")
    );
  } else {
    suggestions.push(
      makeSuggestion("Add customer", "customer.add", "add customer"),
      makeSuggestion("Search invoice", "invoice.search", "search invoice"),
      makeSuggestion("Low stock products", "product.filter", "low stock products"),
      makeSuggestion("Today report", "report.today", "today report"),
      makeSuggestion("Edit repair", "repair.edit", "edit repair"),
      makeSuggestion("Open settings", "settings.open", "open settings")
    );
  }

  return normalizeSuggestionList(suggestions.slice(0, 6));
}

function getStoredReaction(message = "") {
  const key = String(message || "").trim();
  if (!key) return "";
  const map = loadJSON(STORAGE.feedbackState, {});
  return map?.[key] || "";
}

function setStoredReaction(message = "", reaction = "") {
  const key = String(message || "").trim();
  if (!key) return;
  const map = loadJSON(STORAGE.feedbackState, {});
  if (reaction) map[key] = reaction;
  else delete map[key];
  saveJSON(STORAGE.feedbackState, map);
}

function updateReactionButtons(node, reaction = "") {
  if (!node) return;
  const likeBtn = node.querySelector('[data-assistant-message-action="like"]');
  const dislikeBtn = node.querySelector('[data-assistant-message-action="dislike"]');
  const likeIcon = likeBtn?.querySelector("i");
  const dislikeIcon = dislikeBtn?.querySelector("i");

  if (likeBtn) {
    const active = reaction === "like";
    likeBtn.classList.toggle("is-active", active);
    likeBtn.setAttribute("aria-pressed", active ? "true" : "false");
    if (likeIcon) likeIcon.className = `bi ${active ? "bi-hand-thumbs-up-fill" : "bi-hand-thumbs-up"}`;
  }
  if (dislikeBtn) {
    const active = reaction === "dislike";
    dislikeBtn.classList.toggle("is-active", active);
    dislikeBtn.setAttribute("aria-pressed", active ? "true" : "false");
    if (dislikeIcon) dislikeIcon.className = `bi ${active ? "bi-hand-thumbs-down-fill" : "bi-hand-thumbs-down"}`;
  }
}

function setMessageReaction(node, reaction, messageText) {
  const current = node?.dataset?.reaction || "";
  const next = current === reaction ? "" : reaction;
  if (node) node.dataset.reaction = next;
  updateReactionButtons(node, next);
  setStoredReaction(messageText, next);
  if (next) recordAssistantFeedback(messageText, next);
}

function openProfileEditor(rawText = "") {
  const target = normalizeInput(rawText);
  const selectors = [
    "#profileMenuBtn",
    "#profileBtn",
    "#userMenuBtn",
    "#moreMenuBtn",
    "[data-bs-target*='profile']",
    "[data-target*='profile']",
    "[data-action='profile']",
    "[data-action='edit-profile']",
    "[aria-label*='profile']",
    "[title*='profile']",
    ".profile-menu-btn",
    ".profile-btn"
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      el.click();
      return true;
    }
  }

  if (clickByText(document, ["Profile", "Edit Profile", "My Profile", "Account", "Account Settings"])) return true;

  const profileMenu = document.querySelector(".dropdown-toggle, .btn-group .dropdown-toggle, [aria-label*='more'], [title*='more']");
  if (profileMenu) {
    profileMenu.click();
    setTimeout(() => {
      clickByText(document, ["Profile", "Edit Profile", "Account", "Password", "Settings"]);
    }, 180);
    return true;
  }

  return false;
}

function resolvePageCommand(entity, rawText = "", action = "", command = {}) {
  const text = String(rawText || "");
  const t = normalizeInput(text);
  const specificTarget = hasSpecificTarget(text, entity, action) && !isFilterOnlyCommand(text, entity);

  const resolved = {
    ...command,
    period: command.period || detectPeriod(text),
    status: command.status || detectStatusValue(text, entity),
    category: command.category || detectCategoryValue(text, entity),
    metric: command.metric || detectReportMetricValue(text),
    sort: command.sort || detectSortValue(text, entity),
    rows: command.rows || detectRowsValue(text),
    invoiceType: command.invoiceType || detectInvoiceTypeValue(text),
    stock: command.stock || detectProductStockValue(text),
    repairStatus: command.repairStatus || detectRepairStatusValue(text),
    customerBalance: command.customerBalance || detectCustomerBalanceValue(text),
    customerType: command.customerType || detectCustomerTypeValue(text),
    customerGender: command.customerGender || detectCustomerGenderValue(text),
    dateExact: command.dateExact || detectDateExactValue(text),
    profileIntent: command.profileIntent || detectProfileIntent(text),
    searchText: command.searchText || (command.pageOnly ? "" : extractSearchTarget(text, entity, action))
  };

  if (!specificTarget) {
    if (entity === "invoice" && (resolved.status || resolved.period || resolved.invoiceType || resolved.sort || resolved.rows)) resolved.searchText = "";
    if (entity === "product" && (resolved.stock || resolved.category || resolved.sort)) resolved.searchText = "";
    if (entity === "report" && (resolved.period || resolved.category || resolved.metric)) resolved.searchText = "";
    if (entity === "repair" && (resolved.status || resolved.period || resolved.repairStatus || resolved.sort || resolved.dateExact)) resolved.searchText = "";
    if (entity === "customer" && (resolved.customerBalance || resolved.customerType || resolved.customerGender || resolved.sort)) resolved.searchText = "";
    if (entity === "expense" && (resolved.period || resolved.sort)) resolved.searchText = "";
  }

  if (entity === "product" && !resolved.stock && includesAny(t, ["out of stock", "low stock", "in stock", "all stock"])) {
    resolved.stock = detectProductStockValue(t);
  }
  if (entity === "invoice" && !resolved.status && includesAny(t, ["partial", "paid", "unpaid"])) {
    resolved.status = detectStatusValue(t, "invoice");
  }

  const hasDirectTarget = /\b\d{3,}\b/.test(t) || /\+?\d[\d\s-]{5,}\d/.test(text) || includesAny(t, ["name ", "number ", "id ", "phone ", "whatsapp ", "code "]);
  if (!hasDirectTarget) {
    if (entity === "product" && (resolved.stock || resolved.category || resolved.sort)) resolved.searchText = "";
    if (entity === "invoice" && (resolved.status || resolved.period || resolved.invoiceType || resolved.sort || resolved.rows)) resolved.searchText = "";
    if (entity === "repair" && (resolved.status || resolved.period || resolved.repairStatus || resolved.sort || resolved.dateExact)) resolved.searchText = "";
    if (entity === "customer" && (resolved.customerBalance || resolved.customerType || resolved.customerGender || resolved.sort)) resolved.searchText = "";
    if (entity === "report" && (resolved.period || resolved.category || resolved.metric)) resolved.searchText = "";
    if (entity === "expense" && (resolved.period || resolved.sort)) resolved.searchText = "";
  }

  return resolved;
}

function copyAssistantText(text) {
  const value = String(text || "").trim();
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).catch(() => void 0);
  } else {
    const temp = document.createElement("textarea");
    temp.value = value;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }
}

function loadPinnedMessages() {
  return loadJSON(STORAGE.pinnedMessages, []);
}

function savePinnedMessages(list) {
  saveJSON(STORAGE.pinnedMessages, Array.isArray(list) ? list.slice(0, 100) : []);
}

function isPinnedMessage(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return loadPinnedMessages().some((item) => String(item || "").trim() === value);
}

function togglePinnedMessage(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  const list = loadPinnedMessages();
  const index = list.findIndex((item) => String(item || "").trim() === value);
  const pinned = index >= 0;
  if (pinned) list.splice(index, 1);
  else list.unshift(value);
  savePinnedMessages(list);
  return !pinned;
}

function isSavedShortcut(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return toArray(loadJSON(STORAGE.shortcuts, [])).some((item) => {
    const label = typeof item === "string" ? item : item?.label ?? item?.text ?? "";
    return String(label || "").trim() === value;
  });
}

function saveShortcutFromText(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  const store = toArray(loadJSON(STORAGE.shortcuts, []));
  const exists = store.some((item) => {
    const label = typeof item === "string" ? item : item?.label ?? item?.text ?? "";
    return String(label || "").trim() === value;
  });
  if (exists) return false;

  store.unshift({
    label: value,
    text: value,
    source: "assistant",
    createdAt: Date.now()
  });
  saveJSON(STORAGE.shortcuts, store.slice(0, 50));
  state.shortcuts = store.slice(0, 50);
  return true;
}

function repeatLastUserCommand() {
  for (let i = state.history.length - 1; i >= 0; i -= 1) {
    const entry = state.history[i];
    if (entry?.role === "user" && String(entry?.text || "").trim()) {
      handleCommand(entry.text, { repeated: true }).catch(() => void 0);
      return true;
    }
  }
  return false;
}

function updateToggleButton(node, action, active, activeIcon, inactiveIcon) {
  if (!node) return;
  const btn = node.querySelector(`[data-assistant-message-action="${action}"]`);
  const icon = btn?.querySelector("i");
  if (!btn) return;
  btn.classList.toggle("is-active", Boolean(active));
  btn.setAttribute("aria-pressed", active ? "true" : "false");
  if (icon) icon.className = `bi ${active ? activeIcon : inactiveIcon}`;
}

function recordAssistantFeedback(message, feedback) {
  const store = loadJSON(STORAGE.feedback, []);
  store.unshift({
    feedback,
    text: String(message || ""),
    at: Date.now()
  });
  saveJSON(STORAGE.feedback, store.slice(0, 50));
  setStoredReaction(message, feedback);
}

function buildMessageActions(text) {
  return `
    <div class="assistant-message-actions">
      <button type="button" class="assistant-message-action copy" data-assistant-message-action="copy" title="Copy" aria-pressed="false"><i class="bi bi-clipboard"></i></button>
      <button type="button" class="assistant-message-action repeat" data-assistant-message-action="repeat" title="Repeat response" aria-pressed="false"><i class="bi bi-arrow-repeat"></i></button>
      <button type="button" class="assistant-message-action like" data-assistant-message-action="like" title="Like" aria-pressed="false"><i class="bi bi-hand-thumbs-up"></i></button>
      <button type="button" class="assistant-message-action dislike" data-assistant-message-action="dislike" title="Dislike" aria-pressed="false"><i class="bi bi-hand-thumbs-down"></i></button>
      <button type="button" class="assistant-message-action pin" data-assistant-message-action="pin" title="Pin message" aria-pressed="false"><i class="bi bi-pin-angle"></i></button>
      <button type="button" class="assistant-message-action save" data-assistant-message-action="save" title="Save shortcut" aria-pressed="false"><i class="bi bi-bookmark-plus"></i></button>
    </div>
  `;
}

function normalizeInput(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\w\s@$%#.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scrollMessagesToBottom(smooth = false) {
  if (!ui?.messages) return;
  const behavior = smooth ? "smooth" : "auto";
  try {
    ui.messages.scrollTo({ top: ui.messages.scrollHeight, behavior });
  } catch {
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }
}

function firstNonEmptyMatch(text, patterns) {
  const source = String(text || "");
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1] || match?.[0]) return (match[1] || match[0]).trim();
  }
  return "";
}

function stripCommandLead(rawText = "") {
  const clean = String(rawText || "").trim();
  return clean
    .replace(/^\s*(please|pls|kindly|just|now)\s+/i, "")
    .replace(/^\s*(search|find|look up|lookup|show|open|view|check|print|export|add|edit|update|change|delete|remove|restore|sell|filter)\s+/i, "")
    .replace(/^\s*(this|that|the|a|an|my|your|our)\s+/i, "")
    .trim();
}

function stripSearchTargetPrefix(value = "") {
  return String(value || "")
    .trim()
    .replace(/^(?:name|number|no\.?|id|phone|whatsapp|code|invoice|invoice number|invoice id|repair|repair id|product|product id|customer|customer id|expense|expense id)\s*[:\-]?\s*/i, "")
    .replace(/^(?:for|of|the|this|that|from|in|on)\s+/i, "")
    .trim();
}

function flashIconButton(button, iconClass, resetAfter = 1000, activeClass = "", preserveState = false) {
  if (!button) return;
  const icon = button.querySelector("i");

  if (!preserveState && icon && !icon.dataset.originalClass) {
    icon.dataset.originalClass = icon.className;
  }

  if (activeClass) button.classList.add(...String(activeClass).split(/\s+/).filter(Boolean));
  button.classList.add("is-active");
  if (iconClass && icon) icon.className = `bi ${iconClass}`;

  window.clearTimeout(button._waasugeFlashTimer);
  if (resetAfter > 0) {
    button._waasugeFlashTimer = window.setTimeout(() => {
      button.classList.remove("is-pulsed", "is-copy-success");
      if (!preserveState) {
        button.classList.remove("is-active");
        if (activeClass) {
          String(activeClass).split(/\s+/).filter(Boolean).forEach((cls) => button.classList.remove(cls));
        }
        if (icon && icon.dataset.originalClass) {
          icon.className = icon.dataset.originalClass;
          delete icon.dataset.originalClass;
        }
      }
    }, resetAfter);
  }
}

function getPinnedMessageItems() {
  return loadPinnedMessages()
    .map((text) => ({ text: String(text || "").trim(), kind: "pin" }))
    .filter((item) => item.text);
}

function getSavedShortcutItems() {
  return toArray(loadJSON(STORAGE.shortcuts, []))
    .map((item) => {
      if (typeof item === "string") return { label: item, text: item, intent: "", kind: "save" };
      return {
        label: String(item?.label ?? item?.text ?? "").trim(),
        text: String(item?.text ?? item?.label ?? "").trim(),
        intent: String(item?.intent ?? "").trim(),
        kind: "save"
      };
    })
    .filter((item) => item.text || item.label);
}

function renderCollectionsDrawer(kind = "pins") {
  if (!ui?.collectionsBody || !ui?.collectionsTitle || !ui?.collectionsMeta) return;
  const isPins = kind === "pins";
  const items = isPins ? getPinnedMessageItems() : getSavedShortcutItems();
  ui.collectionsTitle.textContent = isPins ? "Pinned conversations" : "Saved shortcuts";
  ui.collectionsMeta.textContent = isPins ? "Saved locally on this device." : "Saved shortcuts from assistant replies.";
  ui.collectionsBody.innerHTML = "";

  if (!items.length) {
    ui.collectionsBody.innerHTML = `<div class="waasuge-assistant-collections-empty">No ${isPins ? "pinned conversations" : "saved shortcuts"} yet.</div>`;
    return;
  }

  items.forEach((item, index) => {
    const text = item.label || item.text || "";
    const row = createEl("div", { className: "waasuge-assistant-collections-item" });
    row.innerHTML = `
      <button type="button" class="waasuge-assistant-collections-main" title="${escapeHtml(text)}">
        <span class="waasuge-assistant-collections-index">${index + 1}</span>
        <span class="waasuge-assistant-collections-text">${escapeHtml(shortLabel(text, 72))}</span>
      </button>
      <div class="waasuge-assistant-collections-item-actions">
        <button type="button" class="waasuge-assistant-icon-btn waasuge-assistant-collections-copy" title="Copy"><i class="bi bi-clipboard"></i></button>
        <button type="button" class="waasuge-assistant-icon-btn waasuge-assistant-collections-open" title="${isPins ? "Load into input" : "Use shortcut"}"><i class="bi bi-arrow-return-right"></i></button>
        ${isPins ? `<button type="button" class="waasuge-assistant-icon-btn waasuge-assistant-collections-remove" title="Unpin"><i class="bi bi-pin-angle-fill"></i></button>` : `<button type="button" class="waasuge-assistant-icon-btn waasuge-assistant-collections-remove" title="Remove"><i class="bi bi-x-lg"></i></button>`}
      </div>
    `;
    const copyBtn = row.querySelector(".waasuge-assistant-collections-copy");
    const openBtn = row.querySelector(".waasuge-assistant-collections-open");
    const removeBtn = row.querySelector(".waasuge-assistant-collections-remove");
    row.querySelector(".waasuge-assistant-collections-main")?.addEventListener("click", () => {
      setInputValue("#waasugeAssistantInput", item.text);
      focusInput("#waasugeAssistantInput");
    });
    copyBtn?.addEventListener("click", () => {
      copyAssistantText(item.text);
      showToast?.("Copied", "success", ASSISTANT_NAME);
      flashIconButton(copyBtn, "check2", 900, "is-pulsed");
    });
    openBtn?.addEventListener("click", () => {
      if (isPins) {
        setInputValue("#waasugeAssistantInput", item.text);
        focusInput("#waasugeAssistantInput");
        showToast?.("Loaded into input", "info", ASSISTANT_NAME);
      } else {
        handleCommand(item.label || item.text, { fromChip: true, forcedIntent: item.intent || "" });
        closeCollectionsDrawer();
      }
    });
    removeBtn?.addEventListener("click", () => {
      if (isPins) {
        savePinnedMessages(loadPinnedMessages().filter((value) => String(value || "").trim() !== item.text));
        renderCollectionsDrawer("pins");
        showToast?.("Unpinned", "info", ASSISTANT_NAME);
      } else {
        const filtered = getSavedShortcutItems().filter((value) => String(value.text || value.label || "").trim() !== item.text);
        const next = filtered.map((value) => ({
          label: value.label || value.text,
          text: value.text || value.label,
          intent: value.intent || "",
          source: "assistant",
          createdAt: Date.now()
        }));
        saveJSON(STORAGE.shortcuts, next);
        state.shortcuts = next;
        renderCollectionsDrawer("saved");
        showToast?.("Removed", "info", ASSISTANT_NAME);
      }
    });
    ui.collectionsBody.appendChild(row);
  });
}

function syncCollectionsToggleButtons(kind = "", active = false) {
  const pinsActive = active && kind === "pins";
  const savedActive = active && kind === "saved";

  if (ui?.collectionsPinsBtn) {
    ui.collectionsPinsBtn.classList.toggle("is-active", pinsActive);
    const icon = ui.collectionsPinsBtn.querySelector("i");
    if (icon) icon.className = `bi ${pinsActive ? "bi-pin-angle-fill" : "bi-pin-angle"}`;
  }

  if (ui?.collectionsSavedBtn) {
    ui.collectionsSavedBtn.classList.toggle("is-active", savedActive);
    const icon = ui.collectionsSavedBtn.querySelector("i");
    if (icon) icon.className = `bi ${savedActive ? "bi-bookmark-plus-fill" : "bi-bookmark-plus"}`;
  }
}

function openCollectionsDrawer(kind = "pins") {
  if (!ui?.collectionsDrawer) return;
  state.collectionsKind = kind;
  ui.collectionsDrawer.hidden = false;
  ui.collectionsDrawer.classList.add("is-open");
  syncCollectionsToggleButtons(kind, true);
  renderCollectionsDrawer(kind);
}

function closeCollectionsDrawer() {
  if (!ui?.collectionsDrawer) return;
  ui.collectionsDrawer.classList.remove("is-open");
  ui.collectionsDrawer.hidden = true;
  syncCollectionsToggleButtons(state.collectionsKind, false);
}

function toggleCollectionsDrawer(kind = "pins") {
  if (!ui?.collectionsDrawer) return;
  if (!ui.collectionsDrawer.hidden && state.collectionsKind === kind) {
    closeCollectionsDrawer();
    return;
  }
  openCollectionsDrawer(kind);
}

function scrollCollectionsDrawer(direction = "up") {
  if (!ui?.collectionsBody) return;
  const delta = Math.max(120, ui.collectionsBody.clientHeight * 0.75);
  ui.collectionsBody.scrollBy({ top: direction === "up" ? -delta : delta, behavior: "smooth" });
}

function includesAny(text, list) {
  return list.some((item) => text.includes(item));
}

function startsWithAny(text, list) {
  return list.some((item) => text.startsWith(item));
}

function setBusy(value) {
  state.busy = Boolean(value);
  if (!ui) return;
  ui.sendBtn.disabled = state.busy;
  ui.input.disabled = state.busy;
  ui.fab.classList.toggle("is-busy", state.busy);
}

function getCurrentPageFile() {
  return (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
}

function setLastPage() {
  localStorage.setItem(STORAGE.lastPage, getCurrentPageFile());
}

function preferredLanguageFromText(text) {
  const t = normalizeInput(text);
  if (includesAny(t, ["maanta", "macmiil", "dayactir", "alaab", "warbixin", "dejin", "lacag", "rasiid", "saaxiib"])) {
    return "so";
  }
  if (includesAny(t, ["customer", "repair", "product", "invoice", "report", "settings", "expense", "print", "export"])) {
    return "en";
  }
  return state.language || "auto";
}

function storeCommand(command) {
  const clean = String(command || "").trim();
  if (!clean) return;
  state.recent = [clean, ...state.recent.filter((item) => item !== clean)].slice(0, 25);
  saveJSON(STORAGE.recent, state.recent);
  state.history.push({
    role: "user",
    text: clean,
    at: Date.now()
  });
  saveJSON(STORAGE.history, state.history);
  localStorage.setItem(STORAGE.language, preferredLanguageFromText(clean));
}

function storeAssistantReply(text) {
  state.history.push({
    role: "assistant",
    text,
    at: Date.now()
  });
  saveJSON(STORAGE.history, state.history);
}

function rememberSearchPhrase(text) {
  const clean = String(text || "").trim();
  if (!clean) return;
  state.searches = [clean, ...state.searches.filter((item) => item !== clean)].slice(0, 20);
  saveJSON(STORAGE.searches, state.searches);
}

function rememberFavorite(intent) {
  if (!intent) return;
  state.favorites = [intent, ...state.favorites.filter((item) => item !== intent)].slice(0, 20);
  saveJSON(STORAGE.favorites, state.favorites);
}

function createEl(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, String(value));
  });
  const items = Array.isArray(children) ? children : [children];
  items.filter(Boolean).forEach((child) => node.appendChild(child));
  return node;
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = String(html || "");
  return temp.textContent || temp.innerText || "";
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch] || ch));
}

function iconForIntent(intent) {
  if (!intent) return "bi-stars";
  if (intent.startsWith("customer")) return "bi-people";
  if (intent.startsWith("repair")) return "bi-tools";
  if (intent.startsWith("product")) return "bi-box-seam";
  if (intent.startsWith("invoice")) return "bi-receipt-cutoff";
  if (intent.startsWith("expense")) return "bi-cash-coin";
  if (intent.startsWith("report")) return "bi-bar-chart-line";
  if (intent.startsWith("settings")) return "bi-gear";
  return "bi-stars";
}

function shortLabel(label = "") {
  return String(label).replace(/^(Add|Edit|Delete|Restore|Search|Show|Print|Export|Change|Update)\s+/i, "");
}

function actionSuggestionsFor(intent) {
  const map = {
    "customer.add": ["Add new customer", "Search customer by phone", "Show customer balance", "Open Customers"],
    "customer.edit": ["Edit customer name", "Change customer phone", "Update WhatsApp", "Open Customers"],
    "customer.delete": ["Delete customer", "Restore customer", "Open recycle bin", "Open Customers"],
    "customer.restore": ["Restore customer", "Search deleted customers", "Open recycle bin", "Open Customers"],
    "customer.search": ["Search by name", "Search by number", "Search by WhatsApp", "Open Customers"],
    "repair.add": ["Add new repair", "Show today repairs", "Open Repairs", "Print repair receipt"],
    "repair.edit": ["Edit repair status", "Update progress", "Change payment", "Open Repairs"],
    "repair.delete": ["Delete repair", "Restore repair", "Open trash", "Open Repairs"],
    "repair.restore": ["Restore repair", "Open trash", "Search repair by number", "Open Repairs"],
    "repair.search": ["Search repair by number", "Filter by status", "Filter by date", "Open Repairs"],
    "product.add": ["Add new product", "Restock item", "Search product", "Open Products"],
    "product.edit": ["Edit product price", "Edit stock", "Edit product notes", "Open Products"],
    "product.delete": ["Delete product", "Restore product", "Open trash", "Open Products"],
    "product.restore": ["Restore product", "Search deleted product", "Open trash", "Open Products"],
    "product.search": ["Search product", "Add to cart", "Sell product", "Low stock products"],
    "product.sell": ["Add to cart", "Sell to walk-in customer", "Ask for paid amount", "Print receipt"],
    "invoice.add": ["Add new invoice", "New invoice", "Open invoice form", "Search invoice"],
    "invoice.edit": ["Edit invoice", "Change payment", "Print invoice", "Open invoices"],
    "invoice.delete": ["Delete invoice", "Restore invoice", "Open trash", "Open invoices"],
    "invoice.restore": ["Restore invoice", "Search deleted invoices", "Open trash", "Open invoices"],
    "invoice.search": ["Search invoice", "Show unpaid invoices", "Show paid invoices", "Open invoices"],
    "expense.add": ["Add new expense", "Open expense form", "Show total expenses", "Open Expenses"],
    "expense.edit": ["Edit expense", "Delete expense", "Restore expense", "Open Expenses"],
    "expense.delete": ["Delete expense", "Restore expense", "Open trash", "Open Expenses"],
    "expense.restore": ["Restore expense", "Search deleted expenses", "Open trash", "Open Expenses"],
    "expense.search": ["Search expense", "Filter by type", "Show total expenses", "Open Expenses"],
    "report.today": ["Today report", "Daily report", "Weekly report", "Monthly report"],
    "report.weekly": ["Weekly report", "Monthly report", "Yearly report", "Print report"],
    "report.monthly": ["Monthly report", "Today report", "Export PDF", "Export CSV"],
    "report.export.pdf": ["Export report PDF", "Print report", "Export CSV", "Open Reports"],
    "report.export.csv": ["Export report CSV", "Export PDF", "Print report", "Open Reports"],
    "report.print": ["Print report", "Export PDF", "Export CSV", "Open Reports"],
    "settings.theme": ["Change dark mode", "Change language", "Update shop name", "Open Settings"],
    "settings.open": ["Change shop name", "Change phone", "Change WhatsApp", "Open Settings"]
  };
  return map[intent] || ["Open Dashboard", "Open Customers", "Open Repairs", "Open Reports"];
}

function renderQuickActionButtons(container, items, intent = "") {
  if (!container) return;
  container.innerHTML = "";
  normalizeSuggestionList(items, intent).forEach((item) => {
    const text = String(item.label || item.text || item.commandText || "").trim();
    if (!text) return;
    const commandText = String(item.commandText || item.text || item.label || text).trim();
    const button = createEl("button", {
      type: "button",
      className: "assistant-chip",
      title: text,
      "data-intent": item.intent || "",
      "data-command-text": commandText,
      text: shortLabel(text)
    });
    button.addEventListener("click", () => {
      handleCommand(commandText || text, { fromChip: true, forcedIntent: item.intent || intent || "", chipText: text });
    });
    container.appendChild(button);
  });
  if (intent) {
    normalizeSuggestionList(actionSuggestionsFor(intent).slice(0, 4).map((label) => ({ label, intent })), intent).forEach((item) => {
      const button = createEl("button", {
        type: "button",
        className: "assistant-chip assistant-chip-soft",
        title: item.label,
        "data-command-text": item.commandText || item.label,
        text: shortLabel(item.label)
      });
      button.addEventListener("click", () => handleCommand(item.commandText || item.label, { fromChip: true, forcedIntent: item.intent || intent, chipText: item.label }));
      container.appendChild(button);
    });
  }
}

function getPendingAction() {
  return loadJSON(STORAGE.pending, null);
}

function clearPendingAction() {
  state.pending = null;
  localStorage.removeItem(STORAGE.pending);
}

function setPendingAction(payload) {
  state.pending = payload;
  saveJSON(STORAGE.pending, payload);
}

function showTypingIndicator() {
  if (!ui?.messages) return null;
  const bubble = createEl("div", {
    className: "assistant-message assistant-message-bot assistant-typing-wrap",
    html: `
      <div class="assistant-avatar"><i class="bi bi-stars"></i></div>
      <div class="assistant-bubble assistant-typing">
        <span></span><span></span><span></span>
      </div>
    `
  });
  ui.messages.appendChild(bubble);
  scrollMessagesToBottom(false);
  return bubble;
}

function addMessage(role, text, meta = {}) {
  if (!ui?.messages) return;
  const isAssistant = role !== "user";
  const at = Number(meta.at || Date.now());
  const node = createEl("div", {
    className: `assistant-message assistant-message-${role}`,
    html: `
      <div class="assistant-avatar"><i class="bi ${role === "user" ? "bi-person" : iconForIntent(meta.intent)}"></i></div>
      <div class="assistant-bubble">
        <div class="assistant-text">${escapeHtml(text)}</div>
        <div class="assistant-message-time">${escapeHtml(formatConversationTime(at))}</div>
        ${meta.chips?.length ? `<div class="assistant-chip-row"></div>` : ""}
        ${isAssistant ? buildMessageActions(text) : ""}
      </div>
    `
  });
  node.dataset.at = String(at);
  ui.messages.appendChild(node);
  const chipRow = node.querySelector(".assistant-chip-row");
  if (chipRow && meta.chips?.length) {
    renderQuickActionButtons(chipRow, meta.chips, meta.intent || "");
  }
  const messageText = node.querySelector(".assistant-text")?.textContent || text;
  const storedReaction = getStoredReaction(messageText);
  node.dataset.reaction = storedReaction || "";
  updateReactionButtons(node, storedReaction);
  updateToggleButton(node, "pin", isPinnedMessage(messageText), "bi-pin-angle-fill", "bi-pin-angle");
  updateToggleButton(node, "save", isSavedShortcut(messageText), "bi-bookmark-plus-fill", "bi-bookmark-plus");

  node.querySelectorAll("[data-assistant-message-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-assistant-message-action");
      const currentText = node.querySelector(".assistant-text")?.textContent || messageText;

      if (action === "copy") {
        copyAssistantText(currentText);
        showToast?.("Copied", "success", ASSISTANT_NAME);
        flashIconButton(button, "check2", 1000, "is-copy-success");
      }

      if (action === "repeat") {
        repeatLastUserCommand();
        showToast?.("Repeated last command", "info", ASSISTANT_NAME);
        flashIconButton(button, "arrow-repeat", 900, "is-pulsed");
      }

      if (action === "like") {
        setMessageReaction(node, "like", currentText);
        showToast?.("Thanks for the feedback", "success", ASSISTANT_NAME);
      }

      if (action === "dislike") {
        setMessageReaction(node, "dislike", currentText);
        showToast?.("Feedback saved", "info", ASSISTANT_NAME);
      }

      if (action === "pin") {
        const pinned = togglePinnedMessage(currentText);
        updateToggleButton(node, "pin", pinned, "bi-pin-angle-fill", "bi-pin-angle");
        showToast?.(pinned ? "Pinned" : "Unpinned", "info", ASSISTANT_NAME);
        flashIconButton(button, pinned ? "pin-angle-fill" : "pin-angle", 1000, "is-pulsed", true);
        if (ui?.collectionsDrawer && !ui.collectionsDrawer.hidden && state.collectionsKind === "pins") renderCollectionsDrawer("pins");
      }

      if (action === "save") {
        const saved = saveShortcutFromText(currentText);
        updateToggleButton(node, "save", saved, "bi-bookmark-plus-fill", "bi-bookmark-plus");
        showToast?.(saved ? "Saved shortcut" : "Already saved", "success", ASSISTANT_NAME);
        flashIconButton(button, saved ? "bookmark-plus-fill" : "bookmark-plus", 1000, "is-pulsed", true);
        if (ui?.collectionsDrawer && !ui.collectionsDrawer.hidden && state.collectionsKind === "saved") renderCollectionsDrawer("saved");
      }
    });
  });
  scrollMessagesToBottom(false);
  return node;
}

function updateHeaderDot() {
  if (!ui?.badge) return;
  const count = state.history.length;
  ui.badge.textContent = count > 0 ? String(Math.min(count, 99)) : "";
  ui.badge.style.display = count > 0 ? "inline-flex" : "none";
}

function persistAndRenderHistory() {
  saveJSON(STORAGE.history, state.history);
  updateHeaderDot();
  maybeWarnConversationLimit();
}

function getLanguagePrefix() {
  const lang = localStorage.getItem(STORAGE.language) || "auto";
  if (lang === "so") return "Somali-English";
  if (lang === "en") return "English";
  return "Somali / English";
}

function greetingText() {
  const name = getAssistantDisplayName();
  return `Hi ${name}! I’m ready. Type a command or ask a question in ${getLanguagePrefix()}.`;
}


function buildClarification(text, suggestions = []) {
  const lower = normalizeInput(text);
  const entity = detectEntity(text);
  const action = detectAction(text);

  const general = {
    add: { question: "What should I add?", suggestions: ["Add new customer", "Add new repair", "Add new product", "Add new invoice", "Add new expense"] },
    edit: { question: "What should I edit?", suggestions: ["Edit customer", "Edit repair", "Edit product", "Edit invoice", "Edit expense"] },
    delete: { question: "What should I delete?", suggestions: ["Delete customer", "Delete repair", "Delete product", "Delete invoice", "Delete expense"] },
    restore: { question: "What should I restore?", suggestions: ["Restore customer", "Restore repair", "Restore product", "Restore invoice", "Restore expense"] },
    search: { question: "What should I search?", suggestions: ["Search customer", "Search repair", "Search product", "Search invoice", "Search expense"] },
    print: { question: "What should I print?", suggestions: ["Print receipt", "Print report", "Print invoice", "Print customer profile"] },
    export: { question: "Which format do you want?", suggestions: ["Export PDF", "Export CSV", "Export Excel"] },
    report: { question: "Which report period do you want?", suggestions: ["Today report", "Weekly report", "Monthly report", "Yearly report"] },
    today: { question: "Do you mean today report, today sales, or today expenses?", suggestions: ["Today report", "Today sales", "Today expenses"] },
    settings: { question: "Which setting do you want to change?", suggestions: ["Shop name", "Phone", "WhatsApp", "Dark mode", "Language", "Currency"] }
  };

  if (general[lower]) {
    return {
      question: general[lower].question,
      suggestions: normalizeSuggestionList(general[lower].suggestions)
    };
  }

  const smartSuggestions = suggestions?.length ? normalizeSuggestionList(suggestions) : contextualSuggestionChips(text);

  if (entity === "invoice") {
    return {
      question: "I think you are talking about invoices. Please clarify what you want to do.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Partial invoices",
        "Paid invoices",
        "Unpaid invoices",
        "This week invoices",
        "This month invoices",
        "Search invoice by number"
      ]
    )};
  }

  if (entity === "product") {
    return {
      question: "I think you are talking about products. Please clarify what you want to do.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Low stock products",
        "Out of stock products",
        "In stock products",
        "Product category",
        "Newest products",
        "Sort by price"
      ]
    )};
  }

  if (entity === "repair") {
    return {
      question: "I think you are talking about repairs. Please clarify what you want to do.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Device received repairs",
        "Diagnosis completed",
        "Repair in progress",
        "Quality testing",
        "Ready for pickup",
        "Delivered repairs"
      ]
    )};
  }

  if (entity === "customer") {
    return {
      question: "I think you are talking about customers. Please clarify what you want to do.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Customers with balance",
        "Paid customers",
        "Oldest customers",
        "Newest customers",
        "Search by phone",
        "Search by name"
      ]
    )};
  }

  if (entity === "report") {
    return {
      question: "I think you are talking about reports. Please clarify the period or category.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Today report",
        "Weekly report",
        "Monthly report",
        "Yearly report",
        "Products report",
        "Invoices report"
      ]
    )};
  }

  if (entity === "setting") {
    return {
      question: "I think you are talking about settings or profile. Please clarify.",
      suggestions: smartSuggestions.length ? smartSuggestions : normalizeSuggestionList([
        "Change dark mode",
        "Change password",
        "Change my number",
        "Change my email",
        "Change shop name",
        "Change language"
      ]
    )};
  }

  return {
    question: "I do not understand yet. Please clarify.",
    suggestions: normalizeSuggestionList(smartSuggestions.slice(0, 6))
  };
}


function detectEntity(text) {
  const t = normalizeInput(text);
  for (const [entity, hints] of Object.entries(ENTITY_HINTS)) {
    if (includesAny(t, hints)) return entity;
  }
  return null;
}

function detectEntityFromFilters(text = "") {
  const t = normalizeInput(text);
  if (!t) return null;

  if (detectProfileIntent(t)) return "setting";
  if (detectInvoiceTypeValue(t) || detectStatusValue(t, "invoice") || detectRowsValue(t) || includesAny(t, ["invoice only", "direct sale", "sales only", "partial invoices", "unpaid invoices", "paid invoices"])) return "invoice";
  if (detectProductStockValue(t) || detectSortValue(t, "product") || includesAny(t, ["low stock products", "out of stock products", "in stock products", "all stock products", "product category"])) return "product";
  if (detectRepairStatusValue(t) || detectDateExactValue(t) || detectSortValue(t, "repair")) return "repair";
  if (detectCustomerBalanceValue(t) || detectCustomerTypeValue(t) || detectCustomerGenderValue(t) || detectSortValue(t, "customer")) return "customer";
  if (detectReportMetricValue(t) || detectPeriod(t) || includesAny(t, ["report", "reports", "summary", "print report", "export report"])) return "report";
  if (detectSortValue(t, "expense") || includesAny(t, ["expense", "expenses", "kharash", "cost", "today expenses"])) return "expense";

  return null;
}

function detectAction(text) {
  const t = normalizeInput(text);
  if (includesAny(t, ["add", "new", "create", "insert", "plus", "ongeza", "ku dar"])) return "add";
  if (includesAny(t, ["edit", "update", "change", "rename", "bedel", "modify"])) return "edit";
  if (includesAny(t, ["delete", "remove", "trash", "xir", "tirtir", "erase"])) return "delete";
  if (includesAny(t, ["restore", "undelete", "recover", "so celi", "back"])) return "restore";
  if (includesAny(t, ["search", "find", "lookup", "hel", "raadi"])) return "search";
  if (includesAny(t, ["print", "daabac"])) return "print";
  if (includesAny(t, ["export", "download", "dhoofin"])) return "export";
  if (includesAny(t, ["sell", "sale", "checkout", "kala iibi"])) return "sell";
  if (includesAny(t, ["restock", "stock", "fill"])) return "restock";
  if (includesAny(t, ["filter", "status", "paid", "unpaid", "partial", "delivered", "pending", "ready"])) return "filter";
  return null;
}



function detectPeriod(text = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["today", "now", "current day", "todays", "maanta", "today's"])) return "today";
  if (includesAny(t, ["yesterday", "shalay"])) return "yesterday";
  if (includesAny(t, ["this week", "current week", "weekly", "week this"])) return "week";
  if (includesAny(t, ["last week", "past week", "previous week"])) return "last-week";
  if (includesAny(t, ["this month", "current month", "monthly", "month this"])) return "month";
  if (includesAny(t, ["last month", "past month", "previous month"])) return "last-month";
  if (includesAny(t, ["this year", "current year", "yearly", "year this"])) return "year";
  if (includesAny(t, ["last year", "past year", "previous year"])) return "last-year";
  if (includesAny(t, ["date range", "between dates", "from", "to"])) return "range";
  return "";
}

function detectStatusValue(text = "", entity = "") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (includesAny(t, ["partially paid", "partial", "partly paid", "part payment"])) return "partial";
  if (includesAny(t, ["unpaid", "not paid", "due", "balance"])) return "unpaid";
  if (includesAny(t, ["paid", "settled", "complete payment"])) return "paid";

  if (entity === "repair") {
    if (includesAny(t, ["pending", "waiting", "wait"])) return "pending";
    if (includesAny(t, ["progress", "in progress", "working"])) return "in-progress";
    if (includesAny(t, ["ready", "complete", "completed", "done"])) return "ready";
    if (includesAny(t, ["delivered", "received"])) return "delivered";
  }

  if (entity === "product") {
    if (includesAny(t, ["low stock", "important", "alert", "warning"])) return "low";
    if (includesAny(t, ["out of stock", "no stock", "empty"])) return "out";
  }

  return "";
}

function detectCategoryValue(text = "", entity = "report") {
  const t = normalizeInput(text);
  if (!t) return "";

  if (entity === "product") {
    if (includesAny(t, ["category", "categories", "product category", "by category"])) return "products";
    return "";
  }

  if (includesAny(t, ["product report", "products report", "product list", "inventory", "items"])) return "products";
  if (includesAny(t, ["repair report", "repairs report", "service report"])) return "repairs";
  if (includesAny(t, ["invoice report", "invoices report", "bill report", "rasiid"])) return "invoices";
  if (includesAny(t, ["expense report", "expenses report", "cost report"])) return "expenses";
  if (includesAny(t, ["customer report", "customers report", "client report"])) return "customers";
  if (includesAny(t, ["profit"])) return "profit";
  if (includesAny(t, ["revenue", "sales", "income"])) return "revenue";
  if (includesAny(t, ["important", "alert", "low stock", "out of stock"])) return "important";

  if (includesAny(t, ["product", "products", "alaab", "inventory", "stock", "items"])) return "products";
  if (includesAny(t, ["repair", "repairs", "dayactir", "service"])) return "repairs";
  if (includesAny(t, ["invoice", "invoices", "bill", "rasiid", "receipt"])) return "invoices";
  if (includesAny(t, ["expense", "expenses", "kharash", "cost"])) return "expenses";
  if (includesAny(t, ["customer", "customers", "macmiil", "client"])) return "customers";

  return entity === "report" ? "" : entity;
}

function extractSearchTarget(text = "", entity = "", action = "") {
  const original = String(text || "").trim();
  if (!original) return "";

  const normalized = normalizeInput(original);

  const phoneMatch = original.match(/(?:\+?\d[\d\s-]{5,}\d)/);
  if (phoneMatch) return phoneMatch[0].replace(/[^\d+]/g, "");

  const idMatch = normalized.match(/\b(?:id|invoice id|repair id|customer id|product id|expense id|number|no\.?|#)\s*([a-z0-9-]{2,})\b/i);
  if (idMatch?.[1]) return idMatch[1];

  const fieldLead = /(?:search|find|look up|lookup|show|open|view|check|print|export|edit|delete|restore|update|change)\s+(?:this\s+|that\s+|the\s+|my\s+|your\s+|our\s+)?(?:invoice|customer|repair|product|expense)?\s*(?:name|number|id|phone|whatsapp|code)?\s*(.+)$/i;
  const directField = /(?:name|number|id|phone|whatsapp|code)\s*[:\-]?\s*(.+)$/i;
  const byClause = /(?:by|for|with|in|on)\s+(?:number|id|phone|name|date)\s*[:\-]?\s*(.+)$/i;

  for (const pattern of [fieldLead, directField, byClause]) {
    const m = original.match(pattern);
    if (m?.[1]) {
      const candidate = stripSearchTargetPrefix(m[1]);
      if (candidate) return candidate.replace(/^(?:name|number|id|phone|whatsapp|code)\s+/i, "").trim();
    }
  }

  const numeric = original.match(/\b\d{3,}\b/);
  if (numeric) return numeric[0];

  const filterPhrasesByEntity = {
    product: ["low stock", "out of stock", "in stock", "all stock"],
    invoice: ["paid invoice", "partial invoice", "unpaid invoice", "invoice only", "direct sales", "this week", "this month", "this year", "today"],
    repair: ["pending", "processing", "in repair", "waiting for parts", "completed", "delivered", "today", "weekly", "monthly", "yearly"],
    customer: ["customers with balance", "paid customers", "male", "female", "purchase customers", "repair customers"],
    report: ["today report", "daily report", "weekly report", "monthly report", "yearly report", "products report", "invoices report", "repairs report", "customers report"]
  };
  const hasDirectTarget = includesAny(normalized, ["name ", "number ", "id ", "phone ", "whatsapp ", "code "]) || /\b\d{3,}\b/.test(normalized) || /\+?\d[\d\s-]{5,}\d/.test(original);
  if (!hasDirectTarget && includesAny(normalized, filterPhrasesByEntity[entity] || [])) return "";

  const stopWords = new Set([
    ...ACTION_WORDS,
    ...(ENTITY_HINTS[entity] || []),
    "please", "pls", "kindly", "can", "you", "me", "show", "find", "search", "look", "up", "lookup", "open",
    "view", "check", "print", "export", "add", "edit", "delete", "restore", "update", "change", "the", "this",
    "that", "my", "your", "our", "for", "in", "on", "of", "to", "a", "an", "by", "with", "number", "id", "phone",
    "name", "date", "invoice", "customer", "repair", "product", "expense", "whatsapp", "code", "search", "find", "lookup"
  ]);

  const words = original.split(/\s+/).filter(Boolean);
  const cleaned = words.filter((word) => {
    const normalizedWord = normalizeInput(word);
    return normalizedWord && !stopWords.has(normalizedWord);
  }).join(" ").trim();

  return stripSearchTargetPrefix(cleaned || normalized).replace(/^(?:name|number|id|phone|whatsapp|code)\s+/i, "").trim();
}

function buildCommandContext(text = "", entity = "", action = "") {
  const period = detectPeriod(text);
  const category = detectCategoryValue(text, entity || "report");
  const status = detectStatusValue(text, entity);
  const sort = detectSortValue(text, entity);
  const rows = detectRowsValue(text);
  const exactDate = detectDateExactValue(text);
  const searchText = extractSearchTarget(text, entity, action);
  const metric = includesAny(normalizeInput(text), ["revenue", "profit", "expense", "invoices", "repairs", "stock movement"]) ? detectCategoryValue(text, "report") : "";
  const type = includesAny(normalizeInput(text), ["direct sale", "sale only", "invoice only", "invoice"]) ? (includesAny(normalizeInput(text), ["direct sale"]) ? "direct sale" : "invoice") : "";
  const gender = includesAny(normalizeInput(text), ["male", "female"]) ? (includesAny(normalizeInput(text), ["female"]) ? "female" : "male") : "";
  const balance = includesAny(normalizeInput(text), ["customers with balance", "balance", "owing", "due"]) ? "balance" : includesAny(normalizeInput(text), ["paid customers", "paid only"]) ? "paid" : "";
  const stock = includesAny(normalizeInput(text), ["out of stock", "no stock", "empty"]) ? "out of stock" : includesAny(normalizeInput(text), ["low stock", "important", "alert", "warning"]) ? "low stock" : includesAny(normalizeInput(text), ["in stock"]) ? "in stock" : "";
  return {
    period,
    category,
    status,
    sort,
    rows,
    exactDate,
    metric,
    type,
    gender,
    balance,
    stock,
    searchText,
    target: searchText,
    raw: String(text || "").trim()
  };
}

function detectCasualReply(text = "") {
  const t = normalizeInput(text);

  if (!t) return null;
  if (includesAny(t, ["what can i ask you", "what can you do", "help me", "show me commands", "what should i say", "commands", "options", "what do you support", "what should i ask", "show shortcuts", "what can i say"])) {
    return { kind: "help" };
  }
  if (includesAny(t, ["what is the time now", "what time is it", "time now", "current time", "clock now", "saacad", "saacadda", "saacadu", "wakhtiga"])) {
    return { kind: "time" };
  }
  if (includesAny(t, ["today report", "daily report", "today sales", "today expenses", "weekly report", "monthly report", "yearly report"])) {
    return { kind: "report" };
  }
  if (includesAny(t, ["what is the date now", "current date", "date now", "today date", "what is today", "what day is today", "taariikh", "taariikhda", "maanta waa", "today"])) {
    if (!includesAny(t, ["report", "sales", "expenses", "invoice", "product", "repair", "customer"])) {
      return { kind: "date" };
    }
  }
  if (includesAny(t, ["hi", "hello", "hey", "salaam", "asalamu", "assalam", "asc", "good morning", "good afternoon", "good evening", "war yaa", "waryaa", "wanaag", "kusalaamay", "iiwanr seetahay", "salaan", "nabad", "sidee tahay", "maxaa cusub"])) {
    return { kind: "greeting" };
  }
  if (includesAny(t, ["thanks", "thank you", "mahadsanid", "thx", "thank u"])) {
    return { kind: "thanks" };
  }
  if (includesAny(t, ["joke", "funny", "make me laugh", "tell me a joke", "something funny", "funny one", "another joke", "kaftan", "sheeko", "sheeko ii sheeg", "kaftan ii sheeg"])) {
    return { kind: "joke" };
  }
  if (includesAny(t, ["roast me", "roast", "insult me", "be mean"])) {
    return { kind: "roast" };
  }
  if (includesAny(t, ["you are bad", "bad assistant", "useless", "stupid", "idiot", "bad bot", "not good", "waxaad tahay xun"])) {
    return { kind: "polite-reply" };
  }
  if (includesAny(t, ["i am tired", "i am tired today", "waan daalanahay", "im tired", "feeling tired", "sad", "stressed", "aan daalanahay", "waan daalay"])) {
    return { kind: "supportive" };
  }
  if (includesAny(t, ["bye", "goodbye", "see you", "later", "good night", "see ya", "bye bye"])) {
    return { kind: "bye" };
  }
  return null;
}

function hasSpecificTarget(rawText, entity = "", action = "") {
  const text = normalizeInput(rawText);
  if (!text) return false;
  if (/[0-9]{3,}/.test(text) || text.includes("@") || text.includes("+")) return true;
  const stop = new Set([
    ...ACTION_WORDS,
    ...(ENTITY_HINTS[entity] || []),
    "please", "pls", "this", "that", "the", "a", "an", "my", "your", "to", "for", "me",
    "show", "open", "view", "do", "want", "need", "kindly", "just", "now"
  ]);
  const tokens = text.split(" ").filter(Boolean);
  const remaining = tokens.filter((token) => !stop.has(token) && token.length > 1);
  if (remaining.length > 0) return true;
  if (action === "search" && text.split(" ").length > 2) return true;
  return false;
}


function detectIntent(rawText) {
  const text = normalizeInput(rawText);
  if (!text) return { type: "empty", intent: null };

  const dotShortcut = detectDotShortcut(rawText);
  if (dotShortcut) return dotShortcut;

  const numericShortcut = detectNumericShortcut(text);
  if (numericShortcut) return numericShortcut;

  const aliasIntent = detectUserAliasIntent(rawText);
  if (aliasIntent) {
    return {
      type: "command",
      intent: "settings.profile.alias",
      action: "change",
      entity: "setting",
      profileIntent: "settings.profile.alias",
      context: {
        ...buildCommandContext(text, "setting", "change"),
        alias: aliasIntent.name || "",
        clearAlias: Boolean(aliasIntent.clear),
        pageOnly: true
      }
    };
  }

  if (includesAny(text, ["today report", "daily report", "weekly report", "monthly report", "yearly report"])) {
    const periodIntent = includesAny(text, ["weekly report"]) ? "report.weekly" : includesAny(text, ["monthly report"]) ? "report.monthly" : includesAny(text, ["yearly report"]) ? "report.yearly" : "report.today";
    return { type: "command", intent: periodIntent, action: "show", entity: "report", context: buildCommandContext(text, "report", "show") };
  }

  const casual = detectCasualReply(text);
  if (casual) return { type: "casual", mood: casual.kind, intent: null };

  const action = detectAction(text);
  const entity = detectEntity(text) || detectEntityFromFilters(text);
  const period = detectPeriod(text);
  const category = detectCategoryValue(text, entity || "report");
  const status = detectStatusValue(text, entity);
  const invoiceType = detectInvoiceTypeValue(text);
  const stock = detectProductStockValue(text);
  const repairStatus = detectRepairStatusValue(text);
  const profileIntent = detectProfileIntent(text);

  if (profileIntent) {
    return { type: "command", intent: profileIntent, action: "open", entity: "setting", context: buildCommandContext(text, "setting", "open") };
  }

  if (action === "print" && entity === "invoice" && (period || status || invoiceType || detectSortValue(text, "invoice") || detectRowsValue(text))) {
    return { type: "command", intent: "invoice.print", action: "print", entity: "invoice", context: buildCommandContext(text, "invoice", "print") };
  }

  if (entity === "product" && stock && !includesAny(text, ["print", "export"])) {
    return { type: "command", intent: "product.filter", action: "filter", entity: "product", context: buildCommandContext(text, "product", "filter") };
  }

  const reportLikePrint = (action === "print" || action === "export") && (
    period ||
    includesAny(text, ["report", "summary", "daily", "weekly", "monthly", "yearly", "today", "all time"]) ||
    (!hasSpecificTarget(text, entity || "", action) && includesAny(text, ["invoice", "product", "repair", "expense", "customer"]))
  );
  if (reportLikePrint) {
    const reportIntent = action === "print" ? "report.print" : "report.export.pdf";
    return { type: "command", intent: reportIntent, action, entity: "report", context: buildCommandContext(text, "report", action) };
  }

  if (["today report", "today ma ii sheeg", "what is the today report", "show today report"].some((phrase) => text.includes(phrase))) {
    return { type: "command", intent: "report.today", action: "show", entity: "report", context: buildCommandContext(text, "report", "show") };
  }

  if (text === "today" || text === "maanta") {
    return { type: "clarify", intent: null, question: "Do you mean today report, today sales, or today expenses?", suggestions: ["Today report", "Today sales", "Today expenses"] };
  }

  if (entity === "invoice" && (status || invoiceType || period || detectSortValue(text, "invoice") || detectRowsValue(text))) {
    return { type: "command", intent: "invoice.filter", action: "filter", entity: "invoice", context: buildCommandContext(text, "invoice", "filter") };
  }
  if (entity === "product" && (stock || detectSortValue(text, "product") || detectCategoryValue(text, "product"))) {
    return { type: "command", intent: "product.filter", action: "filter", entity: "product", context: buildCommandContext(text, "product", "filter") };
  }
  if (entity === "repair" && (repairStatus || status || period || detectDateExactValue(text) || detectSortValue(text, "repair"))) {
    return { type: "command", intent: "repair.filter", action: "filter", entity: "repair", context: buildCommandContext(text, "repair", "filter") };
  }
  if (entity === "customer" && (detectCustomerBalanceValue(text) || detectCustomerTypeValue(text) || detectCustomerGenderValue(text) || detectSortValue(text, "customer"))) {
    return { type: "command", intent: "customer.filter", action: "filter", entity: "customer", context: buildCommandContext(text, "customer", "filter") };
  }
  if (entity === "expense" && (period || detectSortValue(text, "expense"))) {
    return { type: "command", intent: "expense.filter", action: "filter", entity: "expense", context: buildCommandContext(text, "expense", "filter") };
  }
  if (entity === "report" && (period || category || detectReportMetricValue(text))) {
    return { type: "command", intent: "report.filter", action: "filter", entity: "report", context: buildCommandContext(text, "report", "filter") };
  }

  if (text === "report") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "customer") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "repair") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "product") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "invoice") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "expense") return { type: "clarify", intent: null, ...buildClarification(text) };
  if (text === "settings") return { type: "clarify", intent: null, ...buildClarification(text) };

  if (!action && entity && ["add", "edit", "delete", "restore", "search", "print", "export", "sell", "filter"].every((word) => !text.includes(word))) {
    const entityIntent = `${entity}.open`;
    return { type: "command", intent: entityIntent, action: "open", entity, context: { ...buildCommandContext(text, entity, "open"), pageOnly: true } };
  }

  if (!entity && action && ["add", "edit", "delete", "restore", "search", "print", "export", "sell", "filter"].includes(action)) {
    return { type: "clarify", intent: null, ...buildClarification(text) };
  }

  if (entity && ["edit", "delete", "restore", "search"].includes(action) && !hasSpecificTarget(text, entity, action) && !isFilterOnlyCommand(text, entity)) {
    return { type: "clarify", intent: null, ...buildClarification(`${action} ${entity}`) };
  }

  if (action === "export" && includesAny(text, ["pdf"])) return { type: "command", intent: "report.export.pdf", action: "export", entity: "report" };
  if (action === "export" && includesAny(text, ["csv", "excel"])) return { type: "command", intent: "report.export.csv", action: "export", entity: "report" };
  if (action === "print" && includesAny(text, ["report"])) return { type: "command", intent: "report.print", action: "print", entity: "report" };

  if (entity === "setting") {
    if (includesAny(text, ["dark", "theme", "mode"])) return { type: "command", intent: "settings.theme", action: "change", entity: "setting" };
    if (profileIntent) return { type: "command", intent: profileIntent, action: "open", entity: "setting", context: buildCommandContext(text, "setting", "open") };
    return { type: "command", intent: "settings.open", action: "open", entity: "setting", context: buildCommandContext(text, "setting", "open") };
  }

  if (entity && action) {
    return { type: "command", intent: `${entity}.${action}`, action, entity, context: buildCommandContext(text, entity, action) };
  }

  if (includesAny(text, ["how many", "total", "summary", "count", "report"])) {
    return { type: "question", intent: "report.today", action: "show", entity: "report", context: buildCommandContext(text, "report", "show") };
  }

  return { type: "clarify", intent: null, ...buildClarification(text) };
}

function pageForEntity(entity) {
  return PAGE_MAP[{
    customer: "customers",
    repair: "repairs",
    product: "products",
    invoice: "invoices",
    expense: "expenses",
    report: "reports",
    setting: "settings"
  }[entity] || entity] || null;
}

function textMatches(text, needle) {
  return normalizeInput(text).includes(normalizeInput(needle));
}

function clickByText(root, candidates) {
  const nodes = Array.from(root.querySelectorAll("button, a, [role='button'], input[type='button'], input[type='submit']"));
  for (const label of candidates) {
    const found = nodes.find((node) => textMatches(node.textContent || node.value || "", label) || textMatches(node.getAttribute("aria-label") || "", label));
    if (found) {
      found.click();
      return true;
    }
  }
  return false;
}

function findRowByTextAndClick(tableSelector, searchText, action) {
  const root = document.querySelector(tableSelector);
  if (!root) return false;
  const rows = Array.from(root.querySelectorAll("tr, .card, .list-group-item, .table-row, .product-card, .expense-card"));
  const target = normalizeInput(searchText);
  const row = rows.find((el) => normalizeInput(el.textContent || "").includes(target));
  if (!row) return false;
  const actionBtn = row.querySelector(`[data-action="${action}"]`) || row.querySelector(`[data-action*="${action}"]`);
  if (actionBtn) {
    actionBtn.click();
    return true;
  }
  return false;
}

function openPage(pageFile, afterOpen) {
  const current = getCurrentPageFile();
  if (current === pageFile) {
    afterOpen?.();
    return;
  }
  setPendingAction({ page: pageFile, afterOpen: String(afterOpen?.name || "auto"), createdAt: Date.now() });
  window.location.href = pageFile;
}

function clickSelector(selector) {
  const el = document.querySelector(selector);
  if (el) {
    el.click();
    return true;
  }
  return false;
}

function setInputValue(selector, value) {
  const el = document.querySelector(selector);
  if (!el) return false;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function focusInput(selector) {
  const el = document.querySelector(selector);
  if (!el) return false;
  el.focus();
  if (typeof el.select === "function") el.select();
  return true;
}

function refocusAssistantInput(delay = 1000) {
  if (!ui?.input) return;
  window.clearTimeout(ui._refocusTimer);
  ui._refocusTimer = window.setTimeout(() => {
    if (!ui?.input) return;
    ui.input.focus();
    if (typeof ui.input.select === "function") ui.input.select();
  }, Math.max(0, Number(delay) || 0));
}

function openOrFocus(pageFile, runNow) {
  const current = getCurrentPageFile();
  if (current === pageFile) {
    runNow();
    return true;
  }
  setPendingAction({ page: pageFile, action: "focus", createdAt: Date.now() });
  window.location.href = pageFile;
  return false;
}

function openModalBySelector(selector) {
  const modal = document.querySelector(selector);
  if (!modal) return false;
  if (window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modal).show();
    return true;
  }
  modal.classList.add("show");
  modal.style.display = "block";
  return true;
}

function tryGlobalCall(paths, args = []) {
  for (const path of paths) {
    const parts = String(path).split(".");
    let current = window;
    for (const part of parts) current = current?.[part];
    if (typeof current === "function") {
      try {
        return current(...args);
      } catch {
        return false;
      }
    }
  }
  return false;
}

function currentPageContext() {
  const file = getCurrentPageFile();
  if (file === "customers.html") return "customers";
  if (file === "repairing.html") return "repairs";
  if (file === "product.html") return "products";
  if (file === "invoice.html") return "invoices";
  if (file === "expenses.html") return "expenses";
  if (file === "report.html") return "reports";
  if (file === "settings.html") return "settings";
  return "dashboard";
}


function openPageSection(entity, action, rawText = "", context = null) {
  const command = resolvePageCommand(entity, rawText, action, context || {});
  const page = pageForEntity(entity);
  const route = page || PAGE_MAP[currentPageContext()] || "dashboard.html";

  const applyValue = (selectors, value) => {
    if (!value) return false;
    return selectors.some((selector) => setInputValue(selector, value));
  };

  const applySelect = (selectors, value) => {
    if (!value) return false;
    return selectors.some((selector) => setSelectValue(selector, value) || setInputValue(selector, value));
  };

  const applyInvoiceContext = () => {
    const periodMap = { today: "today", week: "week", month: "month", year: "year", "last-week": "week", "last-month": "month", "last-year": "year", all: "all" };
    applyValue(["#invoiceSearch"], command.searchText);
    applySelect(["#invoiceStatusFilter"], command.status || "");
    applySelect(["#invoiceDateFilter"], periodMap[command.period] || "");
    applySelect(["#invoiceTypeFilter"], command.invoiceType || "");
    applySelect(["#invoiceSortFilter"], command.sort || "");
    applySelect(["#invoiceRowsFilter"], command.rows || "");
  };

  const applyProductContext = () => {
    applyValue(["#productSearch", 'input[type="search"]'], command.searchText);
    applySelect(["#productCategoryFilter"], command.category || "");
    applySelect(["#productStockFilter"], command.stock || "");
    applySelect(["#productSortFilter"], command.sort || "");
  };

  const applyReportContext = () => {
    const periodMap = { today: "today", week: "Weekly", month: "Monthly", year: "Yearly", "last-week": "Weekly", "last-month": "Monthly", "last-year": "Yearly", all: "All Time" };
    applyValue(["#reportSearch"], command.searchText);
    applySelect(["#reportPeriodFilter"], periodMap[command.period] || "");
    applySelect(["#reportCategoryFilter"], command.category || "");
    applySelect(["#reportMetricFilter"], command.metric || "");
  };

  const applyRepairContext = () => {
    const periodMap = { today: "today", week: "week", month: "month", year: "year", all: "all" };
    applyValue(["#repairSearch"], command.searchText);
    applySelect(["#repairStatusFilter"], command.repairStatus || command.status || "");
    applySelect(["#repairDateFilter"], periodMap[command.period] || "");
    applySelect(["#repairPaymentFilter"], command.status || "");
    applySelect(["#repairSortFilter"], command.sort || "");
    if (command.dateExact) {
      setInputValue("#repairExactDate", command.dateExact);
    }
    applySelect(["#repairRowsFilter"], command.rows || "");
  };

  const applyCustomerContext = () => {
    applyValue(["#customerSearch"], command.searchText);
    applySelect(["#genderFilter"], command.customerGender || "");
    applySelect(["#balanceFilter"], command.customerBalance || "");
    applySelect(["#typeFilter"], command.customerType || "");
    applySelect(["#sortFilter"], command.sort || "");
  };

  const applyExpenseContext = () => {
    applyValue(["#expenseSearch"], command.searchText);
    applySelect(["#filterStatus"], command.status || "");
    applySelect(["#expenseDateFilter", "#expenseFilterDate"], command.period || "");
    applySelect(["#expenseSortFilter"], command.sort || "");
  };

  const applySettingsContext = () => {
    if (command.profileIntent) {
      openProfileEditor(rawText);
      return true;
    }
    if (includesAny(normalizeInput(rawText), ["dark", "theme", "mode"])) {
      const darkSelectors = [
        "#themeToggle",
        "#darkModeToggle",
        "[data-action='theme-toggle']",
        "[data-bs-theme-toggle]",
        "[aria-label*='dark']",
        "[title*='dark']"
      ];
      for (const selector of darkSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          return true;
        }
      }
    }
    return false;
  };

  const applyCurrentPage = () => {
    const current = currentPageContext();
    if (current === "invoices") applyInvoiceContext();
    if (current === "products") applyProductContext();
    if (current === "reports") applyReportContext();
    if (current === "repairs") applyRepairContext();
    if (current === "customers") applyCustomerContext();
    if (current === "expenses") applyExpenseContext();
    if (current === "settings") applySettingsContext();
  };

  const go = () => {
    setTimeout(() => {
      const current = currentPageContext();
      const focusSelectors = {
        customers: ["#customerSearch", "#topCustomerSearch"],
        repairs: ["#repairSearch"],
        products: ["#productSearch", 'input[type="search"]'],
        invoices: ["#invoiceSearch"],
        expenses: ["#expenseSearch"],
        reports: ["#reportSearch"],
        settings: ["#settingsSearch"]
      };

      if (action === "add") {
        clickByText(document, ["Add Customer", "Add Product", "New Invoice", "New Repair", "Add New Expense", "Add Expense"]);
        if (entity === "customer") clickSelector("#addCustomerBtnTop");
        if (entity === "product") clickSelector("[data-bs-target='#addProductModal']");
        if (entity === "invoice") clickSelector("[data-bs-target='#newInvoiceModal']");
        if (entity === "repair") clickSelector("[data-bs-target='#newRepairModal']");
        if (entity === "expense") clickSelector("#addExpenseBtn");
        if (entity === "setting") applySettingsContext();
        return;
      }

      if (action === "search" || action === "view") {
        const value = command.searchText || rawText;
        if (value && !isFilterOnlyCommand(rawText, entity)) {
          (focusSelectors[current] || []).some((selector) => setInputValue(selector, value));
          rememberSearchPhrase(value);
        }
      }

      if (["edit", "delete", "restore", "print", "pay", "history"].includes(action)) {
        const tableMap = {
          customers: "#customersTableBody",
          repairs: "#repairTableBody",
          products: "#productTableBody",
          invoices: "#invoiceTableBody",
          expenses: "#expenseTableBody"
        };
        const found = findRowByTextAndClick(tableMap[current] || "body", command.searchText || rawText, action === "view" ? "view" : action);
        if (!found && command.searchText) {
          (focusSelectors[current] || []).some((selector) => setInputValue(selector, command.searchText));
        }
      }

      if (action === "filter") {
        applyCurrentPage();
      }

      if (action === "sell" && current === "products") {
        clickSelector("#cartSummaryBtn") || clickSelector("#cartSellBtn") || clickSelector("[data-bs-target='#cartModal']");
      }

      if ((action === "print" || action === "export") && current === "reports") {
        applyReportContext();
        if (action === "print") clickSelector("#reportPrintBtn") || clickSelector("#reportTopPrintBtn");
        else if (normalizeInput(rawText).includes("csv") || normalizeInput(rawText).includes("excel")) clickSelector("#reportExportExcelBtn") || clickSelector("#reportTopExportExcelBtn");
        else clickSelector("#reportExportPdfBtn") || clickSelector("#reportTopExportPdfBtn");
      }

      applyCurrentPage();
    }, 280);
  };

  if (getCurrentPageFile() === route) {
    applyCurrentPage();
    if (entity === "setting") applySettingsContext();
    if (entity === "report") applyReportContext();
    if (entity === "invoice") applyInvoiceContext();
    if (entity === "product") applyProductContext();
    if (entity === "repair") applyRepairContext();
    if (entity === "customer") applyCustomerContext();
    go();
  } else {
    setPendingAction({ page: route, entity, action, rawText, searchText: command.searchText, context: command, createdAt: Date.now() });
    window.location.href = route;
  }
}



async function summarizeReport(period = "today") {
  const [products, invoices, repairs, expenses, customers] = await Promise.all([
    getProducts().catch(() => null),
    getInvoices().catch(() => null),
    getRepairs().catch(() => null),
    getExpenses().catch(() => null),
    getCustomers().catch(() => null)
  ]);

  const normalizedPeriod = normalizeInput(period);
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (normalizedPeriod.includes("weekly") || normalizedPeriod.includes("week")) {
    start.setDate(start.getDate() - 7);
  } else if (normalizedPeriod.includes("monthly") || normalizedPeriod.includes("month")) {
    start.setMonth(start.getMonth() - 1);
  } else if (normalizedPeriod.includes("year") || normalizedPeriod.includes("yearly")) {
    start.setFullYear(start.getFullYear() - 1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const inRange = (item) => {
    const t = safeNumber(item?.createdAt || item?.date || item?.timestamp || item?.updatedAt);
    return t >= start.getTime() && t <= end.getTime();
  };

  const filteredInvoices = filterActive(toArray(invoices)).filter(inRange);
  const filteredRepairs = filterActive(toArray(repairs)).filter(inRange);
  const filteredExpenses = filterActive(toArray(expenses)).filter(inRange);
  const filteredProducts = filterActive(toArray(products));
  const filteredCustomers = filterActive(toArray(customers));

  const report = buildReportSummary({
    products: filteredProducts,
    invoices: filteredInvoices,
    repairs: filteredRepairs,
    expenses: filteredExpenses
  });

  const repairSummary = buildRepairSummary(filteredRepairs);
  const invoiceSummary = buildInvoiceSummary(filteredInvoices);
  const productSummary = buildProductSummary(filteredProducts);
  const expenseSummary = buildExpenseSummary(filteredExpenses);

  const countByText = (items, fields, needles) => {
    const list = toArray(items);
    return needles.reduce((sum, needle) => {
      const n = normalizeInput(needle);
      return sum + list.filter((item) => {
        const text = fields.map((f) => normalizeInput(item?.[f] ?? "")).join(" ");
        return text.includes(n);
      }).length;
    }, 0);
  };

  const productInStock = countByText(filteredProducts, ["status", "stockStatus", "state", "availability"], ["in stock", "available", "instock"]);
  const productLowStock = safeNumber(productSummary.lowStockProducts ?? productSummary.lowStock ?? 0);
  const productOutStock = safeNumber(productSummary.outOfStockProducts ?? productSummary.outOfStock ?? 0);

  const repairDeviceReceived = countByText(filteredRepairs, ["status", "repairStatus"], ["device received"]);
  const repairDiagnosis = countByText(filteredRepairs, ["status", "repairStatus"], ["diagnosis completed"]);
  const repairProgress = countByText(filteredRepairs, ["status", "repairStatus"], ["repair in progress", "in progress"]);
  const repairQuality = countByText(filteredRepairs, ["status", "repairStatus"], ["quality testing"]);
  const repairReady = countByText(filteredRepairs, ["status", "repairStatus"], ["ready for pickup"]);
  const repairWaitingParts = countByText(filteredRepairs, ["status", "repairStatus"], ["waiting for parts"]);

  const customersWithBalance = toArray(filteredCustomers).filter((item) => {
    const balance = safeNumber(item?.balance ?? item?.remaining ?? item?.due ?? item?.debt ?? item?.balanceAmount ?? 0);
    return balance > 0;
  }).length;

  const directSalesCount = toArray(filteredInvoices).filter((item) => {
    const type = normalizeInput(item?.type ?? item?.invoiceType ?? item?.saleType ?? "");
    return type.includes("direct sale") || type.includes("sale");
  }).length;

  const invoiceTypeCount = toArray(filteredInvoices).filter((item) => {
    const type = normalizeInput(item?.type ?? item?.invoiceType ?? "");
    return type.includes("invoice") || type.includes("receipt");
  }).length;

  const periodLabel = normalizedPeriod.includes("week")
    ? "Weekly"
    : normalizedPeriod.includes("month")
      ? "Monthly"
      : normalizedPeriod.includes("year")
        ? "Yearly"
        : "Today";

  const lines = [
    `${periodLabel} premium report`,
    `Revenue: ${formatCurrency(report.totalRevenue || 0)}`,
    `Expenses: ${formatCurrency(report.totalExpense || 0)}`,
    `Profit: ${formatCurrency(report.totalProfit || 0)}`,
    `Invoices: ${invoiceSummary.totalInvoices || 0} • Paid: ${invoiceSummary.paidInvoices || 0} • Partial: ${invoiceSummary.partialInvoices || 0} • Unpaid: ${invoiceSummary.unpaidInvoices || 0}`,
    `Products: ${productSummary.totalProducts || 0} • In stock: ${productInStock || 0} • Low stock: ${productLowStock || 0} • Out of stock: ${productOutStock || 0}`,
    `Repairs: ${repairSummary.totalRepairs || 0} • Received: ${repairDeviceReceived || 0} • Diagnosis: ${repairDiagnosis || 0} • In progress: ${repairProgress || 0}`,
    `Quality testing: ${repairQuality || 0} • Ready: ${repairReady || 0} • Waiting parts: ${repairWaitingParts || 0}`,
    `Customers with balance: ${customersWithBalance || 0}`,
    `Invoice rows: ${invoiceTypeCount || 0} • Direct sales: ${directSalesCount || 0}`,
    `Expenses rows: ${expenseSummary.totalExpenses || 0}`
  ];

  return lines.join(" • ");
}



async function handleKnownIntent(intent, rawText = "") {
  const action = intent.action || intent.intent?.split(".").pop();
  const entity = intent.entity || intent.intent?.split(".")[0];
  const lower = normalizeInput(rawText);
  const shortcutCode = intent.shortcutCode || "";

  if (shortcutCode === "00" || intent.intent === "assistant.shortcuts") {
    return buildShortcutCatalogResponse("all");
  }

  if (String(intent.intent || "").startsWith("assistant.catalog.")) {
    const scope = intent.shortcutScope || String(intent.intent).split(".").pop() || "all";
    return buildShortcutCatalogResponse(scope);
  }

  if (shortcutCode && String(shortcutCode).startsWith(".")) {
    return buildShortcutCatalogResponse(intent.shortcutScope || "all");
  }

  if (intent.intent === "settings.profile.alias") {
    const ctx = intent.context || {};
    if (ctx.clearAlias) {
      setAssistantDisplayName("");
      return {
        text: "Okay — I will use your main profile name again.",
        chips: [
          { label: "Call me Cade", intent: "settings.profile.alias" },
          { label: "Edit profile", intent: "settings.profile.open" },
          { label: "Change my name", intent: "settings.profile.name" },
          { label: "Change my email", intent: "settings.profile.email" }
        ]
      };
    }

    if (ctx.alias) {
      setAssistantDisplayName(ctx.alias);
      return {
        text: `Okay — I will call you ${ctx.alias} from now on.`,
        chips: [
          { label: "Use real name", intent: "settings.profile.alias" },
          { label: "Edit profile", intent: "settings.profile.open" },
          { label: "Change password", intent: "settings.profile.password" }
        ]
      };
    }
  }

  if (shortcutCode && shortcutCode !== "00") {
    const shortcutMap = {
      "1": () => { window.location.href = "dashboard.html"; },
      "2": () => openPageSection("invoice", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "3": () => openPageSection("product", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "4": () => openPageSection("repair", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "5": () => openPageSection("customer", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "6": () => openPageSection("report", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "7": () => openPageSection("expense", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "9": () => openPageSection("setting", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "11": () => openPageSection("setting", "change", "dark mode", { ...(intent.context || {}), pageOnly: true }),
      "22": () => openPageSection("invoice", "add", "", { ...(intent.context || {}), pageOnly: true }),
      "33": () => openPageSection("product", "add", "", { ...(intent.context || {}), pageOnly: true }),
      "44": () => openPageSection("repair", "add", "", { ...(intent.context || {}), pageOnly: true }),
      "55": () => openPageSection("customer", "add", "", { ...(intent.context || {}), pageOnly: true }),
      "66": () => openPageSection("report", "print", "", { ...(intent.context || {}), pageOnly: true, period: "all", category: "all", metric: "revenue", rows: "all", searchText: "" }),
      "77": () => openPageSection("expense", "add", "", { ...(intent.context || {}), pageOnly: true }),
      "99": () => openPageSection("setting", "open", "", { ...(intent.context || {}), pageOnly: true }),
      "123": () => openPageSection("setting", "open", "", { ...(intent.context || {}), pageOnly: true, profileIntent: "settings.profile.open" })
    };
    const runShortcut = shortcutMap[shortcutCode];
    if (runShortcut) {
      runShortcut();
      const shortcutText = NUMERIC_SHORTCUT_MAP[shortcutCode]?.label || "shortcut";
      return {
        text: `Shortcut ${shortcutCode} activated: ${shortcutText}.`,
        chips: buildShortcutCatalogResponse().chips.slice(0, 10)
      };
    }
  }

  if (intent.intent === "report.today" || intent.intent === "report.weekly" || intent.intent === "report.monthly") {
    const period = intent.intent.split(".")[1] || "today";
    const summary = await summarizeReport(period);
    return { text: summary, chips: normalizeSuggestionList(actionSuggestionsFor(intent.intent).map((label) => ({ label, intent: intent.intent, commandText: label })), intent.intent) };
  }

  if (intent.intent === "report.export.pdf" || intent.intent === "report.export.csv" || intent.intent === "report.print") {
    openPageSection("report", action === "print" ? "print" : "export", rawText, intent.context || buildCommandContext(rawText, "report", action));
    return { text: action === "print" ? "I sent the report to print." : "I opened export for the report.", chips: normalizeSuggestionList(actionSuggestionsFor(intent.intent).map((label) => ({ label, intent: intent.intent, commandText: label })), intent.intent) };
  }

  if (intent.intent === "invoice.print") {
    openPageSection("invoice", "filter", rawText, intent.context || buildCommandContext(rawText, "invoice", "filter"));
    clickByText(document, ["Print", "Print invoice", "Export PDF", "Download PDF", "Print receipt", "Print list"]) || openPageSection("invoice", "print", rawText, intent.context || buildCommandContext(rawText, "invoice", "print"));
    return {
      text: "I applied the invoice filters and tried to print the invoice list.",
      chips: normalizeSuggestionList(actionSuggestionsFor("invoice.filter").map((label) => ({ label, intent: "invoice.filter", commandText: label })), "invoice.filter")
    };
  }

  if (intent.intent === "settings.theme") {
    openPageSection("setting", "change", rawText, intent.context || buildCommandContext(rawText, "setting", "change"));
    return { text: "I opened theme settings. The dark mode toggle should change now if it exists on this page.", chips: normalizeSuggestionList(actionSuggestionsFor(intent.intent).map((label) => ({ label, intent: intent.intent, commandText: label })), intent.intent) };
  }

  if (String(intent.intent || "").startsWith("settings.profile")) {
    const opened = openProfileEditor(rawText);
    return {
      text: opened ? "I opened the profile editor from the header menu." : "I could not find the profile menu here. Please open the three-dots menu and choose Profile/Edit Profile.",
      chips: ["Change password", "Change my number", "Change my name", "Change my email"].map((label) => ({ label, intent: "settings.profile.open" }))
    };
  }

  if (entity === "product" && includesAny(lower, ["important", "low stock", "out of stock", "alert", "warning"])) {
    openPageSection("product", "filter", rawText, intent.context || buildCommandContext(rawText, "product", "filter"));
    return { text: "I opened Products and applied the stock filter.", chips: normalizeSuggestionList(actionSuggestionsFor("product.search").map((label) => ({ label, intent: "product.search", commandText: label })), "product.search") };
  }

  if (entity === "invoice" && (includesAny(lower, ["partial", "partially paid", "unpaid", "paid", "invoice only", "direct sales", "all invoices"]) || intent.action === "filter")) {
    openPageSection("invoice", "filter", rawText, intent.context || buildCommandContext(rawText, "invoice", "filter"));
    return { text: "I opened Invoices and applied the invoice filters.", chips: normalizeSuggestionList(actionSuggestionsFor("invoice.filter").map((label) => ({ label, intent: "invoice.filter", commandText: label })), "invoice.filter") };
  }

  if (entity === "repair" && (includesAny(lower, ["device received", "diagnosis completed", "repair in progress", "quality testing", "ready for pickup", "waiting for parts"]) || intent.action === "filter")) {
    openPageSection("repair", "filter", rawText, intent.context || buildCommandContext(rawText, "repair", "filter"));
    return { text: "I opened Repairs and applied the status filter.", chips: normalizeSuggestionList(actionSuggestionsFor("repair.search").map((label) => ({ label, intent: "repair.search", commandText: label })), "repair.search") };
  }

  if (entity === "customer" && (includesAny(lower, ["balance", "paid", "male", "female", "oldest", "newest"]) || intent.action === "filter")) {
    openPageSection("customer", "filter", rawText, intent.context || buildCommandContext(rawText, "customer", "filter"));
    return { text: "I opened Customers and applied the customer filter.", chips: normalizeSuggestionList(actionSuggestionsFor("customer.search").map((label) => ({ label, intent: "customer.search", commandText: label })), "customer.search") };
  }

  if (entity === "setting" && action === "open") {
    openPageSection("setting", "open", rawText, intent.context || buildCommandContext(rawText, "setting", "open"));
    return { text: "I opened Settings.", chips: normalizeSuggestionList(actionSuggestionsFor("settings.open").map((label) => ({ label, intent: "settings.open", commandText: label })), "settings.open") };
  }

  if (action === "open" && entity && entity !== "report" && entity !== "setting") {
    openPageSection(entity, "open", rawText, intent.context || buildCommandContext(rawText, entity, "open"));
    return { text: `I opened ${entity} for you.`, chips: normalizeSuggestionList(actionSuggestionsFor(`${entity}.search`).map((label) => ({ label, intent: `${entity}.search`, commandText: label })), `${entity}.search`) };
  }

  if (["add", "edit", "delete", "restore", "search", "print", "export", "sell", "filter", "view", "pay", "history"].includes(action) && entity) {
    openPageSection(entity, action, rawText, intent.context || buildCommandContext(rawText, entity, action));
    rememberFavorite(`${entity}.${action}`);
    return {
      text: `Done — I handled the ${action} request for ${entity}.`,
      chips: normalizeSuggestionList(actionSuggestionsFor(`${entity}.${action}`).map((label) => ({ label, intent: `${entity}.${action}`, commandText: label })), `${entity}.${action}`)
    };
  }

  return null;
}


function buildResponse(intent, rawText) {
  const lower = normalizeInput(rawText);
  const adminName = getAssistantDisplayName();

  if (intent.type === "empty") {
    return { text: greetingText(), chips: normalizeSuggestionList(TOP_SUGGESTIONS) };
  }

  if (intent.type === "casual") {
    if (intent.mood === "help") {
      const helperText = [
        `You can ask me to add customers, search invoices, print reports, check low stock products, or change settings.`,
        `Try commands like: "search invoice 0617...", "today report", "new repair", or "change dark mode".`,
        `I can help with customers, repairs, products, invoices, expenses, reports, and profile settings.`
      ];
      return {
        text: helperText[Math.floor(Math.random() * helperText.length)],
        chips: normalizeSuggestionList(EXTENDED_HELPFUL_QUESTION_BANK.slice(0, 18))
      };
    }

    if (intent.mood === "time") {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return {
        text: `The time now is ${time}.`,
        chips: normalizeSuggestionList([
          { label: "What is the date now", intent: "assistant.help", commandText: "what is the date now" },
          { label: "Today report", intent: "report.today", commandText: "today report" },
          { label: "Daily report", intent: "report.today", commandText: "daily report" },
          { label: "Show all shortcuts", intent: "assistant.shortcuts", commandText: "00" }
        ])
      };
    }

    if (intent.mood === "date") {
      const now = new Date();
      const date = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      return {
        text: `Today is ${date}.`,
        chips: normalizeSuggestionList([
          { label: "What is the time now", intent: "assistant.help", commandText: "what is the time now" },
          { label: "Today report", intent: "report.today", commandText: "today report" },
          { label: "Daily report", intent: "report.today", commandText: "daily report" },
          { label: "Show all shortcuts", intent: "assistant.shortcuts", commandText: "00" }
        ])
      };
    }

    if (intent.mood === "greeting") {
      const greetings = [
        `Hi ${adminName}! Welcome back to Waasuge Electronics. How can I help you today?`,
        `Salaam ${adminName}! Ready when you are.`,
        `Hello ${adminName}! Tell me what you need and I will handle it.`,
        `Waryaa ${adminName}! waxaan ahay caawiye Waasuge Shop — sidee kuu caawinayaa maanta?`
      ];
      return { text: greetings[Math.floor(Math.random() * greetings.length)], chips: normalizeSuggestionList(TOP_SUGGESTIONS) };
    }

    if (intent.mood === "thanks") {
      const replies = [
        "You are welcome. I am always ready to help.",
        "Anytime boss — I am here for you.",
        "Glad to help. Just send the next command.",
        "Mahadsanid! I am ready for the next task."
      ];
      return { text: replies[Math.floor(Math.random() * replies.length)], chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 6) };
    }

    if (intent.mood === "joke") {
      const jokes = [
        "Why did the phone go to school? It wanted a better connection.",
        "Why did the repair shop stay calm? Because it already knew how to handle broken things.",
        "I told the invoice to relax. It said, 'I am still pending.'",
        "A slow phone and a busy shop have one thing in common: both need patience.",
        "My favorite customer? The one that pays on time. That is true comedy."
      ];
      return { text: jokes[Math.floor(Math.random() * jokes.length)], chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 6) };
    }

    if (intent.mood === "roast") {
      return {
        text: "Haha, I will keep it friendly. Let us focus on fixing the shop faster than the Wi‑Fi in a storm.",
        chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 6)
      };
    }

    if (intent.mood === "polite-reply") {
      return {
        text: "No worries. I will stay polite and helpful. Tell me what you want me to do, and I will handle it.",
        chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 6)
      };
    }

    if (intent.mood === "supportive") {
      const replies = [
        "Take it easy. I can help you handle the shop step by step.",
        "You can rest a bit. I am here when you need the next task.",
        "I understand. Let us keep things simple and work one command at a time."
      ];
      return { text: replies[Math.floor(Math.random() * replies.length)], chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 6) };
    }

    if (intent.mood === "bye") {
      return {
        text: "Alright boss — I will be here when you need me again.",
        chips: normalizeSuggestionList(TOP_SUGGESTIONS).slice(0, 4)
      };
    }
  }

  if (intent.type === "clarify") {
    return {
      text: intent.question || "Can you say that again?",
      chips: (intent.suggestions || []).map((label) => {
        const labelText = String(label || "").trim();
        return { label: labelText, intent: normalizeInput(labelText).replace(/\s+/g, ".") };
      })
    };
  }

  if (intent.type === "question") {
    return { text: "I can check that. Let me open the right page and summarize it.", chips: normalizeSuggestionList(actionSuggestionsFor("report.today"), "report.today") };
  }

  return null;
}



async function handleCommand(rawText, options = {}) {
  const text = String(rawText || "").trim();
  if (!text || state.busy) return;
  storeCommand(text);

  const detectedIntent = detectIntent(text);
  const forcedIntent = String(options.forcedIntent || "").trim();
  const intent = forcedIntent
    ? {
        ...detectedIntent,
        type: "command",
        intent: forcedIntent,
        action: forcedIntent.split(".").pop() || detectedIntent.action || "",
        entity: forcedIntent.split(".")[0] || detectedIntent.entity || ""
      }
    : detectedIntent;

  intent.context = intent.context || buildCommandContext(text, intent.entity || "", intent.action || "");
  state.pending = null;

  addMessage("user", text);
  persistAndRenderHistory();
  setBusy(true);

  if (ui?.input) ui.input.value = "";

  const typing = showTypingIndicator();
  await new Promise((resolve) => setTimeout(resolve, REPLY_DELAY));

  try {
    let response = null;
    if (intent.type === "command" || intent.type === "question" || intent.type === "shortcut") {
      response = await handleKnownIntent(intent, text);
    }
    if (!response) response = await resolveKnowledgeReply(text, intent);
    if (!response) response = buildResponse(intent, text);

    if (forcedIntent && !response && intent.type === "command") {
      response = {
        text: `Okay — I opened ${intent.entity || "that page"} and applied the command.`,
        chips: normalizeSuggestionList(actionSuggestionsFor(forcedIntent).map((label) => ({ label, intent: forcedIntent, commandText: label })), forcedIntent)
      };
    }

    if (!response) {
      const suggestions = contextualSuggestionChips(text);
      response = {
        text: "I do not understand yet. Please clarify what you want me to do. I can also show the closest options below.",
        chips: normalizeSuggestionList(suggestions, "assistant.shortcuts")
      };
    }

    if (typing) typing.remove();
    addMessage("assistant", response.text, { intent: intent.intent || intent.entity || "report.today", chips: response.chips, at: Date.now() });
    storeAssistantReply(response.text);
    persistAndRenderHistory();
    requestAnimationFrame(() => scrollMessagesToBottom(true));
  } catch (error) {
    if (typing) typing.remove();
    const message = "I ran into a small problem. Please try again.";
    addMessage("assistant", message, { chips: normalizeSuggestionList(TOP_SUGGESTIONS) });
    storeAssistantReply(message);
    showToast?.("Assistant error", "warning", ASSISTANT_NAME);
    persistAndRenderHistory();
  } finally {
    setBusy(false);
    refocusAssistantInput(1000);
  }
}

function renderShortcuts(extra = []) {
  if (!ui?.shortcuts) return;
  ui.shortcuts.innerHTML = "";
  ui.shortcuts.hidden = true;
  ui.shortcuts.style.display = "none";
}

function renderHistory() {
  if (!ui?.messages) return;
  ui.messages.innerHTML = "";
  if (state.history.length > HISTORY_WARNING_LIMIT) {
    renderConversationWarning();
  }
  if (!state.history.length) {
    addMessage("assistant", greetingText(), { chips: normalizeSuggestionList(TOP_SUGGESTIONS), at: Date.now() });
    return;
  }
  state.history.slice(-24).forEach((entry) => {
    const role = entry.role === "user" ? "user" : "assistant";
    addMessage(role, stripHtml(entry.text), { chips: [], at: entry.at || Date.now() });
  });
}


function openPanel() {
  if (!ui) return;
  ui.panel.classList.add("is-open");
  ui.fab.classList.add("is-open");
  state.open = true;
  localStorage.setItem(STORAGE.collapsed, "0");
  closeCollectionsDrawer();
  renderHistory();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => scrollMessagesToBottom(true));
  });
  setTimeout(() => {
    scrollMessagesToBottom(true);
    ui.input?.focus();
  }, 180);
}

function closePanel() {
  if (!ui) return;
  ui.panel.classList.remove("is-open");
  ui.fab.classList.remove("is-open");
  state.open = false;
  localStorage.setItem(STORAGE.collapsed, "1");
}

function togglePanel() {
  if (!ui) return;
  if (ui.panel.classList.contains("is-open")) closePanel();
  else openPanel();
}

function toggleFullscreen() {
  if (!ui) return;
  const full = ui.panel.classList.toggle("is-fullscreen");
  ui.root.classList.toggle("is-fullscreen", full);
  const btn = ui.panel.querySelector('[data-assistant-action="fullscreen"] i');
  if (btn) btn.className = `bi ${full ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"}`;
  localStorage.setItem("waasugeAssistantFullscreen", full ? "1" : "0");
  requestAnimationFrame(() => scrollMessagesToBottom(true));
}

function buildUI() {
  if (document.getElementById("waasugeAssistantFab")) return;
  const root = createEl("div", { id: "waasugeAssistantRoot", className: "waasuge-assistant-root" });
  root.innerHTML = `
    <button type="button" id="waasugeAssistantFab" class="waasuge-assistant-fab" aria-label="Open assistant">
      <i class="bi bi-stars"></i>
      <span class="waasuge-assistant-fab-badge" id="waasugeAssistantBadge" style="display:none;"></span>
    </button>

    <section id="waasugeAssistantPanel" class="waasuge-assistant-panel" aria-label="Waasuge assistant">
      <header class="waasuge-assistant-header">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <div class="waasuge-assistant-avatar-lg"><i class="bi bi-stars"></i></div>
          <div class="min-w-0">
            <div class="waasuge-assistant-title">Waasuge Assistant</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-1">
          <button type="button" class="waasuge-assistant-icon-btn" data-assistant-action="pins" title="Pinned conversations"><i class="bi bi-pin-angle"></i></button>
          <button type="button" class="waasuge-assistant-icon-btn" data-assistant-action="saved" title="Saved shortcuts"><i class="bi bi-bookmark-plus"></i></button>
          <button type="button" class="waasuge-assistant-icon-btn" data-assistant-action="fullscreen" title="Fullscreen"><i class="bi bi-arrows-fullscreen"></i></button>
          <button type="button" class="waasuge-assistant-icon-btn" data-assistant-action="clear" title="Clear chat"><i class="bi bi-trash3"></i></button>
          <button type="button" class="waasuge-assistant-icon-btn" data-assistant-action="collapse" title="Hide assistant"><i class="bi bi-chevron-down"></i></button>
        </div>
      </header>

      <div class="waasuge-assistant-body">
        <div class="waasuge-assistant-collections" id="waasugeAssistantCollections" hidden>
          <div class="waasuge-assistant-collections-head">
            <div class="waasuge-assistant-collections-meta">
              <div class="waasuge-assistant-collections-title" id="waasugeAssistantCollectionsTitle">Pinned conversations</div>
              <div class="waasuge-assistant-collections-subtitle" id="waasugeAssistantCollectionsMeta">Saved locally on this device.</div>
            </div>
            <div class="d-flex align-items-center gap-1">
              <button type="button" class="waasuge-assistant-icon-btn" data-assistant-collection-action="up" title="Scroll up"><i class="bi bi-arrow-up"></i></button>
              <button type="button" class="waasuge-assistant-icon-btn" data-assistant-collection-action="down" title="Scroll down"><i class="bi bi-arrow-down"></i></button>
              <button type="button" class="waasuge-assistant-icon-btn" data-assistant-collection-action="close" title="Close"><i class="bi bi-x-lg"></i></button>
            </div>
          </div>
          <div class="waasuge-assistant-collections-body" id="waasugeAssistantCollectionsBody"></div>
        </div>

        <div class="waasuge-assistant-messages" id="waasugeAssistantMessages"></div>
        <div class="waasuge-assistant-shortcuts" id="waasugeAssistantShortcuts"></div>
      </div>

      <footer class="waasuge-assistant-footer">
        <div class="waasuge-assistant-input-wrap">
          <input id="waasugeAssistantInput" type="text" class="waasuge-assistant-input" placeholder="Type a command...">
          <button id="waasugeAssistantSend" type="button" class="waasuge-assistant-send">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
        <div class="waasuge-assistant-footer-hint">Try: add customer • today report • delete invoice • search repair</div>
      </footer>
    </section>
  `;

  document.body.appendChild(root);

  ui = {
    root,
    fab: root.querySelector("#waasugeAssistantFab"),
    badge: root.querySelector("#waasugeAssistantBadge"),
    panel: root.querySelector("#waasugeAssistantPanel"),
    messages: root.querySelector("#waasugeAssistantMessages"),
    shortcuts: root.querySelector("#waasugeAssistantShortcuts"),
    collectionsDrawer: root.querySelector("#waasugeAssistantCollections"),
    collectionsTitle: root.querySelector("#waasugeAssistantCollectionsTitle"),
    collectionsMeta: root.querySelector("#waasugeAssistantCollectionsMeta"),
    collectionsBody: root.querySelector("#waasugeAssistantCollectionsBody"),
    collectionsPinsBtn: root.querySelector('[data-assistant-action="pins"]'),
    collectionsSavedBtn: root.querySelector('[data-assistant-action="saved"]'),
    input: root.querySelector("#waasugeAssistantInput"),
    sendBtn: root.querySelector("#waasugeAssistantSend")
  };

  ui.fab.addEventListener("click", togglePanel);
  ui.sendBtn.addEventListener("click", () => handleCommand(ui.input.value));
  ui.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommand(ui.input.value);
    } else if (e.key === "Escape") {
      closePanel();
    }
  });

  ui.panel.addEventListener("click", (e) => {
    const action = e.target.closest("[data-assistant-action]")?.dataset.assistantAction;
    if (!action) return;
    if (action === "fullscreen") toggleFullscreen();
    if (action === "collapse") {
      closeCollectionsDrawer();
      closePanel();
    }
    if (action === "clear") {
      state.history = [];
      saveJSON(STORAGE.history, []);
      renderHistory();
      persistAndRenderHistory();
      showToast?.("Chat cleared", "info", ASSISTANT_NAME);
    }
    if (action === "pins") toggleCollectionsDrawer("pins");
    if (action === "saved") toggleCollectionsDrawer("saved");
  });

  ui.panel.addEventListener("click", (e) => {
    const action = e.target.closest("[data-assistant-collection-action]")?.dataset.assistantCollectionAction;
    if (!action) return;
    if (action === "close") closeCollectionsDrawer();
    if (action === "up") scrollCollectionsDrawer("up");
    if (action === "down") scrollCollectionsDrawer("down");
  });

  document.addEventListener("click", (e) => {
    if (!ui.panel.classList.contains("is-open")) return;
    const inside = e.target.closest("#waasugeAssistantPanel, #waasugeAssistantFab");
    if (!inside) return;
  });

  updateHeaderDot();
}

async function executePendingAction() {
  const pending = getPendingAction();
  if (!pending || pending.page !== getCurrentPageFile()) return;
  clearPendingAction();
  const entity = pending.entity || currentPageContext();
  const action = pending.action || "open";
  const rawText = pending.rawText || `${entity} ${action}`;
  const context = pending.context || buildCommandContext(rawText, entity, action);
  setTimeout(() => {
    openPageSection(entity, action, rawText, context);
  }, 350);
}

function maybeShowWelcome() {
  if (state.history.length) return;
  const greeting = greetingText();
  addMessage("assistant", greeting, { chips: normalizeSuggestionList(TOP_SUGGESTIONS), at: Date.now() });
  storeAssistantReply(greeting);
  persistAndRenderHistory();
  requestAnimationFrame(() => scrollMessagesToBottom(true));
}

function bootstrapAssistant() {
  if (bootstrapped) return;
  bootstrapped = true;

  if (window.location.pathname.toLowerCase().includes("login.html")) return;
  if (!document.body) return;

  buildUI();
  renderHistory();
  maybeShowWelcome();
  requestAnimationFrame(() => scrollMessagesToBottom(false));
  updateHeaderDot();
  maybeWarnConversationLimit();

  const collapsed = localStorage.getItem(STORAGE.collapsed) === "1";
  if (collapsed) closePanel();

  const fullscreen = localStorage.getItem("waasugeAssistantFullscreen") === "1";
  if (fullscreen && ui?.panel) {
    ui.panel.classList.add("is-fullscreen");
    ui.root.classList.add("is-fullscreen");
    const icon = ui.panel.querySelector('[data-assistant-action="fullscreen"] i');
    if (icon) icon.className = "bi bi-fullscreen-exit";
  }

  setLastPage();
  executePendingAction().catch(() => void 0);

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE.history) {
      state.history = loadJSON(STORAGE.history, []);
      renderHistory();
    }
  });

  window.addEventListener("pagehide", setLastPage);
  window.addEventListener("beforeunload", setLastPage);
}

function onReady() {
  bootstrapAssistant();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", onReady);
} else {
  onReady();
}

window.WaasugeAssistant = {
  open: openPanel,
  close: closePanel,
  toggle: togglePanel,
  handleCommand,
  summarizeReport,
  detectIntent,
  renderHistory,
  behaviorPrompt: ASSISTANT_BEHAVIOR_PROMPT
};
