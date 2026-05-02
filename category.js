// category.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    const styleHTML = `
        <style>
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .cat-active { background-color: #000; color: #fff; border-color: transparent; }
            .dark .cat-active { background-color: #fff; color: #000; }
            .cat-inactive { background-color: transparent; border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.6); }
            .dark .cat-inactive { border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
            
            /* Special Request Button Active State */
            .req-active { background-color: #0052FF !important; color: white !important; border-color: transparent !important; }
            .req-active svg { color: white; opacity: 1; }
        </style>
    `;

    container.innerHTML = styleHTML + `
        <div class="w-full flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-2">
            
            <button id="btn-requests" onclick="window.cAPI.setCategory('requests', this)" class="category-pill relative flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] border border-gray-200 dark:border-white/10 shrink-0 active:scale-95 transition-all bg-white/50 dark:bg-white/5">
                <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                <span class="text-xs font-bold opacity-80">Requests</span>
                <span id="request-count-badge" class="hidden bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-0.5 transition-all">0</span>
            </button>

            <div class="w-[1px] h-5 bg-gray-300 dark:bg-white/20 shrink-0 mx-1"></div>

            <button onclick="window.cAPI.setCategory('all', this)" class="category-pill cat-active px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">All</button>
            <button onclick="window.cAPI.setCategory('archived', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Archived</button>
            <button onclick="window.cAPI.setCategory('groups', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Groups</button>
            <button onclick="window.cAPI.setCategory('channels', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Channels</button>
            
            <div class="w-2 shrink-0"></div>
        </div>
    `;

    window.cAPI = {
        setCategory: (categoryName, btnElement) => {
            const allPills = document.querySelectorAll('.category-pill');
            allPills.forEach(pill => {
                pill.classList.remove('cat-active', 'req-active');
                pill.classList.add(pill.id === 'btn-requests' ? 'bg-white/50' : 'cat-inactive');
            });

            if (categoryName === 'requests') {
                btnElement.classList.add('req-active');
            } else {
                btnElement.classList.remove('cat-inactive');
                btnElement.classList.add('cat-active');
            }

            const filterEvent = new CustomEvent('onCategoryChange', { detail: { category: categoryName } });
            window.dispatchEvent(filterEvent);
        }
    };

    let unsubscribeRequests = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const requestsRef = collection(db, "chat_requests");
            const q = query(requestsRef, where("toUid", "==", user.uid), where("status", "==", "pending"));

            unsubscribeRequests = onSnapshot(q, (snapshot) => {
                const requestCount = snapshot.size;
                const badge = document.getElementById('request-count-badge');
                
                if (badge) {
                    if (requestCount > 0) {
                        badge.innerText = requestCount > 99 ? '99+' : requestCount;
                        badge.classList.remove('hidden');
                        badge.classList.add('inline-flex', 'items-center', 'justify-center');
                    } else {
                        badge.classList.add('hidden');
                        badge.classList.remove('inline-flex', 'items-center', 'justify-center');
                    }
                }
            });
        } else {
            if (unsubscribeRequests) unsubscribeRequests();
        }
    });
}
