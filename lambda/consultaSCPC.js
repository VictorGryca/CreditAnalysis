// Lambda Proxy para consulta SCPC
// Resolve problema de CORS fazendo requisição servidor → servidor

export const handler = async (event) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Responder OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Debug: verificar o que vem no event
    console.log('Event recebido:', JSON.stringify(event))
    
    // Parse do body
    let cpf, tipoConsulta, numeroResposta
    if (event.body) {
      const parsedBody = JSON.parse(event.body)
      cpf = parsedBody.cpf
      tipoConsulta = parsedBody.tipoConsulta || 395
      numeroResposta = parsedBody.numeroResposta
    } else {
      // Pode vir direto no event em alguns casos
      cpf = event.cpf
      tipoConsulta = event.tipoConsulta || 395
      numeroResposta = event.numeroResposta
    }

    // Validar parâmetros baseado no tipo de consulta
    if (tipoConsulta === 395) {
      if (!cpf) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'CPF é obrigatório para consulta tipo 395',
            debug: { hasBody: !!event.body, event: event }
          })
        }
      }

      // Validar formato do CPF (11 dígitos)
      const cpfLimpo = cpf.replace(/\D/g, '')
      if (cpfLimpo.length !== 11) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'CPF deve ter 11 dígitos' })
        }
      }
    } else if (tipoConsulta === 648) {
      if (!numeroResposta) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Número de resposta é obrigatório para consulta tipo 648'
          })
        }
      }
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Tipo de consulta inválido. Use 395 ou 648'
        })
      }
    }

    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : null

    // Credenciais da API SCPC (variáveis de ambiente da Lambda)
    const usuario = process.env.SCPC_USER
    const senha = process.env.SCPC_PASSWORD
    const regional = process.env.SCPC_REGIONAL
    const codigo = process.env.SCPC_CODIGO
    const senhaSistema = process.env.SCPC_SENHA_SISTEMA

    // Validar credenciais
    if (!usuario || !senha) {
      console.error('Credenciais SCPC não configuradas')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Configuração da API incompleta' })
      }
    }

    // Criar Basic Auth
    const basicAuth = Buffer.from(`${usuario}:${senha}`).toString('base64')

    // Montar body da requisição SCPC
    const solicitacao = {
      "S-REGIONAL": parseInt(regional),
      "S-CODIGO": parseInt(codigo),
      "S-SENHA": senhaSistema,
      "S-CONSULTA": tipoConsulta,
      "S-SOLICITANTE": "Sistema CreditAnalysis"
    }

    // Adicionar campo específico baseado no tipo de consulta
    if (tipoConsulta === 395) {
      solicitacao["S-CPF"] = cpfLimpo
      console.log('Consultando SCPC (tipo 395) para CPF:', cpfLimpo)
    } else if (tipoConsulta === 648) {
      solicitacao["S-NUMERO-RESPOSTA"] = numeroResposta
      console.log('Consultando SCPC (tipo 648) para número:', numeroResposta)
    }

    const scpcBody = {
      "SPCA-XML": {
        "VERSAO": "14042025",
        "SOLICITACAO": solicitacao
      }
    }

    // Fazer requisição para API SCPC (servidor → servidor, SEM CORS!)
    const response = await fetch('https://api.scpc.inf.br/consulta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify(scpcBody)
    })

    console.log('Status SCPC:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro da API SCPC:', errorText)
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Erro ao consultar SCPC',
          details: errorText
        })
      }
    }

    // Pegar resposta da SCPC
    const scpcData = await response.json()
    console.log('Consulta SCPC bem-sucedida')

    // Retornar dados para o frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(scpcData)
    }

  } catch (error) {
    console.error('Erro no proxy SCPC:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message
      })
    }
  }
}
