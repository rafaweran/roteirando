import { supabase } from './supabase';
import { Trip, Tour, Group, TourLink, UserTravelInfo, UserCustomTour } from '../types';

// Database types (matching the schema)
interface DBTrip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string;
  status: 'active' | 'upcoming' | 'completed';
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DBTour {
  id: string;
  trip_id: string;
  name: string;
  date: string;
  time: string;
  price: number;
  description: string;
  observations: string | null;
  image_url: string | null;
  tags: string[] | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

interface DBGroup {
  id: string;
  trip_id: string;
  name: string;
  members_count: number;
  members: string[];
  leader_name: string;
  leader_email: string | null;
  leader_password: string | null;
  password_changed: boolean;
  created_at: string;
  updated_at: string;
}

interface DBTourLink {
  id: string;
  tour_id: string | null;
  trip_id: string | null;
  title: string;
  url: string;
  created_at: string;
}

interface DBTourAttendance {
  id: string;
  group_id: string;
  tour_id: string;
  members: string[];
  custom_date: string | null; // Data personalizada escolhida pelo grupo (NULL = data original do tour)
  selected_price_key: string | null; // Chave do tipo de ingresso selecionado (ex: "inteira", "meia", "price_0", etc.)
  created_at: string;
  updated_at: string;
}

// Helper functions to convert between DB and app types
function dbTripToTrip(dbTrip: DBTrip, links: TourLink[] = []): Trip {
  return {
    id: dbTrip.id,
    name: dbTrip.name,
    destination: dbTrip.destination,
    startDate: dbTrip.start_date,
    endDate: dbTrip.end_date,
    description: dbTrip.description,
    status: dbTrip.status,
    imageUrl: dbTrip.image_url || '',
    links: links.length > 0 ? links : undefined,
  };
}

function dbTourToTour(dbTour: DBTour, links: TourLink[] = []): Tour {
  // Tentar carregar preços múltiplos do campo JSON (se existir)
  let prices: any = undefined;
  if ((dbTour as any).prices) {
    try {
      prices = typeof (dbTour as any).prices === 'string' 
        ? JSON.parse((dbTour as any).prices) 
        : (dbTour as any).prices;
    } catch (e) {
      console.warn('Erro ao parsear preços:', e);
    }
  }

  return {
    id: dbTour.id,
    tripId: dbTour.trip_id,
    name: dbTour.name,
    date: dbTour.date,
    time: dbTour.time,
    price: parseFloat(dbTour.price.toString()),
    prices: prices,
    description: dbTour.description,
    observations: dbTour.observations || undefined,
    imageUrl: dbTour.image_url || undefined,
    links: links.length > 0 ? links : undefined,
    tags: dbTour.tags && dbTour.tags.length > 0 ? dbTour.tags : undefined,
    address: dbTour.address || undefined,
  };
}

function dbGroupToGroup(dbGroup: DBGroup, attendance: Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }> = {}): Group {
  // Se password_changed for null, undefined ou false, considerar como primeiro acesso
  // Apenas se for explicitamente true, considerar que já alterou
  const passwordChanged = dbGroup.password_changed === true;
  
  // Debug: log do grupo do banco (apenas em desenvolvimento)
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('dbGroupToGroup - Dados do banco:', {
      id: dbGroup.id,
      name: dbGroup.name,
      leader_email_raw: dbGroup.leader_email,
      leader_email_type: typeof dbGroup.leader_email,
      password_changed_raw: dbGroup.password_changed,
      password_changed_type: typeof dbGroup.password_changed,
      passwordChanged_mapped: passwordChanged,
      attendanceKeys: Object.keys(attendance),
      attendanceDetails: Object.entries(attendance).map(([tourId, att]) => ({
        tourId,
        membersCount: att.members?.length || 0,
        selectedPriceKey: att.selectedPriceKey,
        hasSelectedPriceKey: !!att.selectedPriceKey
      }))
    });
  }
  
  return {
    id: dbGroup.id,
    tripId: dbGroup.trip_id,
    name: dbGroup.name,
    membersCount: dbGroup.members_count,
    members: dbGroup.members,
    leaderName: dbGroup.leader_name,
    leaderEmail: dbGroup.leader_email || undefined,
    leaderPassword: dbGroup.leader_password || undefined, // Não expor senha em produção
    passwordChanged: passwordChanged,
    tourAttendance: Object.keys(attendance).length > 0 ? attendance : undefined, // Record<string, TourAttendanceInfo>
  };
}

