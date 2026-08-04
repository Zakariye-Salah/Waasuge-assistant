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

export const ASSISTANT_CHAT_BANK = [
  entry(
    [
      "hello",
      "hi",
      "salaam",
      "hey",
      "good morning",
      "good afternoon",
      "good evening"
    ]
, 
    () => `Hello boss — how can I help you today?`
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
  entry(
    [
      "how are you",
      "how are you doing",
      "are you okay",
      "how is it going"
    ]
, 
    () => `I am doing great and ready to help.`
, 
    [
      {
        "label": "Help me",
        "intent": "assistant.help",
        "commandText": "what can i ask you"
      },
      {
        "label": "Joke",
        "intent": "assistant.help",
        "commandText": "joke"
      }
    ]
  ),
  entry(
    [
      "what is your name",
      "who are you",
      "tell me your name",
      "assistant name"
    ]
, 
    () => `I am Waasuge Assistant, your local shop helper.`
, 
    [
      {
        "label": "What can you do",
        "intent": "assistant.help",
        "commandText": "what can you do"
      },
      {
        "label": "Shop name",
        "intent": "assistant.knowledge",
        "commandText": "shop name"
      }
    ]
  ),
  entry(
    [
      "what can you do",
      "what do you do",
      "help me",
      "show commands",
      "what can i ask you"
    ]
, 
    () => `I can help with products, invoices, repairs, customers, reports, settings, and quick shop questions.`
, 
    [
      {
        "label": "Search invoice",
        "intent": "invoice.search",
        "commandText": "search invoice 245"
      },
      {
        "label": "Low stock products",
        "intent": "product.filter",
        "commandText": "low stock products"
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
      "joke",
      "tell me a joke",
      "make me laugh",
      "funny",
      "kaftan"
    ]
, 
    () => `Why did the phone stay calm? Because it knew how to handle calls.`
, 
    [
      {
        "label": "Another joke",
        "intent": "assistant.help",
        "commandText": "joke"
      },
      {
        "label": "Roast me",
        "intent": "assistant.help",
        "commandText": "roast me"
      }
    ]
  ),
  entry(
    [
      "roast me",
      "light roast",
      "say something funny about me"
    ]
, 
    () => `You move fast now — even your problems are waiting for your response.`
, 
    [
      {
        "label": "Be nice",
        "intent": "assistant.help",
        "commandText": "be nice"
      },
      {
        "label": "Joke",
        "intent": "assistant.help",
        "commandText": "joke"
      }
    ]
  ),
  entry(
    [
      "thank you",
      "thanks",
      "much appreciated",
      "mahadsanid"
    ]
, 
    () => `You are welcome boss.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Show shortcuts",
        "intent": "assistant.shortcuts",
        "commandText": "00"
      }
    ]
  ),
  entry(
    [
      "bye",
      "goodbye",
      "see you",
      "good night",
      "later"
    ]
, 
    () => `Alright boss — I will be here when you come back.`
, 
    [
      {
        "label": "Close assistant",
        "intent": "assistant.help",
        "commandText": "close assistant"
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
      "i am tired",
      "im tired",
      "i feel tired",
      "bored",
      "waan daalanahay"
    ]
, 
    () => `Take a small break boss. One command at a time is enough.`
, 
    [
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      },
      {
        "label": "Tell me a joke",
        "intent": "assistant.help",
        "commandText": "joke"
      }
    ]
  ),
  entry(
    [
      "i am stressed",
      "i feel stressed",
      "so much work",
      "too busy"
    ]
, 
    () => `You are not alone — breathe, slow down, and handle the next task only.`
, 
    [
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      },
      {
        "label": "Help me plan",
        "intent": "assistant.help",
        "commandText": "help me"
      }
    ]
  ),
  entry(
    [
      "can we chat",
      "talk to me",
      "say something",
      "let us chat"
    ]
, 
    () => `Of course boss — I can chat while keeping things useful.`
, 
    [
      {
        "label": "Tell me a story",
        "intent": "assistant.help",
        "commandText": "tell me a story"
      },
      {
        "label": "Ask me something",
        "intent": "assistant.help",
        "commandText": "what can i ask you"
      }
    ]
  ),
  entry(
    [
      "tell me a story",
      "story please",
      "short story"
    ]
, 
    () => `A phone arrived broken, got repaired, and left smiling. That is a happy ending for the shop.`
, 
    [
      {
        "label": "Another one",
        "intent": "assistant.help",
        "commandText": "tell me a story"
      },
      {
        "label": "Joke",
        "intent": "assistant.help",
        "commandText": "joke"
      }
    ]
  ),
  entry(
    [
      "give me advice",
      "any advice",
      "wise words"
    ]
, 
    () => `Keep it simple: focus on one task, finish it, then move to the next.`
, 
    [
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
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
      "i am bored",
      "so bored",
      "nothing to do"
    ]
, 
    () => `Try a quick task: search invoices, check low stock, or open today report.`
, 
    [
      {
        "label": "Low stock products",
        "intent": "product.filter",
        "commandText": "low stock products"
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
      "good morning",
      "morning"
    ]
, 
    () => `Good morning boss — let us make the shop day productive.`
, 
    [
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      },
      {
        "label": "Search customer",
        "intent": "customer.search",
        "commandText": "search customer name"
      }
    ]
  ),
  entry(
    [
      "good evening",
      "evening"
    ]
, 
    () => `Good evening boss — I am ready when you are.`
, 
    [
      {
        "label": "Weekly report",
        "intent": "report.weekly",
        "commandText": "weekly report"
      },
      {
        "label": "Open settings",
        "intent": "settings.open",
        "commandText": "settings"
      }
    ]
  ),
  entry(
    [
      "sorry",
      "my bad",
      "apologies"
    ]
, 
    () => `No problem boss — tell me the next command.`
, 
    [
      {
        "label": "What can I ask you",
        "intent": "assistant.help",
        "commandText": "what can i ask you"
      },
      {
        "label": "Repeat last command",
        "intent": "assistant.help",
        "commandText": "repeat last command"
      }
    ]
  ),
  entry(
    [
      "repeat",
      "say again",
      "repeat that"
    ]
, 
    () => `I can repeat the last command or help you rephrase it.`
, 
    [
      {
        "label": "Repeat last command",
        "intent": "assistant.help",
        "commandText": "repeat last command"
      },
      {
        "label": "Help",
        "intent": "assistant.help",
        "commandText": "help"
      }
    ]
  ),
  entry(
    [
      "what time is it",
      "time now",
      "what is the time now"
    ]
, 
    () => { const now = new Date(); return `The time now is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`; }
, 
    [
      {
        "label": "What is the date now",
        "intent": "assistant.help",
        "commandText": "what is the date now"
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
      "what is the date now",
      "date now",
      "what day is today"
    ]
, 
    () => { const now = new Date(); return `Today is ${now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`; }
, 
    [
      {
        "label": "What is the time now",
        "intent": "assistant.help",
        "commandText": "what is the time now"
      },
      {
        "label": "Today report",
        "intent": "report.today",
        "commandText": "today report"
      }
    ]
  ),
];

export const ASSISTANT_CHAT_QUICK_QUESTIONS = [
  {
    "label": "Hello",
    "intent": "assistant.help",
    "commandText": "hello"
  },
  {
    "label": "How are you",
    "intent": "assistant.help",
    "commandText": "how are you"
  },
  {
    "label": "What can you do",
    "intent": "assistant.help",
    "commandText": "what can you do"
  },
  {
    "label": "Tell me a joke",
    "intent": "assistant.help",
    "commandText": "joke"
  },
  {
    "label": "Roast me",
    "intent": "assistant.help",
    "commandText": "roast me"
  },
  {
    "label": "What is the time now",
    "intent": "assistant.help",
    "commandText": "what is the time now"
  },
  {
    "label": "What is the date now",
    "intent": "assistant.help",
    "commandText": "what is the date now"
  },
  {
    "label": "What can I ask you",
    "intent": "assistant.help",
    "commandText": "what can i ask you"
  },
  {
    "label": "I am tired",
    "intent": "assistant.help",
    "commandText": "waan daalanahay"
  },
  {
    "label": "Good morning",
    "intent": "assistant.help",
    "commandText": "good morning"
  },
  {
    "label": "Good evening",
    "intent": "assistant.help",
    "commandText": "good evening"
  },
  {
    "label": "Thank you",
    "intent": "assistant.help",
    "commandText": "thank you"
  },
  {
    "label": "Bye",
    "intent": "assistant.help",
    "commandText": "bye"
  },
  {
    "label": "Repeat last command",
    "intent": "assistant.help",
    "commandText": "repeat last command"
  },
  {
    "label": "Tell me a story",
    "intent": "assistant.help",
    "commandText": "tell me a story"
  },
  {
    "label": "Give me advice",
    "intent": "assistant.help",
    "commandText": "give me advice"
  },
  {
    "label": "I am stressed",
    "intent": "assistant.help",
    "commandText": "i am stressed"
  },
  {
    "label": "I am bored",
    "intent": "assistant.help",
    "commandText": "i am bored"
  }
];
