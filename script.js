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
    'cancel-delete-btn', 'test-sound', 'selected-task-name', 'task-blocks-container'
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
  
  // Função para obter identificador de sessão consistente
  async function getSessionIdentifier() {
    try {
      // Primeiro, verificar se já temos um identificador salvo
      let savedIdentifier = localStorage.getItem('pomodoro_user_identifier');
      if (savedIdentifier) {
        console.log(`🔑 Identificador salvo encontrado: ${savedIdentifier}`);
        return savedIdentifier;
      }
      
      console.log('🌐 Tentando obter IP do usuário...');
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 3000 // 3 segundos de timeout
      });
      const data = await response.json();
      
      if (data.ip) {
        console.log(`✅ IP obtido: ${data.ip}`);
        localStorage.setItem('pomodoro_user_identifier', data.ip);
        return data.ip;
      }
    } catch (error) {
      console.warn('❌ Não foi possível obter IP:', error);
    }
    
    // Fallback: gerar ou recuperar fingerprint persistente
    let fingerprint = localStorage.getItem('pomodoro_fingerprint');
    if (!fingerprint) {
      fingerprint = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('pomodoro_fingerprint', fingerprint);
      console.log(`🆕 Novo fingerprint gerado: ${fingerprint}`);
    } else {
      console.log(`🔍 Fingerprint recuperado: ${fingerprint}`);
    }
    
    localStorage.setItem('pomodoro_user_identifier', fingerprint);
    return fingerprint;
  }
  
  // Inicializar sessão
  async function initSession() {
    try {
      userIP = await getSessionIdentifier();
      currentSession = `pomodoro_session_${userIP}`;
      
      console.log(`👤 Sessão atual: ${currentSession}`);
      
      // Carregar dados da sessão
      const savedData = localStorage.getItem(currentSession);
      if (savedData) {
        try {
          const sessionData = JSON.parse(savedData);
          tasks = sessionData.tasks || [];
          console.log(`📂 ${tasks.length} tarefas carregadas da sessão: ${currentSession}`);
        } catch (parseError) {
          console.error('❌ Erro ao parsear dados da sessão:', parseError);
          console.log('🔄 Tentando recuperar do backup...');
          if (!recoverFromBackup()) {
            tasks = [];
            console.log('🆕 Iniciando com lista vazia');
          }
        }
      } else {
        console.log('🆕 Nova sessão criada');
        // Migrar dados antigos se existirem
        const oldTasks = localStorage.getItem('tasks');
        if (oldTasks) {
          try {
            tasks = JSON.parse(oldTasks);
            saveTasks(); // Salvar na nova sessão
            console.log('🔄 Dados migrados para nova sessão');
          } catch (migrateError) {
            console.error('❌ Erro ao migrar dados antigos:', migrateError);
            if (!recoverFromBackup()) {
              tasks = [];
            }
          }
        } else if (!recoverFromBackup()) {
          tasks = [];
        }
      }
      
      // Verificar integridade dos dados carregados
      verifyDataIntegrity();
      
      // Migrar tarefas antigas para incluir histórico de pomodoros
      let needsMigration = false;
      tasks.forEach(task => {
        if (!task.pomodoroHistory) {
          task.pomodoroHistory = [];
          needsMigration = true;
        }
      });
      
      if (needsMigration) {
        saveTasks();
        console.log('🔧 Tarefas migradas para incluir histórico de pomodoros');
      }
      
      // Debug: Listar todas as chaves do localStorage relacionadas ao pomodoro
      console.log('🔍 Debug - Chaves do localStorage:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('pomodoro')) {
          console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar sessão:', error);
      currentSession = 'pomodoro_default';
      
      // Tentar carregar dados padrão
      const defaultData = localStorage.getItem(currentSession);
      if (defaultData) {
        const sessionData = JSON.parse(defaultData);
        tasks = sessionData.tasks || [];
        console.log(`📂 ${tasks.length} tarefas carregadas da sessão padrão`);
      }
    }
  }
  
  // Salvar tarefas
  function saveTasks() {
    try {
      if (!currentSession) {
        console.error('❌ Sessão não inicializada, não é possível salvar');
        return;
      }
      
      const sessionData = {
        tasks: tasks,
        lastUpdate: new Date().toISOString(),
        userIP: userIP,
        version: '2.0'
      };
      
      localStorage.setItem(currentSession, JSON.stringify(sessionData));
      console.log(`💾 ${tasks.length} tarefas salvas na sessão: ${currentSession}`);
      console.log(`📊 Dados salvos: ${JSON.stringify(sessionData).length} bytes`);
      
      // Verificar se realmente foi salvo
      const verification = localStorage.getItem(currentSession);
      if (verification) {
        console.log('✅ Verificação: dados foram salvos corretamente');
      } else {
        console.error('❌ Verificação: falha ao salvar dados');
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      
      // Tentar salvar em fallback
      try {
        localStorage.setItem('pomodoro_backup', JSON.stringify({
          tasks: tasks,
          timestamp: new Date().toISOString()
        }));
        console.log('💾 Backup salvo em pomodoro_backup');
      } catch (backupError) {
        console.error('❌ Erro ao salvar backup:', backupError);
      }
    }
  }
  
  // ========================================
  // SISTEMA DE ÁUDIO ROBUSTO
  // ========================================
  
  let audioContext = null;
  let audioInitialized = false;
  
  async function initAudio() {
    if (audioInitialized && audioContext) {
      return true;
    }
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Garantir que o AudioContext está ativo
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      audioInitialized = true;
      console.log('🎵 AudioContext inicializado e ativo');
      return true;
      
    } catch (error) {
      console.warn('❌ Erro ao inicializar áudio:', error);
      audioInitialized = false;
      return false;
    }
  }
  
  // Criar som de beep usando Web Audio API
  function createBeep(frequency = 800, duration = 0.5, volume = 0.3) {
    return new Promise((resolve) => {
      if (!audioContext || audioContext.state !== 'running') {
        resolve(false);
        return;
      }
      
      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
        
        oscillator.onended = () => resolve(true);
        
      } catch (error) {
        console.warn('❌ Erro ao criar beep:', error);
        resolve(false);
      }
    });
  }
  
  // Reproduzir sequência de beeps
  async function playBeepSequence() {
    const frequencies = [800, 700, 600];
    let success = false;
    
    for (let i = 0; i < frequencies.length; i++) {
      const beepSuccess = await createBeep(frequencies[i], 0.5, 0.3);
      if (beepSuccess) {
        success = true;
        console.log(`🔔 Beep ${i + 1} reproduzido`);
      }
      
      // Pequena pausa entre beeps
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return success;
  }
  
  // Fallback: usar elemento Audio HTML
  function playAudioFallback() {
    try {
      // Criar um tom usando data URL
      const audioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuKz/Hn8k8OGmiC2+m1YxwJZJ7k8cR5LgUve8Hx3Y1ACBVOteLvqVEQCU+l4/C7aR4GM5HY88p9LgUme8Dz3Y9CChVeseLqqF0SC0yh5PG9aR0FMY/a9dF7MAUsfMBy34tACRNVtu/sn1MoClOm4/K9aRsFOZHV88p9LAUpe8T13Y1ACC5QseHvrVMQClOm5fC7aR0FMZPb9NJCAQIDBAUGBwgJCgsMDQ4P';
      const audio = new Audio(audioData);
      audio.volume = 0.5;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔔 Audio fallback reproduzido');
          })
          .catch(error => {
            console.warn('❌ Audio fallback falhou:', error);
          });
      }
      
      return true;
      
    } catch (error) {
      console.warn('❌ Erro no audio fallback:', error);
      return false;
    }
  }
  
  async function playSound() {
    console.log('🔔 Reproduzindo som de alerta...');
    
    let soundPlayed = false;
    
    // Método 1: Tentar inicializar e usar Web Audio API
    const audioReady = await initAudio();
    if (audioReady) {
      soundPlayed = await playBeepSequence();
    }
    
    // Método 2: Se Web Audio falhou, usar fallback
    if (!soundPlayed) {
      console.log('🔄 Tentando fallback de áudio...');
      soundPlayed = playAudioFallback();
    }
    
    // Método 3: Notificação do sistema
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 Pomodoro Concluído!', {
        body: 'Hora de fazer uma pausa!',
        silent: false, // Permitir som da notificação
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzIiIGZpbGw9IiNmZjZjNmMiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIxMiIgeT0iMTIiPgo8cGF0aCBkPSJNMjAgMzVDMjguMjg0MyAzNSAzNSAyOC4yODQzIDM1IDIwQzM1IDExLjcxNTcgMjguMjg0MyA1IDIwIDVDMTEuNzE1NyA1IDUgMTEuNzE1NyA1IDIwQzUgMjguMjg0MyAxMS43MTU3IDM1IDIwIDM1WiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4KPC9zdmc+'
      });
      console.log('📱 Notificação do sistema enviada');
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Tentar pedir permissão para notificações
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('🍅 Pomodoro Concluído!', {
            body: 'Hora de fazer uma pausa!',
            silent: false
          });
        }
      });
    }
    
    // Método 4: Vibração (mobile)
    if ('vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
      console.log('📳 Vibração ativada');
    }
    
    // Método 5: Alert visual como último recurso
    if (!soundPlayed) {
      console.log('⚠️ Nenhum som pôde ser reproduzido, usando alert');
    }
    
    console.log(`🎵 Sistema de som executado. Som reproduzido: ${soundPlayed ? 'Sim' : 'Não'}`);
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
        const hasHistory = task.timeSpent > 0 && task.pomodoroHistory && task.pomodoroHistory.length > 0;
        
        li.innerHTML = `
          <span>${task.name} ${hasHistory ? '📊' : ''}</span>
          <span>${formatTime(task.timeSpent)}</span>
        `;
        
        if (hasHistory) {
          li.style.cursor = 'pointer';
          li.title = 'Clique para ver o histórico de pomodoros';
        }
        
        if (task.id === selectedTaskId) {
          li.classList.add('selected');
        }
        
        li.addEventListener('click', () => {
          // Se a tarefa tem tempo registrado, mostrar histórico
          if (hasHistory) {
            showPomodoroHistory(task);
          } else {
            // Caso contrário, apenas selecionar a tarefa
            selectedTaskId = task.id;
            renderTasks();
            renderTaskBlocks();
          }
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
  async function startTimer() {
    if (!selectedTaskId) {
      alert('Selecione uma tarefa primeiro!');
      return;
    }
    
    console.log('▶️ Timer iniciado');
    
    // Inicializar áudio com interação do usuário
    await initAudio();
    
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
  
  async function finishTimer() {
    console.log('✅ Timer finalizado!');
    
    // Atualizar tempo gasto na tarefa
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      task.timeSpent += initialTime;
      
      // Garantir que existe o array de histórico (para tarefas antigas)
      if (!task.pomodoroHistory) {
        task.pomodoroHistory = [];
      }
      
      // Adicionar pomodoro ao histórico
      const pomodoroSession = {
        id: Date.now(),
        duration: initialTime,
        completedAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      
      task.pomodoroHistory.push(pomodoroSession);
      
      saveTasks();
      renderTasks();
      renderTaskBlocks();
      
      console.log(`🍅 Pomodoro registrado: ${formatTime(initialTime)} em ${task.name}`);
    }
    
    // Reproduzir som (primeira prioridade)
    console.log('🔔 Iniciando reprodução de som...');
    await playSound();
    
    // Notificação visual (depois do som)
    setTimeout(() => {
      alert('🍅 Pomodoro concluído! Hora de uma pausa.');
    }, 1000); // Dar mais tempo para o som
    
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
      const task = { 
        id: Date.now(), 
        name: taskName, 
        timeSpent: 0,
        pomodoroHistory: [] // Histórico de pomodoros realizados
      };
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
  foundElements['test-sound'].addEventListener('click', async () => {
    console.log('🧪 Testando som...');
    
    // Garantir que o áudio seja inicializado com interação do usuário
    await initAudio();
    
    // Solicitar permissão de notificação se necessário
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Permissão de notificação:', permission);
    }
    
    // Reproduzir som de teste
    await playSound();
    
    // Mostrar feedback visual
    const button = foundElements['test-sound'];
    const originalText = button.textContent;
    button.textContent = '✅ Som testado!';
    button.style.background = '#28a745';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
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
    renderTaskBlocks();
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
  
  // Mostrar histórico de pomodoros de uma tarefa
  function showPomodoroHistory(task) {
    // Criar modal para mostrar o histórico
    const modal = document.createElement('div');
    modal.className = 'pomodoro-history-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--card-bg-color);
      border-radius: 16px;
      padding: 24px;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    `;
    
    // Cabeçalho do modal
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid var(--border-color);
    `;
    
    const title = document.createElement('h2');
    title.textContent = `🍅 Histórico: ${task.name}`;
    title.style.cssText = `
      margin: 0;
      color: var(--text-color);
      font-size: 1.3em;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '❌';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'var(--border-color)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'none';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Estatísticas resumidas
    const stats = document.createElement('div');
    stats.style.cssText = `
      background: var(--bg-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      text-align: center;
    `;
    
    const totalPomodoros = task.pomodoroHistory.length;
    const totalTime = task.timeSpent;
    const avgDuration = totalTime / totalPomodoros;
    
    stats.innerHTML = `
      <div>
        <div style="font-size: 2em; color: var(--primary-color);">🍅</div>
        <div style="font-weight: 600; margin: 4px 0;">${totalPomodoros}</div>
        <div style="font-size: 0.9em; opacity: 0.7;">Pomodoros</div>
      </div>
      <div>
        <div style="font-size: 2em; color: var(--primary-color);">⏱️</div>
        <div style="font-weight: 600; margin: 4px 0;">${formatTime(totalTime)}</div>
        <div style="font-size: 0.9em; opacity: 0.7;">Tempo Total</div>
      </div>
      <div>
        <div style="font-size: 2em; color: var(--primary-color);">📊</div>
        <div style="font-weight: 600; margin: 4px 0;">${formatTime(Math.round(avgDuration))}</div>
        <div style="font-size: 0.9em; opacity: 0.7;">Média</div>
      </div>
    `;
    
    // Lista de pomodoros (mais recentes primeiro)
    const historyList = document.createElement('div');
    historyList.style.cssText = `
      max-height: 300px;
      overflow-y: auto;
    `;
    
    const sortedHistory = [...task.pomodoroHistory].reverse();
    
    sortedHistory.forEach((pomodoro, index) => {
      const pomodoroItem = document.createElement('div');
      pomodoroItem.style.cssText = `
        background: var(--bg-color);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border-left: 4px solid var(--primary-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: transform 0.2s;
      `;
      pomodoroItem.onmouseover = () => pomodoroItem.style.transform = 'translateX(4px)';
      pomodoroItem.onmouseout = () => pomodoroItem.style.transform = 'translateX(0)';
      
      const leftContent = document.createElement('div');
      leftContent.innerHTML = `
        <div style="font-weight: 600; color: var(--text-color); margin-bottom: 4px;">
          📅 ${pomodoro.date}
        </div>
        <div style="font-size: 0.9em; opacity: 0.8;">
          🕐 ${pomodoro.time}
        </div>
      `;
      
      const rightContent = document.createElement('div');
      rightContent.style.textAlign = 'right';
      rightContent.innerHTML = `
        <div style="font-weight: 600; color: var(--primary-color); font-size: 1.1em;">
          ${formatTime(pomodoro.duration)}
        </div>
        <div style="font-size: 0.8em; opacity: 0.6;">
          #${totalPomodoros - index}
        </div>
      `;
      
      pomodoroItem.appendChild(leftContent);
      pomodoroItem.appendChild(rightContent);
      historyList.appendChild(pomodoroItem);
    });
    
    // Botão para selecionar tarefa
    const selectBtn = document.createElement('button');
    selectBtn.textContent = '✅ Selecionar esta tarefa';
    selectBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-top: 20px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    `;
    selectBtn.onmouseover = () => selectBtn.style.background = 'var(--primary-hover-color)';
    selectBtn.onmouseout = () => selectBtn.style.background = 'var(--primary-color)';
    
    // Event listeners
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    selectBtn.addEventListener('click', () => {
      selectedTaskId = task.id;
      renderTasks();
      renderTaskBlocks();
      document.body.removeChild(modal);
    });
    
    // Montar modal
    modalContent.appendChild(header);
    modalContent.appendChild(stats);
    modalContent.appendChild(historyList);
    modalContent.appendChild(selectBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    console.log(`📊 Histórico mostrado para tarefa: ${task.name} (${totalPomodoros} pomodoros)`);
  }
  
  // Renderizar blocos de pomodoros da tarefa selecionada
  function renderTaskBlocks() {
    const selectedTaskNameEl = foundElements['selected-task-name'];
    const blocksContainer = foundElements['task-blocks-container'];
    
    if (!selectedTaskNameEl || !blocksContainer) return;
    
    // Se nenhuma tarefa selecionada
    if (!selectedTaskId) {
      selectedTaskNameEl.textContent = 'Selecione uma tarefa';
      blocksContainer.innerHTML = '<p class="no-task-message">Nenhuma tarefa selecionada</p>';
      return;
    }
    
    // Encontrar a tarefa selecionada
    const selectedTask = tasks.find(task => task.id === selectedTaskId);
    if (!selectedTask) return;
    
    // Atualizar nome da tarefa
    selectedTaskNameEl.textContent = `🍅 ${selectedTask.name}`;
    
    // Se a tarefa não tem pomodoros
    if (!selectedTask.pomodoroHistory || selectedTask.pomodoroHistory.length === 0) {
      blocksContainer.innerHTML = '<p class="no-task-message">Nenhum pomodoro realizado ainda</p>';
      return;
    }
    
    // Renderizar blocos
    blocksContainer.innerHTML = '';
    
    selectedTask.pomodoroHistory.forEach((pomodoro, index) => {
      const block = document.createElement('div');
      block.className = 'pomodoro-block';
      
      // Adicionar classe baseada na duração
      const durationMinutes = Math.round(pomodoro.duration / 60);
      block.classList.add(`duration-${durationMinutes}`);
      
      // Formato da data: dd-MM
      const date = new Date(pomodoro.completedAt);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      block.innerHTML = `
        <span class="date">${formattedDate}</span>
        <span class="time">${pomodoro.time}</span>
        <span class="duration">${formatTime(pomodoro.duration)}</span>
      `;
      
      // Tooltip com informações detalhadas
      block.title = `Pomodoro #${index + 1}\nData: ${pomodoro.date}\nHora: ${pomodoro.time}\nDuração: ${formatTime(pomodoro.duration)}`;
      
      // Click para mostrar detalhes
      block.addEventListener('click', () => {
        showPomodoroDetails(pomodoro, index + 1, selectedTask.name);
      });
      
      blocksContainer.appendChild(block);
    });
    
    console.log(`📊 ${selectedTask.pomodoroHistory.length} blocos renderizados para: ${selectedTask.name}`);
  }
  
  // Mostrar detalhes de um pomodoro específico
  function showPomodoroDetails(pomodoro, pomodoroNumber, taskName) {
    const notification = document.createElement('div');
    notification.className = 'pomodoro-details-notification';
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--card-bg-color);
      border: 2px solid var(--primary-color);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      max-width: 300px;
      text-align: center;
    `;
    
    notification.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: var(--primary-color);">
        🍅 Pomodoro #${pomodoroNumber}
      </h3>
      <p style="margin: 8px 0; color: var(--text-color);">
        <strong>Tarefa:</strong> ${taskName}
      </p>
      <p style="margin: 8px 0; color: var(--text-color);">
        <strong>Data:</strong> ${pomodoro.date}
      </p>
      <p style="margin: 8px 0; color: var(--text-color);">
        <strong>Hora:</strong> ${pomodoro.time}
      </p>
      <p style="margin: 8px 0; color: var(--text-color);">
        <strong>Duração:</strong> ${formatTime(pomodoro.duration)}
      </p>
      <button style="
        margin-top: 16px;
        padding: 8px 16px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">Fechar</button>
    `;
    
    const closeBtn = notification.querySelector('button');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(notification);
    });
    
    // Fechar ao clicar fora
    setTimeout(() => {
      const clickOutside = (e) => {
        if (!notification.contains(e.target)) {
          document.body.removeChild(notification);
          document.removeEventListener('click', clickOutside);
        }
      };
      document.addEventListener('click', clickOutside);
    }, 100);
    
    document.body.appendChild(notification);
  }
  
  // Recuperar dados de backup se necessário
  function recoverFromBackup() {
    try {
      const backup = localStorage.getItem('pomodoro_backup');
      if (backup) {
        const backupData = JSON.parse(backup);
        if (backupData.tasks && Array.isArray(backupData.tasks)) {
          tasks = backupData.tasks;
          saveTasks(); // Salvar na sessão atual
          console.log(`🔄 ${tasks.length} tarefas recuperadas do backup`);
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao recuperar backup:', error);
    }
    return false;
  }
  
  // Verificar integridade dos dados
  function verifyDataIntegrity() {
    try {
      // Verificar se tasks é um array válido
      if (!Array.isArray(tasks)) {
        console.error('❌ Tasks não é um array válido');
        tasks = [];
        return false;
      }
      
      // Verificar se cada task tem estrutura válida
      let hasInvalidTasks = false;
      tasks = tasks.filter(task => {
        if (!task.id || !task.name) {
          console.warn('⚠️ Tarefa inválida removida:', task);
          hasInvalidTasks = true;
          return false;
        }
        
        // Garantir que pomodoroHistory existe
        if (!task.pomodoroHistory) {
          task.pomodoroHistory = [];
        }
        
        // Garantir que timeSpent existe
        if (typeof task.timeSpent !== 'number') {
          task.timeSpent = 0;
        }
        
        return true;
      });
      
      if (hasInvalidTasks) {
        saveTasks(); // Salvar dados limpos
        console.log('🔧 Dados inválidos removidos e sessão salva');
      }
      
      console.log(`✅ Integridade verificada: ${tasks.length} tarefas válidas`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro na verificação de integridade:', error);
      return false;
    }
  }
  
  // Salvar dados antes de sair da página
  window.addEventListener('beforeunload', () => {
    console.log('📤 Salvando dados antes de sair...');
    saveTasks();
  });
  
  // Salvar dados periodicamente (a cada 30 segundos)
  setInterval(() => {
    if (tasks.length > 0) {
      saveTasks();
      console.log('⏰ Salvamento automático realizado');
    }
  }, 30000);
  
  // Salvar quando a aba perde o foco
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('👁️ Aba perdeu foco, salvando dados...');
      saveTasks();
    }
  });
});
