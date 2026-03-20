import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, StatusBar, ActivityIndicator, Dimensions,
  Platform, KeyboardAvoidingView, Alert, Modal, Image,
  Animated, Easing, Vibration, RefreshControl, Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const ACCENT_PRESETS = ['#00FF88','#00CFFF','#FF8C42','#CC88FF','#FF4F8B','#FFD166','#FF4444','#44FFFF','#FF6B35','#00D4AA'];
const GRADIENT_PRESETS = [
  { name:'Jungle Night', colors:['#060A06','#0A140A'] },
  { name:'Deep Ocean',   colors:['#060B14','#0A1428'] },
  { name:'Royal Dark',   colors:['#0A0514','#140A28'] },
  { name:'Sunset Dark',  colors:['#140A05','#281408'] },
  { name:'Cherry Night', colors:['#140508','#280A10'] },
  { name:'Pure Black',   colors:['#000000','#080808'] },
  { name:'Midnight Teal',colors:['#041410','#082820'] },
  { name:'Void Purple',  colors:['#0A0614','#140A28'] },
];
const EMOJI_LIST = ['⚡','🔥','💎','🚀','🌟','💰','🤖','🎯','👑','🏆','💫','⭐','🎨','🔮','🌊','🦋','😎','🐉','🦊','👾','🕹️','💻','🛸','⚙️','🌙','☠️','🔱','🗡️','🇮🇳','🕉️','🙏','🌺','🐱','🐺','🦅','🦁','🐙','🎌','⛩️'];
const ANIMS = ['none','float','bounce','pulse','spin','shake','breathe'];
const NICHES = ['AI Tools & Productivity','Crypto & Web3','Personal Finance India','Side Hustles India','Tech News'];
const GOALS = ['₹5,000/month','₹10,000/month','₹25,000/month','₹50,000/month','₹1,00,000/month'];
const ICATS = ['Content','Freelance','Affiliate','Crypto','Digital Products','Other'];
const PRIOS = ['High','Medium','Low'];
const PC = { High:'#FF4F8B', Medium:'#FF8C42', Low:'#00FF88' };
const COINS = ['bitcoin','ethereum','solana','binancecoin','ripple','dogecoin'];
const CI = {
  bitcoin:{sym:'BTC',icon:'₿',color:'#F7931A'}, ethereum:{sym:'ETH',icon:'Ξ',color:'#627EEA'},
  solana:{sym:'SOL',icon:'◎',color:'#9945FF'}, binancecoin:{sym:'BNB',icon:'◆',color:'#F0B90B'},
  ripple:{sym:'XRP',icon:'✦',color:'#00AAE4'}, dogecoin:{sym:'DOGE',icon:'Ð',color:'#C2A633'},
};
const NTOPICS = ['AI Tools India','Crypto India today','Side hustle ideas India','Earn money online India','Tech news today'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['S','M','T','W','T','F','S'];

// ── DEFAULT STATE ──────────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  accent: '#00FF88',
  bgGradient: ['#060A06','#0A140A'],
  coverType: 'gradient',
  coverGradient: ['#0A1A0A','#060E06'],
  coverColor: '#0A1A0A',
  coverImage: null,
  coverEmoji: '⚡',
  coverTitle: 'NEXUS',
  coverSubtitle: 'Personal AI Hub',
  heroSticker: null,
  heroStickerIsImg: false,
  heroStickerAnim: 'float',
  heroStickerSize: 120,
  heroStickerSide: 'right',
  glassBlur: 0,
  calendarAccent: '#00FF88',
  calendarVisible: true,
  groqKey: '',
  notificationsEnabled: true,
  stickers: {},
  widgets: [
    { id:'income',  name:'Total Income', icon:'💰', accent:'#00FF88', size:'large',  visible:true, anim:'none', sticker:null, stickerAnim:'float' },
    { id:'markets', name:'Markets',      icon:'📈', accent:'#F7931A', size:'medium', visible:true, anim:'none', sticker:null, stickerAnim:'float' },
    { id:'tasks',   name:'Tasks',        icon:'✅', accent:'#00CFFF', size:'medium', visible:true, anim:'none', sticker:null, stickerAnim:'float' },
    { id:'apps',    name:'Ecosystem',    icon:'⬡',  accent:'#CC88FF', size:'medium', visible:true, anim:'none', sticker:null, stickerAnim:'float' },
    { id:'news',    name:'Intel',        icon:'📰', accent:'#FF8C42', size:'medium', visible:true, anim:'none', sticker:null, stickerAnim:'float' },
    { id:'brief',   name:'Daily Brief',  icon:'📋', accent:'#FFD166', size:'full',   visible:true, anim:'none', sticker:null, stickerAnim:'float' },
  ],
  tabs: [
    { id:'home',  name:'Home',  icon:'⊞', visible:true },
    { id:'money', name:'Money', icon:'₹', visible:true },
    { id:'apps',  name:'Apps',  icon:'⬡', visible:true },
    { id:'intel', name:'Intel', icon:'◈', visible:true },
    { id:'life',  name:'Life',  icon:'◎', visible:true },
  ],
};

const DEFAULT_ACCOUNT = {
  name:'', username:'', goal:'₹10,000/month',
  niche:'AI Tools & Productivity',
  joined: new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'}),
};

const DEFAULT_TASKS = [
  { id:1, text:'Post first AI content piece', priority:'High',   goal:'Content',      done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:2, text:'Create Telegram channel',     priority:'High',   goal:'Telegram',     done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:3, text:'Sign up for Instamojo',       priority:'Medium', goal:'Monetization', done:false, created:new Date().toLocaleDateString('en-IN') },
  { id:4, text:'Research affiliate programs', priority:'Medium', goal:'Affiliate',    done:false, created:new Date().toLocaleDateString('en-IN') },
];

// ── HELPERS ────────────────────────────────────────────────────────────────────
const haptic = (type='light') => {
  if(type==='light') Vibration.vibrate(10);
  if(type==='medium') Vibration.vibrate(20);
  if(type==='heavy') Vibration.vibrate([0,30,10,30]);
  if(type==='success') Vibration.vibrate([0,10,10,20]);
};

const getGreeting = () => {
  const h = new Date().getHours();
  if(h<6) return 'Still up? 🦉';
  if(h<12) return 'Good morning ☀️';
  if(h<17) return 'Good afternoon 👋';
  if(h<21) return 'Good evening 🌆';
  return 'Good night 🌙';
};

function usePersist(key, def) {
  const [value, setValue] = useState(def);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(key).then(v => { if(v) setValue(JSON.parse(v)); setLoaded(true); }).catch(()=>setLoaded(true));
  }, [key]);
  const set = useCallback(u => {
    setValue(p => { const n = typeof u==='function'?u(p):u; AsyncStorage.setItem(key,JSON.stringify(n)).catch(()=>{}); return n; });
  }, [key]);
  return [value, set, loaded];
}

// ── ANIMATED STICKER ───────────────────────────────────────────────────────────
function AnimSticker({ emoji, effect, size=36, isImg=false, style={} }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if(!effect||effect==='none') return;
    const anims = {
      float:   Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:1,duration:1500,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(anim,{toValue:0,duration:1500,easing:Easing.inOut(Easing.sin),useNativeDriver:true})])),
      bounce:  Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:1,duration:600,easing:Easing.out(Easing.quad),useNativeDriver:true}),Animated.timing(anim,{toValue:0,duration:600,easing:Easing.in(Easing.quad),useNativeDriver:true})])),
      pulse:   Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:1,duration:800,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),Animated.timing(anim,{toValue:0,duration:800,easing:Easing.inOut(Easing.ease),useNativeDriver:true})])),
      spin:    Animated.loop(Animated.timing(anim,{toValue:1,duration:2000,easing:Easing.linear,useNativeDriver:true})),
      shake:   Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:1,duration:100,useNativeDriver:true}),Animated.timing(anim,{toValue:-1,duration:100,useNativeDriver:true}),Animated.timing(anim,{toValue:0,duration:100,useNativeDriver:true})])),
      breathe: Animated.loop(Animated.sequence([Animated.timing(anim,{toValue:1,duration:1200,easing:Easing.inOut(Easing.ease),useNativeDriver:true}),Animated.timing(anim,{toValue:0,duration:1200,easing:Easing.inOut(Easing.ease),useNativeDriver:true})])),
    };
    const a = anims[effect]; if(a) a.start();
    return () => anim.stopAnimation();
  }, [effect]);
  const getT = () => {
    if(effect==='float')   return [{translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-10]})}];
    if(effect==='bounce')  return [{translateY:anim.interpolate({inputRange:[0,1],outputRange:[0,-14]})}];
    if(effect==='pulse')   return [{scale:anim.interpolate({inputRange:[0,1],outputRange:[1,1.25]})}];
    if(effect==='spin')    return [{rotate:anim.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}];
    if(effect==='shake')   return [{translateX:anim.interpolate({inputRange:[-1,1],outputRange:[-6,6]})}];
    if(effect==='breathe') return [{scale:anim.interpolate({inputRange:[0,1],outputRange:[1,1.14]})}];
    return [];
  };
  return (
    <Animated.View style={[{transform:getT()},style]}>
      {isImg && emoji
        ? <Image source={{uri:emoji}} style={{width:size,height:size}} resizeMode="contain"/>
        : <Text style={{fontSize:size}}>{emoji}</Text>
      }
    </Animated.View>
  );
}

