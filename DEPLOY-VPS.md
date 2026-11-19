# Instalar o ProduçãoLite na VPS (Windows + Caddy)

Rode tudo pelo RDP da VPS, em um PowerShell **como administrador**. Domínio: `producaolite.bmsoft.com.br`.

## 1. Pré-requisitos

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install CaddyServer.Caddy
```

Feche e reabra o PowerShell depois (PATH). Confirme: `node -v` (20+), `caddy version`.

## 2. Clonar e configurar

```powershell
mkdir C:\apps; cd C:\apps
git clone https://github.com/bmsoftweb/producaolite.git producaolite
cd C:\apps\producaolite\code
npm install
copy .env.example .env
notepad .env
```

No `.env`, além do que já vem no exemplo:

```
NODE_ENV=production
PRODUCAO_PORT=3004
MYSQL_PASSWORD=<senha do bmsoftadm>
SESSION_SECRET=<texto longo e aleatório>
```

> Sem `NODE_ENV=production` o servidor sobe o Vite em modo dev.

Gerar um segredo:

```powershell
[Convert]::ToBase64String((1..48|%{Get-Random -Max 256}))
```

## 3. Build e teste

```powershell
cd C:\apps\producaolite\code
npm run build
npm start
```

Abra `http://localhost:3004` na VPS. Funcionando, `Ctrl+C`.

## 4. Subir sozinho no boot (Agendador de Tarefas)

O servidor lê `dist\` a partir do diretório atual, então use um wrapper:

```powershell
Set-Content -Encoding utf8 C:\apps\producaolite\iniciar.cmd @'
cd /d C:\apps\producaolite\code
node dist\server.cjs >> C:\apps\producaolite\producaolite.log 2>&1
'@

schtasks /create /tn ProducaoLite /tr "C:\apps\producaolite\iniciar.cmd" /sc onstart /ru SYSTEM /rl HIGHEST /f
schtasks /run /tn ProducaoLite
```

Parar / reiniciar depois de um deploy:

```powershell
schtasks /end /tn ProducaoLite; schtasks /run /tn ProducaoLite
```

Para reiniciar automático em caso de queda: Agendador de Tarefas → ProducaoLite →
Propriedades → Configurações → "Reiniciar a cada 1 minuto, até 3 vezes".

## 5. Caddy (proxy reverso + HTTPS automático)

O domínio precisa apontar (A) para o IP da VPS **antes** disso, senão o Let's Encrypt falha.

`C:\Program Files\Caddy\Caddyfile` (ou onde estiver o seu):

```
producaolite.bmsoft.com.br {
	reverse_proxy localhost:3004
}
```

```powershell
caddy validate --config "C:\Program Files\Caddy\Caddyfile"
caddy reload  --config "C:\Program Files\Caddy\Caddyfile"
```

Se o Caddy ainda não roda como serviço:

```powershell
sc.exe create caddy binPath= "\"C:\Program Files\Caddy\caddy.exe\" run --config \"C:\Program Files\Caddy\Caddyfile\"" start= auto
sc.exe start caddy
```

Firewall: abrir **80 e 443**, deixar a **3004 fechada** (só o Caddy fala com ela).

```powershell
New-NetFirewallRule -DisplayName "HTTP/HTTPS" -Direction Inbound -Protocol TCP -LocalPort 80,443 -Action Allow
```

## 6. Atualizar versão

```powershell
cd C:\apps\producaolite\code
git pull
npm install
npm run build
schtasks /end /tn ProducaoLite; schtasks /run /tn ProducaoLite
```

## Antes de chamar de pronto

- **MySQL**: o `45.224.130.145:3306` precisa aceitar conexão do IP da VPS (grant do
  `bmsoftadm` e firewall do servidor MySQL).
- **bmAPI com `localhost`**: servidor cadastrado em `bmapi.servidores` como `localhost`
  não funciona hospedado — quem chama a bmAPI é a VPS, não a máquina do cliente. Esses
  clientes continuam no `ProducaoLite.exe` local.
- O `.env` fica fora do git (`.gitignore`), então ele vive só na VPS: guarde uma cópia.
