const API_URL = '/api';

console.log(API_URL);

// ... (rest of your frontend code)
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const garden = document.getElementById('garden');
const dateSelector = document.getElementById('date-selector');
const streakDisplay = document.getElementById('streak');
const motivationQuote = document.getElementById('motivation-quote');
const authContainer = document.getElementById('auth-container');
const taskContainer = document.getElementById('task-container');

let tasks = {};

const quotes = [
    "Grow through what you go through.",
    "Bloom where you are planted.",
    "Every accomplishment starts with the decision to try.",
    "The secret of getting ahead is getting started.",
    "Don't wait for opportunity. Create it.",
    "Small steps lead to big changes.",
    "Your garden of success is cultivated one task at a time."
];

function getRandomQuote() {
    return quotes[Math.floor(Math.random() * quotes.length)];
}

async function fetchTasks() {
    try {
        const response = await axios.get(`${API_URL}/tasks`, {
            headers: { Authorization: token }
        });
        tasks = {};
        response.data.forEach(task => {
            if (!tasks[task.date]) {
                tasks[task.date] = [];
            }
            tasks[task.date].push(task);
        });
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

function renderTasks() {
    const currentDate = dateSelector.value;
    taskList.innerHTML = '';
    if (!tasks[currentDate]) {
        tasks[currentDate] = [];
    }
    tasks[currentDate].forEach((task) => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        taskElement.innerHTML = `
            <span>${task.description}</span>
            <div>
                <button onclick="toggleTask('${task._id}')">${task.completed ? '✗' : '✓'}</button>
                <button onclick="deleteTask('${task._id}')">🗑️</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });
    updateGarden();
    updateStreak();
    motivationQuote.textContent = getRandomQuote();
}

function updateGarden() {
    const currentDate = dateSelector.value;
    garden.innerHTML = '<div class="butterfly">🦋</div>';
    const completedTasks = tasks[currentDate].filter(task => task.completed).length;
    const flowers = ['🌻', '🌼', '🌸', '🌺', '🌹'];
    for (let i = 0; i < completedTasks; i++) {
        const flower = document.createElement('div');
        flower.classList.add('flower');
        flower.textContent = flowers[Math.floor(Math.random() * flowers.length)];
        flower.style.left = `${Math.random() * 90}%`;
        flower.style.bottom = `${10 + Math.random() * 60}%`;
        garden.appendChild(flower);
    }
}

async function addTask() {
    const description = taskInput.value.trim();
    if (description) {
        try {
            const currentDate = dateSelector.value;
            const response = await axios.post(`${API_URL}/tasks`, {
                date: currentDate,
                description,
                completed: false
            }, {
                headers: { Authorization: token }
            });
            if (!tasks[currentDate]) {
                tasks[currentDate] = [];
            }
            tasks[currentDate].push(response.data);
            renderTasks();
            taskInput.value = '';
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
}

async function toggleTask(taskId) {
    try {
        const currentDate = dateSelector.value;
        const task = tasks[currentDate].find(t => t._id === taskId);
        const response = await axios.put(`${API_URL}/tasks/${taskId}`, {
            completed: !task.completed
        }, {
            headers: { Authorization: token }
        });
        task.completed = response.data.completed;
        renderTasks();
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function deleteTask(taskId) {
    try {
        const currentDate = dateSelector.value;
        await axios.delete(`${API_URL}/tasks/${taskId}`, {
            headers: { Authorization: token }
        });
        tasks[currentDate] = tasks[currentDate].filter(t => t._id !== taskId);
        renderTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function updateStreak() {
    let streak = 0;
    let date = new Date();
    date.setHours(0, 0, 0, 0);

    while (true) {
        const dateString = date.toISOString().split('T')[0];
        if (!tasks[dateString] || tasks[dateString].length === 0 || !tasks[dateString].every(task => task.completed)) {
            break;
        }
        streak++;
        date.setDate(date.getDate() - 1);
    }

    streakDisplay.textContent = `🔥 Current streak: ${streak} days`;
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await axios.post(`${API_URL}/login`, { username, password });
        token = response.data.token;
        currentUser = response.data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        authContainer.style.display = 'none';
        taskContainer.style.display = 'block';
        updateProfileUI();
        fetchTasks();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const photoFile = document.getElementById('reg-photo').files[0];

    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (photoFile) {
        formData.append('photo', photoFile);
    }

    try {
        await axios.post(`${API_URL}/register`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Registration successful. Please log in.');
        toggleAuthForm();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    authContainer.style.display = 'block';
    taskContainer.style.display = 'none';
}

function updateProfileUI() {
    if (currentUser) {
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-photo').src = currentUser.photoUrl ? `${API_URL}${currentUser.photoUrl}` : `${API_URL}/uploads/default-profile.png`;
    }
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

dateSelector.addEventListener('change', renderTasks);

// Initial setup
dateSelector.valueAsDate = new Date();
dateSelector.max = new Date().toISOString().split('T')[0];

if (token && currentUser) {
    authContainer.style.display = 'none';
    taskContainer.style.display = 'block';
    updateProfileUI();
    fetchTasks();
} else {
    authContainer.style.display = 'block';
    taskContainer.style.display = 'none';
}