// Trips API
export const tripsApi = {
  async getAll(): Promise<Trip[]> {
    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    if (!trips) return [];

    // Fetch links for each trip
    const { data: tripLinks } = await supabase
      .from('tour_links')
      .select('*')
      .not('trip_id', 'is', null);

    const linksByTripId: Record<string, TourLink[]> = {};
    tripLinks?.forEach(link => {
      if (link.trip_id) {
        if (!linksByTripId[link.trip_id]) {
          linksByTripId[link.trip_id] = [];
        }
        linksByTripId[link.trip_id].push({ title: link.title, url: link.url });
      }
    });

    return trips.map((trip: DBTrip) => 
      dbTripToTrip(trip, linksByTripId[trip.id] || [])
    );
  },

  async getById(id: string): Promise<Trip | null> {
    const { data: trip, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!trip) return null;

    const { data: links } = await supabase
      .from('tour_links')
      .select('*')
      .eq('trip_id', id);

    const tourLinks: TourLink[] = links?.map(link => ({
      title: link.title,
      url: link.url,
    })) || [];

    return dbTripToTrip(trip, tourLinks);
  },

  async create(trip: Omit<Trip, 'id'>): Promise<Trip> {
    console.log('🗄️ tripsApi.create: Recebendo dados:', {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      hasDescription: !!trip.description,
      hasImage: !!trip.imageUrl,
      linksCount: trip.links?.length || 0
    });
    
    const insertData = {
      name: trip.name,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
      description: trip.description || null,
      status: trip.status,
      image_url: trip.imageUrl || null,
    };
    
    console.log('📤 tripsApi.create: Dados para insert:', insertData);
    
    const { data, error } = await supabase
      .from('trips')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ tripsApi.create: Erro do Supabase:', error);
      throw error;
    }
    
    console.log('✅ tripsApi.create: Viagem criada com sucesso:', data);

    // Insert links if provided
    if (trip.links && trip.links.length > 0) {
      await supabase
        .from('tour_links')
        .insert(
          trip.links.map(link => ({
            trip_id: data.id,
            title: link.title,
            url: link.url,
          }))
        );
    }

    return dbTripToTrip(data);
  },

  async update(id: string, trip: Partial<Omit<Trip, 'id'>>): Promise<Trip> {
    const updateData: any = {};
    if (trip.name !== undefined) updateData.name = trip.name;
    if (trip.destination !== undefined) updateData.destination = trip.destination;
    if (trip.startDate !== undefined) updateData.start_date = trip.startDate;
    if (trip.endDate !== undefined) updateData.end_date = trip.endDate;
    if (trip.description !== undefined) updateData.description = trip.description;
    if (trip.status !== undefined) updateData.status = trip.status;
    if (trip.imageUrl !== undefined) updateData.image_url = trip.imageUrl;

    const { data, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update links if provided
    if (trip.links !== undefined) {
      // Delete existing links
      await supabase.from('tour_links').delete().eq('trip_id', id);
      // Insert new links
      if (trip.links.length > 0) {
        await supabase
          .from('tour_links')
          .insert(
            trip.links.map(link => ({
              trip_id: id,
              title: link.title,
              url: link.url,
            }))
          );
      }
    }

    return dbTripToTrip(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
  },
};

// Tours API
export const toursApi = {
  async getAll(): Promise<Tour[]> {
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    if (!tours) return [];

    const { data: tourLinks } = await supabase
      .from('tour_links')
      .select('*')
      .not('tour_id', 'is', null);

    const linksByTourId: Record<string, TourLink[]> = {};
    tourLinks?.forEach(link => {
      if (link.tour_id) {
        if (!linksByTourId[link.tour_id]) {
          linksByTourId[link.tour_id] = [];
        }
        linksByTourId[link.tour_id].push({ title: link.title, url: link.url });
      }
    });

    return tours.map((tour: DBTour) => 
      dbTourToTour(tour, linksByTourId[tour.id] || [])
    );
  },

  async getByTripId(tripId: string): Promise<Tour[]> {
    const { data: tours, error } = await supabase
      .from('tours')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true });

    if (error) throw error;
    if (!tours) return [];

    const { data: tourLinks } = await supabase
      .from('tour_links')
      .select('*')
      .in('tour_id', tours.map(t => t.id));

    const linksByTourId: Record<string, TourLink[]> = {};
    tourLinks?.forEach(link => {
      if (link.tour_id) {
        if (!linksByTourId[link.tour_id]) {
          linksByTourId[link.tour_id] = [];
        }
        linksByTourId[link.tour_id].push({ title: link.title, url: link.url });
      }
    });

    return tours.map((tour: DBTour) => 
      dbTourToTour(tour, linksByTourId[tour.id] || [])
    );
  },

  async getById(id: string): Promise<Tour | null> {
    const { data: tour, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!tour) return null;

    const { data: links } = await supabase
      .from('tour_links')
      .select('*')
      .eq('tour_id', id);

    const tourLinks: TourLink[] = links?.map(link => ({
      title: link.title,
      url: link.url,
    })) || [];

    return dbTourToTour(tour, tourLinks);
  },

  async create(tour: Omit<Tour, 'id'>): Promise<Tour> {
    console.log('🗄️ ========== toursApi.create ==========');
    console.log('📥 Dados recebidos:', {
      tripId: tour.tripId,
      name: tour.name,
      date: tour.date,
      time: tour.time,
      price: tour.price,
      description: tour.description?.substring(0, 50) + '...',
      hasImage: !!tour.imageUrl,
      imageUrlLength: tour.imageUrl?.length || 0,
      linksCount: tour.links?.length || 0,
    });
    
    console.log('📤 Preparando insert no Supabase...');
    const insertData: any = {
      trip_id: tour.tripId,
      name: tour.name,
      date: tour.date,
      time: tour.time,
      price: tour.price,
      description: tour.description,
      image_url: tour.imageUrl,
    };
    
    // Adiciona tags apenas se houver tags selecionadas
    if (tour.tags && tour.tags.length > 0) {
      insertData.tags = tour.tags;
    }

    // Adiciona preços múltiplos se existirem
    if (tour.prices) {
      insertData.prices = JSON.stringify(tour.prices);
    }

    // Adiciona endereço se existir
    if (tour.address) {
      insertData.address = tour.address;
    }

    // Adiciona observações se existirem
    if (tour.observations) {
      insertData.observations = tour.observations;
    }
    
    console.log('📋 Dados para insert:', {
      ...insertData,
      image_url: insertData.image_url ? `[base64: ${insertData.image_url.length} chars]` : 'null',
    });
    
    let { data, error } = await supabase
      .from('tours')
      .insert(insertData)
      .select()
      .single();

    console.log('📥 Resposta do Supabase:');
    console.log('  - Data:', data ? { id: data.id, name: data.name } : 'null');
    console.log('  - Error:', error);

    // Se o erro for relacionado à coluna 'tags' não existir, tenta novamente sem tags
    if (error && (error.message?.includes("'tags' column") || error.message?.includes("Could not find the 'tags' column"))) {
      console.warn('⚠️ Coluna tags não encontrada. Tentando inserir sem tags...');
      const { tags, ...insertDataWithoutTags } = insertData;
      const retryResult = await supabase
        .from('tours')
        .insert(insertDataWithoutTags)
        .select()
        .single();
      
      if (retryResult.error) {
        console.error('❌ Erro do Supabase (sem tags):', {
          message: retryResult.error.message,
          code: retryResult.error.code,
          details: retryResult.error.details,
          hint: retryResult.error.hint,
        });
        throw retryResult.error;
      }
      
      data = retryResult.data;
      error = null;
      console.log('✅ Tour criado sem tags (coluna tags não existe no banco)');
    } else if (error) {
      console.error('❌ Erro do Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('✅ Tour criado no banco, ID:', data.id);

    // Insert links if provided
    if (tour.links && tour.links.length > 0) {
      console.log(`🔗 Inserindo ${tour.links.length} link(s)...`);
      const linksData = tour.links.map(link => ({
        tour_id: data.id,
        title: link.title,
        url: link.url,
      }));
      console.log('📋 Dados dos links:', linksData);
      
      const { error: linksError } = await supabase
        .from('tour_links')
        .insert(linksData);
      
      if (linksError) {
        console.error('⚠️ Erro ao inserir links (não crítico):', linksError);
        // Não bloquear se os links falharem
      } else {
        console.log('✅ Links inseridos com sucesso');
      }
    }

    console.log('🔄 Convertendo para formato Tour...');
    
    // Buscar links do tour criado
    const { data: tourLinks } = await supabase
      .from('tour_links')
      .select('*')
      .eq('tour_id', data.id);

    const tourLinksArray: TourLink[] = tourLinks?.map(link => ({
      title: link.title,
      url: link.url,
    })) || [];

    const result = dbTourToTour(data, tourLinksArray);
    console.log('✅ Conversão concluída:', { id: result.id, name: result.name });
    console.log('🏁 ========== FIM toursApi.create ==========');
    return result;
  },

  async update(id: string, tour: Partial<Omit<Tour, 'id'>>): Promise<Tour> {
    const updateData: any = {};
    if (tour.tripId !== undefined) updateData.trip_id = tour.tripId;
    if (tour.name !== undefined) updateData.name = tour.name;
    if (tour.date !== undefined) updateData.date = tour.date;
    if (tour.time !== undefined) updateData.time = tour.time;
    if (tour.price !== undefined) updateData.price = tour.price;
    if (tour.description !== undefined) updateData.description = tour.description;
    if (tour.observations !== undefined) updateData.observations = tour.observations || null;
    if (tour.imageUrl !== undefined) updateData.image_url = tour.imageUrl;
    if (tour.address !== undefined) updateData.address = tour.address || null;
    
    // Adiciona tags apenas se houver tags definidas
    if (tour.tags !== undefined) {
      updateData.tags = tour.tags && tour.tags.length > 0 ? tour.tags : null;
    }

    // Adiciona preços múltiplos se existirem
    if (tour.prices !== undefined) {
      updateData.prices = tour.prices ? JSON.stringify(tour.prices) : null;
    }

    let { data, error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // Se o erro for relacionado à coluna 'tags' não existir, tenta novamente sem tags
    if (error && (error.message?.includes("'tags' column") || error.message?.includes("Could not find the 'tags' column"))) {
      console.warn('⚠️ Coluna tags não encontrada. Tentando atualizar sem tags...');
      const { tags, ...updateDataWithoutTags } = updateData;
      const retryResult = await supabase
        .from('tours')
        .update(updateDataWithoutTags)
        .eq('id', id)
        .select()
        .single();
      
      if (retryResult.error) {
        throw retryResult.error;
      }
      
      data = retryResult.data;
      error = null;
      console.log('✅ Tour atualizado sem tags (coluna tags não existe no banco)');
    } else if (error) {
      throw error;
    }

    // Update links if provided
    if (tour.links !== undefined) {
      // Delete existing links
      await supabase.from('tour_links').delete().eq('tour_id', id);
      // Insert new links
      if (tour.links.length > 0) {
        await supabase
          .from('tour_links')
          .insert(
            tour.links.map(link => ({
              tour_id: id,
              title: link.title,
              url: link.url,
            }))
          );
      }
    }

    return dbTourToTour(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('tours').delete().eq('id', id);
    if (error) throw error;
  },
};

// Groups API
export const groupsApi = {
  async getAll(): Promise<Group[]> {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!groups) return [];

    // Fetch attendance for all groups
    const { data: attendance } = await supabase
      .from('tour_attendance')
      .select('*');

    const attendanceByGroupId: Record<string, Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }>> = {};
    attendance?.forEach((att: DBTourAttendance) => {
      if (!attendanceByGroupId[att.group_id]) {
        attendanceByGroupId[att.group_id] = {};
      }
      const attendanceInfo = {
        members: att.members,
        customDate: att.custom_date || null,
        selectedPriceKey: att.selected_price_key || undefined
      };
      
      console.log('📥 groupsApi.getAll - Recuperando attendance:', {
        groupId: att.group_id,
        tourId: att.tour_id,
        membersCount: att.members.length,
        selectedPriceKey: attendanceInfo.selectedPriceKey,
        rawSelectedPriceKey: att.selected_price_key
      });
      
      attendanceByGroupId[att.group_id][att.tour_id] = attendanceInfo;
    });

    return groups.map((group: DBGroup) => 
      dbGroupToGroup(group, attendanceByGroupId[group.id] || {})
    );
  },

  async getByTripId(tripId: string): Promise<Group[]> {
    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!groups) return [];

    // Fetch attendance for these groups
    const groupIds = groups.map(g => g.id);
    const { data: attendance } = await supabase
      .from('tour_attendance')
      .select('*')
      .in('group_id', groupIds);

    const attendanceByGroupId: Record<string, Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }>> = {};
    attendance?.forEach((att: DBTourAttendance) => {
      if (!attendanceByGroupId[att.group_id]) {
        attendanceByGroupId[att.group_id] = {};
      }
      const attendanceInfo = {
        members: att.members,
        customDate: att.custom_date || null,
        selectedPriceKey: att.selected_price_key || undefined
      };
      
      console.log('📥 groupsApi.getByTripId - Recuperando attendance:', {
        groupId: att.group_id,
        tourId: att.tour_id,
        membersCount: att.members.length,
        selectedPriceKey: attendanceInfo.selectedPriceKey,
        rawSelectedPriceKey: att.selected_price_key
      });
      
      attendanceByGroupId[att.group_id][att.tour_id] = attendanceInfo;
    });

    return groups.map((group: DBGroup) => 
      dbGroupToGroup(group, attendanceByGroupId[group.id] || {})
    );
  },

  async getById(id: string): Promise<Group | null> {
    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!group) return null;

    // Fetch attendance
    const { data: attendance } = await supabase
      .from('tour_attendance')
      .select('*')
      .eq('group_id', id);

    const attendanceMap: Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }> = {};
    attendance?.forEach((att: DBTourAttendance) => {
      const attendanceInfo = {
        members: att.members,
        customDate: att.custom_date || null,
        selectedPriceKey: att.selected_price_key || undefined
      };
      
      console.log('📥 groupsApi.getById - Recuperando attendance:', {
        groupId: id,
        tourId: att.tour_id,
        membersCount: att.members.length,
        selectedPriceKey: attendanceInfo.selectedPriceKey,
        rawSelectedPriceKey: att.selected_price_key
      });
      
      attendanceMap[att.tour_id] = attendanceInfo;
    });

    return dbGroupToGroup(group, attendanceMap);
  },

  async create(group: Omit<Group, 'id' | 'tourAttendance'> & { leaderPassword?: string }): Promise<Group> {
    console.log('📝 groupsApi.create - Dados recebidos:', {
      name: group.name,
      leaderEmail: group.leaderEmail,
      leaderName: group.leaderName,
      hasPassword: !!group.leaderPassword,
      passwordLength: group.leaderPassword?.length || 0,
      tripId: group.tripId
    });

    const insertData: any = {
      trip_id: group.tripId,
      name: group.name,
      members_count: group.membersCount || 0,
      members: group.members || [],
      leader_name: group.leaderName,
      leader_email: group.leaderEmail || null,
      leader_password: group.leaderPassword || null,
      password_changed: false, // Senha inicial, ainda não foi alterada
    };

    console.log('📝 groupsApi.create - Dados para inserir:', {
      ...insertData,
      leader_password: insertData.leader_password ? '[HASHED]' : null
    });

    const { data, error } = await supabase
      .from('groups')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar grupo no banco:', error);
      throw error;
    }

    console.log('✅ Grupo criado com sucesso no banco:', {
      id: data.id,
      name: data.name,
      leader_email: data.leader_email,
      has_password: !!data.leader_password
    });

    return dbGroupToGroup(data);
  },

  async update(id: string, group: Partial<Omit<Group, 'id' | 'tourAttendance'>>): Promise<Group> {
    const updateData: any = {};
    if (group.tripId !== undefined) updateData.trip_id = group.tripId;
    if (group.name !== undefined) updateData.name = group.name;
    if (group.membersCount !== undefined) updateData.members_count = group.membersCount;
    if (group.members !== undefined) updateData.members = group.members;
    if (group.leaderName !== undefined) updateData.leader_name = group.leaderName;
    if (group.leaderEmail !== undefined) updateData.leader_email = group.leaderEmail;
    if ((group as any).leaderPassword !== undefined) updateData.leader_password = (group as any).leaderPassword;
    if (group.passwordChanged !== undefined) updateData.password_changed = group.passwordChanged;

    const { data, error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return dbGroupToGroup(data);
  },

  async updatePassword(groupId: string, newPassword: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update({
        leader_password: newPassword,
        password_changed: true, // Marca que a senha foi alterada
      })
      .eq('id', groupId)
      .select()
      .single();

    if (error) throw error;

    return dbGroupToGroup(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar grupo:', error);
      throw new Error(error.message || 'Erro ao deletar grupo');
    }
  },
};

