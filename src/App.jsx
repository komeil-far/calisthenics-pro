import React, { useState, useEffect, useRef, memo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dumbbell, Zap, Target, CheckCircle, Repeat, Flame, Plus, Minus, Info, ArrowLeft } from 'lucide-react';

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

// --- Workout Data ---
const workoutData = {
  push_A: { name: translations.pushA, icon: Flame, target: "سینه، سرشانه، پشت بازو (پایه‌ای)", exercises: [ { name: "شنا روی سطح شیبدار", sets: 3, reps: "12-15", notes: "برای گرم کردن و آماده‌سازی سینه و سرشانه عالی است." }, { name: "شنا سوئدی استاندارد", sets: 3, reps: "تا ناتوانی", notes: "فرم صحیح را حفظ کنید. بدن صاف مثل یک خط کش." }, { name: "شنا روی زانو", sets: 2, reps: "15", notes: "برای افزایش حجم تمرین و خسته کردن کامل عضلات." }, { name: "دیپ با نیمکت", sets: 3, reps: "10-12", notes: "تمرکز اصلی روی عضلات پشت بازو." }, { name: "شنا پایک", sets: 3, reps: "8-10", notes: "باسن را بالا نگه دارید تا فشار روی سرشانه متمرکز شود." }, { name: "پلانک به شنا", sets: 3, reps: "8 هر طرف", notes: "حرکتی عالی برای تقویت میان‌تنه و پایداری شانه." }, { name: "لمس شانه در حالت پلانک", sets: 3, time: 40, notes: "بدن را ثابت نگه دارید و از چرخش لگن جلوگیری کنید." }, { name: "کشش سینه", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر عضلات سینه." }, ] },
  push_B: { name: translations.pushB, icon: Flame, target: "سینه، سرشانه، پشت بازو (شدتی)", exercises: [ { name: "شنا دست باز", sets: 3, reps: "10-12", notes: "فشار بیشتر روی بخش خارجی عضلات سینه." }, { name: "شنا الماسی", sets: 3, reps: "تا ناتوانی", notes: "تمرکز حداکثری بر روی عضلات سه سر بازویی (پشت بازو)." }, { name: "شنا با شیب منفی", sets: 3, reps: "8-10", notes: "پاهایتان را روی سطح بلندتر قرار دهید. برای بخش بالایی سینه." }, { name: "شنا شبه پلانچ", sets: 3, reps: "6-8", notes: "دست‌ها را نزدیک کمر قرار دهید و به جلو خم شوید. حرکتی پیشرفته." }, { name: "نگه داشتن تعادل روی دست کنار دیوار", sets: 3, time: 30, notes: "برای تقویت قدرت و پایداری سرشانه." }, { name: "پشت بازو خوابیده روی زمین", sets: 3, reps: "12-15", notes: "با کنترل کامل حرکت را انجام دهید." }, { name: "شنا انفجاری", sets: 3, reps: "5-8", notes: "با تمام قدرت دست‌ها را از زمین جدا کنید." }, { name: "کشش پشت بازو", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری بهتر." }, ] },
  pull_A: { name: translations.pullA, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (پایه‌ای)", exercises: [ { name: "بارفیکس استرالیایی", sets: 3, reps: "10-12", notes: "یک حرکت عالی برای ساختن قدرت پایه برای بارفیکس." }, { name: "بارفیکس پرشی با فاز منفی", sets: 3, reps: "6-8", notes: "بالا بپرید و به آرامی (۳ تا ۵ ثانیه) پایین بیایید." }, { name: "کشش کتف در حالت آویزان", sets: 3, reps: "10", notes: "فقط با استفاده از عضلات کتف، بدن را بالا و پایین ببرید." }, { name: "آویزان شدن فعال", sets: 3, time: 30, notes: "شانه‌ها را از گوش دور نگه دارید. برای سلامت شانه و قدرت گرفتن." }, { name: "سوپرمن", sets: 3, reps: "15", notes: "برای تقویت عضلات فیله کمر." }, { name: "روئینگ با حوله و در", sets: 3, reps: "12", notes: "یک حوله را دور دستگیره در بیاندازید و خود را به سمت در بکشید." }, { name: "پلانک معکوس", sets: 3, time: 30, notes: "برای تقویت زنجیره خلفی بدن (کمر، باسن، همسترینگ)." }, { name: "کشش زیربغل", sets: 1, time: 30, notes: "در پایان تمرین برای افزایش انعطاف." }, ] },
  pull_B: { name: translations.pullB, icon: Repeat, target: "پشت، زیر بغل، جلو بازو (کششی)", exercises: [ { name: "چین آپ", sets: 3, reps: "تا ناتوانی", notes: "کف دست‌ها به سمت صورت. فشار بیشتر روی جلو بازو." }, { name: "بارفیکس دست باز", sets: 3, reps: "6-8", notes: "تمرکز بر روی عضلات پشتی بزرگ (زیر بغل)." }, { name: "نگه داشتن در بالای بارفیکس", sets: 3, time: 15, notes: "چانه بالای میله. برای افزایش قدرت استاتیک." }, { name: "بارفیکس با حوله", sets: 3, reps: "5", notes: "دو حوله از میله آویزان کنید و از آنها برای بارفیکس استفاده کنید. عالی برای قدرت پنجه." }, { name: "فیله کمر روی زمین", sets: 3, reps: "15", notes: "جایگزین مناسبی برای سوپرمن." }, { name: "جلو بازو با وزن بدن", sets: 3, reps: "10-12", notes: "از یک میز یا میله پایین برای انجام حرکت استفاده کنید." }, { name: "آویزان شدن از یک دست", sets: 3, time: "10 هر دست", notes: "برای به چالش کشیدن نهایی قدرت پنجه و زیربغل." }, { name: "کشش جلو بازو", sets: 1, time: 30, notes: "در پایان تمرین برای ریکاوری." }, ] },
  legs: { name: translations.legs, icon: Zap, target: "پا، باسن، میان تنه", exercises: [ { name: "اسکات با وزن بدن", sets: 3, reps: "20", notes: "فرم صحیح حرکت را در اولویت قرار دهید." }, { name: "لانگز قدم‌رو", sets: 3, reps: "12 هر پا", notes: "گام‌های بلند و کنترل شده بردارید." }, { name: "پل باسن", sets: 3, reps: "20", notes: "در بالای حرکت، عضلات باسن را کاملا منقبض کنید." }, { name: "ساق پا ایستاده", sets: 4, reps: "25", notes: "برای دامنه حرکتی کامل، روی لبه پله بایستید." }, { name: "لانگز به بغل", sets: 3, reps: "10 هر طرف", notes: "برای تقویت عضلات داخلی و خارجی ران." }, { name: "اسکات پرشی", sets: 3, reps: "12", notes: "با تمام قدرت به سمت بالا بپرید و نرم فرود بیایید." }, { name: "صندلی روی دیوار", sets: 3, time: 45, notes: "ران‌ها باید موازی با زمین باشند." }, { name: "ددلیفت تک پا با وزن بدن", sets: 3, reps: "10 هر پا", notes: "برای تقویت تعادل و عضلات همسترینگ." }, ] },
};
const weeklySchedule = ['push_A', 'pull_A', 'legs', 'rest', 'push_B', 'pull_B', 'rest'];

// --- Animation Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }};

// --- Memoized Components for Performance ---

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
});

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
            {/* CSS Styles are now embedded here */}
            <style>{`
                /* General Styles & Font */
                @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');

                :root {
                  --bg-color: #111827;
                  --card-bg-color: rgba(31, 41, 55, 0.6);
                  --border-color: #374151;
                  --text-color: #e5e7eb;
                  --text-color-light: #9ca3af;
                  --primary-color: #22d3ee;
                  --primary-color-dark: #0e7490;
                  --green-color: #22c55e;
                  --yellow-color: #eab308;
                  --red-color: #ef4444;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                  margin: 0;
                  font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                    sans-serif;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  background-color: var(--bg-color);
                  color: var(--text-color);
                }

                /* App Layout & Background */
                .app-main {
                  min-height: 100vh;
                  overflow-x: hidden;
                }

                .animated-background {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  z-index: 0;
                  background: radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.1), transparent 30%),
                              radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1), transparent 30%);
                  animation: move-glow 20s linear infinite;
                }

                @keyframes move-glow {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }

                .app-container {
                  position: relative;
                  z-index: 1;
                  max-width: 672px;
                  margin: 0 auto;
                  padding: 0 1rem; /* Added horizontal padding for smaller screens */
                }

                .screen-container {
                  padding: 1.5rem 0; /* Changed padding to vertical only */
                  min-height: 100vh;
                }

                /* Loading Screen */
                .loading-screen {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                }
                .loading-content {
                  text-align: center;
                }
                .loading-text {
                  margin-top: 1rem;
                  font-size: 1.25rem;
                  letter-spacing: 0.1em;
                }

                /* Home Screen */
                .home-header {
                  text-align: center;
                  margin-bottom: 2.5rem;
                }
                .app-title {
                  font-size: 2.5rem; /* Reduced font size */
                  font-weight: 700;
                  background-image: linear-gradient(to right, #22d3ee, #3b82f6);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                }
                .app-subtitle {
                  color: var(--text-color-light);
                  font-size: 1.125rem;
                  margin-top: 0.5rem;
                }
                .section-title {
                  font-size: 1.25rem;
                  font-weight: 700;
                  margin-bottom: 1rem;
                }
                .weekly-grid {
                  display: grid;
                  grid-template-columns: 1fr; /* Mobile first: one column */
                  gap: 1rem; /* Reduced gap for mobile */
                }
                @media (min-width: 640px) {
                  .weekly-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                  }
                  .app-title {
                     font-size: 3rem;
                  }
                }

                /* Day Card */
                .day-card {
                  position: relative;
                  display: flex;
                  flex-direction: column;
                  height: 100%;
                  padding: 1rem; /* Reduced padding for mobile */
                  border-radius: 1rem;
                  border: 1px solid var(--border-color);
                  transition: all 0.3s ease;
                  background-color: var(--card-bg-color);
                  backdrop-filter: blur(4px);
                  cursor: pointer;
                }
                .day-card.rest-day {
                  cursor: default;
                  background-color: #1f2937;
                }
                .day-card:not(.rest-day):hover {
                  border-color: var(--primary-color);
                }
                .day-card-glow {
                  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                  background-color: rgba(34, 211, 238, 0.2);
                  border-radius: 1rem; filter: blur(1.5rem);
                  opacity: 0; transition: opacity 0.3s ease;
                }
                .day-card:hover .day-card-glow { opacity: 1; }
                .day-card-content { position: relative; flex-grow: 1; }
                .day-card-info { display: flex; align-items: center; }
                .day-card-icon-wrapper {
                  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
                  width: 2.5rem; height: 2.5rem; /* Smaller icon wrapper for mobile */
                  border-radius: 0.75rem; margin-left: 0.75rem;
                  background-color: rgba(14, 116, 144, 0.5);
                  color: var(--primary-color);
                }
                .day-card-icon-wrapper.rest-icon { background-color: #374151; color: var(--text-color-light); }
                .day-card-day-number { color: var(--text-color-light); font-size: 0.875rem; }
                .day-card-name {
                  font-weight: 700; font-size: 1.125rem; /* Reduced font size */
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .day-card-completed-icon { position: absolute; top: 0; left: 0; color: var(--green-color); }
                .day-card-button-container { margin-top: 1rem; height: 42px; display: flex; align-items: flex-end; }
                .day-card-button {
                  width: 100%; background-color: #374151; color: var(--primary-color);
                  font-weight: 600; padding: 0.625rem 0; border-radius: 0.5rem;
                  border: 1px solid #4b5563; transition: all 0.3s ease; cursor: pointer;
                }
                .day-card:hover .day-card-button { background-color: var(--primary-color); color: var(--bg-color); border-color: var(--primary-color); }

                /* Workout Screen */
                .workout-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 2rem;
                }
                .workout-header-title-group { display: flex; align-items: center; min-width: 0; }
                .workout-header-icon-wrapper {
                  flex-shrink: 0; padding: 0.75rem; background-color: #1f2937;
                  border-radius: 9999px; margin-right: 1rem; color: var(--primary-color);
                }
                .screen-title {
                  font-size: 1.5rem; /* Reduced font size */
                  font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .workout-target {
                  display: flex; align-items: center; margin-top: 0.25rem;
                  color: var(--text-color-light); white-space: nowrap;
                  overflow: hidden; text-overflow: ellipsis;
                }
                .back-button {
                  flex-shrink: 0; padding: 0.75rem; background-color: #374151;
                  border-radius: 9999px; transition: background-color 0.3s;
                  border: none; color: white; cursor: pointer;
                }
                .back-button:hover { background-color: #4b5563; }

                /* Exercise Card */
                .exercise-card {
                  background-color: var(--card-bg-color); backdrop-filter: blur(4px);
                  border-radius: 1rem; padding: 1rem; margin-bottom: 1rem;
                  border: 1px solid var(--border-color); overflow: hidden;
                }
                .exercise-card-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
                .exercise-card-title-group { display: flex; align-items: center; min-width: 0; }
                .exercise-card-index {
                  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
                  width: 2.5rem; height: 2.5rem; background-color: #374151;
                  color: var(--primary-color); font-weight: 700; font-size: 1.25rem;
                  border-radius: 9999px; margin-left: 1rem;
                }
                .exercise-card-name-group { min-width: 0; }
                .exercise-card-name {
                  font-weight: 700; font-size: 1.125rem;
                  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .exercise-card-details {
                  display: flex; align-items: center; flex-wrap: wrap;
                  color: var(--text-color-light); font-size: 0.875rem; margin-top: 0.25rem;
                }
                .exercise-card-detail-item { display: flex; align-items: center; margin-left: 1rem; }
                .icon { margin-right: 0.25rem; color: var(--primary-color); }
                .info-icon { color: var(--text-color-light); transition: color 0.3s; }
                .exercise-card-header:hover .info-icon { color: white; }
                .exercise-card-notes-container { overflow: hidden; }
                .exercise-card-notes {
                  padding-top: 0.75rem; border-top: 1px solid var(--border-color);
                  font-size: 0.875rem; color: var(--text-color); white-space: pre-wrap;
                }

                /* Timer */
                .timer-container {
                  width: 100%; max-width: 24rem; margin: 2rem auto 0 auto;
                  padding: 1.5rem; background-color: var(--card-bg-color);
                  backdrop-filter: blur(4px); border-radius: 1.5rem;
                  border: 1px solid var(--border-color); text-align: center;
                }
                .timer-title {
                  font-size: 1.25rem; font-weight: 700;
                  color: var(--primary-color); margin-bottom: 1rem;
                }
                .timer-circle-container {
                  position: relative; width: 10rem; height: 10rem; /* Smaller timer on mobile */
                  margin: 0 auto; display: flex; align-items: center; justify-content: center;
                }
                .timer-svg { position: absolute; width: 100%; height: 100%; transform: rotate(-90deg); }
                .timer-bg-circle { stroke: #374151; stroke-width: 8; fill: transparent; }
                .timer-progress-circle { stroke: var(--primary-color); stroke-width: 8; fill: transparent; stroke-linecap: round; }
                .timer-display { display: flex; align-items: center; justify-content: center; z-index: 10; }
                .timer-text { font-family: 'Courier New', Courier, monospace; font-size: 2.5rem; letter-spacing: 0.05em; }
                .timer-controls { display: flex; justify-content: center; align-items: center; gap: 0.75rem; margin-top: 1.5rem; }
                .timer-adjust-btn {
                  padding: 0.75rem; background-color: #374151; border-radius: 9999px;
                  border: none; color: white; cursor: pointer; transition: background-color 0.3s;
                }
                .timer-adjust-btn:hover { background-color: var(--primary-color); }
                .timer-main-btn {
                  padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-size: 1rem;
                  font-weight: 700; transition: all 0.3s; border: none; cursor: pointer;
                }
                .timer-start-btn { background-color: var(--green-color); color: white; }
                .timer-start-btn:hover { background-color: #16a34a; }
                .timer-pause-btn { background-color: var(--yellow-color); color: white; }
                .timer-pause-btn:hover { background-color: #ca8a04; }
                .timer-reset-btn { background-color: var(--red-color); color: white; }
                .timer-reset-btn:hover { background-color: #dc2626; }

                /* Completion Section */
                .completion-section { margin-top: 2rem; text-align: center; }
                .main-action-button {
                  width: 100%; padding: 1rem 0; background-color: var(--primary-color);
                  color: #1f2937; font-weight: 700; font-size: 1.125rem;
                  border-radius: 1rem; transition: all 0.3s; border: none; cursor: pointer;
                }
                .main-action-button:hover {
                  transform: scale(1.05);
                  box-shadow: 0px 0px 20px rgba(34, 211, 238, 0.5);
                }
                .completion-message {
                  display: flex; flex-direction: column; align-items: center; justify-content: center;
                  padding: 1.5rem; background-color: rgba(34, 197, 94, 0.1);
                  border: 1px solid var(--green-color); border-radius: 1rem;
                }
                .completion-icon { color: var(--green-color); margin-bottom: 0.75rem; }
                .completion-title { font-size: 1.5rem; font-weight: 700; }
                .completion-subtitle { color: #86efac; }
            `}</style>
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
