import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    onSnapshot, 
    query
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, Dumbbell, Zap, Target, CheckCircle, Repeat, Flame, Plus, Minus, Info, ArrowLeft,
    Home, User, BarChart2, ChevronLeft, ChevronRight
} from 'lucide-react';
import jalali_moment from 'jalali-moment';
import './App.css';

// --- Farsi (Persian) Translations ---
const translations = {
  appName: "کلستنیکس پرو",
  welcome: "خوش آمدی، قهرمان!",
  yourWeeklyPlan: "برنامه هفتگی شما",
  pushA: "پوش A (پایه‌ای)",
  pushB: "پوش B (شدتی)",
  pullA: "پول A (پایه‌ای)",
  pullB: "پول B (کششی)",
  legs: "پا (قدرتی)",
  rest: "استراحت",
  startWorkout: "شروع تمرین",
  sets: "ست",
  reps: "تکرار",
  seconds: "ثانیه",
  importantNotes: "جزئیات حرکت",
  completed: "تکمیل شد!",
  markAsDone: "تکمیل و ثبت تمرین",
  backToHome: "بازگشت به خانه",
  timer: "تایمر استراحت",
  start: "شروع",
  pause: "توقف",
  reset: "ریست",
  greatJob: "کارت عالی بود!",
  sessionCompleted: "این جلسه تمرینی با موفقیت ثبت شد.",
  loading: "در حال آماده‌سازی برای قهرمان...",
  login: "ورود",
  signup: "ثبت نام",
  logout: "خروج",
  email: "ایمیل",
  password: "رمز عبور",
  firstName: "نام",
  lastName: "نام خانوادگی",
  gender: "جنسیت",
  male: "مرد",
  female: "زن",
  other: "سایر",
  dateOfBirth: "تاریخ تولد",
  day: "روز",
  month: "ماه",
  year: "سال",
  loginToYourAccount: "ورود به حساب کاربری",
  dontHaveAccount: "حساب کاربری ندارید؟",
  createAccount: "ساخت حساب",
  alreadyHaveAccount: "قبلاً ثبت‌نام کرده‌اید؟",
  forgotPassword: "رمز عبور را فراموش کرده‌اید؟",
  resetPassword: "بازیابی رمز عبور",
  sendResetLink: "ارسال لینک بازیابی",
  resetLinkSent: "لینک بازیابی به ایمیل شما ارسال شد.",
  profile: "پروفایل",
  statistics: "آمار و ارقام",
  workoutStreak: "روزهای متوالی تمرین",
  totalWorkoutDays: "مجموع روزهای تمرین",
  monthlyCalendar: "تقویم ماهانه",
  days: "روز",
  home: "خانه"
};

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", 
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAD10xYyEVKTOom871IOpOxBXOkgmBO4l0",
  authDomain: "calisthenics-8968f.firebaseapp.com",
  projectId: "calisthenics-8968f",
  storageBucket: "calisthenics-8968f.appspot.com",
  messagingSenderId: "408915705905",
  appId: "1:408915705905:web:3b9e31a841ce268d4ed510",
  measurementId: "G-2JFD403NN7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Workout Data ---
