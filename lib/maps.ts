/**
 * Funções para trabalhar com mapas e distâncias
 * Suporta múltiplas APIs: OpenRouteService (gratuito), Google Maps (pago), ou cálculo Haversine (gratuito, sem tempo)
 */

export interface DistanceResult {
  distance: number; // Distância em metros
  distanceText: string; // Distância formatada (ex: "5.2 km")
  duration: number; // Duração em segundos (0 se não disponível)
  durationText: string; // Duração formatada (ex: "15 min" ou "~15 min" se estimado)
}

type Provider = 'openrouteservice' | 'google' | 'haversine';

/**
 * Calcula a distância usando Haversine (gratuito, mas só distância em linha reta)
 * Precisa primeiro converter endereços em coordenadas usando geocodificação
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      console.warn('⚠️ geocodeAddress: Endereço vazio');
      return null;
    }

    console.log('🔍 geocodeAddress: Geocodificando endereço:', trimmedAddress);
    
    // Adicionar pequeno delay para evitar rate limiting do Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedAddress)}&limit=1&addressdetails=1&countrycodes=br`;
    console.log('🔍 geocodeAddress: URL:', url);
    
    // Usar Nominatim (OpenStreetMap) - gratuito e sem API key
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RoteirandoApp/1.0 (contact@roteirando.com)', // Nominatim requer User-Agent
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });

    console.log('🔍 geocodeAddress: Status da resposta:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.warn('⚠️ geocodeAddress: Erro na resposta', response.status, response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    console.log('🔍 geocodeAddress: Dados recebidos:', data?.length || 0, 'resultados');
    
    if (!data || data.length === 0) {
      console.warn('⚠️ geocodeAddress: Nenhum resultado encontrado para:', trimmedAddress);
      return null;
    }

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lon)) {
      console.warn('⚠️ geocodeAddress: Coordenadas inválidas:', data[0]);
      return null;
    }

    const coords = { lat, lon };
    console.log('✅ geocodeAddress: Coordenadas encontradas:', coords, 'para:', trimmedAddress);
    return coords;
  } catch (error: any) {
    console.error('❌ geocodeAddress: Erro ao geocodificar endereço:', address, error);
    console.error('❌ Stack trace:', error?.stack);
    return null;
  }
}

/**
 * Calcula distância em linha reta usando fórmula de Haversine
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula distância usando Haversine (gratuito, mas só distância em linha reta)
 */
async function calculateDistanceHaversine(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  console.log('🔍 calculateDistanceHaversine: Iniciando cálculo', { origin, destination });
  
  const originCoords = await geocodeAddress(origin);
  const destCoords = await geocodeAddress(destination);

  if (!originCoords) {
    console.warn('⚠️ calculateDistanceHaversine: Não foi possível geocodificar origem:', origin);
    return null;
  }

  if (!destCoords) {
    console.warn('⚠️ calculateDistanceHaversine: Não foi possível geocodificar destino:', destination);
    return null;
  }

  const distance = haversineDistance(
    originCoords.lat, originCoords.lon,
    destCoords.lat, destCoords.lon
  );

  // Estimar tempo baseado em velocidade média de 50 km/h em cidade
  const estimatedDuration = (distance / 1000) / 50 * 3600; // segundos

  const result = {
    distance,
    distanceText: formatDistance(distance),
    duration: estimatedDuration,
    durationText: `~${formatDuration(estimatedDuration)}`
  };

  console.log('✅ calculateDistanceHaversine: Resultado calculado', result);
  return result;
}

/**
 * Calcula distância usando OpenRouteService (GRATUITO até 2.000 requisições/dia)
 */
async function calculateDistanceOpenRouteService(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  const apiKey = (import.meta as any).env?.VITE_OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    // Tenta sem API key (pode funcionar para poucas requisições)
    return null;
  }

  try {
    // Primeiro, geocodificar os endereços
    const originCoords = await geocodeAddress(origin);
    const destCoords = await geocodeAddress(destination);

    if (!originCoords || !destCoords) {
      return null;
    }

    // Chamar OpenRouteService Directions API
    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${originCoords.lon},${originCoords.lat}&end=${destCoords.lon},${destCoords.lat}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const route = data.routes?.[0];
    const segment = route?.segments?.[0];

    if (!segment) {
      return null;
    }

    const distance = segment.distance; // em metros
    const duration = segment.duration; // em segundos

    return {
      distance,
      distanceText: formatDistance(distance),
      duration,
      durationText: formatDuration(duration)
    };
  } catch (error) {
    console.error('Erro ao calcular com OpenRouteService:', error);
    return null;
  }
}

/**
 * Calcula distância usando Google Maps (pago após crédito grátis)
 */
async function calculateDistanceGoogle(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}&language=pt-BR&units=metric`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return null;
    }

    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      return null;
    }

    return {
      distance: element.distance.value,
      distanceText: element.distance.text,
      duration: element.duration.value,
      durationText: element.duration.text,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Calcula a distância e tempo de viagem entre dois endereços
 * Tenta múltiplas APIs na ordem: OpenRouteService → Google Maps → Haversine (fallback gratuito)
 * @param origin Endereço de origem
 * @param destination Endereço de destino
 * @returns Informações de distância e tempo, ou null se houver erro
 */
export async function calculateDistance(
  origin: string,
  destination: string
): Promise<DistanceResult | null> {
  if (!origin || !destination) {
    console.warn('⚠️ calculateDistance: Endereços não fornecidos', { origin, destination });
    return null;
  }

  console.log('🚀 calculateDistance: Iniciando cálculo de distância', {
    origin: origin.substring(0, 50),
    destination: destination.substring(0, 50)
  });

  // Ordem de tentativas (da melhor para a mais simples):
  // 1. OpenRouteService (gratuito, com tempo real)
  // 2. Google Maps (pago, mas muito preciso)
  // 3. Haversine (gratuito, mas só distância em linha reta)

  // Tentar OpenRouteService primeiro (gratuito)
  console.log('🔄 Tentando OpenRouteService...');
  const orsResult = await calculateDistanceOpenRouteService(origin, destination);
  if (orsResult) {
    console.log('✅ calculateDistance: Sucesso com OpenRouteService', orsResult);
    return orsResult;
  }

  // Tentar Google Maps (se configurado)
  console.log('🔄 Tentando Google Maps...');
  const googleResult = await calculateDistanceGoogle(origin, destination);
  if (googleResult) {
    console.log('✅ calculateDistance: Sucesso com Google Maps', googleResult);
    return googleResult;
  }

  // Fallback: Haversine (gratuito, mas só distância em linha reta)
  console.log('🔄 Tentando Haversine (fallback gratuito)...');
  const haversineResult = await calculateDistanceHaversine(origin, destination);
  if (haversineResult) {
    console.log('✅ calculateDistance: Sucesso com Haversine', haversineResult);
    return haversineResult;
  }

  console.error('❌ calculateDistance: Todas as tentativas falharam');
  return null;
}

/**
 * Formata a distância em km de forma mais legível
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }
  const km = distanceMeters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Formata a duração de forma mais legível
 */
export function formatDuration(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}
