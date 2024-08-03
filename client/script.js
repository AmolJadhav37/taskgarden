const API_URL = 'http://localhost:3000'; // Replace with your actual API URL
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const garden = document.getElementById('garden');
const dateSelector = document.getElementById('date-selector');
const streakDisplay = document.getElementById('streak');
const pastTasks = document.getElementById('past-tasks');
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
    tasks[currentDate].forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        if (task.completed) {
            taskElement.classList.add('completed');
        }
        taskElement.innerHTML = `
            <span>${task.description}</span>
            <div class="task-buttons">
                <button onclick="toggleTask('${task._id}')">${task.completed ? 'not completed' : 'complete'}</button>
                <button onclick="deleteTask('${task._id}')">delete</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });
    updateGarden();
    updateStreak();
    renderPastTasks();
    motivationQuote.textContent = getRandomQuote();
}

function renderPastTasks() {
    pastTasks.innerHTML = '';
    const currentDate = dateSelector.value;
    const sortedDates = Object.keys(tasks)
        .filter(date => date !== currentDate)
        .sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const dateElement = document.createElement('div');
        dateElement.innerHTML = `<h3>${date}</h3>`;
        const taskList = document.createElement('ul');
        taskList.style.listStyleType = 'none';
        taskList.style.padding = '0';

        tasks[date].forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task');
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            taskItem.innerHTML = `<span>${task.description}</span>`;
            taskList.appendChild(taskItem);
        });

        dateElement.appendChild(taskList);
        pastTasks.appendChild(dateElement);
    });
}

function updateGarden() {
    const currentDate = dateSelector.value;
    garden.innerHTML = '<div class="butterfly">🦋</div>';
    const completedTasks = tasks[currentDate].filter(task => task.completed).length;
    for (let i = 0; i < completedTasks; i++) {
        const flower = document.createElement('div');
        flower.classList.add('flower');
        flower.style.left = `${Math.random() * 95}%`;
        flower.style.bottom = `${20 + Math.random() * 50}px`;
        garden.appendChild(flower);
    }
}

async function addTask(description) {
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
    } catch (error) {
        console.error('Error adding task:', error);
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
    let longestStreak = 0;
    let currentStreak = 0;
    let date = new Date();

    while (true) {
        const dateString = date.toISOString().split('T')[0];
        if (!tasks[dateString] || tasks[dateString].length === 0 || !tasks[dateString].every(task => task.completed)) {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
        } else {
            currentStreak++;
            if (dateString !== new Date().toISOString().split('T')[0]) {
                streak++;
            }
        }
        if (!tasks[dateString] || date <= new Date(Object.keys(tasks)[0])) {
            break;
        }
        date.setDate(date.getDate() - 1);
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    streakDisplay.textContent = `🌱 Growing streak: ${streak} days | 🏆 Longest bloom: ${longestStreak} days`;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
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
    const password = document.getElementById('reg-password').value;
    const photoFile = document.getElementById('reg-photo').files[0];

    const formData = new FormData();
    formData.append('username', username);
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
        document.getElementById('profile-photo').src = currentUser.photoUrl ? `http://localhost:3000${currentUser.photoUrl}` : 'http://localhost:3000/uploads/default-profile.png'
    }
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleButton = document.querySelector('#auth-container button:last-child');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        toggleButton.textContent = 'Switch to Register';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        toggleButton.textContent = 'Switch to Login';
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const description = taskInput.value.trim();
    if (description) {
        addTask(description);
        taskInput.value = '';
    }
});

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