// chats.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadChatList(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    // --- 1. INJECT CHAT OPTIONS BOTTOM SHEET (Z-INDEX 200) ---
    if (!document.getElementById('chat-options-modal')) {
        const modalHtml = `
            <div id="chat-options-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] hidden flex-col justify-end px-4 pb-6 transition-opacity duration-300 opacity-0" onclick="window.chatAPI.closeOptions(event)">
                <div id="chat-options-card" class="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 w-full max-w-md mx-auto rounded-[24px] p-2 shadow-2xl transform translate-y-full transition-transform duration-300 flex flex-col gap-1" onclick="event.stopPropagation()">
                    
                    <div class="w-12 h-1 bg-gray-300 dark:bg-white/20 rounded-full mx-auto my-2 mb-4"></div>
                    
                    <div class="px-4 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
                        <img id="opt-chat-pfp" src="" class="w-10 h-10 rounded-full object-cover">
                        <div>
                            <h4 id="opt-chat-name" class="text-sm font-bold text-gray-900 dark:text-white">User Name</h4>
                            <p class="text-[10px] opacity-50 font-bold uppercase tracking-widest">Chat Options</p>
                        </div>
                    </div>

                    <div class="p-2 flex flex-col gap-1">
                        <button onclick="window.chatAPI.action('pin')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-sm font-bold text-gray-800 dark:text-white">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            <span id="opt-text-pin">Pin Chat</span>
                        </button>
                        <button onclick="window.chatAPI.action('archive')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-sm font-bold text-gray-800 dark:text-white">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                            <span id="opt-text-archive">Archive</span>
                        </button>
                        <button onclick="window.chatAPI.action('mute')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-sm font-bold text-gray-800 dark:text-white">
                            <svg class="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>
                            <span>Mute Notifications</span>
                        </button>
                        <button onclick="window.chatAPI.action('delete')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold text-red-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            <span>Delete Chat</span>
                        </button>
                        <button onclick="window.chatAPI.action('block')" class="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold text-red-500">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                            <span>Block User</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // STATE VARIABLES
    let allChats = [];
    let currentCategory = 'all'; // Default
    let currentSearchQuery = '';
    let selectedChatId = null;

    // --- 2. RENDER LOGIC ---
    const renderChats = () => {
        let filtered = allChats.filter(chat => {
            // Category Filter Logic
            if (currentCategory === 'archived' && !chat.isArchived) return false;
            if (currentCategory !== 'archived' && chat.isArchived) return false;
            
            if (currentCategory === 'groups' && chat.type !== 'group') return false;
            if (currentCategory === 'channels' && chat.type !== 'channel') return false;
            
            // Search Filter Logic
            if (currentSearchQuery) {
                return chat.name.toLowerCase().includes(currentSearchQuery) || 
                       chat.lastMessage.toLowerCase().includes(currentSearchQuery);
            }
            return true;
        });

        // Sort by pinned first, then time
        filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0; // In real app, compare timestamps here
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 opacity-40">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <p class="text-xs font-bold tracking-widest uppercase">No Chats Found</p>
                </div>
            `;
            return;
        }

        let html = '<div class="flex flex-col px-2 pb-10">';
        
        filtered.forEach(chat => {
            const pinIcon = chat.isPinned ? `<svg class="w-3.h h-3.5 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>` : '';
            const muteIcon = chat.isMuted ? `<svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg>` : '';
            const unreadBadge = chat.unread > 0 ? `<div class="bg-electric text-white text-[10px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1.5 shadow-sm">${chat.unread}</div>` : '';
            
            const msgClass = chat.unread > 0 ? "font-bold text-gray-900 dark:text-white" : "font-medium opacity-60";

            html += `
                <div class="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors group relative" onclick="window.location.href='chatview.html?id=${chat.id}'">
                    
                    <div class="relative shrink-0">
                        <img src="${chat.pfp}" class="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-white/10">
                        ${chat.isOnline ? `<div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-[#0a0a0a] rounded-full"></div>` : ''}
                    </div>

                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <div class="flex justify-between items-baseline mb-0.5">
                            <h3 class="text-sm font-bold truncate pr-2">${chat.name}</h3>
                            <span class="text-[10px] font-bold opacity-40 shrink-0">${chat.time}</span>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <p class="text-xs truncate flex-1 ${msgClass}">${chat.lastMessage}</p>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${muteIcon}
                                ${pinIcon}
                                ${unreadBadge}
                            </div>
                        </div>
                    </div>

                    <button onclick="event.stopPropagation(); window.chatAPI.openOptions('${chat.id}')" class="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-white/10 transition-all absolute right-2">
                        <svg class="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    };

    // --- 3. EVENT LISTENERS FOR FILTERS ---
    window.addEventListener('onChatSearch', (e) => {
        currentSearchQuery = e.detail.query;
        renderChats();
    });

    window.addEventListener('onCategoryChange', (e) => {
        currentCategory = e.detail.category;
        renderChats();
    });

    // --- 4. GLOBAL API FOR ACTIONS ---
    window.chatAPI = {
        openOptions: (chatId) => {
            selectedChatId = chatId;
            const chat = allChats.find(c => c.id === chatId);
            
            document.getElementById('opt-chat-pfp').src = chat.pfp;
            document.getElementById('opt-chat-name').innerText = chat.name;
            document.getElementById('opt-text-pin').innerText = chat.isPinned ? "Unpin Chat" : "Pin Chat";
            document.getElementById('opt-text-archive').innerText = chat.isArchived ? "Unarchive" : "Archive";

            const modal = document.getElementById('chat-options-modal');
            const card = document.getElementById('chat-options-card');
            
            modal.classList.remove('hidden'); modal.classList.add('flex');
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0'); modal.classList.add('opacity-100');
                card.classList.remove('translate-y-full'); card.classList.add('translate-y-0');
            });
        },
        
        closeOptions: (e) => {
            // Prevent closing if clicked inside the card
            if (e && e.target.id !== 'chat-options-modal') return;
            
            const modal = document.getElementById('chat-options-modal');
            const card = document.getElementById('chat-options-card');
            
            modal.classList.remove('opacity-100'); modal.classList.add('opacity-0');
            card.classList.remove('translate-y-0'); card.classList.add('translate-y-full');
            setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300);
        },

        action: async (type) => {
            if (!selectedChatId) return;
            const chatIndex = allChats.findIndex(c => c.id === selectedChatId);
            if (chatIndex === -1) return;

            if (type === 'pin') {
                allChats[chatIndex].isPinned = !allChats[chatIndex].isPinned;
            } 
            else if (type === 'archive') {
                allChats[chatIndex].isArchived = !allChats[chatIndex].isArchived;
            } 
            else if (type === 'mute') {
                window.chatAPI.closeOptions();
                // 🚀 DYNAMIC MUTE.JS LOADER
                try {
                    const muteModule = await import('./mute.js');
                    if (muteModule && muteModule.initMute) {
                        muteModule.initMute(selectedChatId);
                    }
                } catch (err) {
                    alert("Muting logic loaded: mute.js required for UI overlay.");
                }
                return;
            }
            else if (type === 'delete') {
                if(confirm(`Are you sure you want to delete chat with ${allChats[chatIndex].name}?`)) {
                    allChats.splice(chatIndex, 1); // Remove from array
                }
            }
            else if (type === 'block') {
                if(confirm(`Block ${allChats[chatIndex].name}? You will not receive messages.`)) {
                    allChats.splice(chatIndex, 1);
                }
            }

            renderChats(); // Update UI
            window.chatAPI.closeOptions(); // Close Modal
        }
    };

    // --- 5. INITIAL DATA FETCH ---
    onAuthStateChanged(auth, async (user) => {
        if (!user) { container.innerHTML = ''; return; }

        try {
            // In a real scenario: Fetch from db "chats" collection where user is a participant.
            // For now, setting up Mock Data that represents real Firestore structure.
            
            allChats = [
                { id: 'c1', name: 'Zoro', pfp: 'https://i.pravatar.cc/150?u=1', lastMessage: 'Bhai rasta bhatak gaya', time: '10:42 AM', unread: 2, isOnline: true, isPinned: true, isArchived: false, isMuted: false, type: 'user' },
                { id: 'c2', name: 'Dev Team Alpha', pfp: 'https://i.pravatar.cc/150?u=grp', lastMessage: 'Build failed on vercel.', time: '09:15 AM', unread: 5, isOnline: false, isPinned: false, isArchived: false, isMuted: true, type: 'group' },
                { id: 'c3', name: 'Artist Hub Updates', pfp: 'logo.png', lastMessage: 'Version 2.0 is live!', time: 'Yesterday', unread: 0, isOnline: true, isPinned: false, isArchived: false, isMuted: false, type: 'channel' },
                { id: 'c4', name: 'Naruto', pfp: 'https://i.pravatar.cc/150?u=2', lastMessage: 'Ramen khane chalega?', time: 'Tuesday', unread: 0, isOnline: false, isPinned: false, isArchived: true, isMuted: false, type: 'user' },
                { id: 'c5', name: 'Goku', pfp: 'https://i.pravatar.cc/150?u=3', lastMessage: 'Sent an attachment', time: 'Mon', unread: 1, isOnline: true, isPinned: false, isArchived: false, isMuted: false, type: 'user' }
            ];

            renderChats();

        } catch (err) {
            console.error("Error loading chats:", err);
            container.innerHTML = '<p class="text-center text-xs opacity-50 p-4">Error loading messages.</p>';
        }
    });
}