const workoutData = {
  push_A: { name: translations.pushA, icon: Flame, target: "سینه، سرشانه، پشت بازو (پایه‌ای)", exercises: [
    { name: "شنا روی سطح شیبدار", englishName: "Incline Push-up", howTo: "دست‌ها را روی یک سطح بلندتر از پاها (مانند میز) قرار دهید و شنا بروید. این کار فشار را از روی سرشانه برداشته و به بخش پایینی سینه منتقل می‌کند.", sets: 3, reps: "12-15", notes: "برای گرم کردن عالی است." },
    { name: "شنا سوئدی استاندارد", englishName: "Standard Push-up", howTo: "در حالت پلانک قرار بگیرید و با خم کردن آرنج‌ها، سینه را به زمین نزدیک کنید. بدن باید کاملاً صاف باشد.", sets: 3, reps: "تا ناتوانی", notes: "فرم صحیح را فدای تعداد نکنید." },
    { name: "شنا روی زانو", englishName: "Knee Push-up", howTo: "مانند شنای استاندارد است، با این تفاوت که روی زانوها تکیه می‌کنید تا حرکت ساده‌تر شود.", sets: 2, reps: "15", notes: "برای افزایش حجم تمرین و خسته کردن کامل عضلات." },
    { name: "دیپ با نیمکت", englishName: "Bench Dips", howTo: "پشت به یک نیمکت یا صندلی، دست‌ها را روی لبه آن قرار دهید و با خم کردن آرنج، بدن را پایین ببرید.", sets: 3, reps: "10-12", notes: "تمرکز اصلی روی عضلات پشت بازو است." },
    { name: "شنا پایک", englishName: "Pike Push-up", howTo: "بدن را به شکل عدد هشت فارسی (^) درآورید و با خم کردن آرنج، سر را به زمین نزدیک کنید.", sets: 3, reps: "8-10", notes: "این حرکت سرشانه را به خوبی هدف قرار می‌دهد." },
    { name: "پلانک به شنا", englishName: "Plank to Push-up", howTo: "از حالت پلانک روی ساعد، یک به یک دست‌ها را صاف کرده و به حالت شنا بروید و سپس برگردید.", sets: 3, reps: "8 هر طرف", notes: "حرکتی عالی برای تقویت میان‌تنه و پایداری شانه." },
    { name: "لمس شانه در حالت پلانک", englishName: "Shoulder Taps", howTo: "در حالت شنا، به آرامی با یک دست شانه مخالف را لمس کنید. سعی کنید لگن ثابت بماند.", sets: 3, time: 40, notes: "بدن را ثابت نگه دارید و از چرخش لگن جلوگیری کنید." },
    { name: "کشش سینه", englishName: "Chest Stretch", howTo: "در چارچوب در بایستید، دست‌ها را به طرفین باز کرده و به آرامی بدن را به جلو متمایل کنید.", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر عضلات سینه." },
  ]},
  push_B: { name: translations.pushB, icon: Flame, target: "سینه، سرشانه، پشت بازو (شدتی)", exercises: [
    { name: "شنا دست باز", englishName: "Wide Push-up", howTo: "دست‌ها را بیشتر از عرض شانه باز کنید. این کار فشار بیشتری به بخش خارجی عضلات سینه وارد می‌کند.", sets: 3, reps: "10-12", notes: "برای پهن‌تر کردن عضلات سینه." },
    { name: "شنا الماسی", englishName: "Diamond Push-up", howTo: "انگشتان شست و اشاره را به هم بچسبانید تا شکل لوزی بسازند و شنا بروید. تمرکز حداکثری بر روی پشت بازو است.", sets: 3, reps: "تا ناتوانی", notes: "این حرکت برای پشت بازو بسیار چالش‌برانگیز است." },
    { name: "شنا با شیب منفی", englishName: "Decline Push-up", howTo: "پاهایتان را روی یک سطح بلندتر قرار دهید. این کار بخش بالایی سینه و سرشانه را هدف قرار می‌دهد.", sets: 3, reps: "8-10", notes: "هرچه پاها بالاتر باشد، حرکت سخت‌تر می‌شود." },
    { name: "شنا شبه پلانچ", englishName: "Pseudo Planche Push-up", howTo: "دست‌ها را نزدیک کمر قرار دهید و بدن را به جلو متمایل کنید تا سرشانه‌ها از مچ جلوتر بروند.", sets: 3, reps: "6-8", notes: "یک قدم مهم برای یادگیری حرکت پلانچ کامل." },
    { name: "نگه داشتن تعادل روی دست", englishName: "Wall Handstand Hold", howTo: "پشت به دیوار، پاها را روی دیوار بالا ببرید تا در حالت ایستادن روی دست قرار بگیرید و نگه دارید.", sets: 3, time: 30, notes: "برای تقویت قدرت و پایداری سرشانه." },
    { name: "پشت بازو خوابیده", englishName: "Floor Triceps Extension", howTo: "به پشت دراز بکشید، باسن را بلند کنید و با خم کردن آرنج‌ها، ساعد را به زمین نزدیک کنید.", sets: 3, reps: "12-15", notes: "با کنترل کامل حرکت را انجام دهید." },
    { name: "شنا انفجاری", englishName: "Explosive Push-up", howTo: "با تمام قدرت به سمت بالا فشار دهید تا دست‌ها از زمین جدا شوند. می‌توانید بین فشار دست بزنید.", sets: 3, reps: "5-8", notes: "برای افزایش قدرت و توان انفجاری." },
    { name: "کشش پشت بازو", englishName: "Triceps Stretch", howTo: "یک دست را از بالای سر خم کنید و با دست دیگر، آرنج را به آرامی به سمت پایین بکشید.", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر." },
  ]},
  pull_A: { name: translations.pullA, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (پایه‌ای)", exercises: [
    { name: "بارفیکس استرالیایی", englishName: "Australian Pull-up", howTo: "زیر یک میله پایین (یا میز) قرار بگیرید و با بدنی صاف، سینه را به میله نزدیک کنید.", sets: 3, reps: "10-12", notes: "یک حرکت عالی برای ساختن قدرت پایه برای بارفیکس." },
    { name: "بارفیکس با فاز منفی", englishName: "Negative Pull-up", howTo: "بالا بپرید تا چانه بالای میله باشد، سپس به آرامی (در ۳ تا ۵ ثانیه) خود را پایین بیاورید.", sets: 3, reps: "6-8", notes: "برای ساختن قدرت لازم برای بارفیکس کامل." },
    { name: "کشش کتف", englishName: "Scapular Pulls", howTo: "از میله آویزان شوید و بدون خم کردن آرنج، فقط با استفاده از عضلات کتف، بدن را کمی بالا و پایین ببرید.", sets: 3, reps: "10", notes: "برای فعال‌سازی و سلامت عضلات پشت." },
    { name: "آویزان شدن فعال", englishName: "Active Hang", howTo: "از میله آویزان شوید و شانه‌ها را فعالانه به سمت پایین فشار دهید (از گوش دور کنید) و نگه دارید.", sets: 3, time: 30, notes: "برای سلامت شانه و افزایش قدرت پنجه." },
    { name: "سوپرمن", englishName: "Superman Lifts", howTo: "روی شکم دراز بکشید و همزمان دست‌ها و پاها را از زمین بلند کنید.", sets: 3, reps: "15", notes: "برای تقویت عضلات فیله کمر." },
    { name: "روئینگ با حوله", englishName: "Towel Rows", howTo: "یک حوله را دور دستگیره در بیاندازید و با گرفتن دو سر حوله، خود را به سمت در بکشید.", sets: 3, reps: "12", notes: "یک جایگزین عالی برای حرکت روئینگ." },
    { name: "پلانک معکوس", englishName: "Reverse Plank", howTo: "مانند حالت پل باسن شروع کنید اما دست‌ها و پاها را صاف کرده و بدن را در یک خط مستقیم نگه دارید.", sets: 3, time: 30, notes: "برای تقویت زنجیره خلفی بدن." },
    { name: "کشش زیربغل", englishName: "Lat Stretch", howTo: "کنار دیوار بایستید، یک دست را به دیوار تکیه داده و به آرامی بچرخید تا کشش را در زیربغل حس کنید.", sets: 1, time: 30, notes: "در پایان تمرین برای افزایش انعطاف." },
  ]},
  pull_B: { name: translations.pullB, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (کششی)", exercises: [
    { name: "چین آپ", englishName: "Chin-up", howTo: "کف دست‌ها به سمت صورت باشد و خود را بالا بکشید. این حرکت فشار بیشتری به جلو بازو وارد می‌کند.", sets: 3, reps: "تا ناتوانی", notes: "اگر سخت است، از فاز منفی استفاده کنید." },
    { name: "بارفیکس دست باز", englishName: "Wide Grip Pull-up", howTo: "دست‌ها را بیشتر از عرض شانه باز کرده و خود را بالا بکشید. تمرکز بر روی عضلات پشتی بزرگ (زیر بغل).", sets: 3, reps: "6-8", notes: "برای داشتن پشتی V شکل." },
    { name: "نگه داشتن در بالای بارفیکس", englishName: "Isometric Hold", howTo: "خود را بالا بکشید و در بالاترین نقطه (چانه بالای میله) برای چند ثانیه نگه دارید.", sets: 3, time: 15, notes: "برای افزایش قدرت استاتیک و استقامت." },
    { name: "بارفیکس با حوله", englishName: "Towel Pull-up", howTo: "دو حوله از میله آویزان کنید و با گرفتن آن‌ها بارفیکس بروید. این حرکت قدرت پنجه را به شدت افزایش می‌دهد.", sets: 3, reps: "5", notes: "بسیار چالش‌برانگیز برای ساعد و پنجه." },
    { name: "فیله کمر روی زمین", englishName: "Back Extension on Floor", howTo: "روی شکم دراز بکشید و دست‌ها را کنار سر قرار دهید. بالاتنه را تا جای ممکن از زمین بلند کنید.", sets: 3, reps: "15", notes: "جایگزین مناسبی برای دستگاه فیله کمر." },
    { name: "جلو بازو با وزن بدن", englishName: "Bodyweight Bicep Curl", howTo: "زیر یک میز یا میله پایین، بدن را با زاویه نگه داشته و با خم کردن آرنج، خود را بالا بکشید.", sets: 3, reps: "10-12", notes: "هرچه بدن افقی‌تر باشد، حرکت سخت‌تر است." },
    { name: "آویزان شدن از یک دست", englishName: "One Arm Hang", howTo: "با تمام قدرت از یک دست از میله آویزان شوید و تا جای ممکن نگه دارید.", sets: 3, time: "10 هر دست", notes: "برای به چالش کشیدن نهایی قدرت پنجه." },
    { name: "کشش جلو بازو", englishName: "Biceps Stretch", howTo: "دست را از پشت به دیوار تکیه دهید و به آرامی بدن را بچرخانید تا کشش را در جلو بازو حس کنید.", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری." },
  ]},
  legs: { name: translations.legs, icon: Zap, target: "پا، باسن، میان تنه", exercises: [
    { name: "اسکات با وزن بدن", englishName: "Bodyweight Squat", howTo: "بایستید و تصور کنید می‌خواهید روی یک صندلی بنشینید. کمر صاف و سینه رو به جلو باشد.", sets: 3, reps: "20", notes: "فرم صحیح حرکت را در اولویت قرار دهید." },
    { name: "لانگز قدم‌رو", englishName: "Walking Lunges", howTo: "یک قدم بزرگ به جلو بردارید و هر دو زانو را تا زاویه ۹۰ درجه خم کنید. سپس با پای دیگر تکرار کنید.", sets: 3, reps: "12 هر پا", notes: "گام‌های بلند و کنترل شده بردارید." },
    { name: "پل باسن", englishName: "Glute Bridge", howTo: "به پشت دراز بکشید، زانوها خم و کف پا روی زمین. باسن را تا جای ممکن بالا بیاورید و منقبض کنید.", sets: 3, reps: "20", notes: "در بالای حرکت، عضلات باسن را کاملا منقبض کنید." },
    { name: "ساق پا ایستاده", englishName: "Calf Raise", howTo: "روی لبه یک پله بایستید و روی پنجه پا بلند شوید، سپس به آرامی پایین بیایید.", sets: 4, reps: "25", notes: "برای دامنه حرکتی کامل، روی لبه پله بایستید." },
    { name: "لانگز به بغل", englishName: "Side Lunge", howTo: "یک قدم بزرگ به بغل بردارید و روی آن پا بنشینید، در حالی که پای دیگر صاف است.", sets: 3, reps: "10 هر طرف", notes: "برای تقویت عضلات داخلی و خارجی ران." },
    { name: "اسکات پرشی", englishName: "Jump Squat", howTo: "یک اسکات کامل بزنید و در مسیر بالا آمدن، با تمام قدرت به سمت بالا بپرید و نرم فرود بیایید.", sets: 3, reps: "12", notes: "برای افزایش توان انفجاری پاها." },
    { name: "صندلی روی دیوار", englishName: "Wall Sit", howTo: "پشت به دیوار، در حالت اسکات (ران‌ها موازی زمین) تکیه دهید و در همان حالت بمانید.", sets: 3, time: 45, notes: "این حرکت استقامت عضلات چهارسر را به چالش می‌کشد." },
    { name: "ددلیفت تک پا", englishName: "Single Leg RDL", howTo: "روی یک پا بایستید، بالاتنه را به جلو خم کنید و همزمان پای دیگر را به عقب ببرید تا بدن موازی زمین شود.", sets: 3, reps: "10 هر پا", notes: "برای تقویت تعادل و عضلات همسترینگ." },
  ]},
};
const weeklySchedule = ['push_A', 'pull_A', 'legs', 'rest', 'push_B', 'pull_B', 'rest'];

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }};

