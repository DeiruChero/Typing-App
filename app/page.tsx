"use client";

import { useState, useEffect, useRef, useCallback, type ReactElement } from "react";
import { WORDS, QUOTES, PUNCTUATION, NUMBERS } from "@/data/words";
import { THEMES } from "@/data/themes";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

type Mode = "time" | "words" | "quote" | "zen" | "custom";

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];
const QUOTE_OPTIONS = ["short", "medium", "long", "all"];
const MODE_ICONS: Record<Mode, string> = {
  time: "far fa-clock",        // clock icon
  words: "fas fa-font",        // "A" letter icon
  quote: "fas fa-quote-left",  // " quote icon
  zen: "fas fa-mountain",      // mountain icon
  custom: "fas fa-wrench",     // wrench icon
};

// 🎯 Reusable react-bootstrap tooltip wrapper
const Tip = ({
  label,
  placement = "bottom",
  children,
}: {
  label: string;
  placement?: "top" | "bottom";
  children: ReactElement;
}) => (
  <OverlayTrigger
    placement={placement}
    delay={{ show: 150, hide: 100 }}
    overlay={<Tooltip id={`tip-${label.replace(/\s+/g, "-")}`}>{label}</Tooltip>}
  >
    {children}
  </OverlayTrigger>
);

export default function Home() {
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" ? (localStorage.getItem("typeflow-mode") as Mode) || "time" : "time"
  );
  const [timeMode, setTimeMode] = useState<number>(() =>
    typeof window !== "undefined" ? parseInt(localStorage.getItem("typeflow-timeMode") || "30", 10) : 30
  );
  const [wordMode, setWordMode] = useState<number>(() =>
    typeof window !== "undefined" ? parseInt(localStorage.getItem("typeflow-wordMode") || "25", 10) : 25
  );
  const [quoteMode, setQuoteMode] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-quoteMode") || "all" : "all"
  );
  const [customTime, setCustomTime] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-customTime") || "" : ""
  );
  const [customWords, setCustomWords] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-customWords") || "" : ""
  );
  const [punctuation, setPunctuation] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-punctuation") === "true" : false
  );
  const [numbers, setNumbers] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-numbers") === "true" : false
  );
  const [sound, setSound] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("typeflow-sound") === "true" : false
  );
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [isTestFinished, setIsTestFinished] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string } | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentLetterIndex, setCurrentLetterIndex] = useState<number>(0);
  const [inputHistory, setInputHistory] = useState<string[][]>([]);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [timer, setTimer] = useState<number>(0);
  const [liveWpm, setLiveWpm] = useState<number>(0);
  const [contentVersion, setContentVersion] = useState<number>(0);
  const [savedTheme, setSavedTheme] = useState<string>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("typeflow-theme") || "serika dark"
      : "serika dark"
  );
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // The theme actually used for CSS variables
  const activeTheme = previewTheme ?? savedTheme;
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [themeSearch, setThemeSearch] = useState("");
  const [result, setResult] = useState<{
    wpm: number;
    rawWpm: number;
    accuracy: number;
    characters: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    time: number;
  } | null>(null);

  const testContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [translateY, setTranslateY] = useState<number>(0);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const inputHistoryRef = useRef<string[][]>([]);
  const wordsRef = useRef<string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    inputHistoryRef.current = inputHistory;
  }, [inputHistory]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const playKeySound = useCallback((correct: boolean) => {
    if (!sound) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = correct ? 800 : 300;
      osc.type = "sine";
      gain.gain.value = 0.05;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      osc.stop(ctx.currentTime + 0.05);
    } catch { }
  }, [sound]);

  const generateWords = useCallback((count: number): string[] => {
    const result: string[] = [];
    const pool = [...WORDS];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      let word = pool[idx];
      if (punctuation) {
        if (Math.random() < 0.15) {
          const punct = PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
          word = Math.random() < 0.5 ? punct + word : word + punct;
        }
      }
      if (numbers && Math.random() < 0.1) {
        const num = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
        word = num + word;
      }
      result.push(word);
    }
    return result;
  }, [punctuation, numbers]);

  const initTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTestActive(false);
    setIsTestFinished(false);
    setIsPaused(false);
    setTimer(0);
    setLiveWpm(0);
    setResult(null);
    setInputHistory([]);
    setCurrentInput("");
    setCurrentWordIndex(0);
    setCurrentLetterIndex(0);
    setContentVersion(prev => prev + 1);
    setTranslateY(0);
    wordRefs.current = [];

    if (mode === "time") {
      setWords(generateWords(100));
      setCurrentQuote(null);
    } else if (mode === "words") {
      const count = customWords ? parseInt(customWords) : wordMode;
      setWords(generateWords(count));
      setCurrentQuote(null);
    } else if (mode === "quote") {
      let filtered = [...QUOTES];
      if (quoteMode === "short") filtered = filtered.filter(q => q.text.length < 80);
      else if (quoteMode === "medium") filtered = filtered.filter(q => q.text.length >= 80 && q.text.length < 150);
      else if (quoteMode === "long") filtered = filtered.filter(q => q.text.length >= 150);
      const q = filtered[Math.floor(Math.random() * filtered.length)];
      setCurrentQuote({ text: q.text, author: q.author });
      setWords([]);
    } else if (mode === "zen") {
      setWords(generateWords(100));
      setCurrentQuote(null);
    } else if (mode === "custom") {
      setWords(generateWords(100));
      setCurrentQuote(null);
    }
  }, [mode, timeMode, wordMode, quoteMode, customTime, customWords, generateWords]);

  useEffect(() => {
    initTest();
  }, [mode, timeMode, wordMode, quoteMode, customTime, customWords, punctuation, numbers]);

  const finishTest = useCallback(() => {
    setIsTestActive(false);
    setIsTestFinished(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let missedChars = 0;
    let totalChars = 0;

    inputHistoryRef.current.forEach((history, wordIdx) => {
      const targetWord = wordsRef.current[wordIdx] || "";
      const targetLetters = targetWord.split("");
      const inputLetters = history;

      targetLetters.forEach((letter, letterIdx) => {
        if (letterIdx < inputLetters.length) {
          if (inputLetters[letterIdx] === letter) correctChars++;
          else incorrectChars++;
          totalChars++;
        } else {
          missedChars++;
        }
      });

      for (let i = targetLetters.length; i < inputLetters.length; i++) {
        extraChars++;
        totalChars++;
      }
    });

    const timeMinutes = timer / 60 || (customTime ? parseInt(customTime) / 60 : timeMode / 60);
    const rawWpm = totalChars > 0 ? Math.round((totalChars / 5) / timeMinutes) : 0;
    const wpm = correctChars > 0 ? Math.round((correctChars / 5) / timeMinutes) : 0;
    const accuracy = totalChars > 0 ? Math.round(((correctChars / totalChars) * 100) * 10) / 10 : 0;

    setResult({ wpm, rawWpm, accuracy, characters: totalChars, correctChars, incorrectChars, extraChars, missedChars, time: timer });
  }, [timer, customTime, timeMode]);

  useEffect(() => {
    if (isTestActive && mode === "time") {
      const targetTime = customTime ? parseInt(customTime) : timeMode;
      if (!isNaN(targetTime) && targetTime > 0 && timer >= targetTime) {
        finishTest();
      }
    }
  }, [timer, isTestActive, mode, timeMode, customTime, finishTest]);

  const startTest = useCallback(() => {
    if (timerRef.current) return;
    if (isTestFinished) return;
    setIsTestActive(true);
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTime = prev + 1;
        let correctCount = 0;
        inputHistoryRef.current.forEach((word, wordIdx) => {
          const targetWord = wordsRef.current[wordIdx] || "";
          for (let i = 0; i < word.length; i++) {
            if (word[i] === targetWord[i]) correctCount++;
          }
        });
        const wpm = Math.round((correctCount / 5) / (newTime / 60 || 0.01));
        setLiveWpm(wpm);
        return newTime;
      });
    }, 1000);
  }, [isTestFinished]);

  const pauseTest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
  }, []);

  const resumeTest = useCallback(() => {
    if (isTestFinished) return;
    setIsPaused(false);
    startTest();
  }, [isTestFinished, startTest]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Restart the test with Escape at any time
    if (e.key === "Escape") {
      const target = e.target as HTMLElement;
      // If the user is typing inside the "custom" input box, just exit the input instead of restarting
      if (target.tagName === "INPUT") {
        target.blur();
        return;
      }
      e.preventDefault();
      initTest();
      return;
    }

    if (isTestFinished) {
      return;
    }

    if (isPaused) {
      // If a non-typing key (like Shift, F5, etc.) is pressed while paused, ignore it
      if (!(e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        return;
      }
      resumeTest();
      // ⚠️ No "return" here! We fall through so this same keypress also gets typed.
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (!isTestActive && e.key.length === 1 && !e.repeat) {
      startTest();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      initTest();
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      if (currentInput.length > 0 || inputHistory[currentWordIndex]?.length) {
        const newHistory = [...inputHistory];
        newHistory[currentWordIndex] = currentInput.split("");
        setInputHistory(newHistory);

        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
          setCurrentLetterIndex(0);
          setCurrentInput("");
        } else {
          if (mode === "time" || mode === "words" || mode === "custom") {
            finishTest();
          }
        }
      }
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1));
        setCurrentLetterIndex(prev => Math.max(0, prev - 1));
      } else if (currentWordIndex > 0) {
        setCurrentWordIndex(prev => prev - 1);
        setCurrentLetterIndex(0);
        setCurrentInput(inputHistory[currentWordIndex - 1]?.join("") || "");
        const newHistory = [...inputHistory];
        newHistory[currentWordIndex - 1] = [];
        setInputHistory(newHistory);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const targetLetter = words[currentWordIndex]?.[currentLetterIndex];
      const isCorrect = currentInput.length < (words[currentWordIndex]?.length || 0)
        ? e.key === targetLetter
        : false;
      playKeySound(isCorrect);
      setCurrentInput(prev => prev + e.key);
      setCurrentLetterIndex(prev => prev + 1);
    }
  }, [isTestFinished, isPaused, isTestActive, currentInput, inputHistory, currentWordIndex, words, mode, startTest, finishTest, initTest, resumeTest, playKeySound, showThemeModal]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleBlur = () => {
      if (isTestActive && !isTestFinished && !isPaused) {
        pauseTest();
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isTestActive, isTestFinished, isPaused, pauseTest]);

  useEffect(() => {
    const handleMouseMove = () => {
      // Only pause if the test is active, not finished, and not already paused
      if (isTestActive && !isTestFinished && !isPaused) {
        pauseTest();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isTestActive, isTestFinished, isPaused, pauseTest]);

  const getLetterClass = (wordIdx: number, letterIdx: number, letter: string, targetWord?: string): string => {
    const target = targetWord ?? words[wordIdx] ?? "";
    if (isTestFinished) {
      const inputWord = inputHistory[wordIdx] || [];
      if (letterIdx < inputWord.length) {
        return inputWord[letterIdx] === letter ? "correct" : "incorrect";
      }
      return "";
    }

    if (wordIdx < currentWordIndex) {
      const inputWord = inputHistory[wordIdx] || [];
      if (letterIdx < inputWord.length) {
        return inputWord[letterIdx] === letter ? "correct" : "incorrect";
      }
      return "";
    }

    if (wordIdx === currentWordIndex) {
      if (letterIdx < currentInput.length) {
        return currentInput[letterIdx] === letter ? "correct" : "incorrect";
      }
      if (letterIdx === currentInput.length) {
        return "active";
      }
    }

    return "";
  };

  const calculateLineShift = useCallback(() => {
    if (mode === "quote" || isTestFinished) return;

    const currentWordEl = wordRefs.current[currentWordIndex];
    const firstWordEl = wordRefs.current[0];

    if (!currentWordEl || !firstWordEl) return;

    const computedStyle = window.getComputedStyle(currentWordEl);
    let lineHeightPx = parseFloat(computedStyle.lineHeight);
    if (isNaN(lineHeightPx)) lineHeightPx = 56; // Fallback to 3.5rem (56px)

    // Calculate which line index (0, 1, 2, 3...) the current word is on
    const lineIndex = Math.round((currentWordEl.offsetTop - firstWordEl.offsetTop) / lineHeightPx);

    // If it's on the 3rd line (index 2) or below, shift the container up
    if (lineIndex >= 2) {
      const shiftLines = lineIndex - 1; // Keep it on the middle visual line
      setTranslateY(shiftLines * 3.5); // 3.5rem per line
    } else {
      setTranslateY(0);
    }
  }, [currentWordIndex, mode, isTestFinished]);

  useEffect(() => {
    calculateLineShift();
  }, [calculateLineShift]);

  useEffect(() => {
    window.addEventListener("resize", calculateLineShift);
    return () => window.removeEventListener("resize", calculateLineShift);
  }, [calculateLineShift]);

  // page.tsx

  useEffect(() => {
    const t = THEMES.find(x => x.name === activeTheme) ?? THEMES[0];
    const s = document.documentElement.style;
    s.setProperty("--tf-bg", t.bg);
    s.setProperty("--tf-sub-alt", t.subAlt);
    s.setProperty("--tf-sub", t.sub);
    s.setProperty("--tf-main", t.main);
    s.setProperty("--tf-caret", t.caret);
    s.setProperty("--tf-error", t.error);
    s.setProperty("--tf-error-extra", t.errorExtra);
    s.setProperty("--tf-line", t.line);

    // ✅ IMPROVED FAVICON UPDATE
    const updateFavicon = () => {
      // ✅ ADDED: A subtle glow filter to make the text pop and look less flat/dull
      const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${t.caret}" flood-opacity="0.5"/>
        </filter>
      </defs>
      <rect width="64" height="64" rx="14" fill="${t.bg}"/>
      <text x="32" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="48" fill="${t.caret}" text-anchor="middle" filter="url(#glow)">tf</text>
    </svg>
  `;

      const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;

      const oldLink = document.querySelector("link[rel*='icon']");
      if (oldLink) {
        oldLink.remove();
      }

      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.type = 'image/svg+xml';
      newLink.href = dataUri;
      document.head.appendChild(newLink);
    };

    updateFavicon();
  }, [activeTheme]);

  // 💾 Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("typeflow-mode", mode);
      localStorage.setItem("typeflow-timeMode", timeMode.toString());
      localStorage.setItem("typeflow-wordMode", wordMode.toString());
      localStorage.setItem("typeflow-quoteMode", quoteMode);
      localStorage.setItem("typeflow-customTime", customTime);
      localStorage.setItem("typeflow-customWords", customWords);
      localStorage.setItem("typeflow-punctuation", punctuation.toString());
      localStorage.setItem("typeflow-numbers", numbers.toString());
      localStorage.setItem("typeflow-sound", sound.toString());
    }
  }, [mode, timeMode, wordMode, quoteMode, customTime, customWords, punctuation, numbers, sound]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("typeflow-theme", savedTheme);
    }
  }, [savedTheme]);

  const isExtraLetter = (wordIdx: number, letterIdx: number, targetWord?: string): boolean => {
    if (wordIdx !== currentWordIndex) return false;
    const target = targetWord ?? words[wordIdx] ?? "";
    const inputWord = inputHistory[wordIdx] || [];
    const allInput = [...inputWord, ...currentInput.split("")];
    if (letterIdx >= target.length && letterIdx < allInput.length) {
      return true;
    }
    return false;
  };

  const handleRestart = () => {
    initTest();
  };

  // The total time for the test (preset or custom)
  const targetTime = customTime ? parseInt(customTime) || 0 : timeMode;

  // Formats seconds into "m:ss" like monkeytype (e.g. 37:06)
  const formatTime = (totalSeconds: number): string => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const visibleWords = mode === "quote" && currentQuote ? currentQuote.text.split(" ") : words;
  const startWordIndex = Math.max(0, currentWordIndex - 5);
  const endWordIndex = Math.min(visibleWords.length, startWordIndex + 20);

  return (
    <>
      <main className="min-h-screen flex flex-col bg-bg text-sub relative">

        {/* 1. TOP HEADER — pinned to top, out of layout flow */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <header className="mb-10 text-sub text-sm font-medium w-full">

              {/* ROW 1: LOGO — pinned top-left, exactly like monkeytype */}
              <Tip label="Restart test (or press Tab)" placement="bottom">
                <div
                  className="flex items-center gap-3 cursor-pointer group select-none w-fit mb-8"
                  onClick={initTest}
                >
                  {/* 🎹 KEYBOARD SVG */}
                  <svg width="45" height="32" viewBox="0 0 80 60" className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-md">
                    {/* Keyboard Base (Chassis) */}
                    <rect x="1" y="6" width="78" height="48" rx="4" fill="var(--tf-sub-alt)" stroke="var(--tf-sub)" strokeWidth="1.5" />

                    {/* Row 1 (Top) */}
                    <rect x="4" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="16" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="28" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="40" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="52" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="64" y="12" width="10" height="7" rx="1.5" fill="var(--tf-line)" />

                    {/* Row 2 (Middle - 't' and 'F' keys) */}
                    <rect x="6" y="21" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="14" y="21" width="10" height="7" rx="1.5" fill="var(--tf-caret)" />
                    <text x="19" y="27" fontFamily="system-ui, sans-serif" fontSize="5.5" fontWeight="800" fill="var(--tf-bg)" textAnchor="middle">t</text>
                    <rect x="30" y="21" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="46" y="21" width="10" height="7" rx="1.5" fill="var(--tf-main)" />
                    <text x="51" y="27" fontFamily="system-ui, sans-serif" fontSize="5.5" fontWeight="800" fill="var(--tf-bg)" textAnchor="middle">F</text>
                    <rect x="62" y="21" width="10" height="7" rx="1.5" fill="var(--tf-line)" />

                    {/* Row 3 (Bottom) */}
                    <rect x="8" y="30" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="20" y="30" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="32" y="30" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="44" y="30" width="10" height="7" rx="1.5" fill="var(--tf-line)" />
                    <rect x="56" y="30" width="10" height="7" rx="1.5" fill="var(--tf-line)" />

                    {/* Row 4 (Spacebar) */}
                    <rect x="20" y="39" width="40" height="7" rx="2" fill="var(--tf-line)" />
                  </svg>

                  {/* TEXT BLOCK: tagline above the name, exactly like "monkey see" above "monkeytype" */}
                  <div className="flex flex-col">
                    <span className="text-xs text-sub leading-none ms-2 tracking-wide">type in flow</span>
                    <span className="text-4xl font-bold text-main tracking-wider leading-none">typeflow</span>
                  </div>
                </div>
              </Tip>

              {/* ROW 2: CONFIG WIDGETS — centered on their own line, exactly like monkeytype */}
              <div className="flex items-center gap-4 flex-wrap justify-center">

                {/* LEFT: Punctuation & Numbers */}
                <div className="flex gap-4 items-center bg-sub-alt rounded-lg px-5 py-2.5">
                  <Tip label="Toggle punctuation">
                    <button onClick={() => setPunctuation(!punctuation)} className={`flex items-center gap-2 hover:text-main transition-colors ${punctuation ? "text-caret" : ""}`}>
                      <i className="fas fa-at"></i>
                      <span className="hidden sm:inline">punctuation</span>
                    </button>
                  </Tip>
                  <Tip label="Toggle numbers">
                    <button onClick={() => setNumbers(!numbers)} className={`flex items-center gap-2 hover:text-main transition-colors ${numbers ? "text-caret" : ""}`}>
                      <i className="fas fa-hashtag"></i>
                      <span className="hidden sm:inline">numbers</span>
                    </button>
                  </Tip>
                </div>

                {/* MIDDLE: Modes */}
                <nav className="flex gap-4 items-center bg-sub-alt rounded-lg px-5 py-2.5">
                  {(["time", "words", "quote", "zen", "custom"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex items-center gap-2 hover:text-main transition-colors ${mode === m ? "text-caret" : ""}`}
                    >
                      <i className={`${MODE_ICONS[m]} text-[13px]`} aria-hidden="true"></i>
                      {m}
                    </button>
                  ))}
                </nav>

                {/* RIGHT: Time/Word Options & Custom Input */}
                <div className="flex gap-4 items-center bg-sub-alt rounded-lg px-5 py-2.5">
                  {mode === "time" && (
                    <>
                      {TIME_OPTIONS.map((t) => (
                        <button key={t} onClick={() => { setTimeMode(t); setCustomTime(""); }} className={`hover:text-main transition-colors ${timeMode === t && !customTime ? "text-caret" : ""}`}>{t}</button>
                      ))}
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-50"><i className="fas fa-tools"></i></span>
                        <input type="number" value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="custom" className="w-14 bg-transparent border-b border-line focus:border-caret focus:outline-none transition-colors text-right" />
                      </div>
                    </>
                  )}
                  {mode === "words" && (
                    <>
                      {WORD_OPTIONS.map((w) => (
                        <button key={w} onClick={() => { setWordMode(w); setCustomWords(""); }} className={`hover:text-main transition-colors ${wordMode === w && !customWords ? "text-caret" : ""}`}>{w}</button>
                      ))}
                      <div className="flex items-center gap-1">
                        <span className="text-xs opacity-50">⚙️</span>
                        <input type="number" value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="custom" className="w-14 bg-transparent border-b border-line focus:border-caret focus:outline-none transition-colors text-right" />
                      </div>
                    </>
                  )}
                  {mode === "quote" && (
                    <>
                      {QUOTE_OPTIONS.map((q) => (
                        <button key={q} onClick={() => setQuoteMode(q)} className={`hover:text-main transition-colors ${quoteMode === q ? "text-caret" : ""}`}>{q}</button>
                      ))}
                    </>
                  )}
                </div>

                {/* FAR RIGHT: Sound */}
                <div className="flex items-center gap-3 bg-sub-alt rounded-lg px-4 py-2.5">
                  <Tip label="Toggle sound">
                    <button onClick={() => setSound(!sound)} className={`hover:text-main transition-colors ${sound ? "text-caret" : ""}`}>
                      <i className={`fas ${sound ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
                    </button>
                  </Tip>
                </div>

              </div>
            </header>
          </div>
        </div>

        {/* 2. MIDDLE TEST AREA (flex-1 pushes this to the exact vertical center) */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full px-6 md:px-[8vw] relative -translate-y-[4vh]">
            {/* LIVE COUNTDOWN TIMER (monkeytype style, top-left of the words) */}
            {mode === "time" && targetTime > 0 && (
              <div
                className={`absolute left-6 md:left-[8vw] -top-12 text-caret font-mono text-3xl select-none transition-all duration-300 ease-out ${isTestActive && !isPaused
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
                  }`}
              >
                {formatTime(Math.max(0, targetTime - timer))}
              </div>
            )}
            <div id="test" className="mx-auto select-none">

              {!isTestFinished && mode === "quote" && currentQuote ? (
                <div className="text-center">
                  <div className="text-xl mb-4 text-main">
                    {currentQuote.text.split("").map((letter, idx) => {
                      let letterClass = "";
                      if (idx < currentInput.length) letterClass = currentInput[idx] === letter ? "correct" : "incorrect";
                      else if (idx === currentInput.length) letterClass = "active";
                      return <span key={idx} className={`letter ${letterClass}`}>{letter === " " ? "\u00A0" : letter}</span>;
                    })}
                  </div>
                  <div className="text-sm text-sub">— {currentQuote.author}</div>
                </div>
              ) : !isTestFinished && visibleWords.length > 0 ? (
                /* --- NEW 3-LINE WRAPPER LOGIC --- */
                <div id="test-wrapper">
                  <div
                    id="test-inner"
                    key={`text-${contentVersion}`}
                    className="words-fade"
                    style={{ transform: `translateY(-${translateY}rem)` }}
                  >
                    {visibleWords.map((word, idx) => (
                      <span
                        key={idx}
                        className="word"
                        ref={el => { if (el) wordRefs.current[idx] = el; }}
                      >
                        {word.split("").map((letter, letterIdx) => (
                          <span
                            key={letterIdx}
                            className={`letter ${getLetterClass(idx, letterIdx, letter, word)} ${isExtraLetter(idx, letterIdx, word) ? "extra" : ""}`}
                          >
                            {letter}
                          </span>
                        ))}
                      </span>
                    ))}
                  </div>
                </div>
              ) : isTestFinished && result ? (
                <div id="result" className="text-center py-12">
                  <div className="text-6xl font-bold mb-2 text-caret">{result.wpm}</div>
                  <div className="text-lg text-sub mb-8">wpm</div>
                  <div className="flex justify-center gap-2 mb-8">
                    <div className="stat"><div className="stat-value text-caret">{result.rawWpm}</div><div className="stat-label">raw</div></div>
                    <div className="stat"><div className="stat-value text-caret">{result.accuracy}%</div><div className="stat-label">accuracy</div></div>
                    <div className="stat"><div className="stat-value text-caret">{result.characters}</div><div className="stat-label">chars</div></div>
                    <div className="stat"><div className="stat-value text-caret">{result.correctChars}</div><div className="stat-label">correct</div></div>
                    <div className="stat"><div className="stat-value text-caret">{result.incorrectChars}</div><div className="stat-label">incorrect</div></div>
                  </div>
                  <div className="flex justify-center gap-4 text-sm text-sub">
                    <div><span className="text-caret">+</span> {result.extraChars} extra</div>
                    <div><span className="text-caret">-</span> {result.missedChars} missed</div>
                    <div>time: <span className="text-caret">{result.time}s</span></div>
                  </div>
                  <button onClick={handleRestart} className="mt-8 px-6 py-2 bg-caret text-bg rounded-md font-medium hover:opacity-90 transition-colors shadow-sm">restart</button>
                </div>
              ) : (
                <div className="text-center text-sub text-xl">Start typing to begin the test</div>
              )}
            </div>
          </div>
        </div>

        {/* 3. BOTTOM STATS — pinned to bottom, out of layout flow */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="w-full px-6 md:px-[8vw] pb-6">

            {/* KEYBOARD HINTS (exactly like monkeytype) */}
            <div className="flex flex-col items-center gap-2 mb-8 text-xs text-sub">
              <div className="flex items-center gap-2">
                <kbd className="key-hint">escape or tab</kbd>
                <span>- restart test</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6 text-sm text-sub">
              <div>
                {isTestActive && !isPaused && mode === "words" && (
                  <span>{currentWordIndex} / {words.length}</span>
                )}
              </div>
              <div>
                {isTestActive && !isPaused && liveWpm > 0 && (
                  <span className="text-caret font-medium">{liveWpm} wpm</span>
                )}
              </div>
            </div>
            <div className="flex justify-end items-center gap-2 mt-3 text-xs text-sub">
              <i className="fas fa-palette text-caret"></i>
              <button onClick={() => setShowThemeModal(true)} className="hover:text-main transition-colors">
                {savedTheme}
              </button>
            </div>
          </div>
        </div>
      </main>
      {/* THEME SWITCHER MODAL */}
      {showThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50"
          onClick={() => { setShowThemeModal(false); setPreviewTheme(null); }}
        >
          <div
            className="w-full max-w-2xl mx-4 bg-sub-alt rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <i className="fas fa-magnifying-glass text-sub"></i>
              <input
                autoFocus
                value={themeSearch}
                onChange={(e) => setThemeSearch(e.target.value)}
                placeholder="Theme..."
                className="flex-1 bg-transparent text-main placeholder:text-sub font-mono text-sm focus:outline-none"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto pb-2">
              {THEMES.filter((t) => t.name.toLowerCase().includes(themeSearch.toLowerCase())).map((t) => (
                <button
                  key={t.name}
                  onMouseEnter={() => setPreviewTheme(t.name)} // 🔥 Preview on hover
                  onMouseLeave={() => setPreviewTheme(null)}    // 🔥 Revert if mouse leaves
                  onClick={() => {
                    setSavedTheme(t.name);    // 💾 Save permanently
                    setPreviewTheme(null);    // Clear preview
                    setShowThemeModal(false); // Close modal
                  }}
                  className={`w-full flex items-center justify-between px-5 py-2.5 font-mono text-sm transition-colors ${savedTheme === t.name ? "bg-main text-bg" : "text-sub hover:text-main hover:bg-line/30"}`}
                >
                  <span className="flex items-center gap-3">
                    {activeTheme === t.name && <i className="fas fa-check"></i>}
                    {t.name}
                  </span>
                  <span className="flex gap-1.5">
                    <span className="w-4 h-4 rounded-full" style={{ background: t.caret }} />
                    <span className="w-4 h-4 rounded-full" style={{ background: t.sub }} />
                    <span className="w-4 h-4 rounded-full" style={{ background: t.main }} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