// Tour Attendance API
export const tourAttendanceApi = {
  async saveAttendance(
    groupId: string, 
    tourId: string, 
    members: string[], 
    customDate?: string | null,
    selectedPriceKey?: string
  ): Promise<void> {
    if (members.length === 0) {
      // Delete attendance if no members
      const { error } = await supabase
        .from('tour_attendance')
        .delete()
        .eq('group_id', groupId)
        .eq('tour_id', tourId);
      if (error) throw error;
    } else {
      // Upsert attendance
      // Só incluir selected_price_key se for fornecido (para evitar erro se a coluna não existir)
      const insertData: any = {
        group_id: groupId,
        tour_id: tourId,
        members: members,
        custom_date: customDate || null, // NULL = data original do tour
      };
      
      // Só adicionar selected_price_key se for fornecido e não for vazio
      if (selectedPriceKey && selectedPriceKey.trim() !== '') {
        insertData.selected_price_key = selectedPriceKey;
        console.log('💾 tourAttendanceApi.saveAttendance - Adicionando selected_price_key:', selectedPriceKey);
      } else {
        console.warn('⚠️ tourAttendanceApi.saveAttendance - selectedPriceKey não fornecido ou vazio:', selectedPriceKey);
      }
      
      console.log('💾 tourAttendanceApi.saveAttendance - Dados para salvar:', {
        groupId,
        tourId,
        membersCount: members.length,
        customDate,
        selectedPriceKey,
        insertData
      });
      
      const { error, data } = await supabase
        .from('tour_attendance')
        .upsert(insertData, {
          onConflict: 'group_id,tour_id',
        })
        .select();
      
      if (data) {
        console.log('✅ tourAttendanceApi.saveAttendance - Dados salvos:', data);
      }
      
      // Se der erro relacionado à coluna selected_price_key não existir, tentar novamente sem ela
      if (error && error.message && error.message.includes('selected_price_key')) {
        console.warn('⚠️ Coluna selected_price_key não encontrada. Tentando salvar sem ela...');
        console.warn('⚠️ IMPORTANTE: Execute o script SQL para adicionar a coluna selected_price_key!');
        const { error: retryError } = await supabase
          .from('tour_attendance')
          .upsert({
            group_id: groupId,
            tour_id: tourId,
            members: members,
            custom_date: customDate || null,
          }, {
            onConflict: 'group_id,tour_id',
          });
        if (retryError) throw retryError;
      } else if (error) {
        console.error('❌ tourAttendanceApi.saveAttendance - Erro ao salvar:', error);
        throw error;
      }
    }
  },

  async getAttendanceByGroup(groupId: string): Promise<Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }>> {
    const { data, error } = await supabase
      .from('tour_attendance')
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    if (!data) return {};

    const attendance: Record<string, { members: string[]; customDate?: string | null; selectedPriceKey?: string }> = {};
    data.forEach((att: DBTourAttendance) => {
      const attendanceInfo = {
        members: att.members,
        customDate: att.custom_date || null,
        selectedPriceKey: att.selected_price_key || undefined
      };
      
      console.log('📥 tourAttendanceApi.getAttendanceByGroup - Recuperando:', {
        tourId: att.tour_id,
        membersCount: att.members.length,
        selectedPriceKey: attendanceInfo.selectedPriceKey,
        rawSelectedPriceKey: att.selected_price_key
      });
      
      attendance[att.tour_id] = attendanceInfo;
    });

    return attendance;
  },
};

