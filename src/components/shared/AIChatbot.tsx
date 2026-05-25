"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle, X, Send, Bot, User, Sparkles,
    Map, Brain, AlertTriangle, BookOpen, Shield,
    Loader2, ChevronDown,
} from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    suggestions?: string[];
}

const QUICK_ACTIONS = [
    { icon: "🌊", label: "Lũ lụt miền Bắc", query: "Tình hình lũ lụt miền Bắc hiện tại thế nào?" },
    { icon: "🌪️", label: "Bão gần nhất", query: "Có bão nào sắp đổ bộ không?" },
    { icon: "⛰️", label: "Sạt lở Sơn La", query: "Tình hình sạt lở Sơn La ra sao?" },
    { icon: "🌡️", label: "Nắng nóng", query: "Nắng nóng miền Bắc diễn biến thế nào?" },
];

const INITIAL_MESSAGES: Message[] = [
    {
        id: "welcome",
        role: "assistant",
        content: "👋 Xin chào! Tôi là trợ lý AI của CứuNet.\n\nTôi có thể giúp bạn:\n• Tình hình thiên tai hiện tại\n• Hướng dẫn phòng chống thiên ai\n• Thông tin cảnh báo theo khu vực\n• Kỹ năng sinh tồn cơ bản\n\nBạn muốn biết gì?",
        timestamp: new Date(),
        suggestions: [
            "Tình hình thiên tai hiện tại?",
            "Làm gì khi có bão?",
            "Khu vực nào nguy hiểm nhất?",
        ],
    },
];

