document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Pomodoro Timer - Análise e Debug do Código');
  
  // ========================================
  // ANÁLISE INICIAL DO SISTEMA
  // ========================================
  
  // Verificar se todos os elementos DOM existem
  const requiredElements = [
    'task-form', 'task-name', 'tasks', 'time-select', 'time-display',
    'start', 'pause', 'reset', 'progress', 'theme-toggle',
    'delete-mode-btn', 'delete-controls', 'delete-selected-btn',
    'cancel-delete-btn', 'test-sound'
  ];
  
  const missingElements = [];
  const foundElements = {};
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      foundElements[id] = element;
      console.log(`✅ Elemento encontrado: ${id}`);
    } else {
      missingElements.push(id);
      console.error(`❌ Elemento não encontrado: ${id}`);
    }
  });
  
  if (missingElements.length > 0) {
    console.error('⚠️ ERRO CRÍTICO: Elementos DOM ausentes:', missingElements);
    return;
  }
  
  console.log('✅ Todos os elementos DOM foram encontrados');
  
  // ========================================
  // SISTEMA DE RECONHECIMENTO DE IP SIMPLIFICADO
  // ========================================
  
  let userIP = null;
  let currentSession = 'pomodoro_local_session';
  let tasks = [];
  let selectedTaskId = null;
  let timerInterval = null;
  let remainingTime = 25 * 60;
  let initialTime = 25 * 60;
  let deleteMode = false;
  let tasksToDelete = new Set();
  
  // Função para obter IP (simplificada)
  async function getUserIP() {
    try {
      console.log('🌐 Tentando obter IP do usuário...');
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      
      if (data.ip) {
        console.log(`✅ IP obtido: ${data.ip}`);
        return data.ip;
      }
    } catch (error) {
      console.warn('❌ Não foi possível obter IP:', error);
    }
    
    // Fallback: usar fingerprint simples
    const fingerprint = btoa(navigator.userAgent + navigator.language).substring(0, 16);
    console.log(`🔍 Usando fingerprint: ${fingerprint}`);
    return fingerprint;
  }
  
  // Inicializar sessão
  async function initSession() {
    try {
      userIP = await getUserIP();
      currentSession = `pomodoro_session_${userIP}`;
      
      console.log(`👤 Sessão atual: ${currentSession}`);
      
      // Carregar dados da sessão
      const savedData = localStorage.getItem(currentSession);
      if (savedData) {
        const sessionData = JSON.parse(savedData);
        tasks = sessionData.tasks || [];
        console.log(`📂 ${tasks.length} tarefas carregadas`);
      } else {
        console.log('🆕 Nova sessão criada');
        // Migrar dados antigos se existirem
        const oldTasks = localStorage.getItem('tasks');
        if (oldTasks) {
          tasks = JSON.parse(oldTasks);
          saveTasks(); // Salvar na nova sessão
          console.log('🔄 Dados migrados para nova sessão');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar sessão:', error);
      currentSession = 'pomodoro_default';
    }
  }
  
  // Salvar tarefas
  function saveTasks() {
    try {
      const sessionData = {
        tasks: tasks,
        lastUpdate: new Date().toISOString(),
        userIP: userIP
      };
      localStorage.setItem(currentSession, JSON.stringify(sessionData));
      console.log('💾 Dados salvos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
    }
  }
  
  // ========================================
  // SISTEMA DE ÁUDIO ROBUSTO
  // ========================================
  
  let audioContext = null;
  
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('🎵 AudioContext inicializado');
    } catch (error) {
      console.warn('❌ Erro ao inicializar áudio:', error);
    }
  }
  
  function playSound() {
    console.log('🔔 Reproduzindo som de alerta...');
    
    // Método 1: Web Audio API
    if (audioContext) {
      try {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800 - (i * 100);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log(`🔔 Beep ${i + 1} reproduzido`);
          }, i * 400);
        }
      } catch (error) {
        console.warn('❌ Web Audio falhou:', error);
      }
    }
    
    // Método 2: Notificação
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 Pomodoro Concluído!', {
        body: 'Hora de fazer uma pausa!',
        silent: false
      });
    }
    
    // Método 3: Vibração (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 300, 200, 500]);
    }
  }
  
  // ========================================
  // INTERFACE E FUNCIONALIDADES
  // ========================================
  
  // Formatação de tempo
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Atualizar display
  function updateDisplay() {
    const timeDisplay = foundElements['time-display'];
    const progressCircle = foundElements['progress'];
    
    if (timeDisplay) {
      timeDisplay.textContent = formatTime(remainingTime);
    }
    
    if (progressCircle) {
      const progress = (initialTime - remainingTime) / initialTime;
      const circumference = 2 * Math.PI * 115;
      const offset = circumference - (progress * circumference);
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = offset;
    }
  }
  
  // Renderizar tarefas
  function renderTasks() {
    const tasksList = foundElements['tasks'];
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
      tasksList.innerHTML = '<p>Nenhuma tarefa adicionada ainda.</p>';
      return;
    }
    
    tasks.forEach(task => {
      const li = document.createElement('li');
      
      if (deleteMode) {
        // Modo de exclusão: adicionar checkbox
        li.innerHTML = `
          <label class="task-checkbox">
            <input type="checkbox" ${tasksToDelete.has(task.id) ? 'checked' : ''}>
            <span>${task.name}</span>
            <span>${formatTime(task.timeSpent)}</span>
          </label>
        `;
        
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            tasksToDelete.add(task.id);
          } else {
            tasksToDelete.delete(task.id);
          }
          updateDeleteControls();
        });
        
      } else {
        // Modo normal: seleção de tarefa
        li.innerHTML = `
          <span>${task.name}</span>
          <span>${formatTime(task.timeSpent)}</span>
        `;
        
        if (task.id === selectedTaskId) {
          li.classList.add('selected');
        }
        
        li.addEventListener('click', () => {
          selectedTaskId = task.id;
          renderTasks();
        });
      }
      
      tasksList.appendChild(li);
    });
    
    console.log(`📋 ${tasks.length} tarefas renderizadas ${deleteMode ? '(modo exclusão)' : ''}`);
  }
  
  // Alternar modo de exclusão
  function toggleDeleteMode() {
    deleteMode = !deleteMode;
    tasksToDelete.clear();
    
    const deleteModeBtn = foundElements['delete-mode-btn'];
    const deleteControls = foundElements['delete-controls'];
    
    if (deleteMode) {
      deleteModeBtn.textContent = '❌';
      deleteModeBtn.title = 'Cancelar exclusão';
      deleteControls.style.display = 'block';
      console.log('🗑️ Modo de exclusão ativado');
    } else {
      deleteModeBtn.textContent = '🗑️';
      deleteModeBtn.title = 'Eliminar tarefas';
      deleteControls.style.display = 'none';
      console.log('✅ Modo de exclusão desativado');
    }
    
    renderTasks();
    updateDeleteControls();
  }
  
  // Atualizar controles de exclusão
  function updateDeleteControls() {
    const deleteSelectedBtn = foundElements['delete-selected-btn'];
    if (deleteSelectedBtn) {
      deleteSelectedBtn.disabled = tasksToDelete.size === 0;
      deleteSelectedBtn.textContent = tasksToDelete.size > 0 
        ? `Eliminar ${tasksToDelete.size} tarefa${tasksToDelete.size > 1 ? 's' : ''}` 
        : 'Eliminar Selecionadas';
    }
  }
  
  // Excluir tarefas selecionadas
  function deleteSelectedTasks() {
    if (tasksToDelete.size === 0) return;
    
    const taskNames = tasks
      .filter(task => tasksToDelete.has(task.id))
      .map(task => task.name);
    
    const confirmMessage = `Tem certeza que deseja excluir ${tasksToDelete.size} tarefa${tasksToDelete.size > 1 ? 's' : ''}?\n\n${taskNames.join('\n')}`;
    
    if (confirm(confirmMessage)) {
      // Remover tarefas selecionadas
      tasks = tasks.filter(task => !tasksToDelete.has(task.id));
      
      // Se a tarefa selecionada foi excluída, limpar seleção
      if (selectedTaskId && tasksToDelete.has(selectedTaskId)) {
        selectedTaskId = null;
      }
      
      // Salvar e atualizar interface
      saveTasks();
      toggleDeleteMode(); // Sair do modo de exclusão
      
      console.log(`🗑️ ${tasksToDelete.size} tarefa(s) excluída(s)`);
      
      // Mostrar notificação de sucesso
      showNotification(`✅ ${tasksToDelete.size} tarefa${tasksToDelete.size > 1 ? 's' : ''} excluída${tasksToDelete.size > 1 ? 's' : ''} com sucesso!`, 'success');
    }
  }
  
  // Mostrar notificação temporária
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // Timer
  function startTimer() {
    if (!selectedTaskId) {
      alert('Selecione uma tarefa primeiro!');
      return;
    }
    
    console.log('▶️ Timer iniciado');
    initAudio();
    
    foundElements['start'].disabled = true;
    foundElements['pause'].disabled = false;
    foundElements['reset'].disabled = false;
    
    let startTime = Date.now();
    let initialRemainingTime = remainingTime;
    
    timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      remainingTime = Math.max(0, initialRemainingTime - elapsedTime);
      updateDisplay();
      
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        finishTimer();
      }
    }, 100);
  }
  
  function pauseTimer() {
    console.log('⏸️ Timer pausado');
    clearInterval(timerInterval);
    foundElements['start'].disabled = false;
    foundElements['pause'].disabled = true;
  }
  
  function resetTimer() {
    console.log('🔄 Timer resetado');
    clearInterval(timerInterval);
    const timeSelect = foundElements['time-select'];
    initialTime = timeSelect.value * 60;
    remainingTime = initialTime;
    updateDisplay();
    
    foundElements['start'].disabled = false;
    foundElements['pause'].disabled = true;
    foundElements['reset'].disabled = true;
  }
  
  function finishTimer() {
    console.log('✅ Timer finalizado!');
    
    // Atualizar tempo gasto na tarefa
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      task.timeSpent += initialTime;
      saveTasks();
      renderTasks();
    }
    
    // Reproduzir som
    playSound();
    
    // Notificação visual
    setTimeout(() => {
      alert('🍅 Pomodoro concluído! Hora de uma pausa.');
    }, 500);
    
    resetTimer();
  }
  
  // ========================================
  // EVENT LISTENERS
  // ========================================
  
  // Formulário de tarefas
  foundElements['task-form'].addEventListener('submit', e => {
    e.preventDefault();
    const taskName = foundElements['task-name'].value.trim();
    if (taskName) {
      const task = { id: Date.now(), name: taskName, timeSpent: 0 };
      tasks.push(task);
      saveTasks();
      renderTasks();
      foundElements['task-name'].value = '';
      console.log(`➕ Tarefa adicionada: ${taskName}`);
    }
  });
  
  // Botões do timer
  foundElements['start'].addEventListener('click', startTimer);
  foundElements['pause'].addEventListener('click', pauseTimer);
  foundElements['reset'].addEventListener('click', resetTimer);
  
  // Teste de som
  foundElements['test-sound'].addEventListener('click', () => {
    console.log('🧪 Testando som...');
    initAudio();
    
    // Solicitar permissão de notificação
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificação:', permission);
        playSound();
      });
    } else {
      playSound();
    }
  });
  
  // Seletor de tempo
  const timeSelect = foundElements['time-select'];
  for (let i = 5; i <= 60; i += 5) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    if (i === 25) option.selected = true;
    timeSelect.appendChild(option);
  }
  
  timeSelect.addEventListener('change', () => {
    initialTime = timeSelect.value * 60;
    remainingTime = initialTime;
    updateDisplay();
  });
  
  // Tema
  foundElements['theme-toggle'].addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    foundElements['theme-toggle'].textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
  
  // Botões de exclusão
  foundElements['delete-mode-btn'].addEventListener('click', toggleDeleteMode);
  
  foundElements['delete-selected-btn'].addEventListener('click', deleteSelectedTasks);
  
  foundElements['cancel-delete-btn'].addEventListener('click', () => {
    toggleDeleteMode(); // Sair do modo de exclusão
  });
  
  // ========================================
  // INICIALIZAÇÃO
  // ========================================
  
  async function initialize() {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializar tema
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    foundElements['theme-toggle'].textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    // Inicializar sessão
    await initSession();
    
    // Renderizar interface
    renderTasks();
    updateDisplay();
    
    // Adicionar indicador de sessão
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--card-bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.8em;
      opacity: 0.7;
      z-index: 1000;
    `;
    indicator.innerHTML = `
      👤 Sessão: ${userIP ? userIP.substring(0, 8) + '...' : 'Local'} | 
      📋 ${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''}
    `;
    document.body.appendChild(indicator);
    
    console.log('✅ Aplicação inicializada com sucesso!');
    console.log('📊 RELATÓRIO DE DEBUG:');
    console.log(`- IP do usuário: ${userIP}`);
    console.log(`- Sessão: ${currentSession}`);
    console.log(`- Tarefas carregadas: ${tasks.length}`);
    console.log(`- Tema ativo: ${savedTheme}`);
    console.log(`- AudioContext: ${audioContext ? 'Disponível' : 'Não disponível'}`);
    console.log(`- Notificações: ${Notification.permission}`);
    console.log(`- Vibração: ${'vibrate' in navigator ? 'Suportada' : 'Não suportada'}`);
  }
  
  // Iniciar aplicação
  initialize();
});
