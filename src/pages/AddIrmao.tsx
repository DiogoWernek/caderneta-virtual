import { useState, useRef } from 'react'
import { Button, Card, Flex, Heading, RadioGroup, Separator, TextField, Callout, Text, Box } from '@radix-ui/themes'
import { supabase } from '../lib/supabase'
import { maskCep, onlyDigits, maskBRL, parseBRL, maskDateBR, parseDateBR, isoToDateBR } from '../lib/format'
import { useNavigate } from 'react-router-dom'

export default function AddIrmao({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const personDateRef = useRef<HTMLInputElement | null>(null)
  const conjDateRef = useRef<HTMLInputElement | null>(null)
  const CalendarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v10h14V9ZM7 12h3v3H7v-3Z"></path>
    </svg>
  )
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
    congregacao_comum: '',
    cep: '',
    rua: '',
    bairro: '',
    cidade: '',
    uf: '',
    numero_residencia: '',
    valor_aluguel: '',
    salario: '',
    valor_previdencia: '',
    valor_piedade_mensal: '',
    numero_filhos_trabalham: '',
    salario_filhos: '',
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
    const cep = onlyDigits(form.cep)
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
      setError(err instanceof Error ? err.message : 'Erro ao buscar CEP')
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

      const isCasado = form.estado_civil === 'casado'
      const hasKids = form.possui_filhos_netos === 'sim'
      const payload = {
        created_by: userId,
        nome: form.nome || null,
        idade: form.idade ? Number(form.idade) : null,
        tempo_crente_anos: form.tempo_crente_anos ? Number(form.tempo_crente_anos) : null,
        numero_prontuario: form.numero_prontuario || null,
        estado_civil: form.estado_civil as 'solteiro' | 'casado' | 'viuvo' | 'separado',
        conjugue_nome: isCasado ? (form.conjugue_nome || null) : null,
        conjugue_idade: isCasado && form.conjugue_idade ? Number(form.conjugue_idade) : null,
        conjugue_tempo_crente_anos: isCasado && form.conjugue_tempo_crente_anos ? Number(form.conjugue_tempo_crente_anos) : null,
        data_nascimento: parseDateBR(form.data_nascimento),
        conjugue_data_nascimento: isCasado ? parseDateBR(form.conjugue_data_nascimento) : null,
        congregacao_comum: form.congregacao_comum || null,
        cep: onlyDigits(form.cep) || null,
        endereco: enderecoComposto || null,
        valor_aluguel: parseBRL(form.valor_aluguel),
        salario: parseBRL(form.salario),
        valor_previdencia: parseBRL(form.valor_previdencia),
        valor_piedade_mensal: parseBRL(form.valor_piedade_mensal),
        numero_filhos_trabalham: hasKids && form.numero_filhos_trabalham ? Number(form.numero_filhos_trabalham) : null,
        salario_filhos: hasKids ? parseBRL(form.salario_filhos) : null,
        possui_filhos_netos: hasKids,
        qtd_filhos_netos_em_casa: hasKids && form.numero_filhos_netos_em_casa ? Number(form.numero_filhos_netos_em_casa) : 0,
        filhos_idades: hasKids && filhosArr.length ? filhosArr : null,
        filhas_idades: hasKids && filhasArr.length ? filhasArr : null,
        filhos_qtd: hasKids ? (filhosArr.length || 0) : 0,
        filhas_qtd: hasKids ? (filhasArr.length || 0) : 0,
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
            <Heading size="4">Dados pessoais</Heading>
            <Box>
              <Text as="label" size="2">Nome</Text>
              <TextField.Root value={form.nome} onChange={(e) => setForm({ ...form, nome: (e.target as HTMLInputElement).value })} required />
            </Box>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Idade</Text>
                <TextField.Root type="number" value={form.idade} onChange={(e) => setForm({ ...form, idade: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Tempo de crente (anos)</Text>
                <TextField.Root type="number" value={form.tempo_crente_anos} onChange={(e) => setForm({ ...form, tempo_crente_anos: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Nº prontuário</Text>
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
              <Text as="label" size="2">Possui filhos/netos</Text>
              <RadioGroup.Root value={form.possui_filhos_netos} onValueChange={(v) => setForm({ ...form, possui_filhos_netos: v })}>
                <Flex gap="3">
                  <RadioGroup.Item value="sim">Sim</RadioGroup.Item>
                  <RadioGroup.Item value="nao">Não</RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
              {form.possui_filhos_netos === 'sim' && (
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2">Quantidade de filhos/netos em casa</Text>
                  <TextField.Root type="number" value={form.numero_filhos_netos_em_casa} onChange={(e) => setForm({ ...form, numero_filhos_netos_em_casa: (e.target as HTMLInputElement).value })} />
                </Box>
              )}
            </Flex>
            <Flex gap="3">
              <Box style={{ flex: 1, position: 'relative' }}>
                <Text as="label" size="2">Data de nascimento</Text>
                <TextField.Root
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: maskDateBR((e.target as HTMLInputElement).value) })}
                  style={{ paddingRight: 28 }}
                />
                <input
                  type="date"
                  ref={personDateRef}
                  onChange={(e) => setForm({ ...form, data_nascimento: isoToDateBR((e.target as HTMLInputElement).value) })}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = personDateRef.current
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
              </Box>
              {form.estado_civil === 'casado' && (
                <Box style={{ flex: 1, position: 'relative' }}>
                  <Text as="label" size="2">Data nasc. cônjuge</Text>
                  <TextField.Root
                    value={form.conjugue_data_nascimento}
                    onChange={(e) => setForm({ ...form, conjugue_data_nascimento: maskDateBR((e.target as HTMLInputElement).value) })}
                    style={{ paddingRight: 28 }}
                  />
                  <input
                    type="date"
                    ref={conjDateRef}
                    onChange={(e) => setForm({ ...form, conjugue_data_nascimento: isoToDateBR((e.target as HTMLInputElement).value) })}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = conjDateRef.current
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
                </Box>
              )}
            </Flex>
            {form.estado_civil === 'casado' && (
              <>
                <Heading size="4">Cônjuge</Heading>
                <Flex gap="3">
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Nome do cônjuge</Text>
                    <TextField.Root value={form.conjugue_nome} onChange={(e) => setForm({ ...form, conjugue_nome: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Idade cônjuge</Text>
                    <TextField.Root type="number" value={form.conjugue_idade} onChange={(e) => setForm({ ...form, conjugue_idade: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Tempo de crente cônjuge (anos)</Text>
                    <TextField.Root type="number" value={form.conjugue_tempo_crente_anos} onChange={(e) => setForm({ ...form, conjugue_tempo_crente_anos: (e.target as HTMLInputElement).value })} />
                  </Box>
                </Flex>
              </>
            )}
            <Heading size="4">Endereço</Heading>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Comum congregação</Text>
                <TextField.Root value={form.congregacao_comum} onChange={(e) => setForm({ ...form, congregacao_comum: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">CEP</Text>
                <TextField.Root
                  value={maskCep(form.cep)}
                  onChange={(e) => setForm({ ...form, cep: maskCep((e.target as HTMLInputElement).value) })}
                  onBlur={onCepBlur}
                />
              </Box>
            </Flex>
            <Flex gap="3">
              <Box style={{ flex: 2 }}>
                <Text as="label" size="2">Rua</Text>
                <TextField.Root value={form.rua} onChange={(e) => setForm({ ...form, rua: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Número</Text>
                <TextField.Root value={form.numero_residencia} onChange={(e) => setForm({ ...form, numero_residencia: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Bairro</Text>
                <TextField.Root value={form.bairro} onChange={(e) => setForm({ ...form, bairro: (e.target as HTMLInputElement).value })} />
              </Box>
            </Flex>
            <Flex gap="3">
              <Box style={{ flex: 2 }}>
                <Text as="label" size="2">Cidade</Text>
                <TextField.Root value={form.cidade} onChange={(e) => setForm({ ...form, cidade: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">UF</Text>
                <TextField.Root value={form.uf} onChange={(e) => setForm({ ...form, uf: (e.target as HTMLInputElement).value })} />
              </Box>
            </Flex>
            <Heading size="4">Financeiro</Heading>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Valor aluguel</Text>
                <TextField.Root value={maskBRL(form.valor_aluguel)} onChange={(e) => setForm({ ...form, valor_aluguel: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Salário</Text>
                <TextField.Root value={maskBRL(form.salario)} onChange={(e) => setForm({ ...form, salario: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Valor previdência</Text>
                <TextField.Root value={maskBRL(form.valor_previdencia)} onChange={(e) => setForm({ ...form, valor_previdencia: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
            </Flex>
            <Flex gap="3">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Valor piedade mensal</Text>
                <TextField.Root value={maskBRL(form.valor_piedade_mensal)} onChange={(e) => setForm({ ...form, valor_piedade_mensal: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Nº filhos que trabalham</Text>
                <TextField.Root type="number" value={form.numero_filhos_trabalham} onChange={(e) => setForm({ ...form, numero_filhos_trabalham: (e.target as HTMLInputElement).value })} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2">Salário filhos</Text>
                <TextField.Root value={maskBRL(form.salario_filhos)} onChange={(e) => setForm({ ...form, salario_filhos: maskBRL((e.target as HTMLInputElement).value) })} />
              </Box>
            </Flex>
            {form.possui_filhos_netos === 'sim' && (
              <>
                <Heading size="4">Filhos/netos</Heading>
                <Flex gap="3">
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Idades dos filhos/netos (vírgula)</Text>
                    <TextField.Root value={form.filhos_idades} onChange={(e) => setForm({ ...form, filhos_idades: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Idades das filhas/netas (vírgula)</Text>
                    <TextField.Root value={form.filhas_idades} onChange={(e) => setForm({ ...form, filhas_idades: (e.target as HTMLInputElement).value })} />
                  </Box>
                </Flex>
                <Flex gap="3">
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Nº filhos/netos que trabalham</Text>
                    <TextField.Root type="number" value={form.numero_filhos_trabalham} onChange={(e) => setForm({ ...form, numero_filhos_trabalham: (e.target as HTMLInputElement).value })} />
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Text as="label" size="2">Salário filhos/netos</Text>
                    <TextField.Root value={maskBRL(form.salario_filhos)} onChange={(e) => setForm({ ...form, salario_filhos: maskBRL((e.target as HTMLInputElement).value) })} />
                  </Box>
                </Flex>
              </>
            )}
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