// --- Helper Functions ---
const calculateStreak = (dates) => {
    if (dates.length === 0) return 0;
    const sortedDates = [...new Set(dates.map(d => d.split('T')[0]))].sort();
    let currentStreak = 0;
    if (sortedDates.length > 0) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const lastWorkoutDate = new Date(sortedDates[sortedDates.length - 1]); lastWorkoutDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) return 0;
        currentStreak = 1;
    }
    for (let i = sortedDates.length - 1; i > 0; i--) {
        const d1 = new Date(sortedDates[i]);
        const d2 = new Date(sortedDates[i - 1]);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
        if (diff === 1) currentStreak++;
        else break;
    }
    return currentStreak;
};

// --- Components ---
const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('male');
    const [birthDay, setBirthDay] = useState('1');
    const [birthMonth, setBirthMonth] = useState('فروردین');
    const [birthYear, setBirthYear] = useState('1380');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (isForgotPassword) {
            try {
                await sendPasswordResetEmail(auth, email);
                setMessage(translations.resetLinkSent);
                setIsForgotPassword(false);
            } catch (err) { setError(err.message); }
            return;
        }

        if (isLogin) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) { setError(err.message); }
        } else {
            if (!firstName || !lastName) {
                setError("لطفا نام و نام خانوادگی را وارد کنید.");
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    firstName,
                    lastName,
                    email: user.email,
                    gender,
                    dateOfBirth: { day: birthDay, month: birthMonth, year: birthYear },
                    createdAt: new Date().toISOString()
                });
            } catch (err) { setError(err.message); }
        }
    };

    if (isForgotPassword) {
        return (
            <div className="auth-container">
                <motion.div className="auth-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="auth-title">{translations.resetPassword}</h2>
                    <form onSubmit={handleAuthAction}>
                        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={translations.email} required />
                        <button className="auth-button" type="submit">{translations.sendResetLink}</button>
                    </form>
                    {error && <p className="auth-error">{error}</p>}
                    {message && <p className="auth-message">{message}</p>}
                    <button className="auth-toggle-button" onClick={() => setIsForgotPassword(false)}>{translations.backToHome}</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <motion.div className="auth-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="auth-title">{isLogin ? translations.login : translations.createAccount}</h2>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (
                        <>
                            <div className="form-row">
                                <input className="auth-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={translations.firstName} required />
                                <input className="auth-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={translations.lastName} required />
                            </div>
                            <select className="auth-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                                <option value="male">{translations.male}</option>
                                <option value="female">{translations.female}</option>
                                <option value="other">{translations.other}</option>
                            </select>
                            <label className="auth-label">{translations.dateOfBirth}</label>
                            <div className="dob-container">
                                <select className="auth-select" value={birthDay} onChange={e => setBirthDay(e.target.value)}>{Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}</select>
                                <select className="auth-select" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>{persianMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                <select className="auth-select" value={birthYear} onChange={e => setBirthYear(e.target.value)}>{Array.from({length: 71}, (_, i) => 1403 - i).map(y => <option key={y} value={y}>{y}</option>)}</select>
                            </div>
                        </>
                    )}
                    <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={translations.email} required />
                    <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={translations.password} required />
                    <button className="auth-button" type="submit">{isLogin ? translations.login : translations.signup}</button>
                </form>
                {error && <p className="auth-error">{error}</p>}
                <div className="auth-footer">
                    <button className="auth-toggle-button" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? translations.dontHaveAccount + ' ' + translations.signup : translations.alreadyHaveAccount + ' ' + translations.login}
                    </button>
                    {isLogin && <button className="auth-toggle-button" onClick={() => setIsForgotPassword(true)}>{translations.forgotPassword}</button>}
                </div>
            </motion.div>
        </div>
    );
};

