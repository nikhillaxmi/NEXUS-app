import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Dimensions,
  Platform, KeyboardAvoidingView, Alert, Modal,
  Animated, Easing, Vibration, RefreshControl, Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  accent: '#00FF88',
  cardColor: '#0E150E',
  cardOpacity: 96,
  borderColor: '#1C2A1C',
  glowEnabled: true,
  stickers: {},
  groqKey: '',
  notificationsEnabled: true,
};

const DEFAULT_ACCOUNT = {
  name: '', username: '',
  goal: '₹10,000/month',
  niche: 'AI Tools & Productivity',
  joined: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
};

const DEFAULT_TASKS = [
  { id:1, text:'Post first AI content piece',  priority:'High',   goal:'Content',      done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:2, text:'Create Telegram channel',      priority:'High',   goal:'Telegram',     done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:3, text:'Sign up for Instamojo',        priority:'Medium', goal:'Monetization', done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:4, text:'Research affiliate programs',  priority:'Medium', goal:'Affiliate',    done:false, created:new Date().toLocaleDateString('en-IN') },
];

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const ACCENT_PRESETS = ['#00FF88','#00CFFF','#FF8C42','#CC88FF','#FF4F8B','#FFD166','#FF4444','#44FFFF'];
const NICHES  = ['AI Tools & Productivity','Crypto & Web3','Personal Finance India','Side Hustles India','Tech News'];
const GOALS   = ['₹5,000/month','₹10,000/month','₹25,000/month','₹50,000/month','₹1,00,000/month'];

const ICATS   = ['Content','Freelance','Affiliate','Crypto','Digital Products','Other'];
const PRIOS   = ['High','Medium','Low'];
const PC      = { High:'#FF4F8B', Medium:'#FF8C42', Low:'#00FF88' };
const COINS   = ['bitcoin','ethereum','solana','binancecoin','ripple','dogecoin'];
const CI      = {
  bitcoin:{sym:'BTC',icon:'₿',color:'#F7931A'}, ethereum:{sym:'ETH',icon:'Ξ',color:'#627EEA'},
  solana:{sym:'SOL',icon:'◎',color:'#9945FF'}, binancecoin:{sym:'BNB',icon:'◆',color:'#F0B90B'},
  ripple:{sym:'XRP',icon:'✦',color:'#00AAE4'}, dogecoin:{sym:'DOGE',icon:'Ð',color:'#C2A633'},
};
const NTOPICS = ['AI Tools India','Crypto India today','Side hustle ideas India','Earn money online India','Tech news today'];
const STICKER_PACKS = {
  '⚡ Energy': ['🔥','⚡','💥','✨','🌟','💫','⭐','🎯'],
  '💰 Money':  ['💰','💎','🤑','💸','🏆','👑','🎰','📈'],
  '🤖 Tech':   ['🤖','💻','🚀','🛸','⚙️','🔮','💾','📱'],
  '😎 Vibes':  ['😎','🦋','🌊','🎭','🎪','🎨','🎬','🦊'],
  '🇮🇳 India': ['🇮🇳','🕉️','🙏','🌺','🪔','🎊','🌸','🎋'],
};
const SLOT_LABELS = {
  dash_topleft:'Dashboard Top Left', dash_topright:'Dashboard Top Right',
  dash_center:'Dashboard Center (Pop-out!)',
  card_hero:'Hero Card', card_money:'Money Card', card_create:'Create Card',
  btn_generate:'Generate Button', nav_home:'Nav Home', nav_money:'Nav Money',
  nav_create:'Nav Apps', nav_intel:'Nav Intel', nav_life:'Nav Life',
};
const SLOT_GROUPS = {
  float:  ['dash_topleft','dash_topright','dash_center'],
  card:   ['card_hero','card_money','card_create'],
  button: ['btn_generate'],
  nav:    ['nav_home','nav_money','nav_create','nav_intel','nav_life'],
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6)  return 'Still up? 🦉';
  if (h < 12) return 'Good morning ☀️';
  if (h < 17) return 'Good afternoon 👋';
  if (h < 21) return 'Good evening 🌆';
  return 'Good night 🌙';
};

// ── HAPTIC ─────────────────────────────────────────────────────────────────────
const haptic = (type = 'light') => {
  if (type === 'light')  Vibration.vibrate(10);
  if (type === 'medium') Vibration.vibrate(20);
  if (type === 'heavy')  Vibration.vibrate([0, 30, 10, 30]);
  if (type === 'success') Vibration.vibrate([0, 10, 10, 20]);
};

// ── PERSISTENCE ────────────────────────────────────────────────────────────────
function usePersist(key, def) {
  const [value, setValue] = useState(def);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then(v => { if (v) setValue(JSON.parse(v)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [key]);
  const set = useCallback(u => {
    setValue(p => {
      const n = typeof u === 'function' ? u(p) : u;
      AsyncStorage.setItem(key, JSON.stringify(n)).catch(() => {});
      return n;
    });
  }, [key]);
  return [value, set, loaded];
}

// ── ANIMATED STICKER ───────────────────────────────────────────────────────────
function AnimatedSticker({ emoji, effect, size = 36, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!effect || effect === 'none') return;
    const animations = {
      float:   Animated.loop(Animated.sequence([Animated.timing(anim, { toValue:1, duration:1500, easing:Easing.inOut(Easing.sin), useNativeDriver:true }), Animated.timing(anim, { toValue:0, duration:1500, easing:Easing.inOut(Easing.sin), useNativeDriver:true })])),
      bounce:  Animated.loop(Animated.sequence([Animated.timing(anim, { toValue:1, duration:600, easing:Easing.out(Easing.quad), useNativeDriver:true }), Animated.timing(anim, { toValue:0, duration:600, easing:Easing.in(Easing.quad), useNativeDriver:true })])),
      pulse:   Animated.loop(Animated.sequence([Animated.timing(anim, { toValue:1, duration:800, easing:Easing.inOut(Easing.ease), useNativeDriver:true }), Animated.timing(anim, { toValue:0, duration:800, easing:Easing.inOut(Easing.ease), useNativeDriver:true })])),
      spin:    Animated.loop(Animated.timing(anim, { toValue:1, duration:2000, easing:Easing.linear, useNativeDriver:true })),
      shake:   Animated.loop(Animated.sequence([Animated.timing(anim, { toValue:1, duration:100, useNativeDriver:true }), Animated.timing(anim, { toValue:-1, duration:100, useNativeDriver:true }), Animated.timing(anim, { toValue:0, duration:100, useNativeDriver:true })])),
      breathe: Animated.loop(Animated.sequence([Animated.timing(anim, { toValue:1, duration:1200, easing:Easing.inOut(Easing.ease), useNativeDriver:true }), Animated.timing(anim, { toValue:0, duration:1200, easing:Easing.inOut(Easing.ease), useNativeDriver:true })])),
    };
    const a = animations[effect];
    if (a) a.start();
    return () => anim.stopAnimation();
  }, [effect]);

  const getTransform = () => {
    if (effect === 'float')   return [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[0,-10] }) }];
    if (effect === 'bounce')  return [{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:[0,-14] }) }];
    if (effect === 'pulse')   return [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[1,1.3] }) }];
    if (effect === 'spin')    return [{ rotate: anim.interpolate({ inputRange:[0,1], outputRange:['0deg','360deg'] }) }];
    if (effect === 'shake')   return [{ translateX: anim.interpolate({ inputRange:[-1,1], outputRange:[-6,6] }) }];
    if (effect === 'breathe') return [{ scale: anim.interpolate({ inputRange:[0,1], outputRange:[1,1.15] }) }];
    if (effect === 'popout')  return [{ scale:1.35 }, { translateY:-12 }];
    return [];
  };

  return (
    <Animated.Text style={[{ fontSize:size }, style && style, { transform: getTransform() }]}>
      {emoji}
    </Animated.Text>
  );
}

