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

export const ASSISTANT_SOMALI_BANK = [
  entry(
    [
      "salaam",
      "assalaamu alaykum",
      "waad salaaman tahay",
      "hello",
      "hi"
    ]
, 
    () => `Salaam boss — sidee kuu caawin karaa maanta?`
, 
    [
      {
        "label": "Maxaan ku weydiin karaa",
        "intent": "assistant.help",
        "commandText": "maxaan ku weydiin karaa"
      },
      {
        "label": "Maanta report",
        "intent": "report.today",
        "commandText": "today report"
      }
    ]
  ),
  entry(
    [
      "sidee tahay",
      "siday tahay",
      "waryaa sidee tahay",
      "how are you"
    ]
, 
    () => `Waan fiicanahay boss, adiguna?`
, 
    [
      {
        "label": "Kaftan ii sheeg",
        "intent": "assistant.help",
        "commandText": "kaftan ii sheeg"
      },
      {
        "label": "Waan daalanahay",
        "intent": "assistant.help",
        "commandText": "waan daalanahay"
      }
    ]
  ),
  entry(
    [
      "magacaa",
      "magacaaga",
      "yaa tahay",
      "who are you"
    ]
, 
    () => `Waxaan ahay Waasuge Assistant, caawiye local ah.`
, 
    [
      {
        "label": "Maxaad qaban kartaa",
        "intent": "assistant.help",
        "commandText": "maxaad qaban kartaa"
      },
      {
        "label": "Soo bandhig shortcuts",
        "intent": "assistant.shortcuts",
        "commandText": "00"
      }
    ]
  ),
  entry(
    [
      "maxaad qaban kartaa",
      "maxaad sameyn kartaa",
      "what can you do",
      "what can i ask you"
    ]
, 
    () => `Waxaan kaa caawin karaa customer, invoice, repair, product, report, iyo settings.`
, 
    [
      {
        "label": "Raadi invoice",
        "intent": "invoice.search",
        "commandText": "search invoice"
      },
      {
        "label": "Raadi customer",
        "intent": "customer.search",
        "commandText": "search customer"
      }
    ]
  ),
  entry(
    [
      "waan daalanahay",
      "waan daalan tahay",
      "i am tired",
      "i feel tired"
    ]
, 
    () => `Nasasho yar qaado boss. Hal amar ayaan hal mar qaban karnaa.`
, 
    [
      {
        "label": "I dhiirigeli",
        "intent": "assistant.motivation",
        "commandText": "i dhiirigeli"
      },
      {
        "label": "Kaftan ii sheeg",
        "intent": "assistant.help",
        "commandText": "kaftan ii sheeg"
      }
    ]
  ),
  entry(
    [
      "kaftan ii sheeg",
      "kaftan",
      "sheeko qosol leh",
      "joke"
    ]
, 
    () => `Taleefanka ayaa yiri: 'Waxaan rabaa network fiican.'`
, 
    [
      {
        "label": "Kaftan kale",
        "intent": "assistant.help",
        "commandText": "kaftan ii sheeg"
      },
      {
        "label": "Sheeko ii sheeg",
        "intent": "assistant.help",
        "commandText": "sheeko ii sheeg"
      }
    ]
  ),
  entry(
    [
      "sheeko ii sheeg",
      "sheeko",
      "story"
    ]
, 
    () => `Taleefan jabay ayaa la hagaajiyay, kadibna faraxsan ayuu baxay. Taasi waa dhammaad fiican.`
, 
    [
      {
        "label": "Kaftan",
        "intent": "assistant.help",
        "commandText": "kaftan ii sheeg"
      },
      {
        "label": "I dhiirigeli",
        "intent": "assistant.motivation",
        "commandText": "i dhiirigeli"
      }
    ]
  ),
  entry(
    [
      "mahadsanid",
      "waad mahadsan tahay",
      "thank you",
      "thanks"
    ]
, 
    () => `Adigaa mudan boss.`
, 
    [
      {
        "label": "Maanta report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Shortcuts",
        "intent": "assistant.shortcuts",
        "commandText": "00"
      }
    ]
  ),
  entry(
    [
      "i caawi",
      "caawi",
      "help me",
      "ii sheeg"
    ]
, 
    () => `Haa boss — waxaad i weydiin kartaa search, filter, print, report, ama settings.`
, 
    [
      {
        "label": "Maxaan ku weydiin karaa",
        "intent": "assistant.help",
        "commandText": "maxaan ku weydiin karaa"
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
      "maxaan ku weydiin karaa",
      "what can i ask you",
      "what do you do"
    ]
, 
    () => `Waxaad i weydiin kartaa lacag, stock, customer, invoice, repair, report, iyo settings.`
, 
    [
      {
        "label": "Raadi product",
        "intent": "product.search",
        "commandText": "search product"
      },
      {
        "label": "Raadi repair",
        "intent": "repair.search",
        "commandText": "search repair"
      }
    ]
  ),
  entry(
    [
      "waad salaaman tahay",
      "waad mahadsantahay",
      "hello there"
    ]
, 
    () => `Waa salaaman tahay boss.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
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
      "ii sheeg maanta report-ka",
      "maanta report",
      "today report"
    ]
, 
    () => `Haa boss, waxaan kuu soo bandhigi karaa maanta report-ka.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Weekly report",
        "intent": "report.weekly",
        "commandText": "weekly report"
      }
    ]
  ),
  entry(
    [
      "number-kan raadi",
      "raadi number-kan",
      "search this number"
    ]
, 
    () => `Geli number-ka saxda ah si aan u raadiyo.`
, 
    [
      {
        "label": "Search customer phone",
        "intent": "customer.search",
        "commandText": "search customer phone"
      },
      {
        "label": "Search invoice",
        "intent": "invoice.search",
        "commandText": "search invoice"
      }
    ]
  ),
  entry(
    [
      "customer-kan beddel",
      "edit customer",
      "beddel customer"
    ]
, 
    () => `Si aan u beddelo customer-ka, ii soo dir magaca, phone-ka, ama ID-ga.`
, 
    [
      {
        "label": "Search customer",
        "intent": "customer.search",
        "commandText": "search customer"
      },
      {
        "label": "Add customer",
        "intent": "customer.add",
        "commandText": "add customer"
      }
    ]
  ),
  entry(
    [
      "invoice-kan tirtir",
      "delete invoice",
      "erase invoice"
    ]
, 
    () => `Invoice-ka saxda ah ii soo dir si aan kuu caawiyo.`
, 
    [
      {
        "label": "Search invoice",
        "intent": "invoice.search",
        "commandText": "search invoice"
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
      "product-kan muujin",
      "show product",
      "muuji product"
    ]
, 
    () => `Waan kuu muujin karaa product-ka ama stock-ka aad rabto.`
, 
    [
      {
        "label": "Search product",
        "intent": "product.search",
        "commandText": "search product"
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
      "stock-kan eeg",
      "check stock",
      "stock view"
    ]
, 
    () => `Haa boss — stock-ka waan eegi karaa.`
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
      "salaan",
      "good morning",
      "good evening"
    ]
, 
    () => `Salaan wanaagsan boss.`
, 
    [
      {
        "label": "What can I ask you",
        "intent": "assistant.help",
        "commandText": "what can i ask you"
      },
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      }
    ]
  ),
];