const CalendarGrid = memo(({ completedDates, displayDate }) => {
    const moment = jalali_moment(displayDate).locale('fa');
    const month = moment.jMonth();
    const year = moment.jYear();
    
    const daysInMonth = moment.jDaysInMonth();
    const firstDayOfMonth = moment.startOf('jMonth').day(); // 0 (Sun) - 6 (Sat)
    const jalaliFirstDay = (firstDayOfMonth + 1) % 7; // 0 (Sat) - 6 (Fri)

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: jalaliFirstDay });

    const completedDays = useMemo(() => new Set(
      completedDates
        .map(d => jalali_moment(d))
        .filter(d => d.jMonth() === month && d.jYear() === year)
        .map(d => d.jDate())
    ), [completedDates, month, year]);
  
    return (
      <div className="calendar-grid">
        {emptyDays.map((_, i) => <div key={`empty-${i}`} className="calendar-day empty"></div>)}
        {days.map(day => (
          <div key={day} className={`calendar-day ${completedDays.has(day) ? 'completed' : ''}`}>
            {day}
          </div>
        ))}
      </div>
    );
});

const ProfileScreen = ({ user, completedWorkouts, onLogout }) => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [displayDate, setDisplayDate] = useState(new Date());

    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) setUserData(docSnap.data());
                setIsLoading(false);
            });
        }
    }, [user]);

    const streak = useMemo(() => calculateStreak(completedWorkouts.map(w => w.date)), [completedWorkouts]);
    const totalDays = useMemo(() => new Set(completedWorkouts.map(w => w.date.split('T')[0])).size, [completedWorkouts]);

    const accountCreationMoment = useMemo(() => userData ? jalali_moment(userData.createdAt) : null, [userData]);
    const displayMoment = jalali_moment(displayDate);

    const canGoToPrev = accountCreationMoment ? displayMoment.clone().subtract(1, 'jMonth').isSameOrAfter(accountCreationMoment, 'jMonth') : false;
    const canGoToNext = !displayMoment.isSame(new Date(), 'jMonth');

    const goToPrevMonth = () => {
        if (canGoToPrev) setDisplayDate(displayMoment.clone().subtract(1, 'jMonth').toDate());
    };
    const goToNextMonth = () => {
        if (canGoToNext) setDisplayDate(displayMoment.clone().add(1, 'jMonth').toDate());
    };
    
    if (isLoading) {
        return <div className="loading-screen"><div className="loading-content"><Flame size={60} /></div></div>;
    }

    return (
        <motion.div className="screen-container" dir="rtl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="profile-header">
                <h1 className="screen-title">{userData ? `${userData.firstName} ${userData.lastName}` : translations.profile}</h1>
                <button onClick={onLogout} className="logout-button">{translations.logout}</button>
            </div>
            
            <h2 className="section-title">{translations.statistics}</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <BarChart2 className="stat-icon" />
                    <p className="stat-value">{streak}</p>
                    <p className="stat-label">{translations.workoutStreak}</p>
                </div>
                <div className="stat-card">
                    <CheckCircle className="stat-icon" />
                    <p className="stat-value">{totalDays}</p>
                    <p className="stat-label">{translations.totalWorkoutDays}</p>
                </div>
            </div>

            <h2 className="section-title">{translations.monthlyCalendar}</h2>
            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={goToPrevMonth} disabled={!canGoToPrev} className="calendar-nav-button"><ChevronRight /></button>
                    <span className="calendar-title">{displayMoment.locale('fa').format('jMMMM jYYYY')}</span>
                    <button onClick={goToNextMonth} disabled={!canGoToNext} className="calendar-nav-button"><ChevronLeft /></button>
                </div>
                <CalendarGrid completedDates={completedWorkouts.map(w => w.date)} displayDate={displayDate} />
            </div>
        </motion.div>
    );
};

