import { supabase } from './supabase';
import { Trip, Tour, Group, TourLink } from '../types';

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
  image_url: string | null;
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
  return {
    id: dbTour.id,
    tripId: dbTour.trip_id,
    name: dbTour.name,
    date: dbTour.date,
    time: dbTour.time,
    price: parseFloat(dbTour.price.toString()),
    description: dbTour.description,
    imageUrl: dbTour.image_url || undefined,
    links: links.length > 0 ? links : undefined,
  };
}

function dbGroupToGroup(dbGroup: DBGroup, attendance: Record<string, string[]> = {}): Group {
  // Se password_changed for null, undefined ou false, considerar como primeiro acesso
  // Apenas se for explicitamente true, considerar que já alterou
  const passwordChanged = dbGroup.password_changed === true;
  
  // Debug: log do grupo do banco (apenas em desenvolvimento)
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.log('dbGroupToGroup - Dados do banco:', {
      id: dbGroup.id,
      name: dbGroup.name,
      password_changed_raw: dbGroup.password_changed,
      password_changed_type: typeof dbGroup.password_changed,
      passwordChanged_mapped: passwordChanged,
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
    tourAttendance: Object.keys(attendance).length > 0 ? attendance : undefined,
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
    const { data, error } = await supabase
      .from('trips')
      .insert({
        name: trip.name,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        description: trip.description,
        status: trip.status,
        image_url: trip.imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

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
    const insertData = {
      trip_id: tour.tripId,
      name: tour.name,
      date: tour.date,
      time: tour.time,
      price: tour.price,
      description: tour.description,
      image_url: tour.imageUrl,
    };
    console.log('📋 Dados para insert:', {
      ...insertData,
      image_url: insertData.image_url ? `[base64: ${insertData.image_url.length} chars]` : 'null',
    });
    
    const { data, error } = await supabase
      .from('tours')
      .insert(insertData)
      .select()
      .single();

    console.log('📥 Resposta do Supabase:');
    console.log('  - Data:', data ? { id: data.id, name: data.name } : 'null');
    console.log('  - Error:', error);

    if (error) {
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
    const result = dbTourToTour(data);
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
    if (tour.imageUrl !== undefined) updateData.image_url = tour.imageUrl;

    const { data, error } = await supabase
      .from('tours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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

    const attendanceByGroupId: Record<string, Record<string, string[]>> = {};
    attendance?.forEach(att => {
      if (!attendanceByGroupId[att.group_id]) {
        attendanceByGroupId[att.group_id] = {};
      }
      attendanceByGroupId[att.group_id][att.tour_id] = att.members;
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

    const attendanceByGroupId: Record<string, Record<string, string[]>> = {};
    attendance?.forEach(att => {
      if (!attendanceByGroupId[att.group_id]) {
        attendanceByGroupId[att.group_id] = {};
      }
      attendanceByGroupId[att.group_id][att.tour_id] = att.members;
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

    const attendanceMap: Record<string, string[]> = {};
    attendance?.forEach(att => {
      attendanceMap[att.tour_id] = att.members;
    });

    return dbGroupToGroup(group, attendanceMap);
  },

  async create(group: Omit<Group, 'id' | 'tourAttendance'> & { leaderPassword?: string }): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        trip_id: group.tripId,
        name: group.name,
        members_count: group.membersCount,
        members: group.members,
        leader_name: group.leaderName,
        leader_email: group.leaderEmail,
        leader_password: group.leaderPassword || null,
        password_changed: false, // Senha inicial, ainda não foi alterada
      })
      .select()
      .single();

    if (error) throw error;

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
    const { error } = await supabase.from('groups').delete().eq('id', id);
    if (error) throw error;
  },
};

// Tour Attendance API
export const tourAttendanceApi = {
  async saveAttendance(groupId: string, tourId: string, members: string[]): Promise<void> {
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
      const { error } = await supabase
        .from('tour_attendance')
        .upsert({
          group_id: groupId,
          tour_id: tourId,
          members: members,
        }, {
          onConflict: 'group_id,tour_id',
        });
      if (error) throw error;
    }
  },

  async getAttendanceByGroup(groupId: string): Promise<Record<string, string[]>> {
    const { data, error } = await supabase
      .from('tour_attendance')
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;
    if (!data) return {};

    const attendance: Record<string, string[]> = {};
    data.forEach(att => {
      attendance[att.tour_id] = att.members;
    });

    return attendance;
  },
};

// Admins API
export const adminsApi = {
  async isAdmin(email: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('admins')
        .select('email')
        .eq('email', normalizedEmail)
        .single();

      if (error) {
        // Se a tabela não existir ou não encontrar, retorna false
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('⚠️ Tabela admins não existe ainda, usando lista hardcoded');
          return false;
        }
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar se é admin:', error);
      return false;
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
};

