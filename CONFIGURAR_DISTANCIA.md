# 🗺️ Configurar Cálculo de Distâncias (Alternativas Gratuitas)

## Funcionalidade

O sistema calcula automaticamente a distância e o tempo de viagem entre o hotel cadastrado pelo usuário e os passeios. **Funciona sem nenhuma API key!**

## Opções Disponíveis (em ordem de prioridade)

### 1. OpenRouteService (Recomendado - GRATUITO) ⭐

**Vantagens:**
- ✅ **100% GRATUITO** até 2.000 requisições/dia
- ✅ Distância e tempo de viagem reais
- ✅ Muito preciso
- ✅ Sem necessidade de cartão de crédito

**Como configurar (opcional):**
1. Acesse [OpenRouteService](https://openrouteservice.org/)
2. Crie uma conta gratuita
3. Obtenha sua API Key
4. Adicione no `.env`:
   ```env
   VITE_OPENROUTESERVICE_API_KEY=sua_chave_aqui
   ```

**Sem API Key:** O sistema ainda funciona, mas pode ter limites menores.

---

### 2. Google Maps (Pago após crédito grátis)

**Vantagens:**
- ✅ Muito preciso
- ✅ $200 de crédito grátis por mês (~40.000 requisições)

**Desvantagens:**
- ❌ Pago após o crédito grátis ($5 por 1.000 requisições)
- ❌ Requer cartão de crédito

**Como configurar:**
1. Siga as instruções em `CONFIGURAR_GOOGLE_MAPS.md`
2. Adicione no `.env`:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
   ```

---

### 3. Haversine (Fallback - 100% GRATUITO) ⭐⭐

**Vantagens:**
- ✅ **100% GRATUITO** e **SEM API KEY**
- ✅ Sem limites de uso
- ✅ Funciona sempre

**Desvantagens:**
- ⚠️ Calcula apenas distância em linha reta (não considera estradas)
- ⚠️ Tempo é estimado (baseado em velocidade média)

**Como funciona:**
- Usa OpenStreetMap Nominatim (gratuito) para converter endereços em coordenadas
- Calcula distância usando fórmula matemática (Haversine)
- Estima tempo baseado em velocidade média de 50 km/h

**Não precisa configurar nada!** Funciona automaticamente como fallback.

---

## Como Funciona o Sistema

O sistema tenta as APIs nesta ordem:

1. **OpenRouteService** (se API key configurada)
2. **Google Maps** (se API key configurada)
3. **Haversine** (sempre disponível, sem API key)

Isso significa que **o sistema sempre funciona**, mesmo sem nenhuma API key configurada!

---

## Configuração Recomendada

### Para Uso Gratuito (Recomendado)

**Opção 1: Sem nenhuma configuração**
- O sistema usará Haversine automaticamente
- Funciona 100% gratuito
- Distância em linha reta + tempo estimado

**Opção 2: Com OpenRouteService (Melhor opção gratuita)**
```env
VITE_OPENROUTESERVICE_API_KEY=sua_chave_openrouteservice
```
- 2.000 requisições/dia grátis
- Distância e tempo reais
- Muito preciso

### Para Uso Profissional

Se precisar de mais de 2.000 requisições/dia:
```env
VITE_GOOGLE_MAPS_API_KEY=sua_chave_google
VITE_OPENROUTESERVICE_API_KEY=sua_chave_openrouteservice
```

---

## Onde Aparece

- **TourCard:** Badge com distância e tempo ao lado da data/horário
- **TourDetailPage:** Badge abaixo do endereço do passeio

**Nota:** Se usar Haversine, o tempo aparecerá com `~` (ex: "~15 min") indicando que é estimado.

---

## Exemplo de Uso

### Sem nenhuma API key:
```
Distância: 5.2 km
Tempo: ~10 min (estimado)
```

### Com OpenRouteService ou Google Maps:
```
Distância: 5.2 km
Tempo: 12 min
```

---

## Limitações

### Haversine (fallback gratuito):
- Distância em linha reta (não considera estradas)
- Tempo estimado (pode variar do tempo real)
- Pode ser menos preciso em áreas rurais

### OpenRouteService:
- Limite de 2.000 requisições/dia no plano gratuito
- Pode ser mais lento que Google Maps

### Google Maps:
- Pago após crédito grátis
- Requer cartão de crédito

---

## Solução de Problemas

### Distância não aparece

1. Verifique se o usuário cadastrou um endereço de hotel em "Minha Viagem"
2. Verifique se o passeio tem um endereço cadastrado
3. Verifique o console do navegador para erros
4. O sistema tentará automaticamente o fallback Haversine

### Erro ao geocodificar endereço

- Verifique se os endereços estão completos
- Tente adicionar cidade e estado aos endereços
- O sistema tentará novamente automaticamente

### Limite de requisições atingido

- Se usar OpenRouteService, aguarde até o próximo dia (reset diário)
- O sistema automaticamente usará Haversine como fallback

---

## Recomendação Final

**Para a maioria dos casos:** Não configure nenhuma API key. O sistema funcionará perfeitamente com Haversine (gratuito e sem limites).

**Para maior precisão:** Configure OpenRouteService (gratuito até 2.000/dia).

**Para uso intensivo:** Configure Google Maps (pago, mas muito preciso).
