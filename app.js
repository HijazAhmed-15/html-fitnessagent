/**
 * FitAgent - AI Personal Coach
 * Application Logic
 */

// ==========================================================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================================================

const defaultData = {
    profile: null,
    theme: 'dark',
    vitals: {
        sleep: null,
        steps: 0,
        hrv: null,
        hr: null,
        spo2: null,
        water: 0
    },
    nutrition: {
        caloriesEaten: 0,
        proteinEaten: 0,
        carbsEaten: 0,
        fatsEaten: 0,
        mealsEaten: [], // array of indexes
    },
    workout: {
        completed: [] // array of exercise indexes
    },
    logs: {
        weight: [{ date: '2023-01-01', value: 78 }],
        strength: {
            bench: [{ date: '2023-01-01', value: 80 }],
            squat: [{ date: '2023-01-01', value: 100 }],
            deadlift: [{ date: '2023-01-01', value: 120 }]
        }
    }
};

const sampleProfile = {
    name: 'Alex',
    age: 26,
    gender: 'male',
    height: 175,
    weight: 78,
    goal: 'gain',
    activity: 'moderate',
    diet: 'any',
    allergies: '',
    conditions: '',
    injuries: '',
    targets: {
        calories: 2800,
        protein: 180,
        carbs: 300,
        fats: 80
    }
};

const sampleWorkout = [
    { name: 'Bench Press', sets: 4, reps: 8, rest: '90s' },
    { name: 'Overhead Press', sets: 3, reps: 10, rest: '90s' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 12, rest: '60s' },
    { name: 'Tricep Pushdown', sets: 3, reps: 15, rest: '60s' },
    { name: 'Lateral Raises', sets: 4, reps: 15, rest: '45s' }
];

const sampleMeals = [
    { name: 'Breakfast: Oatmeal & Eggs', p: 30, c: 50, f: 15, cal: 455, desc: 'Rolled oats, whey, 3 whole eggs' },
    { name: 'Lunch: Chicken Rice Bowl', p: 50, c: 80, f: 15, cal: 655, desc: '200g chicken breast, jasmine rice, broccoli' },
    { name: 'Snack: Greek Yogurt & Nuts', p: 25, c: 20, f: 20, cal: 360, desc: 'Fage 0%, almonds, honey' },
    { name: 'Dinner: Salmon & Sweet Potato', p: 40, c: 60, f: 25, cal: 625, desc: 'Wild caught salmon, roasted sweet potato' },
    { name: 'Post-Workout Shake', p: 30, c: 40, f: 5, cal: 325, desc: 'Whey isolate, banana, skim milk' }
];

let appState = JSON.parse(localStorage.getItem('fitagent_state')) || { ...defaultData };

function saveState() {
    localStorage.setItem('fitagent_state', JSON.stringify(appState));
    updateUI();
}

function resetData() {
    if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
        localStorage.removeItem('fitagent_state');
        location.reload();
    }
}

// Generate sample data on first load if none exists but profile is present
function initData() {
    if (!appState.profile && !localStorage.getItem('fitagent_state')) {
        // Form is left empty for user input
    }
}

// ==========================================================================
// ROUTING & NAVIGATION
// ==========================================================================

