# 🍅 Pomodoro Timer Responsivo

Um aplicativo Pomodoro moderno e responsivo desenvolvido com HTML, CSS e JavaScript vanilla. Funciona perfeitamente em computadores, tablets e smartphones.

## ✨ Funcionalidades

- ⏱️ **Timer Pomodoro Personalizável**: Configure durações de 5 a 60 minutos
- 📝 **Gestão de Tarefas**: Adicione, selecione e elimine tarefas facilmente
- 🗑️ **Eliminação de Tarefas**: Modo de eliminação com checkboxes para remover múltiplas tarefas
- 🌙 **Modo Escuro/Claro**: Interface adaptável com troca de tema e cores otimizadas
- 🔊 **Notificações Sonoras**: Som de alerta quando o timer termina com Web Audio API
- 🎵 **Teste de Som**: Botão para testar o sistema de áudio
- 📱 **Totalmente Responsivo**: Otimizado para todos os dispositivos
- 💾 **Armazenamento Local**: Suas tarefas e configurações são salvas automaticamente
- 🎯 **Interface Moderna**: Design limpo e intuitivo com animações suaves
- ⚡ **Compatibilidade**: Funciona em navegadores modernos com fallbacks

## 🚀 Como Usar

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/[seu-usuario]/pomodoro-responsivo.git
   cd pomodoro-responsivo
   ```

2. **Abra o arquivo `index.html`** no seu navegador
   - Ou use um servidor local como Live Server no VS Code

3. **Comece a usar**:
   - Adicione uma tarefa
   - Selecione a tarefa clicando nela
   - Configure o tempo desejado
   - Clique em "Iniciar" para começar o timer

### 🗑️ **Eliminar Tarefas**
1. **Ativar modo de eliminação**:
   - Clique no botão 🗑️ próximo ao título "Minhas Tarefas"
   - Checkboxes aparecerão ao lado de cada tarefa

2. **Selecionar e eliminar**:
   - Marque as tarefas que deseja eliminar
   - Clique em "Eliminar Selecionadas"
   - Confirme a eliminação na janela de confirmação
   - Ou clique em "Cancelar" para sair do modo de eliminação

### 🔊 **Testar Som**
- Use o botão "🔊 Testar Som" para verificar se o áudio está funcionando
- Útil para garantir que ouvirá a notificação no final do timer

## 📱 Design Responsivo

### Desktop (960px+)
- Layout de duas colunas
- Timer grande (250px)
- Controles espaçados horizontalmente

### Tablet (768px - 959px)
- Layout de coluna única
- Timer médio (200px)
- Elementos reorganizados verticalmente

### Smartphone (até 767px)
- Interface compacta
- Timer pequeno (180px)
- Botões empilhados verticalmente
- Formulários otimizados para toque

## 🎨 Recursos Visuais

- **Círculo de Progresso SVG**: Animação fluida do progresso do timer
- **Temas Escuro/Claro**: Alternância suave entre temas
- **Feedback Tátil**: Vibração em dispositivos móveis (quando suportado)
- **Animações CSS**: Transições suaves e modernas

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Flexbox, Grid, Media Queries, Custom Properties
- **JavaScript ES6+**: Funcionalidades modernas
- **Web Audio API**: Sistema de som nativo
- **LocalStorage**: Persistência de dados
- **SVG**: Gráficos vetoriais para o timer

## 📋 Funcionalidades Detalhadas

### Timer
- Configuração de 5 a 60 minutos (incrementos de 5)
- Controles: Iniciar, Pausar, Reset
- Progresso visual circular com cores otimizadas para cada tema
- Som de notificação ao terminar com Web Audio API
- Botão de teste de som para verificar funcionamento

### Tarefas
- Adicionar novas tarefas
- Selecionar tarefa ativa
- Modo de eliminação com seleção múltipla via checkboxes
- Confirmação antes de eliminar tarefas
- Rastreamento de tempo gasto por tarefa
- Persistência automática no navegador

### Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Contraste adequado
- Tamanhos de toque otimizados

## 🔧 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Opera 47+

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👨‍💻 Autor

Desenvolvido com ❤️ por [Seu Nome]

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