const Timer = memo(({ initialTime = 90 }) => {
    const [time, setTime] = useState(initialTime);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef(null);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const progress = ((initialTime - time) / initialTime) * circumference;

    useEffect(() => {
        if (isActive && time > 0) {
            intervalRef.current = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, time]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => { setIsActive(false); setTime(initialTime); };
    const adjustTime = (amount) => setTime(t => Math.max(0, t + amount));

    return (
        <motion.div dir="rtl" className="timer-container" variants={itemVariants}>
            <h3 className="timer-title">{translations.timer}</h3>
            <div className="timer-circle-container">
                <svg className="timer-svg">
                    <circle className="timer-bg-circle" cx="50%" cy="50%" r={radius} />
                    <motion.circle className="timer-progress-circle" cx="50%" cy="50%" r={radius} strokeDasharray={circumference} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: progress }} transition={{ duration: 1 }} />
                </svg>
                <div className="timer-display">
                    <AnimatePresence mode="wait">
                       <motion.div key={time} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.2 }} className="timer-text">
                           {String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}
                       </motion.div>
                    </AnimatePresence>
                </div>
            </div>
             <div className="timer-controls">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustTime(10)} className="timer-adjust-btn"><Plus size={20} /></motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={toggle} className={`timer-main-btn ${isActive ? 'timer-pause-btn' : 'timer-start-btn'}`}>{isActive ? translations.pause : translations.start}</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={reset} className="timer-main-btn timer-reset-btn">{translations.reset}</motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustTime(-10)} className="timer-adjust-btn"><Minus size={20} /></motion.button>
            </div>
        </motion.div>
    );
});

