import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dumbbell, Zap, Target, CheckCircle, Repeat, Flame, Plus, Minus, Info, ArrowLeft } from 'lucide-react';

// فایل CSS جدید را وارد می‌کنیم
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
  importantNotes: "نکات مهم",
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
};

// --- Firebase Configuration ---
// نکته مهم: برای ذخیره داده‌ها، باید این بخش را با اطلاعات پروژه فایربیس خودتان جایگزین کنید
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
const appId = 'calisthenics-pro-default';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Workout Data (same as before) ---
const workoutData = {
  push_A: { name: translations.pushA, icon: Flame, target: "سینه، سرشانه، پشت بازو (پایه‌ای)", exercises: [ { name: "شنا روی سطح شیبدار (Incline Push-ups)", sets: 3, reps: "12-15", notes: "برای گرم کردن و آماده‌سازی سینه و سرشانه عالی است." }, { name: "شنا سوئدی استاندارد (Standard Push-ups)", sets: 3, reps: "تا ناتوانی", notes: "فرم صحیح را حفظ کنید. بدن صاف مثل یک خط کش." }, { name: "شنا روی زانو (Knee Push-ups)", sets: 2, reps: "15", notes: "برای افزایش حجم تمرین و خسته کردن کامل عضلات." }, { name: "دیپ با نیمکت (Bench Dips)", sets: 3, reps: "10-12", notes: "تمرکز اصلی روی عضلات پشت بازو." }, { name: "شنا پایک (Pike Push-ups)", sets: 3, reps: "8-10", notes: "باسن را بالا نگه دارید تا فشار روی سرشانه متمرکز شود." }, { name: "پلانک به شنا (Plank to Push-up)", sets: 3, reps: "8 هر طرف", notes: "حرکتی عالی برای تقویت میان‌تنه و پایداری شانه." }, { name: "لمس شانه در حالت پلانک (Shoulder Taps)", sets: 3, time: 40, notes: "بدن را ثابت نگه دارید و از چرخش لگن جلوگیری کنید." }, { name: "کشش سینه (Chest Stretch)", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر عضلات سینه." }, ] },
  push_B: { name: translations.pushB, icon: Flame, target: "سینه، سرشانه، پشت بازو (شدتی)", exercises: [ { name: "شنا دست باز (Wide Push-ups)", sets: 3, reps: "10-12", notes: "فشار بیشتر روی بخش خارجی عضلات سینه." }, { name: "شنا الماسی (Diamond Push-ups)", sets: 3, reps: "تا ناتوانی", notes: "تمرکز حداکثری بر روی عضلات سه سر بازویی (پشت بازو)." }, { name: "شنا با شیب منفی (Decline Push-ups)", sets: 3, reps: "8-10", notes: "پاهایتان را روی سطح بلندتر قرار دهید. برای بخش بالایی سینه." }, { name: "شنا شبه پلانچ (Pseudo Planche Push-ups)", sets: 3, reps: "6-8", notes: "دست‌ها را نزدیک کمر قرار دهید و به جلو خم شوید. حرکتی پیشرفته." }, { name: "نگه داشتن تعادل روی دست کنار دیوار", sets: 3, time: 30, notes: "برای تقویت قدرت و پایداری سرشانه." }, { name: "پشت بازو خوابیده روی زمین (Triceps Extensions)", sets: 3, reps: "12-15", notes: "با کنترل کامل حرکت را انجام دهید." }, { name: "شنا انفجاری (Explosive Push-ups)", sets: 3, reps: "5-8", notes: "با تمام قدرت دست‌ها را از زمین جدا کنید." }, { name: "کشش پشت بازو (Triceps Stretch)", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر." }, ] },
  pull_A: { name: translations.pullA, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (پایه‌ای)", exercises: [ { name: "بارفیکس استرالیایی (Australian Pull-ups)", sets: 3, reps: "10-12", notes: "یک حرکت عالی برای ساختن قدرت پایه برای بارفیکس." }, { name: "بارفیکس پرشی با فاز منفی", sets: 3, reps: "6-8", notes: "بالا بپرید و به آرامی (۳ تا ۵ ثانیه) پایین بیایید." }, { name: "کشش کتف در حالت آویزان (Scapular Pulls)", sets: 3, reps: "10", notes: "فقط با استفاده از عضلات کتف، بدن را بالا و پایین ببرید." }, { name: "آویزان شدن فعال (Active Hang)", sets: 3, time: 30, notes: "شانه‌ها را از گوش دور نگه دارید. برای سلامت شانه و قدرت گرفتن." }, { name: "سوپرمن (Superman Lifts)", sets: 3, reps: "15", notes: "برای تقویت عضلات فیله کمر." }, { name: "روئینگ با حوله و در (Towel Rows)", sets: 3, reps: "12", notes: "یک حوله را دور دستگیره در بیاندازید و خود را به سمت در بکشید." }, { name: "پلانک معکوس (Reverse Plank)", sets: 3, time: 30, notes: "برای تقویت زنجیره خلفی بدن (کمر، باسن، همسترینگ)." }, { name: "کشش زیربغل (Lat Stretch)", sets: 1, time: 30, notes: "در پایان تمرین برای افزایش انعطاف." }, ] },
  pull_B: { name: translations.pullB, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (کششی)", exercises: [ { name: "چین آپ (Chin-ups)", sets: 3, reps: "تا ناتوانی", notes: "کف دست‌ها به سمت صورت. فشار بیشتر روی جلو بازو." }, { name: "بارفیکس دست باز (Wide Grip Pull-ups)", sets: 3, reps: "6-8", notes: "تمرکز بر روی عضلات پشتی بزرگ (زیر بغل)." }, { name: "نگه داشتن در بالای بارفیکس (Isometric Hold)", sets: 3, time: 15, notes: "چانه بالای میله. برای افزایش قدرت استاتیک." }, { name: "بارفیکس با حوله (Towel Pull-ups)", sets: 3, reps: "5", notes: "دو حوله از میله آویزان کنید و از آنها برای بارفیکس استفاده کنید. عالی برای قدرت پنجه." }, { name: "فیله کمر روی زمین (Back Extensions)", sets: 3, reps: "15", notes: "جایگزین مناسبی برای سوپرمن." }, { name: "جلو بازو با وزن بدن (Bodyweight Bicep Curls)", sets: 3, reps: "10-12", notes: "از یک میز یا میله پایین برای انجام حرکت استفاده کنید." }, { name: "آویزان شدن از یک دست (One Arm Hang)", sets: 3, time: "10 هر دست", notes: "برای به چالش کشیدن نهایی قدرت پنجه و زیربغل." }, { name: "کشش جلو بازو (Biceps Stretch)", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری." }, ] },
  legs: { name: translations.legs, icon: Zap, target: "پا، باسن، میان تنه", exercises: [ { name: "اسکات با وزن بدن (Bodyweight Squats)", sets: 3, reps: "20", notes: "فرم صحیح حرکت را در اولویت قرار دهید." }, { name: "لانگز قدم‌رو (Walking Lunges)", sets: 3, reps: "12 هر پا", notes: "گام‌های بلند و کنترل شده بردارید." }, { name: "پل باسن (Glute Bridges)", sets: 3, reps: "20", notes: "در بالای حرکت، عضلات باسن را کاملا منقبض کنید." }, { name: "ساق پا ایستاده (Calf Raises)", sets: 4, reps: "25", notes: "برای دامنه حرکتی کامل، روی لبه پله بایستید." }, { name: "لانگز به بغل (Side Lunges)", sets: 3, reps: "10 هر طرف", notes: "برای تقویت عضلات داخلی و خارجی ران." }, { name: "اسکات پرشی (Jump Squats)", sets: 3, reps: "12", notes: "با تمام قدرت به سمت بالا بپرید و نرم فرود بیایید." }, { name: "صندلی روی دیوار (Wall Sit)", sets: 3, time: 45, notes: "ران‌ها باید موازی با زمین باشند." }, { name: "ددلیفت تک پا با وزن بدن (Single Leg RDL)", sets: 3, reps: "10 هر پا", notes: "برای تقویت تعادل و عضلات همسترینگ." }, ] },
};
const weeklySchedule = ['push_A', 'pull_A', 'legs', 'rest', 'push_B', 'pull_B', 'rest'];

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }};

// --- Components ---

const Timer = ({ initialTime = 90 }) => {
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
};

const ExerciseCard = ({ exercise, index }) => {
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
                <motion.div animate={{ rotate: isNotesVisible ? 90 : 0 }} transition={{ duration: 0.3 }}>
                    <Info size={20} className="info-icon"/>
                </motion.div>
            </div>
            <AnimatePresence>
                {isNotesVisible && (
                    <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '12px' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="exercise-card-notes-container">
                        <div className="exercise-card-notes">
                            <p>{exercise.notes}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const WorkoutScreen = ({ workoutId, onBack, userId, completedWorkouts, setCompletedWorkouts }) => {
    const workout = workoutData[workoutId];
    const date = new Date().toISOString().slice(0, 10);
    const isCompleted = completedWorkouts.includes(`${workoutId}-${date}`);
    
    const handleComplete = async () => {
        if (!userId) return;
        const workoutDocId = `${workoutId}-${date}`;
        const docRef = doc(db, "users", userId, "completedWorkouts", workoutDocId);
        try {
            await setDoc(docRef, { workoutId, date, completedAt: new Date() });
            setCompletedWorkouts(prev => [...prev, workoutDocId]);
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
                {workout.exercises.map((ex, index) => <ExerciseCard key={index} exercise={ex} index={index} />)}
                <Timer initialTime={90} />
                <motion.div className="completion-section" variants={itemVariants}>
                    {isCompleted ? (
                        <div className="completion-message">
                             <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}><CheckCircle size={48} className="completion-icon" /></motion.div>
                             <h2 className="completion-title">{translations.greatJob}</h2>
                             <p className="completion-subtitle">{translations.sessionCompleted}</p>
                        </div>
                    ) : (
                        <motion.button onClick={handleComplete} whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(34, 211, 238, 0.5)" }} whileTap={{ scale: 0.98 }} className="main-action-button">{translations.markAsDone}</motion.button>
                    )}
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
                    const isCompleted = completedWorkouts.some(cw => cw.startsWith(day));
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
    const [currentScreen, setCurrentScreen] = useState('home');
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [userId, setUserId] = useState(null);
    const [completedWorkouts, setCompletedWorkouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) { setUserId(user.uid); } 
            else {
                try {
                     if (typeof __initial_auth_token !== 'undefined') { await signInWithCustomToken(auth, __initial_auth_token); } 
                     else { await signInAnonymously(auth); }
                } catch (error) { console.error("Sign-in failed:", error); setIsLoading(false); }
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
        setIsLoading(true);
        const q = query(collection(db, "users", userId, "completedWorkouts"));
        const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
            const workouts = [];
            querySnapshot.forEach((doc) => { workouts.push(doc.id); });
            setCompletedWorkouts(workouts);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching workouts:", error); setIsLoading(false); });
        return () => unsubscribeFirestore();
    }, [userId]);

    const handleSelectWorkout = (workoutId) => { setSelectedWorkout(workoutId); setCurrentScreen('workout'); };
    const handleBackToHome = () => { setCurrentScreen('home'); setSelectedWorkout(null); };

    if (isLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0], color: ["#22d3ee", "#67e8f9", "#22d3ee"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                       <Flame size={60} />
                    </motion.div>
                    <p className="loading-text">{translations.loading}</p>
                </div>
            </div>
        )
    }

    return (
        <main className="app-main">
             <div className="animated-background"></div>
            <div className="app-container">
                <AnimatePresence mode="wait">
                    {currentScreen === 'home' && <HomeScreen key="home" onSelectWorkout={handleSelectWorkout} completedWorkouts={completedWorkouts} />}
                    {currentScreen === 'workout' && <WorkoutScreen key="workout" workoutId={selectedWorkout} onBack={handleBackToHome} userId={userId} completedWorkouts={completedWorkouts} setCompletedWorkouts={setCompletedWorkouts}/>}
                </AnimatePresence>
            </div>
        </main>
    );
}
