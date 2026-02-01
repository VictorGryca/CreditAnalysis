# Lambda Function - Consulta SCPC

## Arquivo

- `consultaSCPC.js` - Proxy para API SCPC que resolve CORS

## Como fazer deploy na AWS Lambda:

### 1. Criar função Lambda
1. AWS Lambda Console > Create function
2. Function name: `consultaSCPC`
3. Runtime: **Node.js 20.x** (ou superior)
4. Architecture: x86_64

### 2. Fazer upload do código
1. Abra a função no AWS Console
2. Vá em "Code" > Cole o conteúdo de `consultaSCPC.js`
3. Clique em "Deploy"

### 3. Configurar variáveis de ambiente
No console da Lambda, vá em "Configuration" > "Environment variables" e adicione:

- `SCPC_USER`: Usuário da API SCPC
- `SCPC_PASSWORD`: Senha da API SCPC
- `SCPC_REGIONAL`: Código regional (ex: 80000)
- `SCPC_CODIGO`: Código da empresa (ex: 88888)
- `SCPC_SENHA_SISTEMA`: Senha do sistema (ex: TTME@26)

### 4. Configurar timeout
No console da Lambda, vá em "Configuration" > "General configuration":
- Timeout: **30 segundos** (API SCPC pode demorar)
- Memory: 128 MB (suficiente)

### 5. Criar API Gateway
1. AWS API Gateway Console > Create API
2. Escolha "HTTP API" (mais simples e barato)
3. Add integration: Lambda function > Selecione `consultaSCPC`
4. Configure routes:
   - Method: **POST**
   - Path: `/consulta` (ou qualquer path)
5. Configure CORS:
   - Allow origins: `*` (ou seu domínio específico)
   - Allow methods: POST, OPTIONS
   - Allow headers: Content-Type

### 6. Copiar URL da API Gateway
Após criar, copie a URL da API (algo como `https://xxx.execute-api.sa-east-1.amazonaws.com/consulta`)

Use essa URL na variável de ambiente `VITE_SCPC_API_URL` do frontend.

## Testar localmente (opcional)
Você pode testar usando o evento de teste da Lambda com este JSON:

**Consulta nova (tipo 395):**
```json
{
  "body": "{\"cpf\":\"12345678901\",\"tipoConsulta\":395}"
}
```

**Consulta histórica (tipo 648):**
```json
{
  "body": "{\"tipoConsulta\":648,\"numeroResposta\":\"375612540-2\"}"
}
```
