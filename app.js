import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Dimensions,
  Platform, KeyboardAvoidingView, Alert, Animated, Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#0C0D13', surface: '#13141C', card: '#191B26', card2: '#1F2133',
  border: '#252840', blue: '#4E7CF6', green: '#00D4A0', orange: '#FF8C42',
  pink: '#FF4F8B', yellow: '#FFD166', white: '#FFFFFF', text: '#E8EAF6',
  muted: '#6B7390', muted2: '#3A3D54',
};

// ── PERSISTENCE ───────────────────────────────────────────────────────────────
function usePersist(key, defaultVal) {
  const [value, setValue] = useState(defaultVal);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(key).then(v => {
      if (v) setValue(JSON.parse(v));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [key]);
  const set = useCallback((updater) => {
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [key]);
  return [value, set, loaded];
}

// ── SPLASH SCREEN ─────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo appears
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      // Rings pulse out
      Animated.parallel([
        Animated.timing(ring1, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(ring2, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(textOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      ]).start(() => {
        // Hold then fade out
        setTimeout(() => {
          Animated.timing(splashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(onDone);
        }, 800);
      });
    });
  }, []);

  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.2] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.8] });
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.3, 0] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.2, 0] });

  return (
    <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {/* Pulse rings */}
        <Animated.View style={[styles.ring, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity, borderColor: T.blue }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity, borderColor: T.blue }]} />
        {/* Logo */}
        <Animated.View style={[styles.splashLogo, { transform: [{ scale }], opacity }]}>
          <Text style={{ fontSize: 42 }}>⚡</Text>
        </Animated.View>
        {/* App name */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 20 }}>
          <Text style={styles.splashName}>NEXUS</Text>
          <Text style={styles.splashSub}>Your Personal AI Hub</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ── ANIMATED CARD ─────────────────────────────────────────────────────────────
function ACard({ children, style, onPress, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 350,
      delay, easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }, { scale: pressAnim }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}
        activeOpacity={onPress ? 1 : 1}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── ANIMATED BUTTON ───────────────────────────────────────────────────────────
