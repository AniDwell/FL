// category.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    // Custom CSS for hiding scrollbar
    const styleHTML = `
        <style>
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .cat-active {
                background-color: #000; color: #fff; border-color: transparent;
            }
            .dark .cat-active {
                background-color: #fff; color: #000;
            }
            .cat-inactive {
                background-color: transparent; border-color: rgba(0,0,0,0.1); color: rgba(0,0,0,0.6);
            }
            .dark .cat-inactive {
                border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);
            }
        </style>
    `;

    // Render the UI instantly
    container.innerHTML = styleHTML + `
        <div class="w-full flex items-center gap-2.5 overflow-x-auto hide-scrollbar pb-2">
            
            <button onclick="window.cAPI.openRequests()" class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-[14px] border border-gray-200 dark:border-white/10 shrink-0 active:scale-95 transition-transform bg-white/50 dark:bg-white/5">
                <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                <span class="text-xs font-bold opacity-80">Requests</span>
                <span id="request-count-badge" class="hidden bg-electric text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-0.5">0</span>
            </button>

            <div class="w-[1px] h-5 bg-gray-300 dark:bg-white/20 shrink-0 mx-1"></div>

            <button onclick="window.cAPI.setCategory('all', this)" class="category-pill cat-active px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">All</button>
            <button onclick="window.cAPI.setCategory('archived', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Archived</button>
            <button onclick="window.cAPI.setCategory('groups', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Groups</button>
            <button onclick="window.cAPI.setCategory('channels', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Channels</button>
            
            <div class="w-2 shrink-0"></div>
        </div>
    `;

    // --- GLOBAL API FOR CATEGORY CLICKS ---
    window.cAPI = {
        setCategory: (categoryName, btnElement) => {
            // 1. Reset all pills to inactive
            const allPills = document.querySelectorAll('.category-pill');
            allPills.forEach(pill => {
                pill.classList.remove('cat-active');
                pill.classList.add('cat-inactive');
            });

            // 2. Set clicked pill to active
            btnElement.classList.remove('cat-inactive');
            btnElement.classList.add('cat-active');

            // 3. BROADCAST SIGNAL to chats.js
            const filterEvent = new CustomEvent('onCategoryChange', { 
                detail: { category: categoryName } 
            });
            window.dispatchEvent(filterEvent);
        },

        openRequests: () => {
            // This will open a separate modal or redirect to a requests page later
            alert("Opening Message Requests...\n(Pending Chat Requests will show here)");
        }
    };

    // --- FETCH PENDING REQUESTS COUNT (Backend Logic) ---
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                // In a real database, you might query a "chat_requests" collection
                // Example query:
                // const q = query(collection(db, "chat_requests"), where("toUid", "==", user.uid), where("status", "==", "pending"));
                // const snapshot = await getDocs(q);
                // const requestCount = snapshot.size;

                // For UI demonstration, let's mock a dynamic number (e.g., 3 pending requests)
                const mockRequestCount = 3; 

                const badge = document.getElementById('request-count-badge');
                if (badge && mockRequestCount > 0) {
                    badge.innerText = mockRequestCount > 99 ? '99+' : mockRequestCount;
                    badge.classList.remove('hidden');
                    badge.classList.add('inline-flex', 'items-center', 'justify-center');
                }
            } catch (error) {
                console.warn("Could not fetch requests count:", error);
            }
        }
    });
}
