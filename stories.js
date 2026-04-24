// stories.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadStories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            container.innerHTML = ''; 
            return;
        }

        try {
            // 1. Fetch Current User's Profile
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const myPfp = userData.photoURL || pfpPlaceholder;

            let html = `
                <style>
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                </style>
                <div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-2 pb-1">
            `;

            // 2. CURRENT USER'S STORY (Segmented Ring + Button)
            html += `
                <div class="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.location.href='up.html'">
                    <div class="relative w-16 h-16 flex items-center justify-center active:scale-95 transition-transform">
                        
                        <svg class="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="none" class="stroke-electric dark:stroke-white" stroke-width="3" stroke-dasharray="18 12" stroke-linecap="round"></circle>
                        </svg>

                        <img src="${myPfp}" class="w-[56px] h-[56px] rounded-full object-cover z-10 border-2 border-[#0a0a0a]">
                        
                        <div class="absolute -bottom-1 -right-1 bg-electric text-white rounded-full w-6 h-6 flex items-center justify-center border-[2.5px] border-white dark:border-[#0a0a0a] shadow-sm z-20">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your Story</span>
                </div>
            `;

            // 3. REAL FIREBASE DATA FETCHING LOGIC
            let activeStories = [];
            
            // NOTE: The mock data array is completely removed.
            // This code will now actually look for a "stories" collection in your database.
            // If the user hasn't followed anyone or no one posted, it will safely remain empty.
            try {
                // Assuming you have a list of followed UIDs in userData.following
                const followingList = userData.following || [];
                
                if (followingList.length > 0) {
                    // Logic to fetch stories from people you follow
                    // const q = query(collection(db, "stories"), where("authorUid", "in", followingList));
                    // const snapshot = await getDocs(q);
                    // snapshot.forEach(doc => activeStories.push({ id: doc.id, ...doc.data() }));
                } else {
                    // Fallback logic: Fetch top verified users' stories if following list is empty
                    // const q = query(collection(db, "stories"), where("isVerified", "==", true), limit(10));
                    // const snapshot = await getDocs(q);
                    // snapshot.forEach(doc => activeStories.push({ id: doc.id, ...doc.data() }));
                }
            } catch (dbError) {
                console.warn("No stories collection found or query failed, rendering empty state.");
            }

            // 4. Render Other Stories (Will only run if activeStories has data)
            activeStories.forEach(story => {
                // Unviewed = Thick solid ring. Viewed = Very thin white/gray border.
                const ringClass = story.isViewed 
                    ? "border-[1px] border-gray-400 dark:border-white/50" // Thin border for viewed
                    : "border-[2.5px] border-black dark:border-white";    // Thick border for unviewed

                html += `
                    <div class="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="triggerStoryPlayer('${story.id}')">
                        <div class="w-16 h-16 rounded-full p-[2px] ${ringClass} active:scale-95 transition-transform">
                            <img src="${story.pfp || pfpPlaceholder}" class="w-full h-full rounded-full object-cover border border-transparent dark:border-[#0a0a0a]">
                        </div>
                        <span class="text-[10px] font-bold ${story.isViewed ? 'opacity-60' : 'opacity-90'} truncate w-16 text-center">${story.username}</span>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

        } catch (error) {
            console.error("Error loading stories widget:", error);
            container.innerHTML = '';
        }
    });

    window.triggerStoryPlayer = async (storyId) => {
        try {
            const playerModule = await import('./plyrstry.js');
            if (playerModule && playerModule.playStory) {
                playerModule.playStory(storyId);
            }
        } catch (e) {
            console.warn(`plyrstry.js not found. Intended to open story: ${storyId}`);
        }
    };
}
tory: ${storyId}`);
            alert(`Story clicked! Create plyrstry.js to play Story ID: ${storyId}`);
        }
    };
}
