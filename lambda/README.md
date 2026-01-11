# Lambda Function - Envio de Emails

## Como fazer deploy na AWS Lambda:

### 1. Instalar dependências localmente
```bash
cd lambda
npm install
```

### 2. Criar arquivo ZIP
```bash
# Windows PowerShell
Compress-Archive -Path .\* -DestinationPath lambda-function.zip -Force
```

### 3. Fazer upload no AWS Lambda
1. Abra a função no AWS Console
2. Vá em "Code" > "Upload from" > ".zip file"
3. Selecione o arquivo `lambda-function.zip`
4. Clique em "Save"

### 4. Configurar variáveis de ambiente na Lambda
No console da Lambda, vá em "Configuration" > "Environment variables" e adicione:

- `SMTP_HOST`: `email-smtp.sa-east-1.amazonaws.com`
- `SMTP_USER`: Seu SMTP username
- `SMTP_PASS`: Seu SMTP password
- `EMAIL_FROM`: Seu email verificado no SES

### 5. Configurar timeout
No console da Lambda, vá em "Configuration" > "General configuration":
- Timeout: 30 segundos (padrão é 3s, pouco para emails)

## Testar localmente (opcional)
Você pode testar usando o evento de teste da Lambda com este JSON:

```json
{
  "body": "{\"to\":\"seuemail@exemplo.com\",\"subject\":\"Teste\",\"text\":\"Email de teste\"}"
}
```
