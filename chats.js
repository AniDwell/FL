// chats.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, setDoc, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadChatList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();
    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    // --- BOTTOM SHEET INJECTION REMOVED FOR BREVITY (Keep your existing modal injection here) ---
    // (Assume the same chat-options-modal HTML is injected here as before)
    if (!document.getElementById('chat-options-modal')) {
        // Use your existing modal HTML block here
    }

    let allChats = [];
    let allRequests = [];
    let currentCategory = 'all'; 
    let currentSearchQuery = '';
    let selectedChatId = null;
    let currentUserId = null;

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER LOGIC ---
    const renderChats = () => {
        let displayList = [];
        let isRequestMode = (currentCategory === 'requests');

        if (isRequestMode) {
            displayList = allRequests.filter(req => {
                if (currentSearchQuery) {
                    return req.name.toLowerCase().includes(currentSearchQuery);
                }
                return true;
            });
        } else {
            displayList = allChats.filter(chat => {
                if (currentCategory === 'archived' && !chat.isArchived) return false;
                if (currentCategory !== 'archived' && chat.isArchived) return false;
                if (currentCategory === 'groups' && chat.type !== 'group') return false;
                if (currentCategory === 'channels' && chat.type !== 'channel') return false;
                if (currentSearchQuery) {
                    const nameMatch = chat.name ? chat.name.toLowerCase().includes(currentSearchQuery) : false;
                    const msgMatch = chat.lastMessage ? chat.lastMessage.toLowerCase().includes(currentSearchQuery) : false;
                    return nameMatch || msgMatch;
                }
                return true;
            });

            displayList.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0; 
            });
        }

        if (displayList.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 opacity-40">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${isRequestMode ? 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' : 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'}"></path></svg>
                    <p class="text-xs font-bold tracking-widest uppercase">${isRequestMode ? 'No Pending Requests' : 'No Chats Found'}</p>
                </div>
            `;
            return;
        }

        let html = '<div class="flex flex-col px-2 pb-10 gap-1">';
        
        displayList.forEach(chat => {
            const displayTime = formatTime(chat.timestamp);

            if (isRequestMode) {
                // UI for Requests: Inline Accept/Reject Buttons
                html += `
                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/5 cursor-pointer transition-colors" onclick="window.location.href='vchat.html?id=${chat.id}&req=true'">
                        <img src="${chat.pfp || pfpPlaceholder}" class="w-12 h-12 rounded-full object-cover shrink-0">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-bold truncate">${chat.name || 'Unknown'}</h3>
                            <p class="text-xs truncate opacity-60">${chat.lastMessage || 'Sent a message request'}</p>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-2">
                            <button onclick="event.stopPropagation(); window.chatAPI.handleRequest('${chat.id}', 'reject')" class="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <button onclick="event.stopPropagation(); window.chatAPI.handleRequest('${chat.id}', 'accept')" class="w-8 h-8 rounded-full bg-electric text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Normal Chat UI (With 3-dots)
                const pinIcon = chat.isPinned ? `<svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>` : '';
                const muteIcon = chat.isMuted ? `<svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>` : '';
                const unreadBadge = chat.unread > 0 ? `<div class="bg-electric text-white text-[10px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1.5 shadow-sm">${chat.unread}</div>` : '';
                const msgClass = chat.unread > 0 ? "font-bold text-gray-900 dark:text-white" : "font-medium opacity-60";

                html += `
                    <div class="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group relative" onclick="window.location.href='vchat.html?id=${chat.id}'">
                        <div class="relative shrink-0">
                            <img src="${chat.pfp || pfpPlaceholder}" class="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-white/10">
                            ${chat.isOnline ? `<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>` : ''}
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <div class="flex justify-between items-baseline mb-0.5">
                                <h3 class="text-sm font-bold truncate pr-2">${chat.name || 'Unknown'}</h3>
                                <span class="text-[10px] font-bold opacity-40 shrink-0">${displayTime}</span>
                            </div>
                            <div class="flex justify-between items-center gap-2">
                                <p class="text-xs truncate flex-1 ${msgClass}">${chat.lastMessage || '...'}</p>
                                <div class="flex items-center gap-1.5 shrink-0">${muteIcon}${pinIcon}${unreadBadge}</div>
                            </div>
                        </div>
                        <button onclick="event.stopPropagation(); window.chatAPI.openOptions('${chat.id}')" class="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 transition-all absolute right-2">
                            <svg class="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                        </button>
                    </div>
                `;
            }
        });

        html += '</div>';
        container.innerHTML = html;
    };

    // --- EVENT LISTENERS ---
    window.addEventListener('onChatSearch', (e) => { currentSearchQuery = e.detail.query; renderChats(); });
    window.addEventListener('onCategoryChange', (e) => { currentCategory = e.detail.category; renderChats(); });

    // --- GLOBAL API ---
    window.chatAPI = {
        openOptions: (chatId) => {
            // Keep your existing openOptions code here
        },
        closeOptions: (e) => {
            // Keep your existing closeOptions code here
        },
        action: async (type) => {
            // Keep your existing Action code (Pin/Archive/Mute) here
        },

        // NEW: Accept or Reject Request Logic
        handleRequest: async (reqId, actionStr) => {
            if (!currentUserId) return;
            
            const reqRef = doc(db, "chat_requests", reqId);
            const reqData = allRequests.find(r => r.id === reqId);

            try {
                if (actionStr === 'accept') {
                    // 1. Move to active chats collection
                    const newChatRef = doc(db, "users", currentUserId, "chats", reqId);
                    await setDoc(newChatRef, {
                        ...reqData,
                        isArchived: false,
                        isPinned: false,
                        isMuted: false,
                        acceptedAt: new Date().toISOString() // Just as a marker
                    });
                    
                    // 2. Delete from requests
                    await deleteDoc(reqRef);
                    alert("Request Accepted! Moved to active chats.");
                    
                } else if (actionStr === 'reject') {
                    // Just delete the request
                    await deleteDoc(reqRef);
                }

                // UI will automatically update via the onSnapshot listener below!
            } catch (error) {
                console.error("Action failed:", error);
                alert("Failed to process request.");
            }
        }
    };

    // --- REALTIME DATA FETCH (CHATS & REQUESTS) ---
    onAuthStateChanged(auth, (user) => {
        if (!user) { container.innerHTML = ''; return; }
        currentUserId = user.uid;

        // 1. Live Listen to Normal Chats
        const chatsRef = collection(db, "users", user.uid, "chats");
        const qChats = query(chatsRef, orderBy("timestamp", "desc"));
        onSnapshot(qChats, (snapshot) => {
            allChats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (currentCategory !== 'requests') renderChats();
        });

        // 2. Live Listen to Chat Requests
        const reqRef = collection(db, "chat_requests");
        const qReq = query(reqRef, where("toUid", "==", user.uid), where("status", "==", "pending"));
        onSnapshot(qReq, (snapshot) => {
            allRequests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            if (currentCategory === 'requests') renderChats();
        });
    });
}
