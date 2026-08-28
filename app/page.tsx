"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WORDS, QUOTES, PUNCTUATION, NUMBERS } from "@/data/words";

type Mode = "time" | "words" | "quote" | "zen" | "custom";

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];
const QUOTE_OPTIONS = ["short", "medium", "long", "all"];

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
    } catch {}
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
    const el = testContainerRef.current;
    if (!el) return;

    const handleMouseLeave = () => {
      if (isTestActive && !isTestFinished && !isPaused) {
        pauseTest();
      }
    };

    const handleMouseEnter = () => {
      if (isPaused && isTestActive && !isTestFinished) {
        resumeTest();
      }
    };

    el.addEventListener("mouseleave", handleMouseLeave);
    el.addEventListener("mouseenter", handleMouseEnter);
    return () => {
      el.removeEventListener("mouseleave", handleMouseLeave);
      el.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isTestActive, isTestFinished, isPaused, pauseTest, resumeTest]);

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
    <main className="min-h-screen flex flex-col items-center bg-[#323437] text-[#d1d1d1]">
      <div className="w-full max-w-5xl px-4 py-6">
        <header className="flex justify-between items-start mb-8">
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-xs text-[#646566] uppercase tracking-wider mb-1">punctuation</div>
              <button
                onClick={() => setPunctuation(!punctuation)}
                className={`w-12 h-6 rounded-full transition-all duration-200 ${
                  punctuation ? "bg-[#e2b714] shadow-[0_0_8px_rgba(226,183,20,0.4)]" : "bg-[#3c3e41]"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                  punctuation ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#646566] uppercase tracking-wider mb-1">numbers</div>
              <button
                onClick={() => setNumbers(!numbers)}
                className={`w-12 h-6 rounded-full transition-all duration-200 ${
                  numbers ? "bg-[#e2b714] shadow-[0_0_8px_rgba(226,183,20,0.4)]" : "bg-[#3c3e41]"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                  numbers ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>

          <nav className="flex gap-1 bg-[#2c2e31] p-1 rounded-lg">
            {(["time", "words", "quote", "zen", "custom"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-[#e2b714] text-[#323437] shadow-sm"
                    : "text-[#646566] hover:text-[#d1d1d1]"
                }`}
              >
                {m}
              </button>
            ))}
          </nav>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSound(!sound)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                sound
                  ? "bg-[#e2b714] text-[#323437]"
                  : "text-[#646566] hover:text-[#d1d1d1]"
              }`}
              title="Toggle sound"
            >
              {sound ? "🔊" : "🔇"}
            </button>
            {mode === "time" && (
              <>
                {TIME_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTimeMode(t); setCustomTime(""); }}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      timeMode === t && !customTime
                        ? "bg-[#e2b714] text-[#323437] shadow-sm"
                        : "text-[#646566] hover:text-[#d1d1d1]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <input
                  type="number"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="custom"
                  className="w-16 px-2 py-1.5 rounded-md text-sm bg-[#2c2e31] text-[#d1d1d1] border border-[#3c3e41] focus:outline-none focus:border-[#e2b714] transition-colors"
                />
              </>
            )}
            {mode === "words" && (
              <>
                {WORD_OPTIONS.map(w => (
                  <button
                    key={w}
                    onClick={() => { setWordMode(w); setCustomWords(""); }}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      wordMode === w && !customWords
                        ? "bg-[#e2b714] text-[#323437] shadow-sm"
                        : "text-[#646566] hover:text-[#d1d1d1]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
                <input
                  type="number"
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  placeholder="custom"
                  className="w-16 px-2 py-1.5 rounded-md text-sm bg-[#2c2e31] text-[#d1d1d1] border border-[#3c3e41] focus:outline-none focus:border-[#e2b714] transition-colors"
                />
              </>
            )}
            {mode === "quote" && (
              <>
                {QUOTE_OPTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setQuoteMode(q)}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all duration-200 ${
                      quoteMode === q
                        ? "bg-[#e2b714] text-[#323437] shadow-sm"
                        : "text-[#646566] hover:text-[#d1d1d1]"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </>
            )}
          </div>
        </header>

        <div className="relative">
          <div
            id="test"
            className="mx-auto text-2xl leading-relaxed font-mono select-none"
          >
            {!isTestFinished && mode === "quote" && currentQuote ? (
              <div className="text-center">
                <div className="text-xl mb-4 text-[#d1d1d1]">
                  {currentQuote.text.split("").map((letter, idx) => {
                    let letterClass = "";
                    if (idx < currentInput.length) {
                      letterClass = currentInput[idx] === letter ? "correct" : "incorrect";
                    } else if (idx === currentInput.length) {
                      letterClass = "active";
                    }
                    return (
                      <span key={idx} className={`letter ${letterClass}`}>
                        {letter === " " ? "\u00A0" : letter}
                      </span>
                    );
                  })}
                </div>
                <div className="text-sm text-[#646566]">— {currentQuote.author}</div>
              </div>
            ) : !isTestFinished && visibleWords.length > 0 ? (
              <div>
                {visibleWords.slice(startWordIndex, endWordIndex).map((word, idx) => {
                  const actualIdx = startWordIndex + idx;
                  return (
                    <span key={actualIdx} className="word">
                      {word.split("").map((letter, letterIdx) => (
                        <span
                          key={letterIdx}
                          className={`letter ${getLetterClass(actualIdx, letterIdx, letter, word)} ${isExtraLetter(actualIdx, letterIdx, word) ? "extra" : ""}`}
                        >
                          {letter}
                        </span>
                      ))}
                    </span>
                  );
                })}
              </div>
            ) : isTestFinished && result ? (
              <div id="result" className="text-center py-12">
                <div className="text-6xl font-bold mb-2 text-[#e2b714]">{result.wpm}</div>
                <div className="text-lg text-[#646566] mb-8">wpm</div>
                <div className="flex justify-center gap-2 mb-8">
                  <div className="stat">
                    <div className="stat-value text-[#e2b714]">{result.rawWpm}</div>
                    <div className="stat-label">raw</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value text-[#e2b714]">{result.accuracy}%</div>
                    <div className="stat-label">accuracy</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value text-[#e2b714]">{result.characters}</div>
                    <div className="stat-label">chars</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value text-[#e2b714]">{result.correctChars}</div>
                    <div className="stat-label">correct</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value text-[#e2b714]">{result.incorrectChars}</div>
                    <div className="stat-label">incorrect</div>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-sm text-[#646566]">
                  <div><span className="text-[#e2b714]">+</span> {result.extraChars} extra</div>
                  <div><span className="text-[#e2b714]">-</span> {result.missedChars} missed</div>
                  <div>time: <span className="text-[#e2b714]">{result.time}s</span></div>
                </div>
                <button
                  onClick={handleRestart}
                  className="mt-8 px-6 py-2 bg-[#e2b714] text-[#323437] rounded-md font-medium hover:bg-[#d4a813] transition-colors shadow-sm"
                >
                  restart
                </button>
              </div>
            ) : (
              <div className="text-center text-[#646566] text-xl">
                Start typing to begin the test
              </div>
            )}
          </div>

          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#323437]/80 backdrop-blur-sm rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#e2b714] mb-4">Paused</div>
                <div className="text-lg text-[#d1d1d1]">Click or press any key to resume</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 text-sm text-[#646566]">
          <div>
            {isTestActive && !isPaused && mode === "time" && (
              <span>
                {customTime ? `${timer} / ${customTime}` : `${timer} / ${timeMode}`}
              </span>
            )}
            {isTestActive && !isPaused && mode === "words" && (
              <span>
                {currentWordIndex} / {words.length}
              </span>
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