// ── INCOME CHART ───────────────────────────────────────────────────────────────
function IncomeChart({ income, accent }) {
  const last7 = React.useMemo(() => {
    const days = [];
    for(let i=6;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i);
      const key=d.toLocaleDateString('en-IN');
      const total=income.filter(x=>x.date===key).reduce((s,x)=>s+x.amount,0);
      days.push({label:d.toLocaleDateString('en-IN',{weekday:'short'}).slice(0,1),total});
    }
    return days;
  },[income]);
  const maxVal=Math.max(...last7.map(d=>d.total),100);
  const chartH=60;
  if(income.length===0) return null;
  return (
    <View style={{marginBottom:14}}>
      <Text style={[S.lbl,{marginBottom:10}]}>INCOME THIS WEEK</Text>
      <View style={{flexDirection:'row',alignItems:'flex-end',gap:5,height:chartH+20}}>
        {last7.map((day,i)=>{
          const barH=day.total>0?Math.max((day.total/maxVal)*chartH,5):3;
          const isToday=i===6;
          return (
            <View key={i} style={{flex:1,alignItems:'center',justifyContent:'flex-end'}}>
              {day.total>0&&<Text style={{fontSize:8,color:accent,fontWeight:'700',marginBottom:2}}>{day.total>=1000?`${(day.total/1000).toFixed(1)}k`:day.total}</Text>}
              <View style={{width:'100%',height:barH,borderRadius:3,backgroundColor:isToday?accent:day.total>0?accent+'55':'#1C2A1C',elevation:isToday?4:0}}/>
              <Text style={{fontSize:9,color:isToday?accent:'#4A6A4A',marginTop:4,fontWeight:isToday?'700':'400'}}>{day.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── CALENDAR ───────────────────────────────────────────────────────────────────
function CalendarWidget({ accent, visible, onLongPress }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const today = now.getDate();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const pressTimer = useRef(null);
  if(!visible) return null;
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  return (
    <View style={[S.card,{borderColor:accent+'33',marginBottom:12}]}
      onStartShouldSetResponder={()=>true}
      onResponderGrant={()=>{pressTimer.current=setTimeout(onLongPress,700);}}
      onResponderRelease={()=>clearTimeout(pressTimer.current)}
    >
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <TouchableOpacity onPress={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}} style={{width:28,height:28,borderRadius:8,backgroundColor:accent+'20',alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:accent,fontSize:14,fontWeight:'700'}}>‹</Text>
        </TouchableOpacity>
        <Text style={{fontSize:13,fontWeight:'800',color:'#D4EDD4'}}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}} style={{width:28,height:28,borderRadius:8,backgroundColor:accent+'20',alignItems:'center',justifyContent:'center'}}>
          <Text style={{color:accent,fontSize:14,fontWeight:'700'}}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={{flexDirection:'row',marginBottom:4}}>
        {DAYS_SHORT.map(d=><Text key={d} style={{flex:1,textAlign:'center',fontSize:9,color:'#4A6A4A',fontWeight:'700',letterSpacing:0.5}}>{d}</Text>)}
      </View>
      <View style={{flexDirection:'row',flexWrap:'wrap'}}>
        {cells.map((d,i)=>{
          const isToday=d===today&&month===now.getMonth()&&year===now.getFullYear();
          return (
            <View key={i} style={{width:'14.28%',alignItems:'center',paddingVertical:4}}>
              <View style={{width:26,height:26,borderRadius:13,backgroundColor:isToday?accent:'transparent',alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:11,color:isToday?'#000':d?'#D4EDD4':'transparent',fontWeight:isToday?'800':'400'}}>{d||''}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────
const Lbl = ({children}) => <Text style={S.lbl}>{children}</Text>;

const HBtn = ({label,onPress,color,variant='fill',style,disabled,loading,hap='light'}) => {
  const scale=useRef(new Animated.Value(1)).current;
  const c=color||'#00FF88';
  const pIn=()=>{haptic(hap);Animated.spring(scale,{toValue:0.96,useNativeDriver:true,speed:50}).start();};
  const pOut=()=>{Animated.spring(scale,{toValue:1,useNativeDriver:true,speed:30}).start();};
  return (
    <Animated.View style={{transform:[{scale}]}}>
      <TouchableOpacity onPress={onPress} onPressIn={pIn} onPressOut={pOut} disabled={disabled||loading} activeOpacity={1}
        style={[S.btn,variant==='fill'?{backgroundColor:disabled?'#1C2A1C':c}:{backgroundColor:'transparent',borderWidth:1.5,borderColor:c},style]}>
        {loading?<ActivityIndicator color={variant==='fill'?'#000':c} size="small"/>:<Text style={[S.btnTxt,{color:variant==='fill'?'#000':c}]}>{label}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
};

const Inp = ({label,value,onChangeText,placeholder,keyboardType='default',multiline,secureTextEntry}) => (
  <View style={{marginBottom:13}}>
    {label&&<Text style={S.lbl}>{label}</Text>}
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#3A5A3A"
      keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry}
      style={[S.input,multiline&&{height:80,textAlignVertical:'top'}]}/>
  </View>
);

const PickerRow = ({label,options,value,onChange,accent='#00FF88'}) => (
  <View style={{marginBottom:12}}>
    {label&&<Text style={S.lbl}>{label}</Text>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{flexDirection:'row',gap:8}}>
        {options.map(opt=>(
          <TouchableOpacity key={opt} onPress={()=>{haptic('light');onChange(opt);}} style={[S.pill,value===opt&&{backgroundColor:accent+'22',borderColor:accent}]}>
            <Text style={[S.pillTxt,value===opt&&{color:accent}]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  </View>
);

const Toggle = ({value,onChange,accent}) => (
  <TouchableOpacity onPress={()=>{haptic('light');onChange(!value);}} activeOpacity={0.8}
    style={{width:46,height:24,borderRadius:12,backgroundColor:value?accent:'#1C2A1C',justifyContent:'center'}}>
    <View style={{width:18,height:18,borderRadius:9,backgroundColor:value?'#000':'#4A6A4A',position:'absolute',left:value?25:4}}/>
  </TouchableOpacity>
);

const Tag = ({label,color}) => (
  <View style={{backgroundColor:color+'20',borderRadius:7,paddingHorizontal:8,paddingVertical:2}}>
    <Text style={{fontSize:11,color,fontWeight:'600'}}>{label}</Text>
  </View>
);

// ── EDITOR SHEET (bottom sheet) ────────────────────────────────────────────────
function EditorSheet({title,children,onClose,onSave,accent}) {
  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'flex-end'}}>
        <View style={{backgroundColor:'#0A100A',borderRadius:'24px 24px 0 0',maxHeight:height*0.88,borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,borderColor:accent+'33',overflow:'hidden'}}>
          <View style={{padding:'15px 18px',paddingHorizontal:18,paddingVertical:15,borderBottomWidth:1,borderBottomColor:'#1C2A1C',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <Text style={{fontSize:16,fontWeight:'800',color:'#D4EDD4'}}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{width:34,height:34,borderRadius:10,backgroundColor:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
              <Text style={{color:'#5A7A5A',fontSize:18}}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{flex:1}} contentContainerStyle={{padding:16}} showsVerticalScrollIndicator={false}>
            {children}
            <View style={{height:20}}/>
          </ScrollView>
          {onSave&&(
            <View style={{padding:16,borderTopWidth:1,borderTopColor:'#1C2A1C'}}>
              <HBtn label="Save Changes ✓" onPress={onSave} color={accent} hap="success"/>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── EMOJI PICKER ROW ───────────────────────────────────────────────────────────
function EmojiPicker({value,onChange,accent}) {
  return (
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:14}}>
      {EMOJI_LIST.map(e=>(
        <TouchableOpacity key={e} onPress={()=>{haptic('light');onChange(e);}}
          style={{width:42,height:42,borderRadius:10,backgroundColor:value===e?accent+'20':'#131C13',borderWidth:1.5,borderColor:value===e?accent:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:20}}>{e}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── ACCENT PICKER ──────────────────────────────────────────────────────────────
function AccentPicker({value,onChange}) {
  return (
    <View style={{flexDirection:'row',gap:9,flexWrap:'wrap',marginBottom:14}}>
      {ACCENT_PRESETS.map(c=>(
        <TouchableOpacity key={c} onPress={()=>{haptic('light');onChange(c);}}
          style={{width:40,height:40,borderRadius:11,backgroundColor:c,borderWidth:value===c?3:0,borderColor:'#D4EDD4'}}/>
      ))}
    </View>
  );
}

// ── TABS ───────────────────────────────────────────────────────────────────────
const TABS = [{k:'home',i:'⊞',l:'Home'},{k:'money',i:'₹',l:'Money'},{k:'apps',i:'⬡',l:'Apps'},{k:'intel',i:'◈',l:'Intel'},{k:'life',i:'◎',l:'Life'}];

function BottomNav({active,setActive,accent,tabs}) {
  const visibleTabs = tabs.filter(t=>t.visible);
  return (
    <View style={S.bottomNav}>
      {visibleTabs.map(t=>(
        <TouchableOpacity key={t.id} onPress={()=>{haptic('light');setActive(t.id);}} activeOpacity={0.7} style={S.navItem}>
          <View style={[S.navIconWrap,active===t.id&&{backgroundColor:accent+'25'}]}>
            <Text style={{fontSize:15,fontWeight:'700',color:active===t.id?accent:'#3A5A3A'}}>{t.icon}</Text>
          </View>
          <Text style={[S.navLbl,{color:active===t.id?accent:'#3A5A3A'}]}>{t.name}</Text>
          {active===t.id&&<View style={[S.navLine,{backgroundColor:accent}]}/>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────────
function OnboardingScreen({onComplete}) {
  const [step,setStep]=useState(0);
  const [name,setName]=useState('');
  const [goal,setGoal]=useState('₹10,000/month');
  const [niche,setNiche]=useState('AI Tools & Productivity');
  const [apiKey,setApiKey]=useState('');
  const fade=useRef(new Animated.Value(0)).current;
  const slide=useRef(new Animated.Value(30)).current;
  useEffect(()=>{
    fade.setValue(0);slide.setValue(30);
    Animated.parallel([Animated.timing(fade,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(slide,{toValue:0,duration:400,easing:Easing.out(Easing.cubic),useNativeDriver:true})]).start();
  },[step]);
  const next=()=>{
    haptic('medium');
    if(step<3) setStep(s=>s+1);
    else { if(!name.trim()){Alert.alert('Name required','Please enter your name.');return;} onComplete({name,goal,niche,apiKey}); }
  };
  const STEPS=[
    {icon:'⚡',title:'Welcome to NEXUS',sub:'Your personal AI command center',
     content:<View style={{alignItems:'center',gap:14}}>
       <Text style={{fontSize:14,color:'#4A6A4A',textAlign:'center',lineHeight:22}}>{'NEXUS is your personal hub for\ncontent, money, markets and more.\n\nBuilt by you. For you.'}</Text>
       <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center'}}>
         {['📈 Live Markets','💰 Income Tracker','✅ Tasks','📰 News Intel','⬡ App Ecosystem'].map(f=>(
           <View key={f} style={{backgroundColor:'#1C2A1C',borderRadius:20,paddingHorizontal:13,paddingVertical:7}}><Text style={{color:'#D4EDD4',fontSize:12}}>{f}</Text></View>
         ))}
       </View>
     </View>},
    {icon:'👤',title:"What's your name?",sub:'NEXUS will greet you personally',
     content:<View>
       <Inp label="YOUR NAME" value={name} onChangeText={setName} placeholder="e.g. Nikhil"/>
       <Lbl>INCOME GOAL</Lbl>
       <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
         {GOALS.map(g=><TouchableOpacity key={g} onPress={()=>setGoal(g)} style={[S.pill,goal===g&&{backgroundColor:'#00FF8822',borderColor:'#00FF88'}]}><Text style={[S.pillTxt,goal===g&&{color:'#00FF88'}]}>{g}</Text></TouchableOpacity>)}
       </View>
     </View>},
    {icon:'🎯',title:'Pick your niche',sub:'Shapes your content and news',
     content:<View style={{gap:8}}>
       {NICHES.map(n=><TouchableOpacity key={n} onPress={()=>setNiche(n)} style={{padding:14,borderRadius:14,backgroundColor:niche===n?'#00FF8812':'#0E150E',borderWidth:1.5,borderColor:niche===n?'#00FF88':'#1C2A1C'}}><Text style={{fontSize:14,fontWeight:'600',color:niche===n?'#00FF88':'#D4EDD4'}}>{n}</Text></TouchableOpacity>)}
     </View>},
    {icon:'🔑',title:'Add Groq API Key',sub:'Powers AI features — free at groq.com',
     content:<View>
       <View style={{backgroundColor:'#00FF8810',borderWidth:1,borderColor:'#00FF8830',borderRadius:14,padding:14,marginBottom:16}}>
         <Text style={{fontSize:12,color:'#00FF88',lineHeight:18}}>{'1. Go to console.groq.com\n2. Sign up free\n3. Create API key\n4. Paste below\n\n'}}<Text style={{color:'#4A6A4A'}}>You can skip and add later in Settings.</Text></Text>
       </View>
       <Inp label="GROQ API KEY" value={apiKey} onChangeText={setApiKey} placeholder="gsk_..." secureTextEntry/>
     </View>},
  ];
  const cur=STEPS[step];
  return (
    <View style={{flex:1,backgroundColor:'#060A06'}}>
      <StatusBar barStyle="light-content" backgroundColor="#060A06"/>
      <View style={{flexDirection:'row',gap:6,justifyContent:'center',paddingTop:60,paddingBottom:30}}>
        {STEPS.map((_,i)=><View key={i} style={{width:i===step?24:8,height:8,borderRadius:4,backgroundColor:i<=step?'#00FF88':'#1C2A1C'}}/>)}
      </View>
      <Animated.View style={{flex:1,padding:24,opacity:fade,transform:[{translateY:slide}]}}>
        <View style={{alignItems:'center',marginBottom:28}}>
          <View style={{width:80,height:80,borderRadius:24,backgroundColor:'#00FF8818',borderWidth:1.5,borderColor:'#00FF8844',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:40}}>{cur.icon}</Text>
          </View>
          <Text style={{fontSize:24,fontWeight:'900',color:'#D4EDD4',marginTop:16,letterSpacing:-0.5}}>{cur.title}</Text>
          <Text style={{fontSize:13,color:'#4A6A4A',marginTop:4}}>{cur.sub}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{flex:1}}>{cur.content}</ScrollView>
      </Animated.View>
      <View style={{padding:24}}>
        <HBtn label={step<3?'Continue →':'Launch NEXUS ⚡'} onPress={next} color="#00FF88" hap="medium" style={{borderRadius:18,padding:17}}/>
        {step===3&&<TouchableOpacity onPress={()=>onComplete({name:name||'User',goal,niche,apiKey:''})} style={{marginTop:12,alignItems:'center'}}><Text style={{color:'#4A6A4A',fontSize:13}}>Skip for now</Text></TouchableOpacity>}
      </View>
    </View>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────────
function Dashboard({config,setConfig,income,tasks,setActive,account}) {
  const [editing,setEditing]=useState(null);
  const [widgetDraft,setWD]=useState(null);
  const [heroFileRef]=useState(useRef());
  const [coverFileRef]=useState(useRef());
  const pressTimers=useRef({});
  const accent=config.accent;
  const total=income.reduce((s,i)=>s+i.amount,0);
  const pending=tasks.filter(t=>!t.done).length;
  const u=(k,v)=>setConfig(p=>({...p,[k]:v}));
  const uw=(id,k,v)=>setConfig(p=>({...p,widgets:p.widgets.map(w=>w.id===id?{...w,[k]:v}:w)}));
  const uwd=(k,v)=>setWD(p=>({...p,[k]:v}));
  const saveWidget=()=>{setConfig(p=>({...p,widgets:p.widgets.map(w=>w.id===widgetDraft.id?{...widgetDraft}:w)}));setEditing(null);};

  const longPress=(key,cb)=>{
    return {
      onStartShouldSetResponder:()=>true,
      onResponderGrant:()=>{haptic('medium');pressTimers.current[key]=setTimeout(()=>{haptic('heavy');cb();},600);},
      onResponderRelease:()=>clearTimeout(pressTimers.current[key]),
      onResponderTerminate:()=>clearTimeout(pressTimers.current[key]),
    };
  };

  const pickImage=async(onPicked)=>{
    try {
      const {status}=await ImagePicker.requestMediaLibraryPermissionsAsync();
      if(status!=='granted'){Alert.alert('Permission needed','Allow photo access.');return;}
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,allowsEditing:true,quality:0.7});
      if(!result.canceled&&result.assets[0]){onPicked(result.assets[0].uri);haptic('success');}
    }catch(e){Alert.alert('Error','Could not open gallery.');}
  };

  const getCoverBg=()=>{
    if(config.coverType==='image'&&config.coverImage) return null;
    return config.coverType==='gradient'
      ?{colors:config.coverGradient}
      :{color:config.coverColor};
  };

  const coverStyle=config.coverType==='image'&&config.coverImage
    ?{backgroundColor:'#0A1A0A'}
    :config.coverType==='gradient'
      ?{backgroundColor:config.coverGradient[0]}
      :{backgroundColor:config.coverColor};

  const visibleWidgets=config.widgets.filter(w=>w.visible);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>

      {/* ── HERO BANNER ── */}
      <View style={{minHeight:180,position:'relative',...coverStyle}}>
        {config.coverType==='image'&&config.coverImage&&(
          <Image source={{uri:config.coverImage}} style={{position:'absolute',top:0,left:0,right:0,bottom:0}} resizeMode="cover"/>
        )}
        {/* Dark overlay */}
        <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(0,0,0,0.45)'}}/>

        {/* Hero sticker - pops out */}
        {config.heroSticker&&(
          <View style={{position:'absolute',bottom:-10,[config.heroStickerSide||'right']:10,zIndex:10,elevation:10}}>
            <AnimSticker emoji={config.heroSticker} effect={config.heroStickerAnim} size={config.heroStickerSize} isImg={config.heroStickerIsImg}
              style={{filter:'drop-shadow(0 16px 32px rgba(0,0,0,0.8))'}}/>
          </View>
        )}

        {/* Top bar */}
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:14,position:'relative',zIndex:5}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
            <View style={{width:36,height:36,borderRadius:11,backgroundColor:accent+'25',borderWidth:1,borderColor:accent+'44',alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:18}}>{config.coverEmoji}</Text>
            </View>
            <View>
              <Text style={{fontSize:16,fontWeight:'900',color:'#D4EDD4',letterSpacing:2.5}}>{config.coverTitle}</Text>
              <Text style={{fontSize:9,color:'#4A6A4A',letterSpacing:2}}>{config.coverSubtitle}</Text>
            </View>
          </View>
          <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:accent+'18',borderWidth:1,borderColor:accent+'33',borderRadius:20,paddingHorizontal:10,paddingVertical:4}}>
              <View style={{width:6,height:6,borderRadius:3,backgroundColor:accent}}/>
              <Text style={{fontSize:10,color:accent,fontWeight:'700'}}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={()=>setEditing('cover')} style={{width:34,height:34,borderRadius:10,backgroundColor:accent+'20',borderWidth:1.5,borderColor:accent+'40',alignItems:'center',justifyContent:'center'}}>
              <Text style={{fontSize:16}}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero info */}
        <View style={{padding:'0px 18px 20px',paddingHorizontal:18,paddingBottom:20,position:'relative',zIndex:5}}>
          <Text style={{fontSize:11,color:accent,fontWeight:'600',letterSpacing:1,marginBottom:4}}>{getGreeting().toUpperCase()}</Text>
          <Text style={{fontSize:26,fontWeight:'900',color:'#D4EDD4',lineHeight:30,marginBottom:14}}>Hey, {account.name||'there'}!</Text>
          <View style={{flexDirection:'row',gap:10}}>
            {[['₹'+total.toLocaleString('en-IN'),'Income'],[pending+'','Tasks'],['●','Live']].map(([v,l])=>(
              <View key={l} style={{backgroundColor:'rgba(255,255,255,0.08)',borderRadius:12,padding:'8px 12px',paddingHorizontal:12,paddingVertical:8,flex:1,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'}}>
                <Text style={{fontSize:15,fontWeight:'900',color:'#D4EDD4'}}>{v}</Text>
                <Text style={{fontSize:9,color:'#4A6A4A',letterSpacing:0.5}}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Edit banner hint */}
        <TouchableOpacity onPress={()=>setEditing('cover')} style={{position:'absolute',bottom:8,right:12,backgroundColor:'rgba(0,0,0,0.5)',borderRadius:20,paddingHorizontal:10,paddingVertical:4,zIndex:6}}>
          <Text style={{fontSize:9,color:'rgba(255,255,255,0.6)'}}>✏️ Edit Banner</Text>
        </TouchableOpacity>
      </View>

      <View style={{padding:'14px 14px 20px',paddingHorizontal:14,paddingTop:config.heroSticker?24:14}}>

        {/* Add sticker / character button */}
        <TouchableOpacity onPress={()=>setEditing('hero')} style={{borderWidth:1,borderStyle:'dashed',borderColor:accent+'44',borderRadius:14,padding:12,marginBottom:14,backgroundColor:accent+'06',alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8}}>
          <Text style={{color:accent,fontSize:12,fontWeight:'700'}}>{config.heroSticker?'✏️ Edit Banner Character':'➕ Add Anime Character / Sticker'}</Text>
        </TouchableOpacity>

        {/* Calendar */}
        <CalendarWidget accent={config.calendarAccent||accent} visible={config.calendarVisible!==false} onLongPress={()=>setEditing('calendar')}/>

        {/* Income chart */}
        <IncomeChart income={income} accent={accent}/>

        {/* Widget grid */}
        <Text style={[S.sectionLbl,{marginBottom:12}]}>DASHBOARD</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:14}}>
          {visibleWidgets.map(w=>{
            const isFull=w.size==='full'||w.size==='large';
            return (
              <View key={w.id} style={{width:isFull?'100%':'48%'}}
                {...longPress(w.id,()=>{setWD({...w});setEditing('widget');})}>
                <View style={[S.card,{borderColor:w.accent+'28',position:'relative',overflow:'visible'}]}>
                  {/* Widget sticker */}
                  {w.sticker&&(
                    <View style={{position:'absolute',top:-12,right:-4,zIndex:10}}>
                      <AnimSticker emoji={w.sticker} effect={w.stickerAnim} size={28}/>
                    </View>
                  )}
                  <View style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8}}>
                    <View style={{width:36,height:36,borderRadius:11,backgroundColor:w.accent+'18',borderWidth:1,borderColor:w.accent+'28',alignItems:'center',justifyContent:'center'}}>
                      <Text style={{fontSize:17}}>{w.icon}</Text>
                    </View>
                    <Text style={[S.catLabel,{flex:1}]}>{w.name}</Text>
                    <Text style={{fontSize:9,color:w.accent+'60'}}>hold</Text>
                  </View>
                  {w.id==='income'&&(
                    <>
                      <Text style={{fontSize:28,fontWeight:'900',color:'#D4EDD4',letterSpacing:-1}}>₹{total.toLocaleString('en-IN')}</Text>
                      <View style={{flexDirection:'row',gap:14,marginTop:8,paddingTop:8,borderTopWidth:1,borderTopColor:w.accent+'15'}}>
                        {[['ENTRIES',income.length],['PENDING',pending],['DONE',tasks.filter(t=>t.done).length]].map(([l,v])=>(
                          <View key={l}><Text style={S.heroStatL}>{l}</Text><Text style={[S.heroStatV,{fontSize:16}]}>{v}</Text></View>
                        ))}
                      </View>
                    </>
                  )}
                  {w.id==='markets'&&(
                    <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
                      {[['BTC','#F7931A','-4.5%'],['ETH','#627EEA','-6.1%']].map(([n,c,ch])=>(
                        <View key={n} style={{backgroundColor:c+'15',borderRadius:10,padding:'5px 8px',paddingHorizontal:8,paddingVertical:5,borderWidth:1,borderColor:c+'25'}}>
                          <Text style={{fontSize:10,color:c,fontWeight:'800'}}>{n}</Text>
                          <Text style={{fontSize:12,color:'#FF4F8B',fontWeight:'700'}}>{ch}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {w.id==='tasks'&&(
                    <>
                      <Text style={{fontSize:24,fontWeight:'900',color:'#D4EDD4'}}>{pending}</Text>
                      <Text style={S.catSub}>pending tasks</Text>
                      <View style={{backgroundColor:'#1C2A1C',borderRadius:99,height:4,marginTop:8,overflow:'hidden'}}>
                        <View style={{width:tasks.length?`${(tasks.filter(t=>t.done).length/tasks.length)*100}%`:'0%',height:'100%',backgroundColor:w.accent,borderRadius:99}}/>
                      </View>
                    </>
                  )}
                  {w.id==='apps'&&(
                    <View style={{flexDirection:'row',gap:7,marginTop:4}}>
                      {['✍️','📈','📢','🏦'].map(i=><View key={i} style={{width:30,height:30,borderRadius:9,backgroundColor:w.accent+'18',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:15}}>{i}</Text></View>)}
                    </View>
                  )}
                  {w.id==='news'&&(
                    <>
                      <Text style={{fontSize:12,color:'#D4EDD4',lineHeight:18}}>AI Tools India trending</Text>
                      <Text style={[S.catSub,{marginTop:3}]}>3 new stories</Text>
                    </>
                  )}
                  {w.id==='brief'&&(
                    <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                      {[['📰','AI trending'],['✅',pending+' tasks'],['📈','BTC -4.5%']].map(([i,t])=>(
                        <View key={t} style={{flex:1,backgroundColor:w.accent+'10',borderRadius:12,padding:'8px 6px',paddingHorizontal:6,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:w.accent+'20'}}>
                          <Text style={{fontSize:18}}>{i}</Text>
                          <Text style={{fontSize:9,color:'#D4EDD4',marginTop:3,fontWeight:'700',textAlign:'center'}}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick actions */}
        <View style={{flexDirection:'row',gap:10}}>
          <TouchableOpacity onPress={()=>setEditing('tabs')} style={{flex:1,padding:12,borderRadius:14,backgroundColor:'#0E150E',borderWidth:1,borderColor:'#1C2A1C',alignItems:'center'}}>
            <Text style={{color:'#4A6A4A',fontSize:12,fontWeight:'700'}}>⊞ Edit Tabs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setEditing('global')} style={{flex:1,padding:12,borderRadius:14,backgroundColor:accent+'12',borderWidth:1,borderColor:accent+'33',alignItems:'center'}}>
            <Text style={{color:accent,fontSize:12,fontWeight:'700'}}>🎨 Global Style</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── COVER EDITOR ── */}
      {editing==='cover'&&(
        <EditorSheet title="Edit Banner" onClose={()=>setEditing(null)} onSave={()=>setEditing(null)} accent={accent}>
          <Lbl>App Icon</Lbl><EmojiPicker value={config.coverEmoji} onChange={v=>u('coverEmoji',v)} accent={accent}/>
          <Lbl>App Name</Lbl>
          <TextInput value={config.coverTitle} onChangeText={v=>u('coverTitle',v)} style={[S.input,{marginBottom:14,fontSize:16,fontWeight:'800',letterSpacing:2}]}/>
          <Lbl>Subtitle</Lbl>
          <TextInput value={config.coverSubtitle} onChangeText={v=>u('coverSubtitle',v)} style={[S.input,{marginBottom:14}]}/>
          <Lbl>Banner Background</Lbl>
          <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
            {[{k:'gradient',l:'🌈 Gradient'},{k:'solid',l:'⬛ Solid'},{k:'image',l:'🖼️ Photo'}].map(t=>(
              <TouchableOpacity key={t.k} onPress={()=>u('coverType',t.k)} style={{flex:1,padding:10,borderRadius:12,backgroundColor:config.coverType===t.k?accent+'20':'#0E150E',borderWidth:1.5,borderColor:config.coverType===t.k?accent:'#1C2A1C',alignItems:'center'}}>
                <Text style={{fontSize:11,fontWeight:'700',color:config.coverType===t.k?accent:'#4A6A4A'}}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {config.coverType==='gradient'&&(
            <><Lbl>Gradient Presets</Lbl>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14}}>
              {GRADIENT_PRESETS.map(g=>(
                <TouchableOpacity key={g.name} onPress={()=>u('coverGradient',g.colors)} style={{width:(width-70)/2,height:46,borderRadius:12,backgroundColor:g.colors[0],borderWidth:JSON.stringify(config.coverGradient)===JSON.stringify(g.colors)?2:1,borderColor:JSON.stringify(config.coverGradient)===JSON.stringify(g.colors)?accent:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
                  <Text style={{fontSize:11,color:'#D4EDD4',fontWeight:'700'}}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </View></>
          )}
          {config.coverType==='solid'&&(
            <><Lbl>Color</Lbl>
            <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:14}}>
              {['#0A1A0A','#0A0A1A','#1A0A0A','#1A1A0A','#0A1A1A','#111','#000'].map(c=>(
                <TouchableOpacity key={c} onPress={()=>u('coverColor',c)} style={{width:44,height:44,borderRadius:11,backgroundColor:c,borderWidth:config.coverColor===c?3:1,borderColor:config.coverColor===c?accent:'#2A3A2A'}}/>
              ))}
            </View></>
          )}
          {config.coverType==='image'&&(
            <><Lbl>Upload Cover Photo</Lbl>
            <TouchableOpacity onPress={()=>pickImage(uri=>u('coverImage',uri))} style={{borderWidth:2,borderStyle:'dashed',borderColor:accent+'44',borderRadius:14,padding:20,alignItems:'center',marginBottom:12,backgroundColor:accent+'06'}}>
              <Text style={{fontSize:28,marginBottom:6}}>📁</Text>
              <Text style={{color:accent,fontSize:13,fontWeight:'700'}}>Upload from Gallery</Text>
            </TouchableOpacity>
            {config.coverImage&&<View style={{borderRadius:14,overflow:'hidden',marginBottom:12}}><Image source={{uri:config.coverImage}} style={{width:'100%',height:100}} resizeMode="cover"/><TouchableOpacity onPress={()=>u('coverImage',null)} style={{position:'absolute',top:8,right:8,backgroundColor:'#FF4F8B',borderRadius:20,width:26,height:26,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#fff',fontSize:12,fontWeight:'700'}}>✕</Text></TouchableOpacity></View>}
            </>
          )}
          <Lbl>Global Accent Color</Lbl>
          <AccentPicker value={config.accent} onChange={v=>u('accent',v)}/>
        </EditorSheet>
      )}

      {/* ── HERO STICKER EDITOR ── */}
      {editing==='hero'&&(
        <EditorSheet title="Banner Character / Sticker" onClose={()=>setEditing(null)} onSave={()=>setEditing(null)} accent={accent}>
          <Lbl>Pick Emoji / Character</Lbl>
          <EmojiPicker value={config.heroSticker} onChange={v=>{u('heroSticker',v);u('heroStickerIsImg',false);}} accent={accent}/>
          <Lbl>Upload Anime PNG / Custom Image</Lbl>
          <TouchableOpacity onPress={()=>pickImage(uri=>{u('heroSticker',uri);u('heroStickerIsImg',true);})} style={{borderWidth:2,borderStyle:'dashed',borderColor:accent+'44',borderRadius:14,padding:16,alignItems:'center',marginBottom:16,backgroundColor:accent+'06'}}>
            <Text style={{fontSize:26,marginBottom:6}}>📁</Text>
            <Text style={{color:accent,fontSize:13,fontWeight:'700'}}>Upload Anime PNG / GIF Sticker</Text>
            <Text style={{color:'#4A6A4A',fontSize:11,marginTop:3}}>Use transparent PNG for best pop-out effect!</Text>
          </TouchableOpacity>
          {config.heroSticker&&(
            <View style={{backgroundColor:'#0E150E',borderRadius:14,padding:20,alignItems:'center',marginBottom:16,borderWidth:1,borderColor:accent+'22'}}>
              <AnimSticker emoji={config.heroSticker} effect={config.heroStickerAnim} size={80} isImg={config.heroStickerIsImg}/>
              <Text style={{color:accent,fontSize:11,marginTop:8}}>Preview</Text>
            </View>
          )}
          <Lbl>Animation</Lbl>
          <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {[{k:'float',l:'🎈 Float'},{k:'bounce',l:'🏀 Bounce'},{k:'pulse',l:'💓 Pulse'},{k:'shake',l:'🔥 Shake'},{k:'breathe',l:'😮 Breathe'},{k:'none',l:'✕ None'}].map(a=>(
              <TouchableOpacity key={a.k} onPress={()=>u('heroStickerAnim',a.k)} style={{paddingHorizontal:12,paddingVertical:7,borderRadius:20,backgroundColor:config.heroStickerAnim===a.k?accent+'20':'#131C13',borderWidth:1.5,borderColor:config.heroStickerAnim===a.k?accent:'#1C2A1C'}}>
                <Text style={{fontSize:11,color:config.heroStickerAnim===a.k?accent:'#D4EDD4',fontWeight:'600'}}>{a.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Lbl>Size — {config.heroStickerSize}px</Lbl>
          <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {[60,90,120,160,200].map(s=>(
              <TouchableOpacity key={s} onPress={()=>u('heroStickerSize',s)} style={{flex:1,padding:10,borderRadius:10,backgroundColor:config.heroStickerSize===s?accent+'20':'#131C13',borderWidth:1.5,borderColor:config.heroStickerSize===s?accent:'#1C2A1C',alignItems:'center'}}>
                <Text style={{fontSize:11,color:config.heroStickerSize===s?accent:'#4A6A4A',fontWeight:'700'}}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Lbl>Position</Lbl>
          <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
            {[{k:'left',l:'⬅️ Left'},{k:'right',l:'➡️ Right'}].map(p=>(
              <TouchableOpacity key={p.k} onPress={()=>u('heroStickerSide',p.k)} style={{flex:1,padding:12,borderRadius:12,backgroundColor:(config.heroStickerSide||'right')===p.k?accent+'20':'#131C13',borderWidth:1.5,borderColor:(config.heroStickerSide||'right')===p.k?accent:'#1C2A1C',alignItems:'center'}}>
                <Text style={{fontSize:12,color:(config.heroStickerSide||'right')===p.k?accent:'#4A6A4A',fontWeight:'700'}}>{p.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {config.heroSticker&&<HBtn label="Remove Sticker" onPress={()=>{u('heroSticker',null);u('heroStickerIsImg',false);setEditing(null);}} variant="outline" color="#FF4F8B"/>}
        </EditorSheet>
      )}

      {/* ── WIDGET EDITOR ── */}
      {editing==='widget'&&widgetDraft&&(
        <EditorSheet title={`Edit: ${widgetDraft.name}`} onClose={()=>setEditing(null)} onSave={saveWidget} accent={accent}>
          <Lbl>Name</Lbl>
          <TextInput value={widgetDraft.name} onChangeText={v=>uwd('name',v)} style={[S.input,{marginBottom:14}]}/>
          <Lbl>Icon</Lbl><EmojiPicker value={widgetDraft.icon} onChange={v=>uwd('icon',v)} accent={accent}/>
          <Lbl>Accent Color</Lbl><AccentPicker value={widgetDraft.accent} onChange={v=>uwd('accent',v)}/>
          <Lbl>Widget Sticker</Lbl>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:8}}>
            {['none',...EMOJI_LIST.slice(0,20)].map(e=>(
              <TouchableOpacity key={e} onPress={()=>uwd('sticker',e==='none'?null:e)} style={{width:40,height:40,borderRadius:10,backgroundColor:(e==='none'?!widgetDraft.sticker:widgetDraft.sticker===e)?accent+'20':'#131C13',borderWidth:1.5,borderColor:(e==='none'?!widgetDraft.sticker:widgetDraft.sticker===e)?accent:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:e==='none'?14:18}}>{e==='none'?'✕':e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {widgetDraft.sticker&&(
            <><Lbl>Sticker Animation</Lbl>
            <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:14}}>
              {ANIMS.map(a=><TouchableOpacity key={a} onPress={()=>uwd('stickerAnim',a)} style={{paddingHorizontal:11,paddingVertical:7,borderRadius:20,backgroundColor:widgetDraft.stickerAnim===a?accent+'20':'#131C13',borderWidth:1.5,borderColor:widgetDraft.stickerAnim===a?accent:'#1C2A1C'}}><Text style={{fontSize:11,color:widgetDraft.stickerAnim===a?accent:'#D4EDD4',fontWeight:'600'}}>{a}</Text></TouchableOpacity>)}
            </View></>
          )}
          <Lbl>Widget Animation</Lbl>
          <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:14}}>
            {ANIMS.map(a=><TouchableOpacity key={a} onPress={()=>uwd('anim',a)} style={{paddingHorizontal:11,paddingVertical:7,borderRadius:20,backgroundColor:widgetDraft.anim===a?accent+'20':'#131C13',borderWidth:1.5,borderColor:widgetDraft.anim===a?accent:'#1C2A1C'}}><Text style={{fontSize:11,color:widgetDraft.anim===a?accent:'#D4EDD4',fontWeight:'600'}}>{a}</Text></TouchableOpacity>)}
          </View>
          <Lbl>Size</Lbl>
          <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
            {['small','medium','large','full'].map(s=><TouchableOpacity key={s} onPress={()=>uwd('size',s)} style={{flex:1,padding:10,borderRadius:10,backgroundColor:widgetDraft.size===s?accent+'20':'#131C13',borderWidth:1.5,borderColor:widgetDraft.size===s?accent:'#1C2A1C',alignItems:'center'}}><Text style={{fontSize:11,color:widgetDraft.size===s?accent:'#4A6A4A',fontWeight:'700'}}>{s}</Text></TouchableOpacity>)}
          </View>
          <Lbl>Visibility</Lbl>
          <View style={{flexDirection:'row',gap:8}}>
            {[{v:true,l:'👁️ Show'},{v:false,l:'🚫 Hide'}].map(item=><TouchableOpacity key={String(item.v)} onPress={()=>uwd('visible',item.v)} style={{flex:1,padding:11,borderRadius:11,backgroundColor:widgetDraft.visible===item.v?accent+'20':'#131C13',borderWidth:1.5,borderColor:widgetDraft.visible===item.v?accent:'#1C2A1C',alignItems:'center'}}><Text style={{fontSize:12,color:widgetDraft.visible===item.v?accent:'#4A6A4A',fontWeight:'700'}}>{item.l}</Text></TouchableOpacity>)}
          </View>
        </EditorSheet>
      )}

      {/* ── CALENDAR EDITOR ── */}
      {editing==='calendar'&&(
        <EditorSheet title="Edit Calendar" onClose={()=>setEditing(null)} onSave={()=>setEditing(null)} accent={accent}>
          <Lbl>Calendar Accent Color</Lbl>
          <AccentPicker value={config.calendarAccent||accent} onChange={v=>u('calendarAccent',v)}/>
          <Lbl>Visibility</Lbl>
          <View style={{flexDirection:'row',gap:8}}>
            {[{v:true,l:'👁️ Show'},{v:false,l:'🚫 Hide'}].map(item=><TouchableOpacity key={String(item.v)} onPress={()=>u('calendarVisible',item.v)} style={{flex:1,padding:11,borderRadius:11,backgroundColor:config.calendarVisible===item.v?accent+'20':'#131C13',borderWidth:1.5,borderColor:config.calendarVisible===item.v?accent:'#1C2A1C',alignItems:'center'}}><Text style={{fontSize:12,color:config.calendarVisible===item.v?accent:'#4A6A4A',fontWeight:'700'}}>{item.l}</Text></TouchableOpacity>)}
          </View>
        </EditorSheet>
      )}

      {/* ── TABS EDITOR ── */}
      {editing==='tabs'&&(
        <EditorSheet title="Edit Tabs" onClose={()=>setEditing(null)} onSave={()=>setEditing(null)} accent={accent}>
          {config.tabs.map(tab=>(
            <View key={tab.id} style={{backgroundColor:'#111811',borderWidth:1,borderColor:'#1C2A1C',borderRadius:16,padding:14,marginBottom:10}}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:10}}>
                <View style={{flexDirection:'row',gap:6}}>
                  {['⊞','₹','⬡','◈','◎','🏠','💰','📱','📊','🎯','🌟','⚡','🔥'].map(e=>(
                    <TouchableOpacity key={e} onPress={()=>setConfig(p=>({...p,tabs:p.tabs.map(t=>t.id===tab.id?{...t,icon:e}:t)}))} style={{width:34,height:34,borderRadius:8,backgroundColor:tab.icon===e?accent+'20':'#161E16',borderWidth:1.5,borderColor:tab.icon===e?accent:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
                      <Text style={{fontSize:16}}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={{flexDirection:'row',gap:8,alignItems:'center'}}>
                <TextInput value={tab.name} onChangeText={v=>setConfig(p=>({...p,tabs:p.tabs.map(t=>t.id===tab.id?{...t,name:v}:t)}))} style={[S.input,{flex:1,marginBottom:0}]}/>
                <TouchableOpacity onPress={()=>setConfig(p=>({...p,tabs:p.tabs.map(t=>t.id===tab.id?{...t,visible:!t.visible}:t)}))} style={{padding:'9px 14px',paddingHorizontal:14,paddingVertical:9,borderRadius:10,backgroundColor:tab.visible?accent+'15':'#1C2A1C',borderWidth:1.5,borderColor:tab.visible?accent:'#2A3A2A'}}>
                  <Text style={{fontSize:12,fontWeight:'700',color:tab.visible?accent:'#4A6A4A'}}>{tab.visible?'ON':'OFF'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </EditorSheet>
      )}

      {/* ── GLOBAL STYLE ── */}
      {editing==='global'&&(
        <EditorSheet title="Global Style" onClose={()=>setEditing(null)} onSave={()=>setEditing(null)} accent={accent}>
          <Lbl>Global Accent Color</Lbl><AccentPicker value={config.accent} onChange={v=>u('accent',v)}/>
          <Lbl>App Background</Lbl>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:16}}>
            {GRADIENT_PRESETS.map(g=>(
              <TouchableOpacity key={g.name} onPress={()=>u('bgGradient',g.colors)} style={{width:(width-68)/2,height:46,borderRadius:12,backgroundColor:g.colors[0],borderWidth:JSON.stringify(config.bgGradient)===JSON.stringify(g.colors)?2:1,borderColor:JSON.stringify(config.bgGradient)===JSON.stringify(g.colors)?accent:'#1C2A1C',alignItems:'center',justifyContent:'center'}}>
                <Text style={{fontSize:11,color:'#D4EDD4',fontWeight:'700'}}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </EditorSheet>
      )}
    </ScrollView>
  );
}

// ── MARKETS ────────────────────────────────────────────────────────────────────
function MarketsModule({accent,groqKey}) {
  const [prices,setPrices]=useState({});
  const [loading,setLoad]=useState(false);
  const [refreshing,setRefr]=useState(false);
  const [lastUp,setLastUp]=useState(null);
  const [analysis,setAnal]=useState('');
  const [analyzing,setAning]=useState(false);
  const fetchPrices=useCallback(async(isRefresh=false)=>{
    if(isRefresh)setRefr(true);else setLoad(true);
    try{
      const res=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COINS.join(',')}&vs_currencies=inr,usd&include_24hr_change=true`);
      setPrices(await res.json());setLastUp(new Date().toLocaleTimeString());
      if(isRefresh)haptic('success');
    }catch(e){}
    if(isRefresh)setRefr(false);else setLoad(false);
  },[]);
  useEffect(()=>{fetchPrices();},[fetchPrices]);
  const analyze=async()=>{
    if(!groqKey){Alert.alert('API Key Missing','Add your Groq API key in Settings.');return;}
    haptic('medium');setAning(true);setAnal('');
    const summary=Object.entries(prices).map(([c,d])=>`${CI[c]?.sym}: ₹${d.inr?.toLocaleString('en-IN')} (${d.inr_24h_change?.toFixed(2)}%)`).join(', ');
    try{
      const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+groqKey},body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:300,messages:[{role:'user',content:`Prices: ${summary}. Give 3-4 sentence market analysis for small Indian investor.`}]})});
      const data=await res.json();setAnal(data.choices?.[0]?.message?.content||'');haptic('success');
    }catch(e){setAnal('Could not fetch analysis.');}
    setAning(false);
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>fetchPrices(true)} tintColor={accent} colors={[accent]}/>}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18}}>
        <View><Text style={S.pageTitle}>Live Markets</Text><Text style={S.catSub}>{lastUp?`Updated ${lastUp}`:'Pull down to refresh'}</Text></View>
        <HBtn label="↺" onPress={()=>fetchPrices(false)} loading={loading} variant="outline" color={accent} style={{borderRadius:12,paddingHorizontal:14,paddingVertical:10,marginTop:4}}/>
      </View>
      {loading&&!Object.keys(prices).length?<View style={{alignItems:'center',padding:50}}><ActivityIndicator color={accent} size="large"/></View>:(
        <View style={S.grid2}>
          {COINS.map(coin=>{
            const info=CI[coin];const d=prices[coin]||{};const change=d.inr_24h_change||0;const isUp=change>=0;
            return (
              <View key={coin} style={[S.catCard,{borderColor:'#1C2A1C'}]}>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                  <Text style={{fontSize:20,color:info.color}}>{info.icon}</Text>
                  <View style={{backgroundColor:(isUp?'#00FF88':'#FF4F8B')+'20',borderRadius:7,paddingHorizontal:7,paddingVertical:2}}><Text style={{fontSize:11,fontWeight:'700',color:isUp?'#00FF88':'#FF4F8B'}}>{isUp?'+':''}{change.toFixed(2)}%</Text></View>
                </View>
                <Text style={S.catSub}>{info.sym}</Text>
                <Text style={S.catLabel}>₹{d.inr?Number(d.inr).toLocaleString('en-IN'):'—'}</Text>
                <Text style={S.catSub}>${d.usd?Number(d.usd).toLocaleString():'—'}</Text>
              </View>
            );
          })}
        </View>
      )}
      <HBtn label="🤖  AI Market Analysis" onPress={analyze} loading={analyzing} color={accent} style={{marginTop:6,marginBottom:14}} hap="medium"/>
      {analysis!==''&&<View style={[S.card,{backgroundColor:'#00FF8810',borderColor:'#00FF8833'}]}><Lbl>AI Analysis</Lbl><Text style={{color:'#D4EDD4',fontSize:13,lineHeight:20}}>{analysis}</Text></View>}
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── INCOME ─────────────────────────────────────────────────────────────────────
function IncomeModule({income,setIncome,accent}) {
  const [source,setSource]=useState('');const [amount,setAmount]=useState('');const [category,setCategory]=useState(ICATS[0]);const [note,setNote]=useState('');const [adding,setAdding]=useState(false);
  const total=income.reduce((s,i)=>s+i.amount,0);
  const add=()=>{if(!source||!amount){haptic('heavy');return;}haptic('success');setIncome(p=>[{source,amount:parseFloat(amount),category,note,date:new Date().toLocaleDateString('en-IN'),id:Date.now()},...p]);setSource('');setAmount('');setNote('');setAdding(false);};
  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{marginBottom:18}}><Text style={S.pageTitle}>Income Tracker</Text><Text style={S.catSub}>Track every rupee</Text></View>
        <View style={[S.heroCard,{borderColor:accent+'33',backgroundColor:'#0E1E0E'}]}>
          <View style={{position:'absolute',top:0,left:22,right:22,height:1,backgroundColor:accent+'55'}}/>
          <Text style={[S.heroLbl,{color:accent}]}>TOTAL EARNED</Text>
          <Text style={S.heroAmt}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <IncomeChart income={income} accent={accent}/>
        {adding?(
          <View style={[S.card,{borderColor:'#1C2A1C',marginBottom:14}]}>
            <Text style={[S.catLabel,{marginBottom:14}]}>Add Income Entry</Text>
            <Inp label="SOURCE" value={source} onChangeText={setSource} placeholder="e.g. Fiverr gig"/>
            <Inp label="AMOUNT (₹)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric"/>
            <PickerRow label="CATEGORY" options={ICATS} value={category} onChange={setCategory} accent={accent}/>
            <Inp label="NOTE (optional)" value={note} onChangeText={setNote} placeholder="Details..."/>
            <View style={{flexDirection:'row',gap:10}}><HBtn label="Save ✓" onPress={add} color={accent} style={{flex:1}} hap="success"/><HBtn label="Cancel" onPress={()=>setAdding(false)} variant="outline" color="#4A6A4A" style={{flex:1}}/></View>
          </View>
        ):<HBtn label="+ Add Income Entry" onPress={()=>setAdding(true)} color={accent} style={{marginBottom:16}}/>}
        {income.length===0?(
          <View style={[S.card,{borderColor:'#1C2A1C',alignItems:'center',paddingVertical:40}]}><Text style={{fontSize:36}}>💰</Text><Text style={[S.catSub,{marginTop:10,textAlign:'center'}]}>{'No income logged yet.\nAdd your first entry!'}</Text></View>
        ):income.map(item=>(
          <View key={item.id} style={[S.card,{borderColor:'#1C2A1C',marginBottom:9,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',borderLeftWidth:2,borderLeftColor:accent+'44'}]}>
            <View style={{flex:1}}><Text style={S.catLabel}>{item.source}</Text><View style={{flexDirection:'row',gap:6,marginTop:4,flexWrap:'wrap'}}><Tag label={item.category} color={accent}/><Text style={S.catSub}>{item.date}</Text></View>{item.note?<Text style={[S.catSub,{marginTop:3}]}>{item.note}</Text>:null}</View>
            <View style={{alignItems:'flex-end',gap:6}}><Text style={[S.catLabel,{color:accent}]}>+₹{item.amount.toLocaleString('en-IN')}</Text><TouchableOpacity onPress={()=>{haptic('light');setIncome(p=>p.filter(i=>i.id!==item.id));}}><Text style={{color:'#4A6A4A',fontSize:16}}>✕</Text></TouchableOpacity></View>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── TASKS ──────────────────────────────────────────────────────────────────────
function TasksModule({tasks,setTasks,accent}) {
  const [text,setText]=useState('');const [priority,setPriority]=useState('Medium');const [goal,setGoal]=useState('');const [filter,setFilter]=useState('All');
  const add=()=>{if(!text.trim()){haptic('heavy');return;}haptic('success');setTasks(p=>[{id:Date.now(),text,priority,goal,done:false,created:new Date().toLocaleDateString('en-IN')},...p]);setText('');setGoal('');};
  const toggle=id=>{haptic('light');setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));};
  const remove=id=>{haptic('light');setTasks(p=>p.filter(t=>t.id!==id));};
  const filtered=tasks.filter(t=>filter==='All'?true:filter==='Done'?t.done:!t.done);
  const done=tasks.filter(t=>t.done).length;
  const progress=tasks.length?done/tasks.length:0;
  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{marginBottom:18}}><Text style={S.pageTitle}>Tasks & Goals</Text><Text style={S.catSub}>Stay focused, earn more</Text></View>
        {tasks.length>0&&<View style={[S.card,{borderColor:'#1C2A1C',marginBottom:14}]}><View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}><Lbl>Progress</Lbl><Text style={{fontSize:12,color:'#D4EDD4',fontWeight:'700'}}>{done}/{tasks.length}</Text></View><View style={{backgroundColor:'#0A100A',borderRadius:99,height:6,overflow:'hidden'}}><View style={{width:`${progress*100}%`,height:'100%',backgroundColor:accent,borderRadius:99}}/></View><Text style={{fontSize:11,color:accent,marginTop:5,fontWeight:'600'}}>{Math.round(progress*100)}% complete</Text></View>}
        <View style={[S.card,{borderColor:'#1C2A1C',marginBottom:14}]}>
          <Inp label="TASK" value={text} onChangeText={setText} placeholder="What needs to be done?"/>
          <Inp label="PROJECT (optional)" value={goal} onChangeText={setGoal} placeholder="e.g. Telegram Channel"/>
          <Lbl>Priority</Lbl>
          <View style={{flexDirection:'row',gap:8,marginBottom:13}}>
            {PRIOS.map(p=><TouchableOpacity key={p} onPress={()=>{haptic('light');setPriority(p);}} style={[S.pill,{flex:1,justifyContent:'center'},priority===p&&{backgroundColor:PC[p]+'22',borderColor:PC[p]}]}><Text style={[S.pillTxt,priority===p&&{color:PC[p]}]}>{p}</Text></TouchableOpacity>)}
          </View>
          <HBtn label="+ Add Task" onPress={add} color={accent} hap="medium"/>
        </View>
        <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
          {['All','Pending','Done'].map(f=><TouchableOpacity key={f} onPress={()=>{haptic('light');setFilter(f);}} style={[S.pill,{flex:1,justifyContent:'center'},filter===f&&{backgroundColor:accent+'22',borderColor:accent}]}><Text style={[S.pillTxt,filter===f&&{color:accent}]}>{f}</Text></TouchableOpacity>)}
        </View>
        {filtered.map(task=>(
          <View key={task.id} style={[S.card,{borderColor:'#1C2A1C',borderLeftWidth:2,borderLeftColor:PC[task.priority]+'55',marginBottom:9,flexDirection:'row',alignItems:'flex-start',gap:12,opacity:task.done?0.55:1}]}>
            <TouchableOpacity onPress={()=>toggle(task.id)} style={[S.checkbox,task.done&&{backgroundColor:accent,borderColor:accent}]}>{task.done&&<Text style={{color:'#000',fontSize:11,fontWeight:'700'}}>✓</Text>}</TouchableOpacity>
            <View style={{flex:1}}><Text style={[S.catLabel,task.done&&{textDecorationLine:'line-through',color:'#4A6A4A'}]}>{task.text}</Text><View style={{flexDirection:'row',gap:6,marginTop:4,flexWrap:'wrap'}}><Tag label={task.priority} color={PC[task.priority]}/>{task.goal?<Tag label={task.goal} color={accent}/>:null}</View></View>
            <TouchableOpacity onPress={()=>remove(task.id)}><Text style={{color:'#4A6A4A',fontSize:16}}>✕</Text></TouchableOpacity>
          </View>
        ))}
        <View style={{height:20}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── NEWS ───────────────────────────────────────────────────────────────────────
function NewsModule({accent,groqKey}) {
  const [topic,setTopic]=useState(NTOPICS[0]);const [news,setNews]=useState([]);const [loading,setLoad]=useState(false);const [refreshing,setRefr]=useState(false);
  const fetchNews=async(isRefresh=false)=>{
    if(!groqKey){Alert.alert('API Key Missing','Add your Groq API key in Settings.');return;}
    if(isRefresh)setRefr(true);else setLoad(true);haptic('light');setNews([]);
    try{
      const res=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+groqKey},body:JSON.stringify({model:'llama-3.3-70b-versatile',max_tokens:1500,messages:[{role:'system',content:'Respond ONLY with valid JSON array.'},{role:'user',content:`Top 5 news about: "${topic}" for Indians earning online. JSON: [{"title":"...","summary":"2-3 sentences","source":"...","relevance":"why matters for earning","tag":"category"}]`}]})});
      const data=await res.json();const txt=data.choices?.[0]?.message?.content||'[]';const parsed=JSON.parse(txt.replace(/```json|```/g,'').trim());setNews(Array.isArray(parsed)?parsed:[]);if(isRefresh)haptic('success');
    }catch(e){setNews([]);}
    if(isRefresh)setRefr(false);else setLoad(false);
  };
  return (
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>fetchNews(true)} tintColor={accent} colors={[accent]}/>}>
      <View style={{marginBottom:18}}><Text style={S.pageTitle}>News & Trends</Text><Text style={S.catSub}>Stay ahead of the curve</Text></View>
      <View style={[S.card,{borderColor:'#1C2A1C',marginBottom:14}]}><PickerRow label="TOPIC" options={NTOPICS} value={topic} onChange={setTopic} accent={accent}/><HBtn label="🔍  Fetch Latest News" onPress={()=>fetchNews(false)} color={accent} loading={loading} hap="medium"/></View>
      {news.length===0&&!loading&&<View style={[S.card,{borderColor:'#1C2A1C',alignItems:'center',paddingVertical:40}]}><Text style={{fontSize:36}}>📰</Text><Text style={[S.catSub,{marginTop:10}]}>Pull down or tap above to fetch news</Text></View>}
      {news.map((item,i)=>(
        <View key={i} style={[S.card,{borderColor:'#1C2A1C',borderLeftWidth:2,borderLeftColor:'#00CFFF55',marginBottom:12}]}>
          <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}><Tag label={item.tag||'News'} color={accent}/><Text style={S.catSub}>{item.source}</Text></View>
          <Text style={[S.catLabel,{lineHeight:20,marginBottom:6}]}>{item.title}</Text>
          <Text style={{color:'#D4EDD4',fontSize:13,lineHeight:19,marginBottom:10}}>{item.summary}</Text>
          <View style={{backgroundColor:'#00FF8812',borderWidth:1,borderColor:'#00FF8825',borderRadius:10,padding:10}}><Text style={{fontSize:10,color:'#00FF88',fontWeight:'600',marginBottom:2}}>💡 WHY IT MATTERS</Text><Text style={{color:'#D4EDD4',fontSize:12}}>{item.relevance}</Text></View>
        </View>
      ))}
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── APPS MODULE ────────────────────────────────────────────────────────────────
function AppsModule({accent}) {
  const CHILD_APPS=[
    {id:'content_studio',icon:'✍️',name:'Content Studio',sub:'Scripts · Blogs · Threads',color:'#00CFFF'},
    {id:'crypto_tracker',icon:'📈',name:'Crypto Tracker',sub:'Portfolio · Alerts · P&L',color:'#F7931A'},
    {id:'telegram_mgr',  icon:'📢',name:'Telegram Manager',sub:'Post · Schedule · Grow',color:'#229ED9'},
    {id:'finance_vault', icon:'🏦',name:'Finance Vault',sub:'Budget · Expenses · Goals',color:'#00FF88'},
  ];
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={{marginBottom:20}}><Text style={S.pageTitle}>Ecosystem</Text><Text style={S.catSub}>Your connected child apps</Text></View>
      <View style={{backgroundColor:accent+'10',borderWidth:1,borderColor:accent+'28',borderRadius:16,padding:14,marginBottom:22}}><Text style={{fontSize:13,color:accent,fontWeight:'700',marginBottom:4}}>⚡ How it works</Text><Text style={{fontSize:12,color:'#4A6A4A',lineHeight:18}}>Each child app syncs data back to NEXUS. Your dashboard shows live stats from all apps in one place.</Text></View>
      <Text style={S.sectionLbl}>CHILD APPS</Text>
      {CHILD_APPS.map(app=>(
        <TouchableOpacity key={app.id} onPress={()=>{haptic('light');Alert.alert(app.name,'Being built as standalone APK. Coming soon! 🚀');}} activeOpacity={0.8} style={[S.card,{borderColor:'#1C2A1C',marginBottom:12,borderLeftWidth:3,borderLeftColor:app.color+'66'}]}>
          <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
            <View style={{width:52,height:52,borderRadius:16,backgroundColor:app.color+'18',borderWidth:1.5,borderColor:app.color+'33',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:26}}>{app.icon}</Text></View>
            <View style={{flex:1}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={S.catLabel}>{app.name}</Text><View style={{backgroundColor:'#FF8C4220',borderRadius:6,paddingHorizontal:7,paddingVertical:2}}><Text style={{fontSize:9,color:'#FF8C42',fontWeight:'700'}}>SOON</Text></View></View><Text style={S.catSub}>{app.sub}</Text></View>
            <Text style={{fontSize:20,color:'#2A3D2A'}}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{height:20}}/>
    </ScrollView>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────────
function SettingsPage({config,setConfig,account,setAccount,onClose}) {
  const [section,setSection]=useState('main');
  const [editName,setEditName]=useState(account.name);
  const [editGoal,setEditGoal]=useState(account.goal);
  const [editNiche,setEditNiche]=useState(account.niche);
  const [editKey,setEditKey]=useState(config.groqKey||'');
  const accent=config.accent;
  const update=(k,v)=>setConfig(p=>({...p,[k]:v}));
  const updateAcc=(k,v)=>setAccount(p=>({...p,[k]:v}));
  const MENU=[
    {key:'apikey',    icon:'🔑',title:'API Key',         sub:'Groq key for AI features',         group:'style',highlight:true},
    {key:'customize', icon:'🎨',title:'Theme & Colors',  sub:'Accent color, glow effects',        group:'style',highlight:false},
    {key:'account',   icon:'👤',title:'Account',         sub:'Profile, goals, niche',             group:'app',  highlight:false},
    {key:'about',     icon:'ℹ️', title:'About NEXUS',     sub:'Version 1.0 · Privacy',            group:'app',  highlight:false},
  ];
  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={{flex:1,backgroundColor:'#060A06'}}>
        <StatusBar barStyle="light-content" backgroundColor="#060A06"/>
        <View style={S.settingsHeader}>
          <TouchableOpacity onPress={section==='main'?onClose:()=>setSection('main')} activeOpacity={0.7} style={S.backBtn}><Text style={{color:'#4A6A4A',fontSize:18}}>←</Text></TouchableOpacity>
          <View><Text style={{fontSize:17,fontWeight:'800',color:'#D4EDD4'}}>{section==='main'?'Settings':MENU.find(m=>m.key===section)?.title||'Settings'}</Text><Text style={{fontSize:10,color:'#4A6A4A'}}>{section==='main'?'Manage your NEXUS':'← Back'}</Text></View>
        </View>
        <ScrollView style={{flex:1,padding:16}} showsVerticalScrollIndicator={false}>
          {section==='main'&&(
            <View>
              <View style={[S.heroCard,{borderColor:accent+'28',backgroundColor:accent+'10',marginBottom:22}]}>
                <View style={{flexDirection:'row',alignItems:'center',gap:14}}>
                  <View style={{width:56,height:56,borderRadius:18,backgroundColor:accent+'22',borderWidth:2,borderColor:accent+'44',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:28}}>👤</Text></View>
                  <View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'800',color:'#D4EDD4'}}>{account.name}</Text><Text style={{fontSize:12,color:accent,fontWeight:'600'}}>{account.username}</Text><Text style={{fontSize:11,color:'#4A6A4A',marginTop:2}}>Goal: {account.goal}</Text></View>
                  <TouchableOpacity onPress={()=>setSection('account')} style={{backgroundColor:accent+'18',borderWidth:1,borderColor:accent+'33',borderRadius:10,paddingHorizontal:13,paddingVertical:7}}><Text style={{color:accent,fontSize:12,fontWeight:'700'}}>Edit</Text></TouchableOpacity>
                </View>
              </View>
              <Lbl>App Settings</Lbl>
              {MENU.map(m=>(
                <TouchableOpacity key={m.key} onPress={()=>{haptic('light');setSection(m.key);}} activeOpacity={0.8} style={[S.settingsRow,{backgroundColor:m.highlight?accent+'08':'#0E150E',borderColor:m.highlight?accent+'28':'#1C2A1C'}]}>
                  <View style={[S.settingsIcon,{backgroundColor:m.highlight?accent+'20':accent+'12'}]}><Text style={{fontSize:19}}>{m.icon}</Text></View>
                  <View style={{flex:1}}><Text style={[S.catLabel,m.highlight&&{color:accent}]}>{m.title}</Text><Text style={S.catSub}>{m.sub}</Text></View>
                  <Text style={{fontSize:17,color:'#2A3D2A'}}>›</Text>
                </TouchableOpacity>
              ))}
              <Lbl>Quick Settings</Lbl>
              <View style={[S.settingsRow,{backgroundColor:'#0E150E',borderColor:'#1C2A1C'}]}>
                <View style={[S.settingsIcon,{backgroundColor:accent+'12'}]}><Text style={{fontSize:19}}>💡</Text></View>
                <Text style={[S.catLabel,{flex:1}]}>Glow Effects</Text>
                <Toggle value={config.glowEnabled} onChange={v=>update('glowEnabled',v)} accent={accent}/>
              </View>
            </View>
          )}
          {section==='apikey'&&(
            <View>
              <View style={{backgroundColor:accent+'10',borderWidth:1,borderColor:accent+'28',borderRadius:14,padding:14,marginBottom:18}}>
                <Text style={{fontSize:12,color:accent,lineHeight:18}}>{'🔑 Get free key at console.groq.com\n1. Sign up\n2. Create API key\n3. Paste below'}</Text>
              </View>
              <Inp label="GROQ API KEY" value={editKey} onChangeText={setEditKey} placeholder="gsk_..." secureTextEntry/>
              <HBtn label="Save API Key" onPress={()=>{update('groqKey',editKey);haptic('success');Alert.alert('✓ Saved','API key saved! All AI features active.');setSection('main');}} color={accent} hap="success" style={{marginTop:8}}/>
            </View>
          )}
          {section==='customize'&&(
            <View>
              <Lbl>Accent Color</Lbl>
              <View style={{flexDirection:'row',gap:10,flexWrap:'wrap',marginBottom:20}}>
                {ACCENT_PRESETS.map(c=><TouchableOpacity key={c} onPress={()=>{haptic('light');update('accent',c);}} style={{width:44,height:44,borderRadius:12,backgroundColor:c,borderWidth:config.accent===c?3:0,borderColor:'#D4EDD4'}}/>)}
              </View>
              <View style={{height:4,borderRadius:2,backgroundColor:accent,marginBottom:24,opacity:0.7}}/>
              <Lbl>Effects</Lbl>
              <View style={[S.settingsRow,{backgroundColor:'#0E150E',borderColor:'#1C2A1C'}]}>
                <View style={[S.settingsIcon,{backgroundColor:accent+'12'}]}><Text style={{fontSize:19}}>💡</Text></View>
                <View style={{flex:1}}><Text style={S.catLabel}>Glow Effects</Text><Text style={S.catSub}>Ambient glow</Text></View>
                <Toggle value={config.glowEnabled} onChange={v=>update('glowEnabled',v)} accent={accent}/>
              </View>
            </View>
          )}
          {section==='account'&&(
            <View>
              <Lbl>Display Name</Lbl>
              <TextInput value={editName} onChangeText={setEditName} style={[S.input,{marginBottom:16}]} placeholderTextColor="#3A5A3A"/>
              <Lbl>Username</Lbl>
              <TextInput value={account.username} onChangeText={v=>updateAcc('username',v)} style={[S.input,{marginBottom:16}]} placeholderTextColor="#3A5A3A"/>
              <Lbl>Income Goal</Lbl>
              <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:16}}>
                {GOALS.map(g=><TouchableOpacity key={g} onPress={()=>{haptic('light');setEditGoal(g);}} style={[S.pill,editGoal===g&&{backgroundColor:accent+'22',borderColor:accent}]}><Text style={[S.pillTxt,editGoal===g&&{color:accent}]}>{g}</Text></TouchableOpacity>)}
              </View>
              <Lbl>Niche</Lbl>
              {NICHES.map(n=><TouchableOpacity key={n} onPress={()=>{haptic('light');setEditNiche(n);}} style={{paddingHorizontal:15,paddingVertical:12,borderRadius:12,marginBottom:8,backgroundColor:editNiche===n?accent+'12':'#0E150E',borderWidth:1.5,borderColor:editNiche===n?accent:'#1C2A1C'}}><Text style={{fontSize:13,fontWeight:'600',color:editNiche===n?accent:'#D4EDD4'}}>{n}</Text></TouchableOpacity>)}
              <HBtn label="Save Changes ✓" onPress={()=>{updateAcc('name',editName);updateAcc('goal',editGoal);updateAcc('niche',editNiche);haptic('success');setSection('main');}} color={accent} hap="success" style={{marginTop:16}}/>
            </View>
          )}
          {section==='about'&&(
            <View>
              <View style={{alignItems:'center',paddingVertical:32}}>
                <View style={{width:80,height:80,borderRadius:24,backgroundColor:accent+'22',borderWidth:1.5,borderColor:accent+'44',alignItems:'center',justifyContent:'center',marginBottom:16}}><Text style={{fontSize:42}}>⚡</Text></View>
                <Text style={{fontSize:28,fontWeight:'900',color:'#D4EDD4',letterSpacing:4}}>NEXUS</Text>
                <Text style={{fontSize:10,color:'#4A6A4A',marginTop:4,letterSpacing:3}}>PERSONAL AI HUB</Text>
                <Text style={{fontSize:12,color:accent,marginTop:10,fontWeight:'700'}}>VERSION 2.0.0</Text>
              </View>
              {[{i:'👤',t:'Built by',s:account.name},{i:'🎯',t:'Niche',s:account.niche},{i:'🏆',t:'Goal',s:account.goal},{i:'⚡',t:'AI',s:'Groq — llama-3.3-70b'},{i:'📈',t:'Markets',s:'CoinGecko API'},{i:'🔒',t:'Privacy',s:'All data local on device'},{i:'🌱',t:'Ecosystem',s:'4 child apps coming soon'}].map(item=>(
                <View key={item.t} style={[S.settingsRow,{backgroundColor:'#0E150E',borderColor:'#1C2A1C'}]}><Text style={{fontSize:20}}>{item.i}</Text><View><Text style={{fontSize:10,color:'#4A6A4A'}}>{item.t}</Text><Text style={[S.catLabel,{marginTop:1}]}>{item.s}</Text></View></View>
              ))}
            </View>
          )}
          <View style={{height:40}}/>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState('home');
  const [moneyTab,setMoneyTab]=useState('markets');
  const [showSettings,setShowSettings]=useState(false);
  const [onboarded,setOnboarded,obLoaded]=usePersist('nexus:onboarded_v5',false);
  const [config,setConfig,cfgLoaded]=usePersist('nexus:config_v5',DEFAULT_CONFIG);
  const [account,setAccount,accLoaded]=usePersist('nexus:account_v5',DEFAULT_ACCOUNT);
  const [income,setIncome,incLoaded]=usePersist('nexus:income_v5',[]);
  const [tasks,setTasks,tskLoaded]=usePersist('nexus:tasks_v5',DEFAULT_TASKS);
  const loaded=obLoaded&&cfgLoaded&&accLoaded&&incLoaded&&tskLoaded;
  const accent=config.accent||'#00FF88';
  const groqKey=config.groqKey||'';
  const visibleTabs=config.tabs.filter(t=>t.visible);

  const completeOnboarding=({name,goal,niche,apiKey})=>{
    haptic('success');
    setAccount(p=>({...p,name,goal,niche,username:'@'+name.toLowerCase().replace(/\s+/g,'')}));
    setConfig(p=>({...p,groqKey:apiKey}));
    setOnboarded(true);
  };

  if(!loaded) return (
    <View style={{flex:1,backgroundColor:'#060A06',alignItems:'center',justifyContent:'center',gap:18}}>
      <StatusBar barStyle="light-content" backgroundColor="#060A06"/>
      <View style={{width:72,height:72,borderRadius:22,backgroundColor:accent+'22',borderWidth:1.5,borderColor:accent+'44',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:38}}>⚡</Text></View>
      <ActivityIndicator color={accent} size="large"/>
      <Text style={{color:'#4A6A4A',fontSize:12,letterSpacing:2}}>LOADING NEXUS...</Text>
    </View>
  );

  if(!onboarded) return <OnboardingScreen onComplete={completeOnboarding}/>;

  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#060A06'}}>
      <StatusBar barStyle="light-content" backgroundColor="#060A06"/>
      <View style={{flex:1,paddingHorizontal:tab==='home'?0:16,paddingTop:tab==='home'?0:18}}>
        {tab==='home'&&(
          <ScrollView showsVerticalScrollIndicator={false} style={{flex:1}}>
            <Dashboard config={config} setConfig={setConfig} income={income} tasks={tasks} setActive={setTab} account={account}/>
          </ScrollView>
        )}
        {tab==='money'&&(
          <>
            <View style={{flexDirection:'row',gap:10,marginBottom:16,paddingTop:18}}>
              {[{k:'markets',l:'📈 Markets'},{k:'income',l:'₹ Income'}].map(t=>(
                <TouchableOpacity key={t.k} onPress={()=>{haptic('light');setMoneyTab(t.k);}} activeOpacity={0.8} style={{flex:1,padding:10,borderRadius:12,backgroundColor:moneyTab===t.k?accent+'20':'#0E150E',borderWidth:1.5,borderColor:moneyTab===t.k?accent:'#1C2A1C',alignItems:'center'}}>
                  <Text style={{fontSize:13,fontWeight:'700',color:moneyTab===t.k?accent:'#4A6A4A'}}>{t.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {moneyTab==='markets'?<MarketsModule accent={accent} groqKey={groqKey}/>:<IncomeModule income={income} setIncome={setIncome} accent={accent}/>}
          </>
        )}
        {tab==='apps'&&<AppsModule accent={accent}/>}
        {tab==='intel'&&<NewsModule accent={accent} groqKey={groqKey}/>}
        {tab==='life'&&<TasksModule tasks={tasks} setTasks={setTasks} accent={accent}/>}
      </View>

      {/* Top right settings button - only on non-home tabs */}
      {tab!=='home'&&(
        <TouchableOpacity onPress={()=>{haptic('light');setShowSettings(true);}} activeOpacity={0.8}
          style={{position:'absolute',top:Platform.OS==='android'?14:14,right:16,width:36,height:36,borderRadius:11,backgroundColor:accent+'18',borderWidth:1.5,borderColor:accent+'40',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <Text style={{fontSize:18}}>👤</Text>
        </TouchableOpacity>
      )}

      <BottomNav active={tab} setActive={setTab} accent={accent} tabs={visibleTabs.length>0?visibleTabs:DEFAULT_CONFIG.tabs}/>
      {showSettings&&<SettingsPage config={config} setConfig={setConfig} account={account} setAccount={setAccount} onClose={()=>setShowSettings(false)}/>}
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  topBar:        {flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:18,paddingVertical:12,borderBottomWidth:1},
  bottomNav:     {flexDirection:'row',justifyContent:'space-around',borderTopWidth:1,borderTopColor:'#1C2A1C',paddingTop:10,paddingBottom:Platform.OS==='ios'?0:12,backgroundColor:'#060A06'},
  navItem:       {alignItems:'center',gap:2,paddingHorizontal:8,paddingVertical:4},
  navIconWrap:   {width:36,height:26,borderRadius:9,alignItems:'center',justifyContent:'center'},
  navLbl:        {fontSize:9,fontWeight:'700',letterSpacing:0.5},
  navLine:       {width:16,height:2,borderRadius:1,marginTop:1},
  btn:           {borderRadius:14,padding:14,alignItems:'center',justifyContent:'center'},
  btnTxt:        {fontSize:14,fontWeight:'800',letterSpacing:0.3},
  input:         {backgroundColor:'#0E150E',borderWidth:1.5,borderColor:'#1C2A1C',borderRadius:12,color:'#D4EDD4',fontSize:14,padding:12},
  lbl:           {fontSize:10,color:'#4A6A4A',fontWeight:'700',letterSpacing:2,marginBottom:10,marginTop:2,textTransform:'uppercase'},
  pill:          {paddingHorizontal:13,paddingVertical:8,borderRadius:10,borderWidth:1.5,borderColor:'#1C2A1C',alignItems:'center'},
  pillTxt:       {fontSize:12,fontWeight:'600',color:'#4A6A4A'},
  card:          {borderRadius:18,borderWidth:1,padding:16,marginBottom:0,backgroundColor:'#0E150E'},
  catCard:       {flex:1,minWidth:(width-52)/2,borderRadius:18,borderWidth:1,padding:15,marginBottom:0,backgroundColor:'#0E150E'},
  catLabel:      {fontSize:14,fontWeight:'800',color:'#D4EDD4',letterSpacing:0.3},
  catSub:        {fontSize:11,color:'#3A5A3A',marginTop:2},
  grid2:         {flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:10},
  sectionLbl:    {fontSize:10,color:'#3A5A3A',fontWeight:'700',marginBottom:11,letterSpacing:2},
  pageTitle:     {fontSize:24,fontWeight:'900',color:'#D4EDD4',letterSpacing:-0.5,lineHeight:28},
  greet:         {fontSize:11,color:'#3A5A3A',fontWeight:'600',letterSpacing:0.5},
  heroCard:      {borderRadius:22,borderWidth:1,padding:20,marginBottom:20,position:'relative',overflow:'visible'},
  heroLbl:       {fontSize:10,fontWeight:'700',letterSpacing:2,marginBottom:8,textTransform:'uppercase'},
  heroAmt:       {fontSize:40,fontWeight:'900',color:'#D4EDD4',lineHeight:44,letterSpacing:-1},
  heroSub:       {fontSize:11,color:'#3A5A3A',marginTop:5,marginBottom:16},
  heroRow:       {flexDirection:'row',borderTopWidth:1,paddingTop:13},
  heroStat:      {flex:1},
  heroStatL:     {fontSize:9,color:'#3A5A3A',letterSpacing:1.5,fontWeight:'700',textTransform:'uppercase'},
  heroStatV:     {fontSize:19,fontWeight:'800',color:'#D4EDD4',marginTop:2},
  briefCard:     {borderRadius:14,borderWidth:1,borderLeftWidth:2,padding:13,marginBottom:9,flexDirection:'row',alignItems:'center',gap:13,backgroundColor:'#0E150E'},
  briefIcon:     {width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center',flexShrink:0},
  briefTitle:    {fontSize:13,fontWeight:'700',color:'#D4EDD4'},
  checkbox:      {width:22,height:22,borderRadius:6,borderWidth:2,borderColor:'#1C2A1C',alignItems:'center',justifyContent:'center',flexShrink:0},
  settingsHeader:{backgroundColor:'#0A100A',borderBottomWidth:1,borderBottomColor:'#1C2A1C',padding:15,paddingTop:Platform.OS==='android'?(StatusBar.currentHeight||0)+8:15,flexDirection:'row',alignItems:'center',gap:12},
  backBtn:       {width:36,height:36,borderRadius:10,backgroundColor:'#131C13',borderWidth:1,borderColor:'#1C2A1C',alignItems:'center',justifyContent:'center'},
  settingsRow:   {flexDirection:'row',alignItems:'center',gap:13,borderRadius:14,borderWidth:1,padding:13,marginBottom:9},
  settingsIcon:  {width:39,height:39,borderRadius:11,alignItems:'center',justifyContent:'center',flexShrink:0},
});
