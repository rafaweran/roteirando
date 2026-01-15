// User Custom Tours API
import { supabase } from './supabase';
import { UserCustomTour } from '../types';

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