const Btn = ({ label, onPress, color = T.blue, variant = 'fill', style, disabled, loading }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        disabled={disabled || loading} activeOpacity={1}
        style={[styles.btn, variant === 'fill'
          ? { backgroundColor: disabled ? T.muted2 : color }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color={variant === 'fill' ? '#fff' : color} size="small" />
          : <Text style={[styles.btnText, { color: variant === 'fill' ? '#fff' : color }]}>{label}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── TAB WRAPPER (fade transition) ─────────────────────────────────────────────
function TabView({ children, tabKey }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [tabKey]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
const Tag = ({ label, color }) => (
  <View style={[styles.tag, { backgroundColor: color + '22', borderColor: color + '44' }]}>
    <Text style={[styles.tagText, { color }]}>{label}</Text>
  </View>
);

const Inp = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline }) => (
  <View style={{ marginBottom: 12 }}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={T.muted} keyboardType={keyboardType} multiline={multiline}
      style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
    />
  </View>
);

const SH = ({ title, subtitle }) => (
  <View style={{ marginBottom: 18 }}>
    <Text style={styles.pageTitle}>{title}</Text>
    {subtitle && <Text style={styles.pageSub}>{subtitle}</Text>}
  </View>
);

const PickerRow = ({ label, options, value, onChange }) => (
  <View style={{ marginBottom: 12 }}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map(opt => (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)}
            style={[styles.pill, value === opt && { backgroundColor: T.blue + '25', borderColor: T.blue }]}>
            <Text style={[styles.pillText, value === opt && { color: T.blue }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </View>
);

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'home',    label: 'Home',    icon: '⊞' },
  { key: 'content', label: 'Content', icon: '✦' },
  { key: 'markets', label: 'Markets', icon: '◈' },
  { key: 'income',  label: 'Income',  icon: '₹' },
  { key: 'tasks',   label: 'Tasks',   icon: '◎' },
  { key: 'news',    label: 'News',    icon: '⊕' },
];

const BottomNav = ({ active, setActive }) => (
  <View style={styles.bottomNav}>
    {TABS.map(t => {
      const isActive = active === t.key;
      return (
        <TouchableOpacity key={t.key} onPress={() => setActive(t.key)} activeOpacity={0.7} style={styles.navItem}>
          <View style={[styles.navIconWrap, isActive && { backgroundColor: T.blue + '20' }]}>
            <Text style={[styles.navIcon, { color: isActive ? T.blue : T.muted2 }]}>{t.icon}</Text>
          </View>
          <Text style={[styles.navLabel, { color: isActive ? T.blue : T.muted }]}>{t.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ income, tasks, setActive }) {
  const total = income.reduce((s, i) => s + i.amount, 0);
  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  const quick = [
    { tab: 'content', icon: '✍️', label: 'Content',  sub: 'Generate now' },
    { tab: 'markets', icon: '📈', label: 'Markets',  sub: 'Live prices' },
    { tab: 'income',  icon: '💰', label: 'Income',   sub: `₹${total.toLocaleString('en-IN')}` },
    { tab: 'tasks',   icon: '✅', label: 'Tasks',    sub: `${pending} pending` },
    { tab: 'news',    icon: '📰', label: 'News',     sub: 'Trending' },
    { tab: 'content', icon: '🤖', label: 'AI Write', sub: 'All formats' },
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ACard delay={0} style={{ backgroundColor: '#1a3a8f', marginBottom: 16 }}>
        <Text style={styles.heroLabel}>TOTAL INCOME</Text>
        <Text style={styles.heroAmount}>₹{total.toLocaleString('en-IN')}</Text>
        <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
          {[['ENTRIES', income.length], ['PENDING', pending], ['DONE', done]].map(([l, v]) => (
            <View key={l}>
              <Text style={styles.heroStatLabel}>{l}</Text>
              <Text style={styles.heroStatVal}>{v}</Text>
            </View>
          ))}
        </View>
      </ACard>

      <Text style={styles.sectionLabel}>QUICK ACCESS</Text>
      <View style={styles.grid2}>
        {quick.map((item, i) => (
          <ACard key={i} delay={i * 60 + 100} style={{ flex: 1, minWidth: (width - 52) / 2 }} onPress={() => setActive(item.tab)}>
            <Text style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</Text>
            <Text style={styles.cardTitle}>{item.label}</Text>
            <Text style={styles.cardSub}>{item.sub}</Text>
          </ACard>
        ))}
      </View>

      {income.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>RECENT INCOME</Text>
          {income.slice(0, 3).map((item, i) => (
            <ACard key={i} delay={i * 60 + 500} style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.cardTitle}>{item.source}</Text>
                <Text style={styles.cardSub}>{item.category} · {item.date}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: T.green }]}>+₹{item.amount.toLocaleString('en-IN')}</Text>
            </ACard>
          ))}
        </>
      )}

      {tasks.filter(t => !t.done).length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 8 }]}>NEXT TASKS</Text>
          {tasks.filter(t => !t.done).slice(0, 3).map((t, i) => (
            <ACard key={t.id} delay={i * 60 + 600} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.priority === 'High' ? T.pink : t.priority === 'Medium' ? T.orange : T.green }} />
              <Text style={{ color: T.text, fontSize: 13, flex: 1 }}>{t.text}</Text>
            </ACard>
          ))}
        </>
      )}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── CONTENT ───────────────────────────────────────────────────────────────────
const NICHES = ['AI Tools & Productivity', 'Crypto & Web3', 'Personal Finance India', 'Side Hustles India', 'Tech News'];
const TONES  = ['Educational', 'Entertaining', 'Controversial', 'Inspiring'];
const FMTS   = [
  { key: 'youtube', label: '▶ YouTube', color: T.orange },
  { key: 'blog',    label: '✍ Blog',   color: T.blue },
  { key: 'twitter', label: '✦ X Thread', color: '#1DA1F2' },
];

