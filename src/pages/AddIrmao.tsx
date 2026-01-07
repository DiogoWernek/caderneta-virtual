import { useState } from 'react'
import { Button, Card, Flex, Heading, RadioGroup, Separator, TextField, Callout } from '@radix-ui/themes'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AddIrmao({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
    rua: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero_residencia: '',
    filhos_idades: '',
    filhas_idades: ''
  })

  const parseNums = (s: string) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n >= 0)

  const onCepBlur = async () => {
    const cep = form.cep.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data?.erro) return
      setForm((f) => ({
        ...f,
        rua: data.logradouro ?? f.rua,
        bairro: data.bairro ?? f.bairro,
        cidade: data.localidade ?? f.cidade,
        uf: data.uf ?? f.uf
      }))
    } catch (err) {
      setError(err.message ?? 'Erro ao buscar CEP')
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError(null)
    try {
      const filhosArr = parseNums(form.filhos_idades)
      const filhasArr = parseNums(form.filhas_idades)
      const enderecoComposto =
        [form.rua, form.numero_residencia, form.bairro, `${form.cidade}/${form.uf}`]
          .filter(Boolean)
          .join(', ')

      const payload = {
        created_by: userId,
        nome: form.nome || null,
        idade: form.idade ? Number(form.idade) : null,
        tempo_crente_anos: form.tempo_crente_anos ? Number(form.tempo_crente_anos) : null,
        numero_prontuario: form.numero_prontuario || null,
        estado_civil: form.estado_civil as 'solteiro' | 'casado' | 'viuvo' | 'separado',
        conjugue_nome: form.conjugue_nome || null,
        conjugue_idade: form.conjugue_idade ? Number(form.conjugue_idade) : null,
        conjugue_tempo_crente_anos: form.conjugue_tempo_crente_anos ? Number(form.conjugue_tempo_crente_anos) : null,
        congregacao_comum: form.congregacao_comum || null,
        cep: form.cep || null,
        endereco: enderecoComposto || null,
        filhos_idades: filhosArr.length ? filhosArr : null,
        filhas_idades: filhasArr.length ? filhasArr : null,
        filhos_qtd: filhosArr.length || 0,
        filhas_qtd: filhasArr.length || 0,
        numero_residencia: form.numero_residencia || null
      } as any

      const { error } = await supabase.from('persons').insert([payload])
      if (error) throw error
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex direction="column" align="center" style={{ minHeight: '100vh', width: '100%' }} gap="4" className="main-wrapper">
      <Heading size="6">Adicionar irmão(ã)</Heading>
      <Separator size="4" />
      {error && (
        <Callout.Root color="red" highContrast>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Card className="auth-card" style={{ width: '100%' }}>
        <form onSubmit={submit}>
          <Flex direction="column" gap="4">
            <TextField.Root placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: (e.target as HTMLInputElement).value })} required />
            <Flex gap="3">
              <TextField.Root placeholder="Idade" type="number" value={form.idade} onChange={(e) => setForm({ ...form, idade: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Tempo de crente (anos)" type="number" value={form.tempo_crente_anos} onChange={(e) => setForm({ ...form, tempo_crente_anos: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Nº prontuário" value={form.numero_prontuario} onChange={(e) => setForm({ ...form, numero_prontuario: (e.target as HTMLInputElement).value })} />
            </Flex>
            <RadioGroup.Root value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
              <Flex gap="3">
                <RadioGroup.Item value="solteiro">Solteiro(a)</RadioGroup.Item>
                <RadioGroup.Item value="casado">Casado(a)</RadioGroup.Item>
                <RadioGroup.Item value="viuvo">Viúvo(a)</RadioGroup.Item>
                <RadioGroup.Item value="separado">Separado(a)</RadioGroup.Item>
              </Flex>
            </RadioGroup.Root>
            <Flex gap="3">
              <TextField.Root placeholder="Nome do cônjuge" value={form.conjugue_nome} onChange={(e) => setForm({ ...form, conjugue_nome: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Idade cônjuge" type="number" value={form.conjugue_idade} onChange={(e) => setForm({ ...form, conjugue_idade: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Tempo de crente cônjuge (anos)" type="number" value={form.conjugue_tempo_crente_anos} onChange={(e) => setForm({ ...form, conjugue_tempo_crente_anos: (e.target as HTMLInputElement).value })} />
            </Flex>
            <Flex gap="3">
              <TextField.Root placeholder="Comum congregação" value={form.congregacao_comum} onChange={(e) => setForm({ ...form, congregacao_comum: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="CEP" value={form.cep} onChange={(e) => setForm({ ...form, cep: (e.target as HTMLInputElement).value })} onBlur={onCepBlur} />
            </Flex>
            <Flex gap="3">
              <TextField.Root placeholder="Rua" value={form.rua} onChange={(e) => setForm({ ...form, rua: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Número" value={form.numero_residencia} onChange={(e) => setForm({ ...form, numero_residencia: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Bairro" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: (e.target as HTMLInputElement).value })} />
            </Flex>
            <Flex gap="3">
              <TextField.Root placeholder="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="UF" value={form.uf} onChange={(e) => setForm({ ...form, uf: (e.target as HTMLInputElement).value })} />
            </Flex>
            <Flex gap="3">
              <TextField.Root placeholder="Idades dos filhos (vírgula)" value={form.filhos_idades} onChange={(e) => setForm({ ...form, filhos_idades: (e.target as HTMLInputElement).value })} />
              <TextField.Root placeholder="Idades das filhas (vírgula)" value={form.filhas_idades} onChange={(e) => setForm({ ...form, filhas_idades: (e.target as HTMLInputElement).value })} />
            </Flex>
            <Flex gap="3" justify="end">
              <Button variant="soft" onClick={() => navigate('/')}>Cancelar</Button>
              <Button type="submit" disabled={loading} variant="solid" color="gray" highContrast style={{ backgroundColor: 'var(--gray-9)', color: '#fff' }}>
                Salvar
              </Button>
            </Flex>
          </Flex>
        </form>
      </Card>
    </Flex>
  )
}
