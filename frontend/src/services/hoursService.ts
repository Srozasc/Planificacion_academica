import apiClient from './apiClient';
import { extractSubjectCodes } from '../utils/subjectCodeExtractor';
import { getBimestreIdFromNavbar } from '../utils/bimestreUtils';

export interface HoursDetail {
  acronym: string;
  code: string;
  hours: number;
  subject?: string;
  subjectCount?: number;
}

export interface ADOLHoursDetail {
  title: string;
  totalHours: number;
  eventCount: number;
  hours?: number;
}

export interface OptativasHoursDetail {
  asignatura: string;
  plan: string;
  hours: number;
  subject?: string;
}

export interface HoursResponse {
  totalHours: number;
  details: HoursDetail[];
}

export interface ADOLHoursResponse {
  totalHours: number;
  details: ADOLHoursDetail[];
}

export interface OptativasHoursResponse {
  totalHours: number;
  details: OptativasHoursDetail[];
}

export interface EventHoursData {
  totalHours: number;
  eventCount: number;
  details: HoursDetail[];
  codes: string[];
}

export interface EventPair {
  acronym: string;
  plan: string;
}

/**
 * Extrae planes únicos de una lista de eventos
 */
function extractUniquePlans(events: any[]): string[] {
  const plans = new Set<string>();
  
  events.forEach(event => {
    // Obtener plan desde extendedProps (plan_code, plan) o desde título para eventos ADOL
    const planText = event.extendedProps?.plan || 
      event.extendedProps?.plan_code || 
      (!event.extendedProps?.plan_code && event.title?.startsWith('ADOL') ? 'ADOL' : '');
    
    if (planText && planText.trim()) {
      plans.add(planText.trim());
    }
  });
  
  return Array.from(plans);
}



/**
 * Determina el tipo de eventos basándose en sus títulos
 */
function getEventType(events: any[]): 'asignaturas' | 'optativas' | 'adol' {
  console.log('🔍 getEventType - Analizando eventos:', events.length);
  
  if (events.length === 0) {
    console.log('🔍 getEventType - Sin eventos, retornando asignaturas');
    return 'asignaturas';
  }
  
  // Verificar si hay eventos de tipo Optativas
  const hasOptativas = events.some(event => {
    const title = event.title || '';
    const result = title.includes('CCG') || title.includes('OPTATIVA') || 
           (event.extendedProps?.plan && event.extendedProps.plan.includes('CCG'));
    if (result) console.log('🔍 getEventType - Evento optativa encontrado:', title);
    return result;
  });
  
  if (hasOptativas) {
    console.log('🔍 getEventType - Tipo detectado: optativas');
    return 'optativas';
  }
  
  // Verificar si hay eventos de tipo ADOL
  const hasADOL = events.some(event => {
    const title = event.title || '';
    const startsWithADOL = title.startsWith('ADOL');
    const includesADOL = title.includes('ADOL');
    const result = startsWithADOL || includesADOL;
    console.log('🔍 getEventType - Analizando evento:', { title, startsWithADOL, includesADOL, result });
    return result;
  });
  
  if (hasADOL) {
    console.log('🔍 getEventType - Tipo detectado: adol');
    return 'adol';
  }
  
  console.log('🔍 getEventType - Tipo detectado: asignaturas (por defecto)');
  return 'asignaturas';
}

/**
 * Obtiene las horas totales de una lista de eventos basándose en sus códigos de asignatura
 */
