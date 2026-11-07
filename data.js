// Health Assistant — static data file (plain script, no modules).
// All user-visible strings are in Burmese (Myanmar script).
// Attached to window: FOOD_DB, DRUG_INTERACTIONS, COMMON_SYMPTOMS, normalizeDrugName.

window.FOOD_DB = [
  // ---- Staples / rice ----
  { name: "ထမင်း", kcal: 206, unit: "ပန်းကန် ၁" },
  { name: "ထမင်းကြော်", kcal: 380, unit: "ပန်းကန် ၁" },
  { name: "ပဲပြုတ်ထမင်း", kcal: 340, unit: "ပန်းကန် ၁" },
  { name: "ဒံပေါက်", kcal: 620, unit: "ပန်းကန် ၁" },

  // ---- Curries / mains ----
  { name: "ကြက်သားဟင်း", kcal: 250, unit: "ပွဲ ၁" },
  { name: "ဝက်သားဟင်း", kcal: 320, unit: "ပွဲ ၁" },
  { name: "ငါးဟင်း", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ကြက်ဥကြော်", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ကြက်ဥပြုတ်", kcal: 155, unit: "လုံး ၁" },
  { name: "ပဲဟင်း", kcal: 160, unit: "ပန်းကန် ၁" },
  { name: "ချဉ်ပေါင်ဟင်း", kcal: 120, unit: "ပန်းကန် ၁" },
  { name: "ကန်စွန်းရွက်ကြော်", kcal: 90, unit: "ပန်းကန် ၁" },
  { name: "ဟင်းနုနွယ်ကြော်", kcal: 80, unit: "ပန်းကန် ၁" },
  { name: "တို့ဟူးကြော်", kcal: 220, unit: "ပွဲ ၁" },
  { name: "တို့ဟူးနွေး", kcal: 200, unit: "ပွဲ ၁" },

  // ---- Noodles / mohinga ----
  { name: "မုန့်ဟင်းခါး", kcal: 450, unit: "ပန်းကန် ၁" },
  { name: "အုန်းနို့ခေါက်ဆွဲ", kcal: 520, unit: "ပန်းကန် ၁" },
  { name: "ရှမ်းခေါက်ဆွဲ", kcal: 430, unit: "ပန်းကန် ၁" },
  { name: "နန်းကြီးသုပ်", kcal: 380, unit: "ပန်းကန် ၁" },
  { name: "ကြာဇံချက်", kcal: 320, unit: "ပန်းကန် ၁" },
  { name: "ခေါက်ဆွဲကြော်", kcal: 480, unit: "ပန်းကန် ၁" },
  { name: "မုန့်တီ", kcal: 350, unit: "ပန်းကန် ၁" },

  // ---- Salads / snacks ----
  { name: "ငါးထမင်းနယ်", kcal: 320, unit: "ပန်းကန် ၁" },
  { name: "ငါးဖယ်သုပ်", kcal: 240, unit: "ပန်းကန် ၁" },
  { name: "သရက်သီးသုပ်", kcal: 150, unit: "ပန်းကန် ၁" },
  { name: "ဆမူဆာ", kcal: 120, unit: "လုံး ၁" },
  { name: "အီကြာကွေး", kcal: 210, unit: "ချောင်း ၁" },
  { name: "နန်းပြား", kcal: 150, unit: "ပြား ၁" },
  { name: "ပလာတာ", kcal: 290, unit: "ပြား ၁" },

  // ---- Grilled / fried ----
  { name: "ကြက်ကင်", kcal: 240, unit: "ဖတ် ၁" },
  { name: "ငါးကင်", kcal: 190, unit: "ကောင် ၁" },
  { name: "ဝက်အူချောင်း", kcal: 170, unit: "ချောင်း ၁" },
  { name: "ကြက်ကြော်", kcal: 320, unit: "ဖတ် ၁" },
  { name: "အာလူးကြော်", kcal: 365, unit: "ထုပ် ၁" },

  // ---- Desserts / sweets ----
  { name: "ရွှေရင်အေး", kcal: 280, unit: "ခွက် ၁" },
  { name: "သာကူ", kcal: 220, unit: "ခွက် ၁" },
  { name: "ကောက်ညှင်းပေါင်း", kcal: 310, unit: "ထုပ် ၁" },
  { name: "ကိတ်မုန့်", kcal: 350, unit: "ဖတ် ၁" },
  { name: "ဒိုးနတ်", kcal: 260, unit: "လုံး ၁" },
  { name: "ရေခဲမုန့်", kcal: 210, unit: "ခွက် ၁" },

  // ---- Drinks ----
  { name: "လက်ဖက်ရည်", kcal: 110, unit: "ခွက် ၁" },
  { name: "ကော်ဖီနို့", kcal: 95, unit: "ခွက် ၁" },
  { name: "သံပုရာရည်", kcal: 60, unit: "ခွက် ၁" },
  { name: "ကြံရည်", kcal: 120, unit: "ခွက် ၁" },
  { name: "နွားနို့", kcal: 150, unit: "ခွက် ၁" },
  { name: "ပဲနို့", kcal: 80, unit: "ခွက် ၁" },
  { name: "ဒိန်ချဉ်", kcal: 110, unit: "ခွက် ၁" },

  // ---- Fruits ----
  { name: "ပန်းသီး", kcal: 95, unit: "လုံး ၁" },
  { name: "ငှက်ပျောသီး", kcal: 105, unit: "လုံး ၁" },
  { name: "လိမ္မော်", kcal: 62, unit: "လုံး ၁" },
  { name: "သရက်သီး", kcal: 99, unit: "လုံး ၁" },
  { name: "ဖရဲသီး", kcal: 46, unit: "ဖတ် ၁" },
  { name: "ထောပတ်သီး", kcal: 240, unit: "လုံး ၁" },
  { name: "ဒူးရင်းသီး", kcal: 147, unit: "ဖတ် ၁" },

  // ---- Western / misc ----
  { name: "မြေပဲ", kcal: 285, unit: "လက် ၁ ဆုပ်" },
  { name: "ပီဇာ", kcal: 285, unit: "ဖတ် ၁" },
  { name: "ဘာဂါ", kcal: 550, unit: "လုံး ၁" },
  { name: "စမူဆာကြက်", kcal: 310, unit: "ထုပ် ၁" },
  { name: "ကောက်ညှင်းထုပ်", kcal: 220, unit: "ထုပ် ၁" },
  { name: "ပဲကြာဇံကြော်", kcal: 290, unit: "ပန်းကန် ၁" },

  // ---- Beef ----
  { name: "အမဲသားဟင်း", kcal: 320, unit: "ပွဲ ၁" },
  { name: "အမဲသားကြော်", kcal: 350, unit: "ပွဲ ၁" },
  { name: "အမဲသားသုပ်", kcal: 220, unit: "ပန်းကန် ၁" },
  { name: "အမဲနှပ်", kcal: 380, unit: "ပွဲ ၁" },
  { name: "အမဲခြောက်ကြော်", kcal: 300, unit: "ပွဲ ၁" },
  { name: "အမဲကလီစာဟင်း", kcal: 280, unit: "ပွဲ ၁" },

  // ---- Goat ----
  { name: "ဆိတ်သားဟင်း", kcal: 340, unit: "ပွဲ ၁" },
  { name: "ဆိတ်သားကြော်", kcal: 360, unit: "ပွဲ ၁" },
  { name: "ဆိတ်သားသုပ်", kcal: 230, unit: "ပန်းကန် ၁" },
  { name: "ဆိတ်သားနှပ်", kcal: 400, unit: "ပွဲ ၁" },

  // ---- Ngapi / fish paste ----
  { name: "ငါးပိရည်", kcal: 70, unit: "ပန်းကန် ၁" },
  { name: "ငံပြာရည်ကြော်", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ငါးပိထောင်း", kcal: 150, unit: "ပွဲ ၁" },
  { name: "ငါးပိချက်", kcal: 200, unit: "ပွဲ ၁" },
  { name: "ငါးပိရည်တို့စရာ", kcal: 90, unit: "ပွဲ ၁" },

  // ---- More curries / mains ----
  { name: "ဘဲသားဟင်း", kcal: 300, unit: "ပွဲ ၁" },
  { name: "ငါးကြင်းဟင်း", kcal: 200, unit: "ပွဲ ၁" },
  { name: "ငါးသလောက်ဟင်း", kcal: 190, unit: "ပွဲ ၁" },
  { name: "ပုစွန်ဟင်း", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ဂဏန်းဟင်း", kcal: 160, unit: "ပွဲ ၁" },
  { name: "မှိုဟင်း", kcal: 100, unit: "ပန်းကန် ၁" },
  { name: "ဗူးသီးဟင်း", kcal: 90, unit: "ပန်းကန် ၁" },
  { name: "ခရမ်းသီးဟင်း", kcal: 110, unit: "ပန်းကန် ၁" },
  { name: "ဖရုံသီးဟင်း", kcal: 100, unit: "ပန်းကန် ၁" },
  { name: "ကြက်သားဆီပြန်", kcal: 280, unit: "ပွဲ ၁" },
  { name: "ငါးဖယ်ဟင်း", kcal: 200, unit: "ပွဲ ၁" },
  { name: "ဝက်နံရိုးဟင်း", kcal: 380, unit: "ပွဲ ၁" },
  { name: "ဟင်းချိုသီးစုံ", kcal: 80, unit: "ပန်းကန် ၁" },
  { name: "မျှစ်ဟင်း", kcal: 90, unit: "ပန်းကန် ၁" },

  // ---- Vegetables / salads ----
  { name: "လက်ဖက်သုပ်", kcal: 180, unit: "ပန်းကန် ၁" },
  { name: "ခရမ်းချဉ်သီးသုပ်", kcal: 90, unit: "ပန်းကန် ၁" },
  { name: "ပဲပင်ပေါက်သုပ်", kcal: 100, unit: "ပန်းကန် ၁" },
  { name: "ဗမာသုပ်", kcal: 200, unit: "ပန်းကန် ၁" },
  { name: "သခွားသီးသုပ်", kcal: 70, unit: "ပန်းကန် ၁" },
  { name: "ဂေါ်ဖီသုပ်", kcal: 80, unit: "ပန်းကန် ၁" },
  { name: "ဟင်းသီးဟင်းရွက်ကြော်", kcal: 110, unit: "ပန်းကန် ၁" },
  { name: "ကြောင်လျှာသီးကြော်", kcal: 100, unit: "ပန်းကန် ၁" },
  { name: "ဒန့်သလွန်သီးဟင်း", kcal: 110, unit: "ပန်းကန် ၁" },
  { name: "ဗူးသီးကြော်", kcal: 80, unit: "ပန်းကန် ၁" },
  { name: "ပဲသီးကြော်", kcal: 90, unit: "ပန်းကန် ၁" },
  { name: "မုန်ညှင်းကြော်", kcal: 80, unit: "ပန်းကန် ၁" },

  // ---- Rice / noodles / breakfast ----
  { name: "ဆီထမင်း", kcal: 420, unit: "ပန်းကန် ၁" },
  { name: "စမူဆာသုပ်", kcal: 260, unit: "ပန်းကန် ၁" },
  { name: "နန်းပြားသုပ်", kcal: 300, unit: "ပန်းကန် ၁" },
  { name: "မုန့်ဖက်ထုပ်", kcal: 280, unit: "ပွဲ ၁" },
  { name: "ထမင်းသုပ်", kcal: 320, unit: "ပန်းကန် ၁" },
  { name: "ခေါက်ဆွဲသုပ်", kcal: 400, unit: "ပန်းကန် ၁" },
  { name: "ကြာဇံသုပ်", kcal: 280, unit: "ပန်းကန် ၁" },
  { name: "ရခိုင်မုန့်တီ", kcal: 380, unit: "ပန်းကန် ၁" },
  { name: "မုန့်ညှင်းပေါင်း", kcal: 260, unit: "ထုပ် ၁" },
  { name: "ခေါက်ဆွဲပြုတ်", kcal: 350, unit: "ပန်းကန် ၁" },
  { name: "ငါးထမင်းကြော်", kcal: 380, unit: "ပန်းကန် ၁" },
  { name: "ကြက်သားခေါက်ဆွဲ", kcal: 420, unit: "ပန်းကန် ၁" },

  // ---- Snacks / street food ----
  { name: "ဗယာကြော်", kcal: 200, unit: "ပွဲ ၁" },
  { name: "မတ်ပဲကြော်", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ပဲကြော်", kcal: 190, unit: "ပွဲ ၁" },
  { name: "ငှက်ပျောကြော်", kcal: 220, unit: "ပွဲ ၁" },
  { name: "ငါးမုန့်ကြော်", kcal: 240, unit: "ပွဲ ၁" },
  { name: "မုန့်လုံးရေပေါ်", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ရွှေကြည်", kcal: 250, unit: "ဖတ် ၁" },
  { name: "ဆနွင်းမကင်း", kcal: 230, unit: "ဖတ် ၁" },
  { name: "ကျောက်ကျော", kcal: 90, unit: "ဖတ် ၁" },
  { name: "မုန့်လက်ဆောင်း", kcal: 200, unit: "ခွက် ၁" },
  { name: "ထိုးမုန့်", kcal: 210, unit: "ဖတ် ၁" },
  { name: "မုန့်ကျွဲသဲ", kcal: 260, unit: "ဖတ် ၁" },

  // ---- Fruits ----
  { name: "နာနတ်သီး", kcal: 50, unit: "ဖတ် ၁" },
  { name: "သင်္ဘောသီး", kcal: 120, unit: "ဖတ် ၁" },
  { name: "မင်းကွတ်သီး", kcal: 70, unit: "လုံး ၁" },
  { name: "ကြက်မောက်သီး", kcal: 60, unit: "လုံး ၁" },
  { name: "စပျစ်သီး", kcal: 70, unit: "လက် ၁ ဆုပ်" },
  { name: "စတော်ဘယ်ရီသီး", kcal: 50, unit: "ပန်းကန် ၁" },
  { name: "သလဲသီး", kcal: 80, unit: "လုံး ၁" },
  { name: "ကီဝီသီး", kcal: 60, unit: "လုံး ၁" },
  { name: "ပိန္နဲသီး", kcal: 95, unit: "ဖတ် ၁" },
  { name: "ဇီးသီး", kcal: 70, unit: "လုံး ၁" },

  // ---- Drinks ----
  { name: "ကော်ဖီ", kcal: 10, unit: "ခွက် ၁" },
  { name: "အုန်းရည်", kcal: 45, unit: "ခွက် ၁" },
  { name: "လိမ္မော်ရည်", kcal: 110, unit: "ခွက် ၁" },
  { name: "ပန်းသီးရည်", kcal: 115, unit: "ခွက် ၁" },
  { name: "နာနတ်ရည်", kcal: 130, unit: "ခွက် ၁" },
  { name: "သရက်ရည်", kcal: 140, unit: "ခွက် ၁" },
  { name: "ရေနွေးကြမ်း", kcal: 5, unit: "ခွက် ၁" },
  { name: "သကြားရည်", kcal: 120, unit: "ခွက် ၁" },

  // ---- Desserts / sweets ----
  { name: "မုန့်လင်မယား", kcal: 180, unit: "စုံ ၁" },
  { name: "ပေါက်စီ", kcal: 250, unit: "လုံး ၁" },
  { name: "ဖာလူဒါ", kcal: 300, unit: "ခွက် ၁" },
  { name: "ကျောက်ကျောနဲ့နို့", kcal: 150, unit: "ခွက် ၁" },
  { name: "ထမနဲ", kcal: 280, unit: "ထုပ် ၁" },
  { name: "မုန့်စိမ်းပေါင်း", kcal: 220, unit: "ထုပ် ၁" },
  { name: "အုန်းနို့သာကူ", kcal: 240, unit: "ခွက် ၁" },

  // ---- Grilled / braised / everyday ----
  { name: "ကြက်ဥဟင်း", kcal: 200, unit: "ပွဲ ၁" },
  { name: "ငါးခြောက်ကြော်", kcal: 180, unit: "ပွဲ ၁" },
  { name: "ငါးခြောက်ဖုတ်", kcal: 150, unit: "ပွဲ ၁" },
  { name: "ဝက်သားကင်", kcal: 300, unit: "ဖတ် ၁" },
  { name: "ငါးသလောက်ကင်", kcal: 220, unit: "ကောင် ၁" },
  { name: "အမဲသားကင်", kcal: 280, unit: "ဖတ် ၁" },
  { name: "ဝက်သားနှပ်", kcal: 400, unit: "ပွဲ ၁" },
  { name: "ကြက်သားနှပ်", kcal: 350, unit: "ပွဲ ၁" },
  { name: "ငါးဖယ်ကြော်", kcal: 230, unit: "ပွဲ ၁" },
  { name: "ခရမ်းချဉ်သီးဟင်း", kcal: 100, unit: "ပန်းကန် ၁" }
];

// Common drug-drug interactions.
// drugs: two lowercase generic names. level: "high" | "medium" | "low".
// noteMm: Burmese explanation of the risk (informational only, not medical advice).
window.DRUG_INTERACTIONS = [
  { drugs: ["warfarin", "aspirin"], level: "high", noteMm: "သွေးထွက်နိုင်ခြေ များစေသည်။" },
  { drugs: ["warfarin", "ibuprofen"], level: "high", noteMm: "သွေးထွက်နိုင်ခြေ များစေသည်။ အစာအိမ်သွေးထွက်နိုင်သည်။" },
  { drugs: ["aspirin", "ibuprofen"], level: "medium", noteMm: "အစာအိမ်နာရောင်၊ သွေးထွက်နိုင်ခြေ များစေသည်။" },
  { drugs: ["metformin", "alcohol"], level: "medium", noteMm: "သွေးထဲမှာ လက်တစ်အက်ဆစ် များလာနိုင်သည်။" },
  { drugs: ["lisinopril", "potassium"], level: "high", noteMm: "သွေးတွင်း ပိုတက်ဆီယမ် အလွန်အမင်း များစေနိုင်သည်။" },
  { drugs: ["lisinopril", "ibuprofen"], level: "medium", noteMm: "ကျောက်ကပ် ထိခိုက်နိုင်ပြီး သွေးပေါင်ကျ ဆေးအာနိသင် လျော့နိုင်သည်။" },
  { drugs: ["atorvastatin", "grapefruit"], level: "medium", noteMm: "ဆေး၏ သွေးတွင်းပမာဏ များစေပြီး ကြွက်သားထိခိုက်နိုင်ခြေ တိုးသည်။" },
  { drugs: ["amlodipine", "grapefruit"], level: "medium", noteMm: "သွေးပေါင် အလွန်ကျနိုင်ခြေ ရှိသည်။" },
  { drugs: ["levothyroxine", "calcium"], level: "medium", noteMm: "သိုင်းရွိုက်ဆေး စုပ်ယူမှု လျော့နည်းစေသည်။" },
  { drugs: ["levothyroxine", "iron"], level: "medium", noteMm: "သိုင်းရွိုက်ဆေး စုပ်ယူမှု လျော့နည်းစေသည်။" },
  { drugs: ["omeprazole", "clopidogrel"], level: "high", noteMm: "သွေးကျဲဆေး အာနိသင် လျော့ကျစေနိုင်သည်။" },
  { drugs: ["fluoxetine", "tramadol"], level: "high", noteMm: "ဆီရိုတိုနင် ဆိုးဝါးသည့် လက္ခဏာ (serotonin syndrome) ဖြစ်နိုင်သည်။" },
  { drugs: ["sertraline", "ibuprofen"], level: "medium", noteMm: "သွေးထွက်နိုင်ခြေ တိုးနိုင်သည်။" },
  { drugs: ["metoprolol", "verapamil"], level: "high", noteMm: "နှလုံးခုန် နှေးလွန်းပြီး သွေးပေါင် အလွန်ကျနိုင်သည်။" },
  { drugs: ["digoxin", "furosemide"], level: "high", noteMm: "ပိုတက်ဆီယမ် လျော့သွားပြီး နှလုံးဆေးအဆိပ် သက်ရောက်မှု များစေသည်။" },
  { drugs: ["furosemide", "ibuprofen"], level: "medium", noteMm: "ဆီးဆေး အာနိသင် လျော့ကျစေနိုင်သည်။" },
  { drugs: ["insulin", "alcohol"], level: "high", noteMm: "သွေးသကြားဓာတ် အလွန်ကျဆင်းနိုင်သည်။" },
  { drugs: ["glipizide", "alcohol"], level: "high", noteMm: "သွေးသကြားဓာတ် အလွန်ကျဆင်းနိုင်သည်။" },
  { drugs: ["prednisone", "ibuprofen"], level: "medium", noteMm: "အစာအိမ်နာနှင့် သွေးထွက်နိုင်ခြေ များစေသည်။" },
  { drugs: ["ciprofloxacin", "calcium"], level: "medium", noteMm: "ပဋိဇီဝဆေး စုပ်ယူမှု လျော့နည်းစေသည်။" },
  { drugs: ["tetracycline", "milk"], level: "medium", noteMm: "နို့ထဲရှိ ကယ်လ်ဆီယမ်က ဆေး စုပ်ယူမှု လျော့နည်းစေသည်။" },
  { drugs: ["sildenafil", "nitroglycerin"], level: "high", noteMm: "သွေးပေါင် အလွန်အမင်း ကျနိုင်ပြီး အန္တရာယ် ကြီးမားသည်။" },
  { drugs: ["carbamazepine", "grapefruit"], level: "medium", noteMm: "ဆေးပမာဏ သွေးတွင်း များစေပြီး အဆိပ်သက်ရောက်မှု ဖြစ်နိုင်သည်။" },
  { drugs: ["lithium", "ibuprofen"], level: "high", noteMm: "သွေးတွင်း လီသီယမ် ပမာဏ များစေပြီး အဆိပ်ဖြစ်နိုင်သည်။" },
  { drugs: ["methotrexate", "ibuprofen"], level: "high", noteMm: "မက်သထရက်ဇိတ် အဆိပ်သက်ရောက်မှု များစေနိုင်သည်။" },
  { drugs: ["theophylline", "ciprofloxacin"], level: "medium", noteMm: "သွေးတွင်း သီအိုဖိုင်လင် ပမာဏ များစေနိုင်သည်။" },
  { drugs: ["spironolactone", "potassium"], level: "high", noteMm: "သွေးတွင်း ပိုတက်ဆီယမ် အလွန်များနိုင်သည်။" },
  { drugs: ["tramadol", "alcohol"], level: "high", noteMm: "အသက်ရှူ နှေးကွေးပြီး မူးဝေ အန္တရာယ် ကြီးမားသည်။" },
  { drugs: ["paracetamol", "alcohol"], level: "medium", noteMm: "အသည်းထိခိုက်နိုင်ခြေ များစေသည်။" },
  { drugs: ["allopurinol", "azathioprine"], level: "high", noteMm: "အဇာသီယိုပရင် အဆိပ်သက်ရောက်မှု အလွန်များစေနိုင်သည်။" }
];

// Common symptom names in Burmese.
window.COMMON_SYMPTOMS = [
  "ခေါင်းကိုက်",
  "ဖျားနာ",
  "ချောင်းဆိုး",
  "လည်ချောင်းနာ",
  "ဗိုက်နာ",
  "ဝမ်းလျှော",
  "ဝမ်းချုပ်",
  "ပျို့အန်",
  "မူးဝေ",
  "မောပန်း",
  "အိပ်မပျော်",
  "အိပ်မက်ဆိုး",
  "ရင်တုန်",
  "အသက်ရှူကြပ်",
  "အရေပြားယား",
  "ကြွက်သားနာ",
  "အဆစ်နာ",
  "မျက်စိနာ"
];

// Normalize a drug name for comparison: lowercase + trim.
window.normalizeDrugName = function (s) {
  return String(s || "").toLowerCase().trim();
};
