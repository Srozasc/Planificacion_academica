import { create } from 'zustand';
import { Bimestre, bimestreService, CreateBimestreDto, UpdateBimestreDto } from '../services/bimestre.service';

interface BimestreState {
  // Estado
  bimestres: Bimestre[];
  bimestreSeleccionado: Bimestre | null;
  bimestreActual: Bimestre | null;
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchBimestres: (anoAcademico?: number) => Promise<void>;
  fetchBimestresActivos: () => Promise<void>;
  fetchBimestreActual: () => Promise<void>;
  seleccionarBimestre: (bimestre: Bimestre | null) => void;
  crearBimestre: (createDto: CreateBimestreDto) => Promise<Bimestre>;
  actualizarBimestre: (id: number, updateDto: UpdateBimestreDto) => Promise<Bimestre>;
  activarBimestre: (id: number) => Promise<Bimestre>;
  desactivarBimestre: (id: number) => Promise<Bimestre>;
  eliminarBimestre: (id: number) => Promise<void>;
  generarBimestresAno: (anoAcademico: number, fechaInicio: string) => Promise<Bimestre[]>;
  
  // Utilidades
  clearError: () => void;
  getFechasBimestre: (bimestre: Bimestre) => Date[];
  getBimestresAno: (ano: number) => Bimestre[];
}

export const useBimestreStore = create<BimestreState>((set, get) => ({
  // Estado inicial
  bimestres: [],
  bimestreSeleccionado: null,
  bimestreActual: null,
  isLoading: false,
  error: null,

  // Acciones
  fetchBimestres: async (anoAcademico?: number) => {
    set({ isLoading: true, error: null });
    try {
      const bimestres = await bimestreService.findAll(anoAcademico);
      set({ bimestres, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar bimestres',
        isLoading: false 
      });
    }
  },

  fetchBimestresActivos: async () => {
    set({ isLoading: true, error: null });
    try {
      const bimestres = await bimestreService.findActivos();
      set({ bimestres, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al cargar bimestres activos',
        isLoading: false 
      });
    }
  },

  fetchBimestreActual: async () => {
    try {
      const bimestreActual = await bimestreService.findBimestreActual();
      set({ bimestreActual });
      
      // Si no hay un bimestre seleccionado y encontramos el actual, seleccionarlo
      if (!get().bimestreSeleccionado && bimestreActual) {
        set({ bimestreSeleccionado: bimestreActual });
      }
    } catch (error) {
      console.error('Error al obtener bimestre actual:', error);
    }
  },

  seleccionarBimestre: (bimestre: Bimestre | null) => {
    set({ bimestreSeleccionado: bimestre });
  },

  crearBimestre: async (createDto: CreateBimestreDto) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoBimestre = await bimestreService.create(createDto);
      
      // Actualizar la lista de bimestres
      const { bimestres } = get();
      set({ 
        bimestres: [...bimestres, nuevoBimestre],
        isLoading: false 
      });
      
      return nuevoBimestre;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al crear bimestre',
        isLoading: false 
      });
      throw error;
    }
  },

  actualizarBimestre: async (id: number, updateDto: UpdateBimestreDto) => {
    set({ isLoading: true, error: null });
    try {
      const bimestreActualizado = await bimestreService.update(id, updateDto);
      
      // Actualizar en la lista
      const { bimestres, bimestreSeleccionado } = get();
      const bimestresActualizados = bimestres.map(b => 
        b.id === id ? bimestreActualizado : b
      );
      
      set({ 
        bimestres: bimestresActualizados,
        bimestreSeleccionado: bimestreSeleccionado?.id === id ? bimestreActualizado : bimestreSeleccionado,
        isLoading: false 
      });
      
      return bimestreActualizado;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al actualizar bimestre',
        isLoading: false 
      });
      throw error;
    }
  },

  activarBimestre: async (id: number) => {
    try {
      const bimestre = await bimestreService.activar(id);
      
      // Actualizar en la lista
      const { bimestres } = get();
      const bimestresActualizados = bimestres.map(b => 
        b.id === id ? bimestre : b
      );
      
      set({ bimestres: bimestresActualizados });
      return bimestre;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al activar bimestre'
      });
      throw error;
    }
  },

  desactivarBimestre: async (id: number) => {
    try {
      const bimestre = await bimestreService.desactivar(id);
      
      // Actualizar en la lista
      const { bimestres } = get();
      const bimestresActualizados = bimestres.map(b => 
        b.id === id ? bimestre : b
      );
      
      set({ bimestres: bimestresActualizados });
      return bimestre;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al desactivar bimestre'
      });
      throw error;
    }
  },

  eliminarBimestre: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await bimestreService.delete(id);
      
      // Remover de la lista
      const { bimestres, bimestreSeleccionado } = get();
      const bimestresActualizados = bimestres.filter(b => b.id !== id);
      
      set({ 
        bimestres: bimestresActualizados,
        bimestreSeleccionado: bimestreSeleccionado?.id === id ? null : bimestreSeleccionado,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al eliminar bimestre',
        isLoading: false 
      });
      throw error;
    }
  },

  generarBimestresAno: async (anoAcademico: number, fechaInicio: string) => {
    set({ isLoading: true, error: null });
    try {
      const nuevosBimestres = await bimestreService.generarBimestresAno(anoAcademico, fechaInicio);
      
      // Actualizar la lista
      const { bimestres } = get();
      set({ 
        bimestres: [...bimestres, ...nuevosBimestres],
        isLoading: false 
      });
      
      return nuevosBimestres;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error al generar bimestres',
        isLoading: false 
      });
      throw error;
    }
  },

  // Utilidades
  clearError: () => set({ error: null }),

  getFechasBimestre: (bimestre: Bimestre) => {
    return bimestreService.getFechasRango(bimestre.fechaInicio, bimestre.fechaFin);
  },

  getBimestresAno: (ano: number) => {
    const { bimestres } = get();
    return bimestres
      .filter(b => b.anoAcademico === ano)
      .sort((a, b) => a.numeroBimestre - b.numeroBimestre);
  }
}));
