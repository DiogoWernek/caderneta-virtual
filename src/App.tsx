import { useEffect, useState } from 'react'
import { supabase, hasSupabaseConfig } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import AddIrmao from './pages/AddIrmao'
import PersonDetail from './pages/PersonDetail'
import { Button, Callout, Card, Flex, Heading, Separator, Text, TextField, Table } from '@radix-ui/themes'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          session ? (
            <Main onSignOut={() => supabase!.auth.signOut()} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/adicionar-irmao"
        element={session ? <AddIrmao userId={session.user.id} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/irmao/:id"
        element={session ? <PersonDetail /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
import Login from './pages/Login'

type PersonRow = {
  id: string
  created_at: string
  updated_at: string
  created_by: string | null
  nome: string | null
  idade: number | null
  tempo_crente_anos: number | null
  numero_prontuario: string | null
  estado_civil: 'solteiro' | 'casado' | 'viuvo' | 'separado' | null
  conjugue_nome: string | null
  conjugue_idade: number | null
  conjugue_tempo_crente_anos: number | null
  congregacao_comum: string | null
  cep: string | null
  endereco: string | null
  numero_residencia: string | null
  filhos_idades: number[] | null
  filhas_idades: number[] | null
  filhos_qtd: number | null
  filhas_qtd: number | null
}

function Main({ onSignOut }: { onSignOut: () => Promise<{ error: any } | { data: any }> }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<PersonRow[]>([])
  const pageSize = 10
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState<number>(0)

  const fetchRows = async (q: string, p: number) => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const from = (p - 1) * pageSize
      const to = from + pageSize - 1
      let req = supabase.from('persons').select('*', { count: 'exact' })
      if (q.trim()) {
        const qt = q.trim()
        req = req.or(`nome.ilike.%${qt}%,numero_prontuario.ilike.%${qt}%`)
      }
      const { data, count, error } = await req
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      setRows(data as PersonRow[])
      setTotal(count ?? 0)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows(query, page)
  }, [query, page])
  useEffect(() => {
    setPage(1)
  }, [query])

  // formulário de criação foi movido para página dedicada

  return (
    <Flex direction="column" align="center" style={{ minHeight: '100vh', width: '100%' }} gap="4" className="main-wrapper">
      <Heading size="6">Caderneta Virtual</Heading>
      <Flex gap="3" align="center">
        <TextField.Root
          placeholder="Buscar por nome ou Nº prontuário"
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          style={{ minWidth: 360 }}
        />
        <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={() => navigate('/adicionar-irmao')}>
          Adicionar irmão(ã)
        </Button>
        <Button
          onClick={onSignOut}
          variant="solid"
          color="gray"
          highContrast
          style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }}
        >
          Sair
        </Button>
      </Flex>
      <Separator size="4" />
      {error && (
        <Callout.Root color="red" highContrast>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Card className="auth-card" style={{ width: '100%' }}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nome</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Idade</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Estado civil</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Nº prontuário</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Comum</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Endereço</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Número</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id} className="table-row-click" onClick={() => navigate(`/irmao/${r.id}`)}>
                <Table.Cell>{r.nome ?? '-'}</Table.Cell>
                <Table.Cell>{r.idade ?? '-'}</Table.Cell>
                <Table.Cell>{r.estado_civil ?? '-'}</Table.Cell>
                <Table.Cell>{r.numero_prontuario ?? '-'}</Table.Cell>
                <Table.Cell>{r.congregacao_comum ?? '-'}</Table.Cell>
                <Table.Cell>{r.endereco ?? '-'}</Table.Cell>
                <Table.Cell>{r.numero_residencia ?? '-'}</Table.Cell>
              </Table.Row>
            ))}
            {rows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <Text color="gray">Nenhum registro</Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
        <Flex align="center" justify="between" mt="3">
          <Text size="2" color="gray">
            {total > 0
              ? `Mostrando ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} de ${total}`
              : 'Mostrando 0 de 0'}
          </Text>
          <Flex gap="2">
            <Button
              variant="soft"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Página anterior
            </Button>
            <Button
              variant="soft"
              disabled={page * pageSize >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima página
            </Button>
          </Flex>
        </Flex>
      </Card>

      {/* formulário movido para página dedicada */}
    </Flex>
  )
}
