// Urban Fresh - Collection Grid Dashboard
// Real-time countdown, collection cards, and slide-up drawer

(function() {
    'use strict';
    
    const selectedSpotId = localStorage.getItem('selectedSpot');
    let selectedCollections = JSON.parse(localStorage.getItem('selectedCollections') || '[]');
    let countdownInterval;
    
    // Redirect if no spot selected
    if (!selectedSpotId) {
        window.location.href = '/';
        return;
    }
    
    // DOM Elements
    const spotName = document.getElementById('spotName');
    const countdown = document.getElementById('countdown');
    const collectionsContainer = document.getElementById('collectionsContainer');
    const reviewButton = document.getElementById('reviewButton');
    const drawer = document.getElementById('drawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const drawerContent = document.getElementById('drawerContent');
    const closeDrawer = document.getElementById('closeDrawer');
    
    // Initialize
    async function init() {
        try {
            const response = await fetch('/api/collections/' + selectedSpotId);
            const data = await response.json();
            
            if (data.error) {
                showError(data.error);
                return;
            }
            
            // Set spot name
            spotName.textContent = data.spot.name;
            
            // Start countdown
            startCountdown(data.orderDeadline);
            
            // Render collections
            renderCollections(data.collections);
            
        } catch (error) {
            console.error('Failed to load collections:', error);
            showError('메뉴를 불러오는데 실패했습니다.');
        }
    }
    
    // Real-time Countdown Timer
    function startCountdown(deadline) {
        function updateTimer() {
            const now = new Date();
            const target = new Date(deadline);
            const diff = target - now;
            
            if (diff <= 0) {
                countdown.textContent = '마감됨';
                countdown.classList.remove('neo-mint');
                countdown.classList.add('text-red-400');
                clearInterval(countdownInterval);
                return;
            }
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const hoursStr = String(hours).padStart(2, '0');
            const minutesStr = String(minutes).padStart(2, '0');
            const secondsStr = String(seconds).padStart(2, '0');
            
            countdown.textContent = hoursStr + ':' + minutesStr + ':' + secondsStr;
        }
        
        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    }
    
    // Render Collection Cards
    function renderCollections(collections) {
        let html = '';
        
        collections.forEach(function(collection) {
            const tagsHtml = collection.tags.map(function(tag) {
                return '<span class="text-xs px-3 py-1 bg-gray-800 rounded-full text-gray-400">' + tag + '</span>';
            }).join('');
            
            html += '<div class="collection-card rounded-3xl overflow-hidden cursor-pointer" ' +
                'data-collection-id="' + collection.id + '" ' +
                'role="button" tabindex="0">' +
                
                '<!-- Image Area -->' +
                '<div class="image-placeholder aspect-[4/3] flex items-center justify-center">' +
                    '<div class="text-center">' +
                        '<div class="text-6xl font-black text-white/20 mb-2">' + collection.number + '</div>' +
                        '<div class="text-sm text-gray-500 uppercase tracking-widest">Image Placeholder</div>' +
                    '</div>' +
                '</div>' +
                
                '<!-- Card Content -->' +
                '<div class="p-6">' +
                    '<!-- Header -->' +
                    '<div class="flex items-start justify-between mb-4">' +
                        '<div>' +
                            '<div class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">' +
                                collection.number +
                            '</div>' +
                            '<h3 class="text-2xl font-black mb-1">' + collection.name + '</h3>' +
                            '<p class="text-sm text-gray-400">' + collection.tagline + '</p>' +
                        '</div>' +
                        '<div class="text-right">' +
                            '<div class="text-xs text-gray-500 mb-1">재고</div>' +
                            '<div class="text-lg font-black neo-mint">' + collection.unitsLeft + '</div>' +
                            '<div class="text-xs text-gray-500">Units</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<!-- Tags -->' +
                    '<div class="flex gap-2 mb-4">' +
                        tagsHtml +
                    '</div>' +
                    
                    '<!-- Price & CTA -->' +
                    '<div class="flex items-center justify-between pt-4 border-t border-gray-800">' +
                        '<div class="text-xl font-black">' + collection.price.toLocaleString() + '원</div>' +
                        '<div class="text-sm text-gray-500 flex items-center gap-1">' +
                            '탭하여 상세보기' +
                            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>' +
                            '</svg>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });
        
        collectionsContainer.innerHTML = html;
        
        // Attach click handlers
        attachCardHandlers(collections);
    }
    
    // Attach click handlers to collection cards
    function attachCardHandlers(collections) {
        const cards = collectionsContainer.querySelectorAll('.collection-card');
        
        cards.forEach(function(card) {
            card.addEventListener('click', function() {
                const collectionId = this.dataset.collectionId;
                const collection = collections.find(function(c) {
                    return c.id === collectionId;
                });
                if (collection) {
                    openDrawer(collection);
                }
            });
        });
    }
    
    // Open drawer with collection details
    function openDrawer(collection) {
        const ingredientsHtml = collection.ingredients.map(function(ingredient) {
            return '<span class="px-4 py-2 bg-gray-900 rounded-full text-sm">' + ingredient + '</span>';
        }).join('');
        
        drawerContent.innerHTML = 
            '<!-- Collection Header -->' +
            '<div class="mb-6">' +
                '<div class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">' +
                    collection.number + ' · ' + collection.price.toLocaleString() + '원' +
                '</div>' +
                '<h2 class="text-4xl font-black mb-2">' + collection.name + '</h2>' +
                '<p class="text-lg text-gray-400 mb-4">' + collection.tagline + '</p>' +
                '<p class="text-sm text-gray-500">' + collection.description + '</p>' +
            '</div>' +
            
            '<!-- Nutrition Info -->' +
            '<div class="bg-gray-900/50 rounded-2xl p-5 mb-6">' +
                '<div class="text-sm font-bold mb-4">영양 정보</div>' +
                '<div class="grid grid-cols-4 gap-4 text-center">' +
                    '<div>' +
                        '<div class="text-xs text-gray-500 mb-1">칼로리</div>' +
                        '<div class="text-lg font-black neo-mint">' + collection.nutrition.calories + '</div>' +
                        '<div class="text-xs text-gray-600">kcal</div>' +
                    '</div>' +
                    '<div>' +
                        '<div class="text-xs text-gray-500 mb-1">단백질</div>' +
                        '<div class="text-lg font-black">' + collection.nutrition.protein + 'g</div>' +
                    '</div>' +
                    '<div>' +
                        '<div class="text-xs text-gray-500 mb-1">탄수화물</div>' +
                        '<div class="text-lg font-black">' + collection.nutrition.carbs + 'g</div>' +
                    '</div>' +
                    '<div>' +
                        '<div class="text-xs text-gray-500 mb-1">지방</div>' +
                        '<div class="text-lg font-black">' + collection.nutrition.fat + 'g</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            
            '<!-- Ingredients -->' +
            '<div class="mb-6">' +
                '<div class="text-sm font-bold mb-3">구성 재료</div>' +
                '<div class="flex flex-wrap gap-2">' +
                    ingredientsHtml +
                '</div>' +
            '</div>' +
            
            '<!-- Add to Selection Button -->' +
            '<button class="w-full py-4 bg-[#00FF85] text-[#1A1A1B] rounded-full font-black text-base" ' +
                    'onclick="window.addToSelection(\'' + collection.id + '\')">' +
                '선택하기' +
            '</button>';
        
        // Show drawer
        drawer.classList.add('open');
        drawerBackdrop.classList.add('open');
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }
    
    // Close drawer
    function closeDrawerFunc() {
        drawer.classList.remove('open');
        drawerBackdrop.classList.remove('open');
    }
    
    closeDrawer.addEventListener('click', closeDrawerFunc);
    drawerBackdrop.addEventListener('click', closeDrawerFunc);
    
    // Add to selection
    window.addToSelection = function(collectionId) {
        if (!selectedCollections.includes(collectionId)) {
            selectedCollections.push(collectionId);
            localStorage.setItem('selectedCollections', JSON.stringify(selectedCollections));
            
            // Show review button
            reviewButton.classList.remove('hidden');
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }
        }
        
        closeDrawerFunc();
    };
    
    // Review button click
    reviewButton.addEventListener('click', function() {
        alert('결제 페이지로 이동 (Step 3 - 구현 예정)');
    });
    
    // Show error
    function showError(message) {
        collectionsContainer.innerHTML = 
            '<div class="text-center py-12">' +
                '<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">' +
                    '<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
                              'd="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
                    '</svg>' +
                '</div>' +
                '<p class="text-gray-400 mb-6">' + message + '</p>' +
                '<a href="/" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full transition text-sm font-semibold inline-block">' +
                    '거점 다시 선택' +
                '</a>' +
            '</div>';
    }
    
    // Initialize app
    init();
    
})();