function navigateTo(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.classList.add('hide'));

    // Show active view
    const viewEl = document.getElementById(`view-${viewId}`);
    if (viewEl) {
        viewEl.classList.remove('hide');
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === viewId) {
            link.classList.add('active');
        }
    });

    // Handle Nav visibility
    const nav = document.getElementById('app-navigation');
    if (viewId === 'onboarding') {
        nav.classList.add('hide');
    } else {
        nav.classList.remove('hide');
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ==========================================================================
// CHARTS (Chart.js)
// ==========================================================================
let weightChart, strengthChart, dashWorkoutChart;

function initCharts() {
    const wCtx = document.getElementById('weightChart');
    if (wCtx && !weightChart) {
        weightChart = new Chart(wCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Today'],
                datasets: [{
                    label: 'Weight (kg)',
                    data: [75, 75.5, 76.2, 77, 77.5, appState.profile ? appState.profile.weight : 78],
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const sCtx = document.getElementById('strengthChart');
    if (sCtx && !strengthChart) {
        strengthChart = new Chart(sCtx, {
            type: 'bar',
            data: {
                labels: ['Bench', 'Squat', 'Deadlift'],
                datasets: [{
                    label: '1RM (kg)',
                    data: [85, 120, 140],
                    backgroundColor: ['#6366F1', '#10B981', '#F59E0B'],
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    initDashWorkoutChart();
}

function initDashWorkoutChart() {
    const dCtx = document.getElementById('dash-workout-chart');
    if (dCtx) {
        if (dashWorkoutChart) dashWorkoutChart.destroy();
        const done = appState.workout.completed.length;
        const total = appState.workout.plan ? appState.workout.plan.length : sampleWorkout.length;

        dashWorkoutChart = new Chart(dCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [done, total - done],
                    backgroundColor: ['#6366F1', 'rgba(100, 116, 139, 0.2)'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, plugins: { tooltip: { enabled: false } } }
        });
    }
}

// ==========================================================================
// UI UPDATES & LOGIC
// ==========================================================================

function updateUI() {
    if (!appState.profile) return; // Wait for onboarding

    // Theme logic
    if (appState.theme === 'light') {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').checked = false;
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }

    // Top Nav
    document.getElementById('nav-user-avatar').textContent = appState.profile.name.charAt(0).toUpperCase();
    const navName = document.getElementById('nav-user-name');
    if (navName) navName.textContent = appState.profile.name;

    // Dashboard variables
    document.getElementById('greeting-title').textContent = `Good morning, ${appState.profile.name}!`;

    // 1. Calculations - Dashboard
    const tCals = appState.profile.targets.calories;
    const eCals = appState.nutrition.caloriesEaten;
    document.getElementById('dash-cal-target').textContent = tCals;
    document.getElementById('dash-cal-eaten').textContent = eCals;
    document.getElementById('dash-cal-prog').style.width = `${Math.min((eCals / tCals) * 100, 100)}%`;

    document.getElementById('dash-steps').textContent = appState.vitals.steps;
    document.getElementById('dash-steps-prog').style.width = `${Math.min((appState.vitals.steps / 10000) * 100, 100)}%`;

    document.getElementById('dash-water').textContent = appState.vitals.water;
    document.getElementById('dash-sleep').textContent = appState.vitals.sleep || '--';

    // Minibars
    document.getElementById('dash-p-val').textContent = appState.nutrition.proteinEaten;
    document.getElementById('dash-c-val').textContent = appState.nutrition.carbsEaten;
    document.getElementById('dash-f-val').textContent = appState.nutrition.fatsEaten;

    document.getElementById('dash-macro-p').style.width = `${Math.min((appState.nutrition.proteinEaten / appState.profile.targets.protein) * 100, 100)}%`;
    document.getElementById('dash-macro-c').style.width = `${Math.min((appState.nutrition.carbsEaten / appState.profile.targets.carbs) * 100, 100)}%`;
    document.getElementById('dash-macro-f').style.width = `${Math.min((appState.nutrition.fatsEaten / appState.profile.targets.fats) * 100, 100)}%`;

    // Dashboard workout
    const totalWorkoutLen = appState.workout.plan ? appState.workout.plan.length : sampleWorkout.length;
    document.getElementById('dash-workout-status').textContent = `${appState.workout.completed.length} / ${totalWorkoutLen} Exercises Done`;
    initDashWorkoutChart();

    // 2. Meal Plan Panel
    renderMeals();

    // 3. Workout Panel
    renderWorkout();

    // 4. Recovery Score
    calcRecovery();

    // 5. Progress Page Sync
    if (weightChart && strengthChart) {
        weightChart.update();
        strengthChart.update();
    }
}

function renderMeals() {
    const list = document.getElementById('meal-list');
    list.innerHTML = '';

    // Use dynamic meals or fallback
    const mealsToRender = appState.nutrition.plan || sampleMeals;

    // Recalculate totals
    let eatC = 0, eatP = 0, eatCb = 0, eatF = 0;

    mealsToRender.forEach((meal, idx) => {
        const isEaten = appState.nutrition.mealsEaten.includes(idx);
        if (isEaten) {
            eatC += meal.cal; eatP += meal.p; eatCb += meal.c; eatF += meal.f;
        }

        const mEl = document.createElement('div');
        mEl.className = `card glassmorphism meal-card interactive ${isEaten ? 'completed' : ''}`;
        mEl.innerHTML = `
            <div class="meal-header">
                <h4>${meal.name}</h4>
                <div class="${isEaten ? 'text-success' : 'text-muted'}"><i data-lucide="${isEaten ? 'check-circle' : 'circle'}"></i></div>
            </div>
            <p class="meal-ingredients mb-2">${meal.desc}</p>
            <div class="meal-macros">
                <span class="badge">${meal.cal} kcal</span>
                <span><b class="text-danger">${meal.p}g</b> P</span>
                <span><b class="text-success">${meal.c}g</b> C</span>
                <span><b class="text-warning">${meal.f}g</b> F</span>
            </div>
        `;
        mEl.onclick = () => {
            if (isEaten) {
                appState.nutrition.mealsEaten = appState.nutrition.mealsEaten.filter(i => i !== idx);
            } else {
                appState.nutrition.mealsEaten.push(idx);
            }
            // re-eval state values
            appState.nutrition.caloriesEaten = mealsToRender.filter((_, i) => appState.nutrition.mealsEaten.includes(i)).reduce((a, b) => a + b.cal, 0);
            appState.nutrition.proteinEaten = mealsToRender.filter((_, i) => appState.nutrition.mealsEaten.includes(i)).reduce((a, b) => a + b.p, 0);
            appState.nutrition.carbsEaten = mealsToRender.filter((_, i) => appState.nutrition.mealsEaten.includes(i)).reduce((a, b) => a + b.c, 0);
            appState.nutrition.fatsEaten = mealsToRender.filter((_, i) => appState.nutrition.mealsEaten.includes(i)).reduce((a, b) => a + b.f, 0);
            saveState();
        };
        list.appendChild(mEl);
    });

    // Update Meal UI
    document.getElementById('meal-p').textContent = eatP + 'g';
    document.getElementById('meal-c').textContent = eatCb + 'g';
    document.getElementById('meal-f').textContent = eatF + 'g';

    const tp = appState.profile?.targets || sampleProfile.targets;
    document.getElementById('p-cal-text').textContent = `${eatC} / ${tp.calories}`;
    document.getElementById('p-bar-cal').style.width = `${Math.min((eatC / tp.calories) * 100, 100)}%`;

    document.getElementById('p-pro-text').textContent = `${eatP} / ${tp.protein}g`;
    document.getElementById('p-bar-pro').style.width = `${Math.min((eatP / tp.protein) * 100, 100)}%`;

    document.getElementById('p-carb-text').textContent = `${eatCb} / ${tp.carbs}g`;
    document.getElementById('p-bar-carb').style.width = `${Math.min((eatCb / tp.carbs) * 100, 100)}%`;

    document.getElementById('p-fat-text').textContent = `${eatF} / ${tp.fats}g`;
    document.getElementById('p-bar-fat').style.width = `${Math.min((eatF / tp.fats) * 100, 100)}%`;

    lucide.createIcons();
}

function renderWorkout() {
    const list = document.getElementById('exercise-list');
    list.innerHTML = '';
    const doneCount = appState.workout.completed.length;
    const workoutToRender = appState.workout.plan || sampleWorkout;
    document.getElementById('workout-progress-text').textContent = `${doneCount}/${workoutToRender.length}`;

    workoutToRender.forEach((ex, idx) => {
        const isDone = appState.workout.completed.includes(idx);
        const eEl = document.createElement('div');
        eEl.className = `exercise-item ${isDone ? 'completed' : ''}`;
        eEl.innerHTML = `
            <div class="exercise-info">
                <h4>${ex.name}</h4>
                <div class="exercise-meta">
                    <span><i data-lucide="layers" class="w-4 h-4 inline mr-1"></i>${ex.sets}x${ex.reps}</span>
                    <span><i data-lucide="timer" class="w-4 h-4 inline mr-1"></i>${ex.rest}</span>
                </div>
            </div>
            <div class="check-circle" onclick="toggleExercise(${idx})">
                <i data-lucide="check"></i>
            </div>
        `;
        list.appendChild(eEl);
    });

    const btn = document.getElementById('log-workout-btn');
    if (doneCount === workoutToRender.length) {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled');
    } else {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', 'true');
    }
    lucide.createIcons();
}

window.toggleExercise = function (idx) {
    if (appState.workout.completed.includes(idx)) {
        appState.workout.completed = appState.workout.completed.filter(i => i !== idx);
    } else {
        appState.workout.completed.push(idx);
    }
    saveState();
};

function calcRecovery() {
    const circle = document.getElementById('recovery-circle');
    const valText = document.getElementById('recovery-value');
    const statusText = document.getElementById('recovery-status-text');
    const tipText = document.getElementById('recovery-tip');

    const hrv = appState.vitals.hrv;
    const sleep = appState.vitals.sleep;

    circle.classList.remove('high', 'moderate', 'low');

    if (!hrv || !sleep) {
        valText.textContent = '--';
        statusText.textContent = 'Need Data';
        tipText.textContent = 'Please log both sleep and HRV to calculate your recovery.';
        circle.style.borderColor = 'var(--border-color)';
        return;
    }

    let score = Math.min(100, Math.round((hrv * 0.7) + (sleep * 5))); // Fake calculation
    valText.textContent = score;

    if (hrv > 55 && sleep >= 7) {
        circle.classList.add('high');
        statusText.textContent = "Prime for Performance";
        statusText.className = "text-success mb-2";
        tipText.textContent = "Your body is well-recovered. Push hard during today's workout!";
    } else if (hrv < 40 || sleep < 6) {
        circle.classList.add('low');
        statusText.textContent = "Take it Easy";
        statusText.className = "text-danger mb-2";
        tipText.textContent = "Recovery is low. Prioritize rest, hydration, and a light recovery session.";
    } else {
        circle.classList.add('moderate');
        statusText.textContent = "Moderate Recovery";
        statusText.className = "text-warning mb-2";
        tipText.textContent = "You're okay to train, but don't overdo it. Listen to your body.";
    }
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==========================================================================
// WEARABLE BLE INTEGRATION (Web Bluetooth API)
// ==========================================================================
let bleDevice = null;
let bleServer = null;

async function connectWearable() {
    const statusEl = document.getElementById('ble-status');
    const btnEl = document.getElementById('ble-connect-btn');

    if (!navigator.bluetooth) {
        showToast('Web Bluetooth not supported here (requires secure HTTPS/localhost context).', 'error');
        return;
    }

    try {
        statusEl.classList.remove('hide');
        statusEl.textContent = 'Status: Requesting device...';

        // Request any device that has the Heart Rate service
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }],
            optionalServices: ['battery_service']
        });

        bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

        statusEl.textContent = 'Status: Connecting to GATT Server...';
        bleServer = await bleDevice.gatt.connect();

        statusEl.textContent = 'Status: Getting Service...';
        const service = await bleServer.getPrimaryService('heart_rate');

        statusEl.textContent = 'Status: Getting Characteristic...';
        const characteristic = await service.getCharacteristic('heart_rate_measurement');

        statusEl.textContent = 'Status: Starting Notifications...';
        await characteristic.startNotifications();

        characteristic.addEventListener('characteristicvaluechanged', handleHeartRateMeasurement);

        // Update UI state
        statusEl.textContent = `Connected: ${bleDevice.name || 'Wearable'}`;
        statusEl.className = 'text-xs text-success mt-1';
        btnEl.innerHTML = `<i data-lucide="bluetooth"></i> Disconnect`;
        btnEl.classList.add('ble-connected', 'pulse-animate');
        lucide.createIcons();
        showToast(`Connected to ${bleDevice.name || 'Wearable'}!`);

    } catch (error) {
        console.error('BLE Connect Error:', error);
        statusEl.textContent = 'Status: Disconnected';
        statusEl.className = 'text-xs text-muted mt-1';
        if (error.name !== 'NotFoundError' && error.code !== 8) { // Ignore user cancelled
            showToast('Failed to connect: ' + error.message, 'error');
        }
    }
}

function handleHeartRateMeasurement(event) {
    const value = event.target.value;
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;

    let heartRate = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);

    // Auto populate the HR input
    const hrInput = document.getElementById('vital-hr');
    if (hrInput) {
        hrInput.value = heartRate;
        hrInput.style.backgroundColor = 'var(--success-10)';
        setTimeout(() => hrInput.style.backgroundColor = 'var(--bg-main)', 300);

        // Silently save
        appState.vitals.hr = heartRate;
        localStorage.setItem('fitagent_state', JSON.stringify(appState));
    }
}

function disconnectWearable() {
    if (!bleDevice) return;
    if (bleDevice.gatt.connected) bleDevice.gatt.disconnect();
}

function onDisconnected(event) {
    const device = event.target;

    // Reset UI
    const statusEl = document.getElementById('ble-status');
    const btnEl = document.getElementById('ble-connect-btn');
    statusEl.textContent = 'Status: Disconnected';
    statusEl.className = 'text-xs text-muted mt-1';
    btnEl.innerHTML = `<i data-lucide="bluetooth"></i> Connect Wearable`;
    btnEl.classList.remove('ble-connected', 'pulse-animate');
    lucide.createIcons();
    showToast(`${device.name || 'Wearable'} disconnected.`);
    bleDevice = null;
}

// ==========================================================================
// AI AGENT LOGIC
// ==========================================================================
window.FitnessAgent = {
    generatePlan: function(user) {
        // BMI
        const heightM = user.height / 100;
        const bmi = parseFloat((user.weight / (heightM * heightM)).toFixed(1));

        // BMR (Mifflin)
        let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
        if (user.gender === 'male') bmr += 5;
        else if (user.gender === 'female') bmr -= 161;
        else bmr -= 78;

        // Activity TDEE
        let multiplier = 1.2;
        if (user.activity === 'light') multiplier = 1.375;
        if (user.activity === 'moderate') multiplier = 1.55;
        if (user.activity === 'very') multiplier = 1.725;
        let tdee = Math.round(bmr * multiplier);

        // Calories
        let targetCals = tdee;
        if (user.goal === 'lose') targetCals -= 500;
        if (user.goal === 'gain') targetCals += 300;
        
        // Macros (Default)
        let targetPro = Math.round(user.weight * 2.1);
        let targetFat = Math.round((targetCals * 0.25) / 9);
        if (user.diet === 'keto') {
            targetFat = Math.round((targetCals * 0.70) / 9);
        }
        let targetCarb = Math.round((targetCals - (targetPro * 4) - (targetFat * 9)) / 4);
        if (targetCarb < 0) targetCarb = 20;

        return {
            metrics: { bmi, bmr: Math.round(bmr), tdee },
            targets: { calories: targetCals, protein: targetPro, carbs: targetCarb, fats: targetFat },
            workout: this.generateWorkout(user),
            meals: this.generateMeals(user, targetCals, targetPro, targetCarb, targetFat)
        };
    },
    
    generateWorkout: function(user) {
        let plan = [];
        if (user.goal === 'lose') {
            plan = [
                { name: 'HIIT Sprints or Jumping Jacks', sets: 5, reps: '45s', rest: '15s' },
                { name: 'Bodyweight Squats', sets: 4, reps: 20, rest: '45s' },
                { name: 'Push-ups', sets: 3, reps: 15, rest: '45s' },
                { name: 'Mountain Climbers', sets: 3, reps: 30, rest: '30s' },
                { name: 'Plank Hold', sets: 3, reps: '60s', rest: '30s' }
            ];
        } else if (user.goal === 'gain') {
            plan = [
                { name: 'Barbell/Dumbbell Squats', sets: 4, reps: 8, rest: '90s' },
                { name: 'Bench Press', sets: 4, reps: 8, rest: '90s' },
                { name: 'Bent-Over Rows', sets: 4, reps: 10, rest: '90s' },
                { name: 'Overhead Press', sets: 3, reps: 10, rest: '60s' },
                { name: 'Bicep Curls', sets: 3, reps: 12, rest: '60s' }
            ];
        } else {
            plan = [
                { name: 'Goblet Squats', sets: 3, reps: 12, rest: '60s' },
                { name: 'Dumbbell Bench Press', sets: 3, reps: 10, rest: '60s' },
                { name: 'Lat Pulldowns', sets: 3, reps: 10, rest: '60s' },
                { name: 'Walking Lunges', sets: 3, reps: 12, rest: '60s' }
            ];
        }
        return plan;
    },

    generateMeals: function(user, cal, pro, carb, fat) {
        let meals = [];
        
        let pPerMeal = Math.round(pro / 4);
        let cPerMeal = Math.round(carb / 4);
        let fPerMeal = Math.round(fat / 4);
        let calPerMeal = Math.round(cal / 4);

        if (user.diet === 'vegetarian' || user.diet === 'vegan') {
            meals = [
                { name: 'Breakfast: Protein Oatmeal', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Oats, soy milk, vegan protein powder, chia seeds' },
                { name: 'Lunch: Tofu Power Bowl', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Firm tofu, quinoa, roasted vegetables, tahini' },
                { name: 'Snack: Almonds & Fruit', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Mixed nuts, apple, pea protein shake' },
                { name: 'Dinner: Lentil Curry', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Red lentils, spinach, brown rice' }
            ];
        } else if (user.diet === 'keto') {
            meals = [
                { name: 'Breakfast: Eggs & Avocado', p: pPerMeal, c: 5, f: fPerMeal, cal: calPerMeal, desc: '3 Whole eggs, half avocado, bacon' },
                { name: 'Lunch: Chicken Salad', p: pPerMeal, c: 5, f: fPerMeal, cal: calPerMeal, desc: 'Grilled chicken, mixed greens, olive oil dressing' },
                { name: 'Snack: Cheese & Nuts', p: pPerMeal, c: 5, f: fPerMeal, cal: calPerMeal, desc: 'String cheese, macadamia nuts' },
                { name: 'Dinner: Steak & Asparagus', p: pPerMeal, c: 5, f: fPerMeal, cal: calPerMeal, desc: 'Ribeye steak, buttered asparagus' }
            ];
        } else {
            meals = [
                { name: 'Breakfast: Eggs & Toast', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Scrambled eggs, whole wheat toast, berries' },
                { name: 'Lunch: Chicken Bowl', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Chicken breast, rice, mixed veggies' },
                { name: 'Snack: Greek Yogurt', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Greek yogurt, honey, walnuts' },
                { name: 'Dinner: Salmon & Potato', p: pPerMeal, c: cPerMeal, f: fPerMeal, cal: calPerMeal, desc: 'Grilled salmon, sweet potato, green beans' }
            ];
        }
        return meals;
    }
};

// ==========================================================================
// EVENT LISTENERS & INITIALIZATION
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initData();

    // 1. Boot up state
    if (appState.profile) {
        navigateTo('dashboard');
        updateUI();
        initCharts();
    } else {
        navigateTo('onboarding');
    }

    // 2. Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.currentTarget.dataset.target;
            navigateTo(target);
            if (target === 'progress') setTimeout(initCharts, 100);
        });
    });

    // 3. Onboarding Form
    const obForm = document.getElementById('onboarding-form');
    if (obForm) {
        obForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Gather inputs
            const name = document.getElementById('ob-name').value || 'User';
            const age = parseInt(document.getElementById('ob-age').value) || 25;
            const gender = document.getElementById('ob-gender').value || 'male';
            const height = parseInt(document.getElementById('ob-height').value) || 175;
            const weight = parseFloat(document.getElementById('ob-weight').value) || 75;
            const goal = document.getElementById('ob-goal').value || 'gain';
            const activity = document.getElementById('ob-activity').value || 'moderate';
            const diet = document.getElementById('ob-diet').value || 'any';
            const allergies = document.getElementById('ob-allergies').value || '';
            const conditions = document.getElementById('ob-conditions').value || '';
            const injuries = document.getElementById('ob-injuries').value || '';

            // Generate intelligent profile data
            const generatedData = window.FitnessAgent.generatePlan({
                age, gender, height, weight, goal, activity, diet
            });

            appState.profile = {
                name, age, gender, height, weight, goal, activity, diet,
                allergies, conditions, injuries,
                targets: generatedData.targets,
                metrics: generatedData.metrics
            };

            // Set generated workout and meals
            appState.workout.plan = generatedData.workout;
            appState.workout.completed = []; 
            appState.nutrition.plan = generatedData.meals;
            appState.nutrition.mealsEaten = [];
            
            appState.nutrition.caloriesEaten = 0;
            appState.nutrition.proteinEaten = 0;
            appState.nutrition.carbsEaten = 0;
            appState.nutrition.fatsEaten = 0;

            saveState();
            showToast('Personalized AI Plan created!');
            navigateTo('dashboard');
            setTimeout(initCharts, 100);
        });
    }

    // 4. Quick Actions (Dashboard)
    document.getElementById('dash-water-btn').addEventListener('click', () => {
        if (appState.vitals.water < 8) {
            appState.vitals.water += 1;
            saveState();
            showToast('+1 Cup of Water');
        } else {
            showToast('Daily water goal reached!', 'success');
        }
    });

    document.getElementById('log-workout-btn').addEventListener('click', () => {
        showToast('Workout successfully logged! Great job.', 'success');
    });

    // 5. Vitals Save
    document.querySelectorAll('.vital-save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prop = e.currentTarget.dataset.vital;
            const input = document.getElementById(`vital-${prop}`);
            if (input.value) {
                appState.vitals[prop] = parseFloat(input.value);
                saveState();
                input.value = '';
                showToast(`Logged ${prop} successfully`);
            }
        });
    });

    // 5b. BLE Connect Button
    const bleBtn = document.getElementById('ble-connect-btn');
    if (bleBtn) {
        bleBtn.addEventListener('click', () => {
            if (bleDevice && bleDevice.gatt.connected) {
                disconnectWearable();
            } else {
                connectWearable();
            }
        });
    }

    // 6. Theme Toggle
    const themeCb = document.getElementById('theme-toggle');
    if (themeCb) {
        themeCb.addEventListener('change', (e) => {
            appState.theme = e.target.checked ? 'dark' : 'light';
            saveState();
        });
    }

    // 7. Modals
    const modals = {
        weight: { modal: document.getElementById('modal-log-weight'), input: document.getElementById('input-new-weight'), btn: document.getElementById('save-weight-btn') },
        strength: { modal: document.getElementById('modal-log-strength'), btn: document.getElementById('save-strength-btn') }
    };
    const backdrop = document.getElementById('modal-backdrop');

    // Open Modals
    document.getElementById('log-weight-btn').onclick = () => { backdrop.classList.remove('hide'); modals.weight.modal.classList.remove('hide'); };
    document.getElementById('log-strength-btn').onclick = () => { backdrop.classList.remove('hide'); modals.strength.modal.classList.remove('hide'); };

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            backdrop.classList.add('hide');
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hide'));
        };
    });

    // Save Weight
    modals.weight.btn.onclick = () => {
        const val = modals.weight.input.value;
        if (val) {
            appState.profile.weight = val;
            saveState();
            showToast('Weight logged!');
            backdrop.classList.add('hide');
            modals.weight.modal.classList.add('hide');
        }
    };

    // Save Settings overrides
    document.getElementById('save-profile-btn').onclick = () => {
        if (appState.profile) {
            appState.profile.name = document.getElementById('set-name').value || appState.profile.name;
            appState.profile.goal = document.getElementById('set-goal').value || appState.profile.goal;
            saveState();
        }
        showToast('Profile info updated');
    };

    document.getElementById('save-targets-btn').onclick = () => {
        if (appState.profile) {
            appState.profile.targets.calories = parseInt(document.getElementById('set-cal').value) || appState.profile.targets.calories;
            appState.profile.targets.protein = parseInt(document.getElementById('set-pro').value) || appState.profile.targets.protein;
            appState.profile.targets.carbs = parseInt(document.getElementById('set-carb').value) || appState.profile.targets.carbs;
            appState.profile.targets.fats = parseInt(document.getElementById('set-fat').value) || appState.profile.targets.fats;
            saveState();
        }
        showToast('Nutrition targets updated');
    };

    document.getElementById('reset-data-btn').onclick = resetData;


    // 8. Chat Functionality
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-messages');

    // Set initial values in settings
    document.getElementById('nav-settings-btn').onclick = () => {
        if (appState.profile) {
            document.getElementById('set-name').value = appState.profile.name;
            document.getElementById('set-goal').value = appState.profile.goal;
            document.getElementById('set-cal').value = appState.profile.targets.calories;
            document.getElementById('set-pro').value = appState.profile.targets.protein;
            document.getElementById('set-carb').value = appState.profile.targets.carbs;
            document.getElementById('set-fat').value = appState.profile.targets.fats;
        }
        navigateTo('settings');
    };

    function appendMsg(text, sender) {
        const m = document.createElement('div');
        m.className = `message ${sender}`; // Removed 'view' class to prevent router collision
        m.innerHTML = `<div class="msg-bubble">${text}</div>`;
        chatBox.appendChild(m);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function aiRespond(userText) {
        let response = "I hear you! Let's keep working towards your goals.";
        const t = userText.toLowerCase();

        setTimeout(() => {
            if (!appState.profile) {
                response = "Please finish setting up your profile first!";
            } else if (t.includes("workout") || t.includes("plan") || t.includes("exercise")) {
                const w = appState.workout.plan || sampleWorkout;
                response = `Your program has ${w.length} exercises today. Focus heavily on your ${w[0].name} for establishing strength!`;
            } else if (t.includes("eat") || t.includes("food") || t.includes("nutrition")) {
                const rem = appState.profile.targets.calories - appState.nutrition.caloriesEaten;
                response = `You have ${rem > 0 ? rem : 0} calories remaining today to hit your target of ${appState.profile.targets.calories}. Stick strictly to the plan!`;
            } else if (t.includes("progress") || t.includes("weight") || t.includes("bmi")) {
                response = `You're currently weighing in at ${appState.profile.weight}kg with a calculated BMI of ${appState.profile.metrics?.bmi || '--'}. Taking things consistently is the key to progress.`;
            } else if (t.includes("skip") || t.includes("miss") || t.includes("didn't")) {
                response = "No stress. Rest and recovery is just as important. Let's optimize your nutrition today to minimize any setback and pick it back up tomorrow!";
            } else {
                const targetGoal = appState.profile.goal === 'lose' ? 'lose weight' : (appState.profile.goal === 'gain' ? 'build muscle' : 'maintain balance');
                response = `I'm analyzing your data. Your goal is to ${targetGoal}, and I'm ensuring everything is set up perfectly for you. Keep up the great work!`;
            }

            appendMsg(response, 'ai');
        }, 1000);
    }

    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            const text = e.target.textContent;
            appendMsg(text, 'user');
            aiRespond(text);
        });
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
            appendMsg(text, 'user');
            chatInput.value = '';
            aiRespond(text);
        }
    });

});
