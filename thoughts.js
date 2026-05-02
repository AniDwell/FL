// thoughts.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadThoughts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    // CSS for hiding scrollbar and formatting the floating bubble
    const styleHTML = `
        <style>
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .thought-bubble {
                position: absolute;
                top: -35px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 10px;
                padding: 6px 10px;
                border-radius: 12px;
                white-space: nowrap;
                max-width: 80px;
                overflow: hidden;
                text-overflow: ellipsis;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                z-index: 20;
            }
            .thought-bubble::after {
                content: '';
                position: absolute;
                bottom: -4px;
                left: 50%;
                transform: translateX(-50%);
                border-width: 4px 4px 0;
                border-style: solid;
                border-color: rgba(255,255,255,0.2) transparent transparent transparent;
            }
        </style>
    `;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            container.innerHTML = ''; 
            return;
        }

        try {
            // 1. Fetch User Data & Own Thought
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const myPfp = userData.photoURL || pfpPlaceholder;
            const myUsername = userData.username || "You";

            // Check if user has an active thought
            const myThoughtDoc = await getDoc(doc(db, "thoughts", user.uid));
            const myThought = myThoughtDoc.exists() ? myThoughtDoc.data().text : null;

            // 2. Fetch Other Users' Thoughts
            // In a real app, you'd filter by 'following' list. Here we fetch recent 10.
            let othersThoughts = [];
            try {
                const q = query(collection(db, "thoughts"), limit(10));
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => {
                    if (doc.id !== user.uid) {
                        othersThoughts.push({ id: doc.id, ...doc.data() });
                    }
                });
            } catch (err) {
                console.warn("Thoughts collection empty or not created yet.");
            }

            // 3. Render HTML
            let html = styleHTML + `<div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-10 pb-2">`;

            // --- MY THOUGHT (Leftmost) ---
            if (myThought) {
                // Thought exists: Show thought bubble & Delete option on click
                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="deleteMyThought()">
                        <div class="thought-bubble">${myThought}</div>
                        <div class="w-[60px] h-[60px] rounded-full p-[2px] border border-gray-400 dark:border-white/30 active:scale-95 transition-transform">
                            <img src="${myPfp}" class="w-full h-full rounded-full object-cover">
                        </div>
                        <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Leave note</span>
                    </div>
                `;
            } else {
                // No thought: Show (+) button
                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="addMyThought()">
                        <div class="w-[60px] h-[60px] rounded-full p-[2px] border border-transparent active:scale-95 transition-transform relative">
                            <img src="${myPfp}" class="w-full h-full rounded-full object-cover">
                            <div class="absolute top-0 -right-1 bg-gray-100 dark:bg-darkSurface text-gray-900 dark:text-white rounded-full w-6 h-6 flex items-center justify-center border-2 border-white dark:border-[#0a0a0a] shadow-sm z-20">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your note</span>
                    </div>
                `;
            }

            // --- OTHERS' THOUGHTS ---
            othersThoughts.forEach(thought => {
                // Unseen = Solid White Border, Seen = Faded Border
                const isViewed = thought.viewedBy && thought.viewedBy.includes(user.uid);
                const borderClass = isViewed 
                    ? "border-[1.5px] border-gray-400 dark:border-white/30" 
                    : "border-[2px] border-black dark:border-white";

                html += `
                    <div class="relative flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0">
                        <div class="thought-bubble">${thought.text}</div>
                        <div class="w-[60px] h-[60px] rounded-full p-[2px] ${borderClass} active:scale-95 transition-transform">
                            <img src="${thought.photoURL || pfpPlaceholder}" class="w-full h-full rounded-full object-cover border border-transparent dark:border-[#0a0a0a]">
                        </div>
                        <span class="text-[10px] font-bold opacity-80 truncate w-16 text-center">${thought.username}</span>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

            // --- DATABASE FUNCTIONS (Attached to window so inline onclick can use them) ---
            
            // ADD THOUGHT
            window.addMyThought = async () => {
                const text = prompt("Share a thought (max 60 chars):");
                if (!text || text.trim() === "") return;
                
                const shortText = text.substring(0, 60); // Keep it short
                
                try {
                    await setDoc(doc(db, "thoughts", user.uid), {
                        uid: user.uid,
                        username: myUsername,
                        photoURL: myPfp,
                        text: shortText,
                        timestamp: new Date().toISOString(),
                        viewedBy: []
                    });
                    // Refresh widget to show new thought
                    loadThoughts(containerId); 
                } catch (err) {
                    console.error("Error adding thought:", err);
                    alert("Could not share thought. Try again.");
                }
            };

            // DELETE THOUGHT
            window.deleteMyThought = async () => {
                const confirmDelete = confirm("Delete your current thought?");
                if (!confirmDelete) return;

                try {
                    await deleteDoc(doc(db, "thoughts", user.uid));
                    // Refresh widget
                    loadThoughts(containerId);
                } catch (err) {
                    console.error("Error deleting thought:", err);
                }
            };

        } catch (error) {
            console.error("Error loading thoughts widget:", error);
            container.innerHTML = '';
        }
    });
}
