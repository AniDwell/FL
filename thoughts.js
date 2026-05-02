// thoughts.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, limit, updateDoc, arrayUnion, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadThoughts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();
    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    // Common Emojis for Reactions
    const commonEmojis = ['❤️', '🔥', '😂', '😢', '😍', '👏', '🙌', '👀'];

    // --- 1. INJECT CUSTOM MODALS (Highest Z-Index) ---
    if (!document.getElementById('thoughts-modals-wrapper')) {
        const modalWrapper = document.createElement('div');
        modalWrapper.id = 'thoughts-modals-wrapper';
        // Note the z-[9999] ensuring it's above the bottom-nav
        modalWrapper.className = "relative z-[9999]"; 
        modalWrapper.innerHTML = `
            <div id="modal-create-thought" class="fixed inset-0 bg-black/80 backdrop-blur-md hidden flex-col items-center justify-center px-4 transition-opacity duration-300 opacity-0">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform scale-95 transition-transform duration-300" id="create-thought-card">
                    <h3 class="text-lg font-bold mb-4 text-center" id="create-modal-title">Share a Thought</h3>
                    
                    <div class="flex justify-center gap-3 mb-4" id="color-picker">
                        <button onclick="window.tAPI.pickColor('rgba(255,255,255,0.15)', this)" class="w-8 h-8 rounded-full bg-white/20 border-2 border-white focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(0,82,255,0.6)', this)" class="w-8 h-8 rounded-full bg-electric border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(220,38,38,0.6)', this)" class="w-8 h-8 rounded-full bg-red-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(22,163,74,0.6)', this)" class="w-8 h-8 rounded-full bg-green-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(147,51,234,0.6)', this)" class="w-8 h-8 rounded-full bg-purple-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                    </div>

                    <textarea id="thought-input-text" rows="3" maxlength="100" placeholder="What's on your mind?" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-electric resize-none mb-4 text-center font-bold"></textarea>
                    
                    <div class="flex gap-3">
                        <button onclick="window.tAPI.closeModal('modal-create-thought', 'create-thought-card')" class="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                        <button onclick="window.tAPI.submitThought()" class="flex-1 bg-electric hover:bg-blue-600 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-lg shadow-electric/20">Share</button>
                    </div>
                </div>
            </div>

            <div id="modal-manage-thought" class="fixed inset-0 bg-black/80 backdrop-blur-md hidden flex-col items-center justify-end sm:justify-center transition-opacity duration-300 opacity-0 pb-10 sm:pb-0 px-4">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform translate-y-10 sm:translate-y-0 sm:scale-95 transition-all duration-300 flex flex-col max-h-[85vh]" id="manage-thought-card">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Manage Note</h3>
                        <button onclick="window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card')" class="text-white/50 hover:text-white p-1"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <div class="bg-black/40 border border-white/10 rounded-xl p-4 mb-4">
                        <p id="manage-current-text" class="text-sm font-bold text-center mb-3 break-words"></p>
                        <div class="flex gap-2">
                            <button onclick="window.tAPI.openEditModal()" class="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold transition-colors">Edit</button>
                            <button onclick="window.tAPI.deleteThought()" class="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 py-2 rounded-lg text-xs font-bold transition-colors">Delete</button>
                        </div>
                    </div>
                    
                    <div class="flex justify-between text-xs opacity-50 mb-2 font-bold px-1">
                        <span id="manage-reactions-count">0 Reactions</span>
                        <span id="manage-replies-count">0 Replies</span>
                    </div>
                    <div id="manage-replies-list" class="flex-1 overflow-y-auto mb-2 bg-black/40 rounded-xl p-3 flex flex-col gap-3 hide-scrollbar border border-white/5 min-h-[100px]">
                        </div>
                </div>
            </div>

            <div id="modal-view-thought" class="fixed inset-0 bg-black/80 backdrop-blur-md hidden flex-col items-center justify-center px-4 transition-opacity duration-300 opacity-0">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform scale-95 transition-transform duration-300 relative" id="view-thought-card">
                    
                    <div class="flex flex-col items-center mb-6">
                        <img id="view-thought-pfp" class="w-16 h-16 rounded-full border-2 border-[#0a0a0a] shadow-lg mb-3">
                        <div id="view-thought-text" class="text-lg font-bold text-center px-4 py-3 rounded-2xl w-full break-words max-h-48 overflow-y-auto hide-scrollbar"></div>
                        <span id="view-thought-username" class="text-xs opacity-50 font-bold tracking-widest uppercase mt-3"></span>
                    </div>

                    <div class="flex gap-2 mb-4">
                        <input type="text" id="reply-input-text" placeholder="Send a reply as a message..." class="flex-1 bg-black border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-electric">
                        
                        <button onclick="window.tAPI.toggleEmojiPicker()" class="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors active:scale-90 text-xl" title="React">
                            🙂
                        </button>
                    </div>
                    
                    <div id="emoji-picker" class="absolute bottom-20 right-5 bg-[#1a1a1a] border border-white/10 p-2 rounded-xl shadow-2xl hidden grid-cols-4 gap-2 z-50">
                        ${commonEmojis.map(e => `<button onclick="window.tAPI.reactEmoji('${e}')" class="text-2xl hover:scale-125 transition-transform p-1">${e}</button>`).join('')}
                    </div>

                    <div class="flex gap-3">
                        <button onclick="window.tAPI.closeModal('modal-view-thought', 'view-thought-card')" class="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-bold transition-colors">Close</button>
                        <button onclick="window.tAPI.sendReply()" class="flex-1 bg-electric hover:bg-blue-600 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-lg shadow-electric/20">Send</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalWrapper);
    }

    const styleHTML = `
        <style>
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .thought-bubble {
                position: absolute; top: -38px; left: 50%; transform: translateX(-50%);
                backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);
                color: white; font-size: 11px; font-weight: 600; padding: 6px 12px;
                border-radius: 14px; white-space: nowrap; max-width: 90px;
                overflow: hidden; text-overflow: ellipsis; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 20;
            }
            .thought-bubble::after {
                content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%);
                border-width: 5px 5px 0; border-style: solid;
                border-color: inherit; border-bottom-color: transparent !important; border-left-color: transparent !important; border-right-color: transparent !important;
            }
            .emoji-badge {
                position: absolute; top: -6px; right: -6px; font-size: 14px;
                background: #000; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 50%;
                width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
                transform: rotate(15deg); z-index: 30; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
        </style>
    `;

    // Global State
    let currentUserData = null;
    let selectedColor = 'rgba(255,255,255,0.15)';
    let currentViewingThoughtId = null;
    let cachedThoughts = {};

    onAuthStateChanged(auth, async (user) => {
        if (!user) { container.innerHTML = ''; return; }

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            currentUserData = userDoc.exists() ? userDoc.data() : { uid: user.uid };
            const myPfp = currentUserData.photoURL || pfpPlaceholder;

            const myThoughtDoc = await getDoc(doc(db, "thoughts", user.uid));
            const myThought = myThoughtDoc.exists() ? myThoughtDoc.data() : null;
            if(myThought) cachedThoughts[user.uid] = myThought;

            let othersThoughts = [];
            const q = query(collection(db, "thoughts"), limit(15));
            const snapshot = await getDocs(q);
            snapshot.forEach(d => {
                if (d.id !== user.uid) {
                    othersThoughts.push({ id: d.id, ...d.data() });
                    cachedThoughts[d.id] = { id: d.id, ...d.data() };
                }
            });

            let html = styleHTML + `<div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-12 pb-4">`;

            // MY THOUGHT
            if (myThought) {
                // Get my own latest reaction if exists
                let myReactionBadge = '';
                if (myThought.reactions && Object.keys(myThought.reactions).length > 0) {
                    const reactValues = Object.values(myThought.reactions);
                    myReactionBadge = `<div class="emoji-badge">${reactValues[reactValues.length - 1]}</div>`;
                }

                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openManageModal()">
                        <div class="thought-bubble" style="background: ${myThought.bgColor}; border-color: ${myThought.bgColor}">${myThought.text}</div>
                        <div class="relative w-[64px] h-[64px] rounded-full p-[2px] border border-gray-400 dark:border-white/30 active:scale-95 transition-transform">
                            <img src="${myPfp}" class="w-full h-full rounded-full object-cover">
                            ${myReactionBadge}
                        </div>
                        <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your note</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openCreateModal(false)">
                        <div class="w-[64px] h-[64px] rounded-full p-[2px] border border-transparent active:scale-95 transition-transform relative">
                            <img src="${myPfp}" class="w-full h-full rounded-full object-cover grayscale-[30%]">
                            <div class="absolute top-0 -right-1 bg-gray-100 dark:bg-[#111] text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-sm z-20">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Leave note</span>
                    </div>
                `;
            }

            // OTHERS THOUGHTS
            othersThoughts.forEach(thought => {
                const isViewed = thought.viewedBy && thought.viewedBy.includes(user.uid);
                const borderClass = isViewed ? "border-[1.5px] border-gray-400 dark:border-white/20" : "border-[2.5px] border-electric dark:border-white";
                
                let reactionBadge = '';
                if (thought.reactions && thought.reactions[user.uid]) {
                    // Show the reaction YOU left on their thought
                    reactionBadge = `<div class="emoji-badge">${thought.reactions[user.uid]}</div>`;
                } else if (thought.reactions && Object.keys(thought.reactions).length > 0) {
                    // Or show latest reaction left by anyone
                    const reactValues = Object.values(thought.reactions);
                    reactionBadge = `<div class="emoji-badge opacity-80">${reactValues[reactValues.length - 1]}</div>`;
                }

                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openViewModal('${thought.id}')">
                        <div class="thought-bubble" style="background: ${thought.bgColor}; border-color: ${thought.bgColor}">${thought.text}</div>
                        <div class="relative w-[64px] h-[64px] rounded-full p-[2px] ${borderClass} active:scale-95 transition-transform">
                            <img src="${thought.photoURL || pfpPlaceholder}" class="w-full h-full rounded-full object-cover border border-transparent dark:border-[#0a0a0a]">
                            ${reactionBadge}
                        </div>
                        <span class="text-[10px] font-bold opacity-80 truncate w-16 text-center">${thought.username}</span>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;


            // --- GLOBAL API FOR INLINE HTML CLICKS ---
            window.tAPI = {
                openModal: (modalId, cardId) => {
                    const m = document.getElementById(modalId); const c = document.getElementById(cardId);
                    document.getElementById('emoji-picker').style.display = 'none'; // reset picker
                    m.classList.remove('hidden'); m.classList.add('flex');
                    requestAnimationFrame(() => { m.classList.remove('opacity-0'); m.classList.add('opacity-100'); c.classList.remove('scale-95', 'translate-y-10'); c.classList.add('scale-100', 'translate-y-0'); });
                },
                closeModal: (modalId, cardId) => {
                    const m = document.getElementById(modalId); const c = document.getElementById(cardId);
                    m.classList.remove('opacity-100'); m.classList.add('opacity-0'); c.classList.remove('scale-100', 'translate-y-0'); c.classList.add('scale-95', 'translate-y-10');
                    setTimeout(() => { m.classList.remove('flex'); m.classList.add('hidden'); }, 300);
                },

                // 1. Create/Edit Thought
                openCreateModal: (isEdit = false) => { 
                    const title = document.getElementById('create-modal-title');
                    const input = document.getElementById('thought-input-text');
                    if(isEdit && cachedThoughts[user.uid]) {
                        title.innerText = "Edit Thought";
                        input.value = cachedThoughts[user.uid].text;
                        window.tAPI.pickColor(cachedThoughts[user.uid].bgColor, document.getElementById('color-picker').children[0]);
                    } else {
                        title.innerText = "Share a Thought";
                        input.value = "";
                        window.tAPI.pickColor('rgba(255,255,255,0.15)', document.getElementById('color-picker').children[0]);
                    }
                    window.tAPI.openModal('modal-create-thought', 'create-thought-card'); 
                },
                pickColor: (color, btnElement) => {
                    selectedColor = color;
                    const btns = document.getElementById('color-picker').children;
                    for(let b of btns) { b.classList.remove('border-white'); b.classList.add('border-transparent'); }
                    btnElement.classList.remove('border-transparent'); btnElement.classList.add('border-white');
                    document.getElementById('thought-input-text').style.backgroundColor = color;
                },
                submitThought: async () => {
                    const text = document.getElementById('thought-input-text').value.trim();
                    if (!text) return;
                    
                    const existingData = cachedThoughts[user.uid] || { reactions: {}, replies: [], viewedBy: [] };

                    await setDoc(doc(db, "thoughts", user.uid), {
                        uid: user.uid, username: currentUserData.username || 'You', photoURL: myPfp,
                        text: text, bgColor: selectedColor, timestamp: new Date().toISOString(),
                        reactions: existingData.reactions, replies: existingData.replies, viewedBy: existingData.viewedBy
                    });
                    
                    window.tAPI.closeModal('modal-create-thought', 'create-thought-card');
                    if (document.getElementById('modal-manage-thought').classList.contains('flex')) {
                        window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card');
                    }
                    loadThoughts(containerId); // Refresh
                },

                // 2. Manage Own Thought
                openManageModal: () => {
                    const t = cachedThoughts[user.uid];
                    if(!t) return;
                    
                    document.getElementById('manage-current-text').innerText = `"${t.text}"`;
                    document.getElementById('manage-reactions-count').innerText = `${t.reactions ? Object.keys(t.reactions).length : 0} Reactions`;
                    document.getElementById('manage-replies-count').innerText = `${t.replies ? t.replies.length : 0} Replies`;
                    
                    const list = document.getElementById('manage-replies-list');
                    if (t.replies && t.replies.length > 0) {
                        list.innerHTML = t.replies.map(r => `
                            <div class="flex items-center gap-3 border-b border-white/5 pb-2">
                                <img src="${r.pfp || pfpPlaceholder}" class="w-8 h-8 rounded-full border border-white/20">
                                <div class="flex flex-col">
                                    <span class="text-[10px] font-bold opacity-60">${r.username}</span>
                                    <span class="text-xs bg-white/10 px-2 py-1 rounded-md mt-1 inline-block">${r.text}</span>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        list.innerHTML = `<p class="text-xs text-center opacity-40 mt-4">No activity yet.</p>`;
                    }
                    window.tAPI.openModal('modal-manage-thought', 'manage-thought-card');
                },
                openEditModal: () => {
                    window.tAPI.openCreateModal(true);
                },
                deleteThought: async () => {
                    await deleteDoc(doc(db, "thoughts", user.uid));
                    window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card');
                    loadThoughts(containerId);
                },

                // 3. View/Interact Other's Thought
                openViewModal: async (uid) => {
                    currentViewingThoughtId = uid;
                    const t = cachedThoughts[uid];
                    
                    document.getElementById('view-thought-pfp').src = t.photoURL || pfpPlaceholder;
                    document.getElementById('view-thought-username').innerText = t.username;
                    
                    const textEl = document.getElementById('view-thought-text');
                    textEl.innerText = t.text;
                    textEl.style.backgroundColor = t.bgColor;
                    textEl.style.border = `1px solid ${t.bgColor}`;

                    window.tAPI.openModal('modal-view-thought', 'view-thought-card');

                    // Mark as viewed
                    if (!t.viewedBy || !t.viewedBy.includes(user.uid)) {
                        await updateDoc(doc(db, "thoughts", uid), { viewedBy: arrayUnion(user.uid) });
                    }
                },

                // EMOJI REACTIONS
                toggleEmojiPicker: () => {
                    const picker = document.getElementById('emoji-picker');
                    picker.style.display = picker.style.display === 'grid' ? 'none' : 'grid';
                },
                reactEmoji: async (emoji) => {
                    const uid = currentViewingThoughtId;
                    const t = cachedThoughts[uid];
                    
                    // Toggle off picker
                    document.getElementById('emoji-picker').style.display = 'none';

                    // Update local cache
                    if(!t.reactions) t.reactions = {};
                    t.reactions[user.uid] = emoji;

                    // 1. Update Thought Doc (Using dot notation for Maps/Objects)
                    await updateDoc(doc(db, "thoughts", uid), { 
                        [`reactions.${user.uid}`]: emoji 
                    });
                    
                    // 2. Send Notification
                    await addDoc(collection(db, "notifications"), {
                        toUid: uid, fromUid: user.uid, fromUsername: currentUserData.username,
                        fromPfp: myPfp, type: "thought_react", message: `reacted ${emoji} to your note.`,
                        timestamp: serverTimestamp(), isRead: false
                    });

                    window.tAPI.closeModal('modal-view-thought', 'view-thought-card');
                    loadThoughts(containerId); // Refresh to show tilted badge
                },

                // SEND REPLY (Links to CHATS logic)
                sendReply: async () => {
                    const uid = currentViewingThoughtId;
                    const input = document.getElementById('reply-input-text');
                    const text = input.value.trim();
                    if(!text) return;

                    const replyObj = {
                        uid: user.uid, username: currentUserData.username, pfp: myPfp,
                        text: text, timestamp: new Date().toISOString()
                    };

                    // 1. Update Thought Doc Replies
                    await updateDoc(doc(db, "thoughts", uid), { replies: arrayUnion(replyObj) });
                    
                    // 2. LINK TO CHATS SYSTEM (Crucial for chats.js to pick up)
                    const chatId = [user.uid, uid].sort().join('_');
                    await setDoc(doc(db, "chats", chatId), {
                        participants: [user.uid, uid],
                        lastMessage: `Replied to note: ${text}`,
                        lastUpdated: serverTimestamp()
                    }, { merge: true });

                    // 3. Send Notification
                    await addDoc(collection(db, "notifications"), {
                        toUid: uid, fromUid: user.uid, fromUsername: currentUserData.username,
                        fromPfp: myPfp, type: "thought_reply", message: `replied to your note: "${text}"`,
                        timestamp: serverTimestamp(), isRead: false
                    });

                    input.value = "";
                    window.tAPI.closeModal('modal-view-thought', 'view-thought-card');
                }
            };

        } catch (error) {
            console.error("Error loading thoughts:", error);
            container.innerHTML = '';
        }
    });
}
