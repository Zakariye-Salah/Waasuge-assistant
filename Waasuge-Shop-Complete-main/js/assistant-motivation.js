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

export const ASSISTANT_MOTIVATION_BANK = [
  entry(
    [
      "i am tired",
      "im tired",
      "too tired",
      "exhausted",
      "burned out",
      "waan daalanahay"
    ]
, 
    () => `Take a small break. One step at a time is enough.`
, 
    [
      {
        "label": "Keep me going",
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
      "too much work",
      "overwhelmed"
    ]
, 
    () => `Breathe slowly, boss. Finish one small task first.`
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
      "i am afraid",
      "i am scared",
      "worried",
      "nervous"
    ]
, 
    () => `You can do hard things. Start with the next simple step.`
, 
    [
      {
        "label": "Give advice",
        "intent": "assistant.help",
        "commandText": "give me advice"
      },
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      }
    ]
  ),
  entry(
    [
      "i failed",
      "i made a mistake",
      "i messed up",
      "failure"
    ]
, 
    () => `A mistake is not the end. Fix it, learn from it, and continue.`
, 
    [
      {
        "label": "Try again",
        "intent": "assistant.motivation",
        "commandText": "try again"
      },
      {
        "label": "Give advice",
        "intent": "assistant.help",
        "commandText": "give me advice"
      }
    ]
  ),
  entry(
    [
      "i want to quit",
      "give up",
      "i feel like quitting"
    ]
, 
    () => `Do not quit on a hard moment. Pause, reset, then continue.`
, 
    [
      {
        "label": "Keep going",
        "intent": "assistant.motivation",
        "commandText": "keep going"
      },
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      }
    ]
  ),
  entry(
    [
      "i am lazy",
      "no motivation",
      "low energy"
    ]
, 
    () => `Start with two minutes of work. Momentum usually follows action.`
, 
    [
      {
        "label": "One more step",
        "intent": "assistant.motivation",
        "commandText": "one more step"
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
      "exam",
      "exams",
      "study stress",
      "test anxiety"
    ]
, 
    () => `Study a little now, rest a little, and keep repeating. Consistency wins.`
, 
    [
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      },
      {
        "label": "Give advice",
        "intent": "assistant.help",
        "commandText": "give me advice"
      }
    ]
  ),
  entry(
    [
      "i need encouragement",
      "encourage me",
      "motivate me",
      "i dhiirigeli"
    ]
, 
    () => `You are stronger than today's pressure. Keep moving.`
, 
    [
      {
        "label": "Keep going",
        "intent": "assistant.motivation",
        "commandText": "keep going"
      },
      {
        "label": "Tell me a story",
        "intent": "assistant.help",
        "commandText": "tell me a story"
      }
    ]
  ),
  entry(
    [
      "i am sad",
      "feeling sad",
      "down",
      "depressed"
    ]
, 
    () => `I am sorry you feel that way. Take one calm breath and ask for help from someone you trust.`
, 
    [
      {
        "label": "Talk to me",
        "intent": "assistant.help",
        "commandText": "can we chat"
      },
      {
        "label": "Give advice",
        "intent": "assistant.help",
        "commandText": "give me advice"
      }
    ]
  ),
  entry(
    [
      "hard day",
      "difficult day",
      "bad day"
    ]
, 
    () => `A hard day does not mean a hard life. Rest, then continue.`
, 
    [
      {
        "label": "Joke",
        "intent": "assistant.help",
        "commandText": "joke"
      },
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      }
    ]
  ),
  entry(
    [
      "discipline",
      "consistency",
      "keep going",
      "stay focused"
    ]
, 
    () => `Small repeated actions beat big random effort.`
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
      "prayer",
      "pray for me",
      "duco ii samee"
    ]
, 
    () => `May you be granted peace, focus, and success in your work.`
, 
    [
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      },
      {
        "label": "Be positive",
        "intent": "assistant.help",
        "commandText": "give me advice"
      }
    ]
  ),
  entry(
    [
      "success",
      "i want success",
      "work hard"
    ]
, 
    () => `Success comes from showing up, staying calm, and finishing the next task.`
, 
    [
      {
        "label": "Keep going",
        "intent": "assistant.motivation",
        "commandText": "keep going"
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
      "business stress",
      "shop stress",
      "shop is busy"
    ]
, 
    () => `Busy shops grow through calm systems. Handle one issue at a time.`
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
      "sleepy",
      "i need rest",
      "i need a break"
    ]
, 
    () => `Take a short break, then come back fresh.`
, 
    [
      {
        "label": "Repeat last command",
        "intent": "assistant.help",
        "commandText": "repeat last command"
      },
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      }
    ]
  ),
  entry(
    [
      "one step at a time",
      "slow progress",
      "small progress"
    ]
, 
    () => `That is the right mindset. Slow progress is still progress.`
, 
    [
      {
        "label": "Give advice",
        "intent": "assistant.help",
        "commandText": "give me advice"
      },
      {
        "label": "Motivate me",
        "intent": "assistant.motivation",
        "commandText": "motivate me"
      }
    ]
  ),
];

export const ASSISTANT_MOTIVATION_QUICK_QUESTIONS = [
  {
    "label": "Motivate me",
    "intent": "assistant.motivation",
    "commandText": "motivate me"
  },
  {
    "label": "I am tired",
    "intent": "assistant.motivation",
    "commandText": "i am tired"
  },
  {
    "label": "I am stressed",
    "intent": "assistant.motivation",
    "commandText": "i am stressed"
  },
  {
    "label": "I feel sad",
    "intent": "assistant.motivation",
    "commandText": "i am sad"
  },
  {
    "label": "I want to quit",
    "intent": "assistant.motivation",
    "commandText": "i want to quit"
  },
  {
    "label": "I failed",
    "intent": "assistant.motivation",
    "commandText": "i failed"
  },
  {
    "label": "Give advice",
    "intent": "assistant.help",
    "commandText": "give me advice"
  },
  {
    "label": "Keep going",
    "intent": "assistant.motivation",
    "commandText": "keep going"
  },
  {
    "label": "Pray for me",
    "intent": "assistant.motivation",
    "commandText": "prayer"
  },
  {
    "label": "Exam motivation",
    "intent": "assistant.motivation",
    "commandText": "exam"
  },
  {
    "label": "Consistency",
    "intent": "assistant.motivation",
    "commandText": "consistency"
  },
  {
    "label": "One more step",
    "intent": "assistant.motivation",
    "commandText": "one more step"
  },
  {
    "label": "Hard day",
    "intent": "assistant.motivation",
    "commandText": "hard day"
  },
  {
    "label": "Rest a little",
    "intent": "assistant.motivation",
    "commandText": "i need rest"
  },
  {
    "label": "Business stress",
    "intent": "assistant.motivation",
    "commandText": "business stress"
  }
];