// ── INCOME CHART ───────────────────────────────────────────────────────────────
function IncomeChart({ income, accent }) {
  const last7 = React.useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN');
      const total = income.filter(x => x.date === key).reduce((s, x) => s + x.amount, 0);
      days.push({ label: d.toLocaleDateString('en-IN', { weekday:'short' }).slice(0,3), total });
    }
    return days;
  }, [income]);

  const maxVal = Math.max(...last7.map(d => d.total), 100);
  const chartH = 80;

  if (income.length === 0) return null;

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={[S.sectionLbl, { marginBottom: 12 }]}>INCOME THIS WEEK</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: chartH + 24 }}>
        {last7.map((day, i) => {
          const barH = day.total > 0 ? Math.max((day.total / maxVal) * chartH, 6) : 4;
          const isToday = i === 6;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              {day.total > 0 && (
                <Text style={{ fontSize: 8, color: accent, fontWeight: '700', marginBottom: 3 }}>
                  {day.total >= 1000 ? `${(day.total/1000).toFixed(1)}k` : day.total}
                </Text>
              )}
              <View style={{
                width: '100%', height: barH, borderRadius: 4,
                backgroundColor: isToday ? accent : day.total > 0 ? accent + '55' : '#1C2A1C',
                shadowColor: isToday ? accent : 'transparent',
                shadowRadius: isToday ? 8 : 0, shadowOpacity: 0.6, elevation: isToday ? 4 : 0,
              }} />
              <Text style={{ fontSize: 9, color: isToday ? accent : '#4A6A4A', marginTop: 5, fontWeight: isToday ? '700' : '400' }}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────
const Lbl = ({ children }) => <Text style={S.lbl}>{children}</Text>;

const HapticBtn = ({ label, onPress, color, variant = 'fill', style, disabled, loading, hapticType = 'light' }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const c = color || '#00FF88';

  const pressIn = () => {
    haptic(hapticType);
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        disabled={disabled || loading} activeOpacity={1}
        style={[S.btn, variant === 'fill' ? { backgroundColor: disabled ? '#1C2A1C' : c } : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c }, style]}
      >
        {loading
          ? <ActivityIndicator color={variant === 'fill' ? '#000' : c} size="small" />
          : <Text style={[S.btnTxt, { color: variant === 'fill' ? '#000' : c }]}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const Inp = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline, secureTextEntry }) => (
  <View style={{ marginBottom: 13 }}>
    {label && <Text style={S.lbl}>{label}</Text>}
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor="#3A5A3A" keyboardType={keyboardType}
      multiline={multiline} secureTextEntry={secureTextEntry}
      style={[S.input, multiline && { height: 80, textAlignVertical: 'top' }]}
    />
  </View>
);

const PickerRow = ({ label, options, value, onChange, accent = '#00FF88' }) => (
  <View style={{ marginBottom: 12 }}>
    {label && <Text style={S.lbl}>{label}</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map(opt => (
          <TouchableOpacity key={opt} onPress={() => { haptic('light'); onChange(opt); }}
            style={[S.pill, value === opt && { backgroundColor: accent + '22', borderColor: accent }]}>
            <Text style={[S.pillTxt, value === opt && { color: accent }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </View>
);

const Toggle = ({ value, onChange, accent }) => (
  <TouchableOpacity onPress={() => { haptic('light'); onChange(!value); }} activeOpacity={0.8}
    style={{ width: 46, height: 24, borderRadius: 12, backgroundColor: value ? accent : '#1C2A1C', justifyContent: 'center' }}>
    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: value ? '#000' : '#4A6A4A', position: 'absolute', left: value ? 25 : 4 }} />
  </TouchableOpacity>
);

const Tag = ({ label, color }) => (
  <View style={{ backgroundColor: color + '20', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
    <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{label}</Text>
  </View>
);

// ── TABS ───────────────────────────────────────────────────────────────────────
const TABS = [{ k:'home',i:'⊞',l:'Home' },{ k:'money',i:'₹',l:'Money' },{ k:'apps',i:'⬡',l:'Apps' },{ k:'intel',i:'◈',l:'Intel' },{ k:'life',i:'◎',l:'Life' }];

const BottomNav = ({ active, setActive, accent }) => (
  <View style={S.bottomNav}>
    {TABS.map(t => (
      <TouchableOpacity key={t.k} onPress={() => { haptic('light'); setActive(t.k); }} activeOpacity={0.7} style={S.navItem}>
        <View style={[S.navIconWrap, active === t.k && { backgroundColor: accent + '25' }]}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: active === t.k ? accent : '#3A5A3A' }}>{t.i}</Text>
        </View>
        <Text style={[S.navLbl, { color: active === t.k ? accent : '#3A5A3A' }]}>{t.l}</Text>
        {active === t.k && <View style={[S.navLine, { backgroundColor: accent }]} />}
      </TouchableOpacity>
    ))}
  </View>
);

// ── ONBOARDING ─────────────────────────────────────────────────────────────────
function OnboardingScreen({ onComplete }) {
  const [step, setStep]     = useState(0);
  const [name, setName]     = useState('');
  const [goal, setGoal]     = useState('₹10,000/month');
  const [niche, setNiche]   = useState('AI Tools & Productivity');
  const [apiKey, setApiKey] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [step]);

  const nextStep = () => {
    haptic('medium');
    fadeAnim.setValue(0); slideAnim.setValue(30);
    if (step < 3) setStep(s => s + 1);
    else {
      if (!name.trim()) { Alert.alert('Name required', 'Please enter your name to continue.'); return; }
      onComplete({ name, goal, niche, apiKey });
    }
  };

  const STEPS = [
    {
      icon: '⚡', title: 'Welcome to NEXUS', sub: 'Your personal AI command center',
      content: (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ fontSize: 14, color: '#4A6A4A', textAlign: 'center', lineHeight: 22 }}>
            NEXUS is your personal hub for{'\n'}content, money, markets and more.{'\n\n'}Built by you. For you. Let's set it up.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['✍️ Generate content', '📈 Track crypto', '💰 Log income', '✅ Manage tasks'].map(f => (
              <View key={f} style={{ backgroundColor: '#1C2A1C', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: '#D4EDD4', fontSize: 12 }}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      icon: '👤', title: "What's your name?", sub: 'NEXUS will greet you personally',
      content: (
        <View>
          <Inp label="YOUR NAME" value={name} onChangeText={setName} placeholder="e.g. Nikhil" />
          <Lbl>YOUR INCOME GOAL</Lbl>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {GOALS.map(g => (
              <TouchableOpacity key={g} onPress={() => setGoal(g)} style={[S.pill, goal === g && { backgroundColor: '#00FF8822', borderColor: '#00FF88' }]}>
                <Text style={[S.pillTxt, goal === g && { color: '#00FF88' }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ),
    },
    {
      icon: '🎯', title: "Pick your niche", sub: 'This shapes your content and news',
      content: (
        <View style={{ gap: 8 }}>
          {NICHES.map(n => (
            <TouchableOpacity key={n} onPress={() => { haptic('light'); setNiche(n); }}
              style={{ padding: 14, borderRadius: 14, backgroundColor: niche === n ? '#00FF8812' : '#0E150E', borderWidth: 1.5, borderColor: niche === n ? '#00FF88' : '#1C2A1C' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: niche === n ? '#00FF88' : '#D4EDD4' }}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      icon: '🔑', title: 'Add your Groq API key', sub: 'Powers all AI features — free at groq.com',
      content: (
        <View>
          <View style={{ backgroundColor: '#00FF8810', borderWidth: 1, borderColor: '#00FF8830', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#00FF88', lineHeight: 18 }}>
              1. Go to <Text style={{ fontWeight: '700' }}>console.groq.com</Text>{'\n'}
              2. Sign up free{'\n'}
              3. Create API key{'\n'}
              4. Paste it below{'\n\n'}
              <Text style={{ color: '#4A6A4A' }}>You can skip this and add it later in Settings.</Text>
            </Text>
          </View>
          <Inp label="GROQ API KEY" value={apiKey} onChangeText={setApiKey} placeholder="gsk_..." secureTextEntry />
        </View>
      ),
    },
  ];

  const current = STEPS[step];

  return (
    <View style={{ flex: 1, backgroundColor: '#060A06' }}>
      <StatusBar barStyle="light-content" backgroundColor="#060A06" />

      {/* Progress dots */}
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingTop: 60, paddingBottom: 30 }}>
        {STEPS.map((_, i) => (
          <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? '#00FF88' : '#1C2A1C', transition: 'width 0.3s' }} />
        ))}
      </View>

      <Animated.View style={{ flex: 1, padding: 24, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Icon */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#00FF8818', borderWidth: 1.5, borderColor: '#00FF8844', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40 }}>{current.icon}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#D4EDD4', marginTop: 16, letterSpacing: -0.5 }}>{current.title}</Text>
          <Text style={{ fontSize: 13, color: '#4A6A4A', marginTop: 4 }}>{current.sub}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {current.content}
        </ScrollView>
      </Animated.View>

      {/* Button */}
      <View style={{ padding: 24 }}>
        <HapticBtn
          label={step < 3 ? `Continue →` : "Launch NEXUS ⚡"}
          onPress={nextStep}
          color="#00FF88"
          hapticType="medium"
          style={{ borderRadius: 18, padding: 17 }}
        />
        {step === 3 && (
          <TouchableOpacity onPress={() => onComplete({ name: name || 'User', goal, niche, apiKey: '' })} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={{ color: '#4A6A4A', fontSize: 13 }}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
function Dashboard({ income, tasks, setActive, accent, cardBg, borderColor, account, stickers }) {
  const total   = income.reduce((s, i) => s + i.amount, 0);
  const pending = tasks.filter(t => !t.done).length;
  const done    = tasks.filter(t => t.done).length;
  const streak  = React.useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN');
      if (income.some(x => x.date === key)) count++;
      else break;
    }
    return count;
  }, [income]);

  const quick = [
    { tab:'apps',   icon:'⬡',  label:'Apps',    sub:'Child ecosystem' },
    { tab:'money',  icon:'📈', label:'Markets',  sub:'Live prices' },
    { tab:'money',  icon:'💰', label:'Income',   sub:'₹' + total.toLocaleString('en-IN') },
    { tab:'life',   icon:'✅', label:'Tasks',    sub:`${pending} pending` },
    { tab:'intel',  icon:'📰', label:'News',     sub:'Trending today' },
    { tab:'life',   icon:'🎯', label:'Goals',    sub:`${done} completed` },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Floating stickers */}
      {['dash_topleft','dash_topright','dash_center'].map((slot, i) => {
        const s = stickers[slot]; if (!s?.emoji) return null;
        const positions = [{ top: 0, left: 0 }, { top: 0, right: 0 }, { top: 60, alignSelf: 'center' }];
        return (
          <View key={slot} style={{ position: 'absolute', ...positions[i], zIndex: 10, pointerEvents: 'none' }}>
            <AnimatedSticker emoji={s.emoji} effect={s.effect} size={s.size || 40} />
          </View>
        );
      })}

      <View style={{ marginBottom: 20 }}>
        <Text style={S.greet}>{getGreeting()}</Text>
        <Text style={S.pageTitle}>Hey, {account.name || 'there'}!</Text>
      </View>

      {/* Streak badge */}
      {streak > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF8C4218', borderRadius: 12, padding: '10px 14px', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, borderWidth: 1, borderColor: '#FF8C4233' }}>
          <Text style={{ fontSize: 20 }}>🔥</Text>
          <Text style={{ fontSize: 13, color: '#FF8C42', fontWeight: '700' }}>{streak} day streak — keep going!</Text>
        </View>
      )}

      {/* Hero card */}
      <View style={[S.heroCard, { borderColor: accent + '33', backgroundColor: accent + '12' }]}>
        <View style={{ position: 'absolute', top: 0, left: 22, right: 22, height: 1, backgroundColor: accent + '55' }} />
        {stickers['card_hero']?.emoji && (
          <View style={{ position: 'absolute', right: -4, top: -18, zIndex: 10 }}>
            <AnimatedSticker emoji={stickers['card_hero'].emoji} effect={stickers['card_hero'].effect} size={stickers['card_hero'].size || 50} />
          </View>
        )}
        <Text style={[S.heroLbl, { color: accent }]}>TOTAL INCOME</Text>
        <Text style={S.heroAmt}>₹{total.toLocaleString('en-IN')}</Text>
        <Text style={S.heroSub}>Goal: {account.goal}</Text>
        <View style={[S.heroRow, { borderTopColor: accent + '22' }]}>
          {[['ENTRIES', income.length], ['PENDING', pending], ['DONE', done]].map(([l, v], i) => (
            <View key={l} style={[S.heroStat, i < 2 && { borderRightColor: accent + '18', borderRightWidth: 1 }]}>
              <Text style={S.heroStatL}>{l}</Text>
              <Text style={S.heroStatV}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Income chart */}
      <IncomeChart income={income} accent={accent} />

      {/* Quick access */}
      <Text style={S.sectionLbl}>QUICK ACCESS</Text>
      <View style={S.grid2}>
        {quick.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => { haptic('light'); setActive(item.tab); }} activeOpacity={0.8}
            style={[S.catCard, { backgroundColor: cardBg, borderColor }]}>
            {stickers[`card_${item.tab}`]?.emoji && (
              <View style={{ position: 'absolute', top: -8, right: -4, zIndex: 10 }}>
                <AnimatedSticker emoji={stickers[`card_${item.tab}`].emoji} effect={stickers[`card_${item.tab}`].effect} size={22} />
              </View>
            )}
            <Text style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</Text>
            <Text style={S.catLabel}>{item.label}</Text>
            <Text style={S.catSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Brief */}
      <Text style={[S.sectionLbl, { marginTop: 6 }]}>TODAY'S BRIEF</Text>
      {[
        { icon: '📰', title: 'AI Tools India trending',  sub: '3 new stories', color: '#00CFFF' },
        { icon: '✅', title: `${pending} tasks pending`, sub: 'Telegram — High priority', color: accent },
        { icon: '📈', title: 'Crypto market update',     sub: 'BTC trending today', color: '#FF8C42' },
      ].map((item, i) => (
        <View key={i} style={[S.briefCard, { backgroundColor: cardBg, borderColor, borderLeftColor: item.color + '55' }]}>
          <View style={[S.briefIcon, { backgroundColor: item.color + '15' }]}><Text style={{ fontSize: 17 }}>{item.icon}</Text></View>
          <View><Text style={S.briefTitle}>{item.title}</Text><Text style={S.catSub}>{item.sub}</Text></View>
        </View>
      ))}

      {income.slice(0, 3).map((item, i) => (
        <View key={i} style={[S.briefCard, { backgroundColor: cardBg, borderColor, borderLeftColor: accent + '44' }]}>
          <View style={{ flex: 1 }}><Text style={S.briefTitle}>{item.source}</Text><Text style={S.catSub}>{item.category} · {item.date}</Text></View>
          <Text style={[S.catLabel, { color: accent }]}>+₹{item.amount.toLocaleString('en-IN')}</Text>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── APPS MODULE (Child Ecosystem) ──────────────────────────────────────────────
function AppsModule({ accent, cardBg, borderColor }) {
  const CHILD_APPS = [
    {
      id: 'content_studio',
      icon: '✍️',
      name: 'Content Studio',
      sub: 'Scripts · Blogs · Threads',
      color: '#00CFFF',
      status: 'coming_soon',
      stats: 'Standalone app — coming next',
    },
    {
      id: 'crypto_tracker',
      icon: '📈',
      name: 'Crypto Tracker',
      sub: 'Portfolio · Alerts · P&L',
      color: '#F7931A',
      status: 'coming_soon',
      stats: 'Standalone app — coming soon',
    },
    {
      id: 'telegram_manager',
      icon: '📢',
      name: 'Telegram Manager',
      sub: 'Post · Schedule · Grow',
      color: '#229ED9',
      status: 'coming_soon',
      stats: 'Standalone app — coming soon',
    },
    {
      id: 'finance_vault',
      icon: '🏦',
      name: 'Finance Vault',
      sub: 'Budget · Expenses · Goals',
      color: '#00FF88',
      status: 'coming_soon',
      stats: 'Standalone app — coming soon',
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 20 }}>
        <Text style={S.pageTitle}>Ecosystem</Text>
        <Text style={S.catSub}>Your connected child apps</Text>
      </View>

      {/* Info banner */}
      <View style={{ backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '28', borderRadius: 16, padding: 14, marginBottom: 22 }}>
        <Text style={{ fontSize: 13, color: accent, fontWeight: '700', marginBottom: 4 }}>⚡ How it works</Text>
        <Text style={{ fontSize: 12, color: '#4A6A4A', lineHeight: 18 }}>
          Each child app works independently and syncs data back to NEXUS. Your dashboard shows live stats from all apps in one place.
        </Text>
      </View>

      <Text style={S.sectionLbl}>CHILD APPS</Text>
      {CHILD_APPS.map((app, i) => (
        <TouchableOpacity
          key={app.id}
          onPress={() => { haptic('light'); Alert.alert(app.name, 'This app is being built as a standalone APK. Stay tuned! 🚀'); }}
          activeOpacity={0.8}
          style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: app.color + '66' }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: app.color + '18', borderWidth: 1.5, borderColor: app.color + '33', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>{app.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={S.catLabel}>{app.name}</Text>
                <View style={{ backgroundColor: '#FF8C4220', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 9, color: '#FF8C42', fontWeight: '700', letterSpacing: 0.5 }}>SOON</Text>
                </View>
              </View>
              <Text style={S.catSub}>{app.sub}</Text>
              <Text style={{ fontSize: 11, color: app.color, marginTop: 4, fontWeight: '600' }}>{app.stats}</Text>
            </View>
            <Text style={{ fontSize: 20, color: '#2A3D2A' }}>›</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Connected data preview */}
      <Text style={[S.sectionLbl, { marginTop: 8 }]}>NEXUS RECEIVES</Text>
      {[
        { icon: '✍️', from: 'Content Studio', data: 'Posts generated, content streak, top topics', color: '#00CFFF' },
        { icon: '📈', from: 'Crypto Tracker', data: 'Portfolio value, P&L, price alerts', color: '#F7931A' },
        { icon: '📢', from: 'Telegram Manager', data: 'Members count, posts sent, growth rate', color: '#229ED9' },
        { icon: '🏦', from: 'Finance Vault', data: 'Total income, expenses, savings rate', color: '#00FF88' },
      ].map((item, i) => (
        <View key={i} style={[S.briefCard, { backgroundColor: cardBg, borderColor, borderLeftColor: item.color + '55', marginBottom: 9 }]}>
          <View style={[S.briefIcon, { backgroundColor: item.color + '15' }]}>
            <Text style={{ fontSize: 17 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.briefTitle}>{item.from}</Text>
            <Text style={S.catSub}>{item.data}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}
// ── MARKETS ────────────────────────────────────────────────────────────────────
function MarketsModule({ accent, cardBg, borderColor, groqKey }) {
  const [prices, setPrices]   = useState({});
  const [loading, setLoad]    = useState(false);
  const [refreshing, setRefr] = useState(false);
  const [lastUp, setLastUp]   = useState(null);
  const [analysis, setAnal]   = useState('');
  const [analyzing, setAning] = useState(false);

  const fetchPrices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefr(true); else setLoad(true);
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=inr,usd&include_24hr_change=true`);
      const data = await res.json();
      setPrices(data);
      setLastUp(new Date().toLocaleTimeString());
      await AsyncStorage.setItem('nexus:market_cache', JSON.stringify({ data, time: Date.now() }));
      if (isRefresh) haptic('success');
    } catch (e) {
      const cached = await AsyncStorage.getItem('nexus:market_cache');
      if (cached) { const { data } = JSON.parse(cached); setPrices(data); }
    }
    if (isRefresh) setRefr(false); else setLoad(false);
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const analyze = async () => {
    if (!groqKey) { Alert.alert('API Key Missing', 'Add your Groq API key in Settings.'); return; }
    haptic('medium'); setAning(true); setAnal('');
    const summary = Object.entries(prices).map(([c, d]) => `${CI[c]?.sym}: ₹${d.inr?.toLocaleString('en-IN')} (${d.inr_24h_change?.toFixed(2)}%)`).join(', ');
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 300, messages: [{ role: 'user', content: `Prices: ${summary}. Give 3-4 sentence market analysis for small Indian investor. Be concise and practical.` }] }),
      });
      const data = await res.json();
      setAnal(data.choices?.[0]?.message?.content || '');
      haptic('success');
    } catch (e) { setAnal('Could not fetch analysis.'); }
    setAning(false);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPrices(true)} tintColor={accent} colors={[accent]} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <View><Text style={S.pageTitle}>Live Markets</Text><Text style={S.catSub}>{lastUp ? `Updated ${lastUp}` : 'Pull down to refresh'}</Text></View>
        <HapticBtn label="↺" onPress={() => fetchPrices(false)} loading={loading} variant="outline" color={accent} style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 }} />
      </View>

      {loading && !Object.keys(prices).length ? (
        <View style={{ alignItems: 'center', padding: 50 }}><ActivityIndicator color={accent} size="large" /></View>
      ) : (
        <View style={S.grid2}>
          {COINS.map(coin => {
            const info = CI[coin]; const d = prices[coin] || {};
            const change = d.inr_24h_change || 0; const isUp = change >= 0;
            return (
              <View key={coin} style={[S.catCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 20, color: info.color }}>{info.icon}</Text>
                  <Tag label={`${isUp ? '+' : ''}${change.toFixed(2)}%`} color={isUp ? '#00FF88' : '#FF4F8B'} />
                </View>
                <Text style={S.catSub}>{info.sym}</Text>
                <Text style={S.catLabel}>₹{d.inr ? Number(d.inr).toLocaleString('en-IN') : '—'}</Text>
                <Text style={S.catSub}>${d.usd ? Number(d.usd).toLocaleString() : '—'}</Text>
              </View>
            );
          })}
        </View>
      )}

      <HapticBtn label="🤖  AI Market Analysis" onPress={analyze} loading={analyzing} color={accent} style={{ marginTop: 6, marginBottom: 14 }} hapticType="medium" />

      {analysis !== '' && (
        <View style={[S.card, { backgroundColor: '#00FF8810', borderColor: '#00FF8833' }]}>
          <Lbl>AI Analysis</Lbl>
          <Text style={{ color: '#D4EDD4', fontSize: 13, lineHeight: 20 }}>{analysis}</Text>
        </View>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── INCOME ─────────────────────────────────────────────────────────────────────
function IncomeModule({ income, setIncome, accent, cardBg, borderColor }) {
  const [source, setSource]     = useState('');
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState(ICATS[0]);
  const [note, setNote]         = useState('');
  const [adding, setAdding]     = useState(false);
  const total  = income.reduce((s, i) => s + i.amount, 0);
  const byCat  = ICATS.map(c => ({ c, t: income.filter(i => i.category === c).reduce((s, i) => s + i.amount, 0) })).filter(x => x.t > 0);

  const add = () => {
    if (!source || !amount) { haptic('heavy'); return; }
    haptic('success');
    setIncome(p => [{ source, amount: parseFloat(amount), category, note, date: new Date().toLocaleDateString('en-IN'), id: Date.now() }, ...p]);
    setSource(''); setAmount(''); setNote(''); setAdding(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 18 }}><Text style={S.pageTitle}>Income Tracker</Text><Text style={S.catSub}>Track every rupee</Text></View>

        <View style={[S.heroCard, { borderColor: accent + '33', backgroundColor: '#0E1E0E' }]}>
          <View style={{ position: 'absolute', top: 0, left: 22, right: 22, height: 1, backgroundColor: accent + '55' }} />
          <Text style={[S.heroLbl, { color: accent }]}>TOTAL EARNED</Text>
          <Text style={S.heroAmt}>₹{total.toLocaleString('en-IN')}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {byCat.map(x => (
              <View key={x.c}>
                <Text style={S.heroStatL}>{x.c.toUpperCase()}</Text>
                <Text style={[S.heroStatV, { fontSize: 14 }]}>₹{x.t.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </View>

        <IncomeChart income={income} accent={accent} />

        {adding ? (
          <View style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 14 }]}>
            <Text style={[S.catLabel, { marginBottom: 14 }]}>Add Income Entry</Text>
            <Inp label="SOURCE" value={source} onChangeText={setSource} placeholder="e.g. Fiverr gig, Affiliate sale" />
            <Inp label="AMOUNT (₹)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
            <PickerRow label="CATEGORY" options={ICATS} value={category} onChange={setCategory} accent={accent} />
            <Inp label="NOTE (optional)" value={note} onChangeText={setNote} placeholder="Details..." />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <HapticBtn label="Save ✓" onPress={add} color={accent} style={{ flex: 1 }} hapticType="success" />
              <HapticBtn label="Cancel" onPress={() => setAdding(false)} variant="outline" color="#4A6A4A" style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <HapticBtn label="+ Add Income Entry" onPress={() => setAdding(true)} color={accent} style={{ marginBottom: 16 }} />
        )}

        {income.length === 0 ? (
          <View style={[S.card, { backgroundColor: cardBg, borderColor, alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 36 }}>💰</Text>
            <Text style={[S.catSub, { marginTop: 10, textAlign: 'center' }]}>No income logged yet.{'\n'}Add your first entry!</Text>
          </View>
        ) : income.map(item => (
          <View key={item.id} style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderLeftWidth: 2, borderLeftColor: accent + '44' }]}>
            <View style={{ flex: 1 }}>
              <Text style={S.catLabel}>{item.source}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag label={item.category} color={accent} />
                <Text style={S.catSub}>{item.date}</Text>
              </View>
              {item.note ? <Text style={[S.catSub, { marginTop: 3 }]}>{item.note}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[S.catLabel, { color: accent }]}>+₹{item.amount.toLocaleString('en-IN')}</Text>
              <TouchableOpacity onPress={() => { haptic('light'); setIncome(p => p.filter(i => i.id !== item.id)); }}>
                <Text style={{ color: '#4A6A4A', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── TASKS ──────────────────────────────────────────────────────────────────────
function TasksModule({ tasks, setTasks, accent, cardBg, borderColor }) {
  const [text, setText]         = useState('');
  const [priority, setPriority] = useState('Medium');
  const [goal, setGoal]         = useState('');
  const [filter, setFilter]     = useState('All');

  const add = () => {
    if (!text.trim()) { haptic('heavy'); return; }
    haptic('success');
    setTasks(p => [{ id: Date.now(), text, priority, goal, done: false, created: new Date().toLocaleDateString('en-IN') }, ...p]);
    setText(''); setGoal('');
  };
  const toggle = id => { haptic('light'); setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t)); };
  const remove = id => { haptic('light'); setTasks(p => p.filter(t => t.id !== id)); };
  const filtered = tasks.filter(t => filter === 'All' ? true : filter === 'Done' ? t.done : !t.done);
  const done = tasks.filter(t => t.done).length;
  const progress = tasks.length ? done / tasks.length : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 18 }}><Text style={S.pageTitle}>Tasks & Goals</Text><Text style={S.catSub}>Stay focused, earn more</Text></View>

        {tasks.length > 0 && (
          <View style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 14 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Lbl>Progress</Lbl>
              <Text style={{ fontSize: 12, color: '#D4EDD4', fontWeight: '700' }}>{done}/{tasks.length}</Text>
            </View>
            <View style={{ backgroundColor: '#0A100A', borderRadius: 99, height: 6, overflow: 'hidden' }}>
              <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: accent, borderRadius: 99 }} />
            </View>
            <Text style={{ fontSize: 11, color: accent, marginTop: 5, fontWeight: '600' }}>{Math.round(progress * 100)}% complete</Text>
          </View>
        )}

        <View style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 14 }]}>
          <Inp label="TASK" value={text} onChangeText={setText} placeholder="What needs to be done?" />
          <Inp label="PROJECT (optional)" value={goal} onChangeText={setGoal} placeholder="e.g. Telegram Channel" />
          <Lbl>Priority</Lbl>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 13 }}>
            {PRIOS.map(p => (
              <TouchableOpacity key={p} onPress={() => { haptic('light'); setPriority(p); }}
                style={[S.pill, { flex: 1, justifyContent: 'center' }, priority === p && { backgroundColor: PC[p] + '22', borderColor: PC[p] }]}>
                <Text style={[S.pillTxt, priority === p && { color: PC[p] }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <HapticBtn label="+ Add Task" onPress={add} color={accent} hapticType="medium" />
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {['All', 'Pending', 'Done'].map(f => (
            <TouchableOpacity key={f} onPress={() => { haptic('light'); setFilter(f); }}
              style={[S.pill, { flex: 1, justifyContent: 'center' }, filter === f && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[S.pillTxt, filter === f && { color: accent }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.map(task => (
          <View key={task.id} style={[S.card, { backgroundColor: cardBg, borderColor, borderLeftWidth: 2, borderLeftColor: PC[task.priority] + '55', marginBottom: 9, flexDirection: 'row', alignItems: 'flex-start', gap: 12, opacity: task.done ? 0.55 : 1 }]}>
            <TouchableOpacity onPress={() => toggle(task.id)} style={[S.checkbox, task.done && { backgroundColor: accent, borderColor: accent }]}>
              {task.done && <Text style={{ color: '#000', fontSize: 11, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[S.catLabel, task.done && { textDecorationLine: 'line-through', color: '#4A6A4A' }]}>{task.text}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Tag label={task.priority} color={PC[task.priority]} />
                {task.goal ? <Tag label={task.goal} color={accent} /> : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => remove(task.id)}>
              <Text style={{ color: '#4A6A4A', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── NEWS ───────────────────────────────────────────────────────────────────────
function NewsModule({ accent, cardBg, borderColor, groqKey }) {
  const [topic, setTopic]      = useState(NTOPICS[0]);
  const [news, setNews]        = useState([]);
  const [loading, setLoad]     = useState(false);
  const [refreshing, setRefr]  = useState(false);

  const fetchNews = async (isRefresh = false) => {
    if (!groqKey) { Alert.alert('API Key Missing', 'Add your Groq API key in Settings.'); return; }
    if (isRefresh) setRefr(true); else setLoad(true);
    haptic('light'); setNews([]);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', max_tokens: 1500,
          messages: [
            { role: 'system', content: 'Respond ONLY with valid JSON array. No markdown.' },
            { role: 'user', content: `Give top 5 trending news/topics about: "${topic}" relevant for Indians trying to earn online. JSON: [{"title":"...","summary":"2-3 sentences","source":"Based on general knowledge","relevance":"why this matters for earning online in India","tag":"category"}]` },
          ],
        }),
      });
      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content || '[]';
      const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
      setNews(Array.isArray(parsed) ? parsed : []);
      if (isRefresh) haptic('success');
    } catch (e) { setNews([]); }
    if (isRefresh) setRefr(false); else setLoad(false);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} tintColor={accent} colors={[accent]} />}
    >
      <View style={{ marginBottom: 18 }}><Text style={S.pageTitle}>News & Trends</Text><Text style={S.catSub}>Stay ahead of the curve</Text></View>
      <View style={[S.card, { backgroundColor: cardBg, borderColor, marginBottom: 14 }]}>
        <PickerRow label="TOPIC" options={NTOPICS} value={topic} onChange={setTopic} accent={accent} />
        <HapticBtn label="🔍  Fetch Latest News" onPress={() => fetchNews(false)} color={accent} loading={loading} hapticType="medium" />
      </View>

      {news.length === 0 && !loading && (
        <View style={[S.card, { backgroundColor: cardBg, borderColor, alignItems: 'center', paddingVertical: 40 }]}>
          <Text style={{ fontSize: 36 }}>📰</Text>
          <Text style={[S.catSub, { marginTop: 10 }]}>Pull down or tap above to fetch news</Text>
        </View>
      )}

      {news.map((item, i) => (
        <View key={i} style={[S.card, { backgroundColor: cardBg, borderColor, borderLeftWidth: 2, borderLeftColor: '#00CFFF55', marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Tag label={item.tag || 'News'} color={accent} />
            <Text style={S.catSub}>{item.source}</Text>
          </View>
          <Text style={[S.catLabel, { lineHeight: 20, marginBottom: 6 }]}>{item.title}</Text>
          <Text style={{ color: '#D4EDD4', fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{item.summary}</Text>
          <View style={{ backgroundColor: '#00FF8812', borderWidth: 1, borderColor: '#00FF8825', borderRadius: 10, padding: 10 }}>
            <Text style={{ fontSize: 10, color: '#00FF88', fontWeight: '600', marginBottom: 2 }}>💡 WHY IT MATTERS</Text>
            <Text style={{ color: '#D4EDD4', fontSize: 12 }}>{item.relevance}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────────
function SettingsPage({ config, setConfig, account, setAccount, onClose }) {
  const [section, setSection]     = useState('main');
  const [editName, setEditName]   = useState(account.name);
  const [editGoal, setEditGoal]   = useState(account.goal);
  const [editNiche, setEditNiche] = useState(account.niche);
  const [editKey, setEditKey]     = useState(config.groqKey || '');
  const [stickerGroup, setSG]     = useState('float');
  const [selectedSlot, setSS]     = useState(null);
  const accent      = config.accent;
  const cardBg      = config.cardColor;
  const borderColor = config.borderColor;
  const update      = (k, v) => setConfig(p => ({ ...p, [k]: v }));
  const updateAcc   = (k, v) => setAccount(p => ({ ...p, [k]: v }));
  const updateSlot  = (key, data) => setConfig(p => ({ ...p, stickers: { ...p.stickers, [key]: { ...(p.stickers[key] || {}), ...data } } }));
  const clearSlot   = (key) => setConfig(p => { const n = { ...p.stickers }; delete n[key]; return { ...p, stickers: n }; });
  const cur = selectedSlot ? (config.stickers[selectedSlot] || {}) : {};

  const MENU = [
    { key:'apikey',     icon:'🔑', title:'API Key',           sub:'Groq key for AI features',          group:'style', highlight:true  },
    { key:'customize',  icon:'🎨', title:'Theme & Colors',    sub:'Accent color, glow effects',         group:'style', highlight:false },
    { key:'cards',      icon:'🃏', title:'Cards & Layout',    sub:'Opacity, border style',              group:'style', highlight:false },
    { key:'stickers',   icon:'🌟', title:'Stickers',          sub:'Add stickers to dashboard',          group:'style', highlight:false },
    { key:'deepcustom', icon:'🔬', title:'Deep Customisation',sub:'Per-element stickers, pop-out 3D',   group:'style', highlight:true  },
    { key:'notifs',     icon:'🔔', title:'Notifications',     sub:'Daily reminders and alerts',         group:'style', highlight:false },
    { key:'account',    icon:'👤', title:'Account',           sub:'Profile, goals, niche',              group:'app',   highlight:false },
    { key:'about',      icon:'ℹ️',  title:'About NEXUS',       sub:'Version 1.0 · Privacy',             group:'app',   highlight:false },
  ];

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#060A06' }}>
        <StatusBar barStyle="light-content" backgroundColor="#060A06" />
        <View style={S.settingsHeader}>
          <TouchableOpacity onPress={section === 'main' ? onClose : () => { setSS(null); setSection('main'); }} activeOpacity={0.7} style={S.backBtn}>
            <Text style={{ color: '#4A6A4A', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#D4EDD4' }}>
              {section === 'main' ? 'Settings' : MENU.find(m => m.key === section)?.title || 'Settings'}
            </Text>
            <Text style={{ fontSize: 10, color: '#4A6A4A' }}>
              {section === 'main' ? 'Manage your NEXUS' : '← Back to Settings'}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>

          {/* MAIN */}
          {section === 'main' && (
            <View>
              <View style={[S.heroCard, { borderColor: accent + '28', backgroundColor: accent + '10', marginBottom: 22 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: accent + '22', borderWidth: 2, borderColor: accent + '44', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 28 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: '#D4EDD4' }}>{account.name}</Text>
                    <Text style={{ fontSize: 12, color: accent, fontWeight: '600' }}>{account.username}</Text>
                    <Text style={{ fontSize: 11, color: '#4A6A4A', marginTop: 2 }}>Goal: {account.goal}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSection('account')} style={{ backgroundColor: accent + '18', borderWidth: 1, borderColor: accent + '33', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 7 }}>
                    <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Lbl>Personalisation</Lbl>
              {MENU.filter(m => m.group === 'style').map(m => (
                <TouchableOpacity key={m.key} onPress={() => { haptic('light'); setSection(m.key); }} activeOpacity={0.8}
                  style={[S.settingsRow, { backgroundColor: m.highlight ? accent + '08' : cardBg, borderColor: m.highlight ? accent + '28' : borderColor }]}>
                  <View style={[S.settingsIcon, { backgroundColor: m.highlight ? accent + '20' : accent + '12' }]}><Text style={{ fontSize: 19 }}>{m.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.catLabel, m.highlight && { color: accent }]}>{m.title}</Text>
                    <Text style={S.catSub}>{m.sub}</Text>
                  </View>
                  <Text style={{ fontSize: 17, color: '#2A3D2A' }}>›</Text>
                </TouchableOpacity>
              ))}

              <Lbl>App</Lbl>
              {MENU.filter(m => m.group === 'app').map(m => (
                <TouchableOpacity key={m.key} onPress={() => { haptic('light'); setSection(m.key); }} activeOpacity={0.8}
                  style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                  <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>{m.icon}</Text></View>
                  <View style={{ flex: 1 }}><Text style={S.catLabel}>{m.title}</Text><Text style={S.catSub}>{m.sub}</Text></View>
                  <Text style={{ fontSize: 17, color: '#2A3D2A' }}>›</Text>
                </TouchableOpacity>
              ))}

              <Lbl>Quick Settings</Lbl>
              <View style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>💡</Text></View>
                <Text style={[S.catLabel, { flex: 1 }]}>Glow Effects</Text>
                <Toggle value={config.glowEnabled} onChange={v => update('glowEnabled', v)} accent={accent} />
              </View>
              <View style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>🔔</Text></View>
                <Text style={[S.catLabel, { flex: 1 }]}>Daily Notification</Text>
                <Toggle value={config.notificationsEnabled !== false} onChange={v => update('notificationsEnabled', v)} accent={accent} />
              </View>
            </View>
          )}

          {/* API KEY */}
          {section === 'apikey' && (
            <View>
              <View style={{ backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '28', borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <Text style={{ fontSize: 12, color: accent, lineHeight: 18 }}>
                  🔑 Your Groq API key powers all AI features.{'\n\n'}
                  Get a free key at <Text style={{ fontWeight: '700' }}>console.groq.com</Text>{'\n'}
                  Sign up → API Keys → Create → Copy
                </Text>
              </View>
              <Inp label="GROQ API KEY" value={editKey} onChangeText={setEditKey} placeholder="gsk_..." secureTextEntry />
              <HapticBtn label="Save API Key" onPress={() => { update('groqKey', editKey); haptic('success'); Alert.alert('✓ Saved', 'API key saved. All AI features are now active!'); setSection('main'); }} color={accent} hapticType="success" style={{ marginTop: 8 }} />
            </View>
          )}

          {/* ACCOUNT */}
          {section === 'account' && (
            <View>
              <Lbl>Display Name</Lbl>
              <TextInput value={editName} onChangeText={setEditName} style={[S.input, { marginBottom: 16 }]} placeholderTextColor="#3A5A3A" />
              <Lbl>Username</Lbl>
              <TextInput value={account.username} onChangeText={v => updateAcc('username', v)} style={[S.input, { marginBottom: 16 }]} placeholderTextColor="#3A5A3A" />
              <Lbl>Income Goal</Lbl>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g} onPress={() => { haptic('light'); setEditGoal(g); }} style={[S.pill, editGoal === g && { backgroundColor: accent + '22', borderColor: accent }]}>
                    <Text style={[S.pillTxt, editGoal === g && { color: accent }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Lbl>Niche</Lbl>
              {NICHES.map(n => (
                <TouchableOpacity key={n} onPress={() => { haptic('light'); setEditNiche(n); }}
                  style={{ paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, marginBottom: 8, backgroundColor: editNiche === n ? accent + '12' : '#0E150E', borderWidth: 1.5, borderColor: editNiche === n ? accent : '#1C2A1C' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: editNiche === n ? accent : '#D4EDD4' }}>{n}</Text>
                </TouchableOpacity>
              ))}
              <HapticBtn label="Save Changes ✓" onPress={() => { updateAcc('name', editName); updateAcc('goal', editGoal); updateAcc('niche', editNiche); haptic('success'); setSection('main'); }} color={accent} hapticType="success" style={{ marginTop: 16 }} />
            </View>
          )}

          {/* CUSTOMIZE */}
          {section === 'customize' && (
            <View>
              <Lbl>Accent Color</Lbl>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {ACCENT_PRESETS.map(c => (
                  <TouchableOpacity key={c} onPress={() => { haptic('light'); update('accent', c); }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: c, borderWidth: config.accent === c ? 3 : 0, borderColor: '#D4EDD4' }} />
                ))}
              </View>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: accent, marginBottom: 24, opacity: 0.7 }} />
              <Lbl>Effects</Lbl>
              <View style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>💡</Text></View>
                <View style={{ flex: 1 }}><Text style={S.catLabel}>Glow Effects</Text><Text style={S.catSub}>Ambient glow around elements</Text></View>
                <Toggle value={config.glowEnabled} onChange={v => update('glowEnabled', v)} accent={accent} />
              </View>
            </View>
          )}

          {/* NOTIFICATIONS */}
          {section === 'notifs' && (
            <View>
              <View style={{ backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '28', borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <Text style={{ fontSize: 12, color: accent, lineHeight: 18 }}>🔔 NEXUS sends you a daily reminder to post content and log income. Set the time that works for you.</Text>
              </View>
              <View style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>🔔</Text></View>
                <View style={{ flex: 1 }}><Text style={S.catLabel}>Daily Reminder</Text><Text style={S.catSub}>"Have you posted today?"</Text></View>
                <Toggle value={config.notificationsEnabled !== false} onChange={v => update('notificationsEnabled', v)} accent={accent} />
              </View>
              <View style={[S.settingsRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[S.settingsIcon, { backgroundColor: accent + '12' }]}><Text style={{ fontSize: 19 }}>💰</Text></View>
                <View style={{ flex: 1 }}><Text style={S.catLabel}>Income Reminder</Text><Text style={S.catSub}>"Log today's earnings"</Text></View>
                <Toggle value={config.incomeNotif !== false} onChange={v => update('incomeNotif', v)} accent={accent} />
              </View>
              <View style={{ backgroundColor: '#FF8C4215', borderWidth: 1, borderColor: '#FF8C4233', borderRadius: 14, padding: 14, marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#FF8C42', lineHeight: 18 }}>⚠️ To enable push notifications, install expo-notifications package and rebuild the APK.</Text>
              </View>
            </View>
          )}

          {/* CARDS */}
          {section === 'cards' && (
            <View>
              <Lbl>Card Opacity — {config.cardOpacity}%</Lbl>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {[40, 60, 80, 96, 100].map(v => (
                  <TouchableOpacity key={v} onPress={() => { haptic('light'); update('cardOpacity', v); }}
                    style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: config.cardOpacity === v ? accent + '22' : '#0E150E', borderWidth: 1.5, borderColor: config.cardOpacity === v ? accent : '#1C2A1C', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: config.cardOpacity === v ? accent : '#4A6A4A', fontWeight: '700' }}>{v}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STICKERS */}
          {section === 'stickers' && (
            <View>
              <Text style={S.catSub}>Tap to add floating stickers. For per-element control → Deep Customisation.</Text>
              <View style={{ height: 12 }} />
              {Object.entries(STICKER_PACKS).map(([pack, emojis]) => (
                <View key={pack} style={{ marginBottom: 18 }}>
                  <Lbl>{pack}</Lbl>
                  <View style={{ flexDirection: 'row', gap: 9, flexWrap: 'wrap' }}>
                    {emojis.map(e => (
                      <TouchableOpacity key={e} onPress={() => { haptic('light'); setConfig(p => ({ ...p, stickers: { ...p.stickers, ['fs_' + Date.now()]: { emoji: e, effect: 'float', size: 36 } } })); }}
                        style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: '#0E150E', borderWidth: 1.5, borderColor: '#1C2A1C', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 24 }}>{e}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* DEEP CUSTOMISATION */}
          {section === 'deepcustom' && (
            <View>
              <View style={{ backgroundColor: accent + '10', borderWidth: 1, borderColor: accent + '28', borderRadius: 14, padding: 12, marginBottom: 18 }}>
                <Text style={{ fontSize: 12, color: accent, lineHeight: 18 }}>💡 Assign animated stickers to any element. Use <Text style={{ fontWeight: '700' }}>Pop-Out 3D</Text> to make a character break out of the screen!</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[{ k:'float', l:'🌟 Float' }, { k:'card', l:'🃏 Cards' }, { k:'button', l:'🔘 Buttons' }, { k:'nav', l:'⊞ Nav' }].map(t => (
                    <TouchableOpacity key={t.k} onPress={() => { haptic('light'); setSG(t.k); setSS(null); }}
                      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: stickerGroup === t.k ? accent + '22' : '#0E150E', borderWidth: 1.5, borderColor: stickerGroup === t.k ? accent : '#1C2A1C' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: stickerGroup === t.k ? accent : '#4A6A4A' }}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {(SLOT_GROUPS[stickerGroup] || []).map(slotKey => {
                const has = config.stickers[slotKey]?.emoji;
                return (
                  <TouchableOpacity key={slotKey} onPress={() => { haptic('light'); setSS(selectedSlot === slotKey ? null : slotKey); }}
                    style={[S.settingsRow, { backgroundColor: selectedSlot === slotKey ? accent + '12' : '#0E150E', borderColor: selectedSlot === slotKey ? accent : has ? accent + '33' : '#1C2A1C' }]}>
                    <View style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: has ? accent + '15' : '#131C13', borderWidth: 1, borderColor: has ? accent + '33' : '#1C2A1C', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Text style={{ fontSize: has ? 22 : 18 }}>{has ? config.stickers[slotKey].emoji : '＋'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.catLabel}>{SLOT_LABELS[slotKey]}</Text>
                      <Text style={[S.catSub, has && { color: accent }]}>{has ? `${config.stickers[slotKey].effect || 'none'} · ${config.stickers[slotKey].size || 36}px` : 'Empty — tap to assign'}</Text>
                    </View>
                    {has && <TouchableOpacity onPress={() => { haptic('light'); clearSlot(slotKey); }} style={{ backgroundColor: '#FF4F8B18', borderWidth: 1, borderColor: '#FF4F8B33', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: '#FF4F8B', fontSize: 11 }}>Clear</Text></TouchableOpacity>}
                    <Text style={{ fontSize: 16, color: '#2A3D2A' }}>{selectedSlot === slotKey ? '↓' : '›'}</Text>
                  </TouchableOpacity>
                );
              })}

              {selectedSlot && (
                <View style={{ backgroundColor: '#0A100A', borderWidth: 1, borderColor: accent + '28', borderRadius: 18, padding: 16, marginTop: 4, marginBottom: 16 }}>
                  <Text style={[S.catLabel, { color: accent, marginBottom: 14 }]}>✦ {SLOT_LABELS[selectedSlot]}</Text>
                  <Lbl>Pick Emoji</Lbl>
                  {Object.entries(STICKER_PACKS).map(([pack, emojis]) => (
                    <View key={pack} style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, color: '#2A4A2A', marginBottom: 6 }}>{pack}</Text>
                      <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
                        {emojis.map(e => (
                          <TouchableOpacity key={e} onPress={() => { haptic('light'); updateSlot(selectedSlot, { emoji: e }); }}
                            style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: cur.emoji === e ? accent + '18' : '#131C13', borderWidth: 1.5, borderColor: cur.emoji === e ? accent : '#1C2A1C', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>{e}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                  {cur.emoji && (
                    <>
                      <Lbl>Animation Effect</Lbl>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        {['none','float','bounce','spin','pulse','shake','popout','breathe'].map(eff => (
                          <TouchableOpacity key={eff} onPress={() => { haptic('light'); updateSlot(selectedSlot, { effect: eff }); }}
                            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: cur.effect === eff ? accent + '20' : '#131C13', borderWidth: 1.5, borderColor: cur.effect === eff ? accent : '#1C2A1C' }}>
                            <Text style={{ fontSize: 11, color: cur.effect === eff ? accent : '#D4EDD4', fontWeight: '600' }}>{eff === 'popout' ? '🌟 Pop-Out 3D' : eff}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Lbl>Size</Lbl>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        {[20, 30, 40, 50, 60, 80].map(sz => (
                          <TouchableOpacity key={sz} onPress={() => { haptic('light'); updateSlot(selectedSlot, { size: sz }); }}
                            style={{ width: 48, height: 36, borderRadius: 9, backgroundColor: cur.size === sz ? accent + '20' : '#131C13', borderWidth: 1.5, borderColor: cur.size === sz ? accent : '#1C2A1C', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 11, color: cur.size === sz ? accent : '#D4EDD4', fontWeight: '700' }}>{sz}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Lbl>Live Preview</Lbl>
                      <View style={{ backgroundColor: '#131C13', borderWidth: 1, borderColor: '#1C2A1C', borderRadius: 13, padding: 20, alignItems: 'center' }}>
                        <AnimatedSticker emoji={cur.emoji} effect={cur.effect} size={cur.size || 36} />
                        <Text style={{ color: accent, fontSize: 11, marginTop: 8 }}>{cur.effect || 'none'} · {cur.size || 36}px</Text>
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ABOUT */}
          {section === 'about' && (
            <View>
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: accent + '22', borderWidth: 1.5, borderColor: accent + '44', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 42 }}>⚡</Text>
                </View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#D4EDD4', letterSpacing: 4 }}>NEXUS</Text>
                <Text style={{ fontSize: 10, color: '#4A6A4A', marginTop: 4, letterSpacing: 3 }}>PERSONAL AI HUB</Text>
                <Text style={{ fontSize: 12, color: accent, marginTop: 10, fontWeight: '700' }}>VERSION 1.0.0</Text>
              </View>
              {[
                { i:'👤', t:'Built by', s: account.name },
                { i:'📅', t:'Member since', s: account.joined },
                { i:'🎯', t:'Niche', s: account.niche },
                { i:'🏆', t:'Goal', s: account.goal },
                { i:'⚡', t:'AI powered by', s:'Groq — llama-3.3-70b-versatile' },
                { i:'📈', t:'Market data', s:'CoinGecko API (free)' },
                { i:'🔒', t:'Privacy', s:'All data stored locally on your device' },
                { i:'🌱', t:'Ecosystem', s:'Content Studio, Crypto Tracker, Telegram Manager — coming soon' },
              ].map(item => (
                <View key={item.t} style={[S.settingsRow, { backgroundColor: '#0E150E', borderColor: '#1C2A1C' }]}>
                  <Text style={{ fontSize: 20 }}>{item.i}</Text>
                  <View><Text style={{ fontSize: 10, color: '#4A6A4A' }}>{item.t}</Text><Text style={[S.catLabel, { marginTop: 1 }]}>{item.s}</Text></View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── ROOT APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                      = useState('home');
  const [moneyTab, setMoneyTab]            = useState('markets');
  const [showSettings, setShowSettings]    = useState(false);
  const [onboarded, setOnboarded, obLoaded] = usePersist('nexus:onboarded_v2', false);
  const [config, setConfig, cfgLoaded]     = usePersist('nexus:config_v3', DEFAULT_CONFIG);
  const [account, setAccount, accLoaded]   = usePersist('nexus:account_v3', DEFAULT_ACCOUNT);
  const [income, setIncome, incLoaded]     = usePersist('nexus:income_v3', []);
  const [tasks, setTasks, tskLoaded]       = usePersist('nexus:tasks_v3', DEFAULT_TASKS);

  const loaded = obLoaded && cfgLoaded && accLoaded && incLoaded && tskLoaded;
  const accent      = config.accent || '#00FF88';
  const cardBg      = config.cardColor || '#0E150E';
  const borderColor = config.borderColor || '#1C2A1C';
  const groqKey     = config.groqKey || '';
  const stickers    = config.stickers || {};
  const mp          = { accent, cardBg, borderColor, groqKey };

  const completeOnboarding = ({ name, goal, niche, apiKey }) => {
    haptic('success');
    setAccount(p => ({ ...p, name, goal, niche, username: '@' + name.toLowerCase().replace(/\s+/g, '') }));
    setConfig(p => ({ ...p, groqKey: apiKey }));
    setOnboarded(true);
  };

  // Loading screen
  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#060A06', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <StatusBar barStyle="light-content" backgroundColor="#060A06" />
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#00FF8822', borderWidth: 1.5, borderColor: '#00FF8844', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 38 }}>⚡</Text>
        </View>
        <ActivityIndicator color="#00FF88" size="large" />
        <Text style={{ color: '#4A6A4A', fontSize: 12, letterSpacing: 2 }}>LOADING NEXUS...</Text>
      </View>
    );
  }

  // Onboarding
  if (!onboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#060A06' }}>
      <StatusBar barStyle="light-content" backgroundColor="#060A06" />

      {/* Top Bar */}
      <View style={[S.topBar, { borderBottomColor: borderColor, backgroundColor: cardBg + 'EE' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <View style={[S.logoBox, { backgroundColor: accent + '18', borderColor: accent + '33' }]}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, backgroundColor: accent + '66' }} />
            <Text style={{ fontSize: 18 }}>⚡</Text>
          </View>
          <View>
            <Text style={S.appName}>NEXUS</Text>
            <Text style={S.appSub}>PERSONAL AI HUB</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '28', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
            <Text style={{ fontSize: 10, color: accent, fontWeight: '700', letterSpacing: 0.5 }}>LIVE</Text>
          </View>
          <TouchableOpacity onPress={() => { haptic('light'); setShowSettings(true); }} activeOpacity={0.8}
            style={[S.avatarBtn, { borderColor: accent + '40', backgroundColor: accent + '18' }]}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 18 }}>
        {tab === 'money' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[{ k:'markets', l:'📈 Markets' }, { k:'income', l:'₹ Income' }].map(t => (
                <TouchableOpacity key={t.k} onPress={() => { haptic('light'); setMoneyTab(t.k); }} activeOpacity={0.8}
                  style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: moneyTab === t.k ? accent + '20' : cardBg, borderWidth: 1.5, borderColor: moneyTab === t.k ? accent : borderColor, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: moneyTab === t.k ? accent : '#4A6A4A' }}>{t.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {moneyTab === 'markets'
              ? <MarketsModule {...mp} />
              : <IncomeModule income={income} setIncome={setIncome} {...mp} />
            }
          </>
        ) : tab === 'home'   ? <Dashboard income={income} tasks={tasks} setActive={setTab} {...mp} account={account} stickers={stickers} />
          : tab === 'apps'   ? <AppsModule {...mp} />
          : tab === 'intel'  ? <NewsModule {...mp} />
          : tab === 'life'   ? <TasksModule tasks={tasks} setTasks={setTasks} {...mp} />
          : null
        }
      </View>

      <BottomNav active={tab} setActive={setTab} accent={accent} />

      {showSettings && (
        <SettingsPage
          config={config} setConfig={setConfig}
          account={account} setAccount={setAccount}
          onClose={() => setShowSettings(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  topBar:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:18, paddingVertical:12, borderBottomWidth:1 },
  logoBox:       { width:37, height:37, borderRadius:12, alignItems:'center', justifyContent:'center', borderWidth:1, position:'relative', overflow:'hidden' },
  appName:       { fontSize:17, fontWeight:'900', color:'#D4EDD4', letterSpacing:2.5, lineHeight:20 },
  appSub:        { fontSize:9, color:'#3A5A3A', letterSpacing:2, marginTop:1 },
  avatarBtn:     { width:36, height:36, borderRadius:11, borderWidth:1.5, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  bottomNav:     { flexDirection:'row', justifyContent:'space-around', borderTopWidth:1, borderTopColor:'#1C2A1C', paddingTop:10, paddingBottom:Platform.OS==='ios'?0:12, backgroundColor:'#060A06' },
  navItem:       { alignItems:'center', gap:2, paddingHorizontal:8, paddingVertical:4 },
  navIconWrap:   { width:36, height:26, borderRadius:9, alignItems:'center', justifyContent:'center' },
  navLbl:        { fontSize:9, fontWeight:'700', letterSpacing:0.5 },
  navLine:       { width:16, height:2, borderRadius:1, marginTop:1 },
  btn:           { borderRadius:14, padding:14, alignItems:'center', justifyContent:'center' },
  btnTxt:        { fontSize:14, fontWeight:'800', letterSpacing:0.3 },
  input:         { backgroundColor:'#0E150E', borderWidth:1.5, borderColor:'#1C2A1C', borderRadius:12, color:'#D4EDD4', fontSize:14, padding:12 },
  lbl:           { fontSize:10, color:'#4A6A4A', fontWeight:'700', letterSpacing:2, marginBottom:10, marginTop:2, textTransform:'uppercase' },
  pill:          { paddingHorizontal:13, paddingVertical:8, borderRadius:10, borderWidth:1.5, borderColor:'#1C2A1C', alignItems:'center' },
  pillTxt:       { fontSize:12, fontWeight:'600', color:'#4A6A4A' },
  card:          { borderRadius:18, borderWidth:1, padding:16, marginBottom:0 },
  catCard:       { flex:1, minWidth:(width-52)/2, borderRadius:18, borderWidth:1, padding:15, marginBottom:0, position:'relative', overflow:'visible' },
  catLabel:      { fontSize:14, fontWeight:'800', color:'#D4EDD4', letterSpacing:0.3 },
  catSub:        { fontSize:11, color:'#3A5A3A', marginTop:2 },
  grid2:         { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:10 },
  sectionLbl:    { fontSize:10, color:'#3A5A3A', fontWeight:'700', marginBottom:11, letterSpacing:2 },
  pageTitle:     { fontSize:24, fontWeight:'900', color:'#D4EDD4', letterSpacing:-0.5, lineHeight:28 },
  greet:         { fontSize:11, color:'#3A5A3A', fontWeight:'600', letterSpacing:0.5 },
  heroCard:      { borderRadius:22, borderWidth:1, padding:20, marginBottom:20, position:'relative', overflow:'visible' },
  heroLbl:       { fontSize:10, fontWeight:'700', letterSpacing:2, marginBottom:8, textTransform:'uppercase' },
  heroAmt:       { fontSize:40, fontWeight:'900', color:'#D4EDD4', lineHeight:44, letterSpacing:-1 },
  heroSub:       { fontSize:11, color:'#3A5A3A', marginTop:5, marginBottom:16 },
  heroRow:       { flexDirection:'row', borderTopWidth:1, paddingTop:13 },
  heroStat:      { flex:1 },
  heroStatL:     { fontSize:9, color:'#3A5A3A', letterSpacing:1.5, fontWeight:'700', textTransform:'uppercase' },
  heroStatV:     { fontSize:19, fontWeight:'800', color:'#D4EDD4', marginTop:2 },
  briefCard:     { borderRadius:14, borderWidth:1, borderLeftWidth:2, padding:13, marginBottom:9, flexDirection:'row', alignItems:'center', gap:13 },
  briefIcon:     { width:38, height:38, borderRadius:11, alignItems:'center', justifyContent:'center', flexShrink:0 },
  briefTitle:    { fontSize:13, fontWeight:'700', color:'#D4EDD4' },
  checkbox:      { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:'#1C2A1C', alignItems:'center', justifyContent:'center', flexShrink:0 },
  settingsHeader:{ backgroundColor:'#0A100A', borderBottomWidth:1, borderBottomColor:'#1C2A1C', padding:15, paddingTop:Platform.OS==='android'?(StatusBar.currentHeight||0)+8:15, flexDirection:'row', alignItems:'center', gap:12 },
  backBtn:       { width:36, height:36, borderRadius:10, backgroundColor:'#131C13', borderWidth:1, borderColor:'#1C2A1C', alignItems:'center', justifyContent:'center' },
  settingsRow:   { flexDirection:'row', alignItems:'center', gap:13, borderRadius:14, borderWidth:1, padding:13, marginBottom:9 },
  settingsIcon:  { width:39, height:39, borderRadius:11, alignItems:'center', justifyContent:'center', flexShrink:0 },
});
