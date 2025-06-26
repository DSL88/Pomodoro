document.addEventListener('DOMContentLoaded', () => {
  // Estado da aplicação
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let selectedTaskId = null;
  let timerInterval = null;
  let remainingTime = 25 * 60;
  let initialTime = 25 * 60;
  let deleteMode = false;
  let tasksToDelete = new Set();

  // Elementos DOM
  const taskForm = document.getElementById('task-form');
  const taskNameInput = document.getElementById('task-name');
  const tasksList = document.getElementById('tasks');
  const timeSelect = document.getElementById('time-select');
  const timeDisplay = document.getElementById('time-display');
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');
  const progressCircle = document.getElementById('progress');
  const themeToggle = document.getElementById('theme-toggle');
  const deleteModeBtn = document.getElementById('delete-mode-btn');
  const deleteControls = document.getElementById('delete-controls');
  const deleteSelectedBtn = document.getElementById('delete-selected-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

  // Web Audio API para o som
  let audioCtx;
  function beep(frequency = 440, duration = 200, volume = 100) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = volume / 100;
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }

  // SVG Circle Metrics
  const RADIUS = 115;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  progressCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
  progressCircle.style.strokeDashoffset = `0`;

  // Funções de Tema
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  });

  // Inicializar tema
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);

  // Popular seletor de tempo
  for (let i = 5; i <= 60; i += 5) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    if (i === 25) {
      option.selected = true;
    }
    timeSelect.appendChild(option);
  }

  // Funções de tarefa
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  function renderTasks() {
    tasksList.innerHTML = '';
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p>Nenhuma tarefa adicionada ainda.</p>';
        return;
    }
    tasks.forEach(task => {
      const li = document.createElement('li');
      
      if (deleteMode) {
        li.classList.add('delete-mode');
        li.innerHTML = `
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${tasksToDelete.has(task.id) ? 'checked' : ''}>
          <div class="task-content">
            <span>${task.name}</span>
            <span>${formatTime(task.timeSpent)}</span>
          </div>
        `;
        
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            tasksToDelete.add(task.id);
          } else {
            tasksToDelete.delete(task.id);
          }
        });
      } else {
        li.innerHTML = `
          <span>${task.name}</span>
          <span>${formatTime(task.timeSpent)}</span>
        `;
        li.addEventListener('click', () => selectTask(task.id));
      }
      
      li.dataset.id = task.id;
      if (!deleteMode) {
        li.classList.toggle('selected', task.id === selectedTaskId);
      }
      tasksList.appendChild(li);
    });
  }

  function addTask(name) {
    const task = { id: Date.now(), name, timeSpent: 0 };
    tasks.push(task);
    saveTasks();
    renderTasks();
  }

  function selectTask(id) {
    selectedTaskId = id;
    renderTasks();
  }

  // Funções de eliminação de tarefas
  function toggleDeleteMode() {
    deleteMode = !deleteMode;
    tasksToDelete.clear();
    
    if (deleteMode) {
      deleteModeBtn.classList.add('active');
      deleteControls.style.display = 'flex';
    } else {
      deleteModeBtn.classList.remove('active');
      deleteControls.style.display = 'none';
    }
    
    renderTasks();
  }

  function deleteSelectedTasks() {
    if (tasksToDelete.size === 0) {
      alert('Por favor, selecione pelo menos uma tarefa para eliminar.');
      return;
    }
    
    const confirmDelete = confirm(`Tem certeza que deseja eliminar ${tasksToDelete.size} tarefa(s)?`);
    if (confirmDelete) {
      tasks = tasks.filter(task => !tasksToDelete.has(task.id));
      
      // Se a tarefa selecionada foi eliminada, limpar a seleção
      if (tasksToDelete.has(selectedTaskId)) {
        selectedTaskId = null;
      }
      
      saveTasks();
      tasksToDelete.clear();
      toggleDeleteMode(); // Sair do modo de eliminação
    }
  }

  function cancelDeleteMode() {
    tasksToDelete.clear();
    toggleDeleteMode();
  }

  // Funções de timer
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(remainingTime);
    const offset = CIRCUMFERENCE - (remainingTime / initialTime) * CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = offset;
  }

  function startTimer() {
    if (!selectedTaskId) {
      alert('Por favor, selecione uma tarefa para iniciar o pomodoro.');
      return;
    }
    
    clearInterval(timerInterval);
    initialTime = timeSelect.value * 60;
    if(remainingTime === 0 || remainingTime > initialTime) {
        remainingTime = initialTime;
    }

    updateDisplay();
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    timeSelect.disabled = true;

    timerInterval = setInterval(() => {
      remainingTime--;
      updateDisplay();
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        finishTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    initialTime = timeSelect.value * 60;
    remainingTime = initialTime;
    updateDisplay();
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    timeSelect.disabled = false;
  }

  function finishTimer() {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      task.timeSpent += initialTime;
      saveTasks();
      renderTasks();
    }
    
    beep(523, 500, 80); // Toca um som de "Dó" (C5)

    alert('Pomodoro concluído! Hora de uma pausa.');
    resetTimer();
  }

  // Event Listeners
  startBtn.addEventListener('click', () => {
    // Inicializa o AudioContext com um gesto do usuário
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    startTimer();
  });

  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Event Listener para adição de tarefas
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    if (taskNameInput.value.trim()) {
      addTask(taskNameInput.value.trim());
      taskNameInput.value = '';
    }
  });

  // Event Listeners para eliminação de tarefas
  deleteModeBtn.addEventListener('click', toggleDeleteMode);
  deleteSelectedBtn.addEventListener('click', deleteSelectedTasks);
  cancelDeleteBtn.addEventListener('click', cancelDeleteMode);

  // Event Listener para mudança de tempo
  timeSelect.addEventListener('change', () => {
      initialTime = timeSelect.value * 60;
      remainingTime = initialTime;
      updateDisplay();
  });

  // Inicialização
  renderTasks();
  resetTimer();
});
