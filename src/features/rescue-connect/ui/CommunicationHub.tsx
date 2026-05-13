"use client";

// =============================================================================
// COMMUNICATION HUB - Discord-like Messaging
// Module Phối Hợp Cứu Trợ - CứuNet (Phase 5)
//
// Features:
//   - Channel list (left sidebar)
//   - Message list with sender info
//   - Message input with send button
//   - Broadcast announcements
//   - Message types (text, status, resource request, location, system)
//   - Priority indicators (normal/urgent/critical)
//   - Animated message entrance
//   - Glassmorphism dark theme
// =============================================================================

import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Hash,
  Radio,
  AlertTriangle,
  MapPin,
  Package,
  Bot,
  MessageSquare,
  ChevronRight,
  Volume2,
  Bell,
} from "lucide-react";
import clsx from "clsx";
import type { CommChannel, CommMessage, Broadcast, CommunicationHubProps, ChannelType } from "../lib/types";
import { CHANNEL_TYPE_CONFIG, BROADCAST_PRIORITY_CONFIG } from "../config/rescue-config";

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// =============================================================================
// CHANNEL LIST
// =============================================================================

function ChannelList({
  channels,
  activeChannelId,
  onSelect,
}: {
  channels: CommChannel[];
  activeChannelId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-0.5">
      {channels.map((channel) => {
        const config = CHANNEL_TYPE_CONFIG[channel.type];
        const isActive = activeChannelId === channel.id;

        return (
          <button
            key={channel.id}
            onClick={() => onSelect(channel.id)}
            className={clsx(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-200",
              isActive
                ? "bg-slate-800/60 text-slate-200"
                : "text-slate-500 hover:bg-slate-800/30 hover:text-slate-300"
            )}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="text-xs font-medium flex-1 truncate">{channel.name}</span>
            {channel.unreadCount > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                {channel.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// MESSAGE BUBBLE
// =============================================================================

function MessageBubble({ message }: { message: CommMessage }) {
  const isSystem = message.isSystem;
  const priorityConfig = BROADCAST_PRIORITY_CONFIG[message.priority];

  if (isSystem) {
    return (
      <motion.div variants={messageVariants} className="flex justify-center py-1">
        <span className="text-[10px] text-slate-600 bg-slate-800/30 px-3 py-1 rounded-full">
          🤖 {message.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div variants={messageVariants} className="flex gap-2 py-1">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
        {message.senderName.charAt(0)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-slate-200">{message.senderName}</span>
          <span className="text-[9px] text-slate-600">
            {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {message.priority !== "normal" && (
            <span
              className="text-[8px] font-bold px-1 py-0.5 rounded"
              style={{ backgroundColor: `${priorityConfig.color}15`, color: priorityConfig.color }}
            >
              {priorityConfig.labelVi}
            </span>
          )}
        </div>

        <div className={clsx(
          "text-xs text-slate-300 rounded-lg px-2.5 py-1.5 inline-block",
          message.priority === "critical"
            ? "bg-red-500/10 border border-red-500/20"
            : message.priority === "urgent"
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-slate-800/30"
        )}>
          {message.type === "resource_request" && (
            <span className="text-blue-400 mr-1">📦</span>
          )}
          {message.type === "location_share" && (
            <span className="text-green-400 mr-1">📍</span>
          )}
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MESSAGE INPUT
// =============================================================================

function MessageInput({
  channelName,
  onSend,
}: {
  channelName: string;
  onSend: (content: string) => void;
}) {
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }, [text, onSend]);

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
    <div className="p-3 border-t border-slate-700/30">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Nhắn tin vào #${channelName}...`}
          className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={clsx(
            "p-2 rounded-lg transition-colors",
            text.trim()
              ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              : "bg-slate-800/30 text-slate-600"
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// BROADCAST CARD
// =============================================================================

function BroadcastCard({ broadcast }: { broadcast: Broadcast }) {
  const priorityConfig = BROADCAST_PRIORITY_CONFIG[broadcast.priority];

  return (
    <motion.div
      variants={messageVariants}
      className="p-2.5 rounded-lg border"
      style={{
        backgroundColor: `${priorityConfig.color}08`,
        borderColor: `${priorityConfig.color}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Volume2 className="w-3.5 h-3.5" style={{ color: priorityConfig.color }} />
        <span className="text-[11px] font-semibold text-slate-200">{broadcast.title}</span>
        <span
          className="text-[8px] font-bold px-1 py-0.5 rounded ml-auto"
          style={{ backgroundColor: `${priorityConfig.color}15`, color: priorityConfig.color }}
        >
          {priorityConfig.labelVi}
        </span>
      </div>
      <p className="text-[11px] text-slate-400">{broadcast.content}</p>
      <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-500">
        <span>Bởi: {broadcast.sentBy}</span>
        <span>•</span>
        <span>{new Date(broadcast.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
        <span>•</span>
        <span>{broadcast.acknowledgedBy.length} đã nhận</span>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function CommunicationHubComponent({
  channels,
  messages,
  broadcasts,
  currentUserId,
  onChannelCreate,
  onMessageSend,
  onBroadcast,
  className,
}: CommunicationHubProps) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    channels.length > 0 ? channels[0].id : null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId),
    [channels, activeChannelId]
  );

  const channelMessages = useMemo(
    () =>
      messages
        .filter((m) => m.channelId === activeChannelId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages, activeChannelId]
  );

  const recentBroadcasts = useMemo(
    () => broadcasts.slice(0, 3),
    [broadcasts]
  );

  const handleSend = useCallback(
    (content: string) => {
      if (!activeChannelId || !activeChannel) return;
      onMessageSend({
        channelId: activeChannelId,
        senderId: currentUserId,
        senderName: "Bạn",
        type: "text",
        content,
        priority: "normal",
        isSystem: false,
      });
    },
    [activeChannelId, activeChannel, currentUserId, onMessageSend]
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages.length]);

  return (
    <div className={clsx("flex h-[500px] rounded-xl bg-slate-900/40 border border-slate-700/30 overflow-hidden", className)}>
      {/* Sidebar */}
      <div className="w-48 border-r border-slate-700/30 flex flex-col">
        <div className="p-2.5 border-b border-slate-700/30">
          <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            Kênh liên lạc
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5">
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onSelect={setActiveChannelId}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-2.5 border-b border-slate-700/30 flex items-center gap-2">
          {activeChannel && (
            <>
              <span className="text-sm">{CHANNEL_TYPE_CONFIG[activeChannel.type].icon}</span>
              <span className="text-xs font-semibold text-slate-200">{activeChannel.name}</span>
              <span className="text-[10px] text-slate-500">
                {activeChannel.participants.length} thành viên
              </span>
            </>
          )}
        </div>

        {/* Broadcasts */}
        {recentBroadcasts.length > 0 && (
          <div className="p-2 border-b border-slate-700/20 space-y-1.5">
            {recentBroadcasts.map((bc) => (
              <BroadcastCard key={bc.id} broadcast={bc} />
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs text-slate-500">Chưa có tin nhắn</p>
            </div>
          ) : (
            <AnimatePresence>
              {channelMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeChannel && (
          <MessageInput
            channelName={activeChannel.name}
            onSend={handleSend}
          />
        )}
      </div>
    </div>
  );
}

export const CommunicationHub = memo(CommunicationHubComponent);
