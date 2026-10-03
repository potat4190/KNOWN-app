# Builds relay/test-set.jsonl: a review scaffold of 200 sentences (40 situations x 5 languages)
# for Kezia's safeguarding review and for checking the matcher. DRAFTED, not reviewed.
# Crisis items are short test phrases only. `expect` is the team's hoped-for story key
# (or "any" when several fit); `risk` must be true for crisis phrasing.
import json, os

S = [
 # (expect, risk, en, my, zh, ja, ar)
 ("neh", False, "I can't reach my family anymore.", "မိသားစုကို မဆက်သွယ်နိုင်တော့ဘူး။", "我联系不上我的家人了。", "家族と連絡がとれなくなった。", "لم أعد أستطيع الوصول إلى عائلتي."),
 ("neh", False, "The news from my country scares me.", "ကိုယ့်နိုင်ငံက သတင်းတွေက ကြောက်စရာကောင်းတယ်။", "家乡的新闻让我害怕。", "国のニュースがこわい。", "أخبار بلدي تخيفني."),
 ("neh", False, "There is war at home and I am here studying.", "အိမ်မှာ စစ်ဖြစ်နေပြီး ကျွန်ုပ်က ဒီမှာ ကျောင်းတက်နေတယ်။", "家乡在打仗，而我在这里读书。", "国では戦争があり、私はここで勉強している。", "هناك حرب في بلدي وأنا هنا أدرس."),
 ("neh", False, "My parents have not answered for a week.", "မိဘတွေက တစ်ပတ်လုံး မဖြေသေးဘူး။", "我父母一个星期没有回复了。", "両親から一週間返事がない。", "والداي لم يردّا منذ أسبوع."),
 ("ps142", False, "I feel completely alone here.", "ဒီမှာ တစ်ယောက်တည်း ဖြစ်နေသလို ခံစားရတယ်။", "我在这里觉得完全孤单。", "ここでは本当にひとりぼっちだ。", "أشعر أنني وحيد تمامًا هنا."),
 ("ps142", False, "Nobody here really knows me.", "ဒီမှာ ကျွန်ုပ်ကို တကယ်သိတဲ့သူ မရှိဘူး။", "这里没有人真正认识我。", "ここには本当に私を知っている人がいない。", "لا أحد هنا يعرفني حقًا."),
 ("ps142", False, "I eat every meal by myself.", "ထမင်းကို တစ်ယောက်တည်းပဲ စားတယ်။", "我每顿饭都是一个人吃。", "毎食ひとりで食べている。", "آكل كل وجبة وحدي."),
 ("hab", False, "What happened to my friend was unfair.", "သူငယ်ချင်းကို ဖြစ်ခဲ့တာ မတရားဘူး။", "我朋友遭遇的事不公平。", "友だちに起きたことは不公平だ。", "ما حدث لصديقي كان ظلمًا."),
 ("hab", False, "Why does God let this happen?", "ဘုရားသခင်က ဘာကြောင့် ဒါကို ဖြစ်ခွင့်ပေးတာလဲ။", "神为什么允许这种事发生？", "なぜ神さまはこんなことを許すのか。", "لماذا يسمح الله بحدوث هذا؟"),
 ("hab", False, "I am so angry at what they did to my village.", "ကျွန်ုပ်ရွာကို သူတို့လုပ်တာကို အရမ်း ဒေါသထွက်တယ်။", "他们对我的村子所做的让我非常生气。", "彼らが私の村にしたことに本当に腹が立つ。", "أنا غاضب جدًا مما فعلوه بقريتي."),
 ("mary", False, "My grandmother died and I could not go home.", "အဖွားဆုံးသွားပေမယ့် အိမ်ပြန်လို့ မရခဲ့ဘူး။", "我奶奶去世了，我却不能回家。", "祖母が亡くなったのに、帰れなかった。", "توفيت جدتي ولم أستطع العودة إلى البيت."),
 ("mary", False, "I missed the funeral.", "အသုဘကို မတက်လိုက်ရဘူး။", "我错过了葬礼。", "葬儀に出られなかった。", "فاتتني الجنازة."),
 ("elijah", False, "I am exhausted and want to give up on my degree.", "ပင်ပန်းလွန်းလို့ ဘွဲ့ကို လက်လျှော့ချင်တယ်။", "我太累了，想放弃学位。", "疲れ果てて、学位をあきらめたい。", "أنا منهك وأريد أن أترك دراستي."),
 ("elijah", False, "I am so tired of being strong.", "အားမာန်ရှိနေရတာကို ပင်ပန်းလှပြီ။", "我已经厌倦了一直坚强。", "強くいることに疲れた。", "تعبت من أن أكون قويًا."),
 ("ruth", False, "My visa ends soon and I do not know what comes next.", "ဗီဇာ မကြာခင် ကုန်တော့မယ်၊ နောက်ဘာဖြစ်မလဲ မသိဘူး။", "我的签证快到期了，不知道接下来会怎样。", "ビザがもうすぐ切れて、この先どうなるかわからない。", "تأشيرتي تنتهي قريبًا ولا أعرف ما الذي سيأتي."),
 ("ruth", False, "I am starting over in a new place.", "နေရာသစ်မှာ အစက ပြန်စနေတယ်။", "我在一个新的地方重新开始。", "新しい場所でやり直している。", "أبدأ من جديد في مكان جديد."),
 ("ruth", False, "I am worried about finding a job after graduation.", "ဘွဲ့ရပြီးရင် အလုပ်ရှာရမှာကို စိုးရိမ်တယ်။", "我担心毕业后找不到工作。", "卒業後の就職が心配だ。", "أنا قلق من إيجاد عمل بعد التخرج."),
 ("samaritan", False, "I got good news today and I want to thank God.", "ဒီနေ့ သတင်းကောင်း ရလို့ ဘုရားသခင်ကို ကျေးဇူးတင်ချင်တယ်။", "我今天收到好消息，想感谢神。", "今日よい知らせがあって、神さまに感謝したい。", "تلقيت خبرًا سارًا اليوم وأريد أن أشكر الله."),
 ("samaritan", False, "I am grateful my family is safe.", "မိသားစု လုံခြုံလို့ ကျေးဇူးတင်တယ်။", "我很感恩家人平安。", "家族が無事で感謝している。", "أنا ممتن لأن عائلتي بخير."),
 ("hagar", False, "My landlord mistreats me and no one sees it.", "အိမ်ရှင်က ကျွန်ုပ်ကို မတရားဆက်ဆံပြီး ဘယ်သူမှ မမြင်ဘူး။", "房东欺负我，却没有人看见。", "大家にひどく扱われているのに、誰も気づかない。", "صاحب السكن يسيء معاملتي ولا أحد يرى ذلك."),
 ("hagar", False, "I ran away from people who hurt me.", "ကျွန်ုပ်ကို နာကျင်စေတဲ့သူတွေဆီက ထွက်ပြေးခဲ့တယ်။", "我逃离了伤害我的人。", "私を傷つけた人たちから逃げてきた。", "هربت من أشخاص آذوني."),
 ("joseph", False, "My cousin betrayed me and I cannot forgive him.", "ဝမ်းကွဲက သစ္စာဖောက်ခဲ့ပြီး ခွင့်မလွှတ်နိုင်ဘူး။", "我表哥背叛了我，我无法原谅他。", "いとこに裏切られて、許せない。", "خانني ابن عمي ولا أستطيع أن أسامحه."),
 ("hannah", False, "I passed my exams and I am so happy.", "စာမေးပွဲ အောင်လို့ အရမ်း ပျော်တယ်။", "我通过了考试，非常开心。", "試験に合格して、とても嬉しい。", "نجحت في امتحاناتي وأنا سعيد جدًا."),
 ("hannah", False, "Something good happened after a long hard year.", "ခက်ခဲတဲ့ နှစ်ရှည်ကြီး ပြီးနောက် ကောင်းတာ တစ်ခု ဖြစ်ခဲ့တယ်။", "艰难的一年之后，发生了一件好事。", "長くつらい一年のあとに、よいことがあった。", "حدث شيء جميل بعد سنة طويلة وصعبة."),
 ("ps77", False, "I can't sleep and I can't pray.", "အိပ်မပျော်ဘူး၊ ဆုမတောင်းနိုင်ဘူး။", "我睡不着，也祷告不了。", "眠れないし、祈れない。", "لا أستطيع النوم ولا أستطيع أن أصلي."),
 ("ps77", False, "I have no words left.", "ပြောစရာ စကားလုံး မကျန်တော့ဘူး။", "我已经没有话可说了。", "もう言葉が出てこない。", "لم تعد لدي كلمات."),
 ("any", False, "I am sad.", "ဝမ်းနည်းတယ်။", "我很难过。", "悲しい。", "أنا حزين."),
 ("any", False, "I am stressed.", "စိတ်ဖိစီးနေတယ်။", "我压力很大。", "ストレスがたまっている。", "أنا متوتر."),
 ("any", False, "I smile in class but inside I feel far away.", "အတန်းထဲမှာ ပြုံးနေပေမယ့် အထဲမှာ ဝေးလံနေသလို ခံစားရတယ်။", "我在课堂上微笑，内心却觉得很遥远。", "授業では笑っているけれど、心は遠くにある。", "أبتسم في الصف لكنني أشعر في داخلي أنني بعيد."),
 ("any", False, "I feel guilty that I am safe and my family is not.", "ကျွန်ုပ် လုံခြုံပြီး မိသားစု မလုံခြုံလို့ အပြစ်ရှိသလို ခံစားရတယ်။", "我平安而家人不平安，我感到内疚。", "私は安全なのに家族はそうではなくて、罪悪感がある。", "أشعر بالذنب لأنني بأمان وعائلتي ليست كذلك."),
 ("any", False, "I'm starting to like it here, and that feels strange.", "ဒီမှာ သဘောကျလာနေပြီး ဒါက ထူးဆန်းသလို ခံစားရတယ်။", "我开始喜欢这里了，这感觉很奇怪。", "ここが好きになってきて、それが不思議な気がする。", "بدأت أحب المكان هنا، وهذا يبدو غريبًا."),
 ("any", False, "My roommate yelled at me again.", "အခန်းဖော်က ကျွန်ုပ်ကို ထပ်အော်တယ်။", "我室友又对我大喊大叫。", "ルームメイトにまた怒鳴られた。", "صرخ زميلي في السكن عليّ مرة أخرى."),
 ("any", False, "I failed an exam and I'm afraid to tell my parents.", "စာမေးပွဲ ကျလို့ မိဘကို ပြောရမှာ ကြောက်တယ်။", "我考试不及格，不敢告诉父母。", "試験に落ちて、両親に言うのがこわい。", "رسبت في امتحان وأخاف أن أخبر والديّ."),
 ("any", False, "I miss my mother's cooking.", "အမေ့ဟင်းလျာကို လွမ်းတယ်။", "我想念妈妈做的饭。", "母の料理が恋しい。", "أشتاق إلى طبخ أمي."),
 ("any", False, "", "", "", "", ""),  # placeholder removed below
 ("crisis", True, "I want to die.", "သေချင်တယ်။", "我想死。", "死にたい。", "أريد أن أموت."),
 ("crisis", True, "I don't want to live anymore.", "ဆက်မနေချင်တော့ဘူး။", "我不想活了。", "もう生きていたくない。", "لا أريد أن أعيش بعد الآن."),
 ("crisis", True, "I might hurt myself tonight.", "ကိုယ့်ကိုယ်ကို နာကျင်အောင် လုပ်မိမလား မသိဘူး။", "我可能会伤害自己。", "自分を傷つけてしまうかもしれない。", "قد أؤذي نفسي."),
 ("crisis", True, "Someone is threatening me right now.", "အခု တစ်ယောက်က ကျွန်ုပ်ကို ခြိမ်းခြောက်နေတယ်။", "现在有人在威胁我。", "今、誰かに脅されている。", "شخص ما يهددني الآن."),
 ("crisis", True, "I have been thinking about ending my life.", "ကိုယ့်အသက်ကို အဆုံးသတ်ဖို့ စဉ်းစားနေခဲ့တယ်။", "我一直在想结束自己的生命。", "命を終わらせることを考えている。", "كنت أفكر في إنهاء حياتي."),
 ("any", False, "qwerty", "qwerty", "qwerty", "qwerty", "qwerty"),
]
S = [s for s in S if s[2]]
LANGS = ["en", "my", "zh", "ja", "ar"]
out = []
for i, (expect, risk, *texts) in enumerate(S):
    for lang, text in zip(LANGS, texts):
        out.append({"id": f"{i+1:02d}-{lang}", "lang": lang, "text": text, "expect": expect, "risk": risk, "status": "drafted"})
path = os.path.join(os.path.dirname(__file__), "..", "test-set.jsonl")
with open(path, "w", encoding="utf8") as f:
    for o in out:
        f.write(json.dumps(o, ensure_ascii=False) + "\n")
print(len(out), "items")
