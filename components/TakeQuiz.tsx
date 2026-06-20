'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  Award,
  CircleDot,
  Clock,
  CheckSquare,
  Type,
  Timer,
  Sparkles,
} from 'lucide-react';

type QuestionType = 'SINGLE' | 'MULTIPLE' | 'FILL_IN';

interface Question {
  id: string;
  type?: QuestionType;
  text: string;
  options?: string[];
  correctKey?: number;
  correctKeys?: number[];
  correctAnswer?: string;
}

export default function TakeQuiz({
  lessonId,
  title,
  content,
  timeLimit: initialTimeLimit = 0, // in seconds, 0 = no limit
  onPass,
}: {
  lessonId: string;
  title?: string;
  content?: string;
  timeLimit?: number;
  onPass?: () => void;
}) {
  const { parsedQuestions, parsedTimeLimit } = useMemo(() => {
    let q: Question[] = [];
    let t = initialTimeLimit;
    try {
      if (content && content.trim() !== '') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          q = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.questions)) q = parsed.questions;
          if (typeof parsed.timeLimit === 'number') t = parsed.timeLimit;
        }
      }
    } catch { /* ignore */ }

    if (q.length === 0) {
      q = [{
        id: 'empty',
        text: 'Bài kiểm tra này chưa có câu hỏi nào được thêm bởi giảng viên.',
        options: ['Quay lại'],
        correctKey: 0,
      }];
    }
    return { parsedQuestions: q, parsedTimeLimit: t };
  }, [content, initialTimeLimit]);

  const questions = parsedQuestions;
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [timeLeft, setTimeLeft] = useState(parsedTimeLimit);

  // Sync timeLeft if parsedTimeLimit changes before start
  useEffect(() => {
    if (!started) setTimeLeft(parsedTimeLimit);
  }, [parsedTimeLimit, started]);

  const q = questions[currentIdx];
  const totalQuestions = questions[0]?.id === 'empty' ? 0 : questions.length;
  const currentAnswer = answers[q?.id];

  // Timer logic
  useEffect(() => {
    if (started && !isFinished && parsedTimeLimit > 0 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, isFinished, parsedTimeLimit, timeLeft]);

  const score = useMemo(() => {
    let correct = 0;
    questions.forEach((question) => {
      const ans = answers[question.id];
      const type = question.type || 'SINGLE';

      if (type === 'SINGLE') {
        if (ans === question.correctKey) correct++;
      } else if (type === 'MULTIPLE') {
        const userAns = Array.isArray(ans) ? [...ans].sort() : [];
        const correctAns = Array.isArray(question.correctKeys) ? [...question.correctKeys].sort() : [];
        if (JSON.stringify(userAns) === JSON.stringify(correctAns)) correct++;
      } else if (type === 'FILL_IN') {
        if (typeof ans === 'string' && ans.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase()) {
          correct++;
        }
      }
    });
    const total = totalQuestions;
    const passed = total > 0 ? correct / total >= 0.7 : false;
    return { correct, total, passed };
  }, [answers, questions, totalQuestions]);

  const handleAnswer = (val: any) => {
    const type = q.type || 'SINGLE';
    if (type === 'SINGLE') {
      setAnswers((prev) => ({ ...prev, [q.id]: val }));
    } else if (type === 'MULTIPLE') {
      setAnswers((prev) => {
        const current = Array.isArray(prev[q.id]) ? prev[q.id] : [];
        const next = current.includes(val)
          ? current.filter((v: any) => v !== val)
          : [...current, val];
        return { ...prev, [q.id]: next };
      });
    } else if (type === 'FILL_IN') {
      setAnswers((prev) => ({ ...prev, [q.id]: val }));
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setIsFinished(false);
    setStarted(false);
    setTimeLeft(parsedTimeLimit);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!started) {
    return (
      <Card className="rounded-[24px] border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden relative w-full mt-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <CardContent className="p-10 flex flex-col items-center justify-center text-center relative z-10 min-h-[360px]">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 shadow-inner text-blue-600">
            <Award className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Bài kiểm tra trắc nghiệm</h2>
          <p className="text-slate-500 mb-6 max-w-md leading-7">
            {title ? `Đánh giá kiến thức cho bài học: ${title}. ` : ''}
            Bạn cần đạt ít nhất <strong>70%</strong> để vượt qua.
            {parsedTimeLimit > 0 && <span className="block mt-2 text-blue-600 font-semibold">Thời gian làm bài: {formatTime(parsedTimeLimit)}</span>}
          </p>

          <button
            onClick={() => setStarted(true)}
            disabled={totalQuestions === 0}
            className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full max-w-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bắt đầu làm bài
          </button>
        </CardContent>
      </Card>
    );
  }

  if (isFinished) {
    return (
      <Card className="rounded-[24px] border-0 shadow-xl overflow-hidden relative w-full mt-4 bg-white">
        <CardContent className="p-10 flex flex-col items-center text-center relative z-10">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white ${score.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {score.passed ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">{score.passed ? 'Chúc mừng!' : 'Chưa đạt yêu cầu'}</h2>
          <p className="text-slate-500 mb-6 font-medium">
            Bạn trả lời đúng <strong className={`font-bold ${score.passed ? 'text-emerald-600' : 'text-red-500'}`}>{score.correct}/{score.total}</strong> câu.
            {timeLeft === 0 && parsedTimeLimit > 0 && <span className="block text-red-500 text-sm mt-1">Hết thời gian làm bài!</span>}
          </p>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4 max-w-sm">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${score.passed ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
              style={{ width: `${score.total > 0 ? (score.correct / score.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mb-8">
            Cần tối thiểu {Math.ceil(score.total * 0.7)}/{score.total} câu đúng để đạt.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={restart}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Làm lại
            </button>
            {score.passed && onPass && (
              <button
                onClick={onPass}
                className="flex items-center gap-2 bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Đánh dấu hoàn thành
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[24px] border border-slate-100 shadow-md overflow-hidden relative w-full mt-4 bg-white">
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiến độ</span>
            <p className="text-sm font-bold text-slate-700">Câu {currentIdx + 1}/{questions.length}</p>
          </div>
          {parsedTimeLimit > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${timeLeft < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-bold font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <CardContent className="p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                {q.type === 'MULTIPLE' ? 'Chọn nhiều' : q.type === 'FILL_IN' ? 'Điền từ' : 'Trắc nghiệm'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 leading-relaxed">{q.text}</h3>
          </div>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
          >
            {showHint ? 'Ẩn hướng dẫn' : 'Hiện hướng dẫn'}
          </button>
        </div>

        {/* Question Type Rendering */}
        <div className="space-y-3">
          {q.type === 'FILL_IN' ? (
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Nhập câu trả lời của bạn..."
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300"
              />
              <Type className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            </div>
          ) : (
            q.options?.map((opt, idx) => {
              const isSelected = q.type === 'MULTIPLE' 
                ? Array.isArray(currentAnswer) && currentAnswer.includes(idx)
                : currentAnswer === idx;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                    {isSelected && (
                      q.type === 'MULTIPLE' 
                        ? <CheckSquare className="w-3.5 h-3.5 text-white" />
                        : <CircleDot className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="break-words leading-7">{opt}</span>
                </button>
              );
            })
          )}
        </div>

        {showHint && (
          <div className="mt-6 flex items-start gap-2 p-3 bg-blue-50/50 rounded-lg text-[11px] text-blue-600/80 italic border border-blue-100/50">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
            {q.type === 'MULTIPLE' ? 'Gợi ý: Câu này có thể có nhiều đáp án đúng. Hãy chọn tất cả các đáp án bạn cho là chính xác.' : 
             q.type === 'FILL_IN' ? 'Gợi ý: Hãy nhập câu trả lời vào ô trống. Lưu ý viết đúng chính tả.' : 
             'Gợi ý: Chọn một đáp án duy nhất đúng nhất.'}
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={(!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) && q.id !== 'empty'}
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {currentIdx === questions.length - 1 ? 'Nộp bài' : 'Tiếp theo'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
