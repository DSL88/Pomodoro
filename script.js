document.addEventListener('DOMContentLoaded', () => {
  // Estado da aplicação
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let selectedTaskId = null;
  let timerInterval = null;
  let remainingTime = 25 * 60;
  let initialTime = 25 * 60;
  let deleteMode = false;
  let tasksToDelete = new Set();
  let isDocumentVisible = true;
  let backgroundStartTime = null;

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
  const testSoundBtn = document.getElementById('test-sound');

  // Sistema de som múltiplo com fallbacks
  let audioCtx;
  let audioEnabled = false;
  
  // Função principal para tocar som de alerta
  function playAlertSound() {
    console.log('🔔 Iniciando reprodução de som de alerta...');
    
    // Garantir que o AudioContext está funcionando
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Tentar múltiplas estratégias sequencialmente para maior sucesso
    Promise.allSettled([
      playWebAudioBell(),
      playHTML5Bell(),
      playNotificationSound(),
      triggerVibration(),
      playSimpleTone() // Novo método mais simples
    ]).then(results => {
      console.log('Resultados dos métodos de som:', results);
      
      // Se nenhum método funcionou, tentar método de emergência
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      if (successCount === 0) {
        console.warn('⚠️ Todos os métodos de som falharam, tentando método de emergência...');
        emergencyBeep();
      } else {
        console.log(`✅ ${successCount} método(s) de som funcionaram`);
      }
    });
  }
  
  // Novo método de som mais simples para emergência
  function playSimpleTone() {
    return new Promise((resolve, reject) => {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        oscillator.stop(context.currentTime + 0.5);
        
        console.log('🎵 Tom simples tocado');
        resolve('Simple tone OK');
      } catch (error) {
        console.warn('❌ Tom simples falhou:', error);
        reject(error);
      }
    });
  }
  
  // Método de emergência usando setInterval para criar som
  function emergencyBeep() {
    console.log('🚨 Usando método de emergência para som...');
    try {
      let frequency = 800;
      let duration = 200;
      let audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          let oscillator = audioContext.createOscillator();
          let gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency - (i * 100);
          oscillator.type = 'square'; // Som mais áspero, mais difícil de ignorar
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration / 1000);
          
          console.log(`🚨 Beep emergência ${i + 1}`);
        }, i * 300);
      }
    } catch (error) {
      console.warn('❌ Método de emergência também falhou:', error);
    }
  }
  
  // Método 1: Web Audio API (campainha)
  async function playWebAudioBell() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      console.log('Web Audio - Estado:', audioCtx.state);
      
      // 3 badaladas de campainha
      const frequencies = [800, 600, 400];
      for (let i = 0; i < frequencies.length; i++) {
        setTimeout(() => {
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Envelope de campainha
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          
          oscillator.frequency.value = frequencies[i];
          oscillator.type = 'sine';
          
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
          
          console.log(`🔔 Badalada ${i + 1}: ${frequencies[i]}Hz`);
        }, i * 300);
      }
      
      return Promise.resolve('Web Audio OK');
    } catch (error) {
      console.warn('❌ Web Audio falhou:', error);
      return Promise.reject(error);
    }
  }
  
  // Método 2: HTML5 Audio (múltiplos beeps)
  function playHTML5Bell() {
    try {
      console.log('🎵 Tentando HTML5 Audio...');
      
      // Criar som de beep mais simples e confiável
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const beepCount = 3;
      
      for (let i = 0; i < beepCount; i++) {
        setTimeout(() => {
          // Criar beep usando Web Audio API mais simples
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Configurações do beep
          oscillator.frequency.value = 800 - (i * 100); // 800Hz, 700Hz, 600Hz
          oscillator.type = 'sine';
          
          // Envelope simples
          const now = audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          
          console.log(`🎵 HTML5 Beep ${i + 1} tocando (${oscillator.frequency.value}Hz)`);
        }, i * 400);
      }
      
      return Promise.resolve('HTML5 Audio OK');
    } catch (error) {
      console.warn('❌ HTML5 Audio falhou:', error);
      
      // Fallback: tentar com elemento Audio tradicional
      try {
        const audio = new Audio();
        // Som de beep mais básico
        audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuV2+/BdSYIKITJ7+OVSQ0PV6zw7qFMEgdMreXlrV4eLhGP3+e4bB4Aj+jr4lYeAI/o6+JWHgCP6OviVh4AjNrr52QlAhZosOXtp1wFBk6t5uCsWBUIUKbj57RkIAY3j9npum4sAy+Dze/eizEJFGq+6eWdVgwKUarm7K9gFgY7k9n1w3YnBSqByO/dkj8OElyx7OigUhUHSKHh8LdjHgg2jdj1xHkpBSd9yO7biDkME2i57OihUhEISqTj76xeFgU9mNn3vnMpByl+xu7diToMEluw6OmlWBQITKXn7K1eHAU5ltv1v3MnAyqAyO/eizIJE2m86eWdWAsGUarm7K9gFgU7k9j1w3YnBSqByO/dkT8OElux7OihUhUHSKHh8LdjHQg3jdj1xHkpBSd+yO7biDoLE2i56+mjWBQITKXn7K1eHAU5ltv1v3MnAyqAyO/eizEJE2m86eWdWAsGUarm7K9gFgU7k9j1w3YnBSqByO/dkT8OElux7OihUhUHSKHh8LdjHQg3jdj1xHkpBSd+yO7biDoLE2i56+mjWBQITKXn7K1eHAU5ltv1v3MnAyqAyO/eizEJE2m86eWdWAsGUarm7K9gFgU7k9j1w3YnBSqByO/dkT8OElux7OihUhUHSKHh8LdjHQg3jdj1xHkpBSd+yO7biDoLE2i56+mjWBQITKXn7K1eHAU=";
        audio.volume = 0.5;
        audio.play();
        return Promise.resolve('Audio fallback OK');
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
      }
    }
  }
  
  // Método 3: Notification API com som
  function playNotificationSound() {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          console.log('🔔 Criando notificação com som...');
          new Notification('🍅 Pomodoro Concluído!', {
            body: 'Hora de fazer uma pausa!',
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
            requireInteraction: true,
            silent: false // Força som da notificação
          });
          return Promise.resolve('Notification OK');
        } else if (Notification.permission === 'default') {
          console.log('📢 Solicitando permissão para notificações...');
          Notification.requestPermission();
        }
      }
      return Promise.reject('Notifications não suportadas');
    } catch (error) {
      console.warn('❌ Notification falhou:', error);
      return Promise.reject(error);
    }
  }
  
  // Método 4: Vibração (mobile)
  function triggerVibration() {
    try {
      if ('vibrate' in navigator) {
        console.log('📳 Ativando vibração...');
        // Padrão: longo-curto-longo-curto-longo
        navigator.vibrate([500, 200, 300, 200, 500]);
        return Promise.resolve('Vibration OK');
      }
      return Promise.reject('Vibration não suportada');
    } catch (error) {
      console.warn('❌ Vibração falhou:', error);
      return Promise.reject(error);
    }
  }
  
  // Função de teste para o botão
  function testBellSound() {
    console.log('🧪 TESTE DE SOM INICIADO');
    playAlertSound();
  }
  
  // Função beep simplificada (mantida para compatibilidade)
  function beep(frequency = 440, duration = 200, volume = 100) {
    console.log(`🎵 Beep: ${frequency}Hz por ${duration}ms`);
    return playWebAudioBell();
  }

  // SVG Circle Metrics - Responsivo
  let RADIUS = 115;
  let CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  
  function updateCircleMetrics() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
      RADIUS = 75;
    } else if (screenWidth <= 768) {
      RADIUS = 85;
    } else {
      RADIUS = 115;
    }
    CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    progressCircle.style.strokeDasharray = `${CIRCUMFERENCE}`;
    updateDisplay(); // Usar a função existente
  }
  
  // Inicializar métricas
  updateCircleMetrics();
  
  // Listener para redimensionamento da janela
  window.addEventListener('resize', updateCircleMetrics);

  // Page Visibility API para timer em background
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Página ficou oculta (background)
      isDocumentVisible = false;
      if (timerInterval) {
        backgroundStartTime = Date.now();
      }
    } else {
      // Página ficou visível novamente
      isDocumentVisible = true;
      if (backgroundStartTime && timerInterval) {
        // Calcular tempo passado em background
        const timeInBackground = Math.floor((Date.now() - backgroundStartTime) / 1000);
        remainingTime = Math.max(0, remainingTime - timeInBackground);
        updateDisplay();
        
        // Se o tempo acabou durante o background
        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          finishTimer();
        }
        
        backgroundStartTime = null;
      }
    }
  });

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
    updateProgress();
  }
  
  function updateProgress() {
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

    // Timer mais preciso
    let startTime = Date.now();
    let initialRemainingTime = remainingTime;
    
    timerInterval = setInterval(() => {
      if (isDocumentVisible) {
        // Calcular tempo baseado no tempo real decorrido
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        remainingTime = Math.max(0, initialRemainingTime - elapsedTime);
        updateDisplay();
        
        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          finishTimer();
        }
      }
      // Se não está visível, o Page Visibility API cuidará da atualização
    }, 100); // Atualizar a cada 100ms para suavidade
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
    console.log('⏰ TIMER FINALIZADO! Iniciando sequência de alerta...');
    
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      task.timeSpent += initialTime;
      saveTasks();
      renderTasks();
    }
    
    // FORÇAR inicialização de áudio
    initializeAudio();
    
    // Aguardar um pouco para garantir que o áudio está pronto
    setTimeout(() => {
      console.log('🔔 Disparando todos os métodos de alerta...');
      playAlertSound();
    }, 100);
    
    // Mostrar notificação visual mais discreta ao invés de alert bloqueante
    setTimeout(() => {
      showPomodoroCompleteNotification();
    }, 1000);
    
    resetTimer();
  }

  // Nova função para notificação visual não bloqueante
  function showPomodoroCompleteNotification() {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'pomodoro-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🍅</div>
        <div class="notification-text">
          <h3>Pomodoro Concluído!</h3>
          <p>Hora de fazer uma pausa</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Função auxiliar para inicializar áudio AGRESSIVAMENTE
  function initializeAudio() {
    console.log('🎵 Inicializando sistema de áudio...');
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ AudioContext criado');
      }
      
      if (audioCtx.state === 'suspended') {
        console.log('🔄 Resumindo AudioContext...');
        audioCtx.resume().then(() => {
          console.log('✅ AudioContext resumido');
          audioEnabled = true;
        }).catch(err => {
          console.warn('❌ Erro ao resumir AudioContext:', err);
        });
      } else {
        audioEnabled = true;
        console.log('✅ AudioContext já ativo');
      }
      
      // Solicitar permissão de notificação
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Permissão de notificação:', permission);
        });
      }
      
    } catch (error) {
      console.warn('❌ Erro na inicialização de áudio:', error);
    }
  }

  // Melhorias para dispositivos móveis
  function initMobileEnhancements() {
    // Prevenir zoom duplo toque em iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Melhorar feedback tátil se disponível
    function vibrate(pattern = 50) {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    }
    
    // Adicionar vibração aos botões principais
    startBtn.addEventListener('click', () => vibrate(50));
    pauseBtn.addEventListener('click', () => vibrate(30));
    resetBtn.addEventListener('click', () => vibrate([30, 30, 30]));
    
    // Adicionar vibração quando o timer termina
    const originalBeep = beep;
    beep = function(...args) {
      vibrate([200, 100, 200, 100, 200]);
      originalBeep.apply(this, args);
    };
  }
  
  // Inicializar melhorias móveis
  if ('ontouchstart' in window) {
    initMobileEnhancements();
  }

  // Event Listeners
  startBtn.addEventListener('click', () => {
    // Inicializa o AudioContext com um gesto do usuário
    initializeAudio();
    startTimer();
  });

  pauseBtn.addEventListener('click', () => {
    initializeAudio();
    pauseTimer();
  });
  
  resetBtn.addEventListener('click', () => {
    initializeAudio();
    resetTimer();
  });

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

  // Event Listener para teste de som
  testSoundBtn.addEventListener('click', () => {
    console.log('🧪 BOTÃO DE TESTE PRESSIONADO');
    initializeAudio();
    
    // Solicitar permissão de notificação se necessário
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
        testBellSound();
      });
    } else {
      testBellSound();
    }
  });

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
