'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/src/lib/apiClient'; 
import { MessageSquare } from 'lucide-react';

// ─────────────────────────────────────────────
// 🚨 FORCED PRODUCTION TEST: Pointing straight to Render
const API_BASE  = process.env.NEXT_PUBLIC_API_URL || "https://dunex-backend.onrender.com/api/v1";
const WS_BASE   = API_BASE.replace(/^http/i, "ws").replace(/^https/i, "wss");

const ADMIN_TOKEN = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("admin_token") || "";
  }
  return "";
};
// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ChatUser {
  user_id:             string;
  email:               string;
  full_name:           string;
  unread_count:        number;
  last_message:        string;
  last_message_sender: "user" | "admin" | null;
  last_message_at:     string | null;
  is_online:           boolean;
}

interface Message {
  id:          string;
  sender_type: "user" | "admin";
  content:     string;
  created_at:  string;
  status?:     "delivered" | "read";
  pending?:    boolean;
  user_id?:    string;
}

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN()}`,
      ...(opts?.headers ?? {}),
    },
  }).then(r => r.json());

// ─────────────────────────────────────────────
// Relative time
// ─────────────────────────────────────────────

const relTime = (iso: string | null) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)   return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const msgTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─────────────────────────────────────────────
// AdminChatPanel
// ─────────────────────────────────────────────

export default function AdminChatPanel() {
  const [chatList,      setChatList]      = useState<ChatUser[]>([]);
  const [activeUser,    setActiveUser]    = useState<ChatUser | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [inputText,     setInputText]     = useState("");
  const [wsConnected,   setWsConnected]   = useState(false);
  const [userTyping,    setUserTyping]    = useState(false);
  const [search,        setSearch]        = useState("");

  const ws               = useRef<WebSocket | null>(null);
  const adminId          = useRef(`admin-${Date.now()}`);
  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const heartbeatRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimer      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const isAdminTypingRef = useRef(false);
  const activeUserRef    = useRef<string | null>(null);

  const scrollBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  // ── Load chat list ────────────────────────────────────────

  const loadChatList = useCallback(async () => {
    try {
      const data = await apiFetch("/chat/admin/all-chats");
      if (Array.isArray(data)) setChatList(data);
    } catch (e) {
      console.error("Failed to load chat list:", e);
    }
  }, []);

  // ── Load history for a user ───────────────────────────────

  const loadHistory = useCallback(async (userId: string) => {
    try {
      const data = await apiFetch(`/chat/history?user_id=${userId}`);
      const msgs = Array.isArray(data) ? data : (data.messages ?? []);
      setMessages(msgs);
      scrollBottom();
    } catch (e) {
      console.error("History fetch failed:", e);
    }
  }, []);

  // ── Select a user ─────────────────────────────────────────

  const selectUser = useCallback(async (u: ChatUser) => {
    setActiveUser(u);
    activeUserRef.current = u.user_id;
    setMessages([]);
    await loadHistory(u.user_id);

    // Mark as read
    ws.current?.send(JSON.stringify({ type: "mark_read", user_id: u.user_id }));
    setChatList(prev =>
      prev.map(c => c.user_id === u.user_id ? { ...c, unread_count: 0 } : c)
    );
  }, [loadHistory]);

  // ── Admin WebSocket ────────────────────────────────────────

  useEffect(() => {
    const connect = () => {
      const token = ADMIN_TOKEN();
      if (!token) {
        console.error("[WS Admin] No token found. Aborting connection.");
        return;
      }

      const socketUrl = `${WS_BASE}/chat/ws/admin/${adminId.current}?token=${token}`;
      const socket = new WebSocket(socketUrl);
      ws.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        heartbeatRef.current = setInterval(() => {
          socket.readyState === WebSocket.OPEN && socket.send("ping");
        }, 25_000);
        loadChatList();
      };

      socket.onmessage = ({ data }) => {
        if (data === "pong") return;
        let p: any;
        try { p = JSON.parse(data); } catch { return; }

        if (p.type === "message") {
          if (p.user_id === activeUserRef.current) {
            setMessages(prev =>
              prev.some(m => m.id === p.id)
                ? prev
                : [...prev, { id: p.id, sender_type: p.sender_type, content: p.content, created_at: p.created_at, status: p.status ?? "delivered", user_id: p.user_id }]
            );
            scrollBottom();
          }

          setChatList(prev => {
            const exists = prev.find(c => c.user_id === p.user_id);
            const delta  = p.sender_type === "user" && p.user_id !== activeUserRef.current ? 1 : 0;
            if (exists) {
              return prev.map(c =>
                c.user_id === p.user_id
                  ? { ...c, last_message: p.content, last_message_sender: p.sender_type, last_message_at: p.created_at, unread_count: c.unread_count + delta }
                  : c
              ).sort((a, b) => (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""));
            }
            loadChatList();
            return prev;
          });
        }

        else if (p.type === "message" && p.sender_type === "admin") {
          setMessages(prev => prev.map(m => m.pending && m.content === p.content ? { ...m, id: p.id, pending: false, status: "delivered" } : m));
        }

        else if (p.type === "typing" && p.user_id === activeUserRef.current) {
          setUserTyping(p.is_typing);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          if (p.is_typing) {
            typingTimer.current = setTimeout(() => setUserTyping(false), 3_500);
          }
        }

        else if (p.type === "user_online" || p.type === "user_offline") {
          setChatList(prev =>
            prev.map(c => c.user_id === p.user_id ? { ...c, is_online: p.type === "user_online" } : c)
          );
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        setTimeout(connect, 3_000);
      };

      socket.onerror = (e) => console.error("[WS Admin] Error:", e);
    };
    
    
    connect();
    loadChatList();
    const listRefresh = setInterval(loadChatList, 60_000);

    return () => {
      clearInterval(listRefresh);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      ws.current?.close(1000, "Unmounted");
    };
  }, [loadChatList]);

  // ── Send reply ─────────────────────────────────────────────

  const sendReply = useCallback(() => {
    const content = inputText.trim();
    if (!content || !activeUser || ws.current?.readyState !== WebSocket.OPEN) return;

    const tempId = `pending-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: tempId, sender_type: "admin", content, created_at: new Date().toISOString(), pending: true },
    ]);
    setInputText("");
    scrollBottom();

    if (isAdminTypingRef.current) {
      ws.current.send(JSON.stringify({ type: "typing", user_id: activeUser.user_id, is_typing: false }));
      isAdminTypingRef.current = false;
    }

    ws.current.send(JSON.stringify({ type: "message", user_id: activeUser.user_id, content }));
  }, [inputText, activeUser]);

  // ── Admin typing indicator ─────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeUser || ws.current?.readyState !== WebSocket.OPEN) return;
    if (!isAdminTypingRef.current) {
      isAdminTypingRef.current = true;
      ws.current.send(JSON.stringify({ type: "typing", user_id: activeUser.user_id, is_typing: true }));
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isAdminTypingRef.current = false;
      ws.current?.send(JSON.stringify({ type: "typing", user_id: activeUser.user_id, is_typing: false }));
    }, 1_500);
  };

  // ── Filtered sidebar ──────────────────────────────────────

  const filteredList = chatList.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = chatList.reduce((s, c) => s + c.unread_count, 0);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div style={s.root}>

      {/* ── Sidebar (Hides on mobile if a user is active) ── */}
      <aside className={`mobile-sidebar ${activeUser ? 'hide-on-mobile' : ''}`} style={s.sidebar}>

        {/* Sidebar header */}
        <div style={s.sidebarHeader}>
          <div style={s.sidebarTitle}>
            <span style={s.sidebarTitleText}>Support Inbox</span>
            {totalUnread > 0 && (
              <span style={s.badgePill}>{totalUnread}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ ...s.wsDot, background: wsConnected ? "#10b981" : "#ef4444" }} />
            <span style={s.wsLabel}>{wsConnected ? "Live" : "Connecting…"}</span>
          </div>
        </div>

        {/* Search */}
        <div style={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Chat list */}
        <div style={s.chatList}>
          {filteredList.length === 0 && (
            <div style={s.emptyState}>No conversations yet</div>
          )}
          {filteredList.map(u => (
            <div
              key={u.user_id}
              style={{ ...s.chatItem, ...(activeUser?.user_id === u.user_id ? s.chatItemActive : {}) }}
              onClick={() => selectUser(u)}
            >
              {/* Avatar */}
              <div style={s.avatarWrap}>
                <div style={s.avatar}>
                  {(u.full_name || u.email)[0].toUpperCase()}
                </div>
                <div style={{ ...s.presenceDot, background: u.is_online ? "#10b981" : "#475569" }} />
              </div>

              {/* Info */}
              <div style={s.chatItemInfo}>
                <div style={s.chatItemRow}>
                  <span style={s.chatItemName}>{u.full_name || u.email}</span>
                  <span style={s.chatItemTime}>{relTime(u.last_message_at)}</span>
                </div>
                <div style={s.chatItemRow}>
                  <span style={s.chatItemPreview}>
                    {u.last_message_sender === "admin" && <span style={{ color: "#60a5fa" }}>You: </span>}
                    {u.last_message || "No messages yet"}
                  </span>
                  {u.unread_count > 0 && (
                    <span style={s.unreadBadge}>{u.unread_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Chat Window (Hides on mobile if NO user is active) ── */}
      <main className={`mobile-chatpanel ${!activeUser ? 'hide-on-mobile' : ''}`} style={s.chatPanel}>
        {!activeUser ? (
          <div style={s.emptyChat}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ color: "#475569", marginTop: 16, fontSize: 15 }}>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={s.chatHeader}>
              <div style={s.chatHeaderLeft}>
                {/* 🚨 NEW: Mobile Back Button */}
                <button 
                  className="mobile-back-btn" 
                  onClick={() => { setActiveUser(null); activeUserRef.current = null; }}
                  style={{ display: "none", background: "transparent", border: "none", color: "#f1f5f9", cursor: "pointer", marginRight: "12px", padding: "4px" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>

                <div style={s.chatHeaderAvatar}>
                  {(activeUser.full_name || activeUser.email)[0].toUpperCase()}
                </div>
                <div>
                  <div style={s.chatHeaderName}>{activeUser.full_name || activeUser.email}</div>
                  <div style={s.chatHeaderSub}>
                    <div style={{ ...s.presenceDot, width: 7, height: 7, background: activeUser.is_online ? "#10b981" : "#475569" }} />
                    <span style={{ color: activeUser.is_online ? "#10b981" : "#64748b", fontSize: 12 }}>
                      {activeUser.is_online ? "Online" : "Offline"}
                    </span>
                    <span style={{ color: "#475569", fontSize: 12, marginLeft: 8 }}>{activeUser.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={s.messagesArea}>
              {messages.map(m => {
                const isAdmin = m.sender_type === "admin";
                const time    = m.created_at ? msgTime(m.created_at) : "";
                return (
                  <div key={m.id} style={{ ...s.msgRow, justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                    {!isAdmin && (
                      <div style={s.msgAvatar}>{(activeUser.full_name || "U")[0].toUpperCase()}</div>
                    )}
                    <div style={{ ...s.msgBubble, ...(isAdmin ? s.msgBubbleAdmin : s.msgBubbleUser), opacity: m.pending ? 0.6 : 1 }}>
                      <div style={s.msgText}>{m.content}</div>
                      <div style={s.msgMeta}>
                        {time && <span style={s.msgTime}>{time}</span>}
                        {isAdmin && (
                          <span style={s.msgStatus}>
                            {m.pending ? "⏳" : m.status === "read" ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {userTyping && (
                <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                  <div style={s.msgAvatar}>{(activeUser.full_name || "U")[0].toUpperCase()}</div>
                  <div style={{ ...s.msgBubble, ...s.msgBubbleUser }}>
                    <div style={s.typingDots}>
                      <span style={s.typingDot} />
                      <span style={{ ...s.typingDot, animationDelay: "0.15s" }} />
                      <span style={{ ...s.typingDot, animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.inputBar}>
              <input
                style={s.replyInput}
                placeholder={`Reply to ${activeUser.full_name || activeUser.email}…`}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendReply())}
              />
              <button
                style={{ ...s.sendBtn, opacity: inputText.trim() ? 1 : 0.4 }}
                onClick={sendReply}
                disabled={!inputText.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* 🚨 NEW: Mobile Media Queries inside the style block */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        @media (max-width: 768px) {
          .mobile-sidebar {
            width: 100% !important;
            border-right: none !important;
          }
          .mobile-chatpanel {
            width: 100% !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .mobile-back-btn {
            display: flex !important;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Styles (CSS-in-JS)
// ─────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", height: "100vh", background: "#0f172a", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", overflow: "hidden" },

  // Sidebar
  sidebar:       { width: 320, borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarHeader: { padding: "20px 18px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" },
  sidebarTitle:  { display: "flex", alignItems: "center", gap: 8 },
  sidebarTitleText: { fontSize: 16, fontWeight: 700, color: "#f1f5f9" },
  badgePill:     { background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 10, padding: "1px 7px", lineHeight: "18px" },
  wsDot:         { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  wsLabel:       { fontSize: 11, color: "#64748b" },
  searchWrap:    { margin: "10px 12px 6px", background: "#1e293b", borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 12px", border: "1px solid #334155" },
  searchInput:   { flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13 },
  chatList:      { flex: 1, overflowY: "auto" },
  emptyState:    { padding: 32, textAlign: "center", color: "#475569", fontSize: 13 },

  // Chat item
  chatItem:      { display: "flex", alignItems: "center", padding: "12px 14px", cursor: "pointer", borderBottom: "1px solid #1a2535", transition: "background 0.15s", gap: 12 },
  chatItemActive: { background: "#1e293b" },
  avatarWrap:    { position: "relative", flexShrink: 0 },
  avatar:        { width: 42, height: 42, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: "#fff" },
  presenceDot:   { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", border: "2px solid #0f172a" },
  chatItemInfo:  { flex: 1, minWidth: 0 },
  chatItemRow:   { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 },
  chatItemName:  { fontSize: 13, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  chatItemTime:  { fontSize: 11, color: "#475569", flexShrink: 0 },
  chatItemPreview: { fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 },
  unreadBadge:   { background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", flexShrink: 0 },

  // Chat panel
  chatPanel:     { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  emptyChat:     { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },

  // Chat header
  chatHeader:    { padding: "14px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a" },
  chatHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff", flexShrink: 0 },
  chatHeaderName: { fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  chatHeaderSub:  { display: "flex", alignItems: "center", gap: 5, marginTop: 2 },

  // Messages
  messagesArea:  { flex: 1, overflowY: "auto", padding: "20px 20px 10px" },
  msgRow:        { display: "flex", alignItems: "flex-end", marginBottom: 14, gap: 8 },
  msgAvatar:     { width: 28, height: 28, borderRadius: "50%", background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", flexShrink: 0 },
  msgBubble:     { maxWidth: "72%", padding: "12px 14px", borderRadius: 18, lineHeight: 1.5 },
  msgBubbleUser: { background: "#1e293b", borderBottomLeftRadius: 4, border: "1px solid #334155" },
  msgBubbleAdmin: { background: "#2563eb", borderBottomRightRadius: 4 },
  msgText:       { fontSize: 14, color: "#f1f5f9", wordBreak: "break-word" },
  msgMeta:       { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 5, marginTop: 4 },
  msgTime:       { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  msgStatus:     { fontSize: 10, color: "rgba(255,255,255,0.5)" },

  // Typing
  typingDots:    { display: "flex", gap: 4, alignItems: "center", height: 18 },
  typingDot:     { width: 8, height: 8, borderRadius: "50%", background: "#64748b", display: "inline-block", animation: "typingBounce 1.2s infinite ease-in-out" as any },

  // Input
  inputBar:      { padding: "12px 16px", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10, background: "#1e293b" },
  replyInput:    { flex: 1, background: "#0f172a", border: "1px solid #334155", borderRadius: 24, padding: "11px 18px", color: "#f1f5f9", fontSize: 14, outline: "none" },
  sendBtn:       { width: 44, height: 44, borderRadius: "50%", background: "#2563eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "opacity 0.2s" },
};