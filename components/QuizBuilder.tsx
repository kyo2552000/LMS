'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, CheckCircle2, CheckSquare, Type, Clock } from 'lucide-react';

type QuestionType = 'SINGLE' | 'MULTIPLE' | 'FILL_IN';

interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options: string[];
    correctKey?: number;
    correctKeys?: number[];
    correctAnswer?: string;
}

interface QuizBuilderProps {
    value: string;
    onChange: (value: string) => void;
}

export default function QuizBuilder({ value, onChange }: QuizBuilderProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [timeLimit, setTimeLimit] = useState<number>(0);

    useEffect(() => {
        try {
            if (value && value.trim() !== '') {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setQuestions(parsed.map(q => ({ ...q, type: q.type || 'SINGLE' })));
                    setTimeLimit(0);
                } else if (parsed && typeof parsed === 'object') {
                    setQuestions((parsed.questions || []).map((q: any) => ({ ...q, type: q.type || 'SINGLE' })));
                    setTimeLimit(parsed.timeLimit || 0);
                }
            } else {
                setQuestions([]);
                setTimeLimit(0);
            }
        } catch {
            setQuestions([]);
            setTimeLimit(0);
        }
    }, [value]);

    const notifyChange = (newQuestions: Question[], newTimeLimit: number) => {
        setQuestions(newQuestions);
        setTimeLimit(newTimeLimit);
        onChange(JSON.stringify({ timeLimit: newTimeLimit, questions: newQuestions }));
    };

    const addQuestion = () => {
        const newQ: Question = {
            id: 'q_' + Math.random().toString(36).substr(2, 9),
            type: 'SINGLE',
            text: '',
            options: ['', '', '', ''],
            correctKey: 0
        };
        notifyChange([...questions, newQ], timeLimit);
    };

    const deleteQuestion = (idx: number) => {
        const newQuestions = [...questions];
        newQuestions.splice(idx, 1);
        notifyChange(newQuestions, timeLimit);
    };

    const updateQuestion = (idx: number, updates: Partial<Question>) => {
        const newQuestions = [...questions];
        newQuestions[idx] = { ...newQuestions[idx], ...updates };
        notifyChange(newQuestions, timeLimit);
    };

    const updateOption = (qIdx: number, optIdx: number, text: string) => {
        const newQuestions = [...questions];
        newQuestions[qIdx].options[optIdx] = text;
        notifyChange(newQuestions, timeLimit);
    };

    const toggleCorrectKey = (qIdx: number, optIdx: number) => {
        const q = questions[qIdx];
        if (q.type === 'SINGLE') {
            updateQuestion(qIdx, { correctKey: optIdx });
        } else if (q.type === 'MULTIPLE') {
            const current = q.correctKeys || [];
            const next = current.includes(optIdx)
                ? current.filter(k => k !== optIdx)
                : [...current, optIdx];
            updateQuestion(qIdx, { correctKeys: next });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Global Settings */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-bold text-slate-700">Giới hạn thời gian (giây)</span>
                </div>
                <input
                    type="number"
                    min="0"
                    placeholder="0 = Không giới hạn"
                    className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={timeLimit || ''}
                    onChange={(e) => notifyChange(questions, parseInt(e.target.value) || 0)}
                />
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {questions.map((q, qIdx) => (
                    <Card key={q.id} className="border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <CardContent className="p-4 pl-5">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                                            Câu hỏi {qIdx + 1}
                                        </label>
                                        <select
                                            className="text-xs font-bold bg-slate-100 border-none rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                            value={q.type}
                                            onChange={(e) => updateQuestion(qIdx, { 
                                                type: e.target.value as QuestionType,
                                                options: e.target.value === 'FILL_IN' ? [] : (q.options.length > 0 ? q.options : ['', '', '', '']),
                                                correctKey: 0,
                                                correctKeys: [],
                                                correctAnswer: ''
                                            })}
                                        >
                                            <option value="SINGLE">Một đáp án</option>
                                            <option value="MULTIPLE">Nhiều đáp án</option>
                                            <option value="FILL_IN">Điền từ</option>
                                        </select>
                                    </div>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                                        placeholder="Nội dung câu hỏi..."
                                        value={q.text}
                                        onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => deleteQuestion(qIdx)} 
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Options Area */}
                            {q.type === 'FILL_IN' ? (
                                <div className="mt-2">
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Đáp án đúng</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full pl-9 pr-3 py-2 border border-emerald-200 bg-emerald-50 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Nhập từ/cụm từ chính xác..."
                                            value={q.correctAnswer || ''}
                                            onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                                        />
                                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 mt-2">
                                    {q.options.map((opt, optIdx) => {
                                        const isCorrect = q.type === 'MULTIPLE' 
                                            ? q.correctKeys?.includes(optIdx)
                                            : q.correctKey === optIdx;

                                        return (
                                            <div key={optIdx} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCorrectKey(qIdx, optIdx)}
                                                    className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                                                        isCorrect 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                            : 'bg-slate-100 border-slate-300 hover:border-emerald-400'
                                                    }`}
                                                >
                                                    {isCorrect && (q.type === 'MULTIPLE' ? <CheckSquare className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />)}
                                                </button>
                                                <input
                                                    type="text"
                                                    className={`flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                                                        isCorrect 
                                                        ? 'border-emerald-200 bg-emerald-50 focus:ring-emerald-500' 
                                                        : 'border-gray-200 focus:ring-indigo-500'
                                                    }`}
                                                    placeholder={`Lựa chọn ${optIdx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                                />
                                                {q.options.length > 2 && (
                                                    <button 
                                                        onClick={() => {
                                                            const next = [...q.options];
                                                            next.splice(optIdx, 1);
                                                            updateQuestion(qIdx, { options: next, correctKey: 0, correctKeys: [] });
                                                        }}
                                                        className="p-1 text-slate-300 hover:text-red-400"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => updateQuestion(qIdx, { options: [...q.options, ''] })}
                                        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 mt-1 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Thêm lựa chọn
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pt-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addQuestion} 
                    className="border-dashed border-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 w-full rounded-xl py-6"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm câu hỏi mới
                </Button>
            </div>
        </div>
    );
}
