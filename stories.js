// stories.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

        // 1. INSTANT RENDER: "Your Story" circle guaranteed to show immediately
        // Hum auth object se direct photo use kar lenge taaki wait na karna pade
        const fastPfp = user.photoURL || pfpPlaceholder;

        container.innerHTML = `
            <style>
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            </style>
            <div class="w-full flex gap-4 px-4 overflow-x-auto snap-x hide-scrollbar pt-2 pb-1">
                
                <div class="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer snap-start shrink-0" onclick="window.location.href='up.html'">
                    <div class="relative w-16 h-16 flex items-center justify-center active:scale-95 transition-transform">
                        
                        <svg class="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="none" class="stroke-electric dark:stroke-white" stroke-width="3" stroke-dasharray="18 12" stroke-linecap="round"></circle>
                        </svg>

                        <img id="my-story-pfp" src="${fastPfp}" class="w-[56px] h-[56px] rounded-full object-cover z-10 border-2 border-[#0a0a0a]">
                        
                        <div class="absolute -bottom-1 -right-1 bg-electric text-white rounded-full w-6 h-6 flex items-center justify-center border-[2.5px] border-white dark:border-[#0a0a0a] shadow-sm z-20">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                    </div>
                    <span class="text-[10px] font-bold opacity-50 truncate w-16 text-center">Your Story</span>
                </div>

                <div id="other-stories-list" class="flex gap-4 shrink-0"></div>

            </div>
        `;

        // 2. BACKGROUND FETCH: Get High-Res PFP & Other User's Stories
        try {
            // Update to High-Res Database PFP (if different)
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().photoURL) {
                document.getElementById('my-story-pfp').src = userDoc.data().photoURL;
            }

            // Backend Logic Placeholder for other stories (Currently Empty)
            // const otherStoriesList = document.getElementById('other-stories-list');
            // let html = '';
            // activeStories.forEach(story => { ... add HTML to html string ... });
            // otherStoriesList.innerHTML = html;

        } catch (error) {
            console.warn("Backend fetch failed, but Your Story is still visible.", error);
        }
    });

    // Dynamic Player Trigger (For other stories later)
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
