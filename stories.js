// stories.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function loadStories(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const auth = getAuth();
    const db = getFirestore();

    // Default SVG Placeholder
    const pfpPlaceholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='gray'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            container.innerHTML = ''; // Hide if not logged in
            return;
        }

        try {
            // 1. Fetch Current User's Profile
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const myPfp = userData.photoURL || pfpPlaceholder;

            // 2. The Wrapper (Horizontal Slider, No Scrollbar)
            let html = `
                <style>
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                </style>
                <div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-2 pb-1">
            `;

            // 3. CURRENT USER'S STORY (Sabse aage, with + button)
            html += `
                <div class="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.location.href='up.html'">
                    <div class="relative w-16 h-16 rounded-full p-[2px] border border-gray-200 dark:border-white/10 active:scale-95 transition-transform">
                        <img src="${myPfp}" class="w-full h-full rounded-full object-cover">
                        
                        <div class="absolute -bottom-1 -right-1 bg-electric text-white rounded-full w-6 h-6 flex items-center justify-center border-[2.5px] border-white dark:border-[#0a0a0a] shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your Story</span>
                </div>
            `;

            // ====================================================================
            // 🔥 BACKEND LOGIC STRUCTURE (For Future Integration) 🔥
            // In a real app, you would fetch like this:
            // const followingList = userData.following || [];
            // let fetchedStories = [];
            // if (followingList.length > 0) {
            //     fetchedStories = await fetchStoriesByUIDs(followingList);
            // } else {
            //     // Fallback: Fetch Top Verified Users
            //     const q = query(collection(db, "users"), where("isVerified", "==", true), orderBy("followers", "desc"), limit(10));
            //     fetchedStories = await getDocs(q);
            // }
            // If fetchedStories.length === 0, you would stop rendering here.
            // ====================================================================

            // 4. MOCK DATA (To test UI right now. Unviewed = false means White Ring!)
            const stories = [
                { id: 'st_001', username: 'zoro.lost', pfp: 'https://i.pravatar.cc/150?u=1', isViewed: false },
                { id: 'st_002', username: 'naruto_uzu', pfp: 'https://i.pravatar.cc/150?u=2', isViewed: false },
                { id: 'st_003', username: 'verified_art', pfp: 'https://i.pravatar.cc/150?u=3', isViewed: true },
                { id: 'st_004', username: 'sasuke_uchi', pfp: 'https://i.pravatar.cc/150?u=4', isViewed: false },
                { id: 'st_005', username: 'goku.san', pfp: 'https://i.pravatar.cc/150?u=5', isViewed: true },
            ];

            // 5. Render Other Stories
            stories.forEach(story => {
                // If unviewed, give it a bright solid ring. If viewed, faded border.
                const ringClass = story.isViewed 
                    ? "border border-gray-300 dark:border-white/10 opacity-50" 
                    : "border-[2.5px] border-black dark:border-white";

                html += `
                    <div class="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="triggerStoryPlayer('${story.id}')">
                        <div class="w-16 h-16 rounded-full p-[2px] ${ringClass} active:scale-95 transition-transform">
                            <img src="${story.pfp}" class="w-full h-full rounded-full object-cover border border-transparent dark:border-[#0a0a0a]">
                        </div>
                        <span class="text-[10px] font-bold ${story.isViewed ? 'opacity-50' : 'opacity-90'} truncate w-16 text-center">${story.username}</span>
                    </div>
                `;
            });

            html += `</div>`;
            container.innerHTML = html;

        } catch (error) {
            console.error("Error loading stories:", error);
            // Hide widget if error occurs to keep UI clean
            container.innerHTML = '';
        }
    });

    // 6. DYNAMIC CLICK HANDLER FOR plyrstry.js
    // Attaching this to window so inline HTML onclick can access it
    window.triggerStoryPlayer = async (storyId) => {
        try {
            // This attempts to fetch the plyrstry.js module when clicked
            const playerModule = await import('./plyrstry.js');
            if (playerModule && playerModule.playStory) {
                playerModule.playStory(storyId);
            }
        } catch (e) {
            // Fallback alert if the file isn't created yet
            console.warn(`plyrstry.js not found. Intended to open story: ${storyId}`);
            alert(`Story clicked! Create plyrstry.js to play Story ID: ${storyId}`);
        }
    };
}