export async function getEventsTotalHours(events: any[]): Promise<EventHoursData> {
  console.log('🔍 getEventsTotalHours - INICIO - Eventos recibidos:', events.length);
  
  if (!events || events.length === 0) {
    console.log('🔍 getEventsTotalHours - Sin eventos, retornando 0');
    return {
      totalHours: 0,
      eventCount: 0,
      details: [],
      codes: []
    };
  }

  try {
    console.log('🔍 getEventsTotalHours - Procesando eventos:', events.map(e => ({ id: e.id, title: e.title })));
    
    // Contar eventos por par (acronym, plan)
    const pairCounts = new Map<string, { pair: EventPair, count: number }>();
    
    events.forEach(event => {
      // Extraer código de asignatura del título
      const title = event.title || '';
      console.log('🔍 getEventsTotalHours - Procesando evento:', { title, extendedProps: event.extendedProps });
      const codes = extractSubjectCodes([title]);
      console.log('🔍 getEventsTotalHours - Códigos extraídos:', codes);
      
      // Obtener plan desde extendedProps o título para ADOL
      const planText = event.extendedProps?.plan || 
        event.extendedProps?.plan_code || 
        (!event.extendedProps?.plan_code && title.startsWith('ADOL') ? 'ADOL' : '');
      
      // Contar cada par (código, plan) por evento
      codes.forEach(code => {
        if (planText && planText.trim()) {
          const pairKey = `${code}|${planText.trim()}`;
          if (pairCounts.has(pairKey)) {
            pairCounts.get(pairKey)!.count++;
          } else {
            pairCounts.set(pairKey, {
              pair: {
                acronym: code,
                plan: planText.trim()
              },
              count: 1
            });
          }
        }
      });
    });
    
    // Extraer pares únicos para la consulta
    const eventPairs = Array.from(pairCounts.values()).map(item => item.pair);
    
    // Extraer códigos únicos para compatibilidad
    const codes = [...new Set(eventPairs.map(pair => pair.acronym))];
    
    if (eventPairs.length === 0) {
      return {
        totalHours: 0,
        eventCount: events.length,
        details: [],
        codes: []
      };
    }
    
    // Determinar el tipo de eventos
    const eventType = getEventType(events);
    console.log('🔍 getEventsTotalHours - Tipo de evento detectado:', eventType);
    console.log('🔍 getEventsTotalHours - Eventos para análisis:', events.map(e => ({ id: e.id, title: e.title })));
    
    // Obtener bimestre ID del navbar
    const bimestreId = getBimestreIdFromNavbar();
    console.log('🔍 getEventsTotalHours - Bimestre ID:', bimestreId);
    
    // Consultar horas según el tipo de evento
    let params: any = {};
    let endpoint = '/scheduling/hours-by-codes';
    
    if (eventType === 'adol') {
      // Para ADOL, enviar títulos de eventos
      const eventTitles = events.map(event => event.title).filter(title => title);
      params.eventTitles = JSON.stringify(eventTitles);
      endpoint = '/scheduling/hours-by-adol-events';
    } else {
      // Para asignaturas y optativas, enviar pares
      params.eventPairs = JSON.stringify(eventPairs);
      if (eventType === 'optativas') {
        endpoint = '/scheduling/hours-by-optativas-codes';
      }
    }
    
    // Agregar bimestreId si está disponible
    if (bimestreId) {
      params.bimestreId = bimestreId;
    }
    
    // Procesar respuesta según el tipo de evento
    let totalHours = 0;
    const adjustedDetails: HoursDetail[] = [];
    
    if (eventType === 'adol') {
      // Para ADOL, usar el tipo específico
      const adolResponse = await apiClient.get<ADOLHoursResponse>(endpoint, {
        params
      });
      
      adolResponse.data.details.forEach(detail => {
        totalHours += detail.totalHours || detail.hours || 0;
        adjustedDetails.push({
          acronym: detail.title,
          code: 'ADOL',
          hours: detail.totalHours || detail.hours || 0,
          subject: detail.title,
          subjectCount: detail.eventCount || 1
        });
      });
    } else if (eventType === 'optativas') {
      // Para optativas, usar el tipo específico
      const optativasResponse = await apiClient.get<OptativasHoursResponse>(endpoint, {
        params
      });
      
      optativasResponse.data.details.forEach(detail => {
        const pairKey = `${detail.asignatura}|${detail.plan}`;
        const pairData = Array.from(pairCounts.values()).find(
          item => `${item.pair.acronym}|${item.pair.plan}` === pairKey
        );
        
        const eventCount = pairData ? pairData.count : 1;
        const adjustedHours = detail.hours * eventCount;
        
        totalHours += adjustedHours;
        adjustedDetails.push({
          acronym: detail.asignatura,
          code: detail.plan,
          hours: adjustedHours,
          subject: detail.subject,
          subjectCount: eventCount
        });
      });
    } else {
      // Para asignaturas, usar el tipo original
      const response = await apiClient.get<HoursResponse>(endpoint, {
        params
      });
      
      response.data.details.forEach(detail => {
        const pairKey = `${detail.acronym}|${detail.code}`;
        const pairData = Array.from(pairCounts.values()).find(
          item => `${item.pair.acronym}|${item.pair.plan}` === pairKey
        );
        
        const eventCount = pairData ? pairData.count : 1;
        const adjustedHours = detail.hours * eventCount;
        
        totalHours += adjustedHours;
        adjustedDetails.push({
          acronym: detail.acronym,
          code: detail.code,
          hours: adjustedHours,
          subject: detail.subject,
          subjectCount: eventCount
        });
      });
    }
    
    return {
      totalHours,
      eventCount: events.length,
      details: adjustedDetails,
      codes
    };
  } catch (error) {
    console.error('Error al obtener horas totales de eventos:', error);
    return {
      totalHours: 0,
      eventCount: events.length,
      details: [],
      codes: []
    };
  }
}

/**
 * Obtiene las horas de asignaturas por códigos específicos
 */
export async function getHoursByCodes(codes: string[]): Promise<HoursResponse> {
  if (codes.length === 0) {
    return {
      totalHours: 0,
      details: []
    };
  }
  
  try {
    // Obtener bimestre ID del navbar
    const bimestreId = getBimestreIdFromNavbar();
    
    const params: any = {
      codes: codes.join(',')
    };
    
    // Agregar bimestreId si está disponible
    if (bimestreId) {
      params.bimestreId = bimestreId;
    }
    
    const response = await apiClient.get<HoursResponse>('/scheduling/hours-by-codes', {
      params
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener horas por códigos:', error);
    throw error;
  }
}