function ContentModule() {
  const [topic, setTopic]     = useState('');
  const [niche, setNiche]     = useState(NICHES[0]);
  const [tone, setTone]       = useState(TONES[0]);
  const [formats, setFormats] = useState(['youtube', 'blog', 'twitter']);
  const [loading, setLoading] = useState(false);
  const [outputs, setOutputs] = useState(null);
  const [activeOut, setActiveOut] = useState('youtube');
  const [history, setHistory] = useState([]);
  const [msg, setMsg]         = useState({ text: '', type: '' });

  const toggleFmt = k => setFormats(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const generate = async () => {
    if (!formats.length) { setMsg({ text: 'Pick at least one format.', type: 'error' }); return; }
    setMsg({ text: '', type: '' }); setLoading(true); setOutputs(null);
    try {
      const prompt = `You are an expert content creator for ${niche}.
${topic ? `Topic: "${topic}"` : `Auto-pick the most trending topic today in ${niche}`}
Tone: ${tone}. Formats: ${formats.join(', ')}.
Respond ONLY in JSON, no markdown, no backticks:
{"topic":"...","youtube":"Full script 600+ words","blog":"Full article 700+ words","twitter":"8-12 numbered tweets"}
Only include keys for requested formats.`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      const txt = data.content.find(b => b.type === 'text')?.text || '';
      const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
      setOutputs(parsed); setActiveOut(formats[0]);
      setHistory(p => [{ ...parsed, formats, time: new Date().toLocaleTimeString() }, ...p.slice(0, 7)]);
    } catch (e) { setMsg({ text: e.message || 'Error. Try again.', type: 'error' }); }
    setLoading(false);
  };

  const copy = text => { Alert.alert('Copied!', 'Content copied.'); };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SH title="Content Pipeline" subtitle="Generate across all platforms" />
        <ACard delay={0} style={{ marginBottom: 14 }}>
          <Inp label="TOPIC (blank = auto trending)" value={topic} onChangeText={setTopic} placeholder="e.g. Top 5 AI tools for students" />
          <PickerRow label="NICHE" options={NICHES} value={niche} onChange={setNiche} />
          <PickerRow label="TONE" options={TONES} value={tone} onChange={setTone} />
          <Text style={styles.inputLabel}>FORMATS</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {FMTS.map(f => (
              <TouchableOpacity key={f.key} onPress={() => toggleFmt(f.key)}
                style={[styles.pill, formats.includes(f.key) && { backgroundColor: f.color + '22', borderColor: f.color }]}>
                <Text style={[styles.pillText, formats.includes(f.key) && { color: f.color }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ACard>

        {msg.text !== '' && (
          <View style={[styles.msgBox, { borderColor: msg.type === 'error' ? T.pink + '66' : T.green + '66', backgroundColor: msg.type === 'error' ? T.pink + '15' : T.green + '15' }]}>
            <Text style={{ color: msg.type === 'error' ? T.pink : T.green, fontSize: 13 }}>{msg.text}</Text>
          </View>
        )}

        <Btn label="⚡  Generate Content Now" onPress={generate} loading={loading} style={{ marginBottom: 16 }} />

        {outputs && (
          <ACard delay={0} style={{ marginBottom: 14 }}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>📌 {outputs.topic}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {FMTS.filter(f => formats.includes(f.key) && outputs[f.key]).map(f => (
                  <TouchableOpacity key={f.key} onPress={() => setActiveOut(f.key)}
                    style={[styles.pill, activeOut === f.key && { backgroundColor: f.color + '22', borderColor: f.color }]}>
                    <Text style={[styles.pillText, activeOut === f.key && { color: f.color }]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <ScrollView style={{ maxHeight: 280, backgroundColor: T.card2, borderRadius: 12, padding: 12 }} nestedScrollEnabled>
              <Text style={{ color: T.text, fontSize: 12.5, lineHeight: 20 }}>{outputs[activeOut]}</Text>
            </ScrollView>
            <Btn label="Copy Content" onPress={() => copy(outputs[activeOut])} variant="outline" style={{ marginTop: 12 }} />
          </ACard>
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>HISTORY</Text>
            {history.map((h, i) => (
              <ACard key={i} delay={i * 50} style={{ marginBottom: 8 }} onPress={() => { setOutputs(h); setFormats(h.formats); setActiveOut(h.formats[0]); }}>
                <Text style={styles.cardTitle}>{h.topic}</Text>
                <Text style={styles.cardSub}>{h.time} · {h.formats.join(', ')}</Text>
              </ACard>
            ))}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── MARKETS ───────────────────────────────────────────────────────────────────
const COINS = ['bitcoin','ethereum','solana','binancecoin','ripple','dogecoin'];
const CI = {
  bitcoin:     { sym: 'BTC', icon: '₿', color: '#F7931A' },
  ethereum:    { sym: 'ETH', icon: 'Ξ', color: '#627EEA' },
  solana:      { sym: 'SOL', icon: '◎', color: '#9945FF' },
  binancecoin: { sy
