import { useState } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'
import { Box, Button, Callout, Card, Flex, Heading, Text, TextField, Link } from '@radix-ui/themes'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!hasSupabaseConfig) {
        throw new Error('Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
      }
      if (mode === 'login') {
        const { error } = await supabase!.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase!.auth.signUp({ email, password })
        if (error) throw error
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh', width: '100%' }} className="auth-wrapper">
      <Card size="4" className="auth-card" style={{ width: '100%' }}>
        <Flex direction="column" gap="4">
          <Heading size="5">Caderneta Virtual</Heading>
          <Text color="gray">{mode === 'login' ? 'Faça login para continuar' : 'Crie sua conta para acessar'}</Text>
          {!hasSupabaseConfig && (
            <Callout.Root color="yellow" highContrast>
              <Callout.Text>Defina as variáveis no arquivo .env para habilitar o login.</Callout.Text>
            </Callout.Root>
          )}
          {mode === 'signup' && (
            <Callout.Root color="gray" highContrast>
              <Callout.Text>Em desenvolvimento, você pode desativar confirmação de e-mail no Supabase.</Callout.Text>
            </Callout.Root>
          )}
          {error && (
            <Callout.Root color="red" highContrast>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          <form onSubmit={onSubmit}>
            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2">E-mail</Text>
                <TextField.Root
                  type="email"
                  value={email}
                  onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </Box>
              <Box>
                <Text as="label" size="2">Senha</Text>
                <TextField.Root
                  type="password"
                  value={password}
                  onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                  placeholder="••••••••"
                  required
                />
              </Box>
              <Button
                type="submit"
                disabled={loading}
                variant="solid"
                color="gray"
                highContrast
                style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }}
              >
                {loading ? (mode === 'login' ? 'Entrando...' : 'Cadastrando...') : (mode === 'login' ? 'Entrar' : 'Criar conta')}
              </Button>
              <Text size="2" color="gray">
                {mode === 'login' ? (
                  <>
                  </>
                ) : (
                  <>
                    Já tem conta?{' '}
                    <Link asChild>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setMode('login')
                        }}
                      >
                        Entrar
                      </a>
                    </Link>
                  </>
                )}
              </Text>
            </Flex>
          </form>
        </Flex>
      </Card>
    </Flex>
  )
}
