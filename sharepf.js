// sharepf.js

export function init(targetUid) {
    // 1. Check if a modal already exists, remove it
    const existingModal = document.getElementById('sharepf-fullscreen-modal');
    if (existingModal) existingModal.remove();

    // 2. Generate the Profile URL
    // Hum current domain use karenge taaki link actual app ka bane
    const profileUrl = `${window.location.origin}/pro.html?id=${targetUid}`;
    const encodedUrl = encodeURIComponent(profileUrl);
    
    // Custom Share Text
    const shareText = encodeURIComponent(`Check out this profile on Artist Hub! 🎨✨\n\n`);

    // 3. Generate Real QR Code (Using a free stable API, ensuring white bg for scannability)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedUrl}&bgcolor=ffffff&color=000000&margin=10`;

    // 4. Build the Full-Screen HTML UI
    const modalHtml = `
        <div id="sharepf-fullscreen-modal" class="fixed inset-0 bg-white dark:bg-[#0a0a0a] z-[99999] flex flex-col items-center justify-center p-6 transition-opacity duration-300 opacity-0">
            
            <button id="sharepf-close-btn" class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 active:scale-90 transition-transform">
                <svg class="w-6 h-6 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 class="text-2xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Share Profile</h2>

            <div class="bg-white p-4 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] mb-8 relative group">
                <img id="sharepf-qr-img" src="${qrApiUrl}" alt="Profile QR Code" class="w-56 h-56 rounded-xl object-contain">
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                        <svg class="w-6 h-6 text-electric" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
                    </div>
                </div>
            </div>

            <div class="w-full max-w-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
                <span class="text-sm text-gray-800 dark:text-gray-300 truncate font-medium flex-1">${profileUrl}</span>
            </div>

            <div class="flex gap-4 w-full max-w-xs mb-10">
                <button id="sharepf-copy-btn" class="flex-1 bg-electric hover:bg-blue-600 text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-electric/20 flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    <span>Copy</span>
                </button>
                <button id="sharepf-download-btn" class="flex-1 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-900 dark:text-white py-3.5 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span>Save QR</span>
                </button>
            </div>

            <p class="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Share via</p>
            <div class="flex items-center gap-6">
                <button id="sharepf-wa" class="w-14 h-14 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center active:scale-90 transition-transform">
                    <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
                </button>
                <button id="sharepf-x" class="w-14 h-14 rounded-full bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white flex items-center justify-center active:scale-90 transition-transform">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </button>
                <button id="sharepf-fb" class="w-14 h-14 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center active:scale-90 transition-transform">
                    <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </button>
            </div>
        </div>
    `;

    // 5. Inject to Body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('sharepf-fullscreen-modal');

    // Trigger Fade-in Animation
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.classList.add('opacity-100');
    });

    // --- 6. ATTACH EVENT LISTENERS ---

    // Close Modal
    document.getElementById('sharepf-close-btn').addEventListener('click', () => {
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    });

    // Copy Link
    document.getElementById('sharepf-copy-btn').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        navigator.clipboard.writeText(profileUrl).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> <span>Copied!</span>`;
            btn.classList.add('bg-green-500');
            btn.classList.remove('bg-electric');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('bg-green-500');
                btn.classList.add('bg-electric');
            }, 2000);
        }).catch(err => alert("Failed to copy link"));
    });

    // Download QR Code
    document.getElementById('sharepf-download-btn').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span>Downloading...</span>`;
        
        try {
            // Fetch the image as a blob
            const response = await fetch(qrApiUrl);
            const blob = await response.blob();
            
            // Create object URL and invisible anchor tag to trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `ArtistHub_QR_${targetUid}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            btn.innerHTML = `<span>Saved!</span>`;
            setTimeout(() => btn.innerHTML = originalText, 2000);
        } catch (error) {
            console.error("Download failed", error);
            alert("Could not download QR code. Try again later.");
            btn.innerHTML = originalText;
        }
    });

    // Social Share Links
    document.getElementById('sharepf-wa').addEventListener('click', () => {
        window.open(`https://api.whatsapp.com/send?text=${shareText}${encodedUrl}`, '_blank');
    });

    document.getElementById('sharepf-x').addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`, '_blank');
    });

    document.getElementById('sharepf-fb').addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
    });
}
