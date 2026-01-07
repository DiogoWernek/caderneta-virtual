import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { maskCep, onlyDigits, maskBRL, parseBRL, formatBRL, formatDateBR, maskDateBR, parseDateBR, isoToDateBR } from '../lib/format'
import { Button, Card, Flex, Heading, Separator, Text as RtText, TextField, Callout, RadioGroup, Table, Dialog, Box } from '@radix-ui/themes'

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
  data_nascimento: string | null
  conjugue_data_nascimento: string | null
  valor_aluguel: number | null
  salario: number | null
  valor_previdencia: number | null
  valor_piedade_mensal: number | null
  numero_filhos_trabalham: number | null
  salario_filhos: number | null
  possui_filhos_netos: boolean | null
  qtd_filhos_netos_em_casa: number | null
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
    possui_filhos_netos: 'nao',
    numero_filhos_netos_em_casa: '',
    conjugue_nome: '',
    conjugue_idade: '',
    conjugue_tempo_crente_anos: '',
    data_nascimento: '',
    conjugue_data_nascimento: '',
    valor_aluguel: '',
    salario: '',
    valor_previdencia: '',
    valor_piedade_mensal: '',
    numero_filhos_trabalham: '',
    salario_filhos: '',
    congregacao_comum: '',
    cep: '',
    endereco: '',
    numero_residencia: '',
    filhos_idades: '',
    filhas_idades: ''
  })

  type PurchaseRow = {
    id: string
    person_id: string
    created_by: string | null
    data: string
    descricao: string | null
    valor: number | null
  }
  const [purchases, setPurchases] = useState<PurchaseRow[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [addForm, setAddForm] = useState({ data: '', descricao: '', valor: '' })
  const [openEdit, setOpenEdit] = useState(false)
  const [editRow, setEditRow] = useState<PurchaseRow | null>(null)
  const [editForm, setEditForm] = useState({ data: '', descricao: '', valor: '' })
  const addDateRef = useRef<HTMLInputElement | null>(null)
  const editDateRef = useRef<HTMLInputElement | null>(null)
  const personBirthRef = useRef<HTMLInputElement | null>(null)
  const conjBirthRef = useRef<HTMLInputElement | null>(null)
  const [openConfirmPerson, setOpenConfirmPerson] = useState(false)
  const [openConfirmPurchase, setOpenConfirmPurchase] = useState(false)
  const [pendingDeletePurchase, setPendingDeletePurchase] = useState<PurchaseRow | null>(null)
  const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v10h14V9ZM7 12h3v3H7v-3Z"></path>
    </svg>
  )

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
          possui_filhos_netos: r.possui_filhos_netos ? 'sim' : 'nao',
          numero_filhos_netos_em_casa: r.qtd_filhos_netos_em_casa?.toString() ?? '',
          conjugue_nome: r.conjugue_nome ?? '',
          conjugue_idade: r.conjugue_idade?.toString() ?? '',
          conjugue_tempo_crente_anos: r.conjugue_tempo_crente_anos?.toString() ?? '',
          data_nascimento: r.data_nascimento ? formatDateBR(r.data_nascimento) : '',
          conjugue_data_nascimento: r.conjugue_data_nascimento ? formatDateBR(r.conjugue_data_nascimento) : '',
          valor_aluguel: r.valor_aluguel != null ? maskBRL(String(r.valor_aluguel)) : '',
          salario: r.salario != null ? maskBRL(String(r.salario)) : '',
          valor_previdencia: r.valor_previdencia != null ? maskBRL(String(r.valor_previdencia)) : '',
          valor_piedade_mensal: r.valor_piedade_mensal != null ? maskBRL(String(r.valor_piedade_mensal)) : '',
          numero_filhos_trabalham: r.numero_filhos_trabalham?.toString() ?? '',
          salario_filhos: r.salario_filhos != null ? maskBRL(String(r.salario_filhos)) : '',
          congregacao_comum: r.congregacao_comum ?? '',
          cep: maskCep(r.cep ?? ''),
          endereco: r.endereco ?? '',
          numero_residencia: r.numero_residencia ?? '',
          filhos_idades: (r.filhos_idades ?? []).join(', '),
          filhas_idades: (r.filhas_idades ?? []).join(', ')
        })
        const { data: purData, error: purErr } = await supabase
          .from('purchases')
          .select('*')
          .eq('person_id', id)
          .order('data', { ascending: false })
        if (purErr) throw purErr
        setPurchases(purData as PurchaseRow[])
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const addPurchase = async () => {
    if (!supabase || !id) return
    setLoading(true)
    setError(null)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error('Sessão expirada')
      const payload = {
        person_id: id,
        created_by: userId,
        data: parseDateBR(addForm.data),
        descricao: addForm.descricao || null,
        valor: parseBRL(addForm.valor)
      }
      const { error } = await supabase.from('purchases').insert([payload])
      if (error) throw error
      setOpenAdd(false)
      setAddForm({ data: '', descricao: '', valor: '' })
      const { data: purData } = await supabase
        .from('purchases')
        .select('*')
        .eq('person_id', id)
        .order('data', { ascending: false })
      setPurchases(purData as PurchaseRow[])
    } catch (err: any) {
      setError(err.message ?? 'Erro ao adicionar')
    } finally {
      setLoading(false)
    }
  }

  const updatePurchase = async () => {
    if (!supabase || !id || !editRow) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('purchases')
        .update({
          data: parseDateBR(editForm.data),
          descricao: editForm.descricao || null,
          valor: parseBRL(editForm.valor)
        })
        .eq('id', editRow.id)
      if (error) throw error
      setOpenEdit(false)
      setEditRow(null)
      const { data: purData } = await supabase
        .from('purchases')
        .select('*')
        .eq('person_id', id)
        .order('data', { ascending: false })
      setPurchases(purData as PurchaseRow[])
    } catch (err: any) {
      setError(err.message ?? 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  const deletePurchase = async (row: PurchaseRow) => {
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('purchases').delete().eq('id', row.id)
      if (error) throw error
      const { data: purData } = await supabase
        .from('purchases')
        .select('*')
        .eq('person_id', id)
        .order('data', { ascending: false })
      setPurchases(purData as PurchaseRow[])
      setOpenConfirmPurchase(false)
      setPendingDeletePurchase(null)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

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
          conjugue_nome: form.estado_civil === 'casado' ? (form.conjugue_nome || null) : null,
          conjugue_idade: form.estado_civil === 'casado' && form.conjugue_idade ? Number(form.conjugue_idade) : null,
          conjugue_tempo_crente_anos: form.estado_civil === 'casado' && form.conjugue_tempo_crente_anos ? Number(form.conjugue_tempo_crente_anos) : null,
          data_nascimento: parseDateBR(form.data_nascimento),
          conjugue_data_nascimento: form.estado_civil === 'casado' ? parseDateBR(form.conjugue_data_nascimento) : null,
          valor_aluguel: parseBRL(form.valor_aluguel),
          salario: parseBRL(form.salario),
          valor_previdencia: parseBRL(form.valor_previdencia),
          valor_piedade_mensal: parseBRL(form.valor_piedade_mensal),
          numero_filhos_trabalham: form.numero_filhos_trabalham ? Number(form.numero_filhos_trabalham) : null,
          salario_filhos: parseBRL(form.salario_filhos),
          congregacao_comum: form.congregacao_comum || null,
          cep: onlyDigits(form.cep) || null,
          endereco: form.endereco || null,
          numero_residencia: form.numero_residencia || null,
          possui_filhos_netos: form.possui_filhos_netos === 'sim',
          qtd_filhos_netos_em_casa: form.possui_filhos_netos === 'sim' && form.numero_filhos_netos_em_casa ? Number(form.numero_filhos_netos_em_casa) : 0,
          filhos_idades: form.possui_filhos_netos === 'sim' && filhosArr.length ? filhosArr : null,
          filhas_idades: form.possui_filhos_netos === 'sim' && filhasArr.length ? filhasArr : null,
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
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.from('persons').delete().eq('id', id)
      if (error) throw error
      navigate('/')
      setOpenConfirmPerson(false)
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
        {!editing ? (
          <Flex direction="column" gap="3">
            <RtText>Nome: {form.nome || '-'}</RtText>
            <RtText>Idade: {form.idade || '-'}</RtText>
            <RtText>Tempo de crente (anos): {form.tempo_crente_anos || '-'}</RtText>
            <RtText>Nº prontuário: {form.numero_prontuario || '-'}</RtText>
            <RtText>Estado civil: {form.estado_civil || '-'}</RtText>
            <Separator size="4" />
            <RtText>Data de nascimento: {form.data_nascimento || '-'}</RtText>
            {form.estado_civil === 'casado' && (
              <>
                <RtText>Nome do cônjuge: {form.conjugue_nome || '-'}</RtText>
                <RtText>Idade cônjuge: {form.conjugue_idade || '-'}</RtText>
                <RtText>Tempo de crente cônjuge (anos): {form.conjugue_tempo_crente_anos || '-'}</RtText>
                <RtText>Data nasc. cônjuge: {form.conjugue_data_nascimento || '-'}</RtText>
              </>
            )}
            <Separator size="4" />
            <RtText>Comum congregação: {form.congregacao_comum || '-'}</RtText>
            <RtText>CEP: {form.cep || '-'}</RtText>
            <RtText>Endereço: {form.endereco || '-'}</RtText>
            <RtText>Número: {form.numero_residencia || '-'}</RtText>
            <RtText>Possui filhos/netos: {form.possui_filhos_netos === 'sim' ? 'Sim' : 'Não'}</RtText>
            {form.possui_filhos_netos === 'sim' && (
              <RtText>Quantidade de filhos/netos em casa: {form.numero_filhos_netos_em_casa || '0'}</RtText>
            )}
            <RtText>Valor aluguel: {form.valor_aluguel || '-'}</RtText>
            <RtText>Salário: {form.salario || '-'}</RtText>
            <RtText>Valor previdência: {form.valor_previdencia || '-'}</RtText>
            <RtText>Valor piedade mensal: {form.valor_piedade_mensal || '-'}</RtText>
            {form.possui_filhos_netos === 'sim' && (
              <>
                <RtText>Nº filhos/netos que trabalham: {form.numero_filhos_trabalham || '-'}</RtText>
                <RtText>Salário filhos/netos: {form.salario_filhos || '-'}</RtText>
              </>
            )}
            <Separator size="4" />
            {form.possui_filhos_netos === 'sim' && (
              <>
                <RtText>Idades dos filhos/netos: {form.filhos_idades || '-'}</RtText>
                <RtText>Idades das filhas/netas: {form.filhas_idades || '-'}</RtText>
              </>
            )}
            <Flex gap="3" justify="end" mt="3">
              <Button variant="soft" onClick={() => navigate('/')}>Voltar</Button>
              <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={() => setOpenConfirmPerson(true)} disabled={loading}>
                Excluir
              </Button>
            </Flex>
          </Flex>
        ) : (
          <Flex direction="column" gap="4">
            <Heading size="4">Dados pessoais</Heading>
            <Box>
              <RtText as="label" size="2">Nome</RtText>
              <TextField.Root value={form.nome} onChange={(e) => setForm({ ...form, nome: (e.target as HTMLInputElement).value })} />
            </Box>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Idade</RtText>
                <TextField.Root type="number" value={form.idade} onChange={(e) => setForm({ ...form, idade: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Tempo de crente (anos)</RtText>
                <TextField.Root type="number" value={form.tempo_crente_anos} onChange={(e) => setForm({ ...form, tempo_crente_anos: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Nº prontuário</RtText>
                <TextField.Root value={form.numero_prontuario} onChange={(e) => setForm({ ...form, numero_prontuario: (e.target as HTMLInputElement).value })} />
              </Box>
            </Flex>
            <RadioGroup.Root value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
              <Flex gap="3">
                <RadioGroup.Item value="solteiro">Solteiro(a)</RadioGroup.Item>
                <RadioGroup.Item value="casado">Casado(a)</RadioGroup.Item>
                <RadioGroup.Item value="viuvo">Viúvo(a)</RadioGroup.Item>
                <RadioGroup.Item value="separado">Separado(a)</RadioGroup.Item>
              </Flex>
            </RadioGroup.Root>
            <Flex gap="3" align="center">
              <RtText>Possui filhos/netos</RtText>
              <RadioGroup.Root value={form.possui_filhos_netos} onValueChange={(v) => setForm({ ...form, possui_filhos_netos: v })}>
                <Flex gap="3">
                  <RadioGroup.Item value="sim">Sim</RadioGroup.Item>
                  <RadioGroup.Item value="nao">Não</RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
              {form.possui_filhos_netos === 'sim' && (
                <Box style={{ flex: 1 }}>
                  <RtText as="label" size="2">Quantidade de filhos/netos em casa</RtText>
                  <TextField.Root type="number" value={form.numero_filhos_netos_em_casa} onChange={(e) => setForm({ ...form, numero_filhos_netos_em_casa: (e.target as HTMLInputElement).value })} />
                </Box>
              )}
            </Flex>
            <Heading size="4">Cônjuge</Heading>
            <Flex gap="3">
              <div style={{ position: 'relative', flex: 1 }}>
                <RtText as="label" size="2">Data de nascimento</RtText>
                <TextField.Root value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: maskDateBR((e.target as HTMLInputElement).value) })} style={{ paddingRight: 28 }} />
                <input
                  type="date"
                  ref={personBirthRef}
                  onChange={(e) => setForm({ ...form, data_nascimento: isoToDateBR((e.target as HTMLInputElement).value) })}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = personBirthRef.current
                    if (el) {
                      el.focus()
                      // @ts-ignore
                      if (typeof el.showPicker === 'function') el.showPicker()
                    }
                  }}
                  style={{ position: 'absolute', right: 8, bottom: 8, color: '#000', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                  aria-label="Abrir calendário"
                >
                  <CalendarIcon />
                </button>
              </div>
              {form.estado_civil === 'casado' && (
                <>
                  <Box style={{ flex: 1 }}>
                    <RtText as="label" size="2">Nome do cônjuge</RtText>
                    <TextField.Root value={form.conjugue_nome} onChange={(e) => setForm({ ...form, conjugue_nome: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <RtText as="label" size="2">Idade cônjuge</RtText>
                    <TextField.Root type="number" value={form.conjugue_idade} onChange={(e) => setForm({ ...form, conjugue_idade: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <RtText as="label" size="2">Tempo de crente cônjuge (anos)</RtText>
                    <TextField.Root type="number" value={form.conjugue_tempo_crente_anos} onChange={(e) => setForm({ ...form, conjugue_tempo_crente_anos: (e.target as HTMLInputElement).value })} />
                  </Box>
                </>
              )}
            </Flex>
            <Flex gap="3">
              {form.estado_civil === 'casado' && (
                <div style={{ position: 'relative', flex: 1 }}>
                  <RtText as="label" size="2">Data nasc. cônjuge</RtText>
                  <TextField.Root value={form.conjugue_data_nascimento} onChange={(e) => setForm({ ...form, conjugue_data_nascimento: maskDateBR((e.target as HTMLInputElement).value) })} style={{ paddingRight: 28 }} />
                  <input
                    type="date"
                    ref={conjBirthRef}
                    onChange={(e) => setForm({ ...form, conjugue_data_nascimento: isoToDateBR((e.target as HTMLInputElement).value) })}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = conjBirthRef.current
                      if (el) {
                        el.focus()
                        // @ts-ignore
                        if (typeof el.showPicker === 'function') el.showPicker()
                      }
                    }}
                    style={{ position: 'absolute', right: 8, bottom: 8, color: '#000', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                    aria-label="Abrir calendário"
                  >
                    <CalendarIcon />
                  </button>
                </div>
              )}
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Valor aluguel</RtText>
                <TextField.Root value={maskBRL(form.valor_aluguel)} onChange={(e) => setForm({ ...form, valor_aluguel: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Salário</RtText>
                <TextField.Root value={maskBRL(form.salario)} onChange={(e) => setForm({ ...form, salario: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
            </Flex>
            <Heading size="4">Financeiro</Heading>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Valor previdência</RtText>
                <TextField.Root value={maskBRL(form.valor_previdencia)} onChange={(e) => setForm({ ...form, valor_previdencia: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Valor piedade mensal</RtText>
                <TextField.Root value={maskBRL(form.valor_piedade_mensal)} onChange={(e) => setForm({ ...form, valor_piedade_mensal: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              {form.possui_filhos_netos === 'sim' && (
                <Box style={{ flex: 1 }}>
                  <RtText as="label" size="2">Nº filhos/netos que trabalham</RtText>
                  <TextField.Root type="number" value={form.numero_filhos_trabalham} onChange={(e) => setForm({ ...form, numero_filhos_trabalham: (e.target as HTMLInputElement).value })} />
                </Box>
              )}
            </Flex>
            {form.possui_filhos_netos === 'sim' && (
              <Flex gap="3">
                <Box style={{ flex: 1 }}>
                  <RtText as="label" size="2">Salário filhos/netos</RtText>
                  <TextField.Root value={maskBRL(form.salario_filhos)} onChange={(e) => setForm({ ...form, salario_filhos: maskBRL((e.target as HTMLInputElement).value) })} />
                </Box>
              </Flex>
            )}
            <Heading size="4">Endereço</Heading>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Comum congregação</RtText>
                <TextField.Root value={form.congregacao_comum} onChange={(e) => setForm({ ...form, congregacao_comum: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">CEP</RtText>
                <TextField.Root value={maskCep(form.cep)} onChange={(e) => setForm({ ...form, cep: maskCep((e.target as HTMLInputElement).value) })} />
              </Box>
            </Flex>
            <Flex gap="3">
              <Box style={{ flex: 2 }}>
                <RtText as="label" size="2">Endereço</RtText>
                <TextField.Root value={form.endereco} onChange={(e) => setForm({ ...form, endereco: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <RtText as="label" size="2">Número</RtText>
                <TextField.Root value={form.numero_residencia} onChange={(e) => setForm({ ...form, numero_residencia: (e.target as HTMLInputElement).value })} />
              </Box>
            </Flex>
            {form.possui_filhos_netos === 'sim' && (
              <Flex gap="3">
                <Box style={{ flex: 1 }}>
                  <RtText as="label" size="2">Idades dos filhos/netos (vírgula)</RtText>
                  <TextField.Root value={form.filhos_idades} onChange={(e) => setForm({ ...form, filhos_idades: (e.target as HTMLInputElement).value })} />
                </Box>
                <Box style={{ flex: 1 }}>
                  <RtText as="label" size="2">Idades das filhas/netas (vírgula)</RtText>
                  <TextField.Root value={form.filhas_idades} onChange={(e) => setForm({ ...form, filhas_idades: (e.target as HTMLInputElement).value })} />
                </Box>
              </Flex>
            )}
            <Flex gap="3" justify="end">
              <Button variant="soft" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={update} disabled={loading}>
                Salvar
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>
      <Card className="auth-card" style={{ width: '100%' }}>
        <Flex justify="between" align="center" mb="2">
          <Heading size="4">Histórico de compras</Heading>
          <Button
            variant="solid"
            color="gray"
            highContrast
            style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }}
            onClick={() => setOpenAdd(true)}
          >
            Adicionar
          </Button>
        </Flex>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Data</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Descrição</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Valor</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Ações</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {purchases.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell>{formatDateBR(p.data)}</Table.Cell>
                <Table.Cell>{p.descricao ?? '-'}</Table.Cell>
                <Table.Cell>{formatBRL(p.valor ?? 0)}</Table.Cell>
                <Table.Cell>
                  <Flex gap="2" justify="end">
                    <Button variant="soft" onClick={() => { setEditRow(p); setEditForm({ data: formatDateBR(p.data), descricao: p.descricao ?? '', valor: maskBRL(String((p.valor ?? 0).toFixed(2)).replace('.', '').replace(',', '')) }); setOpenEdit(true) }}>Editar</Button>
                    <Button variant="soft" onClick={() => { setPendingDeletePurchase(p); setOpenConfirmPurchase(true) }}>Excluir</Button>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
            {purchases.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4}>
                  <RtText color="gray">Nenhum histórico</RtText>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Card>
      <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
        <Dialog.Content size="3">
          <Dialog.Title>Adicionar histórico</Dialog.Title>
          <Separator size="4" />
          <Flex direction="column" gap="3">
            <div style={{ position: 'relative' }}>
              <TextField.Root
                placeholder="dd/mm/yyyy"
                value={addForm.data}
                onChange={(e) => setAddForm({ ...addForm, data: maskDateBR((e.target as HTMLInputElement).value) })}
                style={{ paddingRight: 28 }}
              />
              <input
                type="date"
                ref={addDateRef}
                onChange={(e) => setAddForm({ ...addForm, data: isoToDateBR((e.target as HTMLInputElement).value) })}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => {
                  const el = addDateRef.current
                  if (el) {
                    el.focus()
                    // @ts-ignore
                    if (typeof el.showPicker === 'function') el.showPicker()
                  }
                }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#000', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                aria-label="Abrir calendário"
              >
                <CalendarIcon />
              </button>
            </div>
            <TextField.Root placeholder="Descrição" value={addForm.descricao} onChange={(e) => setAddForm({ ...addForm, descricao: (e.target as HTMLInputElement).value })} />
            <TextField.Root placeholder="Valor" value={maskBRL(addForm.valor)} onChange={(e) => setAddForm({ ...addForm, valor: maskBRL((e.target as HTMLInputElement).value) })} />
            <Flex gap="2" justify="end">
              <Button variant="soft" onClick={() => setOpenAdd(false)}>Cancelar</Button>
              <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={addPurchase} disabled={loading}>Salvar</Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={openEdit} onOpenChange={setOpenEdit}>
        <Dialog.Content size="3">
          <Dialog.Title>Editar histórico</Dialog.Title>
          <Separator size="4" />
          <Flex direction="column" gap="3">
            <div style={{ position: 'relative' }}>
              <TextField.Root
                placeholder="dd/mm/yyyy"
                value={editForm.data}
                onChange={(e) => setEditForm({ ...editForm, data: maskDateBR((e.target as HTMLInputElement).value) })}
                style={{ paddingRight: 28 }}
              />
              <input
                type="date"
                ref={editDateRef}
                onChange={(e) => setEditForm({ ...editForm, data: isoToDateBR((e.target as HTMLInputElement).value) })}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
              />
              <button
                type="button"
                onClick={() => {
                  const el = editDateRef.current
                  if (el) {
                    el.focus()
                    // @ts-ignore
                    if (typeof el.showPicker === 'function') el.showPicker()
                  }
                }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#000', background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                aria-label="Abrir calendário"
              >
                <CalendarIcon />
              </button>
            </div>
            <TextField.Root placeholder="Descrição" value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: (e.target as HTMLInputElement).value })} />
            <TextField.Root placeholder="Valor" value={maskBRL(editForm.valor)} onChange={(e) => setEditForm({ ...editForm, valor: maskBRL((e.target as HTMLInputElement).value) })} />
            <Flex gap="2" justify="end">
              <Button variant="soft" onClick={() => setOpenEdit(false)}>Cancelar</Button>
              <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={updatePurchase} disabled={loading}>Salvar</Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={openConfirmPerson} onOpenChange={setOpenConfirmPerson}>
        <Dialog.Content size="3">
          <Dialog.Title>Confirmar exclusão</Dialog.Title>
          <Separator size="4" />
          <RtText>Tem certeza que deseja excluir este irmão(ã)?</RtText>
          <Flex gap="2" justify="end" mt="3">
            <Button variant="soft" onClick={() => setOpenConfirmPerson(false)}>Cancelar</Button>
            <Button variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }} onClick={remove} disabled={loading}>
              Excluir
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={openConfirmPurchase} onOpenChange={setOpenConfirmPurchase}>
        <Dialog.Content size="3">
          <Dialog.Title>Confirmar exclusão</Dialog.Title>
          <Separator size="4" />
          <RtText>Tem certeza que deseja excluir este histórico?</RtText>
          <Flex gap="2" justify="end" mt="3">
            <Button variant="soft" onClick={() => setOpenConfirmPurchase(false)}>Cancelar</Button>
            <Button
              variant="solid"
              color="gray"
              highContrast
              style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }}
              onClick={() => pendingDeletePurchase && deletePurchase(pendingDeletePurchase)}
              disabled={loading || !pendingDeletePurchase}
            >
              Excluir
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  )
}
