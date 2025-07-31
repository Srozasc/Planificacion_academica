import React, { useState, useEffect } from 'react';
import { useBimestreStore } from '../../store/bimestre.store';
import { CreateBimestreDto, UpdateBimestreDto, Bimestre, bimestreService } from '../../services/bimestre.service';
import { 
  PlusIcon, 
  XMarkIcon, 
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

interface BimestreConfiguradorProps {
  isOpen: boolean;
  onClose: () => void;
}

const BimestreConfigurador: React.FC<BimestreConfiguradorProps> = ({ isOpen, onClose }) => {  const {
    bimestres,
    isLoading,
    error,
    fetchBimestres,
    crearBimestre,
    actualizarBimestre,
    eliminarBimestre,
    eliminarBimestreConEventos,
    verificarDependencias,
    clearError
  } = useBimestreStore();
  const [formData, setFormData] = useState<CreateBimestreDto>({
    nombre: `Bimestre ${new Date().getFullYear()} 1`,
    fechaInicio: '',
    fechaFin: '',
    // Campos para rangos de fechas de pago
    fechaPago1Inicio: '',
    fechaPago1Fin: '',
    fechaPago2Inicio: '',
    fechaPago2Fin: '',
    anoAcademico: new Date().getFullYear(),
    numeroBimestre: 1,
    descripcion: ''
  });

  const [modoEdicion, setModoEdicion] = useState<{ activo: boolean; bimestre: Bimestre | null }>({
    activo: false,
    bimestre: null
  });

  const [confirmacionEliminar, setConfirmacionEliminar] = useState<number | null>(null);
  const [confirmacionEliminarConEventos, setConfirmacionEliminarConEventos] = useState<{
    bimestreId: number | null;
    eventCount: number;
    tables: string[];
  }>({ bimestreId: null, eventCount: 0, tables: [] });
  const [verificandoDependencias, setVerificandoDependencias] = useState(false);
  const [advertenciaSolapamiento, setAdvertenciaSolapamiento] = useState<{
    mostrar: boolean;
    mensaje: string;
    bimestreConflicto?: Bimestre;
  }>({ mostrar: false, mensaje: '' });
  
  const [erroresRangosFechas, setErroresRangosFechas] = useState<{
    rangoPago1: string;
    rangoPago2: string;
  }>({ rangoPago1: '', rangoPago2: '' });

  // Estados para carga masiva
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [resultadoCarga, setResultadoCarga] = useState<{
    mostrar: boolean;
    exito: boolean;
    mensaje: string;
    detalles?: any;
  }>({ mostrar: false, exito: false, mensaje: '' });

  useEffect(() => {
    if (isOpen) {
      fetchBimestres();
      clearError();
    }
  }, [isOpen, fetchBimestres, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: name === 'anoAcademico' || name === 'numeroBimestre' ? parseInt(value) : value
    };
    
    // Generar nombre automáticamente cuando cambien año académico o número de bimestre
    if (name === 'anoAcademico' || name === 'numeroBimestre') {
      const anoAcademico = name === 'anoAcademico' ? parseInt(value) : formData.anoAcademico;
      const numeroBimestre = name === 'numeroBimestre' ? parseInt(value) : formData.numeroBimestre;
      updatedFormData.nombre = `Bimestre ${anoAcademico} ${numeroBimestre}`;
    }
    
    setFormData(updatedFormData);
    
    // Validar solapamiento cuando cambien las fechas o el año académico
    if (name === 'fechaInicio' || name === 'fechaFin' || name === 'anoAcademico') {
      validarSolapamientoEnTiempoReal(updatedFormData);
    }
    
    // Validar rangos de fechas de pago en tiempo real
    if (name.includes('fechaPago')) {
      validarRangosFechasPago(updatedFormData);
    }
  };

  const validarSolapamientoEnTiempoReal = (data: CreateBimestreDto) => {
    // Solo validar si tenemos ambas fechas y año académico
    if (!data.fechaInicio || !data.fechaFin || !data.anoAcademico) {
      setAdvertenciaSolapamiento({ mostrar: false, mensaje: '' });
      return;
    }

    // Validar que fecha inicio sea menor que fecha fin
    if (new Date(data.fechaInicio) >= new Date(data.fechaFin)) {
      setAdvertenciaSolapamiento({ 
        mostrar: true, 
        mensaje: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
      return;
    }

    const excludeId = modoEdicion.activo ? modoEdicion.bimestre?.id : undefined;
    const resultado = bimestreService.validarSolapamientoFechas(
      data.fechaInicio,
      data.fechaFin,
      data.anoAcademico,
      bimestres,
      excludeId
    );

    if (resultado.hasOverlap && resultado.conflictingBimestre) {
      const fechaInicio = parseLocalDate(resultado.conflictingBimestre.fechaInicio).toLocaleDateString('es-ES');
        const fechaFin = parseLocalDate(resultado.conflictingBimestre.fechaFin).toLocaleDateString('es-ES');
      setAdvertenciaSolapamiento({
        mostrar: true,
        mensaje: `Las fechas se solapan con "${resultado.conflictingBimestre.nombre}" (${fechaInicio} - ${fechaFin})`,
        bimestreConflicto: resultado.conflictingBimestre
      });
    } else {
      setAdvertenciaSolapamiento({ mostrar: false, mensaje: '' });
    }
  };
  
  const validarRangosFechasPago = (data: CreateBimestreDto) => {
    const errores = { rangoPago1: '', rangoPago2: '' };
    
    // Validar rango de pago 1
    if (data.fechaPago1Inicio && data.fechaPago1Fin) {
      if (new Date(data.fechaPago1Inicio) > new Date(data.fechaPago1Fin)) {
        errores.rangoPago1 = 'La fecha de inicio debe ser anterior o igual a la fecha de fin';
      }
    }
    
    // Validar rango de pago 2
    if (data.fechaPago2Inicio && data.fechaPago2Fin) {
      if (new Date(data.fechaPago2Inicio) > new Date(data.fechaPago2Fin)) {
        errores.rangoPago2 = 'La fecha de inicio debe ser anterior o igual a la fecha de fin';
      }
    }
    
    setErroresRangosFechas(errores);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar rangos de fechas antes del envío
    validarRangosFechasPago(formData);
    
    // Prevenir envío si hay errores de validación
    if (advertenciaSolapamiento.mostrar || erroresRangosFechas.rangoPago1 || erroresRangosFechas.rangoPago2) {
      return;
    }
    
    try {
      clearError(); // Limpiar errores previos
      
      if (modoEdicion.activo && modoEdicion.bimestre) {
        // Actualizar bimestre existente
        await actualizarBimestre(modoEdicion.bimestre.id, formData);
        setModoEdicion({ activo: false, bimestre: null });
      } else {
        // Crear nuevo bimestre
        await crearBimestre(formData);
      }
      
      // Limpiar formulario y advertencias
      const currentYear = new Date().getFullYear();
      setFormData({
        nombre: `Bimestre ${currentYear} 1`,
        fechaInicio: '',
        fechaFin: '',
        fechaPago1Inicio: '',
        fechaPago1Fin: '',
        fechaPago2Inicio: '',
        fechaPago2Fin: '',
        anoAcademico: currentYear,
        numeroBimestre: 1,
        descripcion: ''
      });
      setAdvertenciaSolapamiento({ mostrar: false, mensaje: '' });
    } catch (error) {
      console.error('Error al procesar bimestre:', error);
    }
  };

  // Función para parsear fechas sin problemas de zona horaria
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  };

  // Función para formatear fecha para input type="date"
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = parseLocalDate(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al formatear fecha para input:', error);
      return '';
    }
  };

  const handleEditarBimestre = (bimestre: Bimestre) => {
    setFormData({
      nombre: `Bimestre ${bimestre.anoAcademico} ${bimestre.numeroBimestre}`,
      fechaInicio: formatDateForInput(bimestre.fechaInicio),
      fechaFin: formatDateForInput(bimestre.fechaFin),
      // Campos para rangos de fechas de pago
      fechaPago1Inicio: bimestre.fechaPago1Inicio ? formatDateForInput(bimestre.fechaPago1Inicio) : '',
      fechaPago1Fin: bimestre.fechaPago1Fin ? formatDateForInput(bimestre.fechaPago1Fin) : '',
      fechaPago2Inicio: bimestre.fechaPago2Inicio ? formatDateForInput(bimestre.fechaPago2Inicio) : '',
      fechaPago2Fin: bimestre.fechaPago2Fin ? formatDateForInput(bimestre.fechaPago2Fin) : '',
      anoAcademico: bimestre.anoAcademico,
      numeroBimestre: bimestre.numeroBimestre,
      descripcion: bimestre.descripcion || ''
    });
    setModoEdicion({ activo: true, bimestre });
  };
  const handleCancelarEdicion = () => {
    setModoEdicion({ activo: false, bimestre: null });
    const currentYear = new Date().getFullYear();
    setFormData({
      nombre: `Bimestre ${currentYear} 1`,
      fechaInicio: '',
      fechaFin: '',
      // Campos para rangos de fechas de pago
      fechaPago1Inicio: '',
      fechaPago1Fin: '',
      fechaPago2Inicio: '',
      fechaPago2Fin: '',
      anoAcademico: currentYear,
      numeroBimestre: 1,
      descripcion: ''
    });
    setAdvertenciaSolapamiento({ mostrar: false, mensaje: '' });
    setErroresRangosFechas({ rangoPago1: '', rangoPago2: '' });
  };

  const handleEliminarBimestre = async (id: number) => {
    try {
      setVerificandoDependencias(true);
      clearError();
      
      // Verificar si hay eventos asociados
      const dependencies = await verificarDependencias(id);
      
      if (dependencies.hasEvents) {
        // Mostrar modal de confirmación con eventos
        setConfirmacionEliminarConEventos({
          bimestreId: id,
          eventCount: dependencies.eventCount,
          tables: dependencies.tables
        });
        setConfirmacionEliminar(null);
      } else {
        // Eliminar directamente si no hay eventos
        await eliminarBimestre(id);
        setConfirmacionEliminar(null);
      }
    } catch (error) {
      console.error('Error al verificar dependencias:', error);
    } finally {
      setVerificandoDependencias(false);
    }
  };

  const handleEliminarBimestreConEventos = async () => {
    if (!confirmacionEliminarConEventos.bimestreId) return;
    
    try {
      clearError();
      await eliminarBimestreConEventos(confirmacionEliminarConEventos.bimestreId);
      setConfirmacionEliminarConEventos({ bimestreId: null, eventCount: 0, tables: [] });
    } catch (error) {
      console.error('Error al eliminar bimestre con eventos:', error);
    }
  };

  const handleCancelarEliminacionConEventos = () => {
    setConfirmacionEliminarConEventos({ bimestreId: null, eventCount: 0, tables: [] });
  };

  // Funciones para carga masiva
  const handleSeleccionarArchivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar que sea un archivo Excel
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setResultadoCarga({
          mostrar: true,
          exito: false,
          mensaje: 'Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)'
        });
        return;
      }
      
      setArchivoSeleccionado(file);
      setResultadoCarga({ mostrar: false, exito: false, mensaje: '' });
    }
  };

  const handleCargaMasiva = async () => {
    if (!archivoSeleccionado) {
      setResultadoCarga({
        mostrar: true,
        exito: false,
        mensaje: 'Debe seleccionar un archivo Excel'
      });
      return;
    }

    setCargandoArchivo(true);
    setResultadoCarga({ mostrar: false, exito: false, mensaje: '' });

    try {
      const result = await bimestreService.cargaMasiva(archivoSeleccionado);
      
      const bimestresCreados = result?.bimestresCreados || 0;
      const años = result?.años || [];
      
      setResultadoCarga({
        mostrar: true,
        exito: true,
        mensaje: `Se cargaron exitosamente ${bimestresCreados} bimestres${años.length > 0 ? ` para los años: ${años.join(', ')}` : ''}`
      });
      
      // Limpiar archivo seleccionado
      setArchivoSeleccionado(null);
      const fileInput = document.getElementById('archivo-excel') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Recargar bimestres
      await fetchBimestres();
    } catch (error: any) {
      console.error('Error en carga masiva:', error);
      
      let mensajeError = 'Error en la carga masiva';
      let detallesError = null;
      
      if (error.response?.data?.message) {
        const mensaje = error.response.data.message;
        
        // Personalizar mensajes específicos para hacerlos más amigables
        if (mensaje.includes('Ya existen bimestres para el año académico')) {
          mensajeError = mensaje; // Usar el mensaje exacto del backend
        } else if (mensaje.includes('El archivo debe contener exactamente 5 bimestres')) {
          mensajeError = '📋 El archivo Excel debe contener exactamente 5 bimestres. Por favor, verifique que su archivo tenga la estructura correcta.';
        } else if (mensaje.includes('Encabezado incorrecto')) {
          mensajeError = '📊 El formato del archivo Excel no es correcto. Por favor, descargue la plantilla y asegúrese de usar los encabezados exactos.';
        } else if (mensaje.includes('Formato de fecha inválido')) {
          mensajeError = '📅 Hay fechas con formato incorrecto en el archivo. Use el formato DD-MM-YYYY (ejemplo: 15-03-2025).';
        } else {
          mensajeError = mensaje;
        }
        
        // No mostrar detalles técnicos para errores de bimestres existentes
        if (!mensaje.includes('Ya existen bimestres para el año académico')) {
          detallesError = error.response.data.errors;
        }
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      setResultadoCarga({
        mostrar: true,
        exito: false,
        mensaje: mensajeError,
        detalles: detallesError
      });
    } finally {
      setCargandoArchivo(false);
    }
  };

  const handleDescargarPlantilla = () => {
    // Crear datos de ejemplo para la plantilla
    const plantillaData = [
      ['Número', 'Año', 'Fecha_Inicio', 'Fecha_Fin', 'Pago1_Inicio', 'Pago1_Fin', 'Pago2_Inicio', 'Pago2_Fin', 'Descripción'],
      [1, 2025, '11-03-2025', '11-05-2025', '03-03-2025', '30-04-2025', '01-05-2025', '14-05-2025', 'Primer Bimestre'],
      [2, 2025, '20-05-2025', '20-07-2025', '15-05-2025', '30-06-2025', '01-07-2025', '31-07-2025', 'Segundo Bimestre'],
      [3, 2025, '12-08-2025', '12-10-2025', '01-08-2025', '30-09-2025', '01-10-2025', '15-10-2025', 'Tercer Bimestre'],
      [4, 2025, '21-10-2025', '24-12-2025', '16-10-2025', '30-11-2025', '01-12-2025', '31-12-2025', 'Cuarto Bimestre'],
      [5, 2026, '06-01-2026', '01-03-2026', '01-01-2026', '28-02-2026', '01-03-2026', '04-03-2026', 'Quinto Bimestre']
    ];
    
    // Crear CSV
    const csvContent = plantillaData.map(row => row.join('\t')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_bimestres.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuración de Bimestres
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>          )}

          {/* Carga masiva desde Excel */}
          <div className="border rounded-lg p-6 bg-blue-50">
            <div className="flex items-center space-x-2 mb-4">
              <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Carga Masiva desde Excel
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Sube un archivo Excel con múltiples bimestres para crear varios a la vez.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      id="archivo-excel"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleSeleccionarArchivo}
                      className="hidden"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => document.getElementById('archivo-excel')?.click()}
                      disabled={cargandoArchivo}
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      {archivoSeleccionado ? 'Cambiar Archivo' : 'Seleccionar Archivo Excel'}
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                    onClick={handleDescargarPlantilla}
                  >
                    Descargar Plantilla
                  </button>
                </div>
                
                {archivoSeleccionado && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Archivo seleccionado:</span> {archivoSeleccionado.name}
                    </p>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCargaMasiva}
                      disabled={cargandoArchivo}
                    >
                      {cargandoArchivo ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Procesando...
                        </>
                      ) : (
                        'Cargar Bimestres'
                      )}
                    </button>
                  </div>
                )}
                
                {resultadoCarga.mostrar && (
                  <div className={`p-4 rounded-md ${
                    resultadoCarga.exito 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        {resultadoCarga.exito ? (
                          <CheckIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className={`text-sm font-medium whitespace-pre-line ${
                          resultadoCarga.exito ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {resultadoCarga.mensaje}
                        </div>
                        {resultadoCarga.detalles && !resultadoCarga.mensaje.includes('Ya existen bimestres para el año académico') && (
                          <div className="mt-2 text-sm text-gray-600">
                            <pre className="whitespace-pre-wrap">
                              {typeof resultadoCarga.detalles === 'string' 
                                ? resultadoCarga.detalles 
                                : JSON.stringify(resultadoCarga.detalles, null, 2)
                              }
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Creación manual */}
          <div className="border rounded-lg p-6">            <div className="flex items-center space-x-2 mb-4">
              {modoEdicion.activo ? (
                <PencilIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <PlusIcon className="h-5 w-5 text-green-600" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                {modoEdicion.activo ? 'Editar Bimestre' : 'Crear Bimestre Manual'}
              </h3>
              {modoEdicion.activo && (
                <button
                  type="button"
                  onClick={handleCancelarEdicion}
                  className="ml-auto text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Bimestre (Generado automáticamente)
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Bimestre
                  </label>
                  <input
                    type="number"
                    name="numeroBimestre"
                    value={formData.numeroBimestre}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Año Académico
                  </label>
                  <input
                    type="number"
                    name="anoAcademico"
                    value={formData.anoAcademico}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    name="fechaInicio"
                    value={formData.fechaInicio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    name="fechaFin"
                    value={formData.fechaFin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Rangos de Fechas de Pago */}
              <div className="space-y-4">
                {/* Rango de Pago 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago 1 (Rango)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Desde</label>
                      <input
                        type="date"
                        name="fechaPago1Inicio"
                        value={formData.fechaPago1Inicio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                      <input
                        type="date"
                        name="fechaPago1Fin"
                        value={formData.fechaPago1Fin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {erroresRangosFechas.rangoPago1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {erroresRangosFechas.rangoPago1}
                    </p>
                  )}
                </div>
                
                {/* Rango de Pago 2 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Pago 2 (Rango)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Desde</label>
                      <input
                        type="date"
                        name="fechaPago2Inicio"
                        value={formData.fechaPago2Inicio}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                      <input
                        type="date"
                        name="fechaPago2Fin"
                        value={formData.fechaPago2Fin}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  {erroresRangosFechas.rangoPago2 && (
                    <p className="text-red-500 text-sm mt-1">
                      {erroresRangosFechas.rangoPago2}
                    </p>
                  )}
                </div>
              </div>              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Descripción del bimestre..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Advertencia de solapamiento */}
              {advertenciaSolapamiento.mostrar && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Conflicto de fechas detectado
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      {advertenciaSolapamiento.mensaje}
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Por favor, ajusta las fechas para evitar el solapamiento antes de continuar.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                {modoEdicion.activo && (
                  <button
                    type="button"
                    onClick={handleCancelarEdicion}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                )}                <button
                  type="submit"
                  disabled={isLoading || advertenciaSolapamiento.mostrar}
                  className={`text-white px-6 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    modoEdicion.activo 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } ${advertenciaSolapamiento.mostrar ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {modoEdicion.activo ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )}
                  <span>{modoEdicion.activo ? 'Actualizar Bimestre' : 'Crear Bimestre'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Lista de bimestres existentes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Bimestres Configurados
            </h3>
            {bimestres.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay bimestres configurados aún.
              </p>
            ) : (              <div className="space-y-2 max-h-60 overflow-y-auto">
                {bimestres.map((bimestre) => (
                  <div
                    key={bimestre.id}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      modoEdicion.activo && modoEdicion.bimestre?.id === bimestre.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {bimestre.nombre}
                      </div>
                      <div className="text-sm text-gray-600">
                        {parseLocalDate(bimestre.fechaInicio).toLocaleDateString('es-ES')} - {' '}
                {parseLocalDate(bimestre.fechaFin).toLocaleDateString('es-ES')} • Año {bimestre.anoAcademico} • Bimestre {bimestre.numeroBimestre}
                      </div>
                      {bimestre.descripcion && (
                        <div className="text-sm text-gray-500 mt-1">
                          {bimestre.descripcion}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          bimestre.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {bimestre.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditarBimestre(bimestre)}
                          disabled={isLoading}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded disabled:opacity-50"
                          title="Editar bimestre"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        {confirmacionEliminar === bimestre.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEliminarBimestre(bimestre.id)}
                              disabled={isLoading || verificandoDependencias}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50"
                              title="Confirmar eliminación"
                            >
                              {verificandoDependencias ? (
                                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <CheckIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmacionEliminar(null)}
                              disabled={isLoading || verificandoDependencias}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50"
                              title="Cancelar eliminación"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmacionEliminar(bimestre.id)}
                            disabled={isLoading || verificandoDependencias}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded disabled:opacity-50"
                            title="Eliminar bimestre"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación para eliminación con eventos */}
      {confirmacionEliminarConEventos.bimestreId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Eliminar Bimestre con Eventos
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Este bimestre tiene <strong>{confirmacionEliminarConEventos.eventCount} eventos asociados</strong> en las siguientes tablas:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
                {confirmacionEliminarConEventos.tables.map((table, index) => (
                  <li key={index} className="mb-1">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{table}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Advertencia:</strong> Si continúa, se eliminarán primero todos los eventos asociados y luego el bimestre. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelarEliminacionConEventos}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarBimestreConEventos}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                <span>Eliminar Todo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BimestreConfigurador;
