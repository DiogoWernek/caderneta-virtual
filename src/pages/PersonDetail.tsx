import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Card, Flex, Heading, Separator, TextField, Callout, RadioGroup } from '@radix-ui/themes'

type PersonRow = {
  id: string
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
}

export default function PersonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    idade: '',
    tempo_crente_anos: '',
    numero_prontuario: '',
    estado_civil: 'solteiro',
    conjugue_nome: '',
    conjugue_idade: '',
    conjugue_tempo_crente_anos: '',
    congregacao_comum: '',
    cep: '',
    endereco: '',
    numero_residencia: '',
    filhos_idades: '',
    filhas_idades: ''
  })

  useEffect(() => {
    const load = async () => {
      if (!supabase || !id) return
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.from('persons').select('*').eq('id', id).single()
        if (error) throw error
        const r = data as PersonRow
        setForm({
          nome: r.nome ?? '',
          idade: r.idade?.toString() ?? '',
          tempo_crente_anos: r.tempo_crente_anos?.toString() ?? '',
          numero_prontuario: r.numero_prontuario ?? '',
          estado_civil: (r.estado_civil ?? 'solteiro') as any,
          conjugue_nome: r.conjugue_nome ?? '',
          conjugue_idade: r.conjugue_idade?.toString() ?? '',
          conjugue_tempo_crente_anos: r.conjugue_tempo_crente_anos?.toString() ?? '',
          congregacao_comum: r.congregacao_comum ?? '',
          cep: r.cep ?? '',
          endereco: r.endereco ?? '',
          numero_residencia: r.numero_residencia ?? '',
          filhos_idades: (r.filhos_idades ?? []).join(', '),
          filhas_idades: (r.filhas_idades ?? []).join(', ')
        })
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const update = async () => {
    if (!supabase || !id) return
    setLoading(true)
    setError(null)
    try {
      const normalizeAges = (s: string) =>
        s
          .split(',')
          .map((x) => x.trim())
          .filter((x) => x.length > 0)
          .map((x) => Number(x))
          .filter((n) => Number.isFinite(n) && n >= 0)
      const filhosArr = normalizeAges(form.filhos_idades)
      const filhasArr = normalizeAges(form.filhas_idades)
      const { error } = await supabase
        .from('persons')
        .update({
          nome: form.nome || null,
          idade: form.idade ? Number(form.idade) : null,
          tempo_crente_anos: form.tempo_crente_anos ? Number(form.tempo_crente_anos) : null,
          numero_prontuario: form.numero_prontuario || null,
          estado_civil: form.estado_civil as any,
          conjugue_nome: form.conjugue_nome || null,
          conjugue_idade: form.conjugue_idade ? Number(form.conjugue_idade) : null,
          conjugue_tempo_crente_anos: form.conjugue_tempo_crente_anos ? Number(form.conjugue_tempo_crente_anos) : null,
          congregacao_comum: form.congregacao_comum || null,
          cep: form.cep || null,
          endereco: form.endereco || null,
          numero_residencia: form.numero_residencia || null,
          filhos_idades: filhosArr.length ? filhosArr : null,
          filhas_idades: filhasArr.length ? filhasArr : null,
        })
        .eq('id', id)
      if (error) throw error
      setEditing(false)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!supabase || !id) return
    if (!window.confirm('Excluir este irmão(ã)?')) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('persons').delete().eq('id', id)
      if (error) throw error
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" align="center" style={{ minHeight: '100vh', width: '100%' }} gap="4" className="main-wrapper">
      <Heading size="6">Detalhes do irmão(ã)</Heading>
      <Separator size="4" />
      {error && (
        <Callout.Root color="red" highContrast>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Card className="auth-card" style={{ width: '100%' }}>
        <Flex direction="column" gap="4">
          <TextField.Root placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: (e.target as HTMLInputElement).value })} disabled={!editing} />
          <Flex gap="3">
            <TextField.Root placeholder="Idade" type="number" value={form.idade} onChange={(e) => setForm({ ...form, idade: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Tempo de crente (anos)" type="number" value={form.tempo_crente_anos} onChange={(e) => setForm({ ...form, tempo_crente_anos: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Nº prontuário" value={form.numero_prontuario} onChange={(e) => setForm({ ...form, numero_prontuario: (e.target as HTMLInputElement).value })} disabled={!editing} />
          </Flex>
          <RadioGroup.Root value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
            <Flex gap="3">
              <RadioGroup.Item value="solteiro" disabled={!editing}>Solteiro(a)</RadioGroup.Item>
              <RadioGroup.Item value="casado" disabled={!editing}>Casado(a)</RadioGroup.Item>
              <RadioGroup.Item value="viuvo" disabled={!editing}>Viúvo(a)</RadioGroup.Item>
              <RadioGroup.Item value="separado" disabled={!editing}>Separado(a)</RadioGroup.Item>
            </Flex>
          </RadioGroup.Root>
          <Flex gap="3">
            <TextField.Root placeholder="Nome do cônjuge" value={form.conjugue_nome} onChange={(e) => setForm({ ...form, conjugue_nome: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Idade cônjuge" type="number" value={form.conjugue_idade} onChange={(e) => setForm({ ...form, conjugue_idade: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Tempo de crente cônjuge (anos)" type="number" value={form.conjugue_tempo_crente_anos} onChange={(e) => setForm({ ...form, conjugue_tempo_crente_anos: (e.target as HTMLInputElement).value })} disabled={!editing} />
          </Flex>
          <Flex gap="3">
            <TextField.Root placeholder="Comum congregação" value={form.congregacao_comum} onChange={(e) => setForm({ ...form, congregacao_comum: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: (e.target as HTMLInputElement).value })} disabled={!editing} />
          </Flex>
          <Flex gap="3">
            <TextField.Root placeholder="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Número" value={form.numero_residencia} onChange={(e) => setForm({ ...form, numero_residencia: (e.target as HTMLInputElement).value })} disabled={!editing} />
          </Flex>
          <Flex gap="3">
            <TextField.Root placeholder="Idades dos filhos (vírgula)" value={form.filhos_idades} onChange={(e) => setForm({ ...form, filhos_idades: (e.target as HTMLInputElement).value })} disabled={!editing} />
            <TextField.Root placeholder="Idades das filhas (vírgula)" value={form.filhas_idades} onChange={(e) => setForm({ ...form, filhas_idades: (e.target as HTMLInputElement).value })} disabled={!editing} />
          </Flex>
          <Flex gap="3" justify="end">
            {!editing ? (
              <>
                <Button variant="soft" onClick={() => navigate('/')}>Voltar</Button>
                <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={remove} disabled={loading}>
                  Excluir
                </Button>
              </>
            ) : (
              <>
                <Button variant="soft" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={update} disabled={loading}>
                  Salvar
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
