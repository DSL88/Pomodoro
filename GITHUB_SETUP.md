# 🚀 Como Adicionar ao GitHub

## Passos para criar repositório no GitHub:

### 1. Criar repositório no GitHub.com
1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"New"** ou **"+"** no canto superior direito
3. Escolha **"New repository"**
4. Configure o repositório:
   - **Repository name**: `pomodoro-responsivo` (ou outro nome de sua preferência)
   - **Description**: `Timer Pomodoro responsivo com gestão de tarefas`
   - **Visibility**: Public (recomendado para portfólio)
   - **⚠️ NÃO marque** "Add a README file" (já temos um)
   - **⚠️ NÃO marque** "Add .gitignore" (já temos um)
   - **⚠️ NÃO marque** "Choose a license" (já temos um)
5. Clique em **"Create repository"**

### 2. Conectar repositório local ao GitHub
Após criar o repositório, execute os comandos que o GitHub mostrar:

```bash
# Navegar para o diretório do projeto
cd "/Users/diogolopes/Desktop/Pomodoro"

# Adicionar origem remota (substitua YOUR_USERNAME pelo seu usuário do GitHub)
git remote add origin https://github.com/YOUR_USERNAME/pomodoro-responsivo.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push do código para o GitHub
git push -u origin main
```

### 3. Comandos alternativos (se der erro)
Se você já tem um repositório existente, use:

```bash
# Definir nova origem
git remote set-url origin https://github.com/YOUR_USERNAME/pomodoro-responsivo.git

# Fazer push
git push -u origin main
```

## 🔧 Configurações Recomendadas no GitHub

Após o upload, configure no GitHub:

### Repository Settings:
- **About**: Adicione descrição e link do projeto
- **Topics**: Adicione tags como `pomodoro`, `timer`, `responsive`, `javascript`, `css`, `html`
- **Website**: Se hospedar no GitHub Pages, adicione o link

### GitHub Pages (opcional):
1. Vá em **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / **/ (root)**
4. Clique **Save**
5. Seu site estará disponível em: `https://YOUR_USERNAME.github.io/pomodoro-responsivo`

## 📝 Próximos Passos

1. **Testar o repositório**: Clone em outro local para testar
2. **Documentar melhorias**: Adicione screenshots ao README
3. **Configurar Issues**: Para futuras melhorias
4. **Adicionar badges**: Status, licença, etc.

## 🎯 Exemplo de URL final:
`https://github.com/YOUR_USERNAME/pomodoro-responsivo`

---

**Substitua `YOUR_USERNAME` pelo seu nome de usuário do GitHub!**
