// srchcht.js

export function loadSearchChat(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Search Bar UI (OLED Dark Mode & Clean Light Mode)
    container.innerHTML = `
        <div class="relative w-full">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            
            <input 
                type="text" 
                id="chat-search-input" 
                placeholder="Search messages or users..." 
                class="w-full bg-gray-100 dark:bg-darkSurface border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-[20px] focus:ring-0 focus:border-electric dark:focus:border-white block pl-10 p-3 transition-colors outline-none shadow-sm dark:shadow-none"
                autocomplete="off"
            >
        </div>
    `;

    // 🚀 SMART SEARCH LOGIC (Inter-Widget Communication)
    const searchInput = document.getElementById('chat-search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchQuery = e.target.value.trim().toLowerCase();
            
            // Ye ek invisible signal broadcast karega jise `chats.js` sunega
            const searchEvent = new CustomEvent('onChatSearch', { 
                detail: { query: searchQuery } 
            });
            window.dispatchEvent(searchEvent);
        });
    }
}
