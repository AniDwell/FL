// category.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadCategories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    // Custom CSS for hiding scrollbar and pill styling
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
                <span id="request-count-badge" class="hidden bg-electric text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ml-0.5 transition-all">0</span>
            </button>

            <div class="w-[1px] h-5 bg-gray-300 dark:bg-white/20 shrink-0 mx-1"></div>

            <button onclick="window.cAPI.setCategory('all', this)" class="category-pill cat-active px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">All</button>
            <button onclick="window.cAPI.setCategory('archived', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Archived</button>
            <button onclick="window.cAPI.setCategory('groups', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Groups</button>
            <button onclick="window.cAPI.setCategory('channels', this)" class="category-pill cat-inactive px-4 py-1.5 rounded-[14px] text-xs font-bold shrink-0 transition-all active:scale-95 border">Channels</button>
            
            <div class="w-2 shrink-0"></div>
        </div>
    `;

    // --- GLOBAL API FOR ACTIONS ---
    window.cAPI = {
        setCategory: (categoryName, btnElement) => {
            const allPills = document.querySelectorAll('.category-pill');
            allPills.forEach(pill => {
                pill.classList.remove('cat-active');
                pill.classList.add('cat-inactive');
            });

            btnElement.classList.remove('cat-inactive');
            btnElement.classList.add('cat-active');

            // Dispatch signal to chats.js
            const filterEvent = new CustomEvent('onCategoryChange', { 
                detail: { category: categoryName } 
            });
            window.dispatchEvent(filterEvent);
        },

        openRequests: () => {
            // Redirects to a dedicated Message Requests page
            window.location.href = 'req.html';
        }
    };

    // --- REALTIME FIREBASE LISTENER FOR PENDING REQUESTS ---
    let unsubscribeRequests = null;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Target collection: 'chat_requests' where this user is the receiver and status is pending
            const requestsRef = collection(db, "chat_requests");
            const q = query(
                requestsRef, 
                where("toUid", "==", user.uid), 
                where("status", "==", "pending")
            );

            // onSnapshot gives us a live, realtime connection to the database
            unsubscribeRequests = onSnapshot(q, (snapshot) => {
                const requestCount = snapshot.size;
                const badge = document.getElementById('request-count-badge');
                
                if (badge) {
                    if (requestCount > 0) {
                        // Show badge with bouncy animation on update
                        badge.innerText = requestCount > 99 ? '99+' : requestCount;
                        badge.classList.remove('hidden');
                        badge.classList.add('inline-flex', 'items-center', 'justify-center');
                        
                        // Small pop animation when count changes
                        badge.classList.add('scale-125');
                        setTimeout(() => badge.classList.remove('scale-125'), 200);
                    } else {
                        // Hide badge if no requests
                        badge.classList.add('hidden');
                        badge.classList.remove('inline-flex', 'items-center', 'justify-center');
                    }
                }
            }, (error) => {
                console.warn("Error listening to chat requests:", error);
            });
        } else {
            // Clean up listener if user logs out
            if (unsubscribeRequests) unsubscribeRequests();
        }
    });
}