const ExerciseCard = memo(({ exercise, index }) => {
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    return (
        <motion.div className="exercise-card" variants={itemVariants}>
            <div className="exercise-card-header" onClick={() => setIsNotesVisible(!isNotesVisible)}>
                <div className="exercise-card-title-group">
                    <span className="exercise-card-index">{index + 1}</span>
                    <div className="exercise-card-name-group">
                        <h3 className="exercise-card-name">{exercise.name}</h3>
                        <div className="exercise-card-details">
                            <span className="exercise-card-detail-item"><Dumbbell size={14} className="icon"/> {exercise.sets} {translations.sets}</span>
                            {exercise.reps && <span className="exercise-card-detail-item"><Repeat size={14} className="icon"/> {exercise.reps}</span>}
                            {exercise.time && <span className="exercise-card-detail-item"><Clock size={14} className="icon"/> {exercise.time} {translations.seconds}</span>}
                        </div>
                    </div>
                </div>
                <motion.div animate={{ rotate: isNotesVisible ? 45 : 0 }} transition={{ duration: 0.3 }}>
                    <Plus size={24} className="info-icon"/>
                </motion.div>
            </div>
            <AnimatePresence>
                {isNotesVisible && (
                    <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="exercise-card-notes-container">
                        <div className="exercise-card-notes">
                            {exercise.englishName && <p className="exercise-english-name">{exercise.englishName}</p>}
                            {exercise.howTo && <p className="exercise-how-to"><strong>چگونه:</strong> {exercise.howTo}</p>}
                            {exercise.notes && <p className="exercise-notes-tip"><strong>نکته:</strong> {exercise.notes}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

const WorkoutScreen = ({ workoutId, onBack, userId }) => {
    const workout = workoutData[workoutId];
    
    const handleComplete = async () => {
        if (!userId) return;
        const date = new Date();
        const workoutDocId = `${workoutId}-${date.toISOString().slice(0, 10)}`;
        const docRef = doc(db, "users", userId, "completedWorkouts", workoutDocId);
        try {
            await setDoc(docRef, { workoutId, date: date.toISOString(), completedAt: date });
            onBack(); // FIX: Redirect to home after completion
        } catch (error) { console.error("Error saving completion:", error); }
    };
    
    if (!workout) return null;
    const Icon = workout.icon;

    return (
        <motion.div className="screen-container" dir="rtl" initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
            <motion.div className="workout-header" variants={itemVariants}>
                <div className="workout-header-title-group">
                    <motion.div whileHover={{ scale: 1.1, rotate: -10 }} className="workout-header-icon-wrapper">
                        <Icon size={32} />
                    </motion.div>
                    <div>
                        <h1 className="screen-title">{workout.name}</h1>
                        <p className="workout-target"><Target size={16} className="icon"/>{workout.target}</p>
                    </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onBack} className="back-button"><ArrowLeft /></motion.button>
            </motion.div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <h3 className="section-title">{translations.importantNotes}</h3>
                {workout.exercises.map((ex, index) => <ExerciseCard key={ex.name} exercise={ex} index={index} />)}
                <Timer initialTime={90} />
                <motion.div className="completion-section" variants={itemVariants}>
                    <motion.button onClick={handleComplete} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(34, 211, 238, 0.5)" }} whileTap={{ scale: 0.98 }} className="main-action-button">{translations.markAsDone}</motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

const HomeScreen = ({ onSelectWorkout, completedWorkouts }) => {
    return (
        <motion.div className="screen-container" dir="rtl" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
            <motion.header className="home-header" initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <h1 className="app-title">{translations.appName}</h1>
                <p className="app-subtitle">{translations.welcome}</p>
            </motion.header>
            <motion.h2 className="section-title" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>{translations.yourWeeklyPlan}</motion.h2>
            <motion.div className="weekly-grid" variants={containerVariants} initial="hidden" animate="visible">
                {weeklySchedule.map((day, index) => {
                    const workout = workoutData[day];
                    const isRestDay = day === 'rest';
                    const dayNumber = index + 1;
                    const isCompleted = completedWorkouts.some(cw => cw.workoutId === day && cw.date.startsWith(new Date().toISOString().slice(0, 10)));
                    return (
                        <motion.div key={index} className={`day-card ${isRestDay ? 'rest-day' : ''}`} onClick={!isRestDay ? () => onSelectWorkout(day) : undefined} variants={itemVariants} whileHover={!isRestDay ? { scale: 1.03, y: -5 } : {}}>
                            {!isRestDay && <div className="day-card-glow"></div>}
                            <div className="day-card-content">
                                <div className="day-card-info">
                                    <div className={`day-card-icon-wrapper ${isRestDay ? 'rest-icon' : ''}`}>
                                      {!isRestDay && workout.icon && <workout.icon size={24} />}
                                      {isRestDay && <Clock size={24} />}
                                    </div>
                                    <div>
                                        <p className="day-card-day-number">روز {dayNumber}</p>
                                        <h3 className="day-card-name">{isRestDay ? translations.rest : workout.name}</h3>
                                    </div>
                                </div>
                                {isCompleted && !isRestDay && <motion.div className="day-card-completed-icon" initial={{scale:0}} animate={{scale:1}} transition={{type:'spring', stiffness: 200, damping: 10}}><CheckCircle size={24} /></motion.div>}
                            </div>
                            <div className="day-card-button-container">
                                {!isRestDay && (
                                    <motion.button className="day-card-button" whileTap={{ scale: 0.95 }}>
                                        {translations.startWorkout}
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
};

export default function App() {
    const [user, setUser] = useState(null);
    const [authStatus, setAuthStatus] = useState('loading');
    const [completedWorkouts, setCompletedWorkouts] = useState([]);
    const [page, setPage] = useState('home');
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthStatus('authed');
            } else {
                setUser(null);
                setAuthStatus('unauthed');
                setPage('home'); // Reset to home on logout
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!user) {
            setCompletedWorkouts([]);
            return;
        }
        const q = query(collection(db, "users", user.uid, "completedWorkouts"));
        const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
            const workouts = [];
            querySnapshot.forEach((doc) => {
                workouts.push({ id: doc.id, ...doc.data() });
            });
            setCompletedWorkouts(workouts);
        }, (error) => {
            console.error("Error fetching workouts:", error);
        });
        return () => unsubscribeFirestore();
    }, [user]);

    const handleLogout = () => {
        signOut(auth);
    };

    const handleSelectWorkout = (workoutId) => {
        setSelectedWorkout(workoutId);
        setPage('workout');
    };
    
    const handleBackToHome = () => {
        setPage('home');
        setSelectedWorkout(null);
    };

    const renderContent = () => {
        if (authStatus === 'loading') {
            return <div className="loading-screen"><div className="loading-content"><Flame size={60} /><p className="loading-text">{translations.loading}</p></div></div>;
        }
        if (authStatus === 'unauthed') {
            return <AuthPage />;
        }
        if (authStatus === 'authed' && user) {
            return (
                <div className="main-app-wrapper">
                    <div className="main-content">
                        <AnimatePresence mode="wait">
                            {page === 'home' && <HomeScreen key="home" onSelectWorkout={handleSelectWorkout} completedWorkouts={completedWorkouts} />}
                            {page === 'workout' && <WorkoutScreen key="workout" workoutId={selectedWorkout} onBack={handleBackToHome} userId={user.uid} />}
                            {page === 'profile' && <ProfileScreen key="profile" user={user} completedWorkouts={completedWorkouts} onLogout={handleLogout} />}
                        </AnimatePresence>
                    </div>
                    <nav className="bottom-nav">
                        <button onClick={() => setPage('home')} className={`nav-button ${page === 'home' || page === 'workout' ? 'active' : ''}`}><Home /><span>{translations.home}</span></button>
                        <button onClick={() => setPage('profile')} className={`nav-button ${page === 'profile' ? 'active' : ''}`}><User /><span>{translations.profile}</span></button>
                    </nav>
                </div>
            );
        }
        return <AuthPage />; // Fallback
    };

    return (
        <main className="app-main">
            <div className="animated-background"></div>
            <div className="app-container">
                {renderContent()}
            </div>
        </main>
    );
}