// Simulated AI responses based on keywords
function generateResponse(query: string): { content: string; suggestions?: string[] } {
    const q = query.toLowerCase();

    if (q.includes("lũ") || q.includes("ngập") || q.includes("flood")) {
        return {
            content: "🌊 **Tình hình lũ lụt miền Bắc (05/2026):**\n\n• Hà Nội: Ngập sâu 1.2m tại nhiều quận\n• Vĩnh Phúc, Phú Thọ: Mực nước dâng cao\n• Sơn La: Sạt lở chia cắt đường\n\n**Khuyến cáo:**\n✅ Tránh xa vùng ngập sâu\n✅ Chuẩn bị đồ cứu hộ\n✅ Theo dõi cảnh báo liên tục",
            suggestions: ["Khu vực nào an toàn?", "Chuẩn bị gì khi lũ về?"],
        };
    }

    if (q.includes("bão") || q.includes("storm")) {
        return {
            content: "🌪️ **Cảnh báo bão tháng 5/2026:**\n\n• Áp thấp nhiệt đới trên Biển Đông\n• Dự kiến mạnh lên thành bão\n• Ảnh hưởng mưa lớn miền Trung\n\n**Hướng dẫn phòng chống:**\n✅ Gia cố nhà cửa\n✅ Dự trữ lương thực 3 ngày\n✅ Sạc đầy pin, dự trữ nước",
            suggestions: ["Làm gì khi bão đổ bộ?", "Dự trữ đồ cấp cứu?"],
        };
    }

    if (q.includes("sạt lở") || q.includes("landslide")) {
        return {
            content: "⛰️ **Sạt lở Sơn La (05/2026):**\n\n• Nhiều tuyến đường bị chia cắt\n• 3 bản bị cô lập\n• Cần tiếp tế lương thực và thuốc men\n\n**Dấu hiệu cảnh báo sạt lở:**\n⚠️ Nứt đất bất thường\n⚠️ Nước suối đục ngầu\n⚠️ Tiếng động lạ từ đất đá",
            suggestions: ["Làm gì khi thấy dấu hiệu?", "Sơ tán ra sao?"],
        };
    }

    if (q.includes("nắng") || q.includes("heat") || q.includes("hạn")) {
        return {
            content: "🌡️ **Nắng nóng kỷ lục 05/2026:**\n\n• Nhiệt độ lên tới 42°C tại miền Bắc\n• Ảnh hưởng 5 triệu người\n• Thiếu nước nghiêm trọng Tây Nguyên\n\n**Bảo vệ sức khỏe:**\n✅ Hạn chế ra ngoài 11h-15h\n✅ Uống đủ 2-3 lít nước/ngày\n✅ Mặc áo sáng màu, đội mũ rộng vành",
            suggestions: ["Dấu hiệu say nắng?", "Nắng nóng ảnh hưởng cây trồng?"],
        };
    }

    if (q.includes("phòng") || q.includes("chuẩn bị") || q.includes("survival")) {
        return {
            content: "🛡️ **Kỹ năng sinh tồn cơ bản:**\n\n**1. Bộ dụng cụ 72 giờ:**\n• Nước: 4 lít/người/ngày\n• Thực phẩm đóng hộp\n• Đèn pin + pin dự phòng\n• Bộ sơ cứu y tế\n• Radio cầm tay\n\n**2. Kế hoạch gia đình:**\n• Điểm tập trung an toàn\n• Số điện thoại khẩn cấp\n• Túi tài liệu chống nước",
            suggestions: ["Số điện thoại khẩn cấp?", "Khi nào cần sơ tán?"],
        };
    }

    // Default response
    return {
        content: "Tôi hiểu câu hỏi của bạn. Để tôi tìm thông tin phù hợp...\n\nBạn có thể hỏi tôi về:\n• Tình hình thiên tai cụ thể theo khu vực\n• Hướng dẫn phòng chống thiên tai\n• Kỹ năng sinh tồn\n• Cảnh báo thời tiết\n\nThử hỏi cụ thể hơn nhé! 🌏",
        suggestions: [
            "Thiên tai gần đây nhất?",
            "Làm gì khi có động đất?",
            "Cách sơ cứu cơ bản?",
        ],
    };
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const handleSend = useCallback(async (text?: string) => {
        const query = text || input.trim();
        if (!query) return;

        // Add user message
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: query,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate AI thinking delay
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 800));

        // Generate response
        const response = generateResponse(query);
        const assistantMsg: Message = {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: response.content,
            timestamp: new Date(),
            suggestions: response.suggestions,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsTyping(false);
    }, [input]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    return (
        <>
            {/* Floating trigger button */}
            <motion.button
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 2, type: "spring", stiffness: 200 }}
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C9A7] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center group"
                title="Trợ lý AI CứuNet"
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}

                {/* Notification badge */}
                {!isOpen && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[8px] font-bold flex items-center justify-center border-2 border-white"
                    >
                        1
                    </motion.span>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-140px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-[#0066FF] to-[#00C9A7] text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">Trợ lý AI CứuNet</h3>
                                        <p className="text-[10px] text-white/80">Hỗ trợ 24/7 • Powered by AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${msg.role === "user"
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-gradient-to-br from-[#0066FF] to-[#00C9A7] text-white"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <User className="w-3.5 h-3.5" />
                                        ) : (
                                            <Bot className="w-3.5 h-3.5" />
                                        )}
                                    </div>

                                    {/* Message bubble */}
                                    <div
                                        className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === "user"
                                                ? "bg-[#0066FF] text-white rounded-br-md"
                                                : "bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md"
                                            }`}
                                    >
                                        <div className="whitespace-pre-wrap">{msg.content}</div>

                                        {/* Suggestions */}
                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {msg.suggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSend(s)}
                                                        className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[#0066FF]/30 hover:text-[#0066FF] transition-colors"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-2.5"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00C9A7] text-white flex items-center justify-center shrink-0">
                                        <Bot className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="px-3 py-2.5 rounded-2xl rounded-bl-md bg-slate-50 border border-slate-100">
                                        <div className="flex gap-1">
                                            <motion.span
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                                                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                            />
                                            <motion.span
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                            />
                                            <motion.span
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                                                className="w-1.5 h-1.5 rounded-full bg-slate-400"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick actions */}
                        {messages.length <= 1 && (
                            <div className="shrink-0 px-4 pb-2">
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                                    {QUICK_ACTIONS.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(action.query)}
                                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600 hover:border-[#0066FF]/30 hover:text-[#0066FF] transition-colors"
                                        >
                                            <span>{action.icon}</span>
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="shrink-0 px-4 py-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Hỏi về thiên tai, phòng chống..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-[#0066FF]/40 transition-colors"
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isTyping}
                                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-[#00C9A7] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-300 text-center mt-1.5">
                                AI có thể mắc lỗi. Kiểm tra thông tin quan trọng.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}