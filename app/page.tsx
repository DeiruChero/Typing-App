"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WORDS, QUOTES, PUNCTUATION, NUMBERS } from "@/data/words";

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

export default function Home() {
  const [mode, setMode] = useState<Mode>("time");
  const [timeMode, setTimeMode] = useState<number>(30);
  const [wordMode, setWordMode] = useState<number>(25);
  const [quoteMode, setQuoteMode] = useState<string>("all");
  const [customTime, setCustomTime] = useState<string>("");
  const [customWords, setCustomWords] = useState<string>("");
  const [punctuation, setPunctuation] = useState<boolean>(false);
  const [numbers, setNumbers] = useState<boolean>(false);
  const [sound, setSound] = useState<boolean>(false);
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

  useEffect(() => {
    if (isTestActive && mode === "time" && !customTime) {
      if (timer >= timeMode) finishTest();
    }
  }, [timer, isTestActive, mode, timeMode, customTime]);

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
    if (isTestFinished) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        initTest();
      }
      return;
    }

    if (isPaused) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        resumeTest();
      }
      return;
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
  }, [isTestFinished, isPaused, isTestActive, currentInput, inputHistory, currentWordIndex, words, mode, startTest, finishTest, initTest, resumeTest, playKeySound]);

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

    // If it's on the 4th line (index 3) or below, shift the container up
    if (lineIndex >= 3) {
      const shiftLines = lineIndex - 2; // Keep it on the 3rd visual line
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

  const visibleWords = mode === "quote" && currentQuote ? currentQuote.text.split(" ") : words;
  const startWordIndex = Math.max(0, currentWordIndex - 5);
  const endWordIndex = Math.min(visibleWords.length, startWordIndex + 20);

  return (
    <main className="min-h-screen flex flex-col bg-[#323437] text-[#d1d1d1]">

      {/* 1. TOP HEADER */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-6">
        <header className="flex justify-center items-center mb-10 text-[#646566] text-sm font-medium">
          <div className="flex items-center gap-4 flex-wrap justify-center">

            {/* LEFT: Punctuation & Numbers */}
            <div className="flex gap-6 items-center bg-[#2c2e31] rounded-lg px-6 py-3">
              <button onClick={() => setPunctuation(!punctuation)} className={`flex items-center gap-2 hover:text-[#d1d1d1] transition-colors ${punctuation ? "text-[#e2b714]" : ""}`} title="Toggle punctuation">
                <i className="fas fa-at"></i>
                <span className="hidden sm:inline">punctuation</span>
              </button>
              <button onClick={() => setNumbers(!numbers)} className={`flex items-center gap-2 hover:text-[#d1d1d1] transition-colors ${numbers ? "text-[#e2b714]" : ""}`} title="Toggle numbers">
                <i className="fas fa-hashtag"></i>
                <span className="hidden sm:inline">numbers</span>
              </button>
            </div>

            {/* MIDDLE: Modes */}
            <nav className="flex gap-6 items-center bg-[#2c2e31] rounded-lg px-6 py-3">
              {(["time", "words", "quote", "zen", "custom"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-2 hover:text-[#d1d1d1] transition-colors ${mode === m ? "text-[#e2b714]" : ""
                    }`}
                >
                  <i className={`${MODE_ICONS[m]} text-[13px]`} aria-hidden="true"></i>
                  {m}
                </button>
              ))}
            </nav>

            {/* RIGHT: Time/Word Options & Custom Input */}
            <div className="flex gap-5 items-center bg-[#2c2e31] rounded-lg px-6 py-3">
              {mode === "time" && (
                <>
                  {TIME_OPTIONS.map((t) => (
                    <button key={t} onClick={() => { setTimeMode(t); setCustomTime(""); }} className={`hover:text-[#d1d1d1] transition-colors ${timeMode === t && !customTime ? "text-[#e2b714]" : ""}`}>{t}</button>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="text-xs opacity-50">⚙️</span>
                    <input type="number" value={customTime} onChange={(e) => setCustomTime(e.target.value)} placeholder="custom" className="w-16 bg-transparent border-b border-[#4a4b4e] focus:border-[#e2b714] focus:outline-none transition-colors text-right" />
                  </div>
                </>
              )}
              {mode === "words" && (
                <>
                  {WORD_OPTIONS.map((w) => (
                    <button key={w} onClick={() => { setWordMode(w); setCustomWords(""); }} className={`hover:text-[#d1d1d1] transition-colors ${wordMode === w && !customWords ? "text-[#e2b714]" : ""}`}>{w}</button>
                  ))}
                  <div className="flex items-center gap-1">
                    <span className="text-xs opacity-50">⚙️</span>
                    <input type="number" value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="custom" className="w-16 bg-transparent border-b border-[#4a4b4e] focus:border-[#e2b714] focus:outline-none transition-colors text-right" />
                  </div>
                </>
              )}
              {mode === "quote" && (
                <>
                  {QUOTE_OPTIONS.map((q) => (
                    <button key={q} onClick={() => setQuoteMode(q)} className={`hover:text-[#d1d1d1] transition-colors ${quoteMode === q ? "text-[#e2b714]" : ""}`}>{q}</button>
                  ))}
                </>
              )}
            </div>

            {/* FAR RIGHT: Sound */}
            <div className="flex items-center gap-4 bg-[#2c2e31] rounded-lg px-4 py-3">
              <button onClick={() => setSound(!sound)} className={`hover:text-[#d1d1d1] transition-colors ${sound ? "text-[#e2b714]" : ""}`} title="Toggle sound">
                <i className={`fas ${sound ? "fa-volume-high" : "fa-volume-xmark"}`}></i>
              </button>
            </div>

          </div>
        </header>
      </div>

      {/* 2. MIDDLE TEST AREA (flex-1 pushes this to the exact vertical center) */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full px-6 md:px-[8vw] relative">
          <div id="test" className="mx-auto select-none">

            {!isTestFinished && mode === "quote" && currentQuote ? (
              <div className="text-center">
                <div className="text-xl mb-4 text-[#d1d1d1]">
                  {currentQuote.text.split("").map((letter, idx) => {
                    let letterClass = "";
                    if (idx < currentInput.length) letterClass = currentInput[idx] === letter ? "correct" : "incorrect";
                    else if (idx === currentInput.length) letterClass = "active";
                    return <span key={idx} className={`letter ${letterClass}`}>{letter === " " ? "\u00A0" : letter}</span>;
                  })}
                </div>
                <div className="text-sm text-[#646566]">— {currentQuote.author}</div>
              </div>
            ) : !isTestFinished && visibleWords.length > 0 ? (
              /* --- NEW 3-LINE WRAPPER LOGIC --- */
              <div id="test-wrapper">
                <div id="test-inner" style={{ transform: `translateY(-${translateY}rem)` }}>
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
                <div className="text-6xl font-bold mb-2 text-[#e2b714]">{result.wpm}</div>
                <div className="text-lg text-[#646566] mb-8">wpm</div>
                <div className="flex justify-center gap-2 mb-8">
                  <div className="stat"><div className="stat-value text-[#e2b714]">{result.rawWpm}</div><div className="stat-label">raw</div></div>
                  <div className="stat"><div className="stat-value text-[#e2b714]">{result.accuracy}%</div><div className="stat-label">accuracy</div></div>
                  <div className="stat"><div className="stat-value text-[#e2b714]">{result.characters}</div><div className="stat-label">chars</div></div>
                  <div className="stat"><div className="stat-value text-[#e2b714]">{result.correctChars}</div><div className="stat-label">correct</div></div>
                  <div className="stat"><div className="stat-value text-[#e2b714]">{result.incorrectChars}</div><div className="stat-label">incorrect</div></div>
                </div>
                <div className="flex justify-center gap-4 text-sm text-[#646566]">
                  <div><span className="text-[#e2b714]">+</span> {result.extraChars} extra</div>
                  <div><span className="text-[#e2b714]">-</span> {result.missedChars} missed</div>
                  <div>time: <span className="text-[#e2b714]">{result.time}s</span></div>
                </div>
                <button onClick={handleRestart} className="mt-8 px-6 py-2 bg-[#e2b714] text-[#323437] rounded-md font-medium hover:bg-[#d4a813] transition-colors shadow-sm">restart</button>
              </div>
            ) : (
              <div className="text-center text-[#646566] text-xl">Start typing to begin the test</div>
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM STATS */}
      <div className="w-full px-6 md:px-[8vw] pb-6">
        <div className="flex justify-between items-center mt-6 text-sm text-[#646566]">
          <div>
            {isTestActive && !isPaused && mode === "time" && (
              <span>{customTime ? `${timer} / ${customTime}` : `${timer} / ${timeMode}`}</span>
            )}
            {isTestActive && !isPaused && mode === "words" && (
              <span>{currentWordIndex} / {words.length}</span>
            )}
          </div>
          <div>
            {isTestActive && !isPaused && liveWpm > 0 && (
              <span className="text-[#e2b714] font-medium">{liveWpm} wpm</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