export const ASSISTANT_SOMALI_QUICK_QUESTIONS = [
  {
    "label": "Salaam",
    "intent": "assistant.help",
    "commandText": "salaam"
  },
  {
    "label": "Sidee tahay",
    "intent": "assistant.help",
    "commandText": "sidee tahay"
  },
  {
    "label": "Magacaa",
    "intent": "assistant.help",
    "commandText": "magacaa"
  },
  {
    "label": "Maxaad qaban kartaa",
    "intent": "assistant.help",
    "commandText": "maxaad qaban kartaa"
  },
  {
    "label": "Waan daalanahay",
    "intent": "assistant.help",
    "commandText": "waan daalanahay"
  },
  {
    "label": "Kaftan ii sheeg",
    "intent": "assistant.help",
    "commandText": "kaftan ii sheeg"
  },
  {
    "label": "Sheeko ii sheeg",
    "intent": "assistant.help",
    "commandText": "sheeko ii sheeg"
  },
  {
    "label": "Mahadsanid",
    "intent": "assistant.help",
    "commandText": "mahadsanid"
  },
  {
    "label": "I caawi",
    "intent": "assistant.help",
    "commandText": "i caawi"
  },
  {
    "label": "Maxaan ku weydiin karaa",
    "intent": "assistant.help",
    "commandText": "maxaan ku weydiin karaa"
  },
  {
    "label": "Maanta report-ka",
    "intent": "report.today",
    "commandText": "ii sheeg maanta report-ka"
  },
  {
    "label": "Number-kan raadi",
    "intent": "assistant.help",
    "commandText": "number-kan raadi"
  },
  {
    "label": "Customer-kan beddel",
    "intent": "assistant.help",
    "commandText": "customer-kan beddel"
  },
  {
    "label": "Invoice-kan tirtir",
    "intent": "assistant.help",
    "commandText": "invoice-kan tirtir"
  },
  {
    "label": "Product-kan muujin",
    "intent": "assistant.help",
    "commandText": "product-kan muujin"
  },
  {
    "label": "Stock-kan eeg",
    "intent": "assistant.help",
    "commandText": "stock-kan eeg"
  },
  {
    "label": "Shortcuts",
    "intent": "assistant.shortcuts",
    "commandText": "00"
  }
];
