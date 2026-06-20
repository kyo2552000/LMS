"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2, Loader2 } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

const QUICK_PROMPTS = [
    "🎯 Khóa học dành cho bạn",
    "💡 Lời khuyên học tập cho người mới bắt đầu",
    "🚀 Làm thế nào để bắt đầu học lập trình web?",
    "📚 Các khóa học có sẵn?",
];

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const generateId = () => Math.random().toString(36).substring(2, 15);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        setShowWelcome(false);
        const userMessage: Message = {
            id: generateId(),
            role: "user",
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const apiMessages = [...messages, userMessage].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: apiMessages }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get response");
            }

            const assistantMessage: Message = {
                id: generateId(),
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: generateId(),
                role: "assistant",
                content: error instanceof Error
                    ? `⚠️ ${error.message}`
                    : "⚠️ Sorry, something went wrong. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        sendMessage(prompt);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatMessageContent = (content: string) => {
        let inCodeBlock = false;
        return content.split("\n").map((line, i) => {
            if (line.trim().startsWith("```")) {
                inCodeBlock = !inCodeBlock;
                return <div key={i} className="h-2"></div>;
            }

            if (inCodeBlock) {
                return <div key={i} className="bg-gray-800 text-gray-100 font-mono text-[11px] p-1 px-2 rounded whitespace-pre-wrap">{line}</div>;
            }

            let isBlock = false;
            let formattedLine = line;

            // Headers
            if (line.startsWith("### ")) {
                formattedLine = `<h4 class="font-bold text-[15px] mt-2 mb-1 text-gray-800">${line.substring(4)}</h4>`;
                isBlock = true;
            } else if (line.startsWith("## ") || line.startsWith("# ")) {
                formattedLine = `<h3 class="font-bold text-base mt-2 mb-1 text-gray-900">${line.replace(/^#+\s/, '')}</h3>`;
                isBlock = true;
            }

            if (!isBlock) {
                // Determine if line is a list item first to extract content cleanly
                const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)/);
                const numberMatch = line.match(/^(\s*)(\d+\.)\s+(.*)/);

                let contentToFormat = line;
                let wrapperStart = "";
                let wrapperEnd = "";

                if (bulletMatch) {
                    contentToFormat = bulletMatch[3];
                    wrapperStart = `<div class="flex mt-1 mb-1 ml-${bulletMatch[1].length > 0 ? '4' : '0'}"><span class="mr-2 mt-0.5 text-gray-500">•</span><span class="flex-1">`;
                    wrapperEnd = `</span></div>`;
                    isBlock = true;
                } else if (numberMatch) {
                    contentToFormat = numberMatch[3];
                    wrapperStart = `<div class="flex mt-1 mb-1 ml-${numberMatch[1].length > 0 ? '4' : '0'}"><span class="mr-2 font-medium text-gray-700">${numberMatch[2]}</span><span class="flex-1">`;
                    wrapperEnd = `</span></div>`;
                    isBlock = true;
                }

                // Apply inline formatting to the clean content
                let formattedContent = contentToFormat;
                // Bold formatting
                formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
                // Link formatting
                formattedContent = formattedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 underline font-medium hover:text-indigo-800 transition-colors cursor-pointer">$1</a>');

                formattedLine = wrapperStart + formattedContent + wrapperEnd;
            }

            return (
                <span key={i} className={isBlock ? 'block' : ''}>
                    <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                    {!isBlock && i < content.split("\n").length - 1 && line.trim() !== "" && <br />}
                </span>
            );
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-[100] group"
                aria-label="Open AI Chat"
                id="chatbot-toggle"
            >
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-2xl shadow-purple-500/40 transition-all duration-300 hover:scale-110 hover:shadow-purple-500/60 ring-4 ring-white/20">
                    <MessageCircle className="w-7 h-7 text-white" />

                    {/* Notification dot */}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm hover:animate-ping">
                        <span className="text-[8px] text-white font-bold">AI</span>
                    </span>
                </div>

                {/* Tooltip */}
                <div className="absolute top-1/2 -translate-y-1/2 right-[110%] mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-x-2 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl whitespace-nowrap font-medium flex items-center">
                        <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400" /> Chat với AI EduBot
                        {/* Triangle arrow on the right */}
                        <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-900" />
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div
            className={`fixed z-[100] transition-all duration-500 ease-out ${isMinimized
                ? "bottom-24 right-6 w-80"
                : "bottom-24 right-6 w-[420px] h-[680px] max-h-[80vh]"
                }`}
            id="chatbot-window"
        >
            <div className={`flex flex-col bg-white rounded-2xl shadow-2xl shadow-purple-500/10 border border-gray-100 overflow-hidden transition-all duration-500 ${isMinimized ? "h-auto" : "h-full"
                }`}>
                {/* Header */}
                <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 px-5 py-4 flex items-center justify-between shrink-0">
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
                            backgroundSize: '30px 30px',
                        }} />
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base">EduBot AI</h3>
                            <p className="text-purple-200 text-xs flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Powered by GPT-4o
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 relative z-10">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Minimize chat"
                        >
                            <Minimize2 className="w-4 h-4 text-white" />
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Close chat"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
                            {/* Welcome Message */}
                            {showWelcome && messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 animate-fadeIn">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4 shadow-lg shadow-purple-100">
                                        <Bot className="w-10 h-10 text-purple-600" />
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                        Welcome to EduBot! 👋
                                    </h4>
                                    <p className="text-gray-500 text-sm mb-6 max-w-[280px]">
                                        I&apos;m your AI learning assistant. Ask me anything about courses, study tips, or learning paths!
                                    </p>

                                    {/* Quick Prompts */}
                                    <div className="grid grid-cols-1 gap-2 w-full max-w-[300px]">
                                        {QUICK_PROMPTS.map((prompt, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickPrompt(prompt)}
                                                className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 shadow-sm hover:shadow-md group"
                                            >
                                                <span className="group-hover:translate-x-1 inline-block transition-transform duration-200">
                                                    {prompt}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Messages */}
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-2.5 animate-slideUp ${message.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {message.role === "assistant" && (
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200 mt-0.5">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                    )}

                                    <div className={`max-w-[75%] ${message.role === "user" ? "order-first" : ""}`}>
                                        <div
                                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${message.role === "user"
                                                ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md shadow-lg shadow-purple-200"
                                                : "bg-white text-gray-700 border border-gray-100 rounded-bl-md shadow-sm"
                                                }`}
                                        >
                                            {message.role === "assistant"
                                                ? formatMessageContent(message.content)
                                                : message.content
                                            }
                                        </div>
                                        <p className={`text-[10px] text-gray-400 mt-1 px-1 ${message.role === "user" ? "text-right" : "text-left"
                                            }`}>
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>

                                    {message.role === "user" && (
                                        <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mt-0.5">
                                            <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex gap-2.5 justify-start animate-slideUp">
                                    <div className="shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-100 bg-white px-4 py-3 shrink-0">
                            <div className="flex items-end gap-2">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask EduBot anything..."
                                        rows={1}
                                        className="w-full resize-none px-4 py-3 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all duration-200"
                                        style={{ maxHeight: "120px" }}
                                        id="chatbot-input"
                                    />
                                </div>
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || isLoading}
                                    className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white shadow-lg shadow-purple-200 disabled:opacity-40 disabled:shadow-none hover:shadow-purple-300 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                    aria-label="Send message"
                                    id="chatbot-send"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center mt-2">
                                EduBot can make mistakes. Verify important information.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