// Admins API
export const adminsApi = {
  async isAdmin(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Tentar buscar apenas email (mais rápido e não depende da coluna password)
      const { data, error } = await supabase
        .from('admins')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

      if (error) {
        // Se a tabela não existir, retorna false
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return false;
        }
        // Outros erros também retornam false
        return false;
      }

      return !!data;
    } catch (error: any) {
      // Em caso de erro, retorna false
      return false;
    }
  },

  async getAdminByEmail(email: string): Promise<{ email: string; password: string | null } | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Tentar buscar com password primeiro
      let { data, error } = await supabase
        .from('admins')
        .select('email, password')
        .eq('email', normalizedEmail)
        .single();

      // Se erro por coluna não existir, buscar sem password
      if (error && (error.code === '42703' || error.message?.includes('column "password" does not exist'))) {
        const { data: dataWithoutPassword, error: errorWithoutPassword } = await supabase
          .from('admins')
          .select('email')
          .eq('email', normalizedEmail)
          .single();
        
        if (errorWithoutPassword || !dataWithoutPassword) {
          return null;
        }
        
        return {
          email: dataWithoutPassword.email,
          password: null
        };
      }
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ Erro ao buscar admin:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        email: data.email,
        password: (data as any).password || null
      };
    } catch (error) {
      console.error('❌ Erro ao buscar admin:', error);
      return null;
    }
  },

  async getAll(): Promise<Array<{ id: string; email: string; name: string | null }>> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, email, name')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.log('⚠️ Tabela admins não existe ainda');
          return [];
        }
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
      return [];
    }
  },

  async addAdmin(email: string, name?: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { error } = await supabase
        .from('admins')
        .insert({
          email: normalizedEmail,
          name: name || null,
        });

      if (error) {
        if (error.code === '23505') {
          console.log('⚠️ Administrador já existe:', normalizedEmail);
          return true; // Já existe, consideramos sucesso
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao adicionar administrador:', error);
      return false;
    }
  },

  async getAdminByEmailWithPasswordChanged(email: string): Promise<{ email: string; password: string | null; passwordChanged: boolean | null } | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('admins')
        .select('email, password, password_changed')
        .eq('email', normalizedEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        // Se a coluna password_changed não existir, tentar sem ela
        if (error.code === '42703' || error.message?.includes('column "password_changed" does not exist')) {
          const { data: dataWithoutPasswordChanged, error: errorWithoutPasswordChanged } = await supabase
            .from('admins')
            .select('email, password')
            .eq('email', normalizedEmail)
            .single();
          
          if (errorWithoutPasswordChanged || !dataWithoutPasswordChanged) {
            return null;
          }
          
          return {
            email: dataWithoutPasswordChanged.email,
            password: (dataWithoutPasswordChanged as any).password || null,
            passwordChanged: false // Default para false se coluna não existir
          };
        }
        console.error('❌ Erro ao buscar admin:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        email: data.email,
        password: (data as any).password || null,
        passwordChanged: (data as any).password_changed ?? false
      };
    } catch (error) {
      console.error('❌ Erro ao buscar admin:', error);
      return null;
    }
  },

  async updateAdminPassword(email: string, hashedPassword: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { error } = await supabase
        .from('admins')
        .update({
          password: hashedPassword,
          password_changed: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', normalizedEmail);

      if (error) {
        console.error('❌ Erro ao atualizar senha do admin:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar senha do admin:', error);
      return false;
    }
  },
};

// User Travel Info API
interface DBUserTravelInfo {
  id: string;
  group_id: string;
  hotel_name: string | null;
  hotel_address: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
  hotel_phone: string | null;
  hotel_confirmation_code: string | null;
  hotel_notes: string | null;
  flight_company: string | null;
  flight_number: string | null;
  flight_departure_date: string | null;
  flight_departure_time: string | null;
  flight_departure_airport: string | null;
  flight_arrival_date: string | null;
  flight_arrival_time: string | null;
  flight_arrival_airport: string | null;
  flight_confirmation_code: string | null;
  flight_notes: string | null;
  car_rental_company: string | null;
  car_rental_pickup_date: string | null;
  car_rental_pickup_time: string | null;
  car_rental_pickup_location: string | null;
  car_rental_return_date: string | null;
  car_rental_return_time: string | null;
  car_rental_return_location: string | null;
  car_rental_confirmation_code: string | null;
  car_rental_notes: string | null;
  personal_name: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  personal_document: string | null;
  personal_emergency_contact: string | null;
  personal_emergency_phone: string | null;
  personal_notes: string | null;
  created_at: string;
  updated_at: string;
}

function dbUserTravelInfoToUserTravelInfo(db: DBUserTravelInfo): UserTravelInfo {
  return {
    id: db.id,
    groupId: db.group_id,
    hotelName: db.hotel_name || undefined,
    hotelAddress: db.hotel_address || undefined,
    hotelCheckin: db.hotel_checkin || undefined,
    hotelCheckout: db.hotel_checkout || undefined,
    hotelPhone: db.hotel_phone || undefined,
    hotelConfirmationCode: db.hotel_confirmation_code || undefined,
    hotelNotes: db.hotel_notes || undefined,
    flightCompany: db.flight_company || undefined,
    flightNumber: db.flight_number || undefined,
    flightDepartureDate: db.flight_departure_date || undefined,
    flightDepartureTime: db.flight_departure_time || undefined,
    flightDepartureAirport: db.flight_departure_airport || undefined,
    flightArrivalDate: db.flight_arrival_date || undefined,
    flightArrivalTime: db.flight_arrival_time || undefined,
    flightArrivalAirport: db.flight_arrival_airport || undefined,
    flightConfirmationCode: db.flight_confirmation_code || undefined,
    flightNotes: db.flight_notes || undefined,
    carRentalCompany: db.car_rental_company || undefined,
    carRentalPickupDate: db.car_rental_pickup_date || undefined,
    carRentalPickupTime: db.car_rental_pickup_time || undefined,
    carRentalPickupLocation: db.car_rental_pickup_location || undefined,
    carRentalReturnDate: db.car_rental_return_date || undefined,
    carRentalReturnTime: db.car_rental_return_time || undefined,
    carRentalReturnLocation: db.car_rental_return_location || undefined,
    carRentalConfirmationCode: db.car_rental_confirmation_code || undefined,
    carRentalNotes: db.car_rental_notes || undefined,
    personalName: db.personal_name || undefined,
    personalEmail: db.personal_email || undefined,
    personalPhone: db.personal_phone || undefined,
    personalDocument: db.personal_document || undefined,
    personalEmergencyContact: db.personal_emergency_contact || undefined,
    personalEmergencyPhone: db.personal_emergency_phone || undefined,
    personalNotes: db.personal_notes || undefined,
  };
}

export const userTravelInfoApi = {
  async getByGroupId(groupId: string): Promise<UserTravelInfo | null> {
    try {
      const { data, error } = await supabase
        .from('user_travel_info')
        .select('*')
        .eq('group_id', groupId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return dbUserTravelInfoToUserTravelInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações de viagem:', error);
      return null;
    }
  },

  async upsert(info: UserTravelInfo): Promise<UserTravelInfo> {
    const insertData: any = {
      group_id: info.groupId,
      hotel_name: info.hotelName || null,
      hotel_address: info.hotelAddress || null,
      hotel_checkin: info.hotelCheckin || null,
      hotel_checkout: info.hotelCheckout || null,
      hotel_phone: info.hotelPhone || null,
      hotel_confirmation_code: info.hotelConfirmationCode || null,
      hotel_notes: info.hotelNotes || null,
      flight_company: info.flightCompany || null,
      flight_number: info.flightNumber || null,
      flight_departure_date: info.flightDepartureDate || null,
      flight_departure_time: info.flightDepartureTime || null,
      flight_departure_airport: info.flightDepartureAirport || null,
      flight_arrival_date: info.flightArrivalDate || null,
      flight_arrival_time: info.flightArrivalTime || null,
      flight_arrival_airport: info.flightArrivalAirport || null,
      flight_confirmation_code: info.flightConfirmationCode || null,
      flight_notes: info.flightNotes || null,
      car_rental_company: info.carRentalCompany || null,
      car_rental_pickup_date: info.carRentalPickupDate || null,
      car_rental_pickup_time: info.carRentalPickupTime || null,
      car_rental_pickup_location: info.carRentalPickupLocation || null,
      car_rental_return_date: info.carRentalReturnDate || null,
      car_rental_return_time: info.carRentalReturnTime || null,
      car_rental_return_location: info.carRentalReturnLocation || null,
      car_rental_confirmation_code: info.carRentalConfirmationCode || null,
      car_rental_notes: info.carRentalNotes || null,
      personal_name: info.personalName || null,
      personal_email: info.personalEmail || null,
      personal_phone: info.personalPhone || null,
      personal_document: info.personalDocument || null,
      personal_emergency_contact: info.personalEmergencyContact || null,
      personal_emergency_phone: info.personalEmergencyPhone || null,
      personal_notes: info.personalNotes || null,
    };

    const { data, error } = await supabase
      .from('user_travel_info')
      .upsert(insertData, {
        onConflict: 'group_id',
      })
      .select()
      .single();

    if (error) throw error;

    return dbUserTravelInfoToUserTravelInfo(data);
  },
};
// User Custom Tours API
interface DBUserCustomTour {
  id: string;
  group_id: string;
  name: string;
  date: string;
  time: string;
  price: number | null;
  description: string | null;
  image_url: string | null;
  address: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

function dbUserCustomTourToUserCustomTour(db: DBUserCustomTour): UserCustomTour {
  return {
    id: db.id,
    groupId: db.group_id,
    name: db.name,
    date: db.date,
    time: db.time,
    price: db.price ?? undefined,
    description: db.description ?? undefined,
    imageUrl: db.image_url ?? undefined,
    address: db.address ?? undefined,
    location: db.location ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const userCustomToursApi = {
  async getByGroupId(groupId: string): Promise<UserCustomTour[]> {
    try {
      const { data, error } = await supabase
        .from('user_custom_tours')
        .select('*')
        .eq('group_id', groupId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      if (!data) return [];

      return data.map(dbUserCustomTourToUserCustomTour);
    } catch (error) {
      console.error('Erro ao buscar passeios personalizados:', error);
      return [];
    }
  },

  async getById(id: string): Promise<UserCustomTour | null> {
    try {
      const { data, error } = await supabase
        .from('user_custom_tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return dbUserCustomTourToUserCustomTour(data);
    } catch (error) {
      console.error('Erro ao buscar passeio personalizado:', error);
      return null;
    }
  },

  async create(tour: Omit<UserCustomTour, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserCustomTour> {
    const insertData: any = {
      group_id: tour.groupId,
      name: tour.name,
      date: tour.date,
      time: tour.time,
      price: tour.price ?? null,
      description: tour.description ?? null,
      image_url: tour.imageUrl ?? null,
      address: tour.address ?? null,
      location: tour.location ?? null,
    };

    const { data, error } = await supabase
      .from('user_custom_tours')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return dbUserCustomTourToUserCustomTour(data);
  },

  async update(id: string, tour: Partial<Omit<UserCustomTour, 'id' | 'groupId' | 'createdAt' | 'updatedAt'>>): Promise<UserCustomTour> {
    const updateData: any = {};
    
    if (tour.name !== undefined) updateData.name = tour.name;
    if (tour.date !== undefined) updateData.date = tour.date;
    if (tour.time !== undefined) updateData.time = tour.time;
    if (tour.price !== undefined) updateData.price = tour.price ?? null;
    if (tour.description !== undefined) updateData.description = tour.description ?? null;
    if (tour.imageUrl !== undefined) updateData.image_url = tour.imageUrl ?? null;
    if (tour.address !== undefined) updateData.address = tour.address ?? null;
    if (tour.location !== undefined) updateData.location = tour.location ?? null;

    const { data, error } = await supabase
      .from('user_custom_tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return dbUserCustomTourToUserCustomTour(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('user_custom_tours')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
