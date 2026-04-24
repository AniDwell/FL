// bottom-nav.js
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export async function initBottomNav(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Firebase Auth & DB Setup
    const auth = getAuth();
    const db = getFirestore();

    // Default PFP Placeholder
    let pfpUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

    // Load Bottom Nav HTML
    container.innerHTML = `
        <div class="fixed bottom-0 left-0 w-full z-[100] px-4 pb-4 pointer-events-none">
            <div class="max-w-lg mx-auto relative pointer-events-auto">
                
                <button onclick="window.location.href='up.html'" class="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-electric dark:bg-white text-white dark:text-black rounded-full shadow-lg shadow-electric/30 flex items-center justify-center active:scale-90 transition-transform z-20 border-4 border-gray-50 dark:border-black">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                </button>

                <nav class="bg-white/90 dark:bg-darkSurface/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 h-16 rounded-[24px] flex items-center justify-between px-6 shadow-2xl">
                    
                    <button onclick="window.location.href='home.html'" class="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    </button>

                    <button onclick="window.location.href='vidz.html'" class="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>

                    <div class="w-10"></div>

                    <button onclick="window.location.href='ref.html'" class="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </button>

                    <button onclick="window.location.href='pro.html'" id="nav-pfp-btn" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/20 transition-transform active:scale-90">
                        <div id="nav-pfp-img" class="w-full h-full bg-cover bg-center" style="background-image: url('${pfpUrl}')"></div>
                    </button>

                </nav>
            </div>
        </div>
    `;

    // Fetch Actual PFP from Firebase
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().photoURL) {
                const imgDiv = document.getElementById('nav-pfp-img');
                if (imgDiv) imgDiv.style.backgroundImage = `url('${userDoc.data().photoURL}')`;
            }
        }
    });
}
