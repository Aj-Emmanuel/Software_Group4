document.addEventListener('DOMContentLoaded', () => {
  loadTasks();

  document.getElementById('clearAllBtn').onclick = () => {
    if (confirm('Are you sure you want to clear all tasks?')) {
      document.getElementById('taskList').innerHTML = '';
      localStorage.removeItem('todoTasks');
      updateEmptyImageVisibility();
      updateProgressBar();
    }
  };

  // Hourly reminder for incomplete tasks
  setInterval(() => {
    const tasks = JSON.parse(localStorage.getItem('todoTasks') || '[]');
    const incomplete = tasks.filter(t => !t.isDone);
    if (incomplete.length > 0) {
      alert(`⏰ Reminder: You have ${incomplete.length} incomplete task(s)!`);
    }
  }, 60 * 60 * 1000); // every hour
});

let countdownIntervals = {};

function addTask(taskText = '', isDone = false, dueInMinutes = null, createdAt = null) {
  const taskInput = document.getElementById('taskInput');
  const timeInput = document.getElementById('dueMinutesInput');

  const text = taskText || taskInput.value.trim();
  const dueMinutes = dueInMinutes !== null ? dueInMinutes : parseInt(timeInput.value);

  if (!text) return;
  if (dueInMinutes === null && (isNaN(dueMinutes) || dueMinutes <= 0)) {
    alert('Please enter a valid number of minutes for the due time.');
    return;
  }

  const li = document.createElement('li');
  if (isDone) li.classList.add('done');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = text;
  input.setAttribute('readonly', true);

  const countdown = document.createElement('span');
  countdown.className = 'countdown-timer';

  li.appendChild(input);
  li.appendChild(countdown);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Done';
  if (isDone) doneBtn.disabled = true;

  doneBtn.onclick = () => {
    li.classList.add('done');
    doneBtn.disabled = true;
    clearInterval(countdownIntervals[text]);
    triggerConfetti();
    saveTasks();
    updateEmptyImageVisibility();
    updateProgressBar();
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => {
    clearInterval(countdownIntervals[text]);
    li.remove();
    saveTasks();
    updateEmptyImageVisibility();
    updateProgressBar();
  };

  actions.appendChild(doneBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(actions);

  document.getElementById('taskList').appendChild(li);

  // Calculate due time based on creation time and dueMinutes
  const createdTime = createdAt ? new Date(createdAt) : new Date();
  const dueTime = new Date(createdTime.getTime() + dueMinutes * 60000);

  startCountdown(countdown, text, dueTime, li);

  taskInput.value = '';
  timeInput.value = '';

  saveTasks();
  updateEmptyImageVisibility();
  updateProgressBar();
}

function startCountdown(el, taskName, dueTime, li) {
  const totalMs = dueTime - new Date();
  const alertThreshold = totalMs * 0.05; // 5% of total time
  let warned = false;

  clearInterval(countdownIntervals[taskName]); // Clear existing if any

  countdownIntervals[taskName] = setInterval(() => {
    const now = new Date();
    const msLeft = dueTime - now;

    if (msLeft <= 0) {
      el.textContent = "⏰ Overdue!";
      el.style.color = 'red';
      clearInterval(countdownIntervals[taskName]);
      return;
    }

    if (!warned && msLeft <= alertThreshold) {
      alert(`⚠ Only 5% time left for task: "${taskName}"`);
      warned = true;
    }

    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    el.textContent = `⏳ ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    el.style.color = '#555';
  }, 1000);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#taskList li').forEach(li => {
    const text = li.querySelector('input').value;
    const isDone = li.classList.contains('done');
    const countdownText = li.querySelector('.countdown-timer')?.textContent || '';
    const minutesLeft = extractMinutesFromCountdown(countdownText);
    const createdAt = new Date().toISOString();
    tasks.push({ text, isDone, dueInMinutes: minutesLeft, createdAt });
  });
  localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

function extractMinutesFromCountdown(countdown) {
  const match = countdown.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return 0;
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  return hours * 60 + minutes;
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('todoTasks') || '[]');
  tasks.forEach(task => addTask(task.text, task.isDone, task.dueInMinutes, task.createdAt));
  updateEmptyImageVisibility();
  updateProgressBar();
}

function triggerConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function updateEmptyImageVisibility() {
  const taskList = document.getElementById('taskList');
  const emptyImage = document.getElementById('emptyImage');
  if (!emptyImage) return;
  emptyImage.style.display = taskList.children.length === 0 ? 'block' : 'none';
}

function updateProgressBar() {
  const tasks = document.querySelectorAll('#taskList li');
  const completed = document.querySelectorAll('#taskList li.done');
  const progressBar = document.getElementById('progressBar');
  const progressCircle = document.getElementById('progressCircle');

  const total = tasks.length;
  const done = completed.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  progressBar.style.width = percent + '%';
  progressCircle.textContent = `${done} / ${total}`;
}
