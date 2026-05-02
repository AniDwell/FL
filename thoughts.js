// thoughts.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, updateDoc, arrayUnion, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadThoughts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();
    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    // --- INJECT CUSTOM MODALS (Z-INDEX 200) ---
    if (!document.getElementById('thoughts-modals-wrapper')) {
        const modalWrapper = document.createElement('div');
        modalWrapper.id = 'thoughts-modals-wrapper';
        modalWrapper.innerHTML = `
            <div id="modal-create-thought" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] hidden flex-col items-center justify-center px-4 transition-opacity duration-300 opacity-0">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform scale-95 transition-transform duration-300" id="create-thought-card">
                    <h3 class="text-lg font-bold mb-4 text-center" id="create-modal-title">Share a Thought</h3>
                    
                    <div class="flex justify-center gap-3 mb-4" id="color-picker">
                        <button onclick="window.tAPI.pickColor('rgba(255,255,255,0.15)', this)" class="w-8 h-8 rounded-full bg-white/20 border-2 border-white focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(0,82,255,0.6)', this)" class="w-8 h-8 rounded-full bg-electric border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(220,38,38,0.6)', this)" class="w-8 h-8 rounded-full bg-red-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(22,163,74,0.6)', this)" class="w-8 h-8 rounded-full bg-green-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                        <button onclick="window.tAPI.pickColor('rgba(147,51,234,0.6)', this)" class="w-8 h-8 rounded-full bg-purple-600 border-2 border-transparent focus:outline-none ring-2 ring-transparent transition-all"></button>
                    </div>

                    <div class="relative w-full">
                        <textarea id="thought-input-text" rows="2" maxlength="60" placeholder="What's on your mind?" class="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-electric resize-none mb-4 text-center font-bold"></textarea>
                        <button onclick="window.tAPI.openEmojiPicker()" class="absolute -top-3 -right-2 bg-[#111] border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg hover:scale-110 transition-transform z-10" id="current-status-emoji">😀</button>
                    </div>
                    
                    <div class="flex gap-3">
                        <button onclick="window.tAPI.closeModal('modal-create-thought', 'create-thought-card')" class="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-bold transition-colors">Cancel</button>
                        <button onclick="window.tAPI.submitThought()" class="flex-1 bg-electric hover:bg-blue-600 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-lg shadow-electric/20">Share</button>
                    </div>
                </div>
            </div>

            <div id="modal-emoji-picker" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[210] hidden flex-col items-center justify-center px-4 transition-opacity duration-300 opacity-0">
                <div class="bg-[#111] border border-white/10 w-full max-w-[250px] rounded-[24px] p-5 shadow-2xl transform scale-95 transition-transform duration-300" id="emoji-picker-card">
                    <h3 class="text-sm font-bold mb-4 text-center opacity-70">Pick a Status</h3>
                    <div class="grid grid-cols-4 gap-4 text-2xl text-center mb-4">
                        <button onclick="window.tAPI.selectEmoji('🔥')" class="hover:scale-125 transition-transform">🔥</button>
                        <button onclick="window.tAPI.selectEmoji('✨')" class="hover:scale-125 transition-transform">✨</button>
                        <button onclick="window.tAPI.selectEmoji('😴')" class="hover:scale-125 transition-transform">😴</button>
                        <button onclick="window.tAPI.selectEmoji('🎵')" class="hover:scale-125 transition-transform">🎵</button>
                        <button onclick="window.tAPI.selectEmoji('💻')" class="hover:scale-125 transition-transform">💻</button>
                        <button onclick="window.tAPI.selectEmoji('🎮')" class="hover:scale-125 transition-transform">🎮</button>
                        <button onclick="window.tAPI.selectEmoji('💔')" class="hover:scale-125 transition-transform">💔</button>
                        <button onclick="window.tAPI.selectEmoji('🍔')" class="hover:scale-125 transition-transform">🍔</button>
                    </div>
                    <input type="text" id="manual-emoji-input" maxlength="2" placeholder="Type..." class="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-center text-lg outline-none mb-3">
                    <button onclick="window.tAPI.selectEmoji(document.getElementById('manual-emoji-input').value)" class="w-full bg-white/10 py-2 rounded-xl text-sm font-bold">Set Custom</button>
                </div>
            </div>

            <div id="modal-manage-thought" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] hidden flex-col items-center justify-end sm:justify-center transition-opacity duration-300 opacity-0 pb-10 sm:pb-0 px-4">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform translate-y-10 sm:translate-y-0 sm:scale-95 transition-all duration-300 flex flex-col max-h-[80vh]" id="manage-thought-card">
                    
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold">Your Note</h3>
                        <button onclick="window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card')" class="text-white/50 hover:text-white p-1"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>

                    <div class="bg-black/50 border border-white/5 p-4 rounded-2xl mb-4 flex flex-col items-center relative">
                        <div id="manage-preview-text" class="text-sm font-bold text-center px-3 py-2 rounded-xl mb-3 shadow-md max-w-full break-words w-full"></div>
                        <button onclick="window.tAPI.switchToEdit()" class="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-xs font-bold transition-colors">Edit Note</button>
                    </div>
                    
                    <div class="flex justify-between text-xs opacity-50 mb-2 font-bold px-1">
                        <span id="manage-likes-count">0 Likes</span>
                        <span id="manage-replies-count">0 Replies</span>
                    </div>
                    <div id="manage-replies-list" class="flex-1 overflow-y-auto mb-4 bg-black/30 rounded-xl p-3 flex flex-col gap-3 hide-scrollbar border border-white/5 min-h-[150px]">
                        </div>

                    <button onclick="window.tAPI.deleteThought()" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl text-sm font-bold transition-colors">Delete Note</button>
                </div>
            </div>

            <div id="modal-view-thought" class="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] hidden flex-col items-center justify-center px-4 transition-opacity duration-300 opacity-0">
                <div class="bg-[#111] border border-white/10 w-full max-w-sm rounded-[24px] p-5 shadow-2xl transform scale-95 transition-transform duration-300" id="view-thought-card">
                    
                    <div class="flex flex-col items-center mb-6 relative">
                        <div class="relative">
                            <img id="view-thought-pfp" class="w-20 h-20 rounded-full border-2 border-[#0a0a0a] shadow-lg mb-3">
                            <span id="view-thought-emoji" class="absolute -top-2 -right-2 text-2xl drop-shadow-lg rotate-[15deg] hidden z-30"></span>
                            <div class="absolute bottom-3 right-1 w-4 h-4 bg-green-500 border-2 border-[#111] rounded-full z-20"></div>
                        </div>
                        <div id="view-thought-text" class="text-[15px] font-bold text-center px-4 py-3 rounded-2xl w-full max-w-full break-words shadow-lg leading-snug"></div>
                        <span id="view-thought-username" class="text-xs opacity-50 font-bold tracking-widest uppercase mt-3"></span>
                    </div>

                    <div class="flex justify-center gap-3 mb-6">
                        <button onclick="window.tAPI.reactThought('❤️')" class="text-2xl hover:scale-125 transition-transform active:scale-90 drop-shadow-md">❤️</button>
                        <button onclick="window.tAPI.reactThought('😂')" class="text-2xl hover:scale-125 transition-transform active:scale-90 drop-shadow-md">😂</button>
                        <button onclick="window.tAPI.reactThought('🔥')" class="text-2xl hover:scale-125 transition-transform active:scale-90 drop-shadow-md">🔥</button>
                        <button onclick="window.tAPI.reactThought('😮')" class="text-2xl hover:scale-125 transition-transform active:scale-90 drop-shadow-md">😮</button>
                        <button onclick="window.tAPI.reactThought('😢')" class="text-2xl hover:scale-125 transition-transform active:scale-90 drop-shadow-md">😢</button>
                    </div>

                    <div class="flex gap-3 mb-4">
                        <input type="text" id="reply-input-text" placeholder="Send a reply..." class="flex-1 bg-black border border-white/10 rounded-xl px-4 text-sm outline-none focus:border-electric">
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
            .status-tilted {
                position: absolute; top: -45px; right: 0px; font-size: 16px;
                transform: rotate(15deg); filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.8)); z-index: 30;
            }
        </style>
    `;

    let currentUserData = null;
    let selectedColor = 'rgba(255,255,255,0.15)';
    let selectedEmoji = '';
    let currentViewingThoughtId = null;
    
    // Global State for Pagination & Filtering
    window.tAPI = window.tAPI || {};
    window.tAPI.cachedThoughts = {};
    window.tAPI.filteredThoughts = [];
    window.tAPI.visibleCount = 15; // Initial load count
    window.tAPI.myThought = null;
    window.tAPI.myPfp = pfpPlaceholder;

    onAuthStateChanged(auth, async (user) => {
        if (!user) { container.innerHTML = ''; return; }

        try {
            // 1. Fetch User Data (to get 'following' list)
            const userDoc = await getDoc(doc(db, "users", user.uid));
            currentUserData = userDoc.exists() ? userDoc.data() : { uid: user.uid, following: [] };
            window.tAPI.myPfp = currentUserData.photoURL || pfpPlaceholder;
            const followingList = currentUserData.following || []; // Array of UIDs user follows

            // 2. Fetch My Own Thought
            const myThoughtDoc = await getDoc(doc(db, "thoughts", user.uid));
            window.tAPI.myThought = myThoughtDoc.exists() ? myThoughtDoc.data() : null;
            if(window.tAPI.myThought) window.tAPI.cachedThoughts[user.uid] = window.tAPI.myThought;

            // 3. Fetch All Recent Thoughts & Filter by Following
            const q = query(collection(db, "thoughts"), orderBy("timestamp", "desc"));
            const snapshot = await getDocs(q);
            
            let allFollowedThoughts = [];
            snapshot.forEach(d => {
                if (d.id !== user.uid && followingList.includes(d.id)) {
                    allFollowedThoughts.push({ id: d.id, ...d.data() });
                    window.tAPI.cachedThoughts[d.id] = { id: d.id, ...d.data() };
                }
            });
            window.tAPI.filteredThoughts = allFollowedThoughts;

            // Render function so we can re-render on "Load More"
            window.tAPI.renderSlider = () => {
                let html = styleHTML + `<div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-14 pb-2">`;

                // --- RENDER MY THOUGHT ---
                if (window.tAPI.myThought) {
                    const t = window.tAPI.myThought;
                    const statusHTML = t.statusEmoji ? `<div class="status-tilted">${t.statusEmoji}</div>` : '';
                    html += `
                        <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openManageModal()">
                            ${statusHTML}
                            <div class="thought-bubble" style="background: ${t.bgColor}; border-color: ${t.bgColor}">${t.text}</div>
                            <div class="relative w-[64px] h-[64px]">
                                <div class="w-full h-full rounded-full p-[2px] border border-gray-400 dark:border-white/30 active:scale-95 transition-transform">
                                    <img src="${window.tAPI.myPfp}" class="w-full h-full rounded-full object-cover">
                                </div>
                                <div class="absolute bottom-1 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white dark:border-[#111] rounded-full z-20"></div>
                            </div>
                            <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your note</span>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openCreateModal()">
                            <div class="relative w-[64px] h-[64px]">
                                <div class="w-full h-full rounded-full p-[2px] border border-transparent active:scale-95 transition-transform">
                                    <img src="${window.tAPI.myPfp}" class="w-full h-full rounded-full object-cover grayscale-[30%]">
                                </div>
                                <div class="absolute top-0 -right-1 bg-gray-100 dark:bg-[#111] text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-sm z-20">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <div class="absolute bottom-1 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white dark:border-[#111] rounded-full z-20"></div>
                            </div>
                            <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Leave note</span>
                        </div>
                    `;
                }

                // --- RENDER OTHERS' THOUGHTS (Paginated) ---
                const visibleThoughts = window.tAPI.filteredThoughts.slice(0, window.tAPI.visibleCount);
                
                visibleThoughts.forEach(thought => {
                    const isViewed = thought.viewedBy && thought.viewedBy.includes(user.uid);
                    const borderClass = isViewed ? "border-[1.5px] border-gray-400 dark:border-white/20" : "border-[2.5px] border-electric dark:border-white";
                    const statusHTML = thought.statusEmoji ? `<div class="status-tilted">${thought.statusEmoji}</div>` : '';
                    
                    // Note: Assuming followed users are online for this UI. You can conditionally render the green dot based on a DB field.
                    html += `
                        <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.openViewModal('${thought.id}')">
                            ${statusHTML}
                            <div class="thought-bubble" style="background: ${thought.bgColor}; border-color: ${thought.bgColor}">${thought.text}</div>
                            <div class="relative w-[64px] h-[64px]">
                                <div class="w-full h-full rounded-full p-[2px] ${borderClass} active:scale-95 transition-transform">
                                    <img src="${thought.photoURL || pfpPlaceholder}" class="w-full h-full rounded-full object-cover border border-transparent dark:border-[#0a0a0a]">
                                </div>
                                <div class="absolute bottom-1 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-white dark:border-[#111] rounded-full z-20"></div>
                            </div>
                            <span class="text-[10px] font-bold opacity-80 truncate w-16 text-center">${thought.username}</span>
                        </div>
                    `;
                });

                // --- LOAD MORE BUTTON ---
                if (window.tAPI.filteredThoughts.length > window.tAPI.visibleCount) {
                    html += `
                        <div class="flex flex-col items-center justify-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.tAPI.loadMore()">
                            <div class="w-12 h-12 rounded-full bg-black/10 dark:bg-white/5 border border-gray-300 dark:border-white/10 flex items-center justify-center active:scale-95 transition-transform">
                                <svg class="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                            <span class="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-1">More</span>
                        </div>
                    `;
                }

                html += `</div>`;
                container.innerHTML = html;
            };

            // Initial Render
            window.tAPI.renderSlider();

            // --- API METHODS ---
            window.tAPI.loadMore = () => {
                window.tAPI.visibleCount += 15;
                window.tAPI.renderSlider();
            };

            window.tAPI.openModal = (modalId, cardId) => {
                const m = document.getElementById(modalId); const c = document.getElementById(cardId);
                m.classList.remove('hidden'); m.classList.add('flex');
                requestAnimationFrame(() => { m.classList.remove('opacity-0'); m.classList.add('opacity-100'); c.classList.remove('scale-95', 'translate-y-10'); c.classList.add('scale-100', 'translate-y-0'); });
            };
            window.tAPI.closeModal = (modalId, cardId, callback) => {
                const m = document.getElementById(modalId); const c = document.getElementById(cardId);
                m.classList.remove('opacity-100'); m.classList.add('opacity-0'); c.classList.remove('scale-100', 'translate-y-0'); c.classList.add('scale-95', 'translate-y-10');
                setTimeout(() => { m.classList.remove('flex'); m.classList.add('hidden'); if(callback) callback(); }, 300);
            };

            // Add/Edit
            window.tAPI.openCreateModal = (isEdit = false) => { 
                const t = window.tAPI.cachedThoughts[user.uid];
                document.getElementById('create-modal-title').innerText = isEdit ? "Edit Note" : "Share a Thought";
                document.getElementById('thought-input-text').value = (isEdit && t) ? t.text : "";
                selectedColor = (isEdit && t) ? t.bgColor : 'rgba(255,255,255,0.15)';
                selectedEmoji = (isEdit && t && t.statusEmoji) ? t.statusEmoji : '😀';
                
                document.getElementById('thought-input-text').style.backgroundColor = selectedColor;
                document.getElementById('current-status-emoji').innerText = selectedEmoji;
                window.tAPI.openModal('modal-create-thought', 'create-thought-card'); 
            };
            window.tAPI.switchToEdit = () => {
                window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card', () => { window.tAPI.openCreateModal(true); });
            };
            window.tAPI.pickColor = (color, btnElement) => {
                selectedColor = color;
                const btns = document.getElementById('color-picker').children;
                for(let b of btns) { b.classList.remove('border-white'); b.classList.add('border-transparent'); }
                btnElement.classList.remove('border-transparent'); btnElement.classList.add('border-white');
                document.getElementById('thought-input-text').style.backgroundColor = color;
            };
            window.tAPI.openEmojiPicker = () => {
                document.getElementById('manual-emoji-input').value = "";
                window.tAPI.closeModal('modal-create-thought', 'create-thought-card', () => { window.tAPI.openModal('modal-emoji-picker', 'emoji-picker-card'); });
            };
            window.tAPI.selectEmoji = (emojiStr) => {
                if(!emojiStr) return;
                selectedEmoji = emojiStr;
                document.getElementById('current-status-emoji').innerText = selectedEmoji;
                window.tAPI.closeModal('modal-emoji-picker', 'emoji-picker-card', () => { window.tAPI.openModal('modal-create-thought', 'create-thought-card'); });
            };
            window.tAPI.submitThought = async () => {
                const text = document.getElementById('thought-input-text').value.trim();
                if (!text) return;
                const t = window.tAPI.cachedThoughts[user.uid] || { likes: [], replies: [], viewedBy: [] }; 
                await setDoc(doc(db, "thoughts", user.uid), {
                    uid: user.uid, username: currentUserData.username || 'You', photoURL: window.tAPI.myPfp,
                    text: text, bgColor: selectedColor, statusEmoji: selectedEmoji === '😀' ? null : selectedEmoji,
                    timestamp: new Date().toISOString(), likes: t.likes, replies: t.replies, viewedBy: t.viewedBy
                });
                window.tAPI.closeModal('modal-create-thought', 'create-thought-card');
                loadThoughts(containerId); // Refresh whole widget
            };

            // Manage
            window.tAPI.openManageModal = () => {
                const t = window.tAPI.cachedThoughts[user.uid];
                if(!t) return;
                const preview = document.getElementById('manage-preview-text');
                preview.innerText = t.text; preview.style.backgroundColor = t.bgColor; preview.style.border = `1px solid ${t.bgColor}`;
                document.getElementById('manage-likes-count').innerText = `${t.likes ? t.likes.length : 0} Likes`;
                document.getElementById('manage-replies-count').innerText = `${t.replies ? t.replies.length : 0} Replies`;
                
                const list = document.getElementById('manage-replies-list');
                if (t.replies && t.replies.length > 0) {
                    list.innerHTML = t.replies.map(r => `
                        <div class="flex gap-2 mb-1">
                            <img src="${r.pfp || pfpPlaceholder}" class="w-7 h-7 rounded-full shrink-0">
                            <div class="bg-white/10 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%]">
                                <span class="text-[9px] font-bold opacity-50 block mb-0.5">${r.username}</span>
                                <span class="text-xs leading-snug">${r.text}</span>
                            </div>
                        </div>
                    `).join('');
                    setTimeout(() => list.scrollTop = list.scrollHeight, 100);
                } else { list.innerHTML = `<p class="text-xs text-center opacity-40 mt-8">No replies yet.</p>`; }
                window.tAPI.openModal('modal-manage-thought', 'manage-thought-card');
            };
            window.tAPI.deleteThought = async () => {
                await deleteDoc(doc(db, "thoughts", user.uid));
                window.tAPI.closeModal('modal-manage-thought', 'manage-thought-card');
                loadThoughts(containerId);
            };

            // View Others
            window.tAPI.openViewModal = async (uid) => {
                currentViewingThoughtId = uid;
                const t = window.tAPI.cachedThoughts[uid];
                document.getElementById('view-thought-pfp').src = t.photoURL || pfpPlaceholder;
                document.getElementById('view-thought-username').innerText = t.username;
                const textEl = document.getElementById('view-thought-text');
                textEl.innerText = t.text; textEl.style.backgroundColor = t.bgColor; textEl.style.border = `1px solid ${t.bgColor}`;
                
                const emojiEl = document.getElementById('view-thought-emoji');
                if(t.statusEmoji) { emojiEl.innerText = t.statusEmoji; emojiEl.classList.remove('hidden'); } 
                else { emojiEl.classList.add('hidden'); }

                window.tAPI.openModal('modal-view-thought', 'view-thought-card');
                if (!t.viewedBy || !t.viewedBy.includes(user.uid)) {
                    await updateDoc(doc(db, "thoughts", uid), { viewedBy: arrayUnion(user.uid) });
                    t.viewedBy = [...(t.viewedBy||[]), user.uid]; 
                }
            };
            window.tAPI.reactThought = async (emojiReaction) => {
                const uid = currentViewingThoughtId;
                const replyObj = { uid: user.uid, username: currentUserData.username, pfp: window.tAPI.myPfp, text: `Reacted: ${emojiReaction}`, timestamp: new Date().toISOString() };
                await updateDoc(doc(db, "thoughts", uid), { replies: arrayUnion(replyObj) });
                await addDoc(collection(db, "notifications"), {
                    toUid: uid, fromUid: user.uid, fromUsername: currentUserData.username, fromPfp: window.tAPI.myPfp, type: "thought_reaction", message: `reacted to your note: ${emojiReaction}`, timestamp: serverTimestamp(), isRead: false
                });
                window.tAPI.closeModal('modal-view-thought', 'view-thought-card');
            };
            window.tAPI.sendReply = async () => {
                const uid = currentViewingThoughtId;
                const input = document.getElementById('reply-input-text');
                const text = input.value.trim();
                if(!text) return;
                const replyObj = { uid: user.uid, username: currentUserData.username, pfp: window.tAPI.myPfp, text: text, timestamp: new Date().toISOString() };
                await updateDoc(doc(db, "thoughts", uid), { replies: arrayUnion(replyObj) });
                await addDoc(collection(db, "notifications"), {
                    toUid: uid, fromUid: user.uid, fromUsername: currentUserData.username, fromPfp: window.tAPI.myPfp, type: "thought_reply", message: `replied: "${text}"`, timestamp: serverTimestamp(), isRead: false
                });
                input.value = "";
                window.tAPI.closeModal('modal-view-thought', 'view-thought-card');
            };

        } catch (error) {
            console.error("Error loading thoughts:", error);
            container.innerHTML = '';
        }
    });
